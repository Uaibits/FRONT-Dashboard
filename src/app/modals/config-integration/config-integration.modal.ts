import {Component, OnInit} from '@angular/core';
import {ModalRef} from '../modal/modal.service';
import {Integration, IntegrationService} from '../../services/integration.service';
import {DynamicParametersComponent} from '../../components/dynamic-parameters/dynamic-parameters.component';
import {AlertComponent} from '../../components/alert/alert.component';
import {ToastService} from '../../components/toast/toast.service';

@Component({
  imports: [
    DynamicParametersComponent,
    AlertComponent
  ],
  templateUrl: './config-integration.modal.html',
  standalone: true,
  styleUrl: './config-integration.modal.scss'
})
export class ConfigIntegrationModal implements OnInit {

  modalRef!: ModalRef;
  configIntegration: any | null = null;
  integration: Integration | null = null;
  integration_name!: string;
  loading: boolean = false;
  erros: string[] = [];

  constructor(
    private integrationService: IntegrationService,
    private toast: ToastService
  ) {
  }

  ngOnInit() {
    this.load();
  }

  async load() {
    this.loading = true;
    try {
      this.integration = await this.integrationService.getIntegration(this.integration_name);

      this.loadIntegrationConfig();
    } catch (error) {
      console.error('Erro ao carregar integração:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadIntegrationConfig() {
    try {
      this.configIntegration = null;
      this.configIntegration = await this.integrationService.getConfigIntegration(this.integration_name);
    } catch (error) {
      console.error('Erro ao carregar integração da empresa:', error);
    }
  }

  async save(configs: any) {
    if (this.configIntegration) {
      await this.updateIntegration(configs)
    } else {
      await this.createIntegration(configs)
    }
  }

  async createIntegration(configs: any) {
    this.loading = true;
    try {
      await this.integrationService.createIntegration(this.integration_name, configs);
      this.toast.success('Integração salva com sucesso');
      await this.loadIntegrationConfig();
    } catch (responseError: any) {
      this.erros = [];
      if (responseError.error.errors) this.erros = responseError.error.errors;
      else this.toast.error(responseError.error.message || 'Erro ao salvar integração');
    } finally {
      this.loading = false;
    }
  }

  async updateIntegration(configs: any) {
    this.loading = true;
    try {
      await this.integrationService.updateIntegration(this.configIntegration.id, configs);
      this.toast.success('Integração atualizada com sucesso');
      await this.loadIntegrationConfig();
    } catch (responseError: any) {
      this.erros = [];
      if (responseError.error.errors) this.erros = responseError.error.errors;
      else this.toast.error(responseError.error.message || 'Erro ao atualizar integração');
    } finally {
      this.loading = false;
    }
  }

  getErrorsFormat(): string {
    return this.erros.join('<br>');
  }

  onImageError(event: any) {
    // Fallback para ícone do BoxIcons
    const img = event.target;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.fallback-icon')) {
      const fallbackIcon = document.createElement('i');
      fallbackIcon.className = 'bx bx-link fallback-icon';
      fallbackIcon.style.fontSize = '24px';
      fallbackIcon.style.display = 'flex';
      fallbackIcon.style.alignItems = 'center';
      fallbackIcon.style.justifyContent = 'center';
      fallbackIcon.style.width = '100%';
      fallbackIcon.style.height = '100%';
      fallbackIcon.style.color = 'var(--text-muted)';
      parent.appendChild(fallbackIcon);
    }
  }

  testIntegration() {
    if (!this.configIntegration) {
      this.toast.error('Salve a integração antes de testar a conexão.');
      return;
    }

    this.integrationService.openTestIntegrationModal(this.integration, this.configIntegration.id);
  }
}
