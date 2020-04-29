import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Alert, AlertType } from './Models/alert';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private subject = new Subject<Alert>(); // type??

  constructor() { }

  getAlert(): Observable<Alert> {
    return this.subject.asObservable();
  }

  success(header: string, message: string) {
    this.subject.next({ type: AlertType.SUCCESS, header, message });
  }

  warning(header: string, message: string) {
    this.subject.next({ type: AlertType.WARNING, header, message });
  }

  error(header: string, message: string) {
    this.subject.next({ type: AlertType.ERROR, header, message });
  }
}
