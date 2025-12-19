import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ContentComponent } from '../../../components/content/content.component';
import { DashboardService } from '../../../services/dashboard.service';
import { ToastService } from '../../../components/toast/toast.service';
import { Utils } from '../../../services/utils.service';
import { DashboardFiltersComponent } from './dashboard-filters.component';
import { DashboardMetricCardComponent } from './dashboard-metric-card.component';
import { DashboardTableComponent } from './dashboard-table.component';
import {DashboardChartComponent} from './dashboard-chart/dashboard-chart.component';

@Component({
  selector: 'app-dashboard-view',
  imports: [
    CommonModule,
    FormsModule,
    ContentComponent,
    DashboardFiltersComponent,
    DashboardMetricCardComponent,
    DashboardTableComponent,
    DashboardChartComponent
  ],
  templateUrl: './dashboard-view.page.html',
  standalone: true,
  styleUrl: './dashboard-view.page.scss'
})
export class DashboardViewPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  dashboardKey: string = '';
  dashboard: any = null;
  structure: any = null;
  loading: boolean = false;
  filterValues: { [key: string]: any } = {};
  sidebarCollapsed: boolean = false;
  filtersInitialized: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dashboardService: DashboardService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.dashboardKey = params['key'];
        this.loadDashboardStructure();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega apenas a estrutura do dashboard (sem dados)
   */
  async loadDashboardStructure() {
    this.loading = true;
    try {
      const response = await this.dashboardService.getDashboard(this.dashboardKey);
      this.dashboard = response.data?.dashboard;
      this.structure = response.data;

      if (!this.dashboard) {
        this.toast.error('Dashboard não encontrado');
        this.router.navigate(['/dashboards']);
        return;
      }

      this.initializeFilters();

      // Carrega dados apenas se não houver filtros obrigatórios ou se todos estiverem preenchidos
      if (this.canLoadData()) {
        await this.loadDashboardData();
      }
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao carregar dashboard'));
      this.router.navigate(['/dashboards']);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Carrega os dados do dashboard com os filtros aplicados
   */
  async loadDashboardData() {
    if (!this.canLoadData()) {
      return;
    }

    this.loading = true;
    try {
      const response = await this.dashboardService.getDashboard(this.dashboardKey,);
      this.structure = response.data;
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao carregar dados do dashboard'));
    } finally {
      this.loading = false;
    }
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
   * Retorna true apenas se todos os filtros obrigatórios estiverem preenchidos
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

      // Para campos boolean, sempre considera válido
      if (filter.type === 'boolean') {
        return value !== null && value !== undefined;
      }

      // Para outros tipos, verifica se tem valor válido
      if (value === null || value === undefined || value === '') {
        return false;
      }

      // Para arrays (multiselect), verifica se tem pelo menos um item
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

    console.log('Filter Values:', this.filterValues);
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
    // Atualiza os valores vindos do filtro
    if (newFilterValues) {
      this.filterValues = { ...newFilterValues };
    }

    if (!this.canLoadData()) {
      const missing = this.getMissingRequiredFilters();
      this.toast.warning(`Preencha os filtros obrigatórios: ${missing.join(', ')}`);
      return;
    }

    await this.loadDashboardData();
  }

  /**
   * Limpa os filtros e recarrega
   */
  async clearFilters() {
    this.filterValues = {};
    this.initializeFilters();

    if (this.canLoadData()) {
      await this.loadDashboardData();
    }
  }

  /**
   * Atualiza o dashboard
   */
  async refreshDashboard() {
    if (this.canLoadData()) {
      await this.loadDashboardData();
    } else {
      const missing = this.getMissingRequiredFilters();
      this.toast.info(`Preencha os filtros obrigatórios para carregar os dados: ${missing.join(', ')}`);
    }
  }

  goBack() {
    this.router.navigate(['/dashboards']);
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
   * Organiza widgets em linhas inteligentes (charts e tables juntos)
   * Tenta preencher o máximo de largura disponível por linha
   */
  organizeWidgetsInRows(charts: any[], table: any[]): any[][] {

    const widgets = [...charts, ...table];

    if (!widgets || widgets.length === 0) return [];

    const rows: any[][] = [];
    let currentRow: any[] = [];
    let currentRowWidth = 0;
    const MAX_WIDTH = 12; // Sistema de grid de 12 colunas

    widgets.forEach(widget => {
      const widgetWidth = this.getWidgetWidth(widget);

      // Se o widget couber na linha atual, adiciona
      if (currentRowWidth + widgetWidth <= MAX_WIDTH) {
        currentRow.push(widget);
        currentRowWidth += widgetWidth;
      } else {
        // Se não couber, salva a linha atual e começa uma nova
        if (currentRow.length > 0) {
          rows.push(this.distributeWidthInRow(currentRow, MAX_WIDTH));
          currentRow = [];
          currentRowWidth = 0;
        }

        // Adiciona o widget na nova linha
        currentRow.push(widget);
        currentRowWidth += widgetWidth;
      }
    });

    // Adiciona a última linha se tiver widgets
    if (currentRow.length > 0) {
      rows.push(this.distributeWidthInRow(currentRow, MAX_WIDTH));
    }

    return rows;
  }

  /**
   * Distribui a largura disponível entre os widgets da linha
   */
  private distributeWidthInRow(widgets: any[], maxWidth: number): any[] {
    const totalCurrentWidth = widgets.reduce((sum, w) => sum + this.getWidgetWidth(w), 0);
    const remainingWidth = maxWidth - totalCurrentWidth;

    if (remainingWidth > 0 && widgets.length > 0) {
      // Distribui a largura restante proporcionalmente
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

  /**
   * Retorna a largura base do widget (em colunas de grid)
   */
  private getWidgetWidth(widget: any): number {
    // Se o widget já tem uma largura configurada, usa ela
    if (widget.position_config?.width) {
      return widget.position_config.width;
    }

    // Largura padrão baseada no tipo
    switch (widget.widget_type) {
      case 'table':
        return 12; // Tabelas ocupam toda a largura
      case 'chart_line':
      case 'chart_bar':
      case 'chart_area':
        return 6; // Gráficos de linha/barra ocupam metade
      case 'chart_pie':
      case 'chart_scatter':
        return 4; // Gráficos menores ocupam 1/3
      default:
        return 6;
    }
  }

  /**
   * Retorna o estilo de largura calculado para o widget
   */
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
