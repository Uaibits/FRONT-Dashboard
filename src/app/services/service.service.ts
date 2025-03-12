import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {ToastService} from '../components/toast/toast.service';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

@Injectable(
  {providedIn: 'root'}
)
export class ServiceService {

  private API_URL = environment.api;

  constructor(
    private http: HttpClient,
    private toast: ToastService
  ) {
  }

  async getServices(): Promise<any[]> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.API_URL}/service`));
      return response.data;
    } catch (err: any) {
      const message = err.error.message || 'Erro ao buscar os serviços';
      this.toast.error(message);
      return [];
    }
  }

  async getService(id: string): Promise<any> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.API_URL}/service/${id}`));
      return response.data;
    } catch (err: any) {
      const message = err.error.message || 'Erro ao buscar o serviço';
      this.toast.error(message);
      return {};
    }
  }

  createService(data: any) {
      return firstValueFrom(this.http.post<any>(`${this.API_URL}/service/create`, data));
  }

  updateService(id: string, formData: any) {
      return firstValueFrom(this.http.put<any>(`${this.API_URL}/service/${id}/update`, formData));
  }

  async deleteService(id: string) {
    try {
      return await firstValueFrom(this.http.delete<any>(`${this.API_URL}/service/${id}/delete`));
    } catch (err: any) {
      const message = err.error.message || 'Erro ao deletar o serviço';
      this.toast.error(message);
      console.log(err);
      return err;
    }
  }
}
