import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {DashboardService} from '../../../services/dashboard.service';
import {ToastService} from '../../toast/toast.service';
import {Utils} from '../../../services/utils.service';
interface Dashboard {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  is_home?: boolean;
}

@Component({
  selector: 'app-dashboard-list',
  imports: [CommonModule],
  templateUrl: './dashboard-list.component.html',
  standalone: true,
  styleUrl: './dashboard-list.component.scss'
})
export class DashboardListComponent implements OnInit {
  @Input() autoLoad: boolean = true;
  @Input() dashboards: Dashboard[] = [];
  @Input() showHeader: boolean = true;
  @Input() columns: number = 3;
  @Input() allowSetHome: boolean = true;

  @Output() dashboardSelected = new EventEmitter<Dashboard>();
  @Output() dashboardsLoaded = new EventEmitter<Dashboard[]>();
  @Output() homeDashboardChanged = new EventEmitter<Dashboard>(); // Novo evento

  loading: boolean = false;
  error: string | null = null;
  settingHome: { [key: string]: boolean } = {}; // Para controlar loading por dashboard

  constructor(
    private dashboardService: DashboardService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    if (this.autoLoad && this.dashboards.length === 0) {
      this.loadDashboards();
    }
  }

  async loadDashboards() {
    this.loading = true;
    this.error = null;

    try {
      const response = await this.dashboardService.getAccessibleDashboardsForUser();
      this.dashboards = response.data || [];
      this.dashboardsLoaded.emit(this.dashboards);

      if (this.dashboards.length === 0) {
        this.error = 'Nenhum dashboard disponível';
      }
    } catch (error) {
      this.error = Utils.getErrorMessage(error, 'Erro ao carregar dashboards');
      this.toast.error(this.error);
    } finally {
      this.loading = false;
    }
  }

  selectDashboard(dashboard: Dashboard) {
    this.dashboardSelected.emit(dashboard);
  }

  async setAsHomeDashboard(dashboard: Dashboard, event: MouseEvent) {
    event.stopPropagation(); // Evita que o clique propague para o card

    if (dashboard.is_home || this.settingHome[dashboard.key]) {
      return;
    }

    this.settingHome[dashboard.key] = true;

    try {
      await this.dashboardService.setUserHomeDashboard(dashboard.key);

      // Atualiza o estado de todos os dashboards
      this.dashboards = this.dashboards.map(d => ({
        ...d,
        is_home: d.key === dashboard.key
      }));

      this.toast.success(`"${dashboard.name}" definido como dashboard principal`);
      this.homeDashboardChanged.emit(dashboard);

    } catch (error) {
      const errorMessage = Utils.getErrorMessage(error, 'Erro ao definir dashboard principal');
      this.toast.error(errorMessage);
    } finally {
      delete this.settingHome[dashboard.key];
    }
  }

  getGridColumns(): string {
    return `repeat(auto-fill, minmax(${this.getMinWidth()}px, 1fr))`;
  }

  private getMinWidth(): number {
    switch (this.columns) {
      case 2: return 320;
      case 3: return 280;
      case 4: return 240;
      default: return 280;
    }
  }

  getIconClass(dashboard: Dashboard): string {
    if (dashboard.icon) {
      return `bx ${dashboard.icon}`;
    }
    return 'bx bx-bar-chart-alt-2';
  }

  retry() {
    this.loadDashboards();
  }

  // Verifica se algum dashboard é o principal
  hasHomeDashboard(): boolean {
    return this.dashboards.some(dashboard => dashboard.is_home);
  }

  // Obtém o dashboard principal
  getHomeDashboard(): Dashboard | null {
    return this.dashboards.find(dashboard => dashboard.is_home) || null;
  }
}
