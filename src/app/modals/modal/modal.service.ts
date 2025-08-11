import { Injectable, ComponentRef, ViewContainerRef, Type } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import {ModalComponent} from './modal.component';

export interface ModalConfig {
  title: string;
  component: Type<any>;
  data?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  backdrop?: boolean;
  keyboard?: boolean;
  className?: string;
}

export interface ModalRef {
  close: (result?: any) => void;
  dismiss: (reason?: any) => void;
  result: Observable<any>;
  dismissed: Observable<any>;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private viewContainer!: ViewContainerRef;
  private activeModals: ComponentRef<ModalComponent>[] = [];

  setRootViewContainer(viewContainer: ViewContainerRef) {
    this.viewContainer = viewContainer;
  }

  open(config: ModalConfig): ModalRef {
    if (!this.viewContainer) {
      throw new Error('ViewContainer não configurado. Chame setRootViewContainer primeiro.');
    }

    // Criar o componente modal
    const modalComponentRef = this.viewContainer.createComponent(ModalComponent);

    // Configurar o modal
    modalComponentRef.instance.config = {
      closable: true,
      backdrop: true,
      keyboard: true,
      size: 'xl',
      ...config
    };

    // Criar o componente de conteúdo
    const contentComponentRef = modalComponentRef.instance.contentContainer.createComponent(config.component);

    // Passar dados para o componente de conteúdo se existir
    if (config.data) {
      Object.keys(config.data).forEach(key => {
        if (contentComponentRef.instance.hasOwnProperty(key)) {
          contentComponentRef.instance[key] = config.data[key];
        }
      });
    }

    // Criar subject para resultados
    const resultSubject = new Subject<any>();
    const dismissedSubject = new Subject<any>();

    // Criar referência do modal
    const modalRef: ModalRef = {
      close: (result?: any) => {
        resultSubject.next(result);
        resultSubject.complete();
        this.destroyModal(modalComponentRef);
      },
      dismiss: (reason?: any) => {
        dismissedSubject.next(reason);
        dismissedSubject.complete();
        this.destroyModal(modalComponentRef);
      },
      result: resultSubject.asObservable(),
      dismissed: dismissedSubject.asObservable()
    };

    // Configurar eventos do modal
    modalComponentRef.instance.closeModal.subscribe(() => {
      modalRef.dismiss('close');
    });

    modalComponentRef.instance.backdropClick.subscribe(() => {
      if (modalComponentRef.instance.config.backdrop) {
        modalRef.dismiss('backdrop');
      }
    });

    // Injetar modalRef no componente de conteúdo se ele aceitar
    if (contentComponentRef.instance.hasOwnProperty('modalRef')) {
      contentComponentRef.instance.modalRef = modalRef;
    }

    // Adicionar à lista de modais ativos
    this.activeModals.push(modalComponentRef);

    return modalRef;
  }

  private destroyModal(modalComponentRef: ComponentRef<ModalComponent>) {
    const index = this.activeModals.indexOf(modalComponentRef);
    if (index > -1) {
      this.activeModals.splice(index, 1);
    }
    modalComponentRef.destroy();
  }

  closeAll() {
    this.activeModals.forEach(modal => {
      modal.destroy();
    });
    this.activeModals = [];
  }

  hasOpenModals(): boolean {
    return this.activeModals.length > 0;
  }
}
