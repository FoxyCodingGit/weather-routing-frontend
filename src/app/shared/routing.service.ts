import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouteFromAPI } from '../map/Model/RouteFromAPI';
import { User } from '../login/user';
import { ReadableUserDefinedRoute } from './Models/ReadableUserDefinedRoute';

@Injectable({
  providedIn: 'root'
})
export class RoutingService {

  private baseURL = 'https://localhost:44338/routing';
  private userDefinedBaseURL = 'https://localhost:44338/api/UserDefinedRoute'; // TODO: on backend need to change the url.

  constructor(private http: HttpClient) { }

  public GetRoutes(travelMode: string, startLat: number, startLng: number,
                   endLat: number, endLng: number, numberofAlternates: number = 0): Observable<RouteFromAPI[]> {

    const url = `${this.baseURL}/${travelMode}/${numberofAlternates}/${startLat}/${startLng}/${endLat}/${endLng}`;
    return this.http.get<RouteFromAPI[]>(url);
  }

  public GetUserDefinedRoutes(): Observable<ReadableUserDefinedRoute[]> {
    const url = `${this.userDefinedBaseURL}/get/readable`;

    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));

    const requestOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Authorization': `Bearer ${currentUser.token}`
      })
    };

    return this.http.get<ReadableUserDefinedRoute[]>(url, requestOptions);
  }
}
