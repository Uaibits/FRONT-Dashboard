import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Verifica se o usuário está autenticado
    if (this.authService.isAuthenticated()) {
      return of(true); // Usuário autenticado, permite o acesso
    }

    // Se o token estiver expirado, tenta renovar o token
    if (this.authService.getRefreshToken()) {
      return this.authService.refreshToken().pipe(
        map(() => {
          // Token renovado com sucesso, permite o acesso
          return true;
        }),
        catchError(() => {
          // Falha ao renovar o token, redireciona para o login
          this.authService.logout();
          this.router.navigate(['/auth/logar'], {
            queryParams: { returnUrl: state.url },
          });
          return of(false);
        })
      );
    }

    // Se não houver refresh token, redireciona para o login
    this.authService.logout();
    this.router.navigate(['/auth/logar'], {
      queryParams: { returnUrl: state.url },
    });
    return of(false);
  }
}
