import {Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ServicesService} from '../../../services/services.service';
import {ToastService} from '../../../components/toast/toast.service';
import {Utils} from '../../../services/utils.service';
import {InputComponent} from '../../../components/form/input/input.component';
import {ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {TextareaComponent} from '../../../components/form/textarea/textarea.component';
import {DropdownComponent} from '../../../components/form/dropdown/dropdown.component';
import {NgForOf, NgIf} from '@angular/common';
import {MultiselectComponent} from '../../../components/form/multiselect/multiselect.component';
import {ToggleSwitchComponent} from '../../../components/form/toggle-switch/toggle-switch.component';
import {ObjectEditorComponent} from '../../../components/form/object-editor/object-editor.component';
import {CodeeditorComponent} from '../../../components/form/code-editor/code-editor.component';

interface ServiceParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue: any;
  description?: string;
  label?: string;
  options?: any[];
  validation?: any;
  placeholder?: string;
  group?: string;
  order: number;
  sensitive: boolean;
  dependsOn: string[];
  arrayItemType?: any;
}

interface ServiceParams {
  [groupName: string]: ServiceParameter[];
}

@Component({
  selector: 'app-service-parameters',
  imports: [
    InputComponent,
    ReactiveFormsModule,
    TextareaComponent,
    DropdownComponent,
    NgIf,
    NgForOf,
    MultiselectComponent,
    ToggleSwitchComponent,
    ObjectEditorComponent,
    CodeeditorComponent
  ],
  templateUrl: './service-parameters.component.html',
  standalone: true,
  styleUrl: './service-parameters.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ServiceParametersComponent),
      multi: true
    }
  ]
})
export class ServiceParametersComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() serviceSlug: string | null = null;
  @Input() companyId: number | null = null;
  @Input() disabled: boolean = false;

  form!: FormGroup;
  serviceParams: ServiceParams = {};
  loading = false;
  errors: { [key: string]: string } = {};

  // ControlValueAccessor
  private onChange = (value: any) => {
  };
  private onTouched = () => {
  };

  constructor(
    private fb: FormBuilder,
    private servicesService: ServicesService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    this.loadServiceParams();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['serviceSlug'] && !changes['serviceSlug'].firstChange) {
      this.loadServiceParams();
    }

    if (changes['disabled']) {
      if (this.disabled) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    }
  }

  get hasParameters(): boolean {
    return Object.keys(this.serviceParams).length > 0;
  }

  private async loadServiceParams() {
    if (!this.serviceSlug) {
      this.serviceParams = {};
      this.buildForm();
      return;
    }

    this.loading = true;
    try {
      const response = await this.servicesService.getServiceParams(this.serviceSlug, this.companyId);
      this.serviceParams = response.data || {};
      this.buildForm();
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao carregar parâmetros do serviço'));
      this.serviceParams = {};
      this.buildForm();
    } finally {
      this.loading = false;
    }
  }

  private buildForm() {
    const formControls: { [key: string]: any } = {};

    Object.values(this.serviceParams).flat().forEach(param => {
      const defaultValue = this.getDefaultValue(param);
      formControls[param.name] = [defaultValue, this.getValidators(param)];
    });

    this.form = this.fb.group(formControls);

    // Emitir mudanças para o ControlValueAccessor
    this.form.valueChanges.subscribe(value => {
      this.onChange(value);
    });

    if (this.disabled) {
      this.form.disable();
    }
  }

  private getDefaultValue(param: ServiceParameter): any {
    switch (param.type) {
      case 'boolean':
        return param.defaultValue ?? false;
      case 'array':
      case 'multiselect':
        return param.defaultValue ?? [];
      case 'object':
        return param.defaultValue ? JSON.stringify(param.defaultValue, null, 2) : '';
      default:
        return param.defaultValue ?? '';
    }
  }

  private getValidators(param: ServiceParameter): any[] {
    const validators = [];

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

    // Adicionar mais validadores conforme necessário
    if (param.validation) {
      // Implementar validações específicas baseadas em param.validation
    }

    return validators;
  }

  // Template methods
  getGroupNames(): string[] {
    return Object.keys(this.serviceParams).sort();
  }

  getGroupDisplayName(group: string): string {
    return group === 'general' ? 'Configurações Gerais' :
      group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' ');
  }

  trackByParamName(index: number, param: ServiceParameter): string {
    return param.name;
  }

  shouldShowParameter(param: ServiceParameter): boolean {
    if (!param.dependsOn || param.dependsOn.length === 0) {
      return true;
    }

    return param.dependsOn.every(dependency => {
      const dependencyValue = this.form.get(dependency)?.value;
      return dependencyValue !== null && dependencyValue !== undefined && dependencyValue !== '';
    });
  }

  getColumnClass(param: ServiceParameter): string {
    if (param.type === 'object' || param.type === 'array' || param.type === 'sql' || param.type === 'javascript') {
      return 'col-12';
    }
    return 'col-12 md:col-6';
  }

  isTextInput(param: ServiceParameter): boolean {
    return ['text', 'email', 'url'].includes(param.type);
  }

  getInputType(param: ServiceParameter): string {
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

  getDefaultPlaceholder(param: ServiceParameter): string {
    switch (param.type) {
      case 'email':
        return 'Digite o email';
      case 'url':
        return 'https://exemplo.com';
      case 'number':
        return 'Digite um número';
      case 'date':
        return 'dd/mm/aaaa';
      default:
        return `Digite ${this.getDefaultLabel(param.name).toLowerCase()}`;
    }
  }

  getSelectOptions(param: ServiceParameter): any[] {
    if (Array.isArray(param.options)) {
      return param.options.map(option =>
        typeof option === 'string' ?
          {label: option, value: option} :
          option
      );
    }
    return [];
  }

  getComplexFieldPlaceholder(param: ServiceParameter): string {
    if (param.type === 'object') {
      return '{\n  "chave": "valor",\n  "outra_chave": "outro_valor"\n}';
    }
    return '["item1", "item2", "item3"]';
  }

  getComplexFieldHelp(param: ServiceParameter): string {
    if (param.type === 'object') {
      return 'Digite um objeto JSON válido';
    }
    return 'Digite um array JSON válido';
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return 'Este campo é obrigatório';
      }
      // Adicionar mais tipos de erro conforme necessário
    }
    return "";
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && this.form) {
      this.form.patchValue(value, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.form) {
      if (isDisabled) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    }
  }
}
