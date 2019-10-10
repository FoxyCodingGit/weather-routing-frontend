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

    // TESTING //////////////

    let weatherPointLocationInRoute = Math.round((routePathLength - 1) * 0.5);

    var minuteneedToSearchFor = this.WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath, travelTimeInSeconds, weatherPointLocationInRoute); // dont need distance.

    debugger;
    if (minuteneedToSearchFor < 60) {
      console.log("get there in " + minuteneedToSearchFor + " minutes");
      let rainProbAtTimeYouWouldGetThere = this.weatherService.GetRainProbForPointReachableInAnHour(routePath[Math.round((routePathLength - 1) * 0.5)].lat(),
      routePath[Math.round((routePathLength - 1) * 0.5)].lng(), minuteneedToSearchFor).toPromise().then(prob => {
        console.log("prob to rain: " + prob);
      });
    }

    ////////////////////////

    const fiveWeatherPoints: google.maps.LatLng[] = [
      new google.maps.LatLng(routePath[0].lat(), routePath[0].lng()),
      new google.maps.LatLng(routePath[Math.round((routePathLength - 1) * 0.25)].lat(),
        routePath[Math.round((routePathLength - 1) * 0.25)].lng()),
      new google.maps.LatLng(routePath[Math.round((routePathLength - 1) * 0.5)].lat(),
        routePath[Math.round((routePathLength - 1) * 0.5)].lng()),
      new google.maps.LatLng(routePath[Math.round((routePathLength - 1) * 0.75)].lat(),
        routePath[Math.round((routePathLength - 1) * 0.75)].lng()),
      new google.maps.LatLng(routePath[Math.round(routePathLength - 1)].lat(),
        routePath[Math.round(routePathLength - 1)].lng())
    ];

    let averageRainProb = 0;

    for (let i = 0; i < fiveWeatherPoints.length; i++) {
      await this.weatherService.GetRainProbForPoint(fiveWeatherPoints[i].lat(), fiveWeatherPoints[i].lng()).toPromise().then(prob => averageRainProb += prob);

      if (i !== 0 && i !== fiveWeatherPoints.length - 1) {
        new google.maps.Marker({
          map: this.map,
          position: {lat: routePath[Math.round((routePathLength - 1) * (0.25 * i))].lat(), lng: routePath[Math.round((routePathLength - 1) * (0.25 * i))].lng()},
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          }
        });
      }
    }

    this.probToRain = averageRainProb / fiveWeatherPoints.length;
  }

  private WorkOutHowLongToTakeToGetToWeatherPointInMins(routePath: google.maps.LatLng[], travelTimeInSeconds: number, weatherPointLocationInArray: number): number {
    let distance = 0;

    for (let i = 0; i < weatherPointLocationInArray; i++) {
      distance += this.distanceToNextLatLngValue(routePath, i);
    }

    let howLongItWillTakeInSecondsToGetThere = distance * this.averageWalkingDistanceMetersPerSecond;

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
