import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthenticationService } from '../login/services/authentification.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Output() loginPressed: EventEmitter<boolean> = new EventEmitter();
  @Output() logOutPressed: EventEmitter<boolean> = new EventEmitter();

  public currentUsername: string = null;

  constructor(private authenticationService: AuthenticationService) { }

  ngOnInit() {
    this.authenticationService.currentUser.subscribe((currentUser) => {
      if (currentUser == null) {
        this.currentUsername = null;
      } else {
        this.currentUsername = currentUser.username;
      }
    });
  }

  public login() {
    this.loginPressed.emit(true);
  }

  public logOut() {
    this.logOutPressed.emit(true);
    this.currentUsername = null;
  }
}
