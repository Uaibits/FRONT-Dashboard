import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { routes } from './app.routes';
import { CustomRouteReuseStrategy } from './custom-route-reuse-strategy';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http'; // Importe o provideHttpClient
import { AuthInterceptor } from './security/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: RouteReuseStrategy,
      useClass: CustomRouteReuseStrategy,
    },
    provideHttpClient(withInterceptorsFromDi()), // Adicione o provideHttpClient
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
};
