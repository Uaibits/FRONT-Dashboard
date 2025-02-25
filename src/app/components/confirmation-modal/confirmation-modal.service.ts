import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationService {
  // Permite null como valor
  private showModalSubject = new Subject<{
    message: string;
    acceptText: string;
    cancelText: string;
  } | null>();
  private userResponseSubject = new Subject<boolean>();

  showModal$ = this.showModalSubject.asObservable();
  userResponse$ = this.userResponseSubject.asObservable();

  // Exibe o modal com mensagem e textos personalizados
  confirm(
    message: string = 'Você deseja prosseguir com essa ação?',
    acceptText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ) {
    this.showModalSubject.next({ message, acceptText, cancelText });
    return this.userResponse$; // Retorna um Observable para a resposta do usuário
  }

  // Métodos para o componente modal notificar a resposta do usuário
  accept() {
    this.userResponseSubject.next(true);
    this.showModalSubject.next(null); // Fecha o modal
  }

  cancel() {
    this.userResponseSubject.next(false);
    this.showModalSubject.next(null); // Fecha o modal
  }
}
