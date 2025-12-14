import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../environments/environment';
import {Utils} from './utils.service';
import {ToastService} from '../components/toast/toast.service';

@Injectable({
  providedIn: 'root'
})
export class DynamicQueryFiltersService {

  private API_URL = environment.api;

  constructor(
    private http: HttpClient,
    private toast: ToastService
  ) {
  }

  /**
   * Lista os filtros de uma consulta dinâmica
   */
  async getFilters(queryKey: string, onlyActive: boolean = true): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (!onlyActive) params.set('only_active', 'false');

      const queryString = params.toString() ? `?${params.toString()}` : '';

      return await firstValueFrom(
        this.http.get<any>(`${this.API_URL}/queries/${queryKey}/filters${queryString}`)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cria um novo filtro para uma consulta
   */
  async createFilter(queryKey: string, filterData: any): Promise<any> {
    try {
      const params = new URLSearchParams();
      const queryString = params.toString() ? `?${params.toString()}` : '';

      return await firstValueFrom(
        this.http.post<any>(`${this.API_URL}/queries/${queryKey}/filters/create${queryString}`, filterData)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Atualiza um filtro existente
   */
  async updateFilter(queryKey: string, varName: string, filterData: any): Promise<any> {
    try {
      const params = new URLSearchParams();

      const queryString = params.toString() ? `?${params.toString()}` : '';

      return await firstValueFrom(
        this.http.put<any>(`${this.API_URL}/queries/${queryKey}/filters/${varName}/update${queryString}`, filterData)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove um filtro
   */
  async deleteFilter(queryKey: string, varName: string): Promise<any> {
    try {
      const params = new URLSearchParams();

      const queryString = params.toString() ? `?${params.toString()}` : '';

      return await firstValueFrom(
        this.http.delete<any>(`${this.API_URL}/queries/${queryKey}/filters/${varName}/delete${queryString}`)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reordena os filtros de uma consulta
   */
  async reorderFilters(queryKey: string, orderedVarNames: string[]): Promise<any> {
    try {
      const params = new URLSearchParams();

      const queryString = params.toString() ? `?${params.toString()}` : '';

      return await firstValueFrom(
        this.http.put<any>(`${this.API_URL}/queries/${queryKey}/filters/reorder${queryString}`, {
          order: orderedVarNames
        })
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém sugestões de variáveis baseadas na configuração da consulta
   */
  async getVariableSuggestions(queryKey: string): Promise<any> {
    try {
      const params = new URLSearchParams();

      const queryString = params.toString() ? `?${params.toString()}` : '';

      return await firstValueFrom(
        this.http.get<any>(`${this.API_URL}/queries/${queryKey}/filters/variable-suggestions${queryString}`)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém tipos de filtros disponíveis
   */
  async getFilterTypes(): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.get<any>(`${this.API_URL}/queries/filters/types`)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém template para criação de filtro baseado no tipo
   */
  async getFilterTemplate(type: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.get<any>(`${this.API_URL}/queries/filters/template/${type}`)
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Valida valores de filtros sem executar a consulta
   */
  async validateFilterValues(queryKey: string, params: any): Promise<any> {
    try {
      const urlParams = new URLSearchParams();

      const queryString = urlParams.toString() ? `?${urlParams.toString()}` : '';

      return await firstValueFrom(
        this.http.post<any>(`${this.API_URL}/queries/${queryKey}/filters/validate${queryString}`, params)
      );
    } catch (error) {
      throw error;
    }
  }
}
