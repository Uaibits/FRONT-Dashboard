import {Component, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import ApexCharts from 'apexcharts';
import {ContentComponent} from '../../components/content/content.component';
import {DashboardViewComponent} from '../../components/dashboard-view/dashboard-view.component';
import {AuthService} from '../../security/auth.service';
import {DashboardService} from '../../services/dashboard.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, DashboardViewComponent]
})
export class HomePage implements OnInit {

  protected loading: boolean = false;
  protected dashboardKey: string | null = null;

  constructor(
    private auth: AuthService,
    private dashboardService: DashboardService
  ) {
  }

  ngOnInit() {
    this.loadDashboardHome();
  }

  private async loadDashboardHome() {
    try {
      const response = await this.dashboardService.getHomeDashboard();
      if (response.data) this.dashboardKey = response.data.key;
    } catch (error) {
      console.error(error);
    }
  }

  get welcomeMessage(): string {
    const user = this.auth.getUser();

    return user ? 'Seja bem-vindo(a), ' + user.name + '!' : 'Seja bem-vindo!';
  }
}
