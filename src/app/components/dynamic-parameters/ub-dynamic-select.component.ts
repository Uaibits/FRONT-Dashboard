import {
  Component,
  Input,
  forwardRef,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule
} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom, Subject, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {DropdownComponent} from '../form/dropdown/dropdown.component';
import {Utils} from '../../services/utils.service';

interface DynamicOption {
  label: string;
  value: any;
  raw?: any;
}

@Component({
  selector: 'ub-dynamic-select',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamicSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="dynamic-select-container">
      @if (label) {
        <label class="form-label">
          {{ label }}
          @if (required) {
            <span class="required-indicator">*</span>
          }
        </label>
      }

      <div class="dynamic-select-wrapper">
        <!-- Campo de busca -->
        <div class="search-box">
          <i class="bx bx-search search-icon"></i>
          <button
            type="button"
            class="reload-button"
            (click)="reload()"
            [disabled]="disabled || loading"
            [title]="'Recarregar opções'"
          >
            <i class="bx"
               [class.bx-loader-circle]="loading"
               [class.bx-loader-alt]="loading"
               [class.bx-refresh]="!loading"></i>
          </button>
        </div>

        <!-- Loading state -->
        @if (loading && !options.length) {
          <div class="loading-state">
            <i class="bx bx-loader-circle bx-spin"></i>
            <span>Carregando opções...</span>
          </div>
        }

        <!-- Error state -->
        @if (loadError && !loading) {
          <div class="error-state">
            <i class="bx bx-error-circle"></i>
            <span>{{ loadError }}</span>
            <button type="button" class="retry-button" (click)="reload()">
              Tentar novamente
            </button>
          </div>
        }

        <!-- Empty state -->
        @if (!loading && !loadError && options.length === 0) {
          <div class="empty-state">
            <i class="bx bx-inbox"></i>
            <span>Nenhuma opção disponível</span>
          </div>
        }

        <!-- Select dropdown -->
        @if (!loading && !loadError && options.length > 0) {
          <div class="select-wrapper">
            <ub-dropdown optionValue="value"
                         optionLabel="label"
                         [disabled]="disabled"
                         [options]="options"
                         [(ngModel)]="value"
                         [error]="error"
                         (ngModelChange)="onValueChange($event)">
            </ub-dropdown>
            <i class="bx bx-chevron-down select-icon"></i>
          </div>
        }

        <!-- Selected info (quando tem valor) -->
        @if (value && selectedOption && !loading) {
          <div class="selected-info">
            <i class="bx bx-check-circle"></i>
            <span>{{ selectedOption.label }}</span>
          </div>
        }
      </div>

      <!-- Help text -->
      @if (helpText) {
        <small class="help-text">
          <i class="bx bx-info-circle"></i>
          {{ helpText }}
        </small>
      }

      <!-- Error message -->
      @if (error) {
        <small class="error-text">
          <i class="bx bx-error-circle"></i>
          {{ error }}
        </small>
      }

    </div>
  `,
  styles: [`
    .dynamic-select-container {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .required-indicator {
      color: #dc3545;
      margin-left: 2px;
    }

    .dynamic-select-wrapper {
      position: relative;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      color: #6b7280;
      pointer-events: none;
      z-index: 1;
    }

    .search-input {
      flex: 1;
      padding: 0.625rem 2.5rem 0.625rem 2.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-input:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .reload-button {
      padding: 0.625rem 0.875rem;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .reload-button:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #3b82f6;
    }

    .reload-button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .reload-button i {
      font-size: 1rem;
      color: #6b7280;
    }

    .select-wrapper {
      position: relative;
    }

    .form-select {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
      appearance: none;
    }

    .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-select:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .form-select.error {
      border-color: #dc3545;
    }

    .select-icon {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      pointer-events: none;
      font-size: 0.75rem;
    }

    .selected-info {
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #166534;
    }

    .selected-info i {
      color: #16a34a;
    }

    .loading-state,
    .error-state,
    .empty-state {
      padding: 1.5rem;
      text-align: center;
      border: 1px dashed #d1d5db;
      border-radius: 6px;
      background: #f9fafb;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: #6b7280;
    }

    .loading-state i {
      font-size: 1.5rem;
      color: #3b82f6;
    }

    .error-state {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #991b1b;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }

    .error-state i {
      font-size: 1.5rem;
      color: #dc2626;
    }

    .retry-button {
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #dc2626;
      border-radius: 6px;
      color: #dc2626;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .retry-button:hover {
      background: #dc2626;
      color: white;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
      color: #6b7280;
    }

    .empty-state i {
      font-size: 1.5rem;
    }

    .help-text {
      display: block;
      margin-top: 0.5rem;
      color: #6b7280;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .error-text {
      display: block;
      margin-top: 0.5rem;
      color: #dc3545;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .debug-info {
      display: block;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #fef3c7;
      border-radius: 4px;
      color: #92400e;
      font-size: 0.75rem;
      font-family: monospace;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .pi-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class DynamicSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() label: string = '';
  @Input() placeholder: string = 'Selecione uma opção';
  @Input() searchPlaceholder: string = 'Pesquisar...';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() helpText: string = '';
  @Input() error: string = '';
  @Input() url: string = '';
  @Input() listPath: string = 'data';
  @Input() fieldValue: string = 'id';
  @Input() fieldLabel: string = 'name';
  @Input() reloadTriggers: string[] = []; // Nomes dos campos que disparam reload
  @Input() showDebug: boolean = false;

  value: any = '';
  options: DynamicOption[] = [];
  loading: boolean = false;
  loadError: string = '';
  selectedOption: DynamicOption | null = null;

  private searchSubject = new Subject<string>();
  private subscription = new Subscription();
  private onChange: (value: any) => void = () => {
  };
  private onTouched: () => void = () => {
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit() {
    this.loadOptions();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.searchSubject.complete();
  }

  loadOptions() {
    if (!this.url) {
      this.loadError = 'URL não configurada';
      return;
    }

    this.loading = true;
    this.loadError = '';

    const apiUrl = environment.api + this.url;

    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        this.options = this.parseResponse(response);
        this.loading = false;

        // Restaura a seleção se o valor atual ainda existe
        if (this.value) {
          this.updateSelectedOption();
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.loadError = error.error?.message || 'Erro ao carregar opções';
        this.options = [];
        this.cdr.detectChanges();
      }
    });
  }

  private parseResponse(response: any): DynamicOption[] {
    try {
      // Navega pelo listPath para encontrar o array de dados
      let data = response;
      const pathParts = this.listPath.split('.');

      for (const part of pathParts) {
        if (data && typeof data === 'object' && part in data) {
          data = data[part];
        } else {
          throw new Error(`Path ${this.listPath} não encontrado na resposta`);
        }
      }

      if (!Array.isArray(data)) {
        throw new Error('Dados retornados não são um array');
      }

      return data.map(item => ({
        value: this.getNestedValue(item, this.fieldValue),
        label: this.getNestedValue(item, this.fieldLabel),
        raw: item
      }));
    } catch (error) {
      console.error('Erro ao parsear resposta:', error);
      this.loadError = 'Erro ao processar dados recebidos';
      return [];
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  onSearchChange(term: string) {
    this.searchSubject.next(term);
  }

  reload() {
    this.loadOptions();
  }

  onValueChange(newValue: any) {
    this.value = newValue;
    this.updateSelectedOption();
    this.onChange(newValue);
    this.onTouched();
  }

  private updateSelectedOption() {
    this.selectedOption = this.options.find(opt => opt.value === this.value) || null;
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value || '';
    this.updateSelectedOption();
    this.cdr.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.detectChanges();
  }
}
