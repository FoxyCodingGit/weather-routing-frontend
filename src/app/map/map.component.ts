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

        // do it when submit pressed. Do it again if route is created.
        // this.getRainPercentagesOverInterval(mapRoute).then(percentages => {
        //   this.rainPercentageGraph.graphRainPercentageForRoute(percentages);
        // });

        mapRoute.addListener('click', () => {
          this.getRainPercentagesOverInterval(mapRoute).then(percentages => {
            this.rainPercentageGraph.graphRainPercentageForRoute(percentages, thisRoute);
            this.rainIntensityGraph.graphIntensity();
          });
        });
      }
    );
  }

  public startRoute(): void {
    this.map.setCenter({lat: this.userMarker.getPosition().lat(), lng: this.userMarker.getPosition().lng()});
    //navigator.geolocation.watchPosition(() => console.log('success'), () => console.log('error'));
  }


  public async getRainPercentagesOverInterval(routePoints: google.maps.Polyline): Promise<number[]> {
    let rainPercentagesForDifferentTimes: number[] = [];
    let MinutelyDatForThisWeatherMarkers: MinutelyRainData[][] = [];

    const routePath: google.maps.LatLng[] = routePoints.getPath().getArray();
    const routePathLength: number = routePath.length;
    let weatherPoints: google.maps.LatLng[] = []; // this varaible is not used

    for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
      console.log(routePathLength);

      this.placeWeatherMarkers(i, routePath, routePathLength);

      let weatherPointLocationInRoute = this.addWeatherMarkerLocationInRoute(routePathLength, i, weatherPoints, routePath);

      await this.weatherService.GetRainMinutelyDataForWeatherPoint(routePath[weatherPointLocationInRoute].lat(),
      routePath[weatherPointLocationInRoute].lng()).toPromise().then(minutelyRainData => {
        MinutelyDatForThisWeatherMarkers.push(minutelyRainData);
        console.log("got minute data for weather marker: " + i + "at leg number: " + weatherPointLocationInRoute);
      });
    }

    // now to get each interval percentage
    for (let focusedTime = this.graphTimeMin; focusedTime <= this.graphTimeMax; focusedTime += this.graphTimeInterval) {
      console.log("AT " + focusedTime + "!!!");

      let percentageAccumulator = 0;

      for (let i = 0; i < this.howManyWeatherMarkerChecks; i++) {
        let weatherPointLocationInRoute = // duplicated but prob needs to be???
        this.addWeatherMarkerLocationInRoute(routePathLength, i, weatherPoints, routePath);
  
        let minuteneedToSearchFor = this.WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath, weatherPointLocationInRoute);
        let timeWithStartTimeTakenIntoAccount = minuteneedToSearchFor + focusedTime;

        console.log("prob of rain at weather marker " + i + " at " + timeWithStartTimeTakenIntoAccount + " is: " +  MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipProbability * 100);
        percentageAccumulator += MinutelyDatForThisWeatherMarkers[i][timeWithStartTimeTakenIntoAccount].precipProbability * 100;
      }
      rainPercentagesForDifferentTimes.push(percentageAccumulator / this.howManyWeatherMarkerChecks);
    }
    return rainPercentagesForDifferentTimes;
  }

  private addWeatherMarkerLocationInRoute(routePathLength: number, i: number,
                                          weatherPoints: google.maps.LatLng[],
                                          routePath: google.maps.LatLng[]) {
    let weatherPointLocationInRoute = Math.round(routePathLength * (i / this.howManyWeatherMarkerChecks)); // THIS DOESNT WORK OUT CORRECTLY. WITH 3 -> 0/3 1/3 2/3 NO 3/3
    if (weatherPointLocationInRoute !== 0) {
      weatherPointLocationInRoute--;
    }
    weatherPoints.push(new google.maps.LatLng(routePath[weatherPointLocationInRoute].lat(), routePath[weatherPointLocationInRoute].lng()));
    return weatherPointLocationInRoute;
  }

  private placeWeatherMarkers(i: number, routePath: google.maps.LatLng[], routePathLength: number) {
    if (i !== 0 && i !== this.howManyWeatherMarkerChecks - 1) {
      let weatherMarker = new google.maps.Marker({
        map: this.map,
        position: { lat: routePath[Math.round((routePathLength - 1) * (i / this.howManyWeatherMarkerChecks))].lat(),
          lng: routePath[Math.round((routePathLength - 1) * (i / this.howManyWeatherMarkerChecks))].lng() },
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
      });
    }
  }

  private WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath: google.maps.LatLng[], weatherPointLocationInArray: number): number {
    let distance = 0;

    for (let i = 0; i < weatherPointLocationInArray; i++) {
      distance += this.distanceToNextLatLngValue(routePath, i);
    }

    const howLongItWillTakeInSecondsToGetThere = distance * this.averageWalkingDistanceMetersPerSecond;

    return Math.round(howLongItWillTakeInSecondsToGetThere / 60);
  }

  private distanceToNextLatLngValue(routePath: google.maps.LatLng[], i: number) {
    return Math.abs(Math.sqrt((routePath[i].lat() + routePath[i + 1].lat()) + (routePath[i].lng() + routePath[i + 1].lng())));
  }

  private generateMap() {
    const mapProperties = {
      center: new google.maps.LatLng(50.965446, 0.096790),
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
