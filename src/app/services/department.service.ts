import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {AppComponent} from "../app.component";
import {ToastService} from '../components/toast/toast.service';
import {FormErrorHandlerService} from '../components/form/form-error-handler.service';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {AuthService} from '../security/auth.service';
import {Department} from '../models/user';

@Injectable(
  {providedIn: 'root'}
)
export class DepartmentService {

  private API_URL = environment.api;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private toast: ToastService
  ) {
  }

  async getDepartments(): Promise<Department[]> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.API_URL}/${this.authService.getCurrentPortal()?.slug}/department`));
      return response.data;
    } catch (err: any) {
      const message = err.error.message || 'Erro ao buscar departamentos';
      this.toast.error(message);
      return [];
    }
  }

  async getDepartment(id: string): Promise<Department> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.API_URL}/${this.authService.getCurrentPortal()?.slug}/department/${id}`));
      return response.data;
    } catch (err: any) {
      const message = err.error.message || 'Erro ao buscar departamento';
      this.toast.error(message);
      return {} as Department;
    }
  }

  createDepartment(data: any) {
      return firstValueFrom(this.http.post<any>(`${this.API_URL}/${this.authService.getCurrentPortal()?.slug}/department/create`, data));
  }

  updateDepartment(id: string, data: any) {
      return firstValueFrom(this.http.put<any>(`${this.API_URL}/${this.authService.getCurrentPortal()?.slug}/department/${id}/update`, data));
  }

  async deleteDepartment(id: string) {
    try {
      return await firstValueFrom(this.http.delete<any>(`${this.API_URL}/${this.authService.getCurrentPortal()?.slug}/department/${id}/delete`));
    } catch (err: any) {
      const message = err.error.message || 'Erro ao deletar departamento';
      this.toast.error(message);
      console.log(err);
      return err;
    }
  }
}
