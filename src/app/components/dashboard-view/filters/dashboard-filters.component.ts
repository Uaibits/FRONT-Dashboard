import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {InputComponent} from '../../form/input/input.component';
import {DropdownComponent} from '../../form/dropdown/dropdown.component';
import {MultiselectComponent} from '../../form/multiselect/multiselect.component';
import {ToggleSwitchComponent} from '../../form/toggle-switch/toggle-switch.component';
import {ButtonComponent} from '../../form/button/button.component';

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
  templateUrl: './dashboard-filters.component.html',
  styleUrls: ['./dashboard-filters.component.scss']
})
export class DashboardFiltersComponent implements OnInit, OnChanges {
  @Input() filters: any[] = [];
  @Input() filterValues: { [key: string]: any } = {};
  @Input() loading: boolean = false;
  @Input() collapsed: boolean = false;
  @Input() dashboardKey: string = 'default';

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() apply = new EventEmitter<any>();
  @Output() clear = new EventEmitter<void>();
  @Output() filterValuesChange = new EventEmitter<{ [key: string]: any }>();

  localFilterValues: { [key: string]: any } = {};
  modalOpen: boolean = false;
  isMobile: boolean = false;
  saveFiltersEnabled: boolean = true;

  private readonly STORAGE_KEY = 'dashboard_filters_all';
  private readonly STORAGE_ENABLED_KEY = 'dashboard_filters_enabled';
  private mobileBreakpoint: number = 768;

  ngOnInit() {
    this.checkMobile();
    this.loadSavePreference();
    this.loadSavedFilters();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterValues'] && !changes['filterValues'].firstChange) {
      this.initializeLocalValues();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  private checkMobile() {
    this.isMobile = window.innerWidth < this.mobileBreakpoint;
  }

  private initializeLocalValues() {
    this.localFilterValues = { ...this.filterValues };
  }

  // === STORAGE ===

  private loadSavePreference() {
    try {
      const saved = localStorage.getItem(this.STORAGE_ENABLED_KEY);
      this.saveFiltersEnabled = saved !== null ? JSON.parse(saved) : true;
    } catch (error) {
      console.error('Erro ao carregar preferência:', error);
      this.saveFiltersEnabled = true;
    }
  }

  private loadSavedFilters() {
    if (!this.saveFiltersEnabled) {
      this.initializeLocalValues();
      return;
    }

    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const allFilters = JSON.parse(saved);
        if (allFilters[this.dashboardKey]) {
          this.localFilterValues = allFilters[this.dashboardKey];
          this.applyFilters();
        } else {
          this.initializeLocalValues();
        }
      } else {
        this.initializeLocalValues();
      }
    } catch (error) {
      console.error('Erro ao carregar filtros:', error);
      this.initializeLocalValues();
    }
  }

  private saveFiltersToStorage() {
    if (!this.saveFiltersEnabled) return;

    try {
      let allFilters: any = {};

      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        allFilters = JSON.parse(saved);
      }

      allFilters[this.dashboardKey] = { ...this.localFilterValues };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allFilters));
    } catch (error) {
      console.error('Erro ao salvar filtros:', error);
    }
  }

  private clearSavedFilters() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const allFilters = JSON.parse(saved);
        delete allFilters[this.dashboardKey];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allFilters));
      }
    } catch (error) {
      console.error('Erro ao limpar filtros:', error);
    }
  }

  onSaveFiltersToggle(enabled: boolean) {
    this.saveFiltersEnabled = enabled;

    try {
      localStorage.setItem(this.STORAGE_ENABLED_KEY, JSON.stringify(enabled));

      if (enabled) {
        this.saveFiltersToStorage();
      } else {
        this.clearSavedFilters();
      }
    } catch (error) {
      console.error('Erro ao atualizar preferência:', error);
    }
  }

  // === AÇÕES ===

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  clearFilters() {
    this.localFilterValues = {};

    if (this.saveFiltersEnabled) {
      this.clearSavedFilters();
    }

    this.clear.emit();
    this.filterValuesChange.emit({});
  }

  applyFilters() {
    if (this.areRequiredFiltersFilled()) {
      if (this.saveFiltersEnabled) {
        this.saveFiltersToStorage();
      }

      this.apply.emit({ ...this.localFilterValues });
      this.filterValuesChange.emit({ ...this.localFilterValues });

      if (this.isMobile && this.modalOpen) {
        this.closeModal();
      }
    }
  }

  openModal() {
    this.modalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.modalOpen = false;
    document.body.style.overflow = '';
  }

  onValueChange(key: string, value: any) {
    this.localFilterValues[key] = value;
  }

  // === VALIDAÇÃO ===

  areRequiredFiltersFilled(): boolean {
    const requiredFilters = this.filters.filter(f => f.required);

    return requiredFilters.every(filter => {
      const value = this.localFilterValues[filter.var_name];

      if (filter.type === 'boolean') {
        return value !== null && value !== undefined;
      }

      if (value === null || value === undefined || value === '') {
        return false;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return true;
    });
  }

  hasActiveFilters(): boolean {
    return Object.values(this.filterValues || {}).some(value =>
      value !== null && value !== undefined && value !== '' &&
      (!Array.isArray(value) || value.length > 0)
    );
  }

  countActiveFilters(): number {
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
