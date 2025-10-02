import {Component, OnInit} from '@angular/core';
import {DatePipe, NgClass} from '@angular/common';
import {ModalRef} from '../modal/modal.service';
import {IntegrationService} from '../../services/integration.service';
import {ToastService} from '../../components/toast/toast.service';

@Component({
  selector: 'app-test-integration',
  imports: [
    DatePipe,
    NgClass
  ],
  templateUrl: './test-integration.modal.html',
  standalone: true,
  styleUrl: './test-integration.modal.scss'
})
export class TestIntegrationModal implements OnInit {

  modalRef!: ModalRef;
  integration!: any;
  integrationId!: number;

  protected testResult: any = null;
  protected testLoading: boolean = false;
  protected testStatus: 'idle' | 'testing' | 'success' | 'error' = 'idle';

  constructor(
    private integrationService: IntegrationService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.testIntegration();
  }

  async testIntegration() {
    this.testStatus = 'testing';
    this.testLoading = true;
    this.testResult = null;

    try {
      const response = await this.integrationService.testIntegration(this.integrationId);

      // Verifica se a conexão foi bem-sucedida
      if (response.data.connected) {
        this.testStatus = 'success';
        this.testResult = {
          message: 'Conexão estabelecida com sucesso!',
          data: {
            success: true,
            response_time_ms: response.data.response_time_ms,
            timestamp: response.data.timestamp,
            auth_type: response.data.details?.auth_type || 'N/A'
          }
        };
        this.toast.success('Teste de conexão realizado com sucesso!');
      } else {
        // Conexão falhou
        this.testStatus = 'error';
        this.testResult = {
          message: 'Falha ao conectar com a integração',
          details: response.data.details?.error || 'Erro desconhecido',
          data: {
            success: false,
            error: response.data.details?.error || 'Erro na conexão',
            response_time_ms: response.data.response_time_ms,
            timestamp: response.data.timestamp,
            auth_type: response.data.details?.auth_type || 'N/A'
          }
        };
        this.toast.error(this.testResult.details);
      }

      this.testLoading = false;

    } catch (err: any) {
      this.testStatus = 'error';
      this.testLoading = false;

      const errorMessage = err.error?.message || err.message || 'Erro ao testar conexão';
      const errorDetails = err.error?.data?.details?.error || err.error?.details?.error;

      this.testResult = {
        message: errorMessage,
        details: errorDetails,
        data: {
          success: false,
          error: errorDetails || errorMessage,
          response_time_ms: err.error?.data?.response_time_ms || 0,
          timestamp: err.error?.data?.timestamp || new Date().toISOString(),
          auth_type: err.error?.data?.details?.auth_type || 'N/A'
        }
      };

      this.toast.error(errorMessage);
    }
  }

  closeTestModal() {
    this.modalRef.close();
  }

  // Método auxiliar para obter sugestões específicas baseadas no erro
  getErrorSuggestions(): string[] {
    if (!this.testResult?.details) {
      return [
        'Verifique se a URL base está correta',
        'Confirme se as credenciais estão válidas',
        'Certifique-se de que a integração está online',
        'Verifique sua conexão com a internet'
      ];
    }

    const errorLower = this.testResult.details.toLowerCase();

    if (errorLower.includes('appkey') || errorLower.includes('api_key')) {
      return [
        'Configure a chave de API (appkey) nas configurações da integração',
        'Verifique se você possui permissão para gerar a chave de API',
        'Certifique-se de que a chave não expirou',
        'Entre em contato com o suporte caso não consiga obter a chave'
      ];
    }

    if (errorLower.includes('token') || errorLower.includes('autenticação')) {
      return [
        'Verifique se o token de autenticação está correto',
        'O token pode ter expirado - gere um novo',
        'Confirme as permissões do token',
        'Verifique o tipo de autenticação configurado'
      ];
    }

    if (errorLower.includes('url') || errorLower.includes('endpoint')) {
      return [
        'Verifique se a URL base está correta',
        'Certifique-se de incluir o protocolo (https://)',
        'Confirme se não há espaços ou caracteres inválidos na URL',
        'Teste a URL diretamente no navegador'
      ];
    }

    if (errorLower.includes('timeout') || errorLower.includes('tempo')) {
      return [
        'Verifique sua conexão com a internet',
        'O servidor pode estar temporariamente indisponível',
        'Tente novamente em alguns instantes',
        'Verifique se há firewall bloqueando a conexão'
      ];
    }

    return [
      'Verifique todas as configurações da integração',
      'Confirme se os dados estão corretos',
      'Consulte a documentação da integração',
      'Entre em contato com o suporte se o problema persistir'
    ];
  }
}
