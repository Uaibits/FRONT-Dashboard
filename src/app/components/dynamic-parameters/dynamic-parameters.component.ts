import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChildren, QueryList} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ToastService} from '../toast/toast.service';
import {Utils} from '../../services/utils.service';
import {ButtonComponent} from '../form/button/button.component';
import {CodeeditorComponent} from '../form/code-editor/code-editor.component';
import {DropdownComponent} from '../form/dropdown/dropdown.component';
import {InputComponent} from '../form/input/input.component';
import {MultiselectComponent} from '../form/multiselect/multiselect.component';
import {ObjectEditorComponent} from '../form/object-editor/object-editor.component';
import {TextareaComponent} from '../form/textarea/textarea.component';
import {ToggleSwitchComponent} from '../form/toggle-switch/toggle-switch.component';
import {ColumnMappingComponent} from '../column-mapping/column-mapping.component';
import {SeriesConfigComponent} from '../series-config/series-config.component';
import {ColorPickerComponent} from '../color-picker/color-picker.component';
import {OauthConnectComponent} from './ub-oauth-connect.component';
import {DynamicSelectComponent} from './ub-dynamic-select.component';

export interface DynamicParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue: any;
  description?: string;
  label?: string;
  options?: any;
  validation?: any;
  placeholder?: string;
  group?: string;
  order: number;
  sensitive: boolean;
  dependsOn?: string[] | { [key: string]: any };
  arrayItemType?: any;
  url?: string;
  listPath?: string;
  fieldValue?: string;
  fieldLabel?: string;
  reloadTriggers?: string[]; // Novo: lista de campos que disparam reload
}

export interface DynamicParams {
  [groupName: string]: DynamicParameter[];
}

@Component({
  selector: 'ub-dynamic-parameters',
  imports: [
    ButtonComponent,
    CodeeditorComponent,
    DropdownComponent,
    FormsModule,
    InputComponent,
    MultiselectComponent,
    ObjectEditorComponent,
    TextareaComponent,
    ToggleSwitchComponent,
    ColorPickerComponent,
    SeriesConfigComponent,
    ColumnMappingComponent,
    OauthConnectComponent,
    DynamicSelectComponent,
    ReactiveFormsModule
  ],
  templateUrl: './dynamic-parameters.component.html',
  standalone: true,
  styleUrl: './dynamic-parameters.component.scss'
})
export class DynamicParametersComponent implements OnInit, OnChanges {

  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() errors: { [key: string]: string } = {};
  @Input({required: true}) dynamicParams!: DynamicParams;
  @Input() paramsValue: any = {};
  @Input() submitButtonText: string = 'Salvar';
  @Input() integrationName?: string;

  @Output() save = new EventEmitter<any>();
  @Output() formChange = new EventEmitter<any>();
  @Output() formValid = new EventEmitter<boolean>();

  @ViewChildren(DynamicSelectComponent) dynamicSelects!: QueryList<DynamicSelectComponent>;

