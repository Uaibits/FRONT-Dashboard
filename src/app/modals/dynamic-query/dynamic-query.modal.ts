import {Component, OnInit} from '@angular/core';
import {ModalRef} from '../modal/modal.service';
import {TabsComponent} from '../../components/tabs/tabs.component';
import {TabComponent} from '../../components/tabs/tab/tab.component';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FormErrorHandlerService} from '../../components/form/form-error-handler.service';
import {InputComponent} from '../../components/form/input/input.component';
import {DynamicQueryService} from '../../services/dynamic-query.service';
import {ToastService} from '../../components/toast/toast.service';
import {Utils} from '../../services/utils.service';
import {ServicesService} from '../../services/services.service';
import {DropdownComponent} from '../../components/form/dropdown/dropdown.component';
import {ButtonComponent} from '../../components/form/button/button.component';
import {ServiceParametersComponent} from './service-parameters/service-parameters.component';
import {TextareaComponent} from '../../components/form/textarea/textarea.component';
import {NgxJsonViewerModule} from 'ngx-json-viewer';
import {CommonModule} from '@angular/common';
import {
  DynamicQueryFilter,
  DynamicQueryFiltersComponent
} from './dynamic-query-filters/dynamic-query-filters.component';

export interface DynamicQuery {
  id: number;
  key: string;
  name: string;
  description: string | null;
  company_id: number | null;
  service_slug: string;
  service_params: { [key: string]: any };
  query_config: any;
  active: boolean;
  required_params: string[];
  active_filters: DynamicQueryFilter[];
}

interface TestResult {
  success: boolean;
  message: string;
  metadata: any;
  data: any;
  errors: any[];
}

@Component({
  selector: 'app-dynamic-query',
  imports: [
    TabsComponent,
    TabComponent,
    ReactiveFormsModule,
    InputComponent,
    DropdownComponent,
    ButtonComponent,
    ServiceParametersComponent,
    TextareaComponent,
    NgxJsonViewerModule,
    CommonModule,
    DynamicQueryFiltersComponent
  ],
  templateUrl: './dynamic-query.modal.html',
  standalone: true,
  styleUrl: './dynamic-query.modal.scss'
})
export class DynamicQueryModal implements OnInit {

  modalRef!: ModalRef;
  dynamicQueryKey: string | null = null;
  dynamicQuery: DynamicQuery | null = null; // Placeholder for dynamic query data
  companyId: number | null = null;
  form: FormGroup;
  errors: { [key: string]: string } = {};
  loading: boolean = false;
  services: any[] = [];

  // Propriedades para o teste
  testLoading: boolean = false;
  testResult: TestResult | null = null;
  testParameters: any = {};

  constructor(
    private fb: FormBuilder,
    private dynamicQueryService: DynamicQueryService,
    private toast: ToastService,
    private servicesService: ServicesService,
    private utils: Utils
  ) {
    this.form = this.fb.group({
      key: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      name: ['', [Validators.required]],
      description: [''],
      service_slug: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    });

    this.form.valueChanges.subscribe(() => {
      this.errors = FormErrorHandlerService.getErrorMessages(this.form);
    });

  }

  ngOnInit() {
    this.load();
  }

  protected async load() {
    this.loading = true;
    await this.loadDynamicQuery();
    await this.loadServices();
    this.loading = false;
  }

  protected async loadDynamicQuery() {
    if (this.dynamicQueryKey) {
      try {
        const responseQuery = await this.dynamicQueryService.getDynamicQuery(this.dynamicQueryKey, this.companyId);
        this.dynamicQuery = responseQuery.data ? responseQuery.data.query : null;

        if (!this.dynamicQuery) {
          this.toast.error('Consulta dinâmica não encontrada.');
          this.modalRef.close();
          return;
        }

        this.form.patchValue({
          key: this.dynamicQuery.key,
          name: this.dynamicQuery.name,
          service_slug: this.dynamicQuery.service_slug
        });
      } catch (err: any) {
        this.toast.error(Utils.getErrorMessage(err, 'Erro ao carregar consulta dinâmica'));
      }
    }
  }

