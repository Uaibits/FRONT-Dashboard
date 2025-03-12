import {Component, OnInit} from '@angular/core';
import {TableComponent, TableConfig} from '../../components/table/table.component';
import {ServiceService} from '../../services/service.service';
import {ContentComponent} from '../../components/content/content.component';

@Component({
  selector: 'app-services',
  imports: [
    ContentComponent,
    TableComponent
  ],
  templateUrl: './services.page.html',
  standalone: true,
  styleUrl: './services.page.scss'
})
export class ServicesPage implements OnInit {

  protected loading = false;
  data: any[] = [];
  configTable: TableConfig = {
    cols: [
      {
        name: "ID",
        path: "id"
      },
      {
        name: "Título",
        path: "title"
      },
      {
        name: "Subtítulo",
        path: "subtitle"
      }
    ],
    showAddButton: true,
    showEditButton: true,
    showDeleteButton: true,
  };

  constructor(
    private serviceService: ServiceService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.serviceService.getServices().then(result => {
      this.data = result;
    }).finally(() => this.loading = false);
  }

  delete(event: any) {
    this.loading = true;
    this.serviceService.deleteService(event.id).then(() => {
      this.load();
    }).finally(() => this.loading = false);
  }
}