  form!: FormGroup;
  private previousFormValues: any = {};

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private utils: Utils
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dynamicParams'] && !changes['dynamicParams'].firstChange) {
      this.buildForm();
    }

    if (changes['paramsValue']) {
      this.paramsValue = changes['paramsValue'].currentValue || {};
      this.buildForm();
    }

    if (changes['disabled']) {
      this.updateFormState();
    }
  }

  get hasParameters(): boolean {
    return Object.keys(this.dynamicParams || {}).length > 0;
  }

  get showSubmitButton() {
    return this.save.observed;
  }

  get formValue(): any {
    return this.form.value;
  }

  get isFormValid(): boolean {
    return this.form.valid;
  }

  private buildForm() {
    if (!this.dynamicParams) {
      this.form = this.fb.group({});
      return;
    }

    const formControls: { [key: string]: any } = {};

    Object.values(this.dynamicParams).flat().forEach(param => {
      if (param.type === 'oauth_connect') return;
      const defaultValue = this.getDefaultValue(param);
      formControls[param.name] = [defaultValue, this.getValidators(param)];
    });

    this.form = this.fb.group(formControls);
    this.setupFormSubscriptions();
    this.updateFormValues();
    this.updateFormState();
  }

  private setupFormSubscriptions() {
    this.form.valueChanges.subscribe(value => {
      this.formChange.emit(value);
      this.handleReloadTriggers(value);
    });

    this.form.statusChanges.subscribe(status => {
      this.formValid.emit(status === 'VALID');
    });
  }

  /**
   * Verifica se algum campo que é trigger de reload foi alterado
   * e dispara o reload dos dynamic_selects correspondentes
   */
  private handleReloadTriggers(currentFormValues: any) {
    if (!this.dynamicSelects || this.dynamicSelects.length === 0) {
      return;
    }

    // Procura por parâmetros dynamic_select que têm reloadTriggers
    Object.values(this.dynamicParams).flat().forEach(param => {
      if (param.type === 'dynamic_select' && param.reloadTriggers && param.reloadTriggers.length > 0) {
        // Verifica se algum dos triggers foi alterado
        const shouldReload = param.reloadTriggers.some(triggerField => {
          const previousValue = this.previousFormValues[triggerField];
          const currentValue = currentFormValues[triggerField];

          // Verifica se houve mudança significativa
          if (previousValue !== currentValue) {
            // Para OAuth, verifica se foi de false para true (conectou)
            if (triggerField.includes('oauth') && currentValue === true && previousValue !== true) {
              return true;
            }
            // Para outros campos, qualquer mudança dispara
            if (!triggerField.includes('oauth') && currentValue) {
              return true;
            }
          }
          return false;
        });

        if (shouldReload) {
          // Encontra o componente dynamic-select correspondente e recarrega
          const selectComponent = this.dynamicSelects.find(
            ds => ds.label === (param.label || this.getDefaultLabel(param.name))
          );

          if (selectComponent) {
            console.log(`Recarregando ${param.name} devido a mudança em triggers:`, param.reloadTriggers);

            // Limpa o valor atual antes de recarregar
            this.form.patchValue({ [param.name]: '' }, { emitEvent: false });

            // Dispara reload após um pequeno delay para garantir que a API tenha os dados atualizados
            setTimeout(() => {
              selectComponent.reload();
            }, 300);
          }
        }
      }
    });

    // Atualiza os valores anteriores para próxima comparação
    this.previousFormValues = { ...currentFormValues };
  }

  private updateFormValues() {
    if (this.paramsValue && this.form) {
      this.form.patchValue(this.paramsValue, {emitEvent: false});
      this.previousFormValues = { ...this.paramsValue };
    } else {
      this.form.reset({});
      this.previousFormValues = {};
    }
  }

  private updateFormState() {
    if (this.form) {
      if (this.disabled) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    }
  }

  private getDefaultValue(param: DynamicParameter): any {
    switch (param.type) {
      case 'boolean':
        return param.defaultValue ?? false;
      case 'oauth_connect':
        return false;
      case 'array':
      case 'multiselect':
      case 'column_mapping':
      case 'series_config':
        return param.defaultValue ?? [];
      case 'object':
        return param.defaultValue ? param.defaultValue : {};
      case 'dynamic_select':
        return param.defaultValue ?? '';
      default:
        return param.defaultValue ?? '';
    }
  }

  private getValidators(param: DynamicParameter): any[] {
    const validators: any[] = [];

    if (param.type === 'oauth_connect') {
      return validators;
    }

    if (param.required) {
      validators.push((control: any) => {
        const value = control.value;
        if (value === null || value === undefined || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
          return {required: true};
        }
        return null;
      });
    }

    if (param.validation) {
      if (param.validation.min !== undefined) {
        validators.push((control: any) => {
          const value = control.value;
          if (value !== null && value !== undefined && value < param.validation.min) {
            return {min: {min: param.validation.min, actual: value}};
          }
          return null;
        });
      }

      if (param.validation.max !== undefined) {
        validators.push((control: any) => {
          const value = control.value;
          if (value !== null && value !== undefined && value > param.validation.max) {
            return {max: {max: param.validation.max, actual: value}};
          }
          return null;
        });
      }
    }

    return validators;
  }

  getGroupNames(): string[] {
    if (!this.dynamicParams) return [];
    return Object.keys(this.dynamicParams).sort();
  }

  getGroupDisplayName(group: string): string {
    return group === 'general' ? 'Configurações Gerais' :
      group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' ');
  }

  shouldShowParameter(param: DynamicParameter): boolean {
    if (!param.dependsOn) {
      return true;
    }

    if (Array.isArray(param.dependsOn)) {
      return param.dependsOn.every(dependency => {
        const dependencyValue = this.form.get(dependency)?.value;
        return dependencyValue !== null && dependencyValue !== undefined && dependencyValue !== '' && dependencyValue !== false;
      });
    }

    if (typeof param.dependsOn === 'object') {
      return Object.entries(param.dependsOn).every(([key, expectedValue]) => {
        const actualValue = this.form.get(key)?.value;
        return actualValue === expectedValue;
      });
    }

    return true;
  }

  getColumnClass(param: DynamicParameter): string {
    if (['object', 'array', 'sql', 'javascript', 'column_mapping', 'series_config', 'oauth_connect', 'dynamic_select'].includes(param.type)) {
      return 'col-12';
    }
    if (param.type === 'color') {
      return 'col-12 md:col-4';
    }
    return 'col-12 md:col-6';
  }

  isTextInput(param: DynamicParameter): boolean {
    return ['text', 'email', 'url'].includes(param.type);
  }

  getInputType(param: DynamicParameter): string {
    switch (param.type) {
      case 'email':
        return 'email';
      case 'url':
        return 'url';
      case 'text':
      default:
        return 'text';
    }
  }

  getDefaultLabel(name: string): string {
    return name.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getDefaultPlaceholder(param: DynamicParameter): string {
    switch (param.type) {
      case 'email':
        return 'Digite o email';
      case 'url':
        return 'https://exemplo.com';
      case 'number':
        return 'Digite um número';
      case 'date':
        return 'dd/mm/aaaa';
      case 'dynamic_select':
        return 'Selecione uma opção';
      default:
        return `Digite ${this.getDefaultLabel(param.name).toLowerCase()}`;
    }
  }

  getSelectOptions(param: DynamicParameter): any[] {
    if (Array.isArray(param.options)) {
      return param.options.map(option =>
        typeof option === 'string' ?
          {label: option, value: option} :
          option
      );
    }

    if (param.options && typeof param.options === 'object') {
      return Object.keys(param.options).map(key => ({
        label: param.options[key],
        value: key
      }));
    }

    return [];
  }

  getComplexFieldPlaceholder(param: DynamicParameter): string {
    if (param.type === 'object') {
      return '{\n  "chave": "valor",\n  "outra_chave": "outro_valor"\n}';
    }
    if (param.type === 'column_mapping') {
      return '[\n  {"source": "coluna1", "target": "destino1"},\n  {"source": "coluna2", "target": "destino2"}\n]';
    }
    if (param.type === 'series_config') {
      return '[\n  {"name": "Série 1", "column": "valor1", "color": "#008FFB"},\n  {"name": "Série 2", "column": "valor2", "color": "#00E396"}\n]';
    }
    return '["item1", "item2", "item3"]';
  }

  getComplexFieldHelp(param: DynamicParameter): string {
    if (param.type === 'object') {
      return 'Digite um objeto JSON válido';
    }
    if (param.type === 'column_mapping') {
      return 'Configure o mapeamento de colunas (formato JSON)';
    }
    if (param.type === 'series_config') {
      return 'Configure as séries do gráfico (formato JSON)';
    }
    return 'Digite um array JSON válido';
  }

  getFieldError(fieldName: string): string {
    if (this.errors[fieldName]) {
      return this.errors[fieldName];
    }

    const control = this.form.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return 'Este campo é obrigatório';
      }
      if (control.errors?.['email']) {
        return 'Email inválido';
      }
      if (control.errors?.['url']) {
        return 'URL inválida';
      }
      if (control.errors?.['min']) {
        return `O valor mínimo é ${control.errors['min'].min}`;
      }
      if (control.errors?.['max']) {
        return `O valor máximo é ${control.errors['max'].max}`;
      }
    }
    return '';
  }

  getOAuthProvider(param: DynamicParameter): string {
    return param.validation?.provider || 'oauth';
  }

  onOAuthDisconnected(param: DynamicParameter) {
    const dependentFields = Object.values(this.dynamicParams)
      .flat()
      .filter(p => p.dependsOn && Array.isArray(p.dependsOn) && p.dependsOn.includes(param.name));

    dependentFields.forEach(field => {
      this.form.patchValue({ [field.name]: this.getDefaultValue(field) });
    });

    this.toast.info('Desconectado. Campos dependentes foram limpos.');
  }

  onSubmit() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });

      this.toast.error('Por favor, corrija os erros no formulário antes de enviar.');
      return;
    }

    this.save.emit(this.form.value);
  }

  public resetForm(): void {
    this.form.reset();
    this.updateFormValues();
    this.previousFormValues = {};
  }

  public markAllAsTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  public patchValue(value: any): void {
    this.form.patchValue(value);
  }
}
