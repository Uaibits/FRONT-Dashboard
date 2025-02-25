import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {AppComponent} from "../app.component";
import {ToastService} from '../components/toast/toast.service';
import {FormErrorHandlerService} from '../components/form/form-error-handler.service';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

@Injectable(
  {providedIn: 'root'}
)
export class PortalService {

  private API_URL = environment.api;

  constructor(
    private http: HttpClient
  ) {
  }

  getPortal() {
    return firstValueFrom(this.http.get(`${this.API_URL}/portal`));
  }

}
