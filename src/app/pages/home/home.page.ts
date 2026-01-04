import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardViewComponent} from '../../components/dashboard-view/dashboard-view.component';
import {DashboardListComponent} from '../../components/dashboard-view/dashboard-list/dashboard-list.component';
import {AuthService} from '../../security/auth.service';
import {DashboardService} from '../../services/dashboard.service';
import {ToastService} from '../../components/toast/toast.service';

interface Dashboard {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  is_home?: boolean;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, DashboardViewComponent, DashboardListComponent]
})
export class HomePage implements OnInit {

  protected loading: boolean = true;
  protected dashboardKey: string | null = null;
  protected hasNoDashboards: boolean = false;
  protected showDashboardList: boolean = false;
  protected availableDashboards: Dashboard[] = [];

  constructor(
    protected auth: AuthService,
    private dashboardService: DashboardService,
    private toast: ToastService
  ) {
  }

  ngOnInit() {
    this.loadDashboardHome();
  }

  private async loadDashboardHome() {
    this.loading = true;

    try {
      const response = await this.dashboardService.getHomeDashboard();

      if (response.success && response.data) {
        // Usuário tem dashboard principal configurado
        this.dashboardKey = response.data.key;
        this.showDashboardList = false;
      } else {
        // Não há dashboard principal - vamos verificar se há dashboards disponíveis
        await this.checkAvailableDashboards();
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard home:', error);
      // Em caso de erro, também verificamos os dashboards disponíveis
      await this.checkAvailableDashboards();
    } finally {
      this.loading = false;
    }
  }

  private async checkAvailableDashboards() {
    try {
      const response = await this.dashboardService.getAccessibleDashboardsForUser();
      this.availableDashboards = response.data || [];

      if (this.availableDashboards.length === 0) {
        // Usuário não tem nenhum dashboard disponível
        this.hasNoDashboards = true;
        this.showDashboardList = false;
      } else {
        // Usuário tem dashboards, mas nenhum configurado como principal
        this.showDashboardList = true;
        this.hasNoDashboards = false;
      }
    } catch (error) {
      console.error('Erro ao verificar dashboards disponíveis:', error);
      this.hasNoDashboards = true;
    }
  }

  onHomeDashboardChanged(dashboard: Dashboard) {
    // Quando o usuário define um dashboard como principal, recarrega
    this.dashboardKey = dashboard.key;
    this.showDashboardList = false;
    this.hasNoDashboards = false;
    this.toast.success(`Perfeito! "${dashboard.name}" agora é seu dashboard principal e será exibido sempre que você acessar a página inicial.`);
  }

  onDashboardSelected(dashboard: Dashboard) {
    // Quando o usuário seleciona um dashboard para visualizar
    this.dashboardKey = dashboard.key;
    this.showDashboardList = false;
  }

  backToDashboardList() {
    this.showDashboardList = true;
    this.dashboardKey = null;
  }

  get welcomeMessage(): string {
    const user = this.auth.getUser();
    return user ? 'Seja bem-vindo(a), ' + user.name + '!' : 'Seja bem-vindo!';
  }

  get userName(): string {
    return this.auth.getUserName();
  }
}
