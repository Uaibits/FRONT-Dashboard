import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {ToastService} from '../components/toast/toast.service';
import {HttpClient} from '@angular/common/http';
import {first, firstValueFrom} from 'rxjs';
import {Utils} from './utils.service';
import {ModalService} from '../modals/modal/modal.service';
import {ConfigIntegrationModal} from '../modals/config-integration/config-integration.modal';
import {DynamicParameter, DynamicParams} from '../components/dynamic-parameters/dynamic-parameters.component';
import {TestIntegrationModal} from '../modals/test-integration/test-integration.modal';

export interface Integration {
  integration_name: string;
  name: string;
  img: string;
  description: string;
  version: string;
  parameters: DynamicParams;
}

@Injectable(
  {providedIn: 'root'}
)
export class IntegrationService {

  private API_URL = environment.api;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private modalService: ModalService
  ) {
  }

  async getIntegrations(): Promise<Integration[]> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.API_URL}/integration`));
      return response.data as Integration[];
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return [];
    }
  }

  async getIntegration(integration_name: string): Promise<Integration | null> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.API_URL}/integration/${integration_name}/info`));
      return response.data as Integration;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return null;
    }
  }

  async getCompanyIntegration(integration_name: string, companyId: number) {
    try {
      const route = `${this.API_URL}/integration/${integration_name}${companyId ? `?company_id=${companyId}` : ''}`;
      const response = await firstValueFrom(this.http.get<any>(route));
      return response.data;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return null;
    }
  }

  createIntegration(integration_name: string, companyId: number, configuration: any) {
    return firstValueFrom(this.http.post<any>(`${this.API_URL}/integration/create`, {
      company_id: companyId,
      integration_name,
      configuration
    }));
  }

  updateIntegration(idIntegration: number, configuration: any) {
    return firstValueFrom(this.http.put<any>(`${this.API_URL}/integration/${idIntegration}/update`, {
      configuration
    }));
  }

  openConfigurationIntegrationModal(integration: Integration) {
    return this.modalService.open({
      title: `Integração ${integration.name}`,
      component: ConfigIntegrationModal,
      useCompany: true,
      data: {
        integration_name: integration.integration_name
      }
    })
  }

  openTestIntegrationModal(integration: any, integration_id: number) {
    return this.modalService.open({
      title: `Testar Integração ${integration.name}`,
      component: TestIntegrationModal,
      data: {
        integration,
        integrationId: integration_id,
      }
    })
  }

  async testIntegration(integrationId: number) {
    return firstValueFrom(this.http.get<any>(`${this.API_URL}/integration/${integrationId}/test-connection`));
  }
}
