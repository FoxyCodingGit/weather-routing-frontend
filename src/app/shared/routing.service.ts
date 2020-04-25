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
import { TravelMode } from './Models/travelMode';
import { Location } from '../shared/Models/Elevation/Location';
import { ElevationResponse } from './Models/Elevation/ElevationResponse';
import { WeatherPoint } from '../map/Model/weatherPoint';

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

  private routeAndWeatherInformation: RouteAndWeatherInformation[] = [];
  public static routeId = 0;
  private readonly numberOfAltRoutes = 0;
  private howManyWeatherMarkerChecks = 6;

  private baseURL = 'https://localhost:44338/routing';
  private userDefinedBaseURL = 'https://localhost:44338/api/UserDefinedRoute'; // TODO: on backend need to change the url.

  constructor(private http: HttpClient, private weatherService: WeatherService, private alertService: AlertService) { }

  public getRouteAndWeatherInformation(): RouteAndWeatherInformation[] {
    return this.routeAndWeatherInformation;
  }

  public getRouteAndWeatherInformationById(routeId: number): RouteAndWeatherInformation {
    let routeInfo: RouteAndWeatherInformation;

    this.routeAndWeatherInformation.forEach(element => {
      if (element.routeInformation.id == routeId) routeInfo = element;
    });

    if (routeInfo != null) {
      return routeInfo;
    }

    this.alertService.error("Can't find route of id " + routeId + ". Returning first route in list.")
    return this.routeAndWeatherInformation[0];
  }

  public pushToRouteAndWeatherInformation(routeAndWeatherInformation: RouteAndWeatherInformation) {
    this.routeAndWeatherInformation.push(routeAndWeatherInformation);
  }

  public removeRouteAndWeatherInformationOfrouteId(routeId: number): void {
    this.routeAndWeatherInformation.filter(item => !(item.routeInformation.id == routeId));
  }

  public getLastRoute(): RouteAndWeatherInformation {
    return this.getRouteAndWeatherInformationById(RoutingService.routeId - 1);
  }
  
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

    for (let i = 0; i < userSavedRoutes.length; i++) {
      await this.alalalal(userSavedRoutes[i].readableRouteId.toString(), true, userSavedRoutes[i].routeName, userSavedRoutes[i].modeOfTransport, userSavedRoutes[i].startLat, userSavedRoutes[i].startLng, userSavedRoutes[i].endLat, userSavedRoutes[i].endLng);
    }
  }

  public async alalalal(databaseRouteId: string, isFavourite: boolean, routeName: string, travelMode: string, startLat: number, startLng: number, endLat: number, endLng: number) {
    await this.GetRoutes(travelMode, startLat, startLng, endLat, endLng, this.numberOfAltRoutes).toPromise().then(async (routes: RouteFromAPI[]) => {
      let newRoutesFormat: RouteIWant[] = this.RouteFromAPIToRouteIWant(routes);

      for (let i = 0; i < newRoutesFormat.length; i++) {
        let newRoutes: RouteAndWeatherInformation[] = [];
        if (this.isRouteOverFourtyMinutes(newRoutesFormat[i].travelTimeInSeconds)) {
          this.alertService.warning("Can't add route that takes longer than 40 minutes.");
          this.routeCreationOnError.next();
        } else {
          await this.createRouteWithWeatherInfo(databaseRouteId, isFavourite, newRoutesFormat[i], routeName, travelMode).then(route => {
            newRoutes.push(route);
          });
          this.newRoutesSubject.next(newRoutes); // needs to be here so async. Doesnt matter that multiple routes will call this one at a time.
        }
      }
    }, (error) => {
      this.alertService.error("Creation of routes was unsuccessful. " + error.toString());
    });
  }

  public getElevation(locations: Location[]): Observable<ElevationResponse> {
    const requestOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    
    return this.http.post<ElevationResponse>(`${this.baseURL}/elevation`, locations, requestOptions);
  }

  private setWeatherLegsEqualDistanceApart(thisRoute: RouteInformation): void {
    for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
      const distancePercentageAlongRoute = i * (1 / (this.howManyWeatherMarkerChecks - 1));  // if four for example -> 0 33 66 100 the middle two are 1/3 and 2/3. top begins at one and below is one less that howmanyweathermarkers
      this.calculateWithLegIsClosestToDistance(thisRoute, thisRoute.distance * distancePercentageAlongRoute);
    }
    console.log(thisRoute.weatherPoints);
  }

  private calculateWithLegIsClosestToDistance(thisRoute: RouteInformation, idealDistance: number): void { // make sure value not off by one!!
    const route = thisRoute.route;
    const totalDistance = thisRoute.distance;
    
    if (idealDistance === 0) {
      this.addToWeatherPointSetAndBeUniqueByLegNum(thisRoute, 0, 0);
    } else if (totalDistance === idealDistance) { // both -1 at end of lines are so it can match the array number that starts from zero.
      this.addToWeatherPointSetAndBeUniqueByLegNum(thisRoute, route.getPath().getArray().length - 1, totalDistance);
    } else {
      let toNextWeatherPointDistance = 0;
      let accumulatedDistance: number;
      
      for (let i = 0; i < route.getPath().getArray().length - 1; i++) { // do if at start or finish give back quick value. currently going to one less than the full distanceToNextPoint.
        accumulatedDistance = toNextWeatherPointDistance;

        toNextWeatherPointDistance += this.distanceToNextLatLngValue(route.getPath().getArray(), i);
        
        if (toNextWeatherPointDistance >= idealDistance) { // its gone over

          const distanceOverIdealDistance = toNextWeatherPointDistance - idealDistance;
          const distanceUnderIdealDistance = idealDistance - accumulatedDistance

          if (distanceOverIdealDistance < distanceUnderIdealDistance) { // if gap of station over
            this.addToWeatherPointSetAndBeUniqueByLegNum(thisRoute, i + 1, toNextWeatherPointDistance);
            break;
          } else {
            this.addToWeatherPointSetAndBeUniqueByLegNum(thisRoute, i, toNextWeatherPointDistance);
            break;
          }
        }
      }
    }
  }

  private addToWeatherPointSetAndBeUniqueByLegNum(thisRoute: RouteInformation, legNumberInRoute: number, distance: number): void {
    const newWeatherPoint: WeatherPoint = {
      legNumberInRoute: legNumberInRoute,
      distance: Math.abs(distance)
    } 

    const LegNums = [];

    thisRoute.weatherPoints.forEach(weatherPoint => {
      if (!LegNums.includes(weatherPoint.legNumberInRoute)) {
        LegNums.push(weatherPoint.legNumberInRoute);
      }
    });

    if (!LegNums.includes(legNumberInRoute)) thisRoute.weatherPoints.push(newWeatherPoint);
  }

  public getLatLngFromDistance(distance: number, routeInfo: RouteAndWeatherInformation): google.maps.LatLng {
    if (distance == 0) {
      return routeInfo.routeInformation.route.getPath().getArray()[0];
    }

    let lastLegIndex = this.getLastPastLegIndex(distance, routeInfo.routeInformation);
    let percentageOfCurrentDistancePastLastLegToNextOne = this.getPercentageOfCurrentDistancePastLastLegToNextOne(distance, routeInfo, lastLegIndex);
    return this.getLatLngAtProposedDistance(percentageOfCurrentDistancePastLastLegToNextOne, routeInfo, lastLegIndex);
  }

  private getLastPastLegIndex(distance: number, routeInfo: RouteInformation): number {
    for(let i = 0; i < routeInfo.cumulativeDistances.length; i++) {
      if (distance < routeInfo.cumulativeDistances[i]) {
        return i - 1;
      }
    }
  }

  private getPercentageOfCurrentDistancePastLastLegToNextOne(distance: number, routeInfo: RouteAndWeatherInformation, lastLegIndex: number, ) {
    let distanceFromPrevToCurrentDistance = distance - routeInfo.routeInformation.cumulativeDistances[lastLegIndex];
    let distanceBetweenTwoNearestLegs = this.distanceToNextLatLngValue(routeInfo.routeInformation.route.getPath().getArray(), lastLegIndex);
    return distanceFromPrevToCurrentDistance / distanceBetweenTwoNearestLegs;
  }

  private getLatLngAtProposedDistance(percentageOfCurrentDistancePastLastLegToNextOne: number, routeInfo: RouteAndWeatherInformation, lastLegIndex: number): google.maps.LatLng {
    let lastLegValue = routeInfo.routeInformation.route.getPath().getArray()[lastLegIndex];
    let nextLegValue = routeInfo.routeInformation.route.getPath().getArray()[lastLegIndex + 1];

    let latDiff = nextLegValue.lat() - lastLegValue.lat();
    let lngDiff = nextLegValue.lng() - lastLegValue.lng();

    let newLat = lastLegValue.lat() + (latDiff * percentageOfCurrentDistancePastLastLegToNextOne); 
    let newLng = lastLegValue.lng() + (lngDiff * percentageOfCurrentDistancePastLastLegToNextOne); 

    return new google.maps.LatLng(newLat, newLng);
  }

 //////// THESE THREE FUNCTIONS COPIED INTO WEATHER SERVICE TO AVOID CIRCULAR DEP. EASY FIX TO CREATE NEW SERVICE.

  public distanceToNextLatLngValue(routePath: google.maps.LatLng[], i: number): number {
    return Math.abs(this.HaversineFormula(routePath[i].lat(), routePath[i].lng(), routePath[i+1].lat(), routePath[i+1].lng())); // I DONT THINK MATH ABS IS NOW NEEDED?!
  }

  private HaversineFormula(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371; // radius of Earth in km
    const dLat = this.degreeToRadian(lat2 - lat1);
    const dLng = this.degreeToRadian(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreeToRadian(lat1)) * Math.cos(this.degreeToRadian(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000;
  }
  
  private degreeToRadian(deg) {
    return deg * (Math.PI / 180);
  }

  //////////////////////////////////////////////////////////////////////////////
  
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

  private async createRouteWithWeatherInfo(databaseRouteId: string, isFavourite: boolean, routeInformation: RouteIWant, routeName: string, travelMode: string): Promise<RouteAndWeatherInformation> {
    let mapRoute = new google.maps.Polyline({
      path: routeInformation.points,
      geodesic: true,
      strokeColor: routeInformation.colour + ', 1)',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    let thisRoute = new RouteInformation(this, RoutingService.routeId, mapRoute, routeInformation.travelTimeInSeconds, routeName, routeInformation.colour, routeInformation.distance, isFavourite, databaseRouteId, this.stringToTravelType(travelMode));
    await thisRoute.getStartEndLocationNameAsync();
    this.setWeatherLegsEqualDistanceApart(thisRoute);

    RoutingService.routeId++;

    return await this.weatherService.addWeatherInformationToRoute(thisRoute);
  }

  private stringToTravelType(value: string): TravelMode {
    if (value.toLowerCase() === 'pedestrian') { return TravelMode.PEDESTRIAN; }
    if (value.toLowerCase() === 'bicycle') { return TravelMode.BICYCLE; }
    if (value.toLowerCase() === 'car') { return TravelMode.CAR; }
  }

  private isRouteOverFourtyMinutes(durationInSeconds: number): boolean {
    return (durationInSeconds / 60) > 40;
  }
}
