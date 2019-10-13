/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild } from '@angular/core';
import { MapRoutingService } from '../shared/map-routing.service';
import { WeatherService } from '../shared/weather.service';
import { PolytimeandTime } from './Model/PolytimeAndTime';
import { GraphComponent } from '../graph/graph.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  @ViewChild(GraphComponent, {static: false}) child: GraphComponent;

  @ViewChild('hello', {static: false}) mapElement: any;
  map: google.maps.Map;

  public lattitude: number;
  public longitude: number;

  private howManyWeatherMarkerChecks: number = 5;

  private routes: PolytimeandTime[] = []; // still not used

  private averageWalkingDistanceMetersPerSecond: number = 1.4;

  public probToRain: number = -1;

  private kesgraveHighschoolMarker: google.maps.Marker;

  constructor(private mapRoutingService: MapRoutingService, private weatherService: WeatherService) { }

  ngOnInit(): void {
    this.generateMap();
  }

  public onRoutingSubmit(data: any): void {
    this.mapRoutingService.GetRoute(data.travelMode, data.startLat, data.startLng, data.endLat, data.endLng).subscribe(
      (pointsTimeDistance) => {
        let mapRoute = new google.maps.Polyline({ // DO NOT MAKE CONST!!!
          path: pointsTimeDistance.points,
          geodesic: true,
          strokeColor: '#F00',
          strokeOpacity: 1.0,
          strokeWeight: 2
        });

        mapRoute.addListener('click', () => {
          this.getRainPercentageOfRoute(mapRoute, pointsTimeDistance.travelTimeInSeconds, pointsTimeDistance.distance);
        });

        this.placeStartEndMarkers(pointsTimeDistance.points);

        this.routes.push(new PolytimeandTime(mapRoute, pointsTimeDistance.travelTimeInSeconds));

        mapRoute.setMap(this.map);

        // this.child.newDataPoint();

      }
    );
  }

  public async getRainPercentageOfRoute(routePoints: google.maps.Polyline, travelTimeInSeconds: number, distance: number): Promise<void> {
    const routePath: google.maps.LatLng[] = routePoints.getPath().getArray();
    const routePathLength: number = routePath.length;


    let weatherPoints: google.maps.LatLng[] = [];
    let averageRainProb = 0;
    
    for (let i = 0; i <= this.howManyWeatherMarkerChecks; i++) {

      let weatherPointLocationInRoute = Math.round((routePathLength - 1) * (i / this.howManyWeatherMarkerChecks));
      
      weatherPoints.push(
         new google.maps.LatLng(routePath[weatherPointLocationInRoute].lat(), // length - 1 is kinda a hack to have last marker on the last array space. Tecnically all fractions are based on 1 lower than route length given
         routePath[weatherPointLocationInRoute].lng()
         )
      );
      
      var minuteneedToSearchFor = this.WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath, weatherPointLocationInRoute); // dont need distance.

      debugger;

      await this.weatherService.GetRainProbForPoint(weatherPoints[i].lat(), weatherPoints[i].lng()).toPromise().then(prob => averageRainProb += prob);


      if (minuteneedToSearchFor < 60) {
        let rainProbAtTimeYouWouldGetThere = await this.weatherService.GetRainProbForPointReachableInAnHour(routePath[i].lat(),
        routePath[i].lng(), minuteneedToSearchFor).toPromise().then(prob => {
          console.log("prob to rain at " + i + " space at "+ minuteneedToSearchFor + " minutes is: " + prob);
        });
      } else {
        console.log("time to get to " + i + " space is over an hour");
      }


      this.placeWeatherMarkers(i, routePath, routePathLength);
    }
        
    this.probToRain = averageRainProb / this.howManyWeatherMarkerChecks;
  }

  private placeWeatherMarkers(i: number, routePath: google.maps.LatLng[], routePathLength: number) {
    if (i !== 0 && i !== this.howManyWeatherMarkerChecks - 1) {
      new google.maps.Marker({
        map: this.map,
        position: { lat: routePath[Math.round((routePathLength - 1) * (i / this.howManyWeatherMarkerChecks))].lat(), lng: routePath[Math.round((routePathLength - 1) * (i / this.howManyWeatherMarkerChecks))].lng() },
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

    debugger;

    const howLongItWillTakeInSecondsToGetThere = distance * this.averageWalkingDistanceMetersPerSecond;

    return Math.round(howLongItWillTakeInSecondsToGetThere / 60);
  }

  private distanceToNextLatLngValue(routePath: google.maps.LatLng[], i: number) {
    return Math.abs(Math.sqrt((routePath[i].lat() + routePath[i + 1].lat()) + (routePath[i].lng() + routePath[i + 1].lng())));
  }

  private generateMap() {
    const mapProperties = {
      center: new google.maps.LatLng(52.0626, 1.2339),
      zoom: 14
    };
    this.map = new google.maps.Map(document.getElementById('map'), mapProperties);
  }

  private placeStartEndMarkers(routePoints: google.maps.LatLng[]) {
    const startMarker = new google.maps.Marker({position: routePoints[0], map: this.map});
    const endMarker = new google.maps.Marker({position: routePoints[routePoints.length - 1], map: this.map});
  }
}
