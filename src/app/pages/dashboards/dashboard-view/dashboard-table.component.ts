import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../components/toast/toast.service';
import { DashboardService, DashboardWidget } from '../../../services/dashboard.service';
import { Utils } from '../../../services/utils.service';

interface TableData {
  columns: string[];
  rows: any[];
}

interface ColumnFilter {
  [key: string]: string;
}

@Component({
  selector: 'app-dashboard-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="table-container" [class.loading]="loading">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <i class="bx bx-table"></i>
          <h3>{{ widget.title }}</h3>
          @if (tableData && tableData.rows) {
            <span class="count">
              {{ getFilteredData().length }} / {{ tableData.rows.length }}
            </span>
          }
        </div>

        <div class="header-actions">
          <button class="btn-icon" (click)="toggleFilters()"
                  [class.active]="showFilters"
                  title="Filtros">
            <i class="bx bx-filter"></i>
          </button>

          @if (hasActiveFilters()) {
            <button class="btn-icon" (click)="clearFilters()"
                    title="Limpar filtros">
              <i class="bx bx-x"></i>
            </button>
          }

          @if (config.enable_export) {
            <button class="btn-icon" (click)="exportData()"
                    title="Exportar CSV">
              <i class="bx bx-download"></i>
            </button>
          }

          <button class="btn-icon" (click)="loadData()"
                  [disabled]="loading"
                  title="Atualizar">
            <i class="bx bx-refresh" [class.spinning]="loading"></i>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="state-container">
          <i class="bx bx-loader-alt bx-spin"></i>
          <span>Carregando...</span>
        </div>
      }

      <!-- Error State -->
      @if (!loading && error) {
        <div class="state-container error">
          <i class="bx bx-error-circle"></i>
          <p>{{ error }}</p>
          <button class="btn-primary" (click)="loadData()">Tentar novamente</button>
        </div>
      }

      <!-- Table -->
      @if (!loading && !error && tableData) {
        <div class="table-wrapper">
          @if (tableData.rows.length > 0) {
            <table>
              <thead>
              <tr class="header-row">
                @for (column of tableData.columns; track column) {
                  <th (click)="sortBy(column)" class="sortable">
                    <div class="th-content">
                      <span class="th-label">{{ getColumnLabel(column) }}</span>
                      <i class="bx sort-icon"
                         [class.bx-chevron-up]="sortColumn === column && sortDirection === 'asc'"
                         [class.bx-chevron-down]="sortColumn === column && sortDirection === 'desc'"
                         [class.bx-minus]="sortColumn !== column"></i>
                    </div>
                  </th>
                }
              </tr>
                @if (showFilters) {
                  <tr class="filter-row">
                    @for (column of tableData.columns; track column) {
                      <th>
                        <input
                          type="text"
                          [(ngModel)]="columnFilters[column]"
                          (ngModelChange)="applyFilters()"
                          (click)="$event.stopPropagation()"
                          placeholder="Filtrar..."
                          class="filter-input">
                      </th>
                    }
                  </tr>
                }
              </thead>
              <tbody>
                @for (row of getDisplayData(); track $index) {
                  <tr>
                    @for (column of tableData.columns; track column) {
                      <td [title]="row[column]">
                        {{ row[column] }}
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          }

          <!-- Empty State -->
          @if (tableData.rows.length === 0) {
            <div class="state-container empty">
              <i class="bx bx-data"></i>
              <span>Nenhum dado disponível</span>
            </div>
          }

          <!-- No Results State -->
          @if (tableData.rows.length > 0 && getFilteredData().length === 0) {
            <div class="state-container empty">
              <i class="bx bx-search"></i>
              <span>Nenhum resultado encontrado</span>
              <button class="btn-text" (click)="clearFilters()">Limpar filtros</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .table-container {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: opacity 0.2s;

      &.loading {
        opacity: 0.6;
      }
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      gap: 1rem;
      flex-wrap: wrap;
      min-height: 60px;
      flex-shrink: 0;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;

        i {
          font-size: 20px;
          color: #6b7280;
          flex-shrink: 0;
        }

        h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .count {
          padding: 0.125rem 0.5rem;
          background: #f3f4f6;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          white-space: nowrap;
        }
      }

      .header-actions {
        display: flex;
        gap: 0.375rem;
        flex-shrink: 0;
      }
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.15s;
      padding: 0;

      i {
        font-size: 18px;
      }

      &:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #d1d5db;
        color: #111827;
      }

      &.active {
        background: #eff6ff;
        border-color: #3b82f6;
        color: #3b82f6;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .spinning {
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      gap: 0.75rem;
      color: #6b7280;
      text-align: center;

      i {
        font-size: 48px;
        opacity: 0.5;
      }

      span, p {
        margin: 0;
        font-size: 14px;
      }

      &.error {
        color: #dc2626;

        i {
          opacity: 1;
        }
      }

      &.empty {
        padding: 4rem 1.5rem;
      }
    }

    .btn-primary {
      padding: 0.625rem 1.25rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: #2563eb;
      }
    }

    .btn-text {
      padding: 0.5rem 1rem;
      background: transparent;
      color: #3b82f6;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        background: #eff6ff;
      }
    }

    .table-wrapper {
      overflow: auto;
      flex: 1;
      min-height: 0;
      -webkit-overflow-scrolling: touch;

      table {
        width: 100%;
        min-width: 600px;
        border-collapse: collapse;
        font-size: 13px;

        thead {
          position: sticky;
          top: 0;
          z-index: 10;

          .header-row {
            background: #f9fafb;

            th {
              padding: 0.875rem 1rem;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border-bottom: 2px solid #e5e7eb;
              white-space: nowrap;
              user-select: none;

              &.sortable {
                cursor: pointer;
                transition: background 0.15s;

                &:hover {
                  background: #f3f4f6;
                }
              }

              .th-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;

                .th-label {
                  flex: 1;
                  min-width: 0;
                }

                .sort-icon {
                  font-size: 16px;
                  color: #9ca3af;
                  transition: color 0.15s;
                  flex-shrink: 0;
                }

                .sort-icon.bx-chevron-up,
                .sort-icon.bx-chevron-down {
                  color: #3b82f6;
                }

                .sort-icon.bx-minus {
                  opacity: 0;
                }
              }

              &:hover .th-content .sort-icon.bx-minus {
                opacity: 0.5;
              }
            }
          }

          .filter-row {
            background: #fff;

            th {
              padding: 0.5rem 1rem;
              border-bottom: 1px solid #e5e7eb;

              .filter-input {
                width: 100%;
                padding: 0.5rem 0.75rem;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                font-size: 12px;
                background: #fff;
                transition: all 0.15s;
                font-family: inherit;

                &:focus {
                  outline: none;
                  border-color: #3b82f6;
                  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                &::placeholder {
                  color: #9ca3af;
                  font-size: 12px;
                }
              }
            }
          }
        }

        tbody {
          tr {
            transition: background 0.1s;

            &:hover {
              background: #f9fafb;
            }

            &:not(:last-child) td {
              border-bottom: 1px solid #f3f4f6;
            }

            td {
              padding: 0.875rem 1rem;
              color: #111827;
              max-width: 300px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }
    }

    /* Responsividade */
    @media (max-width: 1024px) {
      .table-wrapper table {
        min-width: 800px;
      }
    }

    @media (max-width: 768px) {
      .header {
        .header-left {
          h3 {
            font-size: 14px;
          }

          .count {
            font-size: 11px;
          }
        }
      }

      .table-wrapper {
        table {
          min-width: 700px;
          font-size: 12px;

          thead {
            .header-row th,
            .filter-row th {
              padding: 0.75rem 0.875rem;
            }

            .filter-row th .filter-input {
              padding: 0.375rem 0.625rem;
              font-size: 11px;
            }
          }

          tbody td {
            padding: 0.75rem 0.875rem;
          }
        }
      }
    }

    @media (max-width: 480px) {
      .header {
        padding: 0.875rem 1rem;

        .header-left {
          i {
            font-size: 18px;
          }

          h3 {
            font-size: 13px;
          }
        }

        .btn-icon {
          width: 28px;
          height: 28px;

          i {
            font-size: 16px;
          }
        }
      }

      .table-wrapper {
        table {
          min-width: 600px;

          thead {
            .header-row th,
            .filter-row th {
              padding: 0.625rem 0.75rem;
              font-size: 11px;
            }

            .filter-row th .filter-input {
              padding: 0.375rem 0.5rem;
              font-size: 10px;
            }
          }

          tbody td {
            padding: 0.625rem 0.75rem;
            font-size: 11px;
          }
        }
      }
    }
  `]
})
export class DashboardTableComponent implements OnInit, OnChanges {
  @Input() widget!: DashboardWidget;
  @Input() filters: any = {};

  loading = false;
  error: string | null = null;
  tableData: TableData | null = null;
  config: any = {};

  // Sorting
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filtering
  showFilters = false;
  columnFilters: ColumnFilter = {};
  filteredData: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.config = this.widget.config || {};
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filters'] && !changes['filters'].firstChange) {
      this.loadData();
    }
  }

  async loadData() {
    if (!this.widget.id) return;

    this.loading = true;
    this.error = null;

    try {
      const response = await this.dashboardService.getWidgetData(
        this.widget.id,
        this.filters
      );

      if (response.success && response.data) {
        const rawData = Utils.keysToUpperCase(response.data.data.data);
        this.parseTableData(rawData);
        this.applyFilters();
      }
    } catch (error: any) {
      this.error = error?.message || 'Erro ao carregar dados';
    } finally {
      this.loading = false;
    }
  }

  parseTableData(data: any) {
    if (!Array.isArray(data) || data.length === 0) {
      this.tableData = { columns: [], rows: [] };
      return;
    }

    const columns = Object.keys(data[0]);
    this.tableData = { columns, rows: data };

    // Initialize filters
    columns.forEach(col => {
      if (!(col in this.columnFilters)) {
        this.columnFilters[col] = '';
      }
    });
  }

  getColumnLabel(column: string): string {
    const metadata = this.widget.dynamic_query?.fields_metadata?.[column];
    if (metadata?.label) return metadata.label;

    return column
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Sorting
  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  getSortedData(data: any[]): any[] {
    if (!this.sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[this.sortColumn!];
      const bValue = b[this.sortColumn!];

      if (aValue === bValue) return 0;

      let comparison: number;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Filtering
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  applyFilters() {
    if (!this.tableData) {
      this.filteredData = [];
      return;
    }

    this.filteredData = this.tableData.rows.filter(row => {
      return Object.keys(this.columnFilters).every(column => {
        const filterValue = this.columnFilters[column]?.toLowerCase().trim();
        if (!filterValue) return true;

        const cellValue = String(row[column] ?? '').toLowerCase();
        return cellValue.includes(filterValue);
      });
    });
  }

  getFilteredData(): any[] {
    return this.filteredData;
  }

  getDisplayData(): any[] {
    return this.getSortedData(this.getFilteredData());
  }

  hasActiveFilters(): boolean {
    return Object.values(this.columnFilters).some(value => value.trim() !== '');
  }

  clearFilters() {
    Object.keys(this.columnFilters).forEach(key => {
      this.columnFilters[key] = '';
    });
    this.applyFilters();
  }

  // Export
  exportData() {
    if (!this.tableData?.rows.length) {
      this.toast.warning('Nenhum dado para exportar');
      return;
    }

    const dataToExport = this.hasActiveFilters()
      ? this.getFilteredData()
      : this.tableData.rows;

    if (dataToExport.length === 0) {
      this.toast.warning('Nenhum dado filtrado para exportar');
      return;
    }

    const csv = this.convertToCSV(this.tableData.columns, dataToExport);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const fileName = `${this.widget.key || 'table'}_${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.toast.success(`${dataToExport.length} registros exportados`);
  }

  convertToCSV(columns: string[], rows: any[]): string {
    const header = columns.map(col => this.getColumnLabel(col)).join(';');
    const dataRows = rows.map(row =>
      columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';

        const strValue = String(value);
        return strValue.includes(';') || strValue.includes('"') || strValue.includes('\n')
          ? `"${strValue.replace(/"/g, '""')}"`
          : strValue;
      }).join(';')
    );

    return [header, ...dataRows].join('\n');
  }
}
