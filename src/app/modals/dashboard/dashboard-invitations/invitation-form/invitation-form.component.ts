import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../components/form/button/button.component';
import { DashboardService } from '../../../../services/dashboard.service';
import { ToastService } from '../../../../components/toast/toast.service';
import { Utils } from '../../../../services/utils.service';
import {DashboardInvitation} from '../dashboard-invitations.component';
import {ModalRef} from '../../../modal/modal.service';

@Component({
  selector: 'app-invitation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './invitation-form.component.html',
  styleUrl: './invitation-form.component.scss'
})
export class InvitationFormComponent implements OnInit {
  dashboardKey!: string;
  invitation?: DashboardInvitation;

  modalRef!: ModalRef;

  form = {
    name: '',
    description: '',
    expiresInDays: null as number | null,
    maxUses: null as number | null,
    active: true
  };

  expirationPresets = [
    { label: '1 dia', value: 1 },
    { label: '7 dias', value: 7 },
    { label: '30 dias', value: 30 },
    { label: '90 dias', value: 90 },
    { label: 'Sem expiração', value: null }
  ];

  usagePresets = [
    { label: '1 uso', value: 1 },
    { label: '10 usos', value: 10 },
    { label: '50 usos', value: 50 },
    { label: '100 usos', value: 100 },
    { label: 'Ilimitado', value: null }
  ];

  loading = false;
  isEditMode = false;

  constructor(
    private dashboardService: DashboardService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    if (this.invitation) {
      this.isEditMode = true;
      this.loadInvitationData();
    }
  }

  loadInvitationData() {
    if (!this.invitation) return;

    this.form = {
      name: this.invitation.name || '',
      description: this.invitation.description || '',
      expiresInDays: this.invitation.status.total_days_until_expiration || null,
      maxUses: this.invitation.status.max_uses,
      active: this.invitation.status.is_valid
    };
  }

  selectExpirationPreset(days: number | null) {
    this.form.expiresInDays = days;
  }

  selectUsagePreset(uses: number | null) {
    this.form.maxUses = uses;
  }

  async save() {
    if (!this.form.name.trim()) {
      this.toast.warning('Por favor, informe um nome para o convite');
      return;
    }

    this.loading = true;

    try {
      const data = {
        name: this.form.name,
        description: this.form.description || null,
        expires_in_days: this.form.expiresInDays,
        max_uses: this.form.maxUses,
        active: this.form.active
      };

      if (this.isEditMode && this.invitation) {
        await this.dashboardService.updateInvitation(this.invitation.token, data);
        this.toast.success('Convite atualizado com sucesso!');
      } else {
        const response = await this.dashboardService.createInvitation(this.dashboardKey, data);
        this.toast.success('Convite criado com sucesso!');

        // Copiar link automaticamente
        if (response.data?.url) {
          try {
            await navigator.clipboard.writeText(response.data.url);
            this.toast.info('Link copiado para a área de transferência!');
          } catch (e) {
            // Falha silenciosa ao copiar
          }
        }
      }

      this.modalRef.close(true);
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao salvar convite'));
    } finally {
      this.loading = false;
    }
  }

  cancel() {
    this.modalRef.close();
  }
}
