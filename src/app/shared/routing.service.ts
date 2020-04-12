import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouteFromAPI } from '../map/Model/RouteFromAPI';
import { User } from '../login/user';
import { ReadableUserDefinedRoute } from './Models/ReadableUserDefinedRoute';
import { RouteInformation } from '../map/Model/RouteInformation';
import { UserDefinedRoute } from './Models/UserDefinedRoute';
import { RouteIWant } from '../map/Model/RouteIWant';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';
import { WeatherService } from './weather.service';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class RoutingService {
  private newRoutesSubject = new Subject<RouteAndWeatherInformation[]>();
  private routeCreationOnError = new Subject<void>();

  public getNewRoutes(): Observable<RouteAndWeatherInformation[]> {
    return this.newRoutesSubject.asObservable();
  }

  public getRouteCreationOnError(): Subject<void> {
    return this.routeCreationOnError;
  }

  public static routeAndWeatherInformation: RouteAndWeatherInformation[] = []; // TODO: WHEN INVLAID ONE ADDED FOR BEING TOO LONG. ARRAY NOT UDPATED prop so get id match problems
  public static routeId = 0;
  private readonly numberOfAltRoutes = 0;

  private baseURL = 'https://localhost:44338/routing';
  private userDefinedBaseURL = 'https://localhost:44338/api/UserDefinedRoute'; // TODO: on backend need to change the url.

  constructor(private http: HttpClient, private weatherService: WeatherService, private alertService: AlertService) { }

  public GetRoutes(travelMode: string, startLat: number, startLng: number,
                   endLat: number, endLng: number, numberofAlternates: number = 0): Observable<RouteFromAPI[]> {

    const url = `${this.baseURL}/${travelMode}/${numberofAlternates}/${startLat}/${startLng}/${endLat}/${endLng}`;
    return this.http.get<RouteFromAPI[]>(url);
  }

  public GetReadableUserDefinedRoutes(): Observable<ReadableUserDefinedRoute[]> {
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

  public createUserDefinedRoute(routeInformation: RouteInformation): Observable<UserDefinedRoute> { // harcoding pedestrian in the stor proc executing code.
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

    return this.http.get<UserDefinedRoute>(url, requestOptions);
  }

  public deleteUserDefinedRouteOnDB(databaseRouteId: string): Observable<UserDefinedRoute> { // harcoding pedestrian in the stor proc executing code.
    const url = `${this.userDefinedBaseURL}/delete/${databaseRouteId}`;

    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));

    const requestOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Authorization': `Bearer ${currentUser.token}`
      })
    };

    return this.http.get<UserDefinedRoute>(url, requestOptions);
  }

  public async applyUserDefinedRoutes() {
    let userSavedRoutes: ReadableUserDefinedRoute[];

    await this.GetReadableUserDefinedRoutes().toPromise().then(result => {
      userSavedRoutes = result;
    });

    userSavedRoutes.forEach(route => {
      this.alalalal(route.readableRouteId.toString(), true, route.routeName, route.modeOfTransport, route.startLat, route.startLng, route.endLat, route.endLng);
    });
  }

  public alalalal(databaseRouteId: string, isFavourite: boolean, routeName: string, travelMode: string, startLat: number, startLng: number, endLat: number, endLng: number) {
    this.GetRoutes(travelMode, startLat, startLng, endLat, endLng, this.numberOfAltRoutes).subscribe(
      async (routes: RouteFromAPI[]) => {

        let newRoutesFormat: RouteIWant[] = this.RouteFromAPIToRouteIWant(routes);
        
        newRoutesFormat.forEach(async routeInformation => {
          let newRoutes: RouteAndWeatherInformation[] = [];

          if (this.isRouteOverFourtyMinutes(routeInformation.travelTimeInSeconds)) {
            this.alertService.warning("Can't add route that takes longer than 40 minutes.")
            this.routeCreationOnError.next();
          } else {
            await this.createRouteWithWeatherInfo(databaseRouteId, isFavourite, routeInformation, routeName).then(route => {
              newRoutes.push(route);
            });

            this.newRoutesSubject.next(newRoutes); // needs to be here so async. Doesnt matter that multiple routes will call this one at a time.
          }
        });
      },
      (error) => {
        this.alertService.error("Creation of routes was unsuccessful. " + error)
      }
    );
  }

  
  private RouteFromAPIToRouteIWant(routes: RouteFromAPI[]): RouteIWant[] { // move to service or someytinh
    let newRouteIWantFormat: RouteIWant[] = [];

    routes.forEach(route => {
      let latLngs: google.maps.LatLng[] = [];
      route.points.forEach(point => {
        latLngs.push(new google.maps.LatLng(point.latitude, point.longitude));
      });

      newRouteIWantFormat.push(new RouteIWant(latLngs, route.travelTimeInSeconds, route.distance));
    });

    return newRouteIWantFormat;
  }

  private async createRouteWithWeatherInfo(databaseRouteId: string, isFavourite: boolean, routeInformation: RouteIWant, routeName: string): Promise<RouteAndWeatherInformation> {
    let mapRoute = new google.maps.Polyline({
      path: routeInformation.points,
      geodesic: true,
      strokeColor: routeInformation.colour + ', 1)',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    let thisRoute = new RouteInformation(RoutingService.routeId, mapRoute, routeInformation.travelTimeInSeconds, routeName, routeInformation.colour, routeInformation.distance, isFavourite, databaseRouteId);
    RoutingService.routeId++;

    return await this.weatherService.addWeatherInformationToRoute(thisRoute);
  }

  private isRouteOverFourtyMinutes(durationInSeconds: number): boolean {
    return (durationInSeconds / 60) > 40;
  }
}
