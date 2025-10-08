import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  isPaused?: boolean;
  timeoutId?: any;
  progressWidth?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private maxToasts = 5; // Máximo de toasts visíveis

  constructor() {}

  // Exibe um toast com sistema de fila
  show(toast: Omit<Toast, 'id'>): void {
    const newToast: Toast = {
      ...toast,
      id: this.generateId(),
      progressWidth: 100
    };

    const toasts = this.toastsSubject.value;

    // Remove o toast mais antigo se exceder o limite
    if (toasts.length >= this.maxToasts) {
      const oldestToast = toasts[0];
      this.removeToast(oldestToast.id);
    }

    // Inicia o timeout para remover o toast
    this.startTimeout(newToast);

    toasts.push(newToast);
    this.toastsSubject.next([...toasts]);
  }

  // Inicia o timeout para remover o toast
  private startTimeout(toast: Toast): void {
    const duration = toast.duration || 5000;
    toast.timeoutId = setTimeout(() => {
      this.removeToast(toast.id);
    }, duration);
  }

  // Pausa o toast
  pauseToast(id: string): void {
    const toasts = this.toastsSubject.value;
    const toast = toasts.find(t => t.id === id);
    if (toast && !toast.isPaused) {
      toast.isPaused = true;
      clearTimeout(toast.timeoutId);
      this.toastsSubject.next([...toasts]);
    }
  }

  // Retoma o toast
  resumeToast(id: string): void {
    const toasts = this.toastsSubject.value;
    const toast = toasts.find(t => t.id === id);
    if (toast && toast.isPaused) {
      toast.isPaused = false;
      this.startTimeout(toast);
      this.toastsSubject.next([...toasts]);
    }
  }

  // Remove um toast pelo ID
  removeToast(id: string): void {
    const toasts = this.toastsSubject.value;
    const toast = toasts.find(t => t.id === id);

    if (toast) {
      clearTimeout(toast.timeoutId);
      const filteredToasts = toasts.filter(t => t.id !== id);
      this.toastsSubject.next(filteredToasts);
    }
  }

  // Gera um ID único para o toast
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

  // Limpa todos os toasts
  clear(): void {
    const toasts = this.toastsSubject.value;
    toasts.forEach(toast => clearTimeout(toast.timeoutId));
    this.toastsSubject.next([]);
  }
}
