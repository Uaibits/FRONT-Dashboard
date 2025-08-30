import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {AppComponent} from "../app.component";
import {ToastService} from '../components/toast/toast.service';
import {FormErrorHandlerService} from '../components/form/form-error-handler.service';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {ModalService} from '../modals/modal/modal.service';

@Injectable(
  {providedIn: 'root'}
)
export class ServicesService {

  private API_URL = environment.api;

  constructor(
    private toast: ToastService,
    private http: HttpClient,
  ) {
  }

  getServices(type: string, companyId?: string | number | null): Promise<any> {
    let route = `${this.API_URL}/services`;
    if (type) route += `?service_type=${type}`;
    if (companyId) route += (type ? '&' : '?') + `company_id=${companyId}`;
    return firstValueFrom(this.http.get<any>(route));
  }

  getServiceParams(serviceSlug: string, companyId?: string | number | null): Promise<any> {
    let route = `${this.API_URL}/services/${serviceSlug}/parameters`;
    if (companyId) route += `?company_id=${companyId}`;
    return firstValueFrom(this.http.get<any>(route));
  }


}
