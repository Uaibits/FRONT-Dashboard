import {Component, OnInit} from '@angular/core';
import {PermissionService} from '../../services/permission.service';
import {ContentComponent} from '../../components/content/content.component';
import { TableConfig} from '../../components/table/table.component';
import {ListConfig} from '../../components/list/list.types';
import {ActivatedRoute, Router} from '@angular/router';
import {UbListComponent} from '../../components/list/list.component';

@Component({
  selector: 'app-permission-groups',
  imports: [
    ContentComponent,
    UbListComponent
  ],
  templateUrl: './permission-groups.page.html',
  standalone: true,
  styleUrl: './permission-groups.page.scss'
})
export class PermissionGroupsPage implements OnInit {

  groups: any[] = [];
  loading: boolean = true;

  listConfig: ListConfig = {
    display: {
      title: 'Lista de Grupos',
      subtitle: 'Veja todos os grupos de acessos disponíveis'
    },
    actions: [
      {
        label: 'Adicionar Grupo',
        icon: 'bx bx-plus',
        action: () => this.open()
      }
    ],
    itemActions: [
      {
        label: 'Editar',
        icon: 'bx bx-edit',
        action: (item: any) => this.open(item)
      },
      {
        label: 'Excluir',
        icon: 'bx bx-trash',
        color: 'danger',
        confirm: true,
        action: (item: any) => this.delete(item)
      }
    ],
    fields: [
      {
        label: 'ID',
        key: 'id'
      },
      {
        label: 'Descrição',
        key: 'description',
        isTitleCard: true
      },
      {
        label: 'Nome',
        key: 'name',
        isSubtitleCard: true
      }
    ]
  }

  constructor(
    private permissionService: PermissionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadGroups();
  }

  async loadGroups() {
    this.loading = true;
    try {
      this.groups = await this.permissionService.getPermissionsGroup();
    } catch (error) {
      console.error('Erro ao carregar grupos de permissões:', error);
    } finally {
      this.loading = false;
    }
  }

  delete(event: any) {
    this.loading = true;
    this.permissionService.deletePermissionGroup(event.id).then(response => {
      this.loadGroups();
    }).finally(() => this.loading = false);
  }

  open(item?: any) {
    const commands = item ? ['manage', item.id] : ['manage'];
    this.router.navigate(commands, {relativeTo: this.route});
  }
}
