import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MinutelyRainData } from '../map/Model/MinutelyRainData';
import { RouteInformation } from '../map/Model/RouteInformation';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';
import { WeatherPoint } from '../map/Model/weatherPoint';
import { ProbsAndIntensitiesPerWeatherPointPerDepartureTime } from './Models/ProbsAndIntensitiesPerWeatherPointPerDepartureTime';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  public static averageWalkingDistanceMetersPerSecond = 1.4;

  private baseURL = 'https://localhost:44338/weather';
  private howManyWeatherMarkerChecks = 3;

  private graphTimeMin = 0; // need to decide if these be these or can be dynamic
  private graphTimeMax = 20;
  private graphTimeInterval = 5;

  constructor(private http: HttpClient) { }

  public generateOverallRouteScore(routeAndWeatherInformation: RouteAndWeatherInformation, whenRouteisStartedFromNow: number = 0): string {
    let thing: string = "";
    let ree = this.calculateTotalExpectedRainYouAreGoingToHitBasedOnTimeTOTakeRoute(routeAndWeatherInformation, whenRouteisStartedFromNow);

    if (ree === 0) {
      thing = '-';
    } else {
      thing += ree;
      thing += " (" + this.workOutmmPerHourFromRouteDurationAndmmThatHitsPersonInThatTime(ree, routeAndWeatherInformation.routeInformation.travelTimeInSeconds) + ")";
    }

    return thing; // might want to take away from 100 so bigger number is better.
  }

  public async addWeatherInformationToRoute(thisRoute: RouteInformation): Promise<RouteAndWeatherInformation> {
    this.setWeatherLegsEqualDistanceApart(thisRoute);

    return await this.getMinutelyData(thisRoute).then(minutelyRainData => {
      let refactorMe: ProbsAndIntensitiesPerWeatherPointPerDepartureTime = this.getWeatherInformationPerWeatherPointPerPerInterval(thisRoute, minutelyRainData);
      return new RouteAndWeatherInformation(thisRoute, refactorMe.rainIntensities, refactorMe.rainProbabilites);
    });
  }

  private async getMinutelyData(thisRoute: RouteInformation): Promise<MinutelyRainData[][]> {
    let MinutelyDatForThisWeatherMarkers: MinutelyRainData[][] = [];
    let mapRoute = thisRoute.route.getPath().getArray();

    console.log(mapRoute.toString());

    for (let i = 0; i < thisRoute.weatherPoints.length; i++) {
      await this.GetRainMinutelyDataForWeatherPoint(mapRoute[thisRoute.weatherPoints[i].legNumberInRoute].lat(),
        mapRoute[thisRoute.weatherPoints[i].legNumberInRoute].lng()).toPromise().then(minutelyRainData => {
          MinutelyDatForThisWeatherMarkers.push(minutelyRainData);
          console.log('got minute data for weather marker: ' + i + 'at leg number: ' + thisRoute.weatherPoints[i].legNumberInRoute);
      });
    }

    return MinutelyDatForThisWeatherMarkers;
  }

  private setWeatherLegsEqualDistanceApart(thisRoute: RouteInformation): void {
    for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
      let distancePercentageAlongRoute = i * (1 / (this.howManyWeatherMarkerChecks - 1));  // if four for example -> 0 33 66 100 the middle two are 1/3 and 2/3. top begins at one and below is one less that howmanyweathermarkers
      this.calculateWithLegIsClosestForDistance(thisRoute, thisRoute.distance * distancePercentageAlongRoute);
    }
    console.log(thisRoute.weatherPoints);
  }

  private calculateWithLegIsClosestForDistance(thisRoute: RouteInformation, idealWeatherPointDistance: number): void { // make sure value not off by one!!
    let route = thisRoute.route;
    let totalDistance = thisRoute.distance;
    
    if (idealWeatherPointDistance === 0) {
      this.addToWeatherPointSetAndBeUniqueByLegNum(thisRoute, 0, 0);
    } else if (totalDistance === idealWeatherPointDistance) { // both -1 at end of lines are so it can match the array number that starts from zero.
      this.addToWeatherPointSetAndBeUniqueByLegNum(thisRoute, route.getPath().getArray().length - 1, totalDistance);
    } else {
      let toNextWeatherPointDistance = 0;
      let accumulatedDistance: number;

      for (let i = 0; i < route.getPath().getArray().length - 1; i++) { // do if at start or finish give back quick value. currently going to one less than the full distanceToNextPoint.
        accumulatedDistance = toNextWeatherPointDistance;
        toNextWeatherPointDistance += this.distanceToNextLatLngValue(route.getPath().getArray(), i);
        
        if (toNextWeatherPointDistance >= idealWeatherPointDistance) { // its gone over

          let distanceOverIdealDistance = toNextWeatherPointDistance - idealWeatherPointDistance;
          let distanceUnderIdealDistance = idealWeatherPointDistance - accumulatedDistance

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
    let newWeatherPoint: WeatherPoint = {
      legNumberInRoute: legNumberInRoute,
      distance: Math.abs(distance)
    } 

    let LegNums = [];

    thisRoute.weatherPoints.forEach(weatherPoint => {
      if (!LegNums.includes(weatherPoint.legNumberInRoute)) {
        LegNums.push(weatherPoint.legNumberInRoute);
      }
    });

    if (!LegNums.includes(legNumberInRoute)) thisRoute.weatherPoints.push(newWeatherPoint);
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

  private getWeatherInformationPerWeatherPointPerPerInterval(thisRoute: RouteInformation, MinutelyDatForThisRoute: MinutelyRainData[][]): ProbsAndIntensitiesPerWeatherPointPerDepartureTime { // cpould use model instead of array and then having intensities on index 0 and probs on 1?!
    const rainDataForEachPoint: MinutelyRainData[][] = this.getRainDataAtEachWeatherPointPerInterval(thisRoute, MinutelyDatForThisRoute);
    return this.getProbAndIntensities(rainDataForEachPoint);
  }

  private getProbAndIntensities(RainDataForEachPointPerInterval: MinutelyRainData[][]): ProbsAndIntensitiesPerWeatherPointPerDepartureTime {
    let intentsAndProbs: ProbsAndIntensitiesPerWeatherPointPerDepartureTime = new ProbsAndIntensitiesPerWeatherPointPerDepartureTime();

    for (const weatherStationLevel of RainDataForEachPointPerInterval) {
      let focusedRainStation = weatherStationLevel;
      let focusedRainIntensities: number[] = [];
      let focusedRainProbs: number[] = [];
      focusedRainStation.forEach(focusedTime => {
        focusedRainIntensities.push(focusedTime.precipIntensity);
        focusedRainProbs.push(focusedTime.precipProbability);
      });
      intentsAndProbs.rainIntensities.push(focusedRainIntensities);
      intentsAndProbs.rainProbabilites.push(focusedRainProbs);
    }

    return intentsAndProbs;
  }

  private getRainDataAtEachWeatherPointPerInterval(thisRoute: RouteInformation, MinutelyDatForThisWeatherMarkers: MinutelyRainData[][]): MinutelyRainData[][] {
    let rainDataForEachInterval: MinutelyRainData[][] = [];
    let rainDataForFocusedWeatherPoint: MinutelyRainData[] = [];

    for (let focusedTime = this.graphTimeMin; focusedTime <= this.graphTimeMax; focusedTime += this.graphTimeInterval) {

      rainDataForFocusedWeatherPoint = [];
      console.log("AT " + focusedTime + "!!!");
      let routePath = thisRoute.route.getPath().getArray();

      for (let i = 0; i < thisRoute.weatherPoints.length; i++) {
          let minuteneedToSearchFor = this.WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath, thisRoute.weatherPoints[i].legNumberInRoute); // working out same value multiple times.
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
    return Math.round((distanceToNextPoint / WeatherService.averageWalkingDistanceMetersPerSecond) / 60);
  }

  public calculateTotalExpectedRainYouAreGoingToHitBasedOnTimeTOTakeRoute(route: RouteAndWeatherInformation, departureTime: number = 0): number { // TODO: covnersion aint right!
    let totalExpectedRain = 0;
    let focusedWeatherStation = 0;
    let previousDistance = 0;

    route.routeInformation.weatherPoints.forEach(weatherPoint => {
      let distanceToNext =  weatherPoint.distance - previousDistance;
      previousDistance = weatherPoint.distance;

      console.log("distanceToNext" + distanceToNext);

      let secondToHourConverstionRatio = 1 / 3600;
      let timeOfLeginhours = (distanceToNext / WeatherService.averageWalkingDistanceMetersPerSecond) * secondToHourConverstionRatio;

      let expectedRainForleginMM = route.rainIntensities[departureTime / 5][focusedWeatherStation] * route.rainProbabilities[departureTime / 5][focusedWeatherStation];

      totalExpectedRain += timeOfLeginhours * expectedRainForleginMM;
      focusedWeatherStation++;
    });

    let to3SigFig = totalExpectedRain.toFixed(3);
    return +to3SigFig; // shorthand to parse to int.
  }

  public workOutmmPerHourFromRouteDurationAndmmThatHitsPersonInThatTime(mmThatHitsPerson: number, durationinSeconds: number ): number {
    let toAnHourFromSeconds = 3600 / durationinSeconds;

    return mmThatHitsPerson * toAnHourFromSeconds;
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
