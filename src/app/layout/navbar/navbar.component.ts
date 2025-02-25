import { Component, OnInit } from '@angular/core';
import {Router, NavigationEnd, RouterOutlet, RouterLink} from '@angular/router';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {SearchScreenComponent} from '../search-screen/search-screen.component';
import {LayoutService} from '../layout.service';
import {AuthService} from '../../security/auth.service';
import {DropdownComponent} from '../../components/form/dropdown/dropdown.component';


@Component({
  selector: 'app-navbar',
  imports: [NgForOf, NgClass, NgIf, FormsModule, RouterOutlet, RouterLink, SearchScreenComponent, DropdownComponent],
  templateUrl: './navbar.component.html',
  standalone: true,
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  isTabsDialogOpen = false;

  constructor(
    protected router: Router,
    protected layoutService: LayoutService,
    protected auth: AuthService
  ) {

  }

  ngOnInit(): void {

  }

  closeTab(id: string, event: MouseEvent) {
    event.stopPropagation();
    this.layoutService.closeTab(id);
  }

  openDialogApps() {
    this.isTabsDialogOpen = true;
    console.log('openDialogApps');
  }
}
