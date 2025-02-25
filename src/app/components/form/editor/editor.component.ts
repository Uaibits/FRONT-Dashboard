import { Component, EventEmitter, forwardRef, Input, Output, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseInputComponent } from '../base-input.component';
import Quill from 'quill';

@Component({
  selector: 'ub-editor',
  imports: [BaseInputComponent],
  templateUrl: './editor.component.html',
  standalone: true,
  styleUrls: ['editor.component.scss', '../base-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorComponent),
      multi: true,
    },
  ],
})
export class EditorComponent implements ControlValueAccessor, AfterViewInit {
  @Input() label: string = '';
  @Input() helpText: string = '';
  @Input() placeholder: string = '';
  @Input() value: string = '';
  @Input() error: string = '';
  @Input() success: string = '';
  @Input() modules: any = {}; // Módulos personalizados do Quill
  @Output() valueChange = new EventEmitter<string>();
  @Output() input = new EventEmitter<Event>();
  @Output() change = new EventEmitter<Event>();

  @ViewChild('editor') editorElement!: ElementRef;

  private quill!: Quill;
  private defaultModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // Formatação básica
      [{ header: 1 }, { header: 2 }], // Cabeçalhos
      [{ list: 'ordered' }, { list: 'bullet' }], // Listas
      ['link', 'image'], // Links e imagens
      ['clean'], // Limpar formatação
    ],
  };

  onChange: any = () => {};
  onTouched: any = () => {};

  ngAfterViewInit(): void {
    this.initializeQuill();
  }

  // Inicializa o Quill
  private initializeQuill(): void {
    const editorContainer = this.editorElement.nativeElement;
    const modules = { ...this.defaultModules, ...this.modules }; // Combina módulos padrão com personalizados

    this.quill = new Quill(editorContainer, {
      theme: 'snow',
      placeholder: this.placeholder,
      modules,
    });

    // Define o valor inicial
    if (this.value) {
      this.quill.root.innerHTML = this.value;
    }

    // Atualiza o valor quando o conteúdo do editor muda
    this.quill.on('text-change', () => {
      const html = this.quill.root.innerHTML;
      this.value = html;
      this.onChange(html);
      this.valueChange.emit(html);
      this.input.emit(new Event('input'));
    });
  }

  writeValue(value: string): void {
    this.value = value || '';
    if (this.quill) {
      this.quill.root.innerHTML = this.value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
