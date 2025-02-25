import {Component, Input, ViewEncapsulation} from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'ub-base-input',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="input-container">
      <label *ngIf="label">{{ label }}</label>
      <ng-content></ng-content> <!-- Aqui o input específico será projetado -->
      <small *ngIf="helpText" class="help">{{ helpText }}</small>
      <div *ngIf="error" class="feedback error">{{ error }}</div>
      <div *ngIf="success" class="feedback success">{{ success }}</div>
    </div>
  `,
  styleUrls: ['base-input.component.scss'], // Usando o SCSS global
  encapsulation: ViewEncapsulation.None
})
export class BaseInputComponent {
  @Input() label: string = '';
  @Input() helpText: string = '';
  @Input() error: string = '';
  @Input() success: string = '';
}
