import {ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy} from '@angular/router';
import {Injectable, Injector} from '@angular/core';
import {LayoutService} from './layout/layout.service';

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

  private getTabRootPath(route: ActivatedRouteSnapshot): string | null {
    let current: ActivatedRouteSnapshot | null = route;
    let depth = 0;
    const MAX_DEPTH = 10;

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

  private getPathWithoutQuery(url: string): string {
    return url.split('?')[0];
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    if (!route.component) {
      return false;
    }

    const tabRoot = this.getTabRootPath(route);
    if (!tabRoot || !this.layout.isTabRoute(tabRoot)) {
      return false;
    }

    const openTabs = this.layout.getOpenTabs();
    return openTabs.some(tab => tab.path === tabRoot);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (!handle || !route.component) return;

    const tabRoot = this.getTabRootPath(route);
    if (!tabRoot || !this.layout.isTabRoute(tabRoot)) return;

    const openTabs = this.layout.getOpenTabs();
    const isTabOpen = openTabs.some(tab => tab.path === tabRoot);

    if (!isTabOpen) return;

    const routeKey = this.getRouteKey(route);

    this.storedRoutes.set(routeKey, {
      handle,
      url: routeKey
    });
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (!route.component) {
      return false;
    }

    const tabRoot = this.getTabRootPath(route);
    if (!tabRoot || !this.layout.isTabRoute(tabRoot)) return false;

    const routeKey = this.getRouteKey(route);
    return this.storedRoutes.has(routeKey);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!route.component) return null;

    const tabRoot = this.getTabRootPath(route);
    if (!tabRoot || !this.layout.isTabRoute(tabRoot)) return null;

    const routeKey = this.getRouteKey(route);
    const stored = this.storedRoutes.get(routeKey);

    return stored?.handle || null;
  }

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    const sameConfig = future.routeConfig === curr.routeConfig;

    if (!sameConfig) {
      return false;
    }

    const sameParams = JSON.stringify(future.params) === JSON.stringify(curr.params);
    const sameQuery = JSON.stringify(future.queryParams) === JSON.stringify(curr.queryParams);

    return sameConfig && sameParams && sameQuery;
  }

  clearClosedTabs(): void {
    const openTabs = this.layout.getOpenTabs();
    const openPaths = openTabs.map(t => t.path);

    const keysToDelete: string[] = [];

    this.storedRoutes.forEach((stored, key) => {
      const storedPath = this.getPathWithoutQuery(stored.url);

      const belongsToOpenTab = openPaths.some(openPath => {
        return storedPath === openPath || storedPath.startsWith(openPath + '/');
      });

      if (!belongsToOpenTab) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.storedRoutes.delete(key));
  }

  clearTabRoutes(tabPath: string): void {
    const keysToDelete: string[] = [];

    this.storedRoutes.forEach((stored, key) => {
      const storedPath = this.getPathWithoutQuery(stored.url);
      const isExactMatch = storedPath === tabPath;
      const isChildRoute = storedPath.startsWith(tabPath + '/');

      if (isExactMatch || isChildRoute) keysToDelete.push(key);
    });

    keysToDelete.forEach(key => this.storedRoutes.delete(key));
  }

  /**
   * Limpa todo o cache de rotas (usado ao trocar de cliente)
   */
  clearAll(): void {
    this.storedRoutes.clear();
  }
}
