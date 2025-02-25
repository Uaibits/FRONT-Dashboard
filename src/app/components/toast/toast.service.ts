import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  isPaused?: boolean; // Indica se o Toast está pausado
  timeoutId?: any; // ID do timeout para controle
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  constructor() {}

  // Exibe um toast
  show(toast: Toast): void {
    const toasts = this.toastsSubject.value;
    toast.timeoutId = setTimeout(() => {
      this.removeToast(toast);
    }, toast.duration || 3000); // Define o timeout para remover o Toast
    toasts.push(toast);
    this.toastsSubject.next(toasts);
  }

  // Remove um toast
  removeToast(toast: Toast): void {
    if (toast.isPaused) return; // Não remove se estiver pausado
    const toasts = this.toastsSubject.value.filter((t) => t !== toast);
    this.toastsSubject.next(toasts);
  }

  // Métodos rápidos para exibir toasts
  success(message: string, duration?: number): void {
    this.show({ message, type: 'success', duration });
  }

  error(message: string, duration?: number): void {
    this.show({ message, type: 'error', duration });
  }

  warning(message: string, duration?: number): void {
    this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration?: number): void {
    this.show({ message, type: 'info', duration });
  }
}
