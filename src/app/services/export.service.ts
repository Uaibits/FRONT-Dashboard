// export.service.ts
import {Injectable} from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: any, row?: any) => string;
  width?: number; // Para PDF
}

export interface ExportConfig {
  columns: ExportColumn[];
  fileName?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'a3';
  includeHeaders?: boolean;
  dateFormat?: string;
  sheetName?: string; // Para Excel
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly DEFAULT_FILE_NAME = 'dados';
  private readonly DEFAULT_SHEET_NAME = 'Dados';

  constructor() {}

  /**
   * Exporta dados para formato Excel (.xlsx)
   */
  exportToExcel(data: any[], config: ExportConfig): void {
    const { columns, fileName, sheetName, includeHeaders = true } = config;

    if (!data || data.length === 0) {
      console.warn('Nenhum dado disponível para exportação');
      return;
    }

    // Prepara os dados formatados
    const formattedData = this.prepareDataForExport(data, columns);

    // Cria o worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: columns.map(col => col.label),
      skipHeader: !includeHeaders
    });

    // Ajusta a largura das colunas
    worksheet['!cols'] = columns.map(col => ({
      wch: col.width || this.calculateColumnWidth(col.label)
    }));

    // Cria o workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetName || this.DEFAULT_SHEET_NAME
    );

    // Salva o arquivo
    const finalFileName = `${fileName || this.DEFAULT_FILE_NAME}.xlsx`;
    XLSX.writeFile(workbook, finalFileName);
  }

  /**
   * Exporta dados para formato CSV
   */
  exportToCSV(data: any[], config: ExportConfig): void {
    const { columns, fileName, includeHeaders = true } = config;

    if (!data || data.length === 0) {
      console.warn('Nenhum dado disponível para exportação');
      return;
    }

    // Prepara os dados formatados
    const formattedData = this.prepareDataForExport(data, columns);

    // Cria o worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: columns.map(col => col.label),
      skipHeader: !includeHeaders
    });

    // Converte para CSV
    const csv = XLSX.utils.sheet_to_csv(worksheet, {
      FS: ';', // Separador de campo (ponto e vírgula para compatibilidade com Excel brasileiro)
      RS: '\n' // Separador de linha
    });

    // Cria o blob e faz o download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName || this.DEFAULT_FILE_NAME}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Exporta dados para formato PDF
   */
  exportToPDF(data: any[], config: ExportConfig): void {
    const {
      columns,
      fileName,
      title,
      orientation = 'portrait',
      pageSize = 'a4',
      includeHeaders = true
    } = config;

    if (!data || data.length === 0) {
      console.warn('Nenhum dado disponível para exportação');
      return;
    }

    // Cria o documento PDF
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });

    // Adiciona título se fornecido
    if (title) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 15);
    }

    // Prepara os cabeçalhos
    const headers = includeHeaders
      ? [columns.map(col => col.label)]
      : [];

    // Prepara os dados
    const body = data.map(row =>
      columns.map(col => {
        const value = this.getNestedValue(row, col.key);
        return col.formatter
          ? col.formatter(value, row)
          : this.formatValue(value);
      })
    );

    // Configura a tabela
    autoTable(doc, {
      head: headers,
      body: body,
      startY: title ? 25 : 10,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      columnStyles: this.buildColumnStyles(columns),
      didDrawPage: (data) => {
        // Adiciona número da página
        const pageCount = (doc as any).internal.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          data.settings.margin.left,
          pageHeight - 5
        );

        // Adiciona data de geração
        const date = new Date().toLocaleDateString('pt-BR');
        doc.text(
          `Gerado em: ${date}`,
          pageSize.width - data.settings.margin.right - 35,
          pageHeight - 5
        );
      }
    });

    // Salva o arquivo
    doc.save(`${fileName || this.DEFAULT_FILE_NAME}.pdf`);
  }

  /**
   * Exportação rápida sem necessidade de configuração detalhada
   */
  quickExport(
    data: any[],
    format: 'excel' | 'csv' | 'pdf',
    fileName?: string,
    excludeKeys?: string[]
  ): void {
    if (!data || data.length === 0) {
      console.warn('Nenhum dado disponível para exportação');
      return;
    }

    // Gera colunas automaticamente
    const firstItem = data[0];
    const columns: ExportColumn[] = Object.keys(firstItem)
      .filter(key => !excludeKeys || !excludeKeys.includes(key))
      .map(key => ({
        key,
        label: this.formatLabel(key)
      }));

    const config: ExportConfig = {
      columns,
      fileName: fileName || this.DEFAULT_FILE_NAME
    };

    switch (format) {
      case 'excel':
        this.exportToExcel(data, config);
        break;
      case 'csv':
        this.exportToCSV(data, config);
        break;
      case 'pdf':
        this.exportToPDF(data, config);
        break;
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Prepara os dados para exportação aplicando formatadores
   */
  private prepareDataForExport(data: any[], columns: ExportColumn[]): any[] {
    return data.map(row => {
      const formattedRow: any = {};
      columns.forEach(col => {
        const value = this.getNestedValue(row, col.key);
        formattedRow[col.label] = col.formatter
          ? col.formatter(value, row)
          : this.formatValue(value);
      });
      return formattedRow;
    });
  }

  /**
   * Obtém valor de propriedade aninhada (ex: 'user.name')
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) =>
      current?.[prop], obj
    );
  }

  /**
   * Formata valores para exibição
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (value instanceof Date) return value.toLocaleDateString('pt-BR');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * Formata label de chave (camelCase para Título)
   */
  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Calcula largura ideal da coluna
   */
  private calculateColumnWidth(text: string): number {
    const baseWidth = 10;
    const charWidth = 1.2;
    return Math.max(baseWidth, text.length * charWidth);
  }

  /**
   * Constrói estilos de coluna para PDF
   */
  private buildColumnStyles(columns: ExportColumn[]): any {
    const styles: any = {};
    columns.forEach((col, index) => {
      if (col.width) {
        styles[index] = { cellWidth: col.width };
      }
    });
    return styles;
  }
}
