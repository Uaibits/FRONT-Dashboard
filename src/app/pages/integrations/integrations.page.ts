import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ContentComponent } from '../../components/content/content.component';
import { Integration, IntegrationService } from '../../services/integration.service';
import {ToastService} from '../../components/toast/toast.service';
import {Utils} from '../../services/utils.service';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContentComponent
  ],
  templateUrl: './integrations.page.html',
  styleUrl: './integrations.page.scss'
})
export class IntegrationsPage implements OnInit, OnDestroy {

  protected loading: boolean = false;
  protected integrations: Integration[] = [];

  // Filtros
  protected searchTerm: string = '';
  protected configFilter: 'all' | 'configured' | 'not_configured' = 'all';

  // Sidebar mobile
  protected sidebarOpen: boolean = false;

  // Formulário de sugestão
  protected suggestionForm = {
    integration_name: '',
    purpose: '',
    priority: '',
    features: ''
  };
  protected submittingSuggestion: boolean = false;

  // Subject para debounce da pesquisa
  private searchSubject = new Subject<string>();

  constructor(
    private integrationService: IntegrationService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadIntegrations();
    this.setupSearchDebounce();
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  /**
   * Configura o debounce para a pesquisa
   */
  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.loadIntegrations();
    });
  }

  /**
   * Handler para mudança no input de pesquisa
   */
  protected onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  /**
   * Carrega lista de integrações com filtros aplicados
   */
  protected async loadIntegrations() {
    this.loading = true;
    try {
      const filters: any = {};

      if (this.searchTerm) {
        filters.search = this.searchTerm;
      }

      if (this.configFilter !== 'all') {
        filters.is_configured = this.configFilter === 'configured';
      }

      const integrations = await this.integrationService.getIntegrations(filters);
      this.integrations = integrations || [];
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
      this.integrations = [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Seleciona filtro de configuração
   */
  protected selectConfigFilter(filter: 'all' | 'configured' | 'not_configured') {
    this.configFilter = filter;
    this.loadIntegrations();
    this.closeSidebarOnMobile();
  }

  /**
   * Limpa todos os filtros
   */
  protected clearFilters() {
    this.searchTerm = '';
    this.configFilter = 'all';
    this.loadIntegrations();
  }

  /**
   * Verifica se há filtros ativos
   */
  protected hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.configFilter !== 'all');
  }

  /**
   * Toggle sidebar em mobile
   */
  protected toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /**
   * Fecha sidebar em mobile
   */
  private closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
      this.sidebarOpen = false;
    }
  }

  /**
   * Abre modal de configuração
   */
  protected async onConfigureIntegration(integration: Integration) {
    const result = await this.integrationService.openConfigurationIntegrationModal(integration);
    if (result) {
      this.loadIntegrations(); // Recarrega para atualizar badges
    }
  }

  /**
   * Tratamento de erro de imagem
   */
  protected onImageError(event: any) {
    const img = event.target;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.fallback-icon')) {
      const fallbackIcon = document.createElement('i');
      fallbackIcon.className = 'bx bx-link fallback-icon';
      fallbackIcon.style.fontSize = '32px';
      fallbackIcon.style.display = 'flex';
      fallbackIcon.style.alignItems = 'center';
      fallbackIcon.style.justifyContent = 'center';
      fallbackIcon.style.width = '100%';
      fallbackIcon.style.height = '100%';
      fallbackIcon.style.color = 'var(--text-muted)';
      parent.appendChild(fallbackIcon);
    }
  }

  /**
   * Retorna o número de integrações configuradas
   */
  protected getConfiguredCount(): number {
    return this.integrations.filter(i => (i as any).is_configured).length;
  }

  /**
   * Retorna o número de integrações não configuradas
   */
  protected getNotConfiguredCount(): number {
    return this.integrations.filter(i => !(i as any).is_configured).length;
  }

  /**
   * Envia sugestão de nova integração
   */
  protected async submitSuggestion(event: Event) {
    event.preventDefault();

    // Validação básica
    if (!this.suggestionForm.integration_name || !this.suggestionForm.purpose || !this.suggestionForm.priority) {
      this.toast.warning('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    this.submittingSuggestion = true;

    try {
      const response = await this.integrationService.sendIntegrationSuggestion(this.suggestionForm);

      this.toast.success(response.message);

      // Limpa o formulário
      this.suggestionForm = {
        integration_name: '',
        purpose: '',
        features: '',
        priority: ''
      };
    } catch (error) {
      const message = Utils.getErrorMessage(error);
      this.toast.error(message);
    } finally {
      this.submittingSuggestion = false;
    }
  }
}
