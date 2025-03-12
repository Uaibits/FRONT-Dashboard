import {Component, Input} from '@angular/core';

@Component({
  selector: 'ub-tab',
  imports: [],
  templateUrl: './tab.component.html',
  standalone: true,
  styleUrl: './tab.component.scss'
})
export class TabComponent {
  @Input() label: string = '';
  @Input() active: boolean = false; //
}
