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

  success(message: string) {
    this.subject.next({ type: AlertType.SUCCESS, message: message });
  }
  
  warning(message: string) {
    this.subject.next({ type: AlertType.WARNING, message: message });
  }
  
  error(message: string) {
    this.subject.next({ type: AlertType.ERROR, message: message });
  }
}
