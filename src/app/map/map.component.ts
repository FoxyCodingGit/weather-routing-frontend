/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild } from '@angular/core';
import { MapRoutingService } from '../shared/map-routing.service';
import { WeatherService } from '../shared/weather.service';
import { RouteInteractive } from './Model/routeInteractive';
import { GraphComponent } from '../graph/graph.component';
import { MinutelyRainData } from './Model/MinutelyRainData';
import { RouteDataTableComponent } from '../route-data-table/route-data-table.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  @ViewChild(GraphComponent, {static: false}) graph: GraphComponent;
  @ViewChild(RouteDataTableComponent, {static: false}) routeTable: RouteDataTableComponent;

  map: google.maps.Map;

  public lattitude: number;
  public longitude: number;

  private howManyWeatherMarkerChecks = 10;

  private graphTimeMin = 0;
  private graphTimeMax = 20;
  private graphTimeInterval = 5;

  private routes: RouteInteractive[] = []; // still not used
  private minutelyRainData: MinutelyRainData[][][] = [];

  private averageWalkingDistanceMetersPerSecond = 1.4;

  public probToRain = -1;

  private StartOrEndIsFocused = 0;

  public startLat = 55.583156106988;
  public startLng = -1.9225142006598617;
  public endLat = 55.575684498080676;
  public endLng = -1.920110941382518;

  public whenLeavingForTable; // TODO: this

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

        var thisRoute = new RouteInteractive(mapRoute, routeInformation.travelTimeInSeconds, data.name, routeInformation.colour, routeInformation.distance);

        this.routes.push(thisRoute);

        mapRoute.setMap(this.map);

        this.doRouteStuff(thisRoute);

        mapRoute.addListener('click', () => {

          console.log(this.HaversineFormula(55.5722854559232, -1.9164830070088, 55.5920668008258, -1.9323019216335));

          //this.doRouteStuff(mapRoute, thisRoute);
        });
      }
    );
  }


  private getWeatherPointsToBeEquiDistanceApart(thisRoute: RouteInteractive): number[] {
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

  private doRouteStuff(thisRoute: RouteInteractive) {
    let weatherLegs = this.getWeatherPointsToBeEquiDistanceApart(thisRoute);

    this.getMinutelyData(thisRoute.route.getPath().getArray(), weatherLegs).then(minutelyRainData => {
      this.placeWeatherMarkers(thisRoute, weatherLegs);

      this.minutelyRainData.push(minutelyRainData);

      var rainPercentages = this.getAverageRainPercentagesOverIntervals(thisRoute.route.getPath().getArray(), minutelyRainData, weatherLegs);
      var rainIntensity = this.getRainIntensityPerWeatherPointPerPerInterval(thisRoute.route.getPath().getArray(), minutelyRainData, weatherLegs);

      let overallScore = this.generateOverallRouteScore(rainPercentages, rainIntensity, this.whenLeavingForTable);

      this.graph.graphIntensityandProb(rainIntensity, rainPercentages);

      this.routeTable.addRouteToTable(thisRoute, overallScore, this.routes.length - 1);

      this.focusedRainPercentages = rainPercentages;
      this.focusedRainIntensity = rainIntensity;
      this.focusedRoute = thisRoute;
    });
  }

  private focusedRainPercentages; 
  private focusedRainIntensity; 
  private focusedRoute;

  public onClickMe() {
    this.graph.graphIntensityandProb(this.focusedRainIntensity, this.focusedRainPercentages);
  }

  public onClickMe2() {
    this.graph.graphRainPercentageForRoute(this.focusedRainPercentages, this.focusedRoute);
  }

  public onClickMe3() {
    this.graph.JustIntensity(this.focusedRainIntensity);
  }

  public startRoute(): void {
    this.map.setCenter({lat: this.userMarker.getPosition().lat(), lng: this.userMarker.getPosition().lng()});
    //navigator.geolocation.watchPosition(() => console.log('success'), () => console.log('error'));
  }

  public async getMinutelyData(mapRoute: google.maps.LatLng[], weatherLegs: number[]): Promise<MinutelyRainData[][]> {
    let MinutelyDatForThisWeatherMarkers: MinutelyRainData[][] = [];

    console.log(mapRoute.toString());

    for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
      await this.weatherService.GetRainMinutelyDataForWeatherPoint(mapRoute[weatherLegs[i]].lat(), mapRoute[weatherLegs[i]].lng()).toPromise().then(minutelyRainData => {
        MinutelyDatForThisWeatherMarkers.push(minutelyRainData);
        console.log("got minute data for weather marker: " + i + "at leg number: " + weatherLegs[i]);
      });
    }

    return MinutelyDatForThisWeatherMarkers;
  }

  public WhenAreYouLeavingHasChanged(value: number) {
    console.log("WhenAreYouLeavingHasChanged" + value);
  }

  private getAverageRainPercentagesOverIntervals(routePath: google.maps.LatLng[], MinutelyDatForThisWeatherMarkers: MinutelyRainData[][], weatherLegs: number[]): number[] {
    let rainPercentagesForDifferentTimes: number[] = [];
    
    for (let focusedTime = this.graphTimeMin; focusedTime <= this.graphTimeMax; focusedTime += this.graphTimeInterval) {
      console.log("AT " + focusedTime + "!!!");
      let percentageAccumulator = 0;
      for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
        let minuteneedToSearchFor = this.WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath, weatherLegs[i]);
        let timeWithStartTimeTakenIntoAccount = minuteneedToSearchFor + focusedTime;
        console.log("prob of rain at weather marker " + i + " at " + timeWithStartTimeTakenIntoAccount + " is: " + MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipProbability * 100);
        percentageAccumulator += MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipProbability * 100;
      }
      rainPercentagesForDifferentTimes.push(percentageAccumulator / this.howManyWeatherMarkerChecks);
    }
    return rainPercentagesForDifferentTimes;
  }

  private getRainIntensityPerWeatherPointPerPerInterval(routePath: google.maps.LatLng[], MinutelyDatForThisWeatherMarkers: MinutelyRainData[][], weatherLegs: number[]): number[][] {
    let rainIntensitysPerInterval: number[][] = [];
    let rainIntensityForFocusedWeatherPoint: number[] = [];

    for (let focusedTime = this.graphTimeMin; focusedTime <= this.graphTimeMax; focusedTime += this.graphTimeInterval) {
      
      rainIntensityForFocusedWeatherPoint = [];
      console.log("AT " + focusedTime + "!!!");

      for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
          let minuteneedToSearchFor = this.WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath, weatherLegs[i]); // working out same value multiple times.
          let timeWithStartTimeTakenIntoAccount = minuteneedToSearchFor + focusedTime;

          console.log("intensity of rain at weather marker " + i + " at " + timeWithStartTimeTakenIntoAccount + " mins is: " + MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipIntensity);

          rainIntensityForFocusedWeatherPoint.push(MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipIntensity);
      }
      rainIntensitysPerInterval.push(rainIntensityForFocusedWeatherPoint);
    }

    return rainIntensitysPerInterval;
  }

  private placeWeatherMarkers(route: RouteInteractive, weatherLegs: number[]) {
    for (let i = 1; i < this.howManyWeatherMarkerChecks - 1; i++) {
      let weatherMarker = new google.maps.Marker({ // add marker to array that is currntly not being used.
        map: this.map,
        position: { lat: route.route.getPath().getArray()[weatherLegs[i]].lat(), lng: route.route.getPath().getArray()[weatherLegs[i]].lng() },
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
      });
    }
  }

  private WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath: google.maps.LatLng[], weatherPointLocationInArray: number): number {
    let distanceToNextPoint = 0;
    for (let i = 0; i < weatherPointLocationInArray; i++) { // do if at start or finish give back quick value. currently going to one less than the full distanceToNextPoint.
      distanceToNextPoint += this.distanceToNextLatLngValue(routePath, i);
    }
    return Math.round((distanceToNextPoint / this.averageWalkingDistanceMetersPerSecond) / 60);
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

  private generateOverallRouteScore(rainProbability: number[], rainIntensity: number[][], whenRouteisStartedFromNow: number = 0): number { //should I move all route stuff out into its own component or is model and then treaking enough in here fine?
    
    let rainProbabilityWeighting = 0.2; // THESE ARE NOWHERE NEAR CORRECT. PERCENTAGE WILL ALWAYS BE MUCH GREATER THAN RAINFALL
    let rainIntensityWeighting = 0.3;

    let totalRainIntensity = 0; // mot good, just for dev. come back to this calculation later
    rainIntensity.forEach(weatherspot => {
      totalRainIntensity += weatherspot[whenRouteisStartedFromNow];
    });

    return 100 - (rainProbabilityWeighting * rainProbability[whenRouteisStartedFromNow]) - (totalRainIntensity * rainIntensityWeighting);
  }
}
