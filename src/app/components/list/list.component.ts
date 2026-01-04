// ub-list.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListConfig, ListField, ViewMode, FieldType } from './list.types';
import { UbCardListComponent } from './card-list/card-list.component';
import { UbTableListComponent } from './table-list/table-list.component';
import { ConfirmationService } from '../confirmation-modal/confirmation-modal.service';
import { ActionButtonComponent, Action } from '../form/actionbutton/actionbutton.component';
import {ExportColumn, ExportConfig, ExportService} from '../../services/export.service';

@Component({
  selector: 'ub-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UbCardListComponent, UbTableListComponent, ActionButtonComponent],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class UbListComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() config!: ListConfig;
  @Output() refresh = new EventEmitter<void>();

  viewMode: ViewMode = 'card';
  searchTerm = '';
  filteredData: any[] = [];
  processedFields: ListField[] = [];
  mobileView = false;
  exportActions: Action[] = [
    {
      label: 'Exportar PDF',
      icon: 'bxs-file-pdf',
      handler: () => this.exportPDF()
    },
    {
      label: 'Exportar Excel',
      icon: 'bxs-file',
      handler: () => this.exportExcel()
    },
    {
      label: 'Exportar CSV',
      icon: 'bx-table',
      handler: () => this.exportCSV()
    }
  ];

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkMobileView();
  }

  get hasRefreshListener(): boolean {
    return this.refresh.observed;
  }

  get recordCount(): number {
    return this.filteredData.length;
  }

  get totalCount(): number {
    return this.data.length;
  }

  constructor(
    private confirmService: ConfirmationService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.checkMobileView();
    this.initialize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['config']) {
      this.initialize();
    }
  }

  private checkMobileView(): void {
    this.mobileView = window.innerWidth < 768;
  }

  private initialize(): void {
    this.viewMode = this.config?.defaultView || 'card';
    this.processFields();
    this.filterData();
  }

  private processFields(): void {
    if (this.config?.fields && this.config.fields.length > 0) {
      this.processedFields = this.config.fields;
    } else if (this.data && this.data.length > 0) {
      this.processedFields = this.autoGenerateFields(this.data[0]);
    }
  }

  private autoGenerateFields(item: any): ListField[] {
    return Object.keys(item).map((key, index) => ({
      key,
      label: this.formatLabel(key),
      type: this.inferType(item[key]),
      visible: true,
      sortable: true,
      isTitleCard: index === 0,
      isSubtitleCard: index === 1
    }));
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private inferType(value: any): FieldType {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string') {
      if (value.includes('@')) return 'email';
      if (/^\d{10,}$/.test(value.replace(/\D/g, ''))) return 'phone';
    }
    return 'text';
  }

  filterData(): void {
    if (!this.searchTerm.trim()) {
      this.filteredData = [...this.data];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredData = this.data.filter(item =>
      this.processedFields.some(field => {
        const value = this.getFieldValue(item, field);
        return value?.toString().toLowerCase().includes(term);
      })
    );
  }

  getFieldValue(item: any, field: ListField): any {
    const value = item[field.key];
    if (field.formatter) {
      return field.formatter(value, item);
    }
    return this.formatValue(value, field.type);
  }

  private formatValue(value: any, type?: FieldType): string {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString('pt-BR');
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'boolean':
        return value ? 'Sim' : 'Não';
      case 'number':
        return new Intl.NumberFormat('pt-BR').format(value);
      default:
        return value.toString();
    }
  }

  changeView(mode: ViewMode): void {
    this.viewMode = mode;
  }

  async executeAction(action: any, item?: any): Promise<void> {
    if (action.confirm) {
      const confirmed = await this.confirmService.confirm("Você tem certeza que deseja prosseguir?");
      if (!confirmed) return;
    }
    action.action(item);
  }

  onExportAction(action: Action): void {
    // A ação já é executada pelo handler definido no array
  }

  isActionVisible(action: any, item?: any): boolean {
    if (typeof action.visible === 'function') {
      return action.visible(item);
    }
    return action.visible !== false;
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  // ==================== MÉTODOS DE EXPORTAÇÃO ====================

  /**
   * Prepara a configuração de exportação baseada nos campos da lista
   */
  private getExportConfig(format: 'pdf' | 'excel' | 'csv'): ExportConfig {
    // Filtra apenas campos visíveis e exportáveis
    const exportableFields = this.processedFields.filter(field => {
      return field.exportable !== false && field.visible !== false;
    });

    // Converte ListField para ExportColumn
    const columns: ExportColumn[] = exportableFields.map(field => ({
      key: field.key,
      label: field.label,
      formatter: (value: any, row: any) => {
        if (field.formatter) {
          return field.formatter(value, row);
        }
        return this.formatValue(value, field.type);
      },
      width: this.getColumnWidth(field.type)
    }));

    const fileName = this.getFileName();
    const title = this.config?.display?.title || 'Relatório';

    return {
      columns,
      fileName,
      title,
      orientation: format === 'pdf' ? 'landscape' : 'portrait',
      pageSize: 'a4',
      includeHeaders: true,
      sheetName: this.config?.display?.title || 'Dados'
    };
  }

  /**
   * Gera nome do arquivo baseado no título da lista
   */
  private getFileName(): string {
    const baseFileName = this.config?.display?.title || 'lista';
    const timestamp = new Date().toISOString().split('T')[0];
    return `${this.sanitizeFileName(baseFileName)}_${timestamp}`;
  }

  /**
   * Remove caracteres inválidos do nome do arquivo
   */
  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '_') // Substitui caracteres especiais por underscore
      .replace(/^_+|_+$/g, ''); // Remove underscores do início e fim
  }

  /**
   * Define largura da coluna baseada no tipo
   */
  private getColumnWidth(type?: FieldType): number {
    switch (type) {
      case 'date':
        return 25;
      case 'currency':
        return 30;
      case 'boolean':
        return 15;
      case 'number':
        return 20;
      default:
        return 40;
    }
  }

  /**
   * Exporta para PDF
   */
  exportPDF(): void {
    try {
      const config = this.getExportConfig('pdf');
      const dataToExport = this.searchTerm ? this.filteredData : this.data;

      if (dataToExport.length === 0) {
        console.warn('Nenhum dado disponível para exportação');
        return;
      }

      this.exportService.exportToPDF(dataToExport, config);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }
  }

  /**
   * Exporta para Excel
   */
  exportExcel(): void {
    try {
      const config = this.getExportConfig('excel');
      const dataToExport = this.searchTerm ? this.filteredData : this.data;

      if (dataToExport.length === 0) {
        console.warn('Nenhum dado disponível para exportação');
        return;
      }

      this.exportService.exportToExcel(dataToExport, config);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
    }
  }

  /**
   * Exporta para CSV
   */
  exportCSV(): void {
    try {
      const config = this.getExportConfig('csv');
      const dataToExport = this.searchTerm ? this.filteredData : this.data;

      if (dataToExport.length === 0) {
        console.warn('Nenhum dado disponível para exportação');
        return;
      }

      this.exportService.exportToCSV(dataToExport, config);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
    }
  }
}
