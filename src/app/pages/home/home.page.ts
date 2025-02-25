import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage implements OnInit {


  ngOnInit() {
    console.log('Home page initialized');
  }


}
