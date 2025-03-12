import {Component} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  FormControl,
  AbstractControl
} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ServiceService} from '../../../services/service.service';
import {Utils} from '../../../services/utils.service';
import {FormErrorHandlerService} from '../../../components/form/form-error-handler.service';
import {InputComponent} from '../../../components/form/input/input.component';
import {TabComponent} from '../../../components/tabs/tab/tab.component';
import {NgForOf} from '@angular/common';
import {TabsComponent} from '../../../components/tabs/tabs.component';
import {EditorComponent} from '../../../components/form/editor/editor.component';
import {ContentComponent} from '../../../components/content/content.component';
import {ButtonComponent} from '../../../components/form/button/button.component';

@Component({
  selector: 'app-manage',
  templateUrl: './manage-service.page.html',
  styleUrls: ['./manage-service.page.scss'],
  imports: [
    ReactiveFormsModule,
    InputComponent,
    TabComponent,
    NgForOf,
    TabsComponent,
    EditorComponent,
    ContentComponent,
    ButtonComponent
  ],
  standalone: true
})
export class ManageServicePage {
  protected idService: string | undefined = undefined;
  activeTabIndex: number = 0;
  form: FormGroup;
  errors: { [key: string]: string } = {};
  loading: boolean = false;
  loadingPage: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private serviceService: ServiceService,
    private utils: Utils
  ) {
    this.idService = this.route.snapshot.params['id'];

    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      subtitle: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
      icon: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      slug: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      use_cases: this.fb.array([]),
      features: this.fb.array([]),
      benefits: this.fb.array([]),
    });

    this.form.valueChanges.subscribe(() => {
      this.errors = FormErrorHandlerService.getErrorMessages(this.form);
    });

    this.load();
  }

  get useCases(): FormArray {
    return this.form.get('use_cases') as FormArray;
  }

  get features(): FormArray {
    return this.form.get('features') as FormArray;
  }

  get benefits(): FormArray {
    return this.form.get('benefits') as FormArray;
  }

  getFormControl(formGroup: any, controlName: string): FormControl {
    return formGroup.get(controlName) as FormControl;
  }

  addUseCase(): void {
    this.useCases.push(
      this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        description: ['', [Validators.required, Validators.minLength(3)]],
        icon: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      })
    );
  }

  removeUseCase(index: number): void {
    this.useCases.removeAt(index);
  }

  addFeature(): void {
    this.features.push(
      this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        icon: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      })
    );
  }

  removeFeature(index: number): void {
    this.features.removeAt(index);
  }

  addBenefit(): void {
    this.benefits.push(
      this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        description: ['', [Validators.required, Validators.minLength(3)]],
        icon: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      })
    );
  }

  removeBenefit(index: number): void {
    this.benefits.removeAt(index);
  }

  load(): void {
    if (this.idService) {
      this.loadingPage = true;
      this.serviceService.getService(this.idService).then((service: any) => {
        this.form.patchValue(service);
        service.use_cases.forEach(() => this.addUseCase());
        service.features.forEach(() => this.addFeature());
        service.benefits.forEach(() => this.addBenefit());
        this.form.patchValue(service);
      }).finally(() => this.loadingPage = false);
    }
  }

  onSubmit(): void {
    this.loading = true;

    console.log(this.form.value);

    const action = this.idService
      ? this.serviceService.updateService(this.idService, this.form.value)
      : this.serviceService.createService(this.form.value);

    action
      .then((response) => {
        if (this.idService) {
          window.location.reload();
        } else {
          this.router.navigate([response.data.id], {relativeTo: this.route});
        }
      })
      .catch((err) => {
        this.errors = this.utils.handleErrorsForm(err, this.form, this.errors);
      })
      .finally(() => this.loading = false);
  }

  createSlug(event: FocusEvent): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.patchValue({slug: Utils.slug(value)});
  }

  back(): void {
    const url = this.idService ? '../../' : '../';
    this.router.navigate([url], {relativeTo: this.route});
  }

  protected readonly FormErrorHandlerService = FormErrorHandlerService;
}
