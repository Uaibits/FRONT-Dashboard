import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../../../components/form/input/input.component';
import { DropdownComponent } from '../../../components/form/dropdown/dropdown.component';
import { MultiselectComponent } from '../../../components/form/multiselect/multiselect.component';
import { ToggleSwitchComponent } from '../../../components/form/toggle-switch/toggle-switch.component';
import { ButtonComponent } from '../../../components/form/button/button.component';

@Component({
  selector: 'app-dashboard-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputComponent,
    DropdownComponent,
    MultiselectComponent,
    ToggleSwitchComponent,
    ButtonComponent
  ],
  template: `
    <div class="filters-panel" [class.collapsed]="collapsed">
      <div class="filters-header">
        <div class="filters-title" (click)="toggleCollapse()">
          <i class="bx bx-filter-alt"></i>
          @if (!collapsed) {
            <span>Filtros</span>
            @if (hasActiveFilters()) {
              <span class="badge">{{ countActiveFilters() }}</span>
            }
          }
        </div>
        <button class="filters-toggle" (click)="toggleCollapse()" title="{{ collapsed ? 'Expandir' : 'Recolher' }}">
          <i class="bx" [class.bx-chevron-left]="!collapsed" [class.bx-chevron-right]="collapsed"></i>
        </button>
      </div>

      @if (!collapsed) {
        <div class="filters-content">
          @if (filters.length > 0) {
            <div class="filters-form">
              @for (filter of filters; track filter.var_name) {
                <div class="filter-item">
                  @switch (filter.type) {
                    @case ('text') {
                      <ub-input
                        [label]="filter.name"
                        [helpText]="filter.description"
                        [placeholder]="'Digite ' + filter.name"
                        [required]="filter.required"
                        [(ngModel)]="localFilterValues[filter.var_name]"
                      ></ub-input>
                    }
                    @case ('number') {
                      <ub-input
                        type="number"
                        [label]="filter.name"
                        [helpText]="filter.description"
                        [placeholder]="'Digite ' + filter.name"
                        [required]="filter.required"
                        [(ngModel)]="localFilterValues[filter.var_name]"
                      ></ub-input>
                    }
                    @case ('date') {
                      <ub-input
                        type="date"
                        [label]="filter.name"
                        [helpText]="filter.description"
                        [placeholder]="'Selecione ' + filter.name"
                        [required]="filter.required"
                        [(ngModel)]="localFilterValues[filter.var_name]"
                      ></ub-input>
                    }
                    @case ('boolean') {
                      <ub-toggle-switch
                        [label]="filter.name"
                        [helpText]="filter.description"
                        [required]="filter.required"
                        [(ngModel)]="localFilterValues[filter.var_name]"
                      ></ub-toggle-switch>
                    }
                    @case ('select') {
                      <ub-dropdown
                        [label]="filter.name"
                        [helpText]="filter.description"
                        [placeholder]="'Selecione ' + filter.name"
                        [required]="filter.required"
                        [(ngModel)]="localFilterValues[filter.var_name]"
                        [options]="getFilterOptions(filter.options)"
                        optionLabel="label"
                        optionValue="value"
                      ></ub-dropdown>
                    }
                    @case ('multiselect') {
                      <ub-multiselect
                        [label]="filter.name"
                        [helpText]="filter.description"
                        [placeholder]="'Selecione ' + filter.name"
                        [required]="filter.required"
                        [(ngModel)]="localFilterValues[filter.var_name]"
                        [options]="getFilterOptions(filter.options)"
                        optionLabel="label"
                        optionValue="value"
                      ></ub-multiselect>
                    }
                  }
                </div>
              }
            </div>

            @if (!areRequiredFiltersFilled()) {
              <div class="validation-message">
                <i class="bx bx-info-circle"></i>
                <span>Preencha todos os campos obrigatórios</span>
              </div>
            }

            <div class="filters-actions">
              <ub-button
                [loading]="loading"
                [disabled]="!areRequiredFiltersFilled()"
                (click)="applyFilters()"
                class="apply-btn">
                <i class="bx bx-check"></i>
                Aplicar
              </ub-button>
              <button class="clear-btn" (click)="clearFilters()">
                <i class="bx bx-x"></i>
                Limpar
              </button>
            </div>
          } @else {
            <div class="filters-empty">
              <i class="bx bx-info-circle"></i>
              <p>Sem filtros</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .filters-panel {
      width: 280px;
      background: var(--bg-white);
      border-right: 1px solid var(--border-color, #e9ecef);
      display: flex;
      flex-direction: column;
      transition: width 0.25s ease;
      position: relative;
      height: 100%;

      &.collapsed {
        width: 48px;
      }
    }

    .filters-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-color, #e9ecef);
      min-height: 52px;
      box-sizing: border-box;

      .filters-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        color: var(--text-color, #212529);
        font-size: 14px;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.2s;
        flex: 1;

        &:hover {
          background: var(--bg-light, #f8f9fa);
        }

        i {
          font-size: 18px;
          color: var(--text-muted, #6c757d);
          min-width: 20px;
        }

        .badge {
          background: var(--primary-color, #667eea);
          color: white;
          font-size: 11px;
          padding: 0.125rem 0.375rem;
          border-radius: 10px;
          margin-left: 0.25rem;
        }
      }

      .filters-toggle {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.375rem;
        color: var(--text-muted, #6c757d);
        transition: all 0.2s;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        i {
          font-size: 16px;
        }

        &:hover {
          background: var(--bg-light, #f8f9fa);
          color: var(--text-color, #495057);
        }
      }
    }

    .filters-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .filters-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      flex: 1;
    }

    .filter-item {
      &:last-child {
        margin-bottom: 0;
      }
    }

    .validation-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0.75rem;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      color: #856404;
      font-size: 12px;

      i {
        font-size: 16px;
        flex-shrink: 0;
      }
    }

    .filters-actions {
      display: flex;
      gap: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color, #e9ecef);

      .apply-btn {
        flex: 1;
      }

      .clear-btn {
        background: transparent;
        border: 1px solid var(--border-color, #e9ecef);
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        cursor: pointer;
        color: var(--text-muted, #6c757d);
        font-size: 13px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.375rem;

        i {
          font-size: 14px;
        }

        &:hover {
          background: var(--bg-light, #f8f9fa);
          border-color: var(--text-muted, #adb5bd);
          color: var(--text-color, #495057);
        }
      }
    }

    .filters-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted, #6c757d);
      text-align: center;
      gap: 0.5rem;

      i {
        font-size: 24px;
        opacity: 0.5;
      }

      p {
        margin: 0;
        font-size: 13px;
      }
    }
  `]
})
export class DashboardFiltersComponent implements OnInit, OnChanges {
  @Input() filters: any[] = [];
  @Input() filterValues: { [key: string]: any } = {};
  @Input() loading: boolean = false;
  @Input() collapsed: boolean = false;

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() apply = new EventEmitter<any>();
  @Output() clear = new EventEmitter<void>();
  @Output() filterValuesChange = new EventEmitter<{ [key: string]: any }>();

