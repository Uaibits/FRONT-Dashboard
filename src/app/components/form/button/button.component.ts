import {Component, HostBinding, Input} from '@angular/core';
import {NgIf} from '@angular/common';
import {BaseInputComponent} from '../base-input.component';

@Component({
  selector: 'ub-button',
  imports: [
    NgIf,
    BaseInputComponent
  ],
  templateUrl: './button.component.html',
  standalone: true,
  styleUrl: './button.component.scss'
})
export class ButtonComponent {

  @Input() severity: 'primary' | 'danger' | 'success' | 'warning' | 'info' = 'primary';
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() icon: string | undefined; // Ícone opcional (ex: 'bx-check')

  @HostBinding('attr.disabled')
  get isDisabled(): boolean | null {
    return this.loading ? true : null;
  }

  get buttonClass(): string {
    return `btn btn-${this.severity}`;
  }

}
