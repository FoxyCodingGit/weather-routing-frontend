/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild } from '@angular/core';
import { MapRoutingService } from '../shared/map-routing.service';
import { WeatherService } from '../shared/weather.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  @ViewChild('hello', {static: false}) mapElement: any;
  map: google.maps.Map;

  public lattitude: number;
  public longitude: number;

  private routes: google.maps.Polyline[] = [];

  private kesgraveHighschoolMarker: google.maps.Marker;

  constructor(private mapRoutingService: MapRoutingService, private weatherService: WeatherService) { }

  ngOnInit(): void {
    this.generateMap();

    const kesgraveHighschoolLocation = {lat: 52.066921, lng: 1.245011};
    this.kesgraveHighschoolMarker = new google.maps.Marker({position: kesgraveHighschoolLocation, map: this.map});

    this.addListeners();
  }

  public onRoutingSubmit(data: any): void {
    this.mapRoutingService.GetRoute(data.startLat, data.startLng, data.endLat, data.endLng).subscribe(
      (route) => {
        const mapRoute = new google.maps.Polyline({
          path: route,
          geodesic: true,
          strokeColor: '#F00',
          strokeOpacity: 1.0,
          strokeWeight: 2
        });

        this.placeStartEndMarkers(route);

        this.routes.push(mapRoute);

        mapRoute.setMap(this.map);
      }
    );
  }

  public async getRainPercentageOfRoute(route: google.maps.Polyline): Promise<void> {

    const routePath: google.maps.LatLng[] = route.getPath().getArray();

    const routePathLenth: number = routePath.length;

    const fiveWeatherPoints: google.maps.LatLng[] = [
      new google.maps.LatLng(routePath[0].lat(), routePath[0].lng()),
      new google.maps.LatLng(routePath[Math.round((routePathLenth - 1) * 0.25)].lat(),
        routePath[Math.round((routePathLenth - 1) * 0.25)].lng()),
      new google.maps.LatLng(routePath[Math.round((routePathLenth - 1) * 0.5)].lat(),
        routePath[Math.round((routePathLenth - 1) * 0.5)].lng()),
      new google.maps.LatLng(routePath[Math.round((routePathLenth - 1) * 0.75)].lat(),
        routePath[Math.round((routePathLenth - 1) * 0.75)].lng()),
      new google.maps.LatLng(routePath[Math.round(routePathLenth - 1)].lat(),
        routePath[Math.round(routePathLenth - 1)].lng())
    ];

    let averageRainProb = 0;

    await this.weatherService.GetRainProbForPoint(fiveWeatherPoints[0].lat(), fiveWeatherPoints[0].lng()).toPromise().then(prob => averageRainProb += prob);
    await this.weatherService.GetRainProbForPoint(fiveWeatherPoints[1].lat(), fiveWeatherPoints[1].lng()).toPromise().then(prob => averageRainProb += prob);console.log("2");
    await this.weatherService.GetRainProbForPoint(fiveWeatherPoints[2].lat(), fiveWeatherPoints[2].lng()).toPromise().then(prob => averageRainProb += prob);console.log("3");
    await this.weatherService.GetRainProbForPoint(fiveWeatherPoints[3].lat(), fiveWeatherPoints[3].lng()).toPromise().then(prob => averageRainProb += prob);console.log("4");
    await this.weatherService.GetRainProbForPoint(fiveWeatherPoints[4].lat(), fiveWeatherPoints[4].lng()).toPromise().then(prob => averageRainProb += prob);console.log("5");

    console.log(averageRainProb / fiveWeatherPoints.length);
  }

  private generateMap() {
    const mapProperties = {
      center: new google.maps.LatLng(52.0626, 1.2339),
      zoom: 14
    };
    this.map = new google.maps.Map(document.getElementById('map'), mapProperties);
  }

  private placeStartEndMarkers(route: google.maps.LatLng[]) {
    const startMarker = new google.maps.Marker({position: route[0], map: this.map});
    const endMarker = new google.maps.Marker({position: route[route.length - 1], map: this.map});
  }

  private addListeners(): void { // HACKY - press kesgrave highschool marker to get rain prob of first route created.
    this.kesgraveHighschoolMarker.addListener('click', () => {
      console.log("clicked");
      this.getRainPercentageOfRoute(this.routes[0]);
    });
  }





}