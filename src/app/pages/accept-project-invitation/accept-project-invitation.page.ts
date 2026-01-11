import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../security/auth.service';
import {UserService} from '../../services/user.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Utils} from '../../services/utils.service';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-accept-project-invitation',
  imports: [CommonModule],
  templateUrl: './accept-project-invitation.page.html',
  standalone: true,
  styleUrl: './accept-project-invitation.page.scss'
})
export class AcceptProjectInvitationPage implements OnInit {

  protected infoData: {
    invited_email: string,
    is_authenticated: boolean,
    existing_user: boolean,
    client_name: string,
  } | null = null;

  protected code: string = "";
  protected loading: boolean = false;
  protected error: string | null = null;
  protected currentYear: number = new Date().getFullYear();

  constructor(
    protected auth: AuthService,
    protected userService: UserService,
    protected router: Router,
    protected route: ActivatedRoute
  ) {
    this.code = this.route.snapshot.params['inviteCode'];
  }

  ngOnInit() {
    this.loadInvite();
  }

  async loadInvite() {
    this.loading = true;
    this.error = null;

    try {
      const response = await this.userService.getInvite(this.code);
      this.infoData = response.data;
      const isAuthenticated = this.auth.isAuthenticated();

      if (this.infoData) {
        // Se o usuário não deveria estar autenticado mas está, faz logout
        if (!this.infoData.is_authenticated && isAuthenticated) {
          this.auth.logout(false);
        }

        console.log(this.infoData);

        // Se o usuário não está autenticado, redireciona para login/registro
        if (!this.infoData.is_authenticated) {
          // Constrói a URL de retorno com o código do convite
          const returnUrl = this.router.url;

          if (this.infoData.existing_user) {
            // Usuário existente - redireciona para login
            this.router.navigate(['/auth/logar'], {
              queryParams: { returnUrl }
            });
          } else {
            // Novo usuário - redireciona para registro
            this.router.navigate(['/auth/registrar'], {
              queryParams: { returnUrl }
            });
          }
        }
        // Se está autenticado, mostra a tela de aceitar convite
      }
    } catch (error) {
      this.error = Utils.getErrorMessage(error, 'Ops! Não foi possível carregar as informações do convite.');
    } finally {
      this.loading = false;
    }
  }

  async acceptInvite() {
    this.loading = true;
    this.error = null;

    try {
      await this.userService.acceptInvite(this.code);
      // Redireciona para home após aceitar
      this.router.navigate(['/home']);
    } catch (error) {
      this.error = Utils.getErrorMessage(error, 'Ops! Não foi possível aceitar o convite.');
      this.loading = false;
    }
  }
}
