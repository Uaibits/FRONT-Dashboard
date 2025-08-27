import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../input/input.component';
import { DropdownComponent } from '../dropdown/dropdown.component';
import { ToggleSwitchComponent } from '../toggle-switch/toggle-switch.component';
import { ButtonComponent } from '../button/button.component';
import { TextareaComponent } from '../textarea/textarea.component';
import { BaseInputComponent } from '../base-input.component';

// Interface para opções de tipo
interface TypeOption {
  label: string;
  value: string;
}

// Interface simplificada para atributos
export interface ObjectAttribute {
  name: string;
  value: any;
  type: string;
}

@Component({
  selector: 'ub-object-editor',
  standalone: true,
  imports: [
    CommonModule,
    BaseInputComponent,
    InputComponent,
    DropdownComponent,
    ToggleSwitchComponent,
    ButtonComponent,
    TextareaComponent
  ],
  templateUrl: './object-editor.component.html',
  styleUrls: ['./object-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ObjectEditorComponent),
      multi: true,
    },
  ],
})
export class ObjectEditorComponent implements ControlValueAccessor {
  @Input() label: string = 'Editor de Objeto';
  @Input() helpText: string = 'Adicione e edite propriedades do objeto';
  @Input() error: string = '';
  @Input() success: string = '';
  @Input() addButtonLabel: string = 'Adicionar Propriedade';

  @Output() valueChange = new EventEmitter<Record<string, any>>();

  // Opções de tipo para o dropdown
  typeOptions: TypeOption[] = [
    { label: 'Texto', value: 'string' },
    { label: 'Número', value: 'number' },
    { label: 'Booleano', value: 'boolean' },
    { label: 'Array', value: 'array' },
    { label: 'Objeto', value: 'object' },
    { label: 'Data', value: 'date' }
  ];

  attributes: ObjectAttribute[] = [];
  newAttributeName: string = '';
  newAttributeType: string = 'string';
  isAdding: boolean = false;

