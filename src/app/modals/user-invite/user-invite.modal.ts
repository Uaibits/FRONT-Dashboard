import {Component, OnInit} from '@angular/core';
import {PermissionService} from '../../services/permission.service';
import {UserService} from '../../services/user.service';
import {ToastService} from '../../components/toast/toast.service';
import {Utils} from '../../services/utils.service';
import {ModalRef} from '../modal/modal.service';
import {FormErrorHandlerService} from '../../components/form/form-error-handler.service';
import {InputComponent} from '../../components/form/input/input.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DropdownComponent} from '../../components/form/dropdown/dropdown.component';
import {ButtonComponent} from '../../components/form/button/button.component';

@Component({
  selector: 'app-user-invite',
  imports: [
    InputComponent,
    ReactiveFormsModule,
    FormsModule,
    DropdownComponent,
    ButtonComponent
  ],
  templateUrl: './user-invite.modal.html',
  standalone: true,
  styleUrl: './user-invite.modal.scss'
})
export class UserInviteModal implements OnInit {

  modalRef!: ModalRef;

  protected status: 'open' | 'sent' = 'open';
  protected loading: boolean = true;
  protected groups: any[] = [];
  protected data = {
    email: '',
    group_id: null
  }

  constructor(
    private permissionService: PermissionService,
    private userService: UserService,
    private toast: ToastService
  ) {
  }

  ngOnInit() {
    this.loadGroups();
  }


  async loadGroups() {
    this.loading = true;
    try {
      this.groups = await this.permissionService.getPermissionsGroup();
    } catch (e) {
      const message = Utils.getErrorMessage(e, 'Não foi possível carregar os grupos de acesso.');
      this.toast.error(message);
    } finally {
      this.loading = false;
    }
  }

  async inviteUser() {
    this.loading = true;
    try {
      await this.userService.inviteUser(this.data);
      this.toast.success('Convite enviado com sucesso.');
      this.status = 'sent';
    } catch (e) {
      const message = Utils.getErrorMessage(e, 'Não foi possível enviar o convite.');
      this.toast.error(message);
    } finally {
      this.loading = false;
    }
  }

  protected readonly FormErrorHandlerService = FormErrorHandlerService;
}
