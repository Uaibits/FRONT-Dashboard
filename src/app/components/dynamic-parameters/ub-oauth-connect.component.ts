import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ToastService} from '../toast/toast.service';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';

export interface OAuthStatus {
  connected: boolean;
  user_name?: string;
  connected_at?: string;
  ad_accounts?: any[];
}

@Component({
  selector: 'ub-oauth-connect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="oauth-container">
      <div class="oauth-content">
        <div class="oauth-info">
          <h3 class="oauth-title">{{ label }}</h3>
          @if (description) {
            <p class="oauth-description">{{ description }}</p>
          }
        </div>

        @if (status?.connected) {
          <div class="oauth-connected">
            <div class="connection-info">
              <div class="info-row">
                <div class="status-indicator">
                  <span class="status-dot"></span>
                  <span class="status-text">Conectado</span>
                </div>

                <div class="action-buttons">
                  <button
                    type="button"
                    class="btn-icon btn-danger"
                    [disabled]="disabled || loading"
                    (click)="disconnect()"
                    title="Desconectar"
                  >
                    <i class="bx bx-log-out"></i>
                  </button>
                </div>
              </div>

              @if (status && status.user_name) {
                <div class="user-info">
                  <i class="bx bx-user"></i>
                  <span>{{ status.user_name }}</span>
                </div>
              }

              @if (status && status.connected_at) {
                <div class="time-info">
                  <span>{{ formatDate(status.connected_at) }}</span>
                </div>
              }

              @if (status && status.ad_accounts && status.ad_accounts.length > 0) {
                <div class="accounts-info">
                  <span class="accounts-count">{{ status.ad_accounts.length }} conta(s) disponível(is)</span>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="oauth-disconnected">
            <button
              type="button"
              class="btn-connect"
              [disabled]="disabled || loading"
              (click)="connect()"
            >
              @if (loading) {
                <i class="bx bx-loader-alt bx-spin"></i>
              } @else {
                <i class="bx bx-link"></i>
              }
              <span>{{ loading ? 'Conectando...' : 'Conectar ' + providerName }}</span>
            </button>
          </div>
        }

        @if (error) {
          <div class="error-message">
            <i class="bx bx-error-circle"></i>
            <span>{{ error }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .oauth-container {
      background: var(--surface-color, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .oauth-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .oauth-info .oauth-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary, #111827);
      margin: 0 0 0.5rem 0;
    }

    .oauth-info .oauth-description {
      font-size: 0.875rem;
      color: var(--text-secondary, #6b7280);
      line-height: 1.5;
      margin: 0;
    }

    .oauth-connected {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .connection-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--background-color, #f9fafb);
      border-radius: 6px;
    }

    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .status-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary, #111827);
    }

    .user-info, .accounts-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary, #6b7280);
    }

    .user-info i {
      font-size: 1rem;
      color: var(--primary-color, #3b82f6);
    }

    .accounts-count {
      font-size: 0.8125rem;
      color: var(--text-tertiary, #9ca3af);
    }

    .time-info {
      font-size: 0.8125rem;
      color: var(--text-tertiary, #9ca3af);
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-color, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--text-secondary, #6b7280);
    }

    .btn-icon:hover:not(:disabled) {
      background: var(--background-color, #f9fafb);
      border-color: var(--primary-color, #3b82f6);
      color: var(--primary-color, #3b82f6);
    }

    .btn-icon.btn-danger:hover:not(:disabled) {
      border-color: #ef4444;
      color: #ef4444;
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-icon i {
      font-size: 1.125rem;
    }

    .btn-connect {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: var(--primary-color, #3b82f6);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-connect:hover:not(:disabled) {
      background: var(--primary-hover, #2563eb);
    }

    .btn-connect:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-connect i {
      font-size: 1rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #991b1b;
    }

    .error-message i {
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    @media (max-width: 640px) {
      .oauth-container {
        padding: 1.25rem;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .action-buttons {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class OauthConnectComponent implements OnInit, OnDestroy {
  @Input() label: string = 'Autenticação OAuth';
  @Input() description?: string;
  @Input() provider!: string;
  @Input() disabled: boolean = false;
  @Input() integrationName!: string;

  @Output() connected = new EventEmitter<any>();
  @Output() disconnected = new EventEmitter<void>();

  status: OAuthStatus | null = null;
  loading: boolean = false;
  error: string = '';
  private oauthWindow: Window | null = null;
  private messageListener: any;
  private popupCheckInterval: any;
  private API_URL = environment.api;

  constructor(
    private toast: ToastService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.loadStatus();
    this.setupMessageListener();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
    if (this.popupCheckInterval) {
      clearInterval(this.popupCheckInterval);
    }
    if (this.oauthWindow && !this.oauthWindow.closed) {
      this.oauthWindow.close();
    }
  }

  get providerName(): string {
    const names: Record<string, string> = {
      'meta': 'Facebook',
      'facebook': 'Facebook',
      'google': 'Google',
      'microsoft': 'Microsoft'
    };
    return names[this.provider] || this.provider;
  }

  async loadStatus() {
    this.loading = true;
    this.error = '';

    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.API_URL}/integration/oauth/${this.provider}/status`)
      );
      this.status = response.data;
    } catch (error: any) {
      console.error('Erro ao carregar status OAuth:', error);
      this.error = 'Erro ao verificar status da conexão';
    } finally {
      this.loading = false;
    }
  }

  async connect() {
    this.loading = true;
    this.error = '';

    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.API_URL}/integration/oauth/${this.provider}/authorize`)
      );

      if (response.success && response.data.authorization_url) {
        this.openOAuthPopup(response.data.authorization_url);
      } else {
        throw new Error('URL de autorização não recebida');
      }
    } catch (error: any) {
      console.error('Erro ao iniciar OAuth:', error);
      this.error = 'Erro ao iniciar autenticação';
      this.toast.error('Erro ao iniciar autenticação');
      this.loading = false;
    }
  }

  private openOAuthPopup(url: string) {
    const width = 600;
    const height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    this.oauthWindow = window.open(
      url,
      'OAuth Authorization',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    console.log('Popup OAuth aberto:', this.oauthWindow);

    // Monitora se o popup foi fechado manualmente
    this.popupCheckInterval = setInterval(() => {
      if (this.oauthWindow && this.oauthWindow.closed) {
        clearInterval(this.popupCheckInterval);
        if (this.loading) {
          this.loading = false;
          this.loadStatus();
        }
      }
    }, 500);
  }

  private setupMessageListener() {
    this.messageListener = (event: MessageEvent) => {
      // Valida origem
      if (event.origin !== window.location.origin) {
        console.warn('Mensagem de origem não confiável:', event.origin);
        return;
      }

      console.log('Mensagem recebida:', event.data);

      if (event.data.type === 'oauth_callback') {
        this.handleOAuthCallback(event.data.data);
      }
    };

    window.addEventListener('message', this.messageListener);
  }

  private async handleOAuthCallback(data: any) {
    console.log('Processando callback OAuth:', data);

    // Para o monitoramento do popup
    if (this.popupCheckInterval) {
      clearInterval(this.popupCheckInterval);
    }

    this.loading = false;

    // Não fecha o popup imediatamente - deixa o backend fazer isso
    // após 1 segundo para garantir que a mensagem foi processada

    if (data.success) {
      this.toast.success('Autenticação realizada com sucesso!');

      // Aguarda um pouco antes de recarregar o status
      await new Promise(resolve => setTimeout(resolve, 500));

      await this.loadStatus();
      this.connected.emit();
    } else {
      this.error = data.error_description || 'Erro na autenticação';
      this.toast.error(this.error);
    }
  }

  async disconnect() {
    if (!confirm('Deseja realmente desconectar? Você precisará autenticar novamente.')) {
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await firstValueFrom(
        this.http.post(`${this.API_URL}/integration/oauth/${this.provider}/disconnect`, {})
      );
      this.toast.success('Desconectado com sucesso');
      this.status = { connected: false };
      this.disconnected.emit();
    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      this.error = 'Erro ao desconectar';
      this.toast.error('Erro ao desconectar');
    } finally {
      this.loading = false;
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }
}