  // ControlValueAccessor methods
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: Record<string, any>): void {
    if (value && typeof value === 'object') {
      this.attributes = Object.entries(value).map(([name, val]) => ({
        name,
        value: val,
        type: this.detectType(val)
      }));
    } else {
      this.attributes = [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // Detectar o tipo de um valor
  private detectType(value: any): string {
    if (value === null || value === undefined) return 'string';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') {
      // Verificar se é uma data
      if (value instanceof Date) return 'date';
      // Verificar se é um objeto válido de data (comum em JSON)
      if (typeof value.getMonth === 'function') return 'date';
      return 'object';
    }
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'string';
  }

  // Iniciar adição de nova propriedade
  startAddAttribute(): void {
    this.isAdding = true;
    this.newAttributeName = '';
    this.newAttributeType = 'string';
  }

  // Cancelar adição
  cancelAddAttribute(): void {
    this.isAdding = false;
    this.newAttributeName = '';
    this.error = '';
  }

  // Adicionar uma nova propriedade
  addAttribute(): void {
    if (!this.newAttributeName.trim()) {
      this.error = 'O nome da propriedade é obrigatório';
      return;
    }

    const attributeName = this.newAttributeName.trim();

    // Verificar se a propriedade já existe
    if (this.attributes.some(attr => attr.name === attributeName)) {
      this.error = `A propriedade "${attributeName}" já existe`;
      return;
    }

    // Valor padrão baseado no tipo selecionado
    let defaultValue: any;
    switch (this.newAttributeType) {
      case 'number': defaultValue = 0; break;
      case 'boolean': defaultValue = false; break;
      case 'array': defaultValue = []; break;
      case 'object': defaultValue = {}; break;
      case 'date': defaultValue = new Date(); break;
      default: defaultValue = ''; break;
    }

    // Adicionar nova propriedade
    const newAttr: ObjectAttribute = {
      name: attributeName,
      value: defaultValue,
      type: this.newAttributeType
    };

    this.attributes.push(newAttr);
    this.emitValue();

    // Resetar estado
    this.isAdding = false;
    this.newAttributeName = '';
    this.error = '';
  }

  // Remover uma propriedade
  removeAttribute(index: number): void {
    this.attributes.splice(index, 1);
    this.emitValue();
  }

  // Atualizar o valor de uma propriedade
  updateAttributeValue(index: number, value: any): void {
    this.attributes[index].value = value;
    this.emitValue();
  }

  // Atualizar o tipo de uma propriedade
  updateAttributeType(index: number, type: string): void {
    // Se o tipo mudou, ajustar o valor para o padrão do novo tipo
    if (this.attributes[index].type !== type) {
      let defaultValue: any;
      switch (type) {
        case 'number': defaultValue = 0; break;
        case 'boolean': defaultValue = false; break;
        case 'array': defaultValue = []; break;
        case 'object': defaultValue = {}; break;
        case 'date': defaultValue = new Date(); break;
        default: defaultValue = ''; break;
      }
      this.attributes[index].value = defaultValue;
    }

    this.attributes[index].type = type;
    this.emitValue();
  }

  // Atualizar o nome de uma propriedade
  updateAttributeName(index: number, name: string): void {
    const newName = name.trim();

    if (!newName) {
      this.error = 'O nome da propriedade não pode estar vazio';
      return;
    }

    // Verificar se o novo nome já existe (exceto para a própria propriedade)
    if (this.attributes.some((attr, i) => i !== index && attr.name === newName)) {
      this.error = `A propriedade "${newName}" já existe`;
      return;
    }

    this.attributes[index].name = newName;
    this.emitValue();
    this.error = '';
  }

  // Emitir o valor atualizado
  private emitValue(): void {
    const result: Record<string, any> = {};

    this.attributes.forEach(attr => {
      if (attr.name) { // Apenas adicionar propriedades com nome válido
        result[attr.name] = attr.value;
      }
    });

    this.onChange(result);
    this.valueChange.emit(result);
  }

  // Obter o tipo de input para uma propriedade
  getInputType(attribute: ObjectAttribute): string {
    switch (attribute.type) {
      case 'number': return 'number';
      case 'date': return 'date';
      default: return 'text';
    }
  }

  // Obter placeholder para o campo de valor
  getValuePlaceholder(type: string): string {
    switch (type) {
      case 'string': return 'Digite o texto';
      case 'number': return 'Digite o número';
      case 'date': return 'Selecione a data';
      case 'array': return 'Ex: ["item1", "item2"]';
      case 'object': return 'Ex: {"chave": "valor"}';
      default: return 'Digite o valor';
    }
  }

  // Verificar se é um campo de texto simples
  isTextInput(attribute: ObjectAttribute): boolean {
    return ['string', 'number', 'date'].includes(attribute.type);
  }

  // Verificar se é um campo de textarea (para arrays/objetos)
  isTextareaInput(attribute: ObjectAttribute): boolean {
    return ['array', 'object'].includes(attribute.type);
  }

  // Formatar valor para exibição em textarea
  formatValueForDisplay(value: any): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return JSON.stringify(value, null, 2);
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  // Converter valor de string para o tipo apropriado
  parseInputValue(type: string, value: string): any {
    if (!value) {
      switch (type) {
        case 'number': return 0;
        case 'boolean': return false;
        case 'array': return [];
        case 'object': return {};
        case 'date': return new Date();
        default: return '';
      }
    }

    switch (type) {
      case 'number':
        const num = Number(value);
        return isNaN(num) ? 0 : num;

      case 'boolean':
        return value.toLowerCase() === 'true';

      case 'array':
        try {
          return JSON.parse(value);
        } catch {
          // Tentar interpretar como lista separada por vírgulas
          return value.split(',').map(item => item.trim()).filter(item => item);
        }

      case 'object':
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }

      case 'date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? new Date() : date;

      default:
        return value;
    }
  }
}
