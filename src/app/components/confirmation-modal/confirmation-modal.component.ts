import { Component } from '@angular/core';
import {ConfirmationService} from './confirmation-modal.service';
import {NgIf} from '@angular/common';
import {ButtonComponent} from '../form/button/button.component';

@Component({
  selector: 'ub-confirmation-modal',
  imports: [
    NgIf,
    ButtonComponent
  ],
  templateUrl: './confirmation-modal.component.html',
  standalone: true,
  styleUrl: './confirmation-modal.component.scss'
})
export class ConfirmationModalComponent {

  isVisible = false;
  message: string = 'Você deseja prosseguir com essa ação?';
  acceptText: string = 'Confirmar';
  cancelText: string = 'Cancelar';

  constructor(private confirmationService: ConfirmationService) {
    this.confirmationService.showModal$.subscribe((config) => {
      if (config) {
        this.message = config.message;
        this.acceptText = config.acceptText;
        this.cancelText = config.cancelText;
        this.isVisible = true;
      } else {
        this.isVisible = false;
      }
    });
  }

  onAccept() {
    this.confirmationService.accept();
  }

  onCancel() {
    this.confirmationService.cancel();
  }

}
