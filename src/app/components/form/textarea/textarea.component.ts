import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseInputComponent } from '../base-input.component';

@Component({
  selector: 'ub-textarea',
  imports: [BaseInputComponent],
  templateUrl: './textarea.component.html',
  standalone: true,
  styleUrls: ['../base-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() error: string = '';
  @Input() success: string = '';
  @Input() helpText: string = '';
  @Input() placeholder: string = '';
  @Input() maxlength: number | undefined = undefined;
  @Input() minLength: number | undefined = undefined;
  @Input() resize: 'none' | 'both' | 'horizontal' | 'vertical' = 'vertical';
  @Input() rows: number = 3;
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() input = new EventEmitter<Event>();
  @Output() change = new EventEmitter<Event>();
  @Output() click = new EventEmitter<Event>();

  // Use um campo interno para o valor
  private _value: string = '';
  characterCount: number = 0;

  onChange: any = () => {};
  onTouched: any = () => {};

  // Getter e Setter para o valor
  get value(): string {
    return this._value;
  }

  @Input()
  set value(val: string) {
    if (val !== this._value) {
      this._value = val || '';
      this.updateCharacterCount();
      this.onChange(this._value);
      this.valueChange.emit(this._value);
    }
  }

  writeValue(value: string): void {
    this._value = value || '';
    this.updateCharacterCount();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this._value = value;
    this.updateCharacterCount();
    this.onChange(value);
    this.valueChange.emit(value);
    this.input.emit(event);
  }

  onChangeEvent(event: Event): void {
    this.change.emit(event);
  }

  onClick(event: Event): void {
    this.click.emit(event);
  }

  private updateCharacterCount(): void {
    this.characterCount = this._value ? this._value.length : 0;
  }

  get isMinLengthValid(): boolean {
    return this.minLength ? this.characterCount >= this.minLength : true;
  }

  get isMaxLengthValid(): boolean {
    return this.maxlength ? this.characterCount <= this.maxlength : true;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
