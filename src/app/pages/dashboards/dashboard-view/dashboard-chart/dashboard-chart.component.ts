import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  NgApexchartsModule,
  ApexPlotOptions,
  ApexTooltip,
  ApexGrid,
  ApexFill
} from 'ng-apexcharts';
import { DashboardService, DashboardWidget } from '../../../../services/dashboard.service';
import { ToastService } from '../../../../components/toast/toast.service';
import { Utils } from '../../../../services/utils.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  colors: string[];
  plotOptions?: ApexPlotOptions;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  labels?: string[];
  fill?: ApexFill;
};

interface ColorScheme {
  primary: string;
  shades: string[];
}

interface LegendItem {
  label: string;
  value: string;
  color: string;
}

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard-chart.component.html',
  styleUrls: ['./dashboard-chart.component.scss']
})
export class DashboardChartComponent implements OnInit, OnChanges {
  @Input() widget!: DashboardWidget;
  @Input() filters: any = {};

  @ViewChild('chart') chart?: ChartComponent;

  loading: boolean = false;
  error: string | null = null;
  chartOptions: ChartOptions | null = null;
  data: any = null;
  legendItems: LegendItem[] = [];
  legendExpanded: boolean = false;

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

  private currentScheme: ColorScheme | null = null;

  constructor(
    private dashboardService: DashboardService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filters'] && !changes['filters'].firstChange) {
      this.loadData();
    }
  }

  async loadData() {
    if (!this.widget?.id) return;

    this.loading = true;
    this.error = null;

    try {
      const response = await this.dashboardService.getWidgetData(this.widget.id, this.filters);

      if (response.success && response.data?.data) {
        this.data = Utils.keysToUpperCase(response.data.data.data || response.data.data);
        this.buildChart();
      } else {
        this.error = 'Dados não disponíveis';
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      this.error = error?.message || 'Erro ao carregar dados do gráfico';
    } finally {
      this.loading = false;
    }
  }

  buildChart() {
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0) {
      this.error = 'Sem dados para exibir';
      return;
    }

    const chartType = this.getChartType();
    this.currentScheme = this.selectColorScheme(chartType);
    const colors = this.generateSmartColors(this.data.length);
    const series = this.buildSeries(chartType);

    if (!series || series.length === 0) {
      this.error = 'Não foi possível construir as séries do gráfico';
      return;
    }

    this.buildLegendItems(chartType, series, colors);

    const baseOptions: ChartOptions = {
      series: series,
      chart: {
        type: chartType as any,
        height: 350,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        foreColor: '#64748b',
        dropShadow: {
          enabled: false
        }
      },
      colors: colors,
      dataLabels: {
        enabled: false
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 15
        }
      },
      legend: {
        show: false
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        lineCap: 'round'
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500
          },
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500
          },
          formatter: (value: number) => this.formatYAxis(value)
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      tooltip: {
        theme: 'light',
        y: {
          formatter: (value: number) => this.formatCurrency(value)
        }
      }
    };

    this.chartOptions = this.applyChartTypeConfig(baseOptions, chartType);
  }

  private getChartType(): string {
    return this.widget.widget_type?.replace('chart_', '') || 'bar';
  }

  private applyChartTypeConfig(options: ChartOptions, chartType: string): ChartOptions {
    switch (chartType) {
      case 'line':
        return this.configureLineChart(options);
      case 'bar':
        return this.configureBarChart(options);
      case 'pie':
        return this.configurePieChart(options);
      case 'donut':
        return this.configureDonutChart(options);
      case 'area':
        return this.configureAreaChart(options);
      case 'radar':
        return this.configureRadarChart(options);
      default:
        return this.configureBarChart(options);
    }
  }

  private configureLineChart(options: ChartOptions): ChartOptions {
    options.xaxis.categories = this.extractCategories();
    options.stroke = {
      curve: 'smooth',
      width: 3,
      lineCap: 'round'
    };
    options.chart.type = 'line';
    options.dataLabels = {
      enabled: false
    };
    return options;
  }

  private configureBarChart(options: ChartOptions): ChartOptions {
    options.xaxis.categories = this.extractCategories();
    options.chart.type = 'bar';
    options.plotOptions = {
      bar: {
        borderRadius: 10,
        borderRadiusApplication: 'end',
        columnWidth: '50%',
        dataLabels: {
          position: 'top'
        },
        distributed: false
      }
    };
    options.stroke = {
      width: 0
    };
    options.dataLabels = {
      enabled: false
    };
    return options;
  }

  private configurePieChart(options: ChartOptions): ChartOptions {
    options.labels = this.extractCategories();
    options.chart.type = 'pie';
    options.plotOptions = {
      pie: {
        expandOnClick: true,
        dataLabels: {
          offset: -5
        }
      }
    };
    options.dataLabels = {
      enabled: true,
      style: {
        fontSize: '13px',
        fontWeight: 600,
        colors: ['#ffffff']
      },
      dropShadow: {
        enabled: true,
        blur: 3,
        opacity: 0.4
      },
      formatter: (val: any) => {
        return val.toFixed(1) + '%';
      }
    };
    options.stroke = {
      width: 2,
      colors: ['#ffffff']
    };
    return options;
  }

  private configureDonutChart(options: ChartOptions): ChartOptions {
    options.labels = this.extractCategories();
    options.chart.type = 'donut';
    options.plotOptions = {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              color: '#64748b'
            },
            value: {
              show: true,
              fontSize: '28px',
              fontWeight: 700,
              color: '#1e293b',
              formatter: (val: any) => this.formatCurrency(Number(val))
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 600,
              color: '#64748b',
              formatter: (w: any) => {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return this.formatCurrency(total);
              }
            }
          }
        },
        expandOnClick: true
      }
    };
    options.dataLabels = {
      enabled: true,
      style: {
        fontSize: '13px',
        fontWeight: 600,
        colors: ['#ffffff']
      },
      dropShadow: {
        enabled: true,
        blur: 3,
        opacity: 0.4
      }
    };
    options.stroke = {
      width: 3,
      colors: ['#ffffff']
    };
    return options;
  }

  private configureAreaChart(options: ChartOptions): ChartOptions {
    options.xaxis.categories = this.extractCategories();
    options.chart.type = 'area';
    options.stroke = {
      curve: 'smooth',
      width: 2
    };
    options.fill = {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    };
    options.dataLabels = {
      enabled: false
    };
    return options;
  }

  private configureRadarChart(options: ChartOptions): ChartOptions {
    options.xaxis.categories = this.extractCategories();
    options.chart.type = 'radar';
    options.stroke = {
      width: 2
    };
    options.fill = {
      opacity: 0.2
    };
    options.plotOptions = {
      radar: {
        polygons: {
          strokeColors: '#e9e9e9',
          fill: {
            colors: ['#f8f8f8', '#fff']
          }
        }
      }
    };
    options.dataLabels = {
      enabled: false
    };
    return options;
  }

  private buildSeries(chartType: string): ApexAxisChartSeries {
    if (!this.data || !Array.isArray(this.data)) return [];

    const config = this.widget.config || {};
    const valueKey = config.y_axis_label || 'VALUE';

    if (chartType === 'pie' || chartType === 'donut') {
      return [{
        name: this.widget.title || 'Dados',
        data: this.data.map((item: any) => {
          const value = item[valueKey] || item.VALOR || item.VALUE || 0;
          return Number(value) || 0;
        })
      }];
    }

    const seriesData = this.data.map((item: any) => {
      const value = item[valueKey] || item.VALOR || item.VALUE || 0;
      return Number(value) || 0;
    });

    return [{
      name: this.widget.title || 'Dados',
      data: seriesData
    }];
  }

  private extractCategories(): string[] {
    if (!this.data || !Array.isArray(this.data)) return [];

    const config = this.widget.config || {};
    const labelKey = config.x_axis_label || 'LABEL';

    return this.data.map((item: any) => {
      const label = String(item[labelKey] || item.NAME || item.NOME || item.LABEL || '');
      return label.length > 15 ? label.substring(0, 15) + '...' : label;
    });
  }

  private formatYAxis(value: number): string {
    if (value >= 1000000) {
      return 'R$ ' + (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return 'R$ ' + (value / 1000).toFixed(1) + 'K';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private selectColorScheme(chartType: string): ColorScheme {
    const schemeIndex = Math.abs(this.hashCode(this.widget.id.toString())) % this.COLOR_SCHEMES.length;
    return this.COLOR_SCHEMES[schemeIndex];
  }

  private generateSmartColors(count: number): string[] {
    if (!this.currentScheme) {
      this.currentScheme = this.COLOR_SCHEMES[0];
    }

    const colors: string[] = [];
    const baseColors = this.currentScheme.shades;

    for (let i = 0; i < count; i++) {
      if (i < baseColors.length) {
        colors.push(baseColors[i]);
      } else {
        const baseIndex = i % baseColors.length;
        const baseColor = baseColors[baseIndex];
        colors.push(this.adjustColorBrightness(baseColor, (i - baseColors.length) * 10));
      }
    }

    return colors;
  }

  private adjustColorBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  private buildLegendItems(chartType: string, series: any[], colors: string[]) {
    this.legendItems = [];

    if (chartType === 'pie' || chartType === 'donut') {
      const categories = this.extractCategories();
      const values = series[0].data;

      this.legendItems = categories.map((label, index) => ({
        label: label,
        value: this.formatCurrency(values[index]),
        color: colors[index]
      }));
    } else {
      series.forEach((serie, index) => {
        const total = serie.data.reduce((sum: number, val: number) => sum + val, 0);
        this.legendItems.push({
          label: serie.name,
          value: this.formatCurrency(total),
          color: colors[index]
        });
      });
    }
  }

  showCustomLegend(): boolean {
    return this.legendItems.length > 0;
  }

  getVisibleLegendItems(): LegendItem[] {
    if (this.legendExpanded || this.legendItems.length <= 5) {
      return this.legendItems;
    }
    return this.legendItems.slice(0, 5);
  }

  toggleLegendExpanded() {
    this.legendExpanded = !this.legendExpanded;
  }

  shouldShowTotal(): boolean {
    const chartType = this.getChartType();
    return chartType === 'pie' || chartType === 'donut' || this.legendItems.length > 1;
  }

  getTotalValue(): string {
    const total = this.legendItems.reduce((sum, item) => {
      const value = parseFloat(item.value.replace(/[^\d,-]/g, '').replace(',', '.'));
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    return this.formatCurrency(total);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }
}
