import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../components/form/button/button.component';
import { DashboardService } from '../../../services/dashboard.service';
import { ToastService } from '../../../components/toast/toast.service';
import { Utils } from '../../../services/utils.service';
import { ConfirmationService } from '../../../components/confirmation-modal/confirmation-modal.service';
import { ModalService } from '../../modal/modal.service';
import { InvitationFormComponent } from './invitation-form/invitation-form.component';

export interface DashboardInvitation {
  token: string;
  name: string | null;
  description: string | null;
  url: string;
  created_by: string | null;
  created_at: string;
  status: {
    status: 'valid' | 'expired' | 'revoked' | 'max_uses_reached';
    total_days_until_expiration: number | null;
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
  selector: 'app-dashboard-invitations',
  standalone: true,
  imports: [CommonModule, ButtonComponent, FormsModule],
  templateUrl: './dashboard-invitations.component.html',
  styleUrl: './dashboard-invitations.component.scss'
})
export class DashboardInvitationsComponent implements OnInit {
  @Input() dashboardKey!: string;

  loading: boolean = false;
  invitations: DashboardInvitation[] = [];
  filteredInvitations: DashboardInvitation[] = [];
  filterStatus: 'all' | 'valid' | 'expired' | 'revoked' = 'all';
  searchTerm: string = '';

  constructor(
    private dashboardService: DashboardService,
    private toast: ToastService,
    private confirmationService: ConfirmationService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.loadInvitations();
  }

  async loadInvitations() {
    this.loading = true;
    try {
      const response = await this.dashboardService.listInvitations(this.dashboardKey, false);
      this.invitations = response.data || [];
      this.applyFilters();
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao carregar convites'));
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.invitations];

    // Filtro por status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status.status === this.filterStatus);
    }

    // Filtro por busca
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.name?.toLowerCase().includes(search) ||
        inv.description?.toLowerCase().includes(search) ||
        inv.token.toLowerCase().includes(search)
      );
    }

    this.filteredInvitations = filtered;
  }

  async createInvitation() {
    const result = await this.modalService.open({
      title: 'Novo Convite',
      component: InvitationFormComponent,
      data: {
        dashboardKey: this.dashboardKey
      }
    });

    if (result) {
      await this.loadInvitations();
    }
  }

  async editInvitation(invitation: DashboardInvitation) {
    const result = await this.modalService.open({
      title: 'Editar Convite',
      component: InvitationFormComponent,
      data: {
        dashboardKey: this.dashboardKey,
        invitation: invitation
      }
    });

    if (result) {
      await this.loadInvitations();
    }
  }

  async copyLink(invitation: DashboardInvitation) {
    try {
      await navigator.clipboard.writeText(invitation.url);
      this.toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      this.toast.error('Erro ao copiar link');
    }
  }

  async viewStats(invitation: DashboardInvitation) {
    try {
      const response = await this.dashboardService.getInvitationStats(invitation.token);
      const stats = response.data;

      const message = `
        <div style="text-align: left;">
          <p><strong>Total de acessos:</strong> ${stats.total_accesses}</p>
          <p><strong>IPs únicos:</strong> ${stats.unique_ips}</p>
          <p><strong>Usuários únicos:</strong> ${stats.unique_users}</p>
          ${stats.max_uses ? `<p><strong>Usos restantes:</strong> ${stats.remaining_uses}</p>` : ''}
          ${stats.last_access ? `<p><strong>Último acesso:</strong> ${new Date(stats.last_access).toLocaleString('pt-BR')}</p>` : ''}
        </div>
      `;

      // Você pode usar seu sistema de modal aqui
      this.toast.info('Estatísticas carregadas');
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao carregar estatísticas'));
    }
  }

  async revokeInvitation(invitation: DashboardInvitation) {
    const confirmed = await this.confirmationService.confirm(
      `Tem certeza que deseja revogar o convite "${invitation.name || invitation.token.substring(0, 8)}"? Esta ação não pode ser desfeita.`,
      'Sim, revogar',
      'Cancelar'
    );

    if (confirmed) {
      try {
        await this.dashboardService.revokeInvitation(invitation.token);
        this.toast.success('Convite revogado com sucesso!');
        await this.loadInvitations();
      } catch (error) {
        this.toast.error(Utils.getErrorMessage(error, 'Erro ao revogar convite'));
      }
    }
  }

  async deleteInvitation(invitation: DashboardInvitation) {
    const confirmed = await this.confirmationService.confirm(
      `Tem certeza que deseja excluir permanentemente o convite "${invitation.name || invitation.token.substring(0, 8)}"?`,
      'Sim, excluir',
      'Cancelar'
    );

    if (confirmed) {
      try {
        await this.dashboardService.deleteInvitation(invitation.token);
        this.toast.success('Convite excluído com sucesso!');
        await this.loadInvitations();
      } catch (error) {
        this.toast.error(Utils.getErrorMessage(error, 'Erro ao excluir convite'));
      }
    }
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'valid': 'success',
      'expired': 'danger',
      'revoked': 'secondary',
      'max_uses_reached': 'warning'
    };
    return colors[status] || 'secondary';
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'valid': 'bx-check-circle',
      'expired': 'bx-time',
      'revoked': 'bx-x-circle',
      'max_uses_reached': 'bx-error'
    };
    return icons[status] || 'bx-help-circle';
  }

  formatDate(date: string | null): string {
    if (!date) return 'Sem expiração';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUsageText(invitation: DashboardInvitation): string {
    const uses = invitation.status.uses_count;
    const max = invitation.status.max_uses;

    if (max === null) {
      return `${uses} ${uses === 1 ? 'uso' : 'usos'}`;
    }

    return `${uses}/${max} usos`;
  }
}
