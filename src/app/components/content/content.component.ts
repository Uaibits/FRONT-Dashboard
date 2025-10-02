import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HasPermissionDirective} from '../../directives/has-permission.directive';
import {FormErrorHandlerService} from '../form/form-error-handler.service';
import {DropdownComponent} from '../form/dropdown/dropdown.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CompanyService} from '../../services/company.service';
import {User} from '../../models/user';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../security/auth.service';

@Component({
  selector: 'ub-content',
  imports: [
    HasPermissionDirective,
    DropdownComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './content.component.html',
  standalone: true,
  styleUrl: './content.component.scss'
})
export class ContentComponent implements OnInit {

  @Input() title: string = ''; // Título do conteúdo
  @Input() showBackButton: boolean = false; // Controla a visibilidade do botão de voltar
  @Input() selectCompany: boolean = false; // Se deve exibir o seletor de empresa
  @Input() loading: boolean = false; // Estado de carregamento
  @Input() loadingMessage: string = 'Carregando...'; // Mensagem exibida durante o carregamento
  @Input() companyId: number | null = null; // ID da empresa selecionada, se houver

  @Output() companyIdChange = new EventEmitter<number | null>(); // Evento emitido ao selecionar uma empresa
  @Output() back = new EventEmitter<void>(); // Evento emitido ao clicar no botão de voltar
  protected readonly FormErrorHandlerService = FormErrorHandlerService;
  protected companies: any[] = [];

  constructor(
    private companyService: CompanyService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    try {
      if (this.selectCompany && this.authService.hasPermission('company.edit_other')) {
        this.loadCompanies();
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do usuário:', err);
    }
  }

  async loadCompanies() {
    try {
      this.companies = await this.companyService.getCompanies();
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  }

  // Método chamado ao clicar no botão de voltar
  onBack(): void {
    this.back.emit();
  }

  changeCompany(event: number | null) {
    this.companyId = event ?? null; // Atualiza o ID da empresa selecionada
    this.companyIdChange.emit(event);
  }
}
