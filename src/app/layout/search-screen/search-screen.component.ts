import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LayoutService, Tab } from '../layout.service';
import { AuthService } from '../../security/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { Utils } from '../../services/utils.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

interface SearchItem extends Tab {}

interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  items: SearchItem[];
}

@Component({
  selector: 'search-screen',
  imports: [FormsModule, CommonModule],
  templateUrl: './search-screen.component.html',
  standalone: true,
  styleUrls: ['./search-screen.component.scss']
})
export class SearchScreenComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  isSearchModalActive = false;
  isSearchFocused = false;
  recentSearches: SearchItem[] = [];
  favoritePages: SearchItem[] = [];
  filteredResults: SearchItem[] = [];
  allPages: SearchItem[] = [];
  categorizedPages: CategoryGroup[] = [];
  isLoadingDashboards = false;

  private readonly MAX_RECENT_SEARCHES = 8;
  private readonly STORAGE_KEYS = {
    RECENT_SEARCHES: 'recent_searches',
    FAVORITE_PAGES: 'favorite_pages'
  } as const;

  private readonly CATEGORIES = {
    dashboard: { name: 'Dashboards', icon: 'bx bx-bar-chart-alt-2' },
    management: { name: 'Gerenciamento', icon: 'bx bx-user-circle' },
    system: { name: 'Sistema', icon: 'bx bx-cog' },
    reports: { name: 'Relatórios', icon: 'bx bx-file-find' }
  };

  private searchTimeout?: number;
  private clickOutsideHandler?: (event: MouseEvent) => void;
  private routesSubscription?: Subscription;

  constructor(
    private router: Router,
    protected layoutService: LayoutService,
    private auth: AuthService,
    private dashboardService: DashboardService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadStoredData();
    await this.loadDashboardsNavigable();
    this.loadAllPages();
    this.setupClickOutsideListener();
    this.subscribeToRouteChanges();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.removeClickOutsideListener();

    if (this.routesSubscription) {
      this.routesSubscription.unsubscribe();
    }
  }

  private async loadDashboardsNavigable(): Promise<void> {
    try {
      this.isLoadingDashboards = true;
      const response = await this.dashboardService.getNavigableDashboards();

      if (response && response.data) {
        const dashboardRoutes: Tab[] = response.data.map((dash: any) => ({
          title: dash.name,
          description: dash.description || 'Dashboard personalizado',
          icon: dash.icon ? 'bx ' + dash.icon : 'bx bx-bar-chart-alt-2',
          path: `/dashboard/${dash.key}`,
          category: 'dashboard' as const
        }));

        this.layoutService.addMultipleRoutes(dashboardRoutes);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboards navegáveis:', error);
    } finally {
      this.isLoadingDashboards = false;
    }
  }

  private subscribeToRouteChanges(): void {
    this.routesSubscription = this.layoutService.availableRoutes$.subscribe(routes => {
      this.loadAllPages();
      if (this.searchQuery.trim()) {
        this.performSearch();
      }
    });
  }

  private setupClickOutsideListener(): void {
    this.clickOutsideHandler = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideHandler);
  }

  private removeClickOutsideListener(): void {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }
  }

  private handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const searchContainer = target.closest('.selector-search');

    if (!searchContainer && this.isSearchFocused) {
      this.closeSearchResults();
    }
  }

  private loadStoredData(): void {
    try {
      const recent = localStorage.getItem(this.STORAGE_KEYS.RECENT_SEARCHES);
      const favorites = localStorage.getItem(this.STORAGE_KEYS.FAVORITE_PAGES);

      this.recentSearches = recent ? JSON.parse(recent) : [];
      this.favoritePages = favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.warn('Erro ao carregar dados do localStorage:', error);
      this.recentSearches = [];
      this.favoritePages = [];
    }
  }

  private loadAllPages(): void {
    this.allPages = this.layoutService.getAvailableRoutes()
      .filter(route => this.auth.hasPermission(route.permission || ''))
      .sort((a, b) => a.title.localeCompare(b.title));

    this.categorizePages();
  }

  private categorizePages(): void {
    const grouped = new Map<string, SearchItem[]>();

    this.allPages.forEach(page => {
      const category = page.category || 'system';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(page);
    });

    this.categorizedPages = Array.from(grouped.entries()).map(([id, items]) => ({
      id,
      name: this.CATEGORIES[id as keyof typeof this.CATEGORIES]?.name || 'Outros',
      icon: this.CATEGORIES[id as keyof typeof this.CATEGORIES]?.icon || 'bx bx-folder',
      items: items.sort((a, b) => a.title.localeCompare(b.title))
    }));

    // Ordena categorias: dashboards primeiro, depois o resto
    this.categorizedPages.sort((a, b) => {
      if (a.id === 'dashboard') return -1;
      if (b.id === 'dashboard') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(this.recentSearches));
      localStorage.setItem(this.STORAGE_KEYS.FAVORITE_PAGES, JSON.stringify(this.favoritePages));
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
    }
  }

  handleSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = window.setTimeout(() => {
      this.performSearch();
    }, 150);
  }

  private performSearch(): void {
    const query = this.searchQuery.trim();

    if (!query) {
      this.filteredResults = [];
      return;
    }

    const searchTerm = Utils.prepareSearchQuery(query);

    this.filteredResults = this.allPages.filter(page => {
      const titleMatch = Utils.prepareSearchQuery(page.title).includes(searchTerm);
      const descMatch = page.description ?
        Utils.prepareSearchQuery(page.description).includes(searchTerm) : false;

      return titleMatch || descMatch;
    });
  }

  navigate(path: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const page = this.allPages.find(p => p.path === path);
    if (page) {
      this.addToRecentSearches(page);
      this.router.navigate([path]);
    }
    this.closeAll();
  }

  private addToRecentSearches(item: SearchItem): void {
    this.recentSearches = this.recentSearches.filter(search => search.path !== item.path);
    this.recentSearches.unshift({
      path: item.path,
      title: item.title,
      icon: item.icon,
      description: item.description,
      category: item.category
    });

    if (this.recentSearches.length > this.MAX_RECENT_SEARCHES) {
      this.recentSearches = this.recentSearches.slice(0, this.MAX_RECENT_SEARCHES);
    }

    this.saveToLocalStorage();
  }

  toggleSearch(): void {
    this.isSearchModalActive = !this.isSearchModalActive;

    if (this.isSearchModalActive) {
      this.searchQuery = '';
      this.filteredResults = [];
      setTimeout(() => this.focusSearchInput(), 100);
    } else {
      this.closeAll();
    }
  }

  private focusSearchInput(): void {
    const input = document.querySelector('.selector-menu input') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }

  onSearchFocus(): void {
    this.isSearchFocused = true;
  }

  onSearchBlur(event: FocusEvent): void {
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement;
      const searchResults = document.querySelector('.search-results');

      if (searchResults && searchResults.contains(activeElement)) {
        return;
      }

      this.isSearchFocused = false;
    }, 200);
  }

  isFavorite(item: SearchItem): boolean {
    return this.favoritePages.some(fav => fav.path === item.path);
  }

  toggleFavorite(item: SearchItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const favoriteIndex = this.favoritePages.findIndex(fav => fav.path === item.path);

    if (favoriteIndex >= 0) {
      this.favoritePages.splice(favoriteIndex, 1);
    } else {
      this.favoritePages.unshift({
        path: item.path,
        title: item.title,
        icon: item.icon,
        description: item.description,
        category: item.category
      });
    }

    this.saveToLocalStorage();
  }

  clearRecentSearches(): void {
    this.recentSearches = [];
    this.saveToLocalStorage();
  }

  clearFavorites(): void {
    this.favoritePages = [];
    this.saveToLocalStorage();
  }

  closeSearchResults(): void {
    this.isSearchFocused = false;
  }

  private closeAll(): void {
    this.isSearchFocused = false;
    this.isSearchModalActive = false;
    this.searchQuery = '';
    this.filteredResults = [];

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  get showSearchResults(): boolean {
    return this.isSearchFocused && !this.isSearchModalActive;
  }

  get showEmptyState(): boolean {
    return this.searchQuery.trim() !== '' && this.filteredResults.length === 0;
  }
}
