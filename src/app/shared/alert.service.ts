import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Alert, AlertType } from './Models/alert';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<Alert>();

  constructor() { }

  getAlertObservable(): Observable<Alert> {
    return this.alertSubject.asObservable();
  }

  success(header: string, message: string) {
    this.alertSubject.next({ type: AlertType.SUCCESS, header, message, cssClass: 'alert alert-success alert-dismissible fade show' });
  }

  warning(header: string, message: string) {
    this.alertSubject.next({ type: AlertType.WARNING, header, message, cssClass: 'alert alert-warning alert-dismissible fade show' });
  }

  error(header: string, message: string) {
    this.alertSubject.next({ type: AlertType.ERROR, header, message, cssClass: 'alert alert-danger alert-dismissible fade show' });
  }
}
