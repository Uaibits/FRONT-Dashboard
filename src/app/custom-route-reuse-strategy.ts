import {
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle
} from '@angular/router';
import { Injectable, Injector } from '@angular/core';
import { LayoutService } from './layout/layout.service';

interface StoredRoute {
  handle: DetachedRouteHandle;
  url: string;
}

@Injectable()
export class TabReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, StoredRoute>();
  private layoutService?: LayoutService;

  constructor(private injector: Injector) {}

  private get layout(): LayoutService {
    if (!this.layoutService) {
      this.layoutService = this.injector.get(LayoutService);
    }
    return this.layoutService;
  }

  /**
   * Obtém o path raiz da tab
   */
  private getTabRootPath(route: ActivatedRouteSnapshot): string | null {
    let current: ActivatedRouteSnapshot | null = route;
    let depth = 0;
    const MAX_DEPTH = 10; // Previne loops infinitos

    while (current && depth < MAX_DEPTH) {
      depth++;

      if (current.parent?.routeConfig?.path === '' && current.routeConfig?.path) {
        const rootPath = '/' + current.routeConfig.path;
        if (this.layout.isTabRoute(rootPath)) {
          return rootPath;
        }
      }
      current = current.parent;
    }

    return null;
  }

  /**
   * Gera chave única para a rota
   */
  private getRouteKey(route: ActivatedRouteSnapshot): string {
    const segments: string[] = [];
    let current: ActivatedRouteSnapshot | null = route;
    let depth = 0;
    const MAX_DEPTH = 10;

    while (current && depth < MAX_DEPTH) {
      depth++;

      if (current.url && current.url.length > 0) {
        const pathSegments = current.url.map(s => s.path).filter(p => p);
        segments.unshift(...pathSegments);
      }
      current = current.parent;
    }

    const path = '/' + segments.filter(s => s).join('/');

    if (route.queryParams && Object.keys(route.queryParams).length > 0) {
      const queryString = new URLSearchParams(route.queryParams).toString();
      return `${path}?${queryString}`;
    }

    return path;
  }

  /**
   * Verifica se deve fazer detach da rota
   */
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    if (!route.component) {
      return false; // ✅ Ignora rotas pai sem componente
    }

    const tabRoot = this.getTabRootPath(route);
    return tabRoot !== null && this.layout.isTabRoute(tabRoot);
  }

  /**
   * Armazena o handle da rota
   */
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (!handle || !route.component) return;

    const tabRoot = this.getTabRootPath(route);
    if (!tabRoot || !this.layout.isTabRoute(tabRoot)) return;

    const routeKey = this.getRouteKey(route);

    this.storedRoutes.set(routeKey, {
      handle,
      url: routeKey
    });
  }

  /**
   * Verifica se deve anexar uma rota armazenada
   */
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (!route.component) {
      return false;
    }

    const tabRoot = this.getTabRootPath(route);
    if (!tabRoot || !this.layout.isTabRoute(tabRoot)) return false;

    const routeKey = this.getRouteKey(route);
    return this.storedRoutes.has(routeKey);
  }

  /**
   * Recupera o handle armazenado
   */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!route.component) {
      return null;
    }

    const tabRoot = this.getTabRootPath(route);
    if (!tabRoot || !this.layout.isTabRoute(tabRoot)) return null;

    const routeKey = this.getRouteKey(route);
    const stored = this.storedRoutes.get(routeKey);

    return stored?.handle || null;
  }

  /**
   * CRÍTICO: Este método é chamado para CADA nível da hierarquia de rotas
   * Precisa retornar true/false rapidamente sem causar loops
   */
  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    // Regra 1: Se a configuração de rota é a mesma, reutiliza
    // Isso é seguro e o comportamento padrão do Angular
    const sameConfig = future.routeConfig === curr.routeConfig;

    if (!sameConfig) {
      return false;
    }

    // Regra 2: Se é a mesma configuração, verifica parâmetros
    // Compara de forma simples e rápida
    const sameParams = JSON.stringify(future.params) === JSON.stringify(curr.params);
    const sameQuery = JSON.stringify(future.queryParams) === JSON.stringify(curr.queryParams);

    // Só reutiliza se tudo for igual
    return sameConfig && sameParams && sameQuery;
  }

  /**
   * Limpa cache de tabs fechadas
   */
  clearClosedTabs(): void {
    const openTabs = this.layout.getOpenTabs();
    const openPaths = openTabs.map(t => t.path);

    const keysToDelete: string[] = [];

    this.storedRoutes.forEach((stored, key) => {
      const belongsToOpenTab = openPaths.some(openPath => {
        return stored.url === openPath || stored.url.startsWith(openPath + '/');
      });

      if (!belongsToOpenTab) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.storedRoutes.delete(key));
  }

  /**
   * Limpa rotas de uma tab específica
   */
  clearTabRoutes(tabPath: string): void {
    const keysToDelete: string[] = [];

    this.storedRoutes.forEach((stored, key) => {
      if (stored.url === tabPath || stored.url.startsWith(tabPath + '/')) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.storedRoutes.delete(key));
  }

  /**
   * Debug helper
   */
  getStoredRoutesInfo(): Array<{ key: string; url: string }> {
    const info: Array<{ key: string; url: string }> = [];

    this.storedRoutes.forEach((stored, key) => {
      info.push({ key, url: stored.url });
    });

    return info;
  }
}
