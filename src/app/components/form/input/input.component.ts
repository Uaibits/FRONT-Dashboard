import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIf } from '@angular/common';
import {BaseInputComponent} from '../base-input.component';
import {FormErrorHandlerService} from '../form-error-handler.service';

@Component({
  selector: 'ub-input',
  imports: [
    BaseInputComponent
  ],
  templateUrl: './input.component.html',
  standalone: true,
  styleUrls: [
    '../base-input.component.scss'
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {

  @Input() label: string = '';
  @Input() helpText: string = '';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() value: string = '';
  @Input() error: string = '';
  @Input() success: string = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() blur = new EventEmitter<FocusEvent>();
  @Output() input = new EventEmitter<Event>();
  @Output() change = new EventEmitter<Event>();
  @Output() click = new EventEmitter<Event>();

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

  onBlur($event: FocusEvent) {
    this.onTouched();
    this.blur.emit($event);
  }
}
