import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../../components/form/input/input.component';
import { PasswordComponent } from '../../../components/form/password/password.component';
import { ButtonComponent } from '../../../components/form/button/button.component';
import { FormErrorHandlerService } from "../../../components/form/form-error-handler.service";
import { ToastService } from '../../../components/toast/toast.service';
import { AuthService } from '../../../security/auth.service';
import { Utils } from '../../../services/utils.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    PasswordComponent,
    ButtonComponent
  ],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onLoginSubmit()" class="auth-form">
      <div class="form-fields">
        <ub-input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          formControlName="email"
          [error]="FormErrorHandlerService.getError('email', errors)">
        </ub-input>

        <ub-password
          label="Senha"
          placeholder="Digite sua senha"
          formControlName="password"
          [error]="FormErrorHandlerService.getError('password', errors)">
        </ub-password>
      </div>

      <div class="form-actions">
        <ub-button
          type="submit"
          [disabled]="loginForm.invalid"
          [loading]="loading">
          <i class="bx bx-log-in"></i>
          Entrar
        </ub-button>
      </div>

      <div class="auth-footer">
        <p class="switch-mode-text">
          Não tem uma conta?
          <a (click)="switchToRegister.emit()" class="switch-link">
            Criar conta
          </a>
        </p>

        <p class="help-text">
          <i class="bx bx-help-circle"></i>
          Problemas para acessar?
          <a href="mailto:suporte@uaibits.com.br" class="support-link">Entre em contato</a>
        </p>
      </div>
    </form>
  `,
  styleUrl: '../auth.page.scss'

})
export class LoginFormComponent implements OnInit, OnDestroy {
  @Output() switchToRegister = new EventEmitter<void>();

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

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private checkAuthenticationStatus(): void {
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.navigateToReturnUrl();
        }
      });
  }

  private getReturnUrl(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  private setupFormValidation(): void {
    this.loginForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (Object.keys(this.errors).length > 0) {
          this.errors = {};
        }

        const formErrors = FormErrorHandlerService.getErrorMessages(this.loginForm);
        if (Object.keys(formErrors).length > 0) {
          this.errors = {...this.errors, ...formErrors};
        }
      });
  }

  async onLoginSubmit(): Promise<void> {
    this.loginForm.markAllAsTouched();

    if (!this.loginForm.valid) {
      this.errors = FormErrorHandlerService.getErrorMessages(this.loginForm);
      this.toast.error('Por favor, corrija os erros no formulário.');
      return;
    }

    if (this.loading) {
      return;
    }

    this.loading = true;
    this.errors = {};

    try {
      await this.authService.login(this.loginForm.value);
      this.toast.success('Login efetuado com sucesso!');

      setTimeout(() => {
        this.navigateToReturnUrl();
      }, 100);

    } catch (error: any) {
      console.error('Login error:', error);

      if (error.status === 401) {
        this.toast.error('Email ou senha inválidos.');
      } else if (error.status === 429) {
        this.toast.error('Muitas tentativas de login. Tente novamente mais tarde.');
      } else if (error.status === 0) {
        this.toast.error('Erro de conexão. Verifique sua internet.');
      } else {
        this.errors = this.utils.handleErrorsForm(error, this.loginForm);

        if (Object.keys(this.errors).length === 0) {
          this.toast.error('Erro interno do servidor. Tente novamente.');
        }
      }
    } finally {
      this.loading = false;
    }
  }

  private navigateToReturnUrl(): void {
    this.router.navigate([this.returnUrl]);
  }

  protected readonly FormErrorHandlerService = FormErrorHandlerService;
}
