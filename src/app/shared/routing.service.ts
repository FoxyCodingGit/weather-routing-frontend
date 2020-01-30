import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouteFromAPI } from '../map/Model/RouteFromAPI';
import { User } from '../login/user';
import { ReadableUserDefinedRoute } from './Models/ReadableUserDefinedRoute';
import { RouteInformation } from '../map/Model/RouteInformation';
import { UserDefinedRoute } from './Models/UserDefinedRoute';

@Injectable({
  providedIn: 'root'
})
export class RoutingService {

  private baseURL = 'https://localhost:44338/routing';
  private userDefinedBaseURL = 'https://localhost:44338/api/UserDefinedRoute'; // TODO: on backend need to change the url.

  public static async getLocationName(latLng: google.maps.LatLng): Promise<string> {
    let geocoder = new google.maps.Geocoder;

    return new Promise(function(resolve, reject) {
      geocoder.geocode({ 'location': latLng }, function (results) {
        let addressOutput = '';

        if (!results) {
          addressOutput = 'Geocoder passed but result null';
        } else if (results[0]) {
          //that.zoom = 11;
          //that.currentLocation = results[0].formatted_address;

          console.log(results[0]);

          results[0].address_components.forEach(addressPart => {
            if (addressPart.types[0] === 'street_number'
            || addressPart.types[0] === 'route'
            || addressPart.types[0] === 'postal_code') {
              addressOutput += addressPart.long_name + ' ';
            }
          });

          addressOutput = addressOutput.substring(0, addressOutput.length - 1);

          resolve(addressOutput);
        } else {
          console.log('No results found');
          reject('Error!');
        }
      });
    });
  }

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

  public CreateUserDefinedRoute(routeInformation: RouteInformation): Observable<UserDefinedRoute[]> { // harcoding pedestrian in the stor proc executing code.

    const startCoords = routeInformation.route.getPath().getArray()[0];
    const endCoords = routeInformation.route.getPath().getArray()[routeInformation.route.getPath().getArray().length - 1];

    const url = `${this.userDefinedBaseURL}/create/${routeInformation.name}/Pedestrian/${startCoords.lat()}/${startCoords.lng()}/${endCoords.lat()}/${endCoords.lng()}`;

    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));

    const requestOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Authorization': `Bearer ${currentUser.token}`
      })
    };

    return this.http.get<UserDefinedRoute[]>(url, requestOptions);
  }
}