  // Cópia local dos valores - ESTA É A CHAVE!
  localFilterValues: { [key: string]: any } = {};

  ngOnInit() {
    this.initializeLocalValues();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Atualiza valores locais quando o pai mudar os filterValues
    if (changes['filterValues'] && !changes['filterValues'].firstChange) {
      this.initializeLocalValues();
    }
  }

  private initializeLocalValues() {
    // Cria uma cópia profunda dos valores vindos do pai
    this.localFilterValues = JSON.parse(JSON.stringify(this.filterValues || {}));
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  clearFilters() {
    // Limpa os valores locais
    this.localFilterValues = {};

    // Emite para o pai
    this.clear.emit();
  }

  applyFilters() {
    if (this.areRequiredFiltersFilled()) {
      // Apenas quando clicar em aplicar que envia os valores para o pai
      this.apply.emit({ ...this.localFilterValues });
      this.filterValuesChange.emit({ ...this.localFilterValues });
    }
  }

  areRequiredFiltersFilled(): boolean {
    const requiredFilters = this.filters.filter(f => f.required);

    return requiredFilters.every(filter => {
      const value = this.localFilterValues[filter.var_name];

      // Para campos boolean, sempre considera válido (true ou false)
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

  hasActiveFilters(): boolean {
    // Mostra badge baseado nos filtros APLICADOS (do pai)
    return Object.values(this.filterValues || {}).some(value =>
      value !== null && value !== undefined && value !== '' &&
      (!Array.isArray(value) || value.length > 0)
    );
  }

  countActiveFilters(): number {
    // Conta filtros APLICADOS (do pai)
    return Object.values(this.filterValues || {}).filter(value =>
      value !== null && value !== undefined && value !== '' &&
      (!Array.isArray(value) || value.length > 0)
    ).length;
  }

  getFilterOptions(options: any) {
    if (!options) return [];
    return Object.keys(options).map(key => ({ value: key, label: options[key] }));
  }
}
