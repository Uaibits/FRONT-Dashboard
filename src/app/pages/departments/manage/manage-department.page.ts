import { Component } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ContentComponent} from '../../../components/content/content.component';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {FormErrorHandlerService} from '../../../components/form/form-error-handler.service';
import {InputComponent} from '../../../components/form/input/input.component';
import {Utils} from '../../../services/utils.service';
import {ButtonComponent} from '../../../components/form/button/button.component';
import {DepartmentService} from '../../../services/department.service';
import {Department} from '../../../models/user';

@Component({
  selector: 'app-manage',
  imports: [
    ContentComponent,
    FormsModule,
    ReactiveFormsModule,
    InputComponent,
    ButtonComponent
  ],
  templateUrl: './manage-department.page.html',
  standalone: true,
  styleUrl: './manage-department.page.scss'
})
export class ManageDepartmentPage {

  protected idDepartment: string | undefined = undefined;

  form: FormGroup;
  errors: { [key: string]: string } = {};
  loading: boolean = false;
  loadingPage: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private utils: Utils
  ) {
    this.idDepartment = this.route.snapshot.params['id'];

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      slug: ['', [Validators.required]],
    });

    this.form.valueChanges.subscribe(() => {
      this.errors = FormErrorHandlerService.getErrorMessages(this.form);
    });

    this.load();
  }

  load() {
    if (this.idDepartment) {
      this.loadingPage = true;
      this.departmentService.getDepartment(this.idDepartment).then(response => {
        this.form.patchValue(response);
      }).finally(() => this.loadingPage = false);
    }
  }

   onSubmit() {
    this.loading = true;

    const action = this.idDepartment ?
      this.departmentService.updateDepartment(this.idDepartment, this.form.value) :
      this.departmentService.createDepartment(this.form.value);

    action.then(response => {
      if (this.idDepartment) {
        window.location.reload();
      } else {
        this.router.navigate([response.data.id], {relativeTo: this.route});
      }
    }, err => this.errors = this.utils.handleErrorsForm(err, this.form, this.errors)).finally(() => this.loading = false);
  }

  protected readonly FormErrorHandlerService = FormErrorHandlerService;

  createSlug(event: FocusEvent) {
    const value = (event.target as HTMLInputElement).value;
    this.form.patchValue({slug: Utils.slug(value)});
  }

  back() {
    const url = this.idDepartment ? '../../' : '../';
    this.router.navigate([url], {relativeTo: this.route});
  }
}
