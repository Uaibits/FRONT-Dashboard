import { Component } from '@angular/core';
import {ContentComponent} from '../../components/content/content.component';

@Component({
  selector: 'app-portals',
  imports: [
    ContentComponent
  ],
  templateUrl: './portals.page.html',
  standalone: true,
  styleUrl: './portals.page.scss'
})
export class PortalsPage {

}
