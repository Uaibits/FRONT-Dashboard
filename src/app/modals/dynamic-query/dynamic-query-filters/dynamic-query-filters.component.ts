import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {DragDropModule, CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

import {ButtonComponent} from '../../../components/form/button/button.component';
import {InputComponent} from '../../../components/form/input/input.component';
import {DropdownComponent} from '../../../components/form/dropdown/dropdown.component';
import {TextareaComponent} from '../../../components/form/textarea/textarea.component';
import {ToastService} from '../../../components/toast/toast.service';
import {DynamicQueryFiltersService} from '../../../services/dynamic-query-filters.service';
import {Utils} from '../../../services/utils.service';
import {FormErrorHandlerService} from '../../../components/form/form-error-handler.service';
import {ObjectEditorComponent} from '../../../components/form/object-editor/object-editor.component';

interface FilterType {
  value: string;
  label: string;
  description: string;
  requiresOptions: boolean;
  defaultValue: any;
}

export interface DynamicQueryFilter {
  id?: number;
  name: string;
  description?: string;
  var_name: string;
  type: string;
  default_value: any;
  required: boolean;
  order: number;
  validation_rules: any;
  visible: boolean;
  active: boolean;
  options?: any[];
}

@Component({
  selector: 'app-dynamic-query-filters',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    ButtonComponent,
    InputComponent,
    DropdownComponent,
    TextareaComponent,
    ObjectEditorComponent
  ],
  templateUrl: './dynamic-query-filters.component.html',
  styleUrl: './dynamic-query-filters.component.scss',
  standalone: true
})
export class DynamicQueryFiltersComponent implements OnInit {

  @Input() queryKey!: string;
  @Input() companyId?: number | null = null;

  filters: DynamicQueryFilter[] = [];
  filterTypes: FilterType[] = [];
  loading: boolean = false;
  showFilterForm: boolean = false;
  editingFilter: DynamicQueryFilter | null = null;

  filterForm: FormGroup;
  errors: { [key: string]: string } = {};
  variableSuggestions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private filtersService: DynamicQueryFiltersService,
    private toast: ToastService,
    private utils: Utils
  ) {
    this.filterForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      var_name: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Z][A-Z0-9_]*$/)]],
      type: ['text', [Validators.required]],
      default_value: [null],
      required: [false],
      visible: [true],
      active: [true],
      options: [null]
    });

    this.filterForm.valueChanges.subscribe(() => {
      this.errors = FormErrorHandlerService.getErrorMessages(this.filterForm);
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    await Promise.all([
      this.loadFilters(),
      this.loadFilterTypes(),
      this.loadVariableSuggestions()
    ]);
  }

  async loadFilters() {
    try {
      this.loading = true;
      const response = await this.filtersService.getFilters(this.queryKey, this.companyId);
      this.filters = response.data || [];
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao carregar filtros'));
    } finally {
      this.loading = false;
    }
  }

  async loadFilterTypes() {
    try {
      const response = await this.filtersService.getFilterTypes();
      this.filterTypes = response.data || [];
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao carregar tipos de filtro'));
    }
  }

  async loadVariableSuggestions() {
    try {
      const response = await this.filtersService.getVariableSuggestions(this.queryKey, this.companyId);
      this.variableSuggestions = response.data?.suggestions || [];
    } catch (error) {
      console.warn('Erro ao carregar sugestões de variáveis:', error);
    }
  }

  showAddFilterForm() {
    this.editingFilter = null;
    this.resetForm();
    this.showFilterForm = true;
  }

  editFilter(filter: DynamicQueryFilter) {
    this.editingFilter = filter;
    this.filterForm.patchValue({
      name: filter.name,
      description: filter.description || '',
      var_name: filter.var_name,
      type: filter.type,
      default_value: filter.default_value,
      required: filter.required,
      visible: filter.visible,
      active: filter.active,
      options: filter.options
    });
    this.showFilterForm = true;
  }

  cancelEdit() {
    this.showFilterForm = false;
    this.editingFilter = null;
    this.resetForm();
  }

  async saveFilter() {
    if (this.filterForm.invalid) {
      this.toast.error('Por favor, corrija os erros no formulário antes de salvar.');
      return;
    }

    try {
      this.loading = true;
      const formData = this.filterForm.value;

      if (this.editingFilter) {
        await this.filtersService.updateFilter(
          this.queryKey,
          this.editingFilter.var_name,
          formData,
          this.companyId
        );
        this.toast.success('Filtro atualizado com sucesso!');
      } else {
        await this.filtersService.createFilter(
          this.queryKey,
          formData,
          this.companyId
        );
        this.toast.success('Filtro criado com sucesso!');
      }

      await this.loadFilters();
      await this.loadVariableSuggestions();
      this.cancelEdit();
    } catch (error) {
      this.errors = this.utils.handleErrorsForm(error, this.filterForm);
    } finally {
      this.loading = false;
    }
  }

  async deleteFilter(filter: DynamicQueryFilter) {
    if (!confirm(`Tem certeza que deseja excluir o filtro "${filter.name}"?`)) {
      return;
    }

    try {
      this.loading = true;
      await this.filtersService.deleteFilter(this.queryKey, filter.var_name, this.companyId);
      this.toast.success('Filtro excluído com sucesso!');
      await this.loadFilters();
      await this.loadVariableSuggestions();
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao excluir filtro'));
    } finally {
      this.loading = false;
    }
  }

  async onFiltersReorder(event: CdkDragDrop<DynamicQueryFilter[]>) {
    moveItemInArray(this.filters, event.previousIndex, event.currentIndex);

    try {
      const orderedVarNames = this.filters.map(f => f.var_name);
      await this.filtersService.reorderFilters(this.queryKey, orderedVarNames, this.companyId);
      this.toast.success('Ordem dos filtros atualizada!');
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao reordenar filtros'));
      // Reverte a mudança em caso de erro
      await this.loadFilters();
    }
  }

  onTypeChange() {
    const selectedType = this.filterTypes.find(t => t.value === this.filterForm.get('type')?.value);
    if (selectedType) {
      this.filterForm.patchValue({
        default_value: selectedType.defaultValue,
        options: selectedType.requiresOptions ? [] : null
      });
    }
  }

  generateVarName(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    this.filterForm.patchValue({var_name: value});
  }

  useSuggestion(suggestion: string) {
    this.showAddFilterForm();
    this.filterForm.patchValue({
      var_name: suggestion,
      name: this.formatSuggestionAsName(suggestion)
    });
  }

  private formatSuggestionAsName(varName: string): string {
    return varName
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  private resetForm() {
    this.filterForm.reset({
      name: '',
      description: '',
      var_name: '',
      type: 'text',
      default_value: null,
      required: false,
      visible: true,
      active: true,
      options: null
    });
    this.errors = {};
  }

  get selectedFilterType(): FilterType | undefined {
    return this.filterTypes.find(t => t.value === this.filterForm.get('type')?.value);
  }

  get showOptionsField(): boolean {
    return this.selectedFilterType?.requiresOptions || false;
  }

  get hasFilters(): boolean {
    return this.filters && this.filters.length > 0;
  }

  get hasSuggestions(): boolean {
    return this.variableSuggestions && this.variableSuggestions.length > 0;
  }

  protected readonly FormErrorHandlerService = FormErrorHandlerService;
}
