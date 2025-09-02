import {Component, OnInit} from '@angular/core';
import {ContentComponent} from '../../components/content/content.component';
import {TableComponent, TableConfig} from '../../components/table/table.component';
import {DynamicQueryService} from '../../services/dynamic-query.service';
import {ToastService} from '../../components/toast/toast.service';
import {Utils} from '../../services/utils.service';
import {DynamicQuery} from '../../modals/dynamic-query/dynamic-query.modal';

@Component({
  selector: 'app-dynamic-queries',
  imports: [
    ContentComponent,
    TableComponent
  ],
  templateUrl: './dynamic-queries.page.html',
  standalone: true,
  styleUrl: './dynamic-queries.page.scss'
})
export class DynamicQueriesPage implements OnInit {

  protected companyId: number | null = null;
  protected loading: boolean = false;
  protected data: DynamicQuery[] = [];
  protected configTable: TableConfig = {
    cols: [
      {
        name: "ID",
        path: "id"
      },
      {
        name: "Nome",
        path: "name"
      },
      {
        name: "Descrição",
        path: "description"
      },
      {
        name: "Global",
        path: "is_global",
      }
    ],
    showAddButton: true,
    showEditButton: true,
    showDeleteButton: true
  };

  constructor(
    private dynamicQueryService: DynamicQueryService,
    private toast: ToastService
  ) {
  }

  ngOnInit() {
    this.loadData();
  }

  protected async loadData() {
    this.loading = true;
    try {
      const response = await this.dynamicQueryService.getDynamicQueries(this.companyId);
      this.data = response.data;
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error))
    } finally {
      this.loading = false;
    }
  }

  openConfig(query?: any) {
    const modal = this.dynamicQueryService.openDynamicQueryModal(query, this.companyId);

    modal.then(() => {
      this.loadData();
    });
  }
}
