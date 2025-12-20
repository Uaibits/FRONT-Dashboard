import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil} from 'rxjs';
import {DashboardViewComponent} from '../../../components/dashboard-view/dashboard-view.component';


@Component({
  imports: [
    CommonModule,
    FormsModule,
    DashboardViewComponent
  ],
  templateUrl: './dashboard-view.page.html',
  standalone: true,
  styleUrl: './dashboard-view.page.scss'
})
export class DashboardViewPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  dashboardKey: string = '';

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.dashboardKey = params['key'];
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
