import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {ToastService} from '../components/toast/toast.service';
import {HttpClient, HttpParams} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {Utils} from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class SystemPerformanceService {
  private API_URL = environment.api;

  constructor(
    private http: HttpClient,
    private toast: ToastService
  ) {
  }

  /**
   * Dashboard principal de performance
   */
  async getDashboard(period: string = 'today'): Promise<any> {
    try {
      let params = new HttpParams().set('period', period);

      const response = await firstValueFrom(
        this.http.get(`${this.API_URL}/performance/dashboard`, {params})
      ) as any;

      return response.data;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return null;
    }
  }

  /**
   * Métricas de performance detalhadas
   */
  async getMetrics(filters: any = {}): Promise<any[]> {
    try {
      let params = new HttpParams();

      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });

      const response = await firstValueFrom(
        this.http.get(`${this.API_URL}/performance/metrics`, {params})
      ) as any;

      return response.data || [];
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return [];
    }
  }

  /**
   * Análise detalhada de um endpoint específico
   */
  async getEndpointAnalysis(endpoint: string, period: string = 'week'): Promise<any> {
    try {
      let params = new HttpParams()
        .set('endpoint', endpoint)
        .set('period', period);

      const response = await firstValueFrom(
        this.http.get(`${this.API_URL}/performance/endpoint-analysis`, {params})
      ) as any;

      return response.data;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return null;
    }
  }

  /**
   * Análise de queries do banco de dados
   */
  async getQueryAnalysis(period: string = 'today'): Promise<any> {
    try {
      let params = new HttpParams().set('period', period);

      const response = await firstValueFrom(
        this.http.get(`${this.API_URL}/performance/query-analysis`, {params})
      ) as any;

      return response.data;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return null;
    }
  }

  /**
   * Saúde do sistema em tempo real
   */
  async getSystemHealth(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.API_URL}/performance/system-health`)
      ) as any;

      return response.data;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return null;
    }
  }

  /**
   * Histórico de saúde do sistema
   */
  async getHealthHistory(period: string = 'today'): Promise<any[]> {
    try {
      let params = new HttpParams().set('period', period);

      const response = await firstValueFrom(
        this.http.get(`${this.API_URL}/performance/health-history`, {params})
      ) as any;

      return response.data || [];
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return [];
    }
  }

  /**
   * Comparação de performance entre períodos
   */
  async comparePerformance(options: {
    period1_start: string,
    period1_end: string,
    period2_start: string,
    period2_end: string
  }): Promise<any> {
    try {
      let params = new HttpParams()
        .set('period1_start', options.period1_start)
        .set('period1_end', options.period1_end)
        .set('period2_start', options.period2_start)
        .set('period2_end', options.period2_end);

      const response = await firstValueFrom(
        this.http.get(`${this.API_URL}/performance/compare-performance`, {params})
      ) as any;

      return response.data;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return null;
    }
  }

  /**
   * Relatório de performance (exportável)
   */
  async generateReport(startDate: string, endDate: string): Promise<any> {
    try {
      let params = new HttpParams()
        .set('start_date', startDate)
        .set('end_date', endDate);

      const response = await firstValueFrom(
        this.http.get(`${this.API_URL}/performance/generate-report`, {params})
      ) as any;

      return response.data;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      return null;
    }
  }

  /**
   * Limpar métricas antigas
   */
  async cleanup(days: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.delete(`${this.API_URL}/performance/cleanup`, {
          body: {days}
        })
      ) as any;

      this.toast.success(response.message || 'Métricas limpas com sucesso');
      return response.data;
    } catch (err: any) {
      this.toast.error(Utils.getErrorMessage(err));
      throw err;
    }
  }


}
