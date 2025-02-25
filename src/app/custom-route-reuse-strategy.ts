import {ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy} from '@angular/router';
import {Injectable, Injector} from '@angular/core';
import {LayoutService} from './layout/layout.service';

@Injectable({
  providedIn: 'root',
})
export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();
  private layoutService: LayoutService | null = null;

  constructor(private injector: Injector) {}

  // Método para obter o LayoutService de forma manual
  private getLayoutService(): LayoutService {
    if (!this.layoutService) {
      this.layoutService = this.injector.get(LayoutService);
    }
    return this.layoutService;
  }

  // Determina se uma rota deve ser reutilizada
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  // Determina se uma rota deve ser armazenada para reutilização
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getRoutePath(route);
    if (!path) return false;

    // Verifica se a rota está associada a uma aba aberta
    return this.getLayoutService().getOpenTabs().some(tab => tab.path.includes(path));
  }

  // Armazena a rota para reutilização
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const path = this.getRoutePath(route);
    if (path) this.storedRoutes.set(path, handle);
  }

  // Determina se uma rota armazenada deve ser reutilizada
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = this.getRoutePath(route);
    if (!path) return false;

    // Verifica se a rota está associada a uma aba aberta e se está armazenada
    const isTabOpen = this.getLayoutService().getOpenTabs().some(tab => tab.path.includes(path));
    const isStored = this.storedRoutes.has(path);
    return isTabOpen && isStored;
  }

  // Recupera a rota armazenada
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const path = this.getRoutePath(route);
    if (path) return this.storedRoutes.get(path) || null;
    return null;
  }

  // Método auxiliar para obter o caminho da rota
  private getRoutePath(route: ActivatedRouteSnapshot): string | null {
    return route.routeConfig?.path || null;
  }

  // Método para limpar uma rota armazenada quando uma aba é fechada
  public clearStoredRoute(path: string): void {
    if (this.storedRoutes.has(path)) {
      this.storedRoutes.delete(path);
    }
  }
}
