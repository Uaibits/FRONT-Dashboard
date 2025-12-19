import {Component, Input, OnInit, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardService, DashboardWidget} from '../../../services/dashboard.service';
import {ToastService} from '../../../components/toast/toast.service';
import {Utils} from '../../../services/utils.service';

interface ColorScheme {
  primary: string;
  shades: string[];
}

interface MetricConfig {
  type?: 'simple' | 'percentage' | 'comparison' | 'trend' | 'status';
  comparisonColumn?: string;
  format?: string;
  target?: string | number;
  threshold?: {
    warning: number;
    danger: number;
  };
}

interface MetricData {
  value: any;
  label: string;
  icon: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period?: string;
  };
  comparison?: {
    value: any;
    label: string;
    change: number;
    direction: 'up' | 'down';
  };
  percentage?: number;
  status?: 'good' | 'warning' | 'danger';
  formattedValue?: string;
}

@Component({
  selector: 'app-dashboard-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metric-card" [class.loading]="loading" [class.has-comparison]="showComparison"
         [class.has-trend]="showTrend" [ngStyle]="getCardStyles()">

      <!-- Loading State -->
      @if (loading) {
        <div class="metric-loading">
          <div class="loading-spinner"></div>
          <span>Carregando...</span>
        </div>
      }

      <!-- Error State -->
      @if (!loading && error) {
        <div class="metric-error">
          <div class="error-icon">
            <i class="bx bx-error-circle"></i>
          </div>
          <div class="error-content">
            <span class="error-title">Erro ao carregar</span>
            <span class="error-message">{{ error }}</span>
          </div>
          <button class="retry-btn" (click)="loadData()" title="Tentar novamente">
            <i class="bx bx-refresh"></i>
          </button>
        </div>
      }

      <!-- Content -->
      @if (!loading && !error && metricData) {
        <div class="metric-content">
          <!-- Header -->
          <div class="metric-header">
            <div class="metric-icon" [ngStyle]="getIconStyles()">
              <i class="bx {{ metricData.icon }}"></i>
            </div>
            <div class="metric-label">{{ metricData.label }}</div>
            <button class="refresh-btn" (click)="loadData()" [disabled]="loading" title="Atualizar">
              <i class="bx bx-refresh"></i>
            </button>
          </div>

          <!-- Main Value -->
          <div class="metric-main">
            <div class="metric-value">{{ metricData.formattedValue || formatValue(metricData.value) }}</div>

            @if (metricData.status && metricData.status !== 'good') {
              <div class="metric-status" [class.status-warning]="metricData.status === 'warning'"
                   [class.status-danger]="metricData.status === 'danger'">
                <i class="bx" [class.bx-error]="metricData.status === 'danger'"
                   [class.bx-error-circle]="metricData.status === 'warning'"></i>
              </div>
            }
          </div>

          <!-- Trend -->
          @if (metricData.trend) {
            <div class="metric-trend" [class.trend-up]="metricData.trend.direction === 'up'"
                 [class.trend-down]="metricData.trend.direction === 'down'">
              <i class="bx" [class.bx-trending-up]="metricData.trend.direction === 'up'"
                 [class.bx-trending-down]="metricData.trend.direction === 'down'"></i>
              {{ metricData.trend.value }}%
              @if (metricData.trend.period) {
                <span class="trend-period">{{ metricData.trend.period }}</span>
              }
            </div>
          }

          <!-- Comparison -->
          @if (metricData.comparison) {
            <div class="metric-comparison">
              <div class="comparison-label">{{ metricData.comparison.label }}</div>
              <div class="comparison-value">{{ formatValue(metricData.comparison.value) }}</div>
              <div class="comparison-change" [class.change-up]="metricData.comparison.direction === 'up'"
                   [class.change-down]="metricData.comparison.direction === 'down'">
                <i class="bx" [class.bx-up-arrow-alt]="metricData.comparison.direction === 'up'"
                   [class.bx-down-arrow-alt]="metricData.comparison.direction === 'down'"></i>
                {{ metricData.comparison.change }}%
              </div>
            </div>
          }

          <!-- Percentage Bar -->
          @if (metricData.percentage !== undefined) {
            <div class="metric-percentage">
              <div class="percentage-bar">
                <div class="percentage-fill"
                     [ngStyle]="{'width': metricData.percentage + '%', 'background': currentScheme.primary}"></div>
              </div>
              <div class="percentage-value">{{ metricData.percentage }}%</div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
      position: relative;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      height: 100%;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

        .refresh-btn {
          opacity: 1;
          transform: translateY(0);
        }
      }

      &.loading {
        opacity: 0.7;
      }

      &.has-comparison {
        min-height: 180px;
      }

      &.has-trend {
        min-height: 160px;
      }
    }

    .metric-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      width: 100%;
      height: 140px;
      color: #6b7280;

      .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f4f6;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      span {
        font-size: 14px;
        font-weight: 500;
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .metric-error {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      padding: 1rem;
      background: #fef2f2;
      border-radius: 8px;

      .error-icon {
        color: #dc2626;
        font-size: 24px;
      }

      .error-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .error-title {
          font-weight: 600;
          color: #dc2626;
          font-size: 14px;
        }

        .error-message {
          color: #6b7280;
          font-size: 13px;
        }
      }

      .retry-btn {
        background: #dc2626;
        border: none;
        padding: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        color: white;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: #b91c1c;
        }

        i {
          font-size: 16px;
        }
      }
    }

    .metric-content {
      flex: 1;
      display: flex;
      flex-direction: column;

      .metric-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;

        .metric-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
        }

        .metric-label {
          flex: 1;
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .refresh-btn {
          background: transparent;
          border: 1px solid #e5e7eb;
          padding: 0.375rem;
          border-radius: 6px;
          cursor: pointer;
          color: #9ca3af;
          transition: all 0.3s;
          opacity: 0;
          transform: translateY(-4px);
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover:not(:disabled) {
            background: #f9fafb;
            border-color: #d1d5db;
            color: #374151;
          }

          &:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          i {
            font-size: 16px;
          }
        }
      }

      .metric-main {
        display: flex;
        align-items: flex-end;
        gap: 0.75rem;
        margin-bottom: 0.75rem;

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          line-height: 1;
          font-feature-settings: 'tnum' 1, 'lnum' 1;
        }

        .metric-status {
          padding: 0.25rem;
          border-radius: 4px;
          font-size: 14px;

          &.status-warning {
            color: #f59e0b;
          }

          &.status-danger {
            color: #dc2626;
          }

          i {
            font-size: 16px;
          }
        }
      }

      .metric-trend {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 13px;
        font-weight: 500;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        margin-bottom: 0.75rem;
        width: fit-content;

        &.trend-up {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
          color: #16a34a;

          i {
            color: #16a34a;
          }
        }

        &.trend-down {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
          color: #dc2626;

          i {
            color: #dc2626;
          }
        }

        .trend-period {
          color: #9ca3af;
          font-size: 11px;
          margin-left: 0.25rem;
        }

        i {
          font-size: 14px;
        }
      }

      .metric-comparison {
        margin-top: auto;
        padding-top: 0.75rem;
        border-top: 1px solid #f3f4f6;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.5rem;
        align-items: center;

        .comparison-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .comparison-value {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          text-align: right;
        }

        .comparison-change {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 12px;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;

          &.change-up {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
            color: #16a34a;
          }

          &.change-down {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
            color: #dc2626;
          }

          i {
            font-size: 12px;
          }
        }
      }

      .metric-percentage {
        margin-top: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .percentage-bar {
          flex: 1;
          height: 6px;
          background: #f3f4f6;
          border-radius: 3px;
          overflow: hidden;

          .percentage-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }

        .percentage-value {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          min-width: 40px;
          text-align: right;
        }
      }
    }
  `]
})
export class DashboardMetricCardComponent implements OnInit, OnChanges {
  @Input() widget!: DashboardWidget;
  @Input() filters: any = {};

  loading: boolean = false;
  error: string | null = null;
  metricData: MetricData | null = null;
  currentScheme: ColorScheme;
  private config: MetricConfig;

  private readonly COLOR_SCHEMES: ColorScheme[] = [
    {
      primary: '#667eea',
      shades: ['#667eea', '#764ba2', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']
    },
    {
      primary: '#10b981',
      shades: ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#60a5fa']
    },
    {
      primary: '#f59e0b',
      shades: ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#e879f9']
    },
    {
      primary: '#6366f1',
      shades: ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#e879f9', '#f0abfc']
    },
    {
      primary: '#06b6d4',
      shades: ['#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7']
    }
  ];

  get showComparison(): boolean {
    return this.metricData?.comparison !== undefined;
  }

  get showTrend(): boolean {
    return this.metricData?.trend !== undefined;
  }

  constructor(
    private dashboardService: DashboardService,
    private toast: ToastService
  ) {
    this.currentScheme = this.COLOR_SCHEMES[0];
    this.config = {};
  }

  ngOnInit() {
    this.setupColorScheme();
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filters'] && !changes['filters'].firstChange) {
      this.loadData();
    }

    if (changes['widget']) {
      this.setupColorScheme();
    }
  }

  private setupColorScheme() {
    if (!this.widget?.id) return;

    const schemeIndex = this.widget.id % this.COLOR_SCHEMES.length;
    this.currentScheme = this.COLOR_SCHEMES[schemeIndex];

    if (this.widget.config) {
      this.config = {
        type: this.widget.config.metric_type || 'simple',
        comparisonColumn: this.widget.config.comparison_column,
        format: this.widget.config.format,
        target: this.widget.config.target,
        threshold: this.widget.config.threshold
      };
    }
  }

  async loadData() {
    if (!this.widget.id) return;

    this.loading = true;
    this.error = null;

    try {
      const response = await this.dashboardService.getWidgetData(this.widget.id, this.filters);

      if (response.success && response.data) {
        const rawData = Utils.keysToUpperCase(response.data.data.data);
        this.metricData = this.parseMetricData(rawData);
      }
    } catch (error: any) {
      this.error = error?.message || 'Erro ao carregar dados da métrica';
    } finally {
      this.loading = false;
    }
  }

  parseMetricData(data: any): MetricData | null {
    if (!data) return null;

    const config = this.widget.config || {};
    const result: MetricData = {
      value: null,
      label: config.metric_label || this.widget.title || 'Métrica',
      icon: config.icon || 'bx-bar-chart-alt',
      formattedValue: undefined
    };

    // Parse base value
    const firstItem = Array.isArray(data) ? data[0] || {} : data;
    const valueColumn = config.data_column || 'VALUE';
    result.value = firstItem[valueColumn] || firstItem[Object.keys(firstItem)[0]];

    // Parse comparison if configured
    if (this.config.comparisonColumn && firstItem[this.config.comparisonColumn]) {
      const comparisonValue = firstItem[this.config.comparisonColumn];
      const change = result.value && comparisonValue
        ? ((result.value - comparisonValue) / Math.abs(comparisonValue)) * 100
        : 0;

      result.comparison = {
        value: comparisonValue,
        label: config.comparison_label || 'Anterior',
        change: Math.round(change * 10) / 10,
        direction: change >= 0 ? 'up' : 'down'
      };
    }

    // Parse trend
    if (firstItem.TREND_VALUE !== undefined) {
      result.trend = {
        value: Math.round(firstItem.TREND_VALUE * 10) / 10,
        direction: firstItem.TREND_DIRECTION === 'down' ? 'down' : 'up',
        period: firstItem.TREND_PERIOD || 'último período'
      };
    }


    // Calculate percentage if type is percentage
    if (this.config.type === 'percentage' && this.config.target && result.value !== null) {
      let target = typeof this.config.target === 'number' ? this.config.target : firstItem[this.config.target];
      target = parseFloat(target) || 0;
      result.percentage = Math.min(100, Math.round((result.value / target) * 100));
    }

    // Determine status based on thresholds
    if (this.config.threshold && result.value !== null) {
      if (result.value >= this.config.threshold.danger) {
        result.status = 'danger';
      } else if (result.value >= this.config.threshold.warning) {
        result.status = 'warning';
      }
    }

    // Format value based on config
    result.formattedValue = this.formatValue(result.value, this.config);

    return result;
  }

  formatValue(value: any, config?: MetricConfig): string {
    if (value === null || value === undefined) return '-';

    let formatted: string;

    if (typeof value === 'number') {
      const formatConfig: any = {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      };

      formatted = new Intl.NumberFormat('pt-BR', formatConfig).format(value);

    } else {
      formatted = String(value);
    }

    return formatted;
  }

  getCardStyles() {
    return {
      'border-color': this.currentScheme.shades[2] + '20',
    };
  }

  getIconStyles() {
    return {
      'background': `linear-gradient(135deg, ${this.currentScheme.shades[0]}, ${this.currentScheme.shades[1]})`,
      'box-shadow': `0 4px 12px ${this.currentScheme.shades[0]}40`
    };
  }
}
