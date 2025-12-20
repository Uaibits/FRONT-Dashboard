import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DashboardViewComponent } from '../../../components/dashboard-view/dashboard-view.component';
import { DashboardService } from '../../../services/dashboard.service';
import { ToastService } from '../../../components/toast/toast.service';
import { Utils } from '../../../services/utils.service';

type InviteState = 'validating' | 'valid' | 'invalid' | 'error';

interface InvitationInfo {
  dashboardKey: string;
  dashboardName: string;
  status: {
    status: string;
    message: string;
    is_valid: boolean;
    expires_at: string | null;
    days_until_expiration: number | null;
    uses_count: number;
    max_uses: number | null;
    remaining_uses: number | null;
  };
}

@Component({
  imports: [
    CommonModule,
    FormsModule,
    DashboardViewComponent
  ],
  templateUrl: './dashboard-invite.page.html',
  styleUrl: './dashboard-invite.page.scss',
  standalone: true,
})
export class DashboardInvitePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  invitationToken: string = '';
  dashboardKey: string = '';
  invitationInfo: InvitationInfo | null = null;

  state: InviteState = 'validating';
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.invitationToken = params['token'];
        if (this.invitationToken) {
          this.validateInvitation();
        } else {
          this.state = 'error';
          this.errorMessage = 'Token de convite não encontrado na URL';
        }
      });
  }

  private async validateInvitation() {
    this.state = 'validating';

    try {
      // Valida o convite e registra o acesso
      const validateResponse = await this.dashboardService.validateInvitation(this.invitationToken);

      if (validateResponse.success && validateResponse.data) {
        this.dashboardKey = validateResponse.data.dashboard.key;

        // Busca informações completas do convite
        const inviteResponse = await this.dashboardService.getInvitation(this.invitationToken);

        if (inviteResponse.success && inviteResponse.data) {
          this.invitationInfo = {
            dashboardKey: inviteResponse.data.dashboard.key,
            dashboardName: inviteResponse.data.dashboard.name,
            status: inviteResponse.data.status
          };

          this.state = 'valid';
        } else {
          throw new Error('Erro ao buscar informações do convite');
        }
      } else {
        this.state = 'invalid';
        this.errorMessage = validateResponse.message || 'Convite inválido';
      }
    } catch (error: any) {
      this.state = 'invalid';
      this.errorMessage = Utils.getErrorMessage(error, 'Não foi possível validar o convite');

      // Se o erro for 404 ou 403, é convite inválido/expirado
      if (error.status === 404) {
        this.errorMessage = 'Convite não encontrado';
      } else if (error.status === 403) {
        this.errorMessage = error.error?.message || 'Convite expirado ou inválido';
      }
    }
  }

  retry() {
    this.validateInvitation();
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
