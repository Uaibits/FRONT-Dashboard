import {Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {Subject, takeUntil, interval, switchMap, tap, catchError, of} from 'rxjs';
import {DashboardFiltersComponent} from './filters/dashboard-filters.component';
import {DashboardMetricCardComponent} from './widgets/dashboard-metric-card.component';
import {DashboardTableComponent} from './widgets/dashboard-table.component';
import {DashboardChartComponent} from './widgets/dashboard-chart/dashboard-chart.component';
import {DashboardService} from '../../services/dashboard.service';
import {ToastService} from '../toast/toast.service';
import {Utils} from '../../services/utils.service';
import {DashboardListComponent} from './dashboard-list/dashboard-list.component';

interface WidgetData {
  [widgetKey: string]: any;
}

interface DashboardState {
  loading: boolean;
  backgroundRefreshing: boolean;
  lastRefresh: Date | null;
  error: string | null;
}

@Component({
  selector: 'app-dashboard-view',
  imports: [
    CommonModule,
    FormsModule,
    DashboardFiltersComponent,
    DashboardMetricCardComponent,
    DashboardTableComponent,
    DashboardChartComponent,
    DashboardListComponent
  ],
  templateUrl: './dashboard-view.component.html',
  standalone: true,
  styleUrl: './dashboard-view.component.scss'
})
export class DashboardViewComponent implements OnInit, OnDestroy, OnChanges {
  private destroy$ = new Subject<void>();
  private autoRefresh$ = new Subject<void>();

  @Input({required: true}) dashboardKey!: string;
  @Input() viewHeight: number | null = null;
  @Input() invitationToken: string | null = null;

  dashboard: any = null;
  structure: any = null;

  // Estado centralizado
  state: DashboardState = {
    loading: false,
    backgroundRefreshing: false,
    lastRefresh: null,
    error: null
  };

  // Dados centralizados
  widgetsData: WidgetData = {};
  widgetsErrors: { [key: string]: string } = {};

  filterValues: { [key: string]: any } = {};
  sidebarCollapsed: boolean = false;
  filtersInitialized: boolean = false;
  accessibleDashboards: any[] = [];

  // Controle de visualização
  showDashboardList: boolean = false;

  // Configurações de auto-refresh
  protected autoRefreshInterval: number = 60 // segundos (0 = desabilitado)
  protected autoRefreshEnabled: boolean = true;

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private toast: ToastService
  ) {
  }

  ngOnInit() {
    this.loadDashboardStructure();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.autoRefresh$.next();
    this.autoRefresh$.complete();
    this.autoRefresh$.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dashboardKey'] && !changes['dashboardKey'].firstChange) {
      this.showDashboardList = false;
      this.loadDashboardStructure();
    }
  }

  /**
   * Verifica se deve mostrar o botão de voltar/listar dashboards
   */
  get canShowDashboardList(): boolean {
    return !this.invitationToken;
  }

  /**
   * Configura o sistema de auto-refresh inteligente
   */
  private setupAutoRefresh() {
    // Observable que escuta o intervalo configurado
    this.autoRefresh$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          if (!this.autoRefreshEnabled || this.autoRefreshInterval <= 0) {
            return of(null);
          }

          return interval(this.autoRefreshInterval * 1000).pipe(
            tap(() => this.refreshInBackground()),
            catchError(error => {
              console.error('Erro no auto-refresh:', error);
              return of(null);
            })
          );
        })
      )
      .subscribe();
  }

  /**
   * Inicia o auto-refresh
   */
  startAutoRefresh(intervalSeconds: number) {
    this.autoRefreshInterval = intervalSeconds;
    this.autoRefreshEnabled = true;
    this.autoRefresh$.next();
  }

  /**
   * Para o auto-refresh
   */
  stopAutoRefresh() {
    this.autoRefreshEnabled = false;
    this.autoRefresh$.next();
  }

  /**
   * Refresh em background (sem loading visível)
   */
  private async refreshInBackground() {
    if (!this.canLoadData() || this.state.loading) return;

    this.state.backgroundRefreshing = true;

    try {
      await this.loadDashboardDataSilent();
      this.state.lastRefresh = new Date();
    } catch (error) {
      console.error('Erro no refresh em background:', error);
    } finally {
      this.state.backgroundRefreshing = false;
    }
  }

  /**
   * Carrega apenas a estrutura do dashboard (sem dados)
   */
  async loadDashboardStructure() {
    this.state.loading = true;
    this.state.error = null;

    try {
      const response = await this.dashboardService.getDashboard(this.dashboardKey, this.invitationToken);
      this.dashboard = response.data?.dashboard;
      this.structure = response.data;

      if (!this.dashboard) {
        this.toast.error('Dashboard não encontrado');
        return;
      }

      // Configura auto-refresh se definido no dashboard
      if (this.dashboard) {
        this.startAutoRefresh(this.autoRefreshInterval);
      }

      this.initializeFilters();

      // Carrega dados apenas se não houver filtros obrigatórios ou se todos estiverem preenchidos
      if (this.canLoadData()) {
        await this.loadAllWidgetsData();
      }
    } catch (error) {
      this.state.error = Utils.getErrorMessage(error, 'Erro ao carregar dashboard');
      this.toast.error(this.state.error);
    } finally {
      this.state.loading = false;
    }
  }

  /**
   * Carrega dados de TODOS os widgets de uma vez
   * Esta é a otimização principal - uma requisição para todos os widgets
   */
  async loadAllWidgetsData() {
    if (!this.canLoadData() || !this.structure) {
      return;
    }

    this.state.loading = true;
    this.state.error = null;
    this.widgetsErrors = {};

    try {
      // Carrega dados de todas as seções
      const sectionsPromises = this.structure.sections.map((section: any) =>
        this.loadSectionData(section.section.id)
      );

      await Promise.all(sectionsPromises);
      this.state.lastRefresh = new Date();

    } catch (error) {
      this.state.error = Utils.getErrorMessage(error, 'Erro ao carregar dados do dashboard');
      this.toast.error(this.state.error);
    } finally {
      this.state.loading = false;
    }
  }

  /**
   * Carrega dados silenciosamente (sem loading visual)
   */
  private async loadDashboardDataSilent() {
    if (!this.canLoadData()) {
      return;
    }

    try {
      const sectionsPromises = this.structure.sections.map((section: any) =>
        this.loadSectionData(section.section.id)
      );

      await Promise.all(sectionsPromises);
    } catch (error) {
      console.error('Erro no carregamento silencioso:', error);
      // Não mostra toast para não incomodar o usuário
    }
  }

  /**
   * Carrega dados de uma seção específica
   */
  private async loadSectionData(sectionId: number) {
    try {
      const response = await this.dashboardService.getSectionData(
        sectionId,
        this.filterValues,
        this.invitationToken
      );

      if (response.success && response.data) {
        // Mescla os dados dos widgets
        const widgetsData = response.data.widgets || {};

        Object.keys(widgetsData).forEach(widgetKey => {
          this.widgetsData[widgetKey] = Utils.keysToUpperCase(widgetsData[widgetKey].data.data);
        });

        // Armazena erros se houver
        const errors = response.data.errors || {};
        Object.keys(errors).forEach(widgetKey => {
          this.widgetsErrors[widgetKey] = errors[widgetKey];
        });
      }
    } catch (error) {
      console.error(`Erro ao carregar seção ${sectionId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém dados de um widget específico
   */
  getWidgetData(widgetKey: string): any {
    return this.widgetsData[widgetKey] || null;
  }

  /**
   * Verifica se um widget tem erro
   */
  getWidgetError(widgetKey: string): string | null {
    return this.widgetsErrors[widgetKey] || null;
  }

  /**
   * Verifica se um widget está carregando
   */
  isWidgetLoading(widgetKey: string): boolean {
    return this.state.loading && !this.widgetsData[widgetKey];
  }

  /**
   * Inicializa os valores dos filtros com defaults
   */
  initializeFilters() {
    if (this.structure?.filters) {
      const newFilterValues: { [key: string]: any } = {};

      this.structure.filters.forEach((filter: any) => {
        if (!this.filterValues.hasOwnProperty(filter.var_name)) {
          switch (filter.type) {
            case 'text':
            case 'date':
              newFilterValues[filter.var_name] = filter.default_value || '';
              break;
            case 'number':
              newFilterValues[filter.var_name] = filter.default_value ? Number(filter.default_value) : null;
              break;
            case 'boolean':
              newFilterValues[filter.var_name] = Boolean(filter.default_value) || false;
              break;
            case 'select':
            case 'multiselect':
              newFilterValues[filter.var_name] = filter.default_value || null;
              break;
            default:
              newFilterValues[filter.var_name] = filter.default_value || null;
          }
        } else {
          newFilterValues[filter.var_name] = this.filterValues[filter.var_name];
        }
      });

      this.filterValues = newFilterValues;
      this.filtersInitialized = true;
    }
  }

  /**
   * Verifica se pode carregar os dados do dashboard
   */
  canLoadData(): boolean {
    if (!this.structure?.filters || this.structure.filters.length === 0) {
      return true;
    }

    const requiredFilters = this.structure.filters.filter((f: any) => f.required);

    if (requiredFilters.length === 0) {
      return true;
    }

    return requiredFilters.every((filter: any) => {
      const value = this.filterValues[filter.var_name];

      if (filter.type === 'boolean') {
        return value !== null && value !== undefined;
      }

      if (value === null || value === undefined || value === '') {
        return false;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return true;
    });
  }

  /**
   * Retorna os filtros obrigatórios não preenchidos
   */
  getMissingRequiredFilters(): string[] {
    if (!this.structure?.filters) {
      return [];
    }

    const requiredFilters = this.structure.filters.filter((f: any) => f.required);
    const missing: string[] = [];

    requiredFilters.forEach((filter: any) => {
      const value = this.filterValues[filter.var_name];

      if (filter.type === 'boolean') {
        if (value === null || value === undefined) {
          missing.push(filter.name);
        }
      } else if (value === null || value === undefined || value === '') {
        missing.push(filter.name);
      } else if (Array.isArray(value) && value.length === 0) {
        missing.push(filter.name);
      }
    });

    return missing;
  }

  /**
   * Aplica os filtros e recarrega os dados
   */
  async applyFilters(newFilterValues?: any) {
    if (newFilterValues) {
      this.filterValues = {...newFilterValues};
    }

    if (!this.canLoadData()) {
      const missing = this.getMissingRequiredFilters();
      this.toast.warning(`Preencha os filtros obrigatórios: ${missing.join(', ')}`);
      return;
    }

    // Limpa dados anteriores
    this.widgetsData = {};
    this.widgetsErrors = {};

    await this.loadAllWidgetsData();
  }

  /**
   * Limpa os filtros e recarrega
   */
  async clearFilters() {
    this.filterValues = {};
    this.widgetsData = {};
    this.widgetsErrors = {};
    this.initializeFilters();

    if (this.canLoadData()) {
      await this.loadAllWidgetsData();
    }
  }

  /**
   * Atualiza o dashboard manualmente
   */
  async refreshDashboard() {
    if (this.canLoadData()) {
      this.widgetsData = {};
      this.widgetsErrors = {};
      await this.loadAllWidgetsData();
      this.toast.success('Dashboard atualizado');
    } else {
      const missing = this.getMissingRequiredFilters();
      this.toast.info(`Preencha os filtros obrigatórios: ${missing.join(', ')}`);
    }
  }

  /**
   * Retorna formatado quanto tempo falta para o próximo refresh
   */
  get getRefreshFormatted(): string {
    if (!this.autoRefreshEnabled || this.autoRefreshInterval <= 0) {
      return '';
    }

    if (this.state.backgroundRefreshing) {
      return 'Atualizando...';
    }

    if (!this.state.lastRefresh) {
      return `Recarregando em ${this.autoRefreshInterval}s`;
    }

    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - this.state.lastRefresh.getTime()) / 1000);
    const secondsLeft = this.autoRefreshInterval - elapsedSeconds;

    if (secondsLeft <= 0) {
      return 'Atualizando em breve...';
    }

    return `Recarregando em ${secondsLeft}s`;
  }

  /**
   * Alterna entre visualização do dashboard e lista
   */
  toggleDashboardList() {
    this.showDashboardList = !this.showDashboardList;
  }

  /**
   * Navega para um dashboard selecionado
   */
  onDashboardSelected(dashboard: any) {
    this.showDashboardList = false;
    this.dashboardKey = dashboard.key;
    this.invitationToken = null;
    this.loadDashboardStructure();
  }

  /**
   * Volta para a lista de dashboards ou tela anterior
   */
  goBack() {
    if (this.canShowDashboardList) {
      this.toggleDashboardList();
    } else {
      this.router.navigate(['/']);
    }
  }

  getMetricWidgets(widgets: any[]) {
    return widgets?.filter(w => w.widget_type === 'metric_card') || [];
  }

  getChartWidgets(widgets: any[]) {
    return widgets?.filter(w => w.widget_type?.startsWith('chart_')) || [];
  }

  getTableWidgets(widgets: any[]) {
    return widgets?.filter(w => w.widget_type === 'table') || [];
  }

  /**
   * Organiza widgets em linhas inteligentes
   */
  organizeWidgetsInRows(charts: any[], tables: any[]): any[][] {
    const widgets = [...charts, ...tables];

    if (!widgets || widgets.length === 0) return [];

    const rows: any[][] = [];
    let currentRow: any[] = [];
    let currentRowWidth = 0;
    const MAX_WIDTH = 12;

    widgets.forEach(widget => {
      const widgetWidth = this.getWidgetWidth(widget);

      if (currentRowWidth + widgetWidth <= MAX_WIDTH) {
        currentRow.push(widget);
        currentRowWidth += widgetWidth;
      } else {
        if (currentRow.length > 0) {
          rows.push(this.distributeWidthInRow(currentRow, MAX_WIDTH));
          currentRow = [];
          currentRowWidth = 0;
        }

        currentRow.push(widget);
        currentRowWidth += widgetWidth;
      }
    });

    if (currentRow.length > 0) {
      rows.push(this.distributeWidthInRow(currentRow, MAX_WIDTH));
    }

    return rows;
  }

  private distributeWidthInRow(widgets: any[], maxWidth: number): any[] {
    const totalCurrentWidth = widgets.reduce((sum, w) => sum + this.getWidgetWidth(w), 0);
    const remainingWidth = maxWidth - totalCurrentWidth;

    if (remainingWidth > 0 && widgets.length > 0) {
      const extraPerWidget = Math.floor(remainingWidth / widgets.length);

      return widgets.map((widget, index) => ({
        ...widget,
        _calculatedWidth: this.getWidgetWidth(widget) + extraPerWidget +
          (index === widgets.length - 1 ? remainingWidth % widgets.length : 0)
      }));
    }

    return widgets.map(widget => ({
      ...widget,
      _calculatedWidth: this.getWidgetWidth(widget)
    }));
  }

  private getWidgetWidth(widget: any): number {
    if (widget.position_config?.width) {
      return widget.position_config.width;
    }

    switch (widget.widget_type) {
      case 'table':
        return 12;
      case 'chart_line':
      case 'chart_bar':
      case 'chart_area':
        return 6;
      case 'chart_pie':
      case 'chart_scatter':
        return 4;
      default:
        return 6;
    }
  }

  getWidgetStyle(widget: any): any {
    const width = widget._calculatedWidth || this.getWidgetWidth(widget);
    const percentage = (width / 12) * 100;

    return {
      'flex': `0 0 ${percentage}%`,
      'max-width': `${percentage}%`,
      'min-width': widget.widget_type === 'table' ? '100%' : '300px'
    };
  }
}
