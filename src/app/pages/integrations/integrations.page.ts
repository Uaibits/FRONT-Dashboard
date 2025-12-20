import {Component, Input, OnInit} from '@angular/core';
import {ContentComponent} from '../../components/content/content.component';
import {Integration, IntegrationService} from '../../services/integration.service';
import {CommonModule} from '@angular/common';


@Component({
  selector: 'app-integrations',
  imports: [
    ContentComponent,
    CommonModule
  ],
  templateUrl: './integrations.page.html',
  standalone: true,
  styleUrl: './integrations.page.scss'
})
export class IntegrationsPage implements OnInit {

  protected loading: boolean = false;
  protected integrations: Integration[] = [];

  constructor(
    private integrationService: IntegrationService
  ) {
  }

  ngOnInit() {
    this.loadIntegrations();
  }

  async loadIntegrations() {
    this.loading = true;
    try {
      const integrations = await this.integrationService.getIntegrations();
      this.integrations = integrations || [];
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
      this.integrations = [];
    } finally {
      this.loading = false;
    }
  }

  onConfigureIntegration(integration: Integration) {
    this.integrationService.openConfigurationIntegrationModal(integration).then(result => {
    })
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

}
