import {
  Component,
  ViewChild,
  ViewContainerRef,
  Output,
  EventEmitter,
  HostListener,
  OnInit,
  OnDestroy,
  ElementRef
} from '@angular/core';
import { ModalConfig } from './modal.service';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-modal',
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-container" [ngClass]="getModalClasses()" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">{{ config.title }}</h3>
          @if (config.closable) {
            <button
              type="button"
              class="modal-close-btn"
              (click)="onClose()"
              aria-label="Fechar modal">
              <i class="bx bx-x"></i>
            </button>
          }
        </div>

        <div class="modal-body">
          <ng-container #contentContainer></ng-container>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    NgClass
  ],
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {
  @ViewChild('contentContainer', { read: ViewContainerRef, static: true })
  contentContainer!: ViewContainerRef;

  @Output() closeModal = new EventEmitter<void>();
  @Output() backdropClick = new EventEmitter<void>();

  config!: ModalConfig;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Adicionar classe ao body para prevenir scroll
    document.body.classList.add('modal-open');

    // Focar no modal para acessibilidade
    setTimeout(() => {
      this.elementRef.nativeElement.focus();
    }, 100);
  }

  ngOnDestroy() {
    // Remover classe do body
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.config.keyboard && event.key === 'Escape') {
      this.onClose();
    }
  }

  onClose() {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent) {
    this.backdropClick.emit();
  }

  getModalClasses(): string {
    const classes = [`modal-${this.config.size || 'xl'}`];

    if (this.config.className) {
      classes.push(this.config.className);
    }

    return classes.join(' ');
  }
}
