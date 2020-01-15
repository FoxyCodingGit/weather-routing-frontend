import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Output() loginPressed: EventEmitter<boolean> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  public login() {
    this.loginPressed.emit(true);
  }

}
