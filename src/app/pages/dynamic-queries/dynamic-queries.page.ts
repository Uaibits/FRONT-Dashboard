import {Component, OnInit} from '@angular/core';
import {ContentComponent} from '../../components/content/content.component';
import {DynamicQueryService} from '../../services/dynamic-query.service';
import {ToastService} from '../../components/toast/toast.service';
import {Utils} from '../../services/utils.service';
import {DynamicQuery} from '../../components/dynamic-query/dynamic-query.component';
import {DynamicQueryModal} from '../../modals/dynamic-query/dynamic-query.modal';
import {ModalService} from '../../modals/modal/modal.service';
import {ListConfig} from '../../components/list/list.types';
import {UbListComponent} from '../../components/list/list.component';

@Component({
  selector: 'app-dynamic-queries',
  imports: [
    ContentComponent,
    UbListComponent
  ],
  templateUrl: './dynamic-queries.page.html',
  standalone: true,
  styleUrl: './dynamic-queries.page.scss'
})
export class DynamicQueriesPage implements OnInit {

  protected loading: boolean = false;
  protected data: DynamicQuery[] = [];
  protected listConfig: ListConfig = {
    display: {
      title: 'Consultas Dinâmicas',
      subtitle: 'Gerencie as consultas dinâmicas do sistema'
    },
    actions: [
      {
        label: 'Adicionar Consulta Dinâmica',
        icon: 'bx bx-plus',
        action: () => this.openConfig()
      }
    ],
    itemActions: [
      {
        label: 'Editar',
        icon: 'bx bx-edit',
        action: (item: any) => this.openConfig(item)
      },
      {
        label: 'Excluir',
        icon: 'bx bx-trash',
        color: 'danger',
        confirm: true,
        action: (item: any) => this.deleteDynamicQuery(item)
      }
    ],
    fields: [
      {
        label: 'ID',
        key: 'id'
      },
      {
        label: 'Nome',
        key: 'name',
        isTitleCard: true
      },
      {
        label: 'Chave',
        key: 'key',
        isSubtitleCard: true
      },
      {
        label: 'Descrição',
        key: 'description'
      }
    ]
  }

  constructor(
    private dynamicQueryService: DynamicQueryService,
    private toast: ToastService,
    private modalService: ModalService
  ) {
  }

  ngOnInit() {
    this.loadData();
  }

  protected async loadData() {
    this.loading = true;
    try {
      const response = await this.dynamicQueryService.getDynamicQueries();
      this.data = response.data;
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error))
    } finally {
      this.loading = false;
    }
  }

  openConfig(query?: any) {
    const modal = this.modalService.open({
      title: 'Configurar Consulta Dinâmica',
      component: DynamicQueryModal,
      data: {
        dynamicQueryKey: query ? query.key : null
      }
    });

    modal.then((value) => {
      if (value !== undefined) this.loadData();
    });
  }

  deleteDynamicQuery(event: any) {
    this.loading = true;
    this.dynamicQueryService.deleteDynamicQuery(event.key).then(() => {
      this.loadData();
    }).finally(() => this.loading = false);
  }
}