  protected async loadServices() {
    try {
      const response = await this.servicesService.getServices('query', this.companyId);
      this.services = response.data;
    } catch (error) {
      this.toast.error(Utils.getErrorMessage(error, 'Erro ao carregar serviços'));
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      this.toast.error('Por favor, corrija os erros no formulário antes de enviar.');
      return;
    }

    this.loading = true;
    const data = this.form.value;

    if (this.dynamicQueryKey) {
      this.updateDynamicQuery(data);
    } else {
      this.createDynamicQuery(data);
    }
  }

  async createDynamicQuery(data: any) {
    try {
      const response = await this.dynamicQueryService.createDynamicQuery(data, this.companyId);
      this.toast.success('Consulta dinâmica criada com sucesso!');

      // Atualiza os dados locais para permitir acesso às outras abas
      this.dynamicQueryKey = response.data.key;
      this.dynamicQuery = response.data;

      // Não fecha o modal para permitir configuração adicional
    } catch (error) {
      this.errors = this.utils.handleErrorsForm(error, this.form);
    } finally {
      this.loading = false;
    }
  }

  async updateDynamicQuery(data: any) {
    try {
      const response = await this.dynamicQueryService.updateDynamicQuery(this.dynamicQueryKey!, data, this.companyId);
      this.toast.success('Consulta dinâmica atualizada com sucesso!');

      // Atualiza os dados locais
      this.dynamicQuery = {...this.dynamicQuery, ...response.data};
    } catch (error) {
      this.errors = this.utils.handleErrorsForm(error, this.form);
    } finally {
      this.loading = false;
    }
  }

  // Métodos para o teste da consulta
  async executeTest() {
    if (!this.dynamicQueryKey || !this.dynamicQuery) {
      this.toast.error('É necessário salvar a consulta antes de testá-la.');
      return;
    }

    this.testLoading = true;
    this.testResult = null;

    try {
      const response = await this.dynamicQueryService.executeDynamicQuery(
        this.dynamicQuery,
        this.testParameters,
        this.companyId
      );

      this.testResult = response;

      if (response.success) {
        this.toast.success(response.message || 'Teste executado com sucesso!');
      } else {
        this.toast.warning(response.message || 'Teste executado com avisos.');
      }

    } catch (error: any) {
      const errorMessage = Utils.getErrorMessage(error, 'Erro ao executar teste da consulta');
      this.toast.error(errorMessage);

      // Se a resposta do erro contém a estrutura esperada
      if (error.error && error.error.success !== undefined) {
        this.testResult = error.error;
      } else {
        this.testResult = {
          success: false,
          message: errorMessage,
          metadata: {},
          data: [],
          errors: [error]
        };
      }
    } finally {
      this.testLoading = false;
    }
  }

  clearTestResult() {
    this.testResult = null;
    this.testParameters = {};
  }

  onTestParametersChange(parameters: any) {
    this.testParameters = parameters;
  }

  get hasTestResult(): boolean {
    return this.testResult !== null;
  }

  get isTestSuccessful(): boolean {
    return this.testResult?.success === true;
  }

  get hasTestData(): boolean {
    if (!this.testResult) return false;
    return !!this.testResult.data;
  }

  get hasTestErrors(): boolean {
    if (!this.testResult) return false;
    return this.testResult?.errors && this.testResult.errors.length > 0;
  }

  get hasTestMetadata(): boolean {
    return this.testResult?.metadata && Object.keys(this.testResult.metadata).length > 0;
  }

  protected readonly onsubmit = onsubmit;
  protected readonly FormErrorHandlerService = FormErrorHandlerService;

  generateKey(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    this.form.patchValue({key: value});
  }

  getInfoResult() {
    if (this.testResult) {
      const data = this.testResult.data;
      if (typeof data === 'string') {
        return 'Dado retornado';
      } else if (Array.isArray(data)) {
        return `Dados Retornados (${data.length} registros)`
      } else if (typeof data === 'object' && data !== null) {
        return `Objeto Retornado (${Object.keys(data).length} chaves)`;
      }
    }

    return '';
  }
}
