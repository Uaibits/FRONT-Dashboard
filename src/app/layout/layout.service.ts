import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CustomRouteReuseStrategy } from '../custom-route-reuse-strategy';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Tab {
  title: string;
  path: string;
  icon?: string;
  description?: string;
  permission?: string;
  category?: 'system' | 'dashboard' | 'management' | 'reports';
}

export interface TabOpen extends Tab {
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private availableRoutes: Tab[] = [
    {
      title: 'Usuários',
      path: '/users',
      icon: 'bx bx-user',
      description: 'Acesse e controle os usuários cadastrados no sistema',
      permission: 'user.view',
      category: 'management'
    },
    {
      title: 'Integrações',
      path: '/integrations',
      icon: 'bx bx-plug',
      description: 'Gerencie integrações com serviços externos',
      permission: 'integration.manage',
      category: 'system'
    },
    {
      title: 'Permissões',
      path: '/permissions',
      icon: 'bx bx-lock',
      description: 'Defina regras de acesso e controle de funcionalidades',
      permission: 'permission.view',
      category: 'management'
    },
    {
      title: 'Grupos',
      path: '/groups',
      icon: 'bx bx-group',
      description: 'Organize permissões em grupos e associe aos usuários',
      permission: 'permission_group.view',
      category: 'management'
    },
    {
      title: 'Consultas Dinâmicas',
      path: '/dynamic-queries',
      icon: 'bx bx-search',
      description: 'Crie e execute consultas personalizadas',
      permission: 'dynamic_query.view',
      category: 'management'
    },
    {
      title: 'Parâmetros',
      path: '/parameters',
      icon: 'bx bx-cog',
      description: 'Configure preferências e ajustes do sistema',
      permission: 'parameter.view',
      category: 'system'
    },
    {
      title: 'Construtor de Dashboards',
      path: '/dashboards',
      icon: 'bx bx-bar-chart-alt-2',
      description: 'Construa e visualize dashboards personalizados',
      permission: 'dashboard.view',
      category: 'dashboard'
    },
    {
      title: 'Logs do Sistema',
      path: '/logs',
      icon: 'bx bx-file',
      description: 'Monitore atividades e eventos do sistema',
      permission: 'log.view',
      category: 'reports'
    },
    {
      title: 'Desempenho do Sistema',
      path: '/system-performance',
      icon: 'bx bx-tachometer',
      description: 'Acompanhe métricas e saúde do sistema em tempo real',
      permission: 'system_performance.view',
      category: 'reports'
    }
  ];

  private availableRoutesSubject = new BehaviorSubject<Tab[]>(this.availableRoutes);
  public availableRoutes$ = this.availableRoutesSubject.asObservable();

  private open_tabs: TabOpen[] = [];
  private currentRoute: string = '';

  constructor(
    private router: Router,
    private routeReuseStrategy: CustomRouteReuseStrategy
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
        this.syncTabsWithRoute(event.url);
      }
    });

    const open_tabs = localStorage.getItem('open_tabs');
    if (open_tabs) {
      this.open_tabs = JSON.parse(open_tabs);
    }
  }

  public setOpenTabs(tabs: TabOpen[]): void {
    this.open_tabs = tabs;
    localStorage.setItem('open_tabs', JSON.stringify(tabs));
  }

  public getOpenTabs(): TabOpen[] {
    return this.open_tabs;
  }

  public getAvailableRoutes(): Tab[] {
    return this.availableRoutes;
  }

  public getRoutesByCategory(category: string): Tab[] {
    return this.availableRoutes.filter(route => route.category === category);
  }

  public getCurrentRoute(): string {
    return this.currentRoute;
  }

  public addAvailableRoute(route: Tab): void {
    const exists = this.availableRoutes.some(r => r.path === route.path);
    if (!exists) {
      this.availableRoutes.push(route);
      this.availableRoutesSubject.next([...this.availableRoutes]);
    }
  }

  public addMultipleRoutes(routes: Tab[]): void {
    let hasChanges = false;
    routes.forEach(route => {
      const exists = this.availableRoutes.some(r => r.path === route.path);
      if (!exists) {
        this.availableRoutes.push(route);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.availableRoutesSubject.next([...this.availableRoutes]);
    }
  }

  private syncTabsWithRoute(currentPath: string): void {
    const existingTab = this.open_tabs.find((tab) => tab.path === currentPath);
    if (!existingTab) {
      const route = this.availableRoutes.find((route) => route.path === currentPath);
      if (route) {
        this.addTab(route.path, route.title, false);
      }
    }
  }

  addTab(path: string, title: string, navigate: boolean = true): void {
    if (!this.open_tabs.some((tab) => tab.path === path)) {
      const tab = this.availableRoutes.find((route) => route.path === path);
      if (tab) {
        this.open_tabs.push({ id: this.generateUniqueId(), ...tab });
        localStorage.setItem('open_tabs', JSON.stringify(this.open_tabs));
      }
    }

    if (navigate) {
      this.router.navigate([path]);
    }
  }

  closeTab(tabId: string): void {
    const index = this.open_tabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return;

    const tabToClose = this.open_tabs[index];
    const isActiveTab = tabToClose.path === this.currentRoute;

    this.open_tabs.splice(index, 1);
    localStorage.setItem('open_tabs', JSON.stringify(this.open_tabs));

    this.routeReuseStrategy.clearStoredRoute(tabToClose.path);

    if (this.open_tabs.length > 0) {
      if (isActiveTab) {
        const newIndex = Math.max(0, index - 1);
        this.router.navigate([this.open_tabs[newIndex].path]);
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  private generateUniqueId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
