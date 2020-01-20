import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Point } from '../map/Model/Point';
import { RouteFromAPI } from '../map/Model/RouteFromAPI';
import { RouteIWant } from '../map/Model/RouteIWant';

@Injectable({
  providedIn: 'root'
})
export class MapRoutingService {

  private baseURL = 'https://localhost:44338/routing';

  constructor(private http: HttpClient) { }

  public GetRoutes(travelMode: string, startLat: number, startLng: number, endLat: number, endLng: number, numberofAlternates: number = 0): Observable<RouteFromAPI[]> {
    const url = `${this.baseURL}/${travelMode}/${numberofAlternates}/${startLat}/${startLng}/${endLat}/${endLng}`;


    const headerDict = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Authorization': 'Bearer eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1Nzk1MjU5NjMsImlzcyI6Im1lIiwiYXVkIjoieW91In0.fd1LOx6xxJOXXLLLmgimaqZEAkPkOo9m2H5L6dPcOCo'
    };
    
    const requestOptions = {                                                                                                                                                                                 
      headers: new HttpHeaders(headerDict)
    };
    


    return this.http.get<RouteFromAPI[]>(url, requestOptions);
      // .pipe(
      //   map(whatsReturnedFromApi => {
      //     whatsReturnedFromApi.forEach(route => { // IF SOMETHING BREAKS ITS PROB THIS.
      //       return new RouteIWant(route.points.map(
      //         point => {
      //           return new google.maps.LatLng(point.latitude, point.longitude);
      //         }), route.travelTimeInSeconds, route.distance);
      //     });
      //   }),
      //     catchError(this.handleError<RouteIWant>(new RouteIWant([], 0, 0)))
      // );

    // https://stackoverflow.com/questions/46197223/transforming-observable-with-map
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