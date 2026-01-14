import {Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewInit, Injector} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {LayoutService, TabOpen} from '../layout.service';
import {AuthService} from '../../security/auth.service';
import {SearchScreenComponent} from '../search-screen/search-screen.component';
import {ClientNavigationService} from '../../services/client-navigation.service';
import {ClientService} from '../../services/client.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, SearchScreenComponent]
})
export class NavbarComponent implements OnInit, AfterViewInit {
  isMobile: boolean = false;
  isMobileMenuOpen: boolean = false;
  isUserMenuOpen: boolean = false;
  showTabControls: boolean = false;
  canScrollLeft: boolean = false;
  canScrollRight: boolean = false;
  showMobileMenu = false;
  showScrollButtons = false;

  @ViewChild('tabsScroll') tabsScroll!: ElementRef;

  constructor(
    public router: Router,
    public auth: AuthService,
    public layout: LayoutService,
    public clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.checkMobileView();
  }

  ngAfterViewInit(): void {
    this.checkTabsOverflow();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobileView();
    this.checkTabsOverflow();
  }

  private checkMobileView(): void {
    this.isMobile = window.innerWidth < 768;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
    if (this.showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  /**
   * Seleciona uma tab no mobile, navegando para a última rota conhecida
   */
  selectMobileTab(tab: TabOpen): void {
    this.layout.navigateToTab(tab);
    this.toggleMobileMenu();
  }

  /**
   * Seleciona uma tab no desktop, navegando para a última rota conhecida
   */
  selectTab(tab: TabOpen, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.layout.navigateToTab(tab);
  }

  /**
   * Fecha uma tab
   */
  closeTab(id: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.layout.closeTab(id);
  }

  /**
   * Verifica se uma tab está ativa
   */
  isTabActive(tab: TabOpen): boolean {
    const currentRoute = this.layout.getCurrentRoute();
    return currentRoute.startsWith(tab.path);
  }

  /**
   * Retorna o título da tab com indicador de subrota
   */
  getTabTitle(tab: TabOpen): string {
    if (tab.lastRoute && tab.lastRoute !== tab.path) {
      return `${tab.title} •`; // Indicador visual de que está em uma subrota
    }
    return tab.title;
  }

  private checkTabsOverflow(): void {
    if (!this.tabsScroll) return;

    const element = this.tabsScroll.nativeElement;
    this.showTabControls = element.scrollWidth > element.clientWidth;
    this.canScrollLeft = element.scrollLeft > 0;
    this.canScrollRight = element.scrollLeft < (element.scrollWidth - element.clientWidth);
    this.showScrollButtons = element.scrollWidth > element.clientWidth;
  }

  scrollTabs(direction: 'left' | 'right'): void {
    if (!this.tabsScroll) return;

    const element = this.tabsScroll.nativeElement;
    const scrollAmount = element.clientWidth / 2;

    if (direction === 'left') {
      element.scrollLeft -= scrollAmount;
    } else {
      element.scrollLeft += scrollAmount;
    }

    setTimeout(() => this.checkTabsOverflow(), 100);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && !userMenu.contains(event.target as Node)) {
      this.isUserMenuOpen = false;
    }
  }

  groupDescription() {
    const client = this.clientService.getCurrentClient();
    if (client) return client.name;
    return 'UaiBits';
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
