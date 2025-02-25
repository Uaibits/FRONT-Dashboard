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
export class ProfileService {

  private API_URL = environment.api;

  constructor(
    private toast: ToastService,
    private http: HttpClient
  ) {
  }

  updateProfile(data: any) {
    Object.keys(data).forEach(key => {
      if (!data[key]) delete data[key];
    });
    return firstValueFrom(this.http.put<any>(this.API_URL + '/profile/update', data))
  }

}
