import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MinutelyRainData } from '../map/Model/MinutelyRainData';
import { RouteInformation } from '../map/Model/RouteInformation';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';
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

  private graphTimeMin = 0; // need to decide if these be these or can be dynamic
  private graphTimeMax = 20;
  private graphTimeInterval = 5;

  constructor(private http: HttpClient) { }

  public async addWeatherInformationToRoute(thisRoute: RouteInformation): Promise<RouteAndWeatherInformation> {
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

  public workOutRainIntensityAverageOfRoute(route: RouteAndWeatherInformation, departureTime: number = 0): string {
    let previousDistance = 0;
    let distacneToNext: number;
    let focusedRainIntensity: number;
    let timeAccumulator = 0;
    let timeTonextWeatherStation: number;

    let shareOfRoute = 0;

    for (let i = 0; i < route.routeInformation.weatherPoints.length - 1; i++) {
      distacneToNext =  route.routeInformation.weatherPoints[i + 1].distance - previousDistance;
      focusedRainIntensity = route.rainIntensities[departureTime / 5][i];

      timeTonextWeatherStation = this.getTimeToTravelDistnanceinSeconds(distacneToNext, route.routeInformation.travelMode);
      shareOfRoute += focusedRainIntensity * timeTonextWeatherStation;

      previousDistance = distacneToNext;
      timeAccumulator += timeTonextWeatherStation;
    }

    return (shareOfRoute / timeAccumulator).toFixed(2).toString();
  }

  private getTimeToTravelDistnanceinSeconds(distance: number, travelMode: TravelMode) { // move to routing service?
    if (travelMode === TravelMode.PEDESTRIAN) {
      return distance / WeatherService.averageWalkingSpeedMetersPerSecond;
    } else if (travelMode === TravelMode.BICYCLE) {
      return distance / WeatherService.averageCyclingSpeedMetersPerSecond;
    } else {
      // car
    }
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

  private distanceToNextLatLngValue(routePath: google.maps.LatLng[], i: number): number { // duplicated to avoid circular dependecny between weahter and routing service.
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

  public static getRainIntensityDescriptor(rainIntensitymmPerHour: number) {
    //https://www.baranidesign.com/faq-articles/2020/1/19/practical-guide-to-determining-rainfall-rate-and-rain-intensity-error

    if (rainIntensitymmPerHour === 0) {
      return "no rain";
    } else if (rainIntensitymmPerHour < 0.01) {
      return "spitting";
    } else if (rainIntensitymmPerHour >= 0.01 && rainIntensitymmPerHour < 0.25) {
      return "drizzle";
    } else if (rainIntensitymmPerHour >= 0.25 && rainIntensitymmPerHour < 0.5) {
      return "very light rain";
    } else if (rainIntensitymmPerHour >= 0.5 && rainIntensitymmPerHour < 1) {
      return "light rain";
    } else if (rainIntensitymmPerHour >= 1 && rainIntensitymmPerHour < 2) {
      return "light rain";
    } else if (rainIntensitymmPerHour >= 2 && rainIntensitymmPerHour < 4) {
      return "moderate rain";
    } else if (rainIntensitymmPerHour >= 4 && rainIntensitymmPerHour < 8) {
      return "moderate rain";
    } else {
      return "heavy rain";
    }
  }

  public static getColourForRouteRainIntensity(rainIntensitymmPerHour: number): string { // using here and in map so making static and public so available // prob can be in better place
    const WHEAT = 'rgb(245, 222, 179)';
    const VERY_LIGHT_BLUE = 'rgb(190, 230, 255)';
    const LIGHT_BLUE = 'rgb(170, 210, 240)';
    const BLUE = 'rgb(125, 165, 230)';
    const DARK_BLUE = 'rgb(75, 115, 225)';
    const OLIVE = 'rgb(125, 125, 0)';
    const YELLOW = 'rgb(255, 200, 0)';
    const ORANGE = 'rgb(255, 150, 0)';
    const RED = 'rgb(255, 0, 0)';

    if (rainIntensitymmPerHour < 0.01) {
      return WHEAT;
    } else if (rainIntensitymmPerHour < 0.01) {
      return VERY_LIGHT_BLUE;
    } else if (rainIntensitymmPerHour >= 0.01 && rainIntensitymmPerHour < 0.25) {
      return LIGHT_BLUE;
    } else if (rainIntensitymmPerHour >= 0.25 && rainIntensitymmPerHour < 0.5) {
      return BLUE;
    } else if (rainIntensitymmPerHour >= 0.5 && rainIntensitymmPerHour < 1) {
      return DARK_BLUE;
    } else if (rainIntensitymmPerHour >= 1 && rainIntensitymmPerHour < 2) {
      return OLIVE;
    } else if (rainIntensitymmPerHour >= 2 && rainIntensitymmPerHour < 4) {
      return YELLOW;
    } else if (rainIntensitymmPerHour >= 4 && rainIntensitymmPerHour < 8) {
      return ORANGE;
    } else {
      return RED;
    }
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
