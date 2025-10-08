import { Component } from '@angular/core';
import { Toast, ToastService } from './toast.service';
import {AsyncPipe, NgClass} from '@angular/common';

@Component({
  selector: 'ub-toast',
  imports: [AsyncPipe, NgClass],
  templateUrl: './toast.component.html',
  standalone: true,
  styleUrl: './toast.component.scss'
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  // Retorna a classe CSS com base no tipo de toast
  getToastClass(toast: Toast): string {
    return `toast toast-${toast.type} ${toast.isPaused ? 'toast-paused' : ''}`;
  }

  // Retorna o ícone apropriado para cada tipo
  getIconClass(type: string): string {
    const icons = {
      success: 'bx-check-circle',
      error: 'bx-x-circle',
      warning: 'bx-error-circle',
      info: 'bx-info-circle'
    };
    return icons[type as keyof typeof icons] || 'bx-info-circle';
  }

  // Pausa o desaparecimento do Toast quando o mouse está sobre ele
  onMouseEnter(toast: Toast): void {
    this.toastService.pauseToast(toast.id);
  }

  // Retoma o desaparecimento do Toast quando o mouse sai dele
  onMouseLeave(toast: Toast): void {
    this.toastService.resumeToast(toast.id);
  }

  // Remove o toast ao clicar
  onClick(toast: Toast): void {
    this.toastService.removeToast(toast.id);
  }
}
