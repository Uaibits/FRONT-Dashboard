import { Directive, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[clickOutside]'
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  onClick(targetElement: HTMLElement): void {
    if (!this.elementRef.nativeElement.contains(targetElement)) {
      this.clickOutside.emit();
    }
  }
}
