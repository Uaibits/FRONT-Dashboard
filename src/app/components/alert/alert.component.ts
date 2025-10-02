import {Component, input, Input} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'ub-alert',
  imports: [
    NgClass
  ],
  templateUrl: './alert.component.html',
  standalone: true,
  styleUrl: './alert.component.scss'
})
export class AlertComponent {

  @Input() type: 'success' | 'info' | 'warning' | 'danger' = 'info';
  @Input() closable: boolean = true;

  getIconClass(): string {
    switch (this.type) {
      case 'success':
        return 'bx-check-circle';
      case 'info':
        return 'bx-info-circle';
      case 'warning':
        return 'bx-error';
      case 'danger':
        return 'bx-x-circle';
      default:
        return 'bx-bell';
    }
  }

  onClose() {
    const el = (event?.target as HTMLElement)?.closest('.alert');
    if (el) {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 200);
    }
  }

}
