import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService } from '../shared/alert.service';
import { Alert, AlertType } from '../shared/Models/alert';
import { AlertGUI } from './AlertGUI';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {
  private subscription: Subscription;
  alerts: AlertGUI[] = []; // public??

  constructor(private alertService: AlertService) { }

  ngOnInit() {
    this.subscription = this.alertService.getAlert()
    .subscribe(alert => {
      let alertGUI: AlertGUI = new AlertGUI;

      switch (alert.type) {
        case AlertType.SUCCESS:
          alertGUI.cssClass = 'alert alert-success alert-dismissible fade show';
          break;
        case AlertType.WARNING:
          alertGUI.cssClass = 'alert alert-warning alert-dismissible fade show';
          break;
        case AlertType.ERROR:
          alertGUI.cssClass = 'alert alert-danger alert-dismissible fade show';
          break;
      }

      alertGUI.message = alert.message;

      console.log(alert.message);

      this.alerts.push(alertGUI);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe(); // am i supposed to do this manually???
  }

}
