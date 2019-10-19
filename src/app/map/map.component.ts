/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild } from '@angular/core';
import { MapRoutingService } from '../shared/map-routing.service';
import { WeatherService } from '../shared/weather.service';
import { GraphComponent } from '../graph/graph.component';
import { RouteInteractive } from './Model/routeInteractive';
import { BarGraphComponent } from '../bar-graph/bar-graph.component';
import { MinutelyRainData } from './Model/MinutelyRainData';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  @ViewChild(GraphComponent, {static: false}) rainPercentageGraph: GraphComponent;
  @ViewChild(BarGraphComponent, {static: false}) rainIntensityGraph: BarGraphComponent;

  @ViewChild('hello', {static: false}) mapElement: any;
  map: google.maps.Map;

  public lattitude: number;
  public longitude: number;

  private howManyWeatherMarkerChecks = 3;

  private graphTimeMin = 0;
  private graphTimeMax = 20;
  private graphTimeInterval = 5;

  private routes: RouteInteractive[] = []; // still not used

  private averageWalkingDistanceMetersPerSecond = 1.4;

  public probToRain = -1;

  private StartOrEndIsFocused = 0;

  public startLat = 50.965446;
  public startLng = 0.096790;
  public endLat = 50.976310;
  public endLng = 0.098611;

  private userMarker: google.maps.Marker;

  constructor(private mapRoutingService: MapRoutingService, private weatherService: WeatherService) { }

  ngOnInit(): void {
    this.generateMap();
    this.displayUserLocation();
  }

  public onRoutingSubmit(data: any): void {
    this.mapRoutingService.GetRoute(data.travelMode, data.startLat, data.startLng, data.endLat, data.endLng).subscribe(
      (routeInformation) => {
        let mapRoute = new google.maps.Polyline({ // DO NOT MAKE CONST!!!
          path: routeInformation.points,
          geodesic: true,
          strokeColor: routeInformation.colour + ', 1)',
          strokeOpacity: 1.0,
          strokeWeight: 2
        });



        this.placeStartEndMarkers(routeInformation.points);

        var thisRoute = new RouteInteractive(mapRoute, routeInformation.travelTimeInSeconds, data.name, routeInformation.colour);

        this.routes.push(thisRoute);

        mapRoute.setMap(this.map);

        this.doRouteStuff(mapRoute, thisRoute);

        mapRoute.addListener('click', () => {

          console.log(this.HaversineFormula(55.5722854559232, -1.9164830070088, 55.5920668008258, -1.9323019216335));

          //this.doRouteStuff(mapRoute, thisRoute);
        });
      }
    );
  }

  private doRouteStuff(mapRoute: google.maps.Polyline, thisRoute: RouteInteractive) {
    this.getMinutelyData(mapRoute.getPath().getArray()).then(minutelyRainData => {
      let weatherPoints: google.maps.LatLng[] = []; // not used and everywhere.
      this.placeWeatherMarkers(mapRoute.getPath().getArray());
      var rainPercentages = this.getAverageRainPercentagesOverIntervals(weatherPoints, mapRoute.getPath().getArray(), minutelyRainData);
      this.rainPercentageGraph.graphRainPercentageForRoute(rainPercentages, thisRoute);
      var rainIntensity = this.getRainIntensityPerWeatherPointPerPerInterval(weatherPoints, mapRoute.getPath().getArray(), minutelyRainData);
      this.rainIntensityGraph.graphIntensity(rainIntensity, thisRoute);
    });
  }

  public startRoute(): void {
    this.map.setCenter({lat: this.userMarker.getPosition().lat(), lng: this.userMarker.getPosition().lng()});
    //navigator.geolocation.watchPosition(() => console.log('success'), () => console.log('error'));
  }

  public async getMinutelyData(mapRoute): Promise<MinutelyRainData[][]> {
    let weatherPoints: google.maps.LatLng[]; // not used. decide what to do wiith this.

    return this.getMinutelyWeatherDataForEachWeatherPoint(mapRoute, weatherPoints)
  }

  private getAverageRainPercentagesOverIntervals(weatherPoints: google.maps.LatLng[], routePath: google.maps.LatLng[], MinutelyDatForThisWeatherMarkers: MinutelyRainData[][]): number[] {
    let rainPercentagesForDifferentTimes: number[] = [];
    
    for (let focusedTime = this.graphTimeMin; focusedTime <= this.graphTimeMax; focusedTime += this.graphTimeInterval) {
      console.log("AT " + focusedTime + "!!!");
      let percentageAccumulator = 0;
      for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
        let weatherPointLocationInRoute = // duplicated but prob needs to be???
          this.findWeatherMarkerLocationInRoute(routePath.length, i, weatherPoints);
        let minuteneedToSearchFor = this.WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath, weatherPointLocationInRoute);
        let timeWithStartTimeTakenIntoAccount = minuteneedToSearchFor + focusedTime;
        console.log("prob of rain at weather marker " + i + " at " + timeWithStartTimeTakenIntoAccount + " is: " + MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipProbability * 100);
        percentageAccumulator += MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipProbability * 100;
      }
      rainPercentagesForDifferentTimes.push(percentageAccumulator / this.howManyWeatherMarkerChecks);
    }
    return rainPercentagesForDifferentTimes;
  }

  private getRainIntensityPerWeatherPointPerPerInterval(weatherPoints: google.maps.LatLng[], routePath: google.maps.LatLng[], MinutelyDatForThisWeatherMarkers: MinutelyRainData[][]): number[][] {
    let rainIntensitysPerInterval: number[][] = [];

    let rainIntensityForFocusedWeatherPoint: number[] = [];

    for (let focusedTime = this.graphTimeMin; focusedTime <= this.graphTimeMax; focusedTime += this.graphTimeInterval) {
      console.log("AT " + focusedTime + "!!!");

      for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
        let weatherPointLocationInRoute = // duplicated but prob needs to be???
          this.findWeatherMarkerLocationInRoute(routePath.length, i, weatherPoints);

          let minuteneedToSearchFor = this.WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath, weatherPointLocationInRoute); // working out same value multiple times.
          let timeWithStartTimeTakenIntoAccount = minuteneedToSearchFor + focusedTime;

          rainIntensityForFocusedWeatherPoint.push(MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipIntensity);
      }
      rainIntensitysPerInterval.push(rainIntensityForFocusedWeatherPoint);
    }

    return rainIntensitysPerInterval;
  }

  private async getMinutelyWeatherDataForEachWeatherPoint(routePath: google.maps.LatLng[], weatherPoints: google.maps.LatLng[]): Promise<MinutelyRainData[][]> {
    
    let MinutelyDatForThisWeatherMarkers: MinutelyRainData[][] = [];

    for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
      let weatherPointLocationInRoute = this.findWeatherMarkerLocationInRoute(routePath.length, i, weatherPoints);
      await this.weatherService.GetRainMinutelyDataForWeatherPoint(routePath[weatherPointLocationInRoute].lat(), routePath[weatherPointLocationInRoute].lng()).toPromise().then(minutelyRainData => {
        MinutelyDatForThisWeatherMarkers.push(minutelyRainData);
        console.log("got minute data for weather marker: " + i + "at leg number: " + weatherPointLocationInRoute);
      });
    }

    return MinutelyDatForThisWeatherMarkers;
  }

  private findWeatherMarkerLocationInRoute(routePathLength: number, i: number, weatherPoints: google.maps.LatLng[]): number {
    let weatherPointLocationInRoute = this.calculateWeatherPointLocationInRoute(routePathLength, i);
    //weatherPoints.push(new google.maps.LatLng(routePath[weatherPointLocationInRoute].lat(), routePath[weatherPointLocationInRoute].lng())); // Prob pushing again!!!
    return weatherPointLocationInRoute;
  }


  private calculateWeatherPointLocationInRoute(routePathLength: number, i: number): number {
    if (i === 0) {
      return 0;
    } else if (i === this.howManyWeatherMarkerChecks) { // both -1 at end of lines are so it can match the array number that starts from zero.
      return routePathLength - 1;
    } else { // if four for example -> 0 33 66 100 the middle two are 1/3 and 2/3. top begins at one and below is one less that howmanyweathermarkers
      return Math.round(routePathLength * (i / (this.howManyWeatherMarkerChecks - 1))) - 1;
    }
  }

  private placeWeatherMarkers(routePath: google.maps.LatLng[]) {
    let weatherPointLocationInRoute: number;

    for (let i = 1; i < this.howManyWeatherMarkerChecks - 1; i++) {
      weatherPointLocationInRoute = this.calculateWeatherPointLocationInRoute(routePath.length, i);

      let weatherMarker = new google.maps.Marker({ // add marker to array that is currntly not being used.
        map: this.map,
        position: { lat: routePath[weatherPointLocationInRoute].lat(), lng: routePath[weatherPointLocationInRoute].lng() },
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
      });
    }
  }

  private WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath: google.maps.LatLng[], weatherPointLocationInArray: number): number {
    let distance = 0;

    for (let i = 0; i < weatherPointLocationInArray; i++) { // do if at start or finish give back quick value. currently going to one less than the full distance.
      distance += this.distanceToNextLatLngValue(routePath, i);
    }
    console.log("distance" + weatherPointLocationInArray + " : " + distance);

    const howLongItWillTakeInSecondsToGetThere = distance / this.averageWalkingDistanceMetersPerSecond;
    console.log("howLongItWillTakeInSecondsToGetThere" + howLongItWillTakeInSecondsToGetThere);

    return Math.round(howLongItWillTakeInSecondsToGetThere / 60);
  }

  private distanceToNextLatLngValue(routePath: google.maps.LatLng[], i: number) {
    return Math.abs(this.HaversineFormula(routePath[i].lat(), routePath[i].lng(), routePath[i+1].lat(), routePath[i+1].lng())); // I DONT THINK MATH ABS IS NOW NEEDED?!
  }

  private HaversineFormula(lat1, lng1, lat2, lng2) {
    var R = 6371; // radius of Earth in km
    var dLat = this.degreeToRadian(lat2-lat1);
    var dLng = this.degreeToRadian(lng2-lng1);

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

  private generateMap() {
    const mapProperties = {
      center: new google.maps.LatLng(55.586698, -1.909815),
      zoom: 14
    };
    this.map = new google.maps.Map(document.getElementById('map'), mapProperties);

    this.map.addListener('click', (e: google.maps.MouseEvent) => {
      this.updateLatLngValues(e);
    });
  }

  private updateLatLngValues(e: google.maps.MouseEvent): void {
    if (this.StartOrEndIsFocused === 0) {
      this.startLat = e.latLng.lat();
      this.startLng = e.latLng.lng();
      this.StartOrEndIsFocused = 1;
    } else {
      this.endLat = e.latLng.lat();
      this.endLng = e.latLng.lng();
      this.StartOrEndIsFocused = 0;
    }
  }

  private placeStartEndMarkers(routePoints: google.maps.LatLng[]) {
    const startMarker = new google.maps.Marker({position: routePoints[0], map: this.map});
    const endMarker = new google.maps.Marker({position: routePoints[routePoints.length - 1], map: this.map});
  }

  private displayUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.userMarker = new google.maps.Marker({
          map: this.map,
          position: { lat: pos.lat, lng: pos.lng },
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });
      });
    } else {
      alert('The user has not allowed to know its locaiton.');
    }
  }
}
