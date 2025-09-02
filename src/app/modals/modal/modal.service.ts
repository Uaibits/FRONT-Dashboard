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

  open<T = any>(config: ModalConfig): Promise<T | undefined> {
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

    // Passar dados
    if (config.data) {
      Object.keys(config.data).forEach(key => {
        if (contentComponentRef.instance.hasOwnProperty(key)) {
          contentComponentRef.instance[key] = config.data[key];
        }
      });
    }

    // Promise de retorno
    return new Promise<T | undefined>((resolve, reject) => {
      const close = (result?: T) => {
        resolve(result);
        this.destroyModal(modalComponentRef);
      };

      const dismiss = (reason?: any) => {
        resolve(undefined);
        this.destroyModal(modalComponentRef);
      };

      // Configurar eventos do modal
      modalComponentRef.instance.closeModal.subscribe(() => {
        dismiss('close');
      });

      modalComponentRef.instance.backdropClick.subscribe(() => {
        if (modalComponentRef.instance.config.backdrop) {
          dismiss('backdrop');
        }
      });

      // Injetar close/dismiss no conteúdo
      if (contentComponentRef.instance.hasOwnProperty('modalRef')) {
        contentComponentRef.instance['modalRef'] = { close, dismiss };
      }
    });
  }

  private destroyModal(modalComponentRef: ComponentRef<ModalComponent>) {
    const index = this.activeModals.indexOf(modalComponentRef);
    if (index > -1) {
      this.activeModals.splice(index, 1);
    }
    modalComponentRef.destroy();
  }
}
