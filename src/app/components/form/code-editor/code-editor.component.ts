import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseInputComponent } from '../base-input.component';

import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { php } from '@codemirror/lang-php';
import { xml } from '@codemirror/lang-xml';
import { markdown } from '@codemirror/lang-markdown';

export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'sql'
  | 'html'
  | 'css'
  | 'json'
  | 'python'
  | 'java'
  | 'php'
  | 'xml'
  | 'markdown'
  | 'text';

export type CodeTheme = 'light' | 'dark';

@Component({
  selector: 'ub-code-editor',
  imports: [BaseInputComponent],
  templateUrl: './code-editor.component.html',
  standalone: true,
  styleUrls: ['../base-input.component.scss', './code-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CodeeditorComponent),
      multi: true,
    },
  ],
})
export class CodeeditorComponent implements ControlValueAccessor, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef<HTMLDivElement>;

  @Input() label: string = '';
  @Input() helpText: string = '';
  @Input() placeholder: string = '';
  @Input() value: string = '';
  @Input() error: string = '';
  @Input() success: string = '';
  @Input() language: CodeLanguage = 'javascript';
  @Input() theme: CodeTheme = 'light';
  @Input() maxlength: number | undefined = undefined;
  @Input() minLength: number | undefined = undefined;
  @Input() height: string = '200px'; // Altura do editor
  @Input() readonly: boolean = false;
  @Input() lineNumbers: boolean = true;
  @Input() lineWrapping: boolean = false;
  @Input() indentWithTab: boolean = true;
  @Input() tabSize: number = 2;
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() change = new EventEmitter<string>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  characterCount: number = 0;
  lineCount: number = 1;

  private editorView: EditorView | null = null;
  private onChange: any = () => {};
  private onTouched: any = () => {};

  ngAfterViewInit(): void {
    this.initializeEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.editorView) {
      if (changes['language'] && !changes['language'].firstChange) {
        this.reinitializeEditor();
      }
      if (changes['theme'] && !changes['theme'].firstChange) {
        this.reinitializeEditor();
      }
      if (changes['readonly'] && !changes['readonly'].firstChange) {
        this.updateReadonly();
      }
      if (changes['disabled'] && !changes['disabled'].firstChange) {
        this.updateDisabled();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.editorView) {
      this.editorView.destroy();
    }
  }

  writeValue(value: string): void {
    this.value = value || '';
    this.updateCharacterCount();
    this.updateLineCount();

    if (this.editorView) {
      const currentValue = this.editorView.state.doc.toString();
      if (currentValue !== this.value) {
        this.editorView.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: this.value
          }
        });
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.updateDisabled();
  }

  private initializeEditor(): void {
    const extensions = [
      basicSetup,
      this.getLanguageExtension(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          this.value = newValue;
          this.updateCharacterCount();
          this.updateLineCount();
          this.onChange(newValue);
          this.valueChange.emit(newValue);
          this.change.emit(newValue);
        }
      }),
      EditorView.domEventHandlers({
        focus: () => {
          this.onTouched();
          this.focus.emit();
        },
        blur: () => {
          this.blur.emit();
        }
      }),
      EditorView.theme({
        '&': {
          height: this.height,
        },
        '.cm-content': {
          'min-height': this.height,
          'font-family': 'JetBrains Mono, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          'font-size': '14px',
          'line-height': '1.5',
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-editor': {
          'border-radius': '4px',
          'border': '1px solid #d1d5db',
        },
        '.cm-editor.cm-focused': {
          'border-color': '#3b82f6',
          'box-shadow': '0 0 0 3px rgba(59, 130, 246, 0.1)',
        },
      }),
      ...(this.theme === 'dark' ? [oneDark] : []),
      ...(this.readonly ? [EditorState.readOnly.of(true)] : []),
      ...(this.lineWrapping ? [EditorView.lineWrapping] : []),
      EditorState.tabSize.of(this.tabSize),
    ];

    const startState = EditorState.create({
      doc: this.value,
      extensions,
    });

    this.editorView = new EditorView({
      state: startState,
      parent: this.editorContainer.nativeElement,
    });

    this.updateDisabled();
  }

  private reinitializeEditor(): void {
    if (this.editorView) {
      const currentValue = this.editorView.state.doc.toString();
      this.editorView.destroy();
      this.value = currentValue;
      this.initializeEditor();
    }
  }

  private updateDisabled(): void {
    if (this.editorView) {
      this.editorView.dispatch();

      const editorElement = this.editorView.dom;
      if (this.disabled) {
        editorElement.style.opacity = '0.6';
        editorElement.style.pointerEvents = 'none';
      } else {
        editorElement.style.opacity = '1';
        editorElement.style.pointerEvents = 'auto';
      }
    }
  }

  private updateReadonly(): void {
    if (this.editorView) {
      this.editorView.dispatch();
    }
  }

  private getLanguageExtension() {
    switch (this.language) {
      case 'javascript':
      case 'typescript':
        return javascript();
      case 'sql':
        return sql();
      case 'html':
        return html();
      case 'css':
        return css();
      case 'json':
        return json();
      case 'python':
        return python();
      case 'java':
        return java();
      case 'php':
        return php();
      case 'xml':
        return xml();
      case 'markdown':
        return markdown();
      default:
        return [];
    }
  }

  private updateCharacterCount(): void {
    this.characterCount = this.value ? this.value.length : 0;
  }

  private updateLineCount(): void {
    this.lineCount = this.value ? this.value.split('\n').length : 1;
  }

  // Métodos públicos para controle externo
  public insertText(text: string): void {
    if (this.editorView && !this.disabled && !this.readonly) {
      const cursor = this.editorView.state.selection.main.head;
      this.editorView.dispatch({
        changes: { from: cursor, insert: text },
        selection: { anchor: cursor + text.length }
      });
    }
  }

  public selectAll(): void {
    if (this.editorView) {
      this.editorView.dispatch({
        selection: { anchor: 0, head: this.editorView.state.doc.length }
      });
      this.editorView.focus();
    }
  }

  public getSelectedText(): string {
    if (this.editorView) {
      const selection = this.editorView.state.selection.main;
      return this.editorView.state.doc.sliceString(selection.from, selection.to);
    }
    return '';
  }

  // Getters para validações
  get isMinLengthValid(): boolean {
    return this.minLength ? this.value.length >= this.minLength : true;
  }

  get isMaxLengthValid(): boolean {
    return this.maxlength ? this.value.length <= this.maxlength : true;
  }

  get hasValidationErrors(): boolean {
    return !this.isMinLengthValid || !this.isMaxLengthValid || !!this.error;
  }

  getLanguageDisplayName(): string {
    const languageNames: Record<CodeLanguage, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'sql': 'SQL',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'python': 'Python',
      'java': 'Java',
      'php': 'PHP',
      'xml': 'XML',
      'markdown': 'Markdown',
      'text': 'Text'
    };

    return languageNames[this.language] || this.language.toUpperCase();
  }
}
