/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild } from '@angular/core';
import { WeatherService } from '../shared/weather.service';
import { RouteInformation } from './Model/RouteInformation';
import { GraphComponent } from '../graph/graph.component';
import { RouteDataTableComponent } from '../route-data-table/route-data-table.component';
import { RouteAndWeatherInformation } from './Model/RouteAndWeatherInformation';
import { RouteCreationComponent } from '../route-creation/route-creation.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  @ViewChild(GraphComponent, {static: false}) graph: GraphComponent;
  @ViewChild(RouteDataTableComponent, {static: false}) routeTable: RouteDataTableComponent;
  @ViewChild(RouteCreationComponent, {static: false}) routeCreation: RouteCreationComponent;

  private map: google.maps.Map;
  private routeAndWeatherInformation: RouteAndWeatherInformation[] = [];
  private focusedRouteId: number;
  private userMarker: google.maps.Marker;

  constructor(private weatherService: WeatherService) { }

  ngOnInit(): void {
    this.generateMap();
    this.displayUserLocation();
  }

  public processNewRoutes(newRoutes: RouteAndWeatherInformation[]): void {
    newRoutes.forEach(route => {
      this.placeStartEndMarkers(route.routeInformation.route.getPath().getArray());
      route.routeInformation.route.setMap(this.map);

      route.routeInformation.route.addListener('click', () => {
        this.routeTable.selectRowByRouteId(route.routeInformation.id);
      });

      this.routeAndWeatherInformation.push(route);
      this.placeWeatherMarkers(route.routeInformation, this.map);
    });

    let newestRoute = this.routeAndWeatherInformation[this.routeAndWeatherInformation.length - 1];
    this.map.fitBounds(newestRoute.routeInformation.bounds);
    this.focusedRouteId = newestRoute.routeInformation.id;

    this.graph.graphIntensityandProb(newestRoute.rainIntensities, newestRoute.rainProbabilitiesAverage);
  
    let overallScores: string[] = [];
    for (let departureTime = 0; departureTime <= 20; departureTime += 5) {
      overallScores.push(this.weatherService.generateOverallRouteScore(newestRoute, departureTime)); // can delete this.whenleavingfortable
    }
    this.routeTable.addRouteToTable(newestRoute.routeInformation, overallScores);
  }

  public selectActionPerformed(routeIdandSelectAction: any): void { // bad name and needs model
    if (!routeIdandSelectAction.selectAction) {
      this.routeAndWeatherInformation[routeIdandSelectAction.routeIdfocused].routeInformation.route.setOptions({ strokeWeight: 2 });
    } else {
      this.routeAndWeatherInformation.forEach(routeAndWeatherInfo => {
        this.highlightSelectedRoute(routeIdandSelectAction.routeIdfocused, routeAndWeatherInfo);
      });
    }

    this.focusedRouteId = routeIdandSelectAction.routeIdfocused;
    this.graph.graphIntensityandProb(this.routeAndWeatherInformation[routeIdandSelectAction.routeIdfocused].rainIntensities,
      this.routeAndWeatherInformation[routeIdandSelectAction.routeIdfocused].rainProbabilitiesAverage);
  }

  private highlightSelectedRoute(routeId: any, routeAndWeatherInfo: RouteAndWeatherInformation) {
    if (routeId === routeAndWeatherInfo.routeInformation.id) {
      this.routeAndWeatherInformation[routeAndWeatherInfo.routeInformation.id].routeInformation.route.setOptions({ strokeWeight: 8 });
      this.map.fitBounds(this.routeAndWeatherInformation[routeAndWeatherInfo.routeInformation.id].routeInformation.bounds);
    } else {
      this.routeAndWeatherInformation[routeAndWeatherInfo.routeInformation.id].routeInformation.route.setOptions({ strokeWeight: 2 });
    }
  }

  private placeWeatherMarkers(thisRoute: RouteInformation, map: google.maps.Map) {
    for (let i = 1; i < thisRoute.weatherPoints.length - 1; i++) {
      let weatherMarker = new google.maps.Marker({ // add marker to array that is currntly not being used.
        map: map,
        position: { lat: thisRoute.route.getPath().getArray()[thisRoute.weatherPoints[i].legNumberInRoute].lat(),
          lng: thisRoute.route.getPath().getArray()[thisRoute.weatherPoints[i].legNumberInRoute].lng() },
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
      });
    }
  }

  public getIntProbGraph() {
    this.graph.graphIntensityandProb(this.routeAndWeatherInformation[this.focusedRouteId].rainIntensities,
      this.routeAndWeatherInformation[this.focusedRouteId].rainProbabilitiesAverage);
  }

  public getTotalRainGraph() {
    this.graph.graphExpectedTotalRainOnRoute(this.routeAndWeatherInformation, 0);
  }

  public startRoute(): void {
    this.map.setCenter({lat: this.userMarker.getPosition().lat(), lng: this.userMarker.getPosition().lng()});
    //navigator.geolocation.watchPosition(() => console.log('success'), () => console.log('error'));
  }

  private generateMap() {
    const mapProperties = {
      center: new google.maps.LatLng(55.586698, -1.909815),
      zoom: 15
    };
    this.map = new google.maps.Map(document.getElementById('map'), mapProperties);

    this.map.addListener('click', (e: google.maps.MouseEvent) => {
      this.updateLatLngInputValues(e);
    });
  }

  private updateLatLngInputValues(e: google.maps.MouseEvent): void {
    this.routeCreation.updateLatLngInputValues(e);
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
      alert('Permission of location has not been granted.');
    }
  }
}
