import {Component, OnInit} from '@angular/core';
import {ContentComponent} from '../../components/content/content.component';
import {TableComponent, TableConfig} from '../../components/table/table.component';
import {DepartmentService} from '../../services/department.service';
import {Department} from '../../models/user';

@Component({
  selector: 'app-departments',
  imports: [
    ContentComponent,
    TableComponent
  ],
  templateUrl: './departments.page.html',
  standalone: true,
  styleUrl: './departments.page.scss'
})
export class DepartmentsPage implements OnInit {

  protected loading = false;

  data: Department[] = [];
  configTable: TableConfig = {
    cols: [
      {
        name: "ID",
        path: "id"
      },
      {
        name: "Departamento",
        path: "name"
      },
      {
        name: "Principal",
        path: "is_default_text"
      },
      {
        name: "Slug",
        path: "slug"
      }
    ],
    showAddButton: true,
    showEditButton: true,
    showDeleteButton: true,
  };

  constructor(
    private departmentService: DepartmentService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.departmentService.getDepartments().then(result => {
      this.data = result;
      console.log(this.data);
    }).finally(() => this.loading = false);
  }

  delete(event: any) {
    this.loading = true;
    this.departmentService.deleteDepartment(event.id).then(response => {
      this.load();
    }).finally(() => this.loading = false);
  }
}
