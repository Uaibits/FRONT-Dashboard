import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InputComponent } from '../../../components/form/input/input.component';
import { PasswordComponent } from '../../../components/form/password/password.component';
import { ButtonComponent } from '../../../components/form/button/button.component';
import { FormErrorHandlerService } from "../../../components/form/form-error-handler.service";
import { ToastService } from '../../../components/toast/toast.service';
import { AuthService } from '../../../security/auth.service';
import { Utils } from '../../../services/utils.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    InputComponent,
    PasswordComponent,
    RouterLink,
    ButtonComponent
  ],
  templateUrl: './login.page.html',
  standalone: true,
  styleUrl: '../auth.page.scss'
})
export class LoginPage implements OnInit, OnDestroy {

  loginForm!: FormGroup;
  loading = false;
  errors: { [key: string]: string } = {};
  private destroy$ = new Subject<void>();
  private returnUrl: string = '/home';

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private authService: AuthService,
    private utils: Utils,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.checkAuthenticationStatus();
    this.getReturnUrl();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa o formulário de login
   */
  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * Verifica se o usuário já está autenticado
   */
  private checkAuthenticationStatus(): void {
    // Verifica autenticação usando observable para ter dados mais atualizados
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.navigateToReturnUrl();
        }
      });
  }

  /**
   * Obtém a URL de retorno dos query parameters
   */
  private getReturnUrl(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  /**
   * Configura validação em tempo real do formulário
   */
  private setupFormValidation(): void {
    this.loginForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Limpa erros quando o usuário começa a digitar
        if (Object.keys(this.errors).length > 0) {
          this.errors = {};
        }

        // Atualiza erros de validação
        const formErrors = FormErrorHandlerService.getErrorMessages(this.loginForm);
        if (Object.keys(formErrors).length > 0) {
          this.errors = { ...this.errors, ...formErrors };
        }
      });
  }

  /**
   * Manipula o envio do formulário de login
   */
  async onLoginSubmit(): Promise<void> {
    // Marca todos os campos como touched para mostrar erros
    this.loginForm.markAllAsTouched();

    if (!this.loginForm.valid) {
      this.errors = FormErrorHandlerService.getErrorMessages(this.loginForm);
      this.toast.error('Por favor, corrija os erros no formulário.');
      return;
    }

    if (this.loading) {
      return; // Evita múltiplos submits
    }

    this.loading = true;
    this.errors = {};

    try {
      await this.authService.login(this.loginForm.value);

      this.toast.success('Login efetuado com sucesso!');

      // Pequeno delay para mostrar o toast antes de navegar
      setTimeout(() => {
        this.navigateToReturnUrl();
      }, 100);

    } catch (error: any) {
      console.error('Login error:', error);

      // Trata erros específicos
      if (error.status === 401) {
        this.toast.error('Email ou senha inválidos.');
      } else if (error.status === 429) {
        this.toast.error('Muitas tentativas de login. Tente novamente mais tarde.');
      } else if (error.status === 0) {
        this.toast.error('Erro de conexão. Verifique sua internet.');
      } else {
        // Tenta usar o serviço de utils para tratar erros do formulário
        this.errors = this.utils.handleErrorsForm(error, this.loginForm);

        if (Object.keys(this.errors).length === 0) {
          this.toast.error('Erro interno do servidor. Tente novamente.');
        }
      }
    } finally {
      this.loading = false;
    }
  }

  /**
   * Navega para a URL de retorno ou home
   */
  private navigateToReturnUrl(): void {
    this.router.navigate([this.returnUrl]);
  }

  /**
   * Limpa os erros do formulário
   */
  clearErrors(): void {
    this.errors = {};
  }

  /**
   * Verifica se um campo específico tem erro
   */
  hasFieldError(fieldName: string): boolean {
    return !!this.errors[fieldName];
  }

  /**
   * Obtém a mensagem de erro de um campo específico
   */
  getFieldError(fieldName: string): string {
    return this.errors[fieldName] || '';
  }

  protected readonly FormErrorHandlerService = FormErrorHandlerService;
}
