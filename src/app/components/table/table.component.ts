import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../form/button/button.component';
import {InputComponent} from '../form/input/input.component';
import {MultiselectComponent} from '../form/multiselect/multiselect.component';
import {Action, ActionButtonComponent} from '../form/actionbutton/actionbutton.component';
import {ConfirmationService} from '../confirmation-modal/confirmation-modal.service';
import {ActivatedRoute, Router} from '@angular/router';

export interface TableConfig {
  cols: ColumnConfig[]; // Configurações das colunas
  selectable?: boolean; // Permitir seleção de itens?
  showAddButton?: boolean; // Exibir botão de adicionar?
  showExportButton?: boolean; // Exibir botão de exportar?
  showFilterButton?: boolean; // Exibir filtro?
  showEditButton?: boolean; // Exibir botão de editar?
  showDeleteButton?: boolean; // Exibir botão de excluir?
}

export interface ColumnConfig {
  path: string; // Caminho para acessar o dado (ex: "company.name")
  name: string; // Nome exibido no cabeçalho
}

@Component({
  selector: 'ub-table',
  imports: [NgIf, NgForOf, FormsModule, ButtonComponent, InputComponent, MultiselectComponent, ButtonComponent, ActionButtonComponent],
  templateUrl: './table.component.html',
  standalone: true,
  styleUrl: './table.component.scss',
})
export class TableComponent implements OnChanges {
  @Input({required: true}) config!: TableConfig;
  @Input({required: true}) data: any[] = [];
  @Input() pk: string = 'id';
  @Output() deleteEvent = new EventEmitter<any>();
  @Output() selectEvent = new EventEmitter<any[]>();
  @Output() reloadEvent = new EventEmitter<void>();

  selectedItems: any[] = [];
  filterPopupVisible = false;
  selectedColumns: string[] = [];
  selectedFilterColumn: ColumnConfig | null = null;
  filterValue: string = '';
  filteredData: any[] = [];
  actionsExport: Action[] = [
    {
      label: 'PDF',
      icon: 'bx bx-file',
      handler: () => console.log('Exportar em PDF')
    },
    {
      label: 'Excel',
      icon: 'bx bx-file',
      handler: () => console.log('Exportar em Excel')
    },
    {
      label: 'Imprimir',
      icon: 'bx bx-printer',
      handler: () => console.log('Imprimir')
    }
  ];

  constructor(
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.filteredData = [...this.data];
    this.selectedColumns = this.config.cols.map(col => col.path);

    console.log(this.filteredData)
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.filteredData = [...this.data];
    }
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  toggleSelect(item: any): void {
    const index = this.selectedItems.indexOf(item);
    if (index === -1) {
      this.selectedItems.push(item);
    } else {
      this.selectedItems.splice(index, 1);
    }
    this.selectEvent.emit(this.selectedItems);
  }

  isSelected(item: any): boolean {
    return this.selectedItems.includes(item);
  }

  toggleSelectAll(event: Event): void {
    if ((event.target as HTMLInputElement).checked) {
      this.selectedItems = [...this.data];
    } else {
      this.selectedItems = [];
    }
    this.selectEvent.emit(this.selectedItems);
  }

  openFilterPopup(col: ColumnConfig): void {
    this.selectedFilterColumn = col;
    this.filterPopupVisible = true;
  }

  closeFilterPopup(): void {
    this.filterPopupVisible = false;
    this.filterValue = '';
  }

  applyFilter(): void {
    if (this.filterValue && this.selectedFilterColumn) {
      this.filteredData = this.data.filter((item) =>
        this.getNestedValue(item, this.selectedFilterColumn!.path)
          .toString()
          .toLowerCase()
          .includes(this.filterValue.toLowerCase())
      );
    } else {
      this.filteredData = [...this.data];
    }
    this.closeFilterPopup();
  }

  protected readonly console = console;

  delete(item: any) {
    this.confirmationService.confirm('Deseja realmente excluir este item?').subscribe((response) => {
      if (response) {
        this.deleteEvent.emit(item);
      }
    });
  }

  edit(item: any) {
    this.router.navigate(['gerenciar', item[this.pk]], { relativeTo: this.route });
  }

  create() {
    this.router.navigate(['gerenciar'], { relativeTo: this.route });
  }
}
