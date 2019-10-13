import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private baseURL = 'https://localhost:44338/weather';

  constructor(private http: HttpClient) { }

  public GetRainProbForPoint(lat: number, lng: number): Observable<number> {
    const url = `${this.baseURL}/rainProb/${lat}/${lng}`;

    return this.http.get<number>(url)
      .pipe(
        map(percentage => percentage * 100),
        catchError(this.handleError<number>(0))
      );
  }

  public GetRainProbForPointReachableInAnHour(lat: number, lng: number, minuteWillReach: number): Observable<number> {
    const url = `${this.baseURL}/rainProb/minutely/${lat}/${lng}/${minuteWillReach}`; // do backend for this.

    return this.http.get<number>(url)
      .pipe(
        map(percentage => percentage * 100),
        catchError(this.handleError<number>(0))
      );
  }

  private handleError<T>(result?: T): any {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
