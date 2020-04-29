import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertService } from '../shared/alert.service';
import { Alert, AlertType } from '../shared/Models/alert';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {
  private alertObservableSubscription: Subscription;
  public alerts: Alert[] = [];

  constructor(private alertService: AlertService) { }

  ngOnInit() {
    this.alertObservableSubscription = this.alertService.getAlertObservable()
    .subscribe(alert => {
      this.alerts.push(alert);
    });
  }

  ngOnDestroy() {
    this.alertObservableSubscription.unsubscribe(); // unsubs when comp deleted. This will enver happen but bonus points for future proofing?
  }

}
