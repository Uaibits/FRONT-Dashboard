import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {ToastService} from '../components/toast/toast.service';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {PaginationService} from './pagination.service';
import {FolderItem} from '../components/folder-view/folder-view.component';
import {Utils} from './utils.service';

@Injectable(
  {providedIn: 'root'}
)
export class PermissionService {

  private API_URL = environment.api;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private paginationService: PaginationService
  ) {
  }

  async getPermissionsWithPaginate(page: number = 1, perPage: number = 15): Promise<any> {
    try {
      return await this.paginationService.paginate(`${this.API_URL}/permission`, page, perPage);
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return {data: [], pagination: null};
    }
  }

  async getPermissions(): Promise<any> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.API_URL}/permission`));
      return response.data || [];
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return [];
    }
  }

  async getPermissionsGroup(): Promise<any[]> {
    try {
      let url = `${this.API_URL}/permission/group`;
      const response = await firstValueFrom(this.http.get<any>(url));
      return response.data || [];
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return [];
    }
  }

  async getPermissionGroup(idGroup: string | number) {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.API_URL}/permission/group/${idGroup}`));
      return response.data || null;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return null;
    }
  }

  createPermissionGroup(group: any): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.API_URL}/permission/group/create`, group));
  }

  updatePermissionGroup(idGroup: string | number, group: any): Promise<any> {
    return firstValueFrom(this.http.put<any>(`${this.API_URL}/permission/group/${idGroup}/update`, group));
  }

  async deletePermissionGroup(idGroup: string | number): Promise<any> {
    try {
      const response = await firstValueFrom(this.http.delete<any>(`${this.API_URL}/permission/group/${idGroup}/delete`));
      this.toast.success('Grupo deletado com sucesso');
      return response;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      throw err;
    }
  }

  async accessLevels() {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.API_URL}/permission/access-levels`));
      return response.data || [];
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return [];
    }
  }

  async assignPermissions(userId: string | number, permissions: {name: string, value: boolean}[]): Promise<any> {
    return await firstValueFrom(this.http.post<any>(`${this.API_URL}/permission/assign-permissions/${userId}`, {permissions}));
  }

  async assignGroup(userId: string | number, groupId: string | number | null): Promise<any> {
    return await firstValueFrom(this.http.post<any>(`${this.API_URL}/permission/group/assign-group/${userId}`, {group_id: groupId}));
  }
}
