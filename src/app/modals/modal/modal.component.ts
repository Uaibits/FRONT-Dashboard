import {
  Component,
  ViewChild,
  ViewContainerRef,
  Output,
  EventEmitter,
  HostListener,
  OnInit,
  OnDestroy,
  ElementRef,
  ComponentRef,
  ChangeDetectorRef
} from '@angular/core';
import { ModalConfig } from './modal.service';
import { NgClass } from '@angular/common';
import { AuthService } from '../../security/auth.service';
import { CompanyService } from '../../services/company.service';
import { DropdownComponent } from '../../components/form/dropdown/dropdown.component';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-modal',
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-container" [ngClass]="getModalClasses()" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">{{ config.title }}</h3>
          <div class="modal-header-actions">
            @if (config.useCompany) {
              <div class="select-company" *hasPermission="'company.edit_other'">
                <ub-dropdown
                  placeholder="Selecione uma empresa"
                  optionValue="id"
                  optionLabel="name"
                  [clearable]="true"
                  [options]="companies"
                  [value]="selectedCompanyId"
                  (valueChange)="changeCompany($event)"
                ></ub-dropdown>
              </div>
            }
            @if (config.closable) {
              <button
                type="button"
                class="modal-close-btn"
                (click)="onClose()"
                aria-label="Fechar modal">
                <i class="bx bx-x"></i>
              </button>
            }
          </div>
        </div>

        <div class="modal-body">
          <ng-container #contentContainer></ng-container>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    NgClass,
    DropdownComponent,
    HasPermissionDirective
  ],
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {
  @ViewChild('contentContainer', { read: ViewContainerRef, static: true })
  contentContainer!: ViewContainerRef;

  @Output() closeModal = new EventEmitter<void>();
  @Output() backdropClick = new EventEmitter<void>();

  config!: ModalConfig;
  protected companies: any[] = [];
  protected selectedCompanyId: number | null = null;
  private contentComponentRef?: ComponentRef<any>;

  constructor(
    private elementRef: ElementRef,
    private authService: AuthService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Adicionar classe ao body para prevenir scroll
    document.body.classList.add('modal-open');

    // Focar no modal para acessibilidade
    setTimeout(() => {
      this.elementRef.nativeElement.focus();
    }, 100);

    // Carregar configurações da empresa se necessário
    if (this.config.useCompany) {
      this.initializeCompanyFeatures();
    }
  }

  private async initializeCompanyFeatures() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.company_id) {
        this.selectedCompanyId = currentUser.company_id;
        // Definir companyId no componente de conteúdo imediatamente
        this.setCompanyIdInContent(this.selectedCompanyId);
      }

      // Carregar lista de empresas se o usuário tem permissão
      if (this.authService.hasPermission('company.edit_other')) {
        await this.loadCompanies();
      }

      // Detectar mudanças para atualizar o dropdown
      this.cdr.detectChanges();
    } catch (err: any) {
      console.error('Erro ao carregar dados do usuário:', err);
    }
  }

  private async loadCompanies() {
    try {
      this.companies = await this.companyService.getCompanies();
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  }

  ngOnDestroy() {
    // Remover classe do body
    document.body.classList.remove('modal-open');
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.config.keyboard && event.key === 'Escape') {
      this.onClose();
    }
  }

  onClose() {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent) {
    this.backdropClick.emit();
  }

  getModalClasses(): string {
    const classes = [`modal-${this.config.size || 'xl'}`];

    if (this.config.className) {
      classes.push(this.config.className);
    }

    return classes.join(' ');
  }

  changeCompany(companyId: number | null) {
    this.selectedCompanyId = companyId;
    this.setCompanyIdInContent(companyId);
  }

  private setCompanyIdInContent(companyId: number | null) {
    // Usar a referência salva pelo service
    if (this['contentComponentRef']?.instance) {
      const contentInstance = this['contentComponentRef'].instance;

      // Definir o companyId diretamente
      if (contentInstance.hasOwnProperty('companyId')) {
        contentInstance.companyId = companyId;
      }

      // Chamar callback de mudança de empresa se existir
      if (typeof contentInstance.companyChange === 'function') {
        contentInstance.companyChange(companyId);
      }

      // Forçar detecção de mudanças no componente de conteúdo
      if (this['contentComponentRef'].changeDetectorRef) {
        this['contentComponentRef'].changeDetectorRef.detectChanges();
      }
    }
  }
}
