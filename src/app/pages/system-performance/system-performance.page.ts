import { Component, OnInit } from '@angular/core';
import { ContentComponent } from '../../components/content/content.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../components/toast/toast.service';
import { PanelComponent } from '../../components/content/panels/panel/panel.component';
import { PanelAreaComponent } from '../../components/content/panels/panel-area.component';
import { ButtonComponent } from '../../components/form/button/button.component';
import {SystemPerformanceService} from '../../services/system-performance';

@Component({
  imports: [
    ContentComponent,
    CommonModule,
    FormsModule,
    PanelComponent,
    PanelAreaComponent,
    ButtonComponent
  ],
  templateUrl: './system-performance.page.html',
  standalone: true,
  styleUrl: './system-performance.page.scss'
})
export class SystemPerformancePage implements OnInit {
  protected loading: boolean = false;
  protected dashboard: any = null;
  protected systemHealth: any = null;
  protected selectedPeriod: string = 'today';
  protected showCleanupModal: boolean = false;
  protected cleanupDays: number = 30;
  protected showEndpointModal: boolean = false;
  protected selectedEndpoint: any = null;
  protected endpointAnalysis: any = null;

  // Opções de período
  protected periods = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'week', label: 'Última Semana' },
    { value: 'month', label: 'Último Mês' },
    { value: 'year', label: 'Último Ano' }
  ];

  constructor(
    private performanceService: SystemPerformanceService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadSystemHealth();

    // Atualizar saúde do sistema a cada 30 segundos
    setInterval(() => {
      this.loadSystemHealth();
    }, 30000);
  }

  async load() {
    this.loading = true;
    await this.loadDashboard();
    this.loading = false;
  }

  async loadDashboard(): Promise<void> {
    try {
      this.dashboard = await this.performanceService.getDashboard(this.selectedPeriod);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  }

  async loadSystemHealth(): Promise<void> {
    try {
      this.systemHealth = await this.performanceService.getSystemHealth();
    } catch (error) {
      console.error('Erro ao carregar saúde do sistema:', error);
    }
  }

  async onPeriodChange(): Promise<void> {
    await this.loadDashboard();
  }

  async viewEndpointDetails(endpoint: any): Promise<void> {
    this.loading = true;
    this.selectedEndpoint = endpoint;

    try {
      this.endpointAnalysis = await this.performanceService.getEndpointAnalysis(
        endpoint.endpoint,
        this.selectedPeriod
      );
      this.showEndpointModal = true;
    } catch (error) {
      console.error('Erro ao carregar análise do endpoint:', error);
    } finally {
      this.loading = false;
    }
  }

  closeEndpointModal(): void {
    this.showEndpointModal = false;
    this.selectedEndpoint = null;
    this.endpointAnalysis = null;
  }

  async cleanupMetrics(): Promise<void> {
    this.showCleanupModal = true;
  }

  async confirmCleanup(): Promise<void> {
    if (!this.cleanupDays || this.cleanupDays < 1) {
      this.toast.error('Por favor, informe um número válido de dias');
      return;
    }

    try {
      this.loading = true;
      this.showCleanupModal = false;

      await this.performanceService.cleanup(this.cleanupDays);
      this.cleanupDays = 30;
      this.load();
    } catch (error) {
      console.error('Erro ao limpar métricas:', error);
    } finally {
      this.loading = false;
    }
  }

  cancelCleanup(): void {
    this.showCleanupModal = false;
    this.cleanupDays = 30;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'healthy': '#10b981',
      'degraded': '#f59e0b',
      'critical': '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'healthy': 'bx-check-circle',
      'degraded': 'bx-error-circle',
      'critical': 'bx-x-circle'
    };
    return icons[status] || 'bx-info-circle';
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'healthy': 'Saudável',
      'degraded': 'Degradado',
      'critical': 'Crítico'
    };
    return labels[status] || 'Desconhecido';
  }

  getAlertClass(type: string): string {
    const classes: any = {
      'info': 'alert-info',
      'warning': 'alert-warning',
      'critical': 'alert-critical'
    };
    return classes[type] || 'alert-info';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  getPercentageClass(value: number, threshold: number): string {
    if (value >= threshold) return 'text-danger';
    if (value >= threshold * 0.7) return 'text-warning';
    return 'text-success';
  }

  protected readonly confirm = confirm;
}
