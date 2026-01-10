import {inject, Injectable} from '@angular/core';
import {RouteReuseStrategy} from '@angular/router';
import {TabReuseStrategy} from '../custom-route-reuse-strategy';

@Injectable({ providedIn: 'root' })
export class ReuseStrategyService {

  private strategy = inject(RouteReuseStrategy) as TabReuseStrategy;

  clearClosedTabs(): void {
    this.strategy.clearClosedTabs();
  }

  clearTabRoutes(path: string) {
    this.strategy.clearTabRoutes(path);
  }

  clearAll() {
    this.strategy.clearAll();
  }

}
