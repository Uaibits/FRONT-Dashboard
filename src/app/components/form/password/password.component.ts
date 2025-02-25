import {Component, EventEmitter, forwardRef, Input, Output} from '@angular/core';
import {BaseInputComponent} from '../base-input.component';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'ub-password',
  imports: [
    BaseInputComponent
  ],
  templateUrl: './password.component.html',
  standalone: true,
  styleUrls: ['./password.component.scss', '../base-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordComponent),
      multi: true,
    },
  ],
})
export class PasswordComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() helpText: string = '';
  @Input() placeholder: string = '';
  @Input() value: string = '';
  @Input() error: string = '';
  @Input() success: string = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() input = new EventEmitter<Event>();
  @Output() change = new EventEmitter<Event>();
  @Output() click = new EventEmitter<Event>();

  showPassword: boolean = false; // Controla a visibilidade da senha
  inputType: string = 'password'; // Tipo do input (password/text)

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
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

  // Alterna a visibilidade da senha
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.inputType = this.showPassword ? 'text' : 'password';
  }
}
