/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild } from '@angular/core';
import { MapRoutingService } from '../shared/map-routing.service';
import { WeatherService } from '../shared/weather.service';
import { RouteInformation } from './Model/RouteInformation';
import { GraphComponent } from '../graph/graph.component';
import { MinutelyRainData } from './Model/MinutelyRainData';
import { RouteDataTableComponent } from '../route-data-table/route-data-table.component';
import { RouteAndWeatherInformation } from './Model/RouteAndWeatherInformation';
import { RouteIWant } from './Model/RouteIWant';
import { RouteFromAPI } from './Model/RouteFromAPI';

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

  private routeAndWeatherInformation: RouteAndWeatherInformation[] = [];

  private focusedRouteId;

  private StartOrEndIsFocused = 0;

  private numberOfAltRoutes = 2;

  public startLat = 55.583156106988;
  public startLng = -1.9225142006598617;
  public endLat = 55.575684498080676;
  public endLng = -1.920110941382518;

  public whenLeavingForTable;

  private userMarker: google.maps.Marker;

  constructor(private mapRoutingService: MapRoutingService, private weatherService: WeatherService) { }

  ngOnInit(): void {
    this.generateMap();
    this.displayUserLocation();
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

  public onRoutingSubmit(data: any) {
    this.mapRoutingService.GetRoutes(data.travelMode, data.startLat, data.startLng, data.endLat, data.endLng, this.numberOfAltRoutes).subscribe(
      (routes) => {
        let newRoutesFormat: RouteIWant[] = this.RouteFromAPIToRouteIWant(routes);

        let RouteAltNum = 0;        
        newRoutesFormat.forEach(routeInformation => {
          this.createrouteandaddtomap(routeInformation, data, RouteAltNum); // TODO: remove routealtnum as bad soluton.
          RouteAltNum++;
        });
      }
    );
  }

  private RouteFromAPIToRouteIWant(routes: RouteFromAPI[]): RouteIWant[] { // move to service or someytinh

    let newRouteIWantFormat: RouteIWant[] = [];

    routes.forEach(route => {
      let latLngs: google.maps.LatLng[] = [];
      route.points.forEach(point => {
        latLngs.push(new google.maps.LatLng(point.latitude, point.longitude));
      });

      newRouteIWantFormat.push(new RouteIWant(latLngs, route.travelTimeInSeconds, route.distance));
    });
    
    return newRouteIWantFormat;
  }


  private async createrouteandaddtomap(routeInformation: RouteIWant, data: any, RouteAltNum: number) {
    let mapRoute = new google.maps.Polyline({
      path: routeInformation.points,
      geodesic: true,
      strokeColor: routeInformation.colour + ', 1)',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    this.placeStartEndMarkers(routeInformation.points);
    let thisRoute = new RouteInformation(this.routeAndWeatherInformation.length + RouteAltNum, mapRoute, routeInformation.travelTimeInSeconds, data.name, routeInformation.colour, routeInformation.distance);
    mapRoute.setMap(this.map);
    this.map.fitBounds(thisRoute.bounds); // THIS WILL MAKE IT JUMP LIKE CRAZY TODO: Only do this on last route of thing.
    await this.weatherService.addWeatherInformationToRoute(thisRoute, this.map).then(focusedRouteAndWeatherInfo => {
      this.routeAndWeatherInformation.push(focusedRouteAndWeatherInfo);
      this.focusedRouteId = this.routeAndWeatherInformation.length - 1;
      this.graph.graphIntensityandProb(focusedRouteAndWeatherInfo.rainIntensities, focusedRouteAndWeatherInfo.rainProbabilitiesAverage);
      let overallScore = this.weatherService.generateOverallRouteScore(focusedRouteAndWeatherInfo, this.whenLeavingForTable);
      this.routeTable.addRouteToTable(thisRoute, overallScore, this.routeAndWeatherInformation.length - 1);
    });
    mapRoute.addListener('click', () => {
      this.routeTable.selectRowByRouteId(thisRoute.id);
    });
  }

  public onClickMe() {
    console.log(this.routeAndWeatherInformation);
    console.log(this.focusedRouteId);


    this.graph.graphIntensityandProb(this.routeAndWeatherInformation[this.focusedRouteId].rainIntensities,
      this.routeAndWeatherInformation[this.focusedRouteId].rainProbabilitiesAverage);
  }

  public onClickMe2() {
    this.graph.graphRainPercentageForRoute(this.routeAndWeatherInformation[this.focusedRouteId].rainProbabilitiesAverage,
      this.routeAndWeatherInformation[this.focusedRouteId].routeInformation);
  }

  public onClickMe3() {
    this.graph.JustIntensity(this.routeAndWeatherInformation[this.focusedRouteId].rainIntensities);
  }

  public onClickMe4() {
    this.graph.graphExpectedTotalRainOnRoute(this.routeAndWeatherInformation, 0); // TODO: GIVE DEPARTURE TIME.
  }

  public startRoute(): void {
    this.map.setCenter({lat: this.userMarker.getPosition().lat(), lng: this.userMarker.getPosition().lng()});
    //navigator.geolocation.watchPosition(() => console.log('success'), () => console.log('error'));
  }

  public WhenAreYouLeavingHasChanged(value: number) {
    this.routeTable.changeEachRowScore(value, this.routeAndWeatherInformation);
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

  // private findCentreLatLngValueOfRoute(polylineRoute: google.maps.Polyline): any {
  //   debugger;
  //   let arrayOfLatLng: google.maps.LatLng[] = polylineRoute.getPath().getArray();

  //   let minLat: number = 90;
  //   let maxLat: number = -90;
  //   let minLng: number = 180;
  //   let maxLng: number = -180;

  //   arrayOfLatLng.forEach(latLngValues => {
  //     if (latLngValues.lat() < minLat) { // prob can do if else on max and min comparisons
  //       minLat = latLngValues.lat();
  //     }
  //     if (latLngValues.lat() > maxLat) {
  //       maxLat = latLngValues.lat();
  //     }
  //     if (latLngValues.lng() < minLng) { // prob can do if else on max and min comparisons
  //       minLng = latLngValues.lng();
  //     }
  //     if (latLngValues.lng() > maxLng) {
  //       maxLng = latLngValues.lng();
  //     }
  //   });

  //   let latDifference = Math.abs(maxLat - minLat);
  //   let lngDifference = Math.abs(maxLng - minLng);

  //   let latCentre = minLat + latDifference;
  //   let lngCentre = minLng + lngDifference;

  //   //let latLngCentre: google.maps.LatLng = {lat: () => { return latCentre }, lng: () => { return lngCentre }};  can t do it this way as not providing all methods

  //   let latLngCentre = {lat: latCentre, lng: lngCentre};
  //   return latLngCentre;
  // }


}
