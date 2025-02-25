import { Component } from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ClickOutsideDirective} from '../../directives/click-outside.directive';
import {Router} from '@angular/router';
import {LayoutService} from '../layout.service';

@Component({
  selector: 'search-screen',
  imports: [
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './search-screen.component.html',
  standalone: true,
  styleUrl: './search-screen.component.scss'
})
export class SearchScreenComponent {

  searchQuery: string = '';
  isSearchActive = false;
  isGridHovered = false;

  constructor(
    private router: Router,
    protected layoutService: LayoutService
  ) {
  }

  /**
   * Retorna as rotas filtradas com base na busca.
   */
  searchResults() {
    return this.layoutService.getAvailableRoutes().filter(route =>
      route.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  // Exemplo de apps/páginas
  apps = [
    { path: '/home', title: 'Home', icon: 'bx bx-home' },
    { path: '/about', title: 'About', icon: 'bx bx-info-circle' },
    { path: '/contact', title: 'Contact', icon: 'bx bx-envelope' },
    { path: '/settings', title: 'Settings', icon: 'bx bx-cog' },
    { path: '/profile', title: 'Profile', icon: 'bx bx-user' },
  ];

  // Filtra os apps com base na busca
  filteredApps() {
    return this.apps.filter(app =>
      app.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }


  navigate(path: string) {
    this.router.navigate([path]);
  }

  // Alterna a visibilidade da busca
  toggleSearch() {
    this.isSearchActive = !this.isSearchActive;
    console.log('toggleSearch');
  }

  // Efeito de hover no ícone de grid
  hoverGridIcon() {
    this.isGridHovered = true;
  }

  unhoverGridIcon() {
    this.isGridHovered = false;
  }
}
