import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Point } from '../map/Model/Point';

@Injectable({
  providedIn: 'root'
})
export class MapRoutingService {

  private baseURL = 'https://localhost:44338/routing';

  constructor(private http: HttpClient) { }

  public GetRoute(startLat: number, startLng: number, endLat: number, endLng: number): Observable<google.maps.LatLng[]> {
    const url = `${this.baseURL}/${startLat}/${startLng}/${endLat}/${endLng}`;

    return this.http.get<Array<Point>>(url)
      .pipe(
        map(points => points.map(point => new google.maps.LatLng(point.latitude, point.longitude))),
        catchError(this.handleError<google.maps.LatLng[]>([]))
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