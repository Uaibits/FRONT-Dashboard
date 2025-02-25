import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[ubMask]',
  standalone: true,
})
export class MaskDirective implements OnInit {
  @Input('ubMask') maskPattern: string = ''; // Padrão de máscara (ex: "999.999.999-99|99-999-999/9999-99")
  @Input() showMaskTyped: boolean = true; // Mostrar a máscara enquanto digita

  private masks: string[] = []; // Lista de máscaras
  private currentMask: string = ''; // Máscara atual
  private inputElement: HTMLInputElement;

  constructor(private el: ElementRef) {
    this.inputElement = this.el.nativeElement;
  }

  ngOnInit(): void {
    this.masks = this.maskPattern.split('|'); // Divide as máscaras pelo caractere "|"
    this.updateMask(); // Aplica a máscara inicial
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const value = this.inputElement.value;
    const rawValue = this.removeMask(value); // Remove a máscara para calcular o comprimento
    this.updateMask(rawValue); // Atualiza a máscara com base no valor digitado
    this.applyMask(value); // Aplica a máscara ao valor
  }

  // Remove a máscara do valor
  private removeMask(value: string): string {
    return value.replace(/\D/g, ''); // Remove todos os não dígitos
  }

  // Atualiza a máscara com base no valor digitado
  private updateMask(rawValue: string = ''): void {
    if (this.masks.length > 1) {
      const rawLength = rawValue.length;

      // Encontra a máscara mais adequada com base no comprimento do valor
      for (let i = 0; i < this.masks.length; i++) {
        const maskLength = this.masks[i].replace(/\D/g, '').length; // Comprimento da máscara sem caracteres especiais

        // Se o valor digitado for menor ou igual ao comprimento da máscara atual, usa essa máscara
        if (rawLength <= maskLength) {
          this.currentMask = this.masks[i];
          break;
        }
      }
    } else {
      this.currentMask = this.masks[0]; // Usa a única máscara disponível
    }
  }

  // Aplica a máscara ao valor
  private applyMask(value: string): void {
    const rawValue = this.removeMask(value);
    let maskedValue = '';
    let maskIndex = 0;

    for (let i = 0; i < rawValue.length; i++) {
      if (maskIndex >= this.currentMask.length) break;

      if (this.currentMask[maskIndex] === '9') {
        maskedValue += rawValue[i]; // Adiciona o dígito
        maskIndex++;
      } else {
        maskedValue += this.currentMask[maskIndex]; // Adiciona o caractere da máscara
        maskIndex++;
        i--; // Mantém o índice do valor para o próximo dígito
      }
    }

    this.inputElement.value = maskedValue;
  }
}
