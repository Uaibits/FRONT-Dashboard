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
import { DashboardChartComponent } from './dashboard-chart.component';
import { DashboardTableComponent } from './dashboard-table.component';

@Component({
  selector: 'app-dashboard-view',
  imports: [
    CommonModule,
    FormsModule,
    ContentComponent,
    DashboardFiltersComponent,
    DashboardMetricCardComponent,
    DashboardChartComponent,
    DashboardTableComponent
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
        this.loadDashboard();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadDashboard() {
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
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao carregar dashboard'));
      this.router.navigate(['/dashboards']);
    } finally {
      this.loading = false;
    }
  }

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
    }
  }

  applyFilters() {
    this.loadDashboard();
  }

  clearFilters() {
    this.filterValues = {};
    this.initializeFilters();
    this.loadDashboard();
  }

  refreshDashboard() {
    this.loadDashboard();
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
}
