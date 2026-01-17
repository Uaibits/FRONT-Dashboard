import {AfterViewInit, Component, OnInit, ViewContainerRef} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ToastComponent} from './components/toast/toast.component';
import {ConfirmationModalComponent} from './components/confirmation-modal/confirmation-modal.component';
import {AuthService} from './security/auth.service';
import {ModalService} from './modals/modal/modal.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ToastComponent,
    ConfirmationModalComponent
  ],
  template: `
    <router-outlet></router-outlet>
    <ub-toast></ub-toast>
    <ub-confirmation-modal></ub-confirmation-modal>
  `,
  standalone: true,
})
export class AppComponent implements OnInit, AfterViewInit {

  constructor(
    private auth: AuthService,
    private modalService: ModalService,
    private viewContainer: ViewContainerRef
  ) {
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.auth.refreshUserDataSync();
    }
  }

  ngAfterViewInit() {
    this.modalService.setRootViewContainer(this.viewContainer);
  }
}
