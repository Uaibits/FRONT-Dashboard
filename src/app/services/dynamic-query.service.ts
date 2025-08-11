import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {ToastService} from '../components/toast/toast.service';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {ModalRef, ModalService} from '../modals/modal/modal.service';
import {DynamicQueryModal} from '../modals/dynamic-query/dynamic-query.modal';
import {Utils} from './utils.service';

@Injectable(
  {providedIn: 'root'}
)
export class DynamicQueryService {

  private API_URL = environment.api;

  constructor(
    private toast: ToastService,
    private http: HttpClient,
    private modalService: ModalService
  ) {
  }

  getDynamicQueries(companyId?: string | number | null): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.API_URL}/queries${companyId ? '?company_id=' + companyId : ''}`))
  }

  async getDynamicQuery(key: string, companyId?: string | number | null): Promise<any> {
    try {
      return await firstValueFrom(this.http.get<any>(`${this.API_URL}/queries/${key}${companyId ? '?company_id=' + companyId : ''}`));
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao buscar consulta dinâmica'));
      throw error;
    }
  }

  async createDynamicQuery(data: any, companyId?: string | number | null): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.API_URL}/queries/create${companyId ? '?company_id=' + companyId : ''}`, data));
  }

  updateDynamicQuery(key: string, data: any, companyId?: string | number | null): Promise<any> {
      return firstValueFrom(this.http.put<any>(`${this.API_URL}/queries/${key}/update${companyId ? '?company_id=' + companyId : ''}`, data));
  }

  async deleteDynamicQuery(key: string): Promise<any> {
    try {
      const response = await firstValueFrom(this.http.delete<any>(`${this.API_URL}/queries/${key}/delete`));
      this.toast.success('Consulta dinâmica excluída com sucesso!');
      return response;
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao excluir consulta dinâmica'));
      throw error;
    }
  }

  openDynamicQueryModal(dynamicQuery?: any, companyId?: number | string | null): ModalRef {
    return this.modalService.open({
      title: 'Configurar Consulta Dinâmica',
      component: DynamicQueryModal,
      data: {
        dynamicQueryKey: dynamicQuery ? dynamicQuery.key : null,
        companyId: companyId,
      }
    });
  }
}
