import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MinutelyRainData } from '../map/Model/MinutelyRainData';
import { RouteInformation } from '../map/Model/RouteInformation';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';
import { WeatherPoint } from '../map/Model/weatherPoint';
import { ProbsAndIntensitiesPerWeatherPointPerDepartureTime } from './Models/ProbsAndIntensitiesPerWeatherPointPerDepartureTime';
import { Currently } from './Models/Currently';
import { TravelMode } from './Models/travelMode';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  public static averageWalkingSpeedMetersPerSecond = 1.4;
  public static averageCyclingSpeedMetersPerSecond = 6.0;

  private baseURL = 'https://localhost:44338/weather';
  private howManyWeatherMarkerChecks = 6;

  private graphTimeMin = 0; // need to decide if these be these or can be dynamic
  private graphTimeMax = 20;
  private graphTimeInterval = 5;

  constructor(private http: HttpClient) { }

  public generateOverallRouteScore(routeAndWeatherInformation: RouteAndWeatherInformation, whenRouteisStartedFromNow: number = 0): string {
    let thing: string = "";
    const ree = this.calculateTotalExpectedRainYouAreGoingToHitBasedOnTimeTOTakeRoute(routeAndWeatherInformation, whenRouteisStartedFromNow);

    if (ree === 0) {
      thing = '-';
    } else {
      thing += ree + 'mm';
      thing += ' (' + this.workOutmmPerHourFromRouteDurationAndmmThatHitsPersonInThatTime(ree, routeAndWeatherInformation.routeInformation.travelTimeInSeconds).toFixed(3) + ' mm/h)';
    }

    return thing; // might want to take away from 100 so bigger number is better.
  }

  public async addWeatherInformationToRoute(thisRoute: RouteInformation): Promise<RouteAndWeatherInformation> {
    this.setWeatherLegsEqualDistanceApart(thisRoute);

    return await this.getMinutelyData(thisRoute).then(async minutelyRainData => {
      const refactorMe: ProbsAndIntensitiesPerWeatherPointPerDepartureTime =
        this.getWeatherInformationPerWeatherPointPerPerInterval(thisRoute, minutelyRainData);
      const currentWeather: Currently = await this.GetCurrentForPoint(thisRoute.route.getPath().getArray()[0].lat(),
        thisRoute.route.getPath().getArray()[0].lng());

      return new RouteAndWeatherInformation(thisRoute, refactorMe.rainIntensities, refactorMe.rainProbabilites, currentWeather);
    });
  }

  private async getMinutelyData(thisRoute: RouteInformation): Promise<MinutelyRainData[][]> {
    const MinutelyDatForThisWeatherMarkers: MinutelyRainData[][] = [];
    const mapRoute = thisRoute.route.getPath().getArray();

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
      const distancePercentageAlongRoute = i * (1 / (this.howManyWeatherMarkerChecks - 1));  // if four for example -> 0 33 66 100 the middle two are 1/3 and 2/3. top begins at one and below is one less that howmanyweathermarkers
      this.calculateWithLegIsClosestForDistance(thisRoute, thisRoute.distance * distancePercentageAlongRoute);
    }
    console.log(thisRoute.weatherPoints);
  }

  private calculateWithLegIsClosestForDistance(thisRoute: RouteInformation, idealWeatherPointDistance: number): void { // make sure value not off by one!!
    const route = thisRoute.route;
    const totalDistance = thisRoute.distance;
    
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

          const distanceOverIdealDistance = toNextWeatherPointDistance - idealWeatherPointDistance;
          const distanceUnderIdealDistance = idealWeatherPointDistance - accumulatedDistance

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

  private distanceToNextLatLngValue(routePath: google.maps.LatLng[], i: number) {
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

  private getWeatherInformationPerWeatherPointPerPerInterval(thisRoute: RouteInformation, MinutelyDatForThisRoute: MinutelyRainData[][]): ProbsAndIntensitiesPerWeatherPointPerDepartureTime { // cpould use model instead of array and then having intensities on index 0 and probs on 1?!
    const rainDataForEachPoint: MinutelyRainData[][] = this.getRainDataAtEachWeatherPointPerInterval(thisRoute, MinutelyDatForThisRoute);
    return this.getProbAndIntensities(rainDataForEachPoint);
  }

  private getProbAndIntensities(RainDataForEachPointPerInterval: MinutelyRainData[][]): ProbsAndIntensitiesPerWeatherPointPerDepartureTime {
    const intentsAndProbs: ProbsAndIntensitiesPerWeatherPointPerDepartureTime = new ProbsAndIntensitiesPerWeatherPointPerDepartureTime();

    for (const weatherStationLevel of RainDataForEachPointPerInterval) {
      const focusedRainStation = weatherStationLevel;
      const focusedRainIntensities: number[] = [];
      const focusedRainProbs: number[] = [];
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
    const rainDataForEachInterval: MinutelyRainData[][] = [];
    let rainDataForFocusedWeatherPoint: MinutelyRainData[] = [];

    for (let focusedTime = this.graphTimeMin; focusedTime <= this.graphTimeMax; focusedTime += this.graphTimeInterval) {

      rainDataForFocusedWeatherPoint = [];
      console.log("AT " + focusedTime + "!!!");
      const routePath = thisRoute.route.getPath().getArray();

      for (let i = 0; i < thisRoute.weatherPoints.length; i++) {
          const minuteneedToSearchFor = this.WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath, thisRoute.weatherPoints[i].legNumberInRoute, thisRoute.travelMode); // working out same value multiple times.
          const timeWithStartTimeTakenIntoAccount = minuteneedToSearchFor + focusedTime;

          console.log("intensity of rain at weather marker " + i + " at " + timeWithStartTimeTakenIntoAccount + " mins is: " + MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipIntensity);
          console.log("prob of rain at weather marker " + i + " at " + timeWithStartTimeTakenIntoAccount + " mins is: " + MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipProbability*100);

          const rainData: MinutelyRainData = {
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

  private WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath: google.maps.LatLng[], weatherPointLocationInArray: number, travelMode: TravelMode): number {
    let distanceToNextPoint = 0;
    for (let i = 0; i < weatherPointLocationInArray; i++) { // do if at start or finish give back quick value. currently going to one less than the full distanceToNextPoint.
      distanceToNextPoint += this.distanceToNextLatLngValue(routePath, i);
    }

    if (travelMode == TravelMode.PEDESTRIAN) {
      return Math.round((distanceToNextPoint / WeatherService.averageWalkingSpeedMetersPerSecond) / 60);
    } else if (travelMode == TravelMode.BICYCLE) {
      return Math.round((distanceToNextPoint / WeatherService.averageCyclingSpeedMetersPerSecond) / 60);
    } else {
      // CAR
    }
  }

  public calculateTotalExpectedRainYouAreGoingToHitBasedOnTimeTOTakeRoute(route: RouteAndWeatherInformation, departureTime: number = 0): number { // TODO: covnersion aint right!
    let totalExpectedRain = 0;
    let focusedWeatherStation = 0;
    let previousDistance = 0;

    route.routeInformation.weatherPoints.forEach(weatherPoint => {
      const distanceToNext =  weatherPoint.distance - previousDistance;
      previousDistance = weatherPoint.distance;

      console.log("distanceToNext" + distanceToNext);

      const secondToHourConverstionRatio = 1 / 3600;

      var timeOfLeginhours: number;

      if (route.routeInformation.travelMode == TravelMode.PEDESTRIAN) {
        timeOfLeginhours = (distanceToNext / WeatherService.averageWalkingSpeedMetersPerSecond) * secondToHourConverstionRatio;
      } else if (route.routeInformation.travelMode == TravelMode.BICYCLE) {
        timeOfLeginhours = (distanceToNext / WeatherService.averageCyclingSpeedMetersPerSecond) * secondToHourConverstionRatio;
      } else {
        // car
      }

     

      const expectedRainForleginMM = route.rainIntensities[departureTime / 5][focusedWeatherStation] * route.rainProbabilities[departureTime / 5][focusedWeatherStation];

      totalExpectedRain += timeOfLeginhours * expectedRainForleginMM;
      focusedWeatherStation++;
    });

    const to3SigFig = totalExpectedRain.toFixed(3);
    return +to3SigFig; // shorthand to parse to int.
  }

  public workOutmmPerHourFromRouteDurationAndmmThatHitsPersonInThatTime(mmThatHitsPerson: number, durationinSeconds: number ): number {
    const toAnHourFromSeconds = 3600 / durationinSeconds;

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

  // conventional call
  public async GetCurrentForPoint(lat: number, lng: number): Promise<Currently> {
    const url = `${this.baseURL}/currently/${lat}/${lng}`;

    return await this.http.get<Currently>(url)
    .pipe(
      map(result => {
        result.visibility = Number.parseFloat(result.visibility.toFixed(1)); // changes visibility to 1 dp.
        return result;
      })
    )
    .toPromise();
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
