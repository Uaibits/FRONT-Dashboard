import { Injectable, ComponentRef, ViewContainerRef, Type } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ModalComponent } from './modal.component';

export interface ModalConfig {
  title: string;
  component: Type<any>;
  data?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  backdrop?: boolean;
  keyboard?: boolean;
  className?: string;
  useCompany?: boolean;
}

export interface ModalRef {
  close: (result?: any) => void;
  dismiss: (reason?: any) => void;
  result: Observable<any>;
  dismissed: Observable<any>;
  contentInstance: any;
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

    // Adicionar à lista de modais ativos IMEDIATAMENTE
    this.activeModals.push(modalComponentRef);

    // Configurar o modal
    modalComponentRef.instance.config = {
      closable: true,
      backdrop: true,
      keyboard: true,
      size: 'xl',
      useCompany: false,
      ...config
    };

    // Criar o componente de conteúdo UMA ÚNICA VEZ
    const contentComponentRef = modalComponentRef.instance.contentContainer.createComponent(config.component);

    // Salvar a referência do componente de conteúdo no modal
    modalComponentRef.instance['contentComponentRef'] = contentComponentRef;

    // Promise de retorno
    return new Promise<T | undefined>((resolve) => {
      const cleanup = () => {
        this.destroyModal(modalComponentRef);
      };

      const close = (result?: T) => {
        resolve(result);
        cleanup();
      };

      const dismiss = (reason?: any) => {
        resolve(undefined);
        cleanup();
      };

      // Configurar eventos do modal
      const closeSubscription = modalComponentRef.instance.closeModal.subscribe(() => {
        dismiss('close');
      });

      const backdropSubscription = modalComponentRef.instance.backdropClick.subscribe(() => {
        if (modalComponentRef.instance.config.backdrop) {
          dismiss('backdrop');
        }
      });

      // Limpar subscriptions quando o modal for destruído
      modalComponentRef.onDestroy(() => {
        closeSubscription.unsubscribe();
        backdropSubscription.unsubscribe();
      });

      // Criar modalRef com acesso ao contentInstance
      const modalRef: ModalRef = {
        close,
        dismiss,
        result: new Observable(), // Pode implementar se necessário
        dismissed: new Observable(), // Pode implementar se necessário
        contentInstance: contentComponentRef.instance
      };

      // Injetar dados no componente de conteúdo
      if (config.data) {
        Object.keys(config.data).forEach(key => {
          if (contentComponentRef.instance && contentComponentRef.instance.hasOwnProperty(key)) {
            contentComponentRef.instance[key] = config.data[key];
          }
        });
      }

      // Injetar modalRef no conteúdo
      if (contentComponentRef.instance && contentComponentRef.instance.hasOwnProperty('modalRef')) {
        contentComponentRef.instance['modalRef'] = modalRef;
      }

      // Executar detecção de mudanças para garantir que tudo esteja renderizado
      modalComponentRef.changeDetectorRef.detectChanges();
    });
  }

  private destroyModal(modalComponentRef: ComponentRef<ModalComponent>) {
    const index = this.activeModals.indexOf(modalComponentRef);
    if (index > -1) {
      this.activeModals.splice(index, 1);
    }

    // Destruir o modal (isso automaticamente destrói os componentes filhos)
    modalComponentRef.destroy();
  }

  // Método para fechar todos os modais (útil em casos específicos)
  closeAllModals() {
    [...this.activeModals].forEach(modal => {
      this.destroyModal(modal);
    });
  }
}
