import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {LoginFormComponent} from './login/login.page';
import {RegisterFormComponent} from './register/register.page';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    LoginFormComponent,
    RegisterFormComponent
  ],
  template: `
    <div class="auth-container">
      <div class="background-wrapper">
        <!-- Ícones flutuantes fixos -->
        <div class="floating-icons">
          <div class="icon-box icon-1 primary">
            <i class='bx bx-bar-chart-alt-2'></i>
          </div>
          <div class="icon-box icon-2 secondary">
            <i class='bx bx-pie-chart-alt-2'></i>
          </div>
          <div class="icon-box icon-3 primary">
            <i class='bx bx-line-chart'></i>
          </div>
          <div class="icon-box icon-4 secondary">
            <i class='bx bx-data'></i>
          </div>
          <div class="icon-box icon-5 muted">
            <i class='bx bx-grid-alt'></i>
          </div>
          <div class="icon-box icon-6 primary">
            <i class='bx bx-trending-up'></i>
          </div>
          <div class="icon-box icon-7 secondary">
            <i class='bx bx-server'></i>
          </div>
          <div class="icon-box icon-8 muted">
            <i class='bx bx-chip'></i>
          </div>
          <div class="icon-box icon-9 primary">
            <i class='bx bx-shield-alt-2'></i>
          </div>
          <div class="icon-box icon-10 secondary">
            <i class='bx bx-cloud-upload'></i>
          </div>
        </div>

        <!-- Card de autenticação -->
        <div class="auth-card-wrapper" [class.register-mode]="isRegisterMode">
          <div class="auth-card">
            <!-- Header -->
            <div class="auth-header">
              <div class="logo-container">
                <img src="assets/uaibits.png" alt="UaiBits Logo" class="company-logo">
              </div>
              <div class="welcome-text">
                <h2 class="welcome-title">
                  {{ isRegisterMode ? 'Criar Conta' : 'Bem-vindo de volta' }}
                </h2>
                <p class="welcome-subtitle">
                  {{ isRegisterMode ? 'Preencha os dados para começar' : 'Faça login para continuar' }}
                </p>
              </div>
            </div>

            <!-- Formulários -->
            @if (!isRegisterMode) {
              <app-login-form
                (switchToRegister)="switchMode('register')">
              </app-login-form>
            }

            @if (isRegisterMode) {
              <app-register-form
                (switchToLogin)="switchMode('login')">
              </app-register-form>
            }
          </div>
        </div>

        <!-- Copyright -->
        <div class="copyright">
          <p>© {{ currentYear }} UaiBits. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './auth.page.scss'
})
export class AuthPage implements OnInit {
  isRegisterMode = false;
  currentYear: number = new Date().getFullYear();
  returnUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Captura o returnUrl dos query params
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || null;
    });

    // Detecta a rota atual para saber qual modo exibir
    this.route.url.subscribe(segments => {
      const path = segments[0]?.path || '';
      this.isRegisterMode = path === 'registrar' || path === 'cadastro';
    });
  }

  switchMode(mode: 'login' | 'register'): void {
    this.isRegisterMode = mode === 'register';
    const newPath = mode === 'register' ? '/auth/registrar' : '/auth/logar';

    // Preserva o returnUrl ao trocar de modo
    const navigationExtras = this.returnUrl
      ? { queryParams: { returnUrl: this.returnUrl } }
      : {};

    this.router.navigate([newPath], navigationExtras);
  }
}
