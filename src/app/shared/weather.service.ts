import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MinutelyRainData } from '../map/Model/MinutelyRainData';
import { RouteInformation } from '../map/Model/RouteInformation';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private baseURL = 'https://localhost:44338/weather';
  private howManyWeatherMarkerChecks = 10;

  private graphTimeMin = 0; // need to decide if these be these or can be dynamic
  private graphTimeMax = 20;
  private graphTimeInterval = 5;

  private averageWalkingDistanceMetersPerSecond = 1.4;

  constructor(private http: HttpClient) { }

  public generateOverallRouteScore(routeAndWeatherInformation: RouteAndWeatherInformation, whenRouteisStartedFromNow: number = 0): number {
    let expectedValue = 0;
    const whichDepartureTimeAreWeGettingScoreOf = whenRouteisStartedFromNow / 5;

    for (let focusedStationData = 0; focusedStationData < routeAndWeatherInformation.rainIntensities[0].length; focusedStationData++) {
      expectedValue += routeAndWeatherInformation.rainIntensities[whichDepartureTimeAreWeGettingScoreOf][focusedStationData] *
        routeAndWeatherInformation.rainProbabilities[whichDepartureTimeAreWeGettingScoreOf][focusedStationData];
    }

    return expectedValue; // might want to take away from 100 so bigger number is better.
  }

  public async addWeatherInformationToRoute(thisRoute: RouteInformation, mapRee: google.maps.Map): Promise<RouteAndWeatherInformation> {
    let weatherLegPositionsInRoute = this.getWeatherLegPointInRouteToBeEquiDistanceApart(thisRoute);

    return await this.getMinutelyData(thisRoute.route.getPath().getArray(), weatherLegPositionsInRoute).then(minutelyRainData => {
      this.placeWeatherMarkers(thisRoute, weatherLegPositionsInRoute, mapRee);

      let rainIntensity = this.getRainIntensityPerWeatherPointPerPerInterval
        (thisRoute.route.getPath().getArray(), minutelyRainData, weatherLegPositionsInRoute);
      let rainProabilities = this.getRainProbPerWeatherPointPerPerInterval
        (thisRoute.route.getPath().getArray(), minutelyRainData, weatherLegPositionsInRoute);

      return new RouteAndWeatherInformation(thisRoute, rainIntensity, rainProabilities);
    });
  }


  private placeWeatherMarkers(route: RouteInformation, weatherLegs: number[], mapRee: google.maps.Map) {
    for (let i = 1; i < this.howManyWeatherMarkerChecks - 1; i++) {
      let weatherMarker = new google.maps.Marker({ // add marker to array that is currntly not being used.
        map: mapRee,
        position: { lat: route.route.getPath().getArray()[weatherLegs[i]].lat(), lng: route.route.getPath().getArray()[weatherLegs[i]].lng() },
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
      });
    }
  }

  private async getMinutelyData(mapRoute: google.maps.LatLng[], weatherLegs: number[]): Promise<MinutelyRainData[][]> {
    let MinutelyDatForThisWeatherMarkers: MinutelyRainData[][] = [];

    console.log(mapRoute.toString());

    for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
      await this.GetRainMinutelyDataForWeatherPoint(mapRoute[weatherLegs[i]].lat(),
        mapRoute[weatherLegs[i]].lng()).toPromise().then(minutelyRainData => {
          MinutelyDatForThisWeatherMarkers.push(minutelyRainData);
          console.log('got minute data for weather marker: ' + i + 'at leg number: ' + weatherLegs[i]);
      });
    }

    return MinutelyDatForThisWeatherMarkers;
  }

  private getWeatherLegPointInRouteToBeEquiDistanceApart(thisRoute: RouteInformation): number[] {
    let equallySpacedLocaitonForWeatherPointsInRoute: number[] = []

    for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
      let distancePercentageAlongRoute = i * (1 / (this.howManyWeatherMarkerChecks - 1));  // if four for example -> 0 33 66 100 the middle two are 1/3 and 2/3. top begins at one and below is one less that howmanyweathermarkers
      let legNumber = this.calculateWithLegIsClosestForDistance(thisRoute.route, thisRoute.distance, thisRoute.distance * distancePercentageAlongRoute);
      equallySpacedLocaitonForWeatherPointsInRoute.push(legNumber);
    }
    return equallySpacedLocaitonForWeatherPointsInRoute;
  }

  private calculateWithLegIsClosestForDistance(route: google.maps.Polyline, totalDistance: number, weatherPointDistance: number): number { // make sure value not off by one!!
    if (weatherPointDistance === 0) {
      return 0;
    } else if (totalDistance === weatherPointDistance) { // both -1 at end of lines are so it can match the array number that starts from zero.
      return route.getPath().getArray().length - 1;
    } else {
      let distanceToNextPoint = 0;
      let distanceToFocusedPoint: number;

      for (let i = 0; i < route.getPath().getArray().length - 1; i++) { // do if at start or finish give back quick value. currently going to one less than the full distanceToNextPoint.
        distanceToFocusedPoint = distanceToNextPoint;
        distanceToNextPoint += this.distanceToNextLatLngValue(route.getPath().getArray(), i);
        
        if (distanceToNextPoint >= weatherPointDistance) {
          if (distanceToNextPoint - weatherPointDistance < weatherPointDistance - distanceToFocusedPoint) { // prob dont need abs
            return i + 1;
          } else {
            return i;
          }
        }
      } // TODO: Some markers are placed on the same leg (unlikely but possible.)
    }
  }

  private distanceToNextLatLngValue(routePath: google.maps.LatLng[], i: number) {
    return Math.abs(this.HaversineFormula(routePath[i].lat(), routePath[i].lng(), routePath[i+1].lat(), routePath[i+1].lng())); // I DONT THINK MATH ABS IS NOW NEEDED?!
  }

  private HaversineFormula(lat1, lng1, lat2, lng2) {
    var R = 6371; // radius of Earth in km
    var dLat = this.degreeToRadian(lat2 - lat1);
    var dLng = this.degreeToRadian(lng2 - lng1);

    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreeToRadian(lat1)) * Math.cos(this.degreeToRadian(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000;
  }

  private degreeToRadian(deg) {
    return deg * (Math.PI / 180);
  }


  private getRainIntensityPerWeatherPointPerPerInterval(routePath: google.maps.LatLng[], MinutelyDatForThisWeatherMarkers: MinutelyRainData[][], weatherLegs: number[]): number[][] {
    var RainDataForEachPoint: MinutelyRainData[][] = this.getRainDataAtEachWeatherPointPerInterval(routePath, MinutelyDatForThisWeatherMarkers, weatherLegs);
    return this.justGetIntensities(RainDataForEachPoint);
  }

  private getRainProbPerWeatherPointPerPerInterval(routePath: google.maps.LatLng[], MinutelyDatForThisWeatherMarkers: MinutelyRainData[][], weatherLegs: number[]): number[][] {
    var RainDataForEachPoint: MinutelyRainData[][] = this.getRainDataAtEachWeatherPointPerInterval(routePath, MinutelyDatForThisWeatherMarkers, weatherLegs);
    return this.justGetProb(RainDataForEachPoint);
  }

  private justGetIntensities(RainDataForEachPointPerInterval: MinutelyRainData[][]): number[][] {
    var weatherPointsPerIntervalIntents: number[][] = [];
    for (let i = 0; i < RainDataForEachPointPerInterval.length; i++) {
      let focusedRainStation = RainDataForEachPointPerInterval[i];
      let focusedRainIntensity: number[] = [];
      focusedRainStation.forEach(focusedTime => {
        focusedRainIntensity.push(focusedTime.precipIntensity);
      });
      weatherPointsPerIntervalIntents.push(focusedRainIntensity);
    }
    return weatherPointsPerIntervalIntents;
  }

  private justGetProb(RainDataForEachPointPerInterval: MinutelyRainData[][]): number[][] {
    let weatherPointsPerIntervalProbs: number[][] = [];
    for (let i = 0; i < RainDataForEachPointPerInterval.length; i++) {
      let focusedRainStation = RainDataForEachPointPerInterval[i];
      let focusedRainProbs: number[] = [];
      focusedRainStation.forEach(focusedTime => {
        focusedRainProbs.push(focusedTime.precipProbability);
      });
      weatherPointsPerIntervalProbs.push(focusedRainProbs);
    }
    return weatherPointsPerIntervalProbs;
  }

  private getRainDataAtEachWeatherPointPerInterval(routePath: google.maps.LatLng[], MinutelyDatForThisWeatherMarkers: MinutelyRainData[][], weatherLegs: number[]): MinutelyRainData[][] {
    let rainDataForEachInterval: MinutelyRainData[][] = [];
    let rainDataForFocusedWeatherPoint: MinutelyRainData[] = [];

    for (let focusedTime = this.graphTimeMin; focusedTime <= this.graphTimeMax; focusedTime += this.graphTimeInterval) {

      rainDataForFocusedWeatherPoint = [];
      console.log("AT " + focusedTime + "!!!");

      for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
          let minuteneedToSearchFor = this.WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath, weatherLegs[i]); // working out same value multiple times.
          let timeWithStartTimeTakenIntoAccount = minuteneedToSearchFor + focusedTime;

          console.log("intensity of rain at weather marker " + i + " at " + timeWithStartTimeTakenIntoAccount + " mins is: " + MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipIntensity);
          console.log("prob of rain at weather marker " + i + " at " + timeWithStartTimeTakenIntoAccount + " mins is: " + MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipProbability*100);

          let rainData: MinutelyRainData = {
            time: MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].time,
            precipIntensity: MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipIntensity,
            precipProbability: MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipProbability
          };

          rainDataForFocusedWeatherPoint.push(rainData);
      }
      rainDataForEachInterval.push(rainDataForFocusedWeatherPoint);
    }

    return rainDataForEachInterval;
  }

  private WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath: google.maps.LatLng[], weatherPointLocationInArray: number): number {
    let distanceToNextPoint = 0;
    for (let i = 0; i < weatherPointLocationInArray; i++) { // do if at start or finish give back quick value. currently going to one less than the full distanceToNextPoint.
      distanceToNextPoint += this.distanceToNextLatLngValue(routePath, i);
    }
    return Math.round((distanceToNextPoint / this.averageWalkingDistanceMetersPerSecond) / 60);
  }


  ////////////////////////////////////////////////////
  // SERVICE BEFORE MOVED WEATHER STUFF TO THIS CLASS.
  ////////////////////////////////////////////////////

  public GetRainProbForPoint(lat: number, lng: number): Observable<number> {
    const url = `${this.baseURL}/rainProb/${lat}/${lng}`;

    return this.http.get<number>(url)
      .pipe(
        map(percentage => percentage * 100),
        catchError(this.handleError<number>(0))
      );
  }

  public GetRainMinutelyDataForWeatherPoint(lat: number, lng: number): Observable<MinutelyRainData[]> { // move * 100 to percentage back to map.
    const url = `${this.baseURL}/rain/minutely/${lat}/${lng}`;

    return this.http.get<MinutelyRainData[]>(url)
      .pipe(
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
