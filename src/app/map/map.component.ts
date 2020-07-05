/// <reference types="@types/googlemaps" />

import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { RouteInformation } from './Model/RouteInformation';
import { GraphComponent } from '../graph/graph.component';
import { RouteAndWeatherInformation } from './Model/RouteAndWeatherInformation';
import { AssetService } from 'src/assets/asset.service';
import { RouteMarker } from './Model/RouteMarker';
import { RoutRainIndicators } from './Model/RouteRainIndicators';
import { RoutePolyline } from './Model/RoutePolyline';
import { RoutingService } from '../shared/routing.service';
import { ElevationInfoComponent } from '../elevation-info/elevation-info.component';
import { WeatherService } from '../shared/weather.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  constructor(private assetService: AssetService, private routingService: RoutingService) { }
  @ViewChild(ElevationInfoComponent) elevationInfo: ElevationInfoComponent;
  @ViewChild('elevation') elevationGraph: GraphComponent;

  @Output() mapClicked: EventEmitter<any> = new EventEmitter();

  private map: google.maps.Map;
  private userMarker: google.maps.Marker;

  private focusedStartMarker: google.maps.Marker;
  private focusedEndMarker: google.maps.Marker;

  private highlighedStrokeWeight = 8;
  private unhighlighedStrokeWeight = 2;

  public markerVisabilities = true;
  public rainIndicatorVisibilities = true;

  private routePolylines: RoutePolyline[] = [];
  private routeMarkers: RouteMarker[] = [];
  private rainIndicators: RoutRainIndicators[] = [];

  public isStartHighlightedToBeClickable: boolean = false;
  public isDestinationHighlightedToBeClickable: boolean = false;

  public currentlyFocusedRouteId: number;

  private focusedElevationPointIndicator: google.maps.Polyline;
  private focusedElevationPointIndicatorDistance: number;
  private elevationInclineOrDeclinePolylines: google.maps.Polyline[] = [];
  private greatestInclinePolyline: google.maps.Polyline;
  private greatestInclineOverDistancePolyline: google.maps.Polyline;

  public showElevation = false;

  private readonly defaultMapCenter = {lat: 52.372501, lng: -1.224401};
  private userLocation: { lat: any; lng: any; };

  ngOnInit(): void {
    this.generateMap();
    this.focusOnUserLocation();
  }

  public displayElevation(routeInfo: RouteInformation): void {
    this.showElevation = true;
    this.elevationGraph.graphElevation(routeInfo);
    this.elevationInfo.populateData(routeInfo.elevationInfo, routeInfo.distance, routeInfo.travelMode);
  }

  public placeWeatherMarkers(thisRoute: RouteInformation) {
    for (let i = 1; i < thisRoute.weatherPoints.length - 1; i++) {
      this.routeMarkers.push({
        routeId: thisRoute.id,
        marker: new google.maps.Marker({
          map: this.map,
          position: { lat: thisRoute.route.getPath().getArray()[thisRoute.weatherPoints[i].legNumberInRoute].lat(),
            lng: thisRoute.route.getPath().getArray()[thisRoute.weatherPoints[i].legNumberInRoute].lng() },
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          },
          visible: this.markerVisabilities
        })
      });
    }
  }
  
  public showRouteMarkers(isVisible: boolean): void {
    this.routeMarkers.forEach(routeMarker => {
      routeMarker.marker.setVisible(isVisible);
    });

    this.markerVisabilities = isVisible;
  }

  public placeRainIndicatorsAtWeatherPoints(thisRoute: RouteAndWeatherInformation) {
    for (let i = 1; i < thisRoute.routeInformation.weatherPoints.length - 1; i++) {
      var rainCircle = this.createRainIndicatorElement(thisRoute, i, thisRoute.rainIntensities[0][i]);
      this.rainIndicators.push({ routeId: thisRoute.routeInformation.id, rainIndicator: rainCircle });
    }
  }

  public showRainIndicators(isVisible: boolean): void {
    this.rainIndicators.forEach(routeRainIndicator => {
      routeRainIndicator.rainIndicator.setVisible(isVisible);
    });

    this.rainIndicatorVisibilities = isVisible;
  }

  private calculateQuickRainCircleColourRadius(intensity: number): number {
    const baseSize = 50;
    const lowestRainIntensity = 0.01;

    if (intensity < lowestRainIntensity) {
      return 0;
    } else {
      return baseSize + (intensity * (150 / 8)); // if biggest 8 want size of 150 so max radiusn is 200 
    }
  }

  public focusOnRoute(routeInformation: RouteInformation) {
    this.map.fitBounds(routeInformation.bounds);
  }

  public focusOnPoint(latLng: google.maps.LatLng) {
    this.map.setCenter(latLng);
  }

  public addRouteToMap(route: RouteAndWeatherInformation) {
    this.placeStartEndMarkers(route.routeInformation.id, route.routeInformation.route.getPath().getArray());

    this.routePolylines.push({ routeId: route.routeInformation.id, polyline: route.routeInformation.route });
    route.routeInformation.route.setMap(this.map);

    this.placeWeatherMarkers(route.routeInformation);
    this.placeRainIndicatorsAtWeatherPoints(route);
  }

  public setHighlightStateOfAllRoutes(focusedRouteId: number, isHighlighting: boolean): void {
    const routes = this.routingService.getRouteInformation();

    if (!isHighlighting) {
      this.unhighlightAllRoutes(routes);
      this.removeAllElevationGUIElements();
      return;
    }

    routes.forEach(route => {
      if (focusedRouteId === route.id) {
        route.route.setOptions({ strokeWeight: this.highlighedStrokeWeight });
        this.map.fitBounds(route.bounds);
      } else {
        route.route.setOptions({ strokeWeight: this.unhighlighedStrokeWeight });
      }
    });
  }

  public placeFocusedStartOrEndMarkers(latLng: google.maps.LatLng, isStartFocused: boolean) {
    if (isStartFocused) {
      if (this.focusedStartMarker !== undefined) {
        this.deleteMarker(this.focusedStartMarker);
      }

      this.focusedStartMarker = new google.maps.Marker({position: latLng, map: this.map,
        icon: {
        url: this.assetService.focusedStartMarkerFile
        }
      });
    } else {
      if (this.focusedEndMarker !== undefined) {
        this.deleteMarker(this.focusedEndMarker);
      }

      this.focusedEndMarker = new google.maps.Marker({position: latLng, map: this.map,
        icon: {
        url:  this.assetService.focusedEndMarkerFile
        }
      });
    }
  }

  public removeRouteUI(routeId: number) {
    this.removeRoutePolyline(routeId);
    this.removeMarkers(routeId);
    this.removeRainIndicators(routeId);
    this.removeElevationInfo(routeId);
    this.showElevation = false;
  }

  public removeAllRouteUI() {
    this.removeAllRouteInformationGUI();
    this.removeAllElevationGUIElements();
  }

  public mapFocusedElevation(distanceOfHighlightedElevation: number) {
    if (this.isElevationAlreadyHighlighted(distanceOfHighlightedElevation)) {
      return;
    }

    this.focusedElevationPointIndicatorDistance = distanceOfHighlightedElevation;
    this.removeCurrentElevationPointIndictor();
    this.focusedElevationPointIndicator = this.createElevationIndicatorElement(distanceOfHighlightedElevation, this.routingService.getRouteAndWeatherInformationById(this.currentlyFocusedRouteId));
  }

  public onElevationChangeChecked(inclinesOrDeclines: boolean[]) {
    let subRoutes: google.maps.Polyline[] = [] 
    let isSubRouteIncline = inclinesOrDeclines[0];

    let focusedRoutePath: google.maps.LatLng[] = this.routingService.getRouteAndWeatherInformationById(this.currentlyFocusedRouteId).routeInformation.route.getPath().getArray();
    let currentSubPoute: google.maps.LatLng[] = [focusedRoutePath[0]];

    for (let i = 1; i < focusedRoutePath.length; i++) {
      if (inclinesOrDeclines[i - 1] == isSubRouteIncline) {
        currentSubPoute.push(focusedRoutePath[i])
      } else {
        subRoutes.push(this.createInclineDeclinePolyline(currentSubPoute, isSubRouteIncline));
        currentSubPoute = [focusedRoutePath[i - 1], focusedRoutePath[i]];
        isSubRouteIncline = !isSubRouteIncline;
      }
    }

    if (subRoutes != null) {
      subRoutes.push(this.createInclineDeclinePolyline(currentSubPoute, isSubRouteIncline));
    }

    this.elevationInclineOrDeclinePolylines = subRoutes;
  }

  public onMaxInclineChecked(greatestInclineStartingIndex: number) {
    let focusedRoutePath: google.maps.LatLng[] = this.routingService.getRouteAndWeatherInformationById(this.currentlyFocusedRouteId).routeInformation.route.getPath().getArray();

    let path: google.maps.LatLng[] = [];
    path.push(focusedRoutePath[greatestInclineStartingIndex]);
    path.push(focusedRoutePath[greatestInclineStartingIndex + 1]);

    this.greatestInclinePolyline = this.createInclinePolyline(path);
  }

  public onMaxInclineOverDistanceChecked(thing: any) {
    let focusedRoutePath: google.maps.LatLng[] = this.routingService.getRouteAndWeatherInformationById(this.currentlyFocusedRouteId).routeInformation.route.getPath().getArray();
    
    let path: google.maps.LatLng[] = [];
    for (let i = thing.startIndex; i <= thing.endIndex; i++) {
      path.push(focusedRoutePath[i]);
    }

    this.greatestInclineOverDistancePolyline = this.createInclinePolyline(path);
  }

  private removeAllElevationGUIElements() {
    this.removeElevationInclineOrDeclinePolylines();
    this.removeMaxInclinePolyline();
    this.removeInclineOverDistancePolyline();
    this.removeCurrentElevationPointIndictor();
    this.showElevation = false;
  }

  public removeElevationInclineOrDeclinePolylines() {
    if (this.elevationInclineOrDeclinePolylines.length === 0) {
      return;
    }

    this.elevationInclineOrDeclinePolylines.forEach(polyine => {
      polyine.setVisible(false);
    });
    this.elevationInclineOrDeclinePolylines = [];
  }

  public removeMaxInclinePolyline() {
    if (this.greatestInclinePolyline == null) {
      return;
    }

    this.greatestInclinePolyline.setVisible(false);
    this.greatestInclinePolyline = null;
  }

  public removeInclineOverDistancePolyline() {
    if (this.greatestInclineOverDistancePolyline == null) {
      return;
    }

    this.greatestInclineOverDistancePolyline.setVisible(false);
    this.greatestInclineOverDistancePolyline = null;
  }

  private createInclineDeclinePolyline(path: google.maps.LatLng[], isIncline: boolean): google.maps.Polyline {
    return new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: (isIncline) ? "rgb(255,0,0)" : "rgb(0,255,0)",
      strokeOpacity: 1.0,
      strokeWeight: 15,
      map: this.map
    });
  }

  private createInclinePolyline(path: google.maps.LatLng[]) {
    return new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "rgb(0,0,0)",
      strokeOpacity: 1.0,
      strokeWeight: 15,
      map: this.map
    });
  }

  private removeElevationInfo(routeId: number) {
    if (this.currentlyFocusedRouteId === routeId) {

      if (this.focusedElevationPointIndicator != null) {
        this.focusedElevationPointIndicator.setVisible(false);
        this.focusedElevationPointIndicator = null;
      }

      this.focusedElevationPointIndicatorDistance = null;

      if (this.elevationInclineOrDeclinePolylines != null) {
        this.elevationInclineOrDeclinePolylines.forEach(polyline => {
          polyline.setVisible(false);
        });
        this.elevationInclineOrDeclinePolylines = [];
      }


      if (this.greatestInclinePolyline != null) {
        this.greatestInclinePolyline.setVisible(false);
        this.greatestInclinePolyline = null;
      }

      if (this.greatestInclineOverDistancePolyline != null) {
        this.greatestInclineOverDistancePolyline.setVisible(false);
        this.greatestInclineOverDistancePolyline = null;
      }
    }
  }

  private unhighlightAllRoutes(routes: RouteInformation[]) {
    routes.forEach(route => {
      route.route.setOptions({ strokeWeight: this.unhighlighedStrokeWeight });
    });
  }

  private removeCurrentElevationPointIndictor(): void {
    if (this.focusedElevationPointIndicator == null) {
      return;
    }

    this.focusedElevationPointIndicator.setVisible(false);
    this.focusedElevationPointIndicatorDistance = null;
  }

  private isElevationAlreadyHighlighted(distanceOfHighlightedElevation: number) {
    return this.focusedElevationPointIndicatorDistance != null && this.focusedElevationPointIndicatorDistance == distanceOfHighlightedElevation;
  }

  private createRainIndicatorElement(thisRoute: RouteAndWeatherInformation, weatherPointIndex: number, focusedrainintensity: number) {
    return new google.maps.Circle({
      strokeColor: WeatherService.getColourForRouteRainIntensity(focusedrainintensity),
      strokeOpacity: 0.2,
      strokeWeight: 2,
      fillColor: WeatherService.getColourForRouteRainIntensity(focusedrainintensity),
      fillOpacity: 0.35,
      map: this.map,
      center: {
        lat: thisRoute.routeInformation.route.getPath().getArray()[thisRoute.routeInformation.weatherPoints[weatherPointIndex].legNumberInRoute].lat(),
        lng: thisRoute.routeInformation.route.getPath().getArray()[thisRoute.routeInformation.weatherPoints[weatherPointIndex].legNumberInRoute].lng()
      },
      radius: this.calculateQuickRainCircleColourRadius(focusedrainintensity),
      visible: this.rainIndicatorVisibilities
    });
  }

  private createElevationIndicatorElement(distanceOfElevation: number, routeInfo: RouteAndWeatherInformation): google.maps.Polyline {
    let latlng = this.routingService.getLatLngFromDistance(distanceOfElevation, routeInfo);
    var lineSymbol = {path: google.maps.SymbolPath.FORWARD_OPEN_ARROW};

    return new google.maps.Polyline({
      path: [{lat: latlng.lat() + 0.0008, lng: latlng.lng() + 0.0008}, {lat: latlng.lat(), lng: latlng.lng()}],
      icons: [{
        icon: lineSymbol
      }],
      map: this.map
    });
  }

  private removeMarkers(routeId: number) {
    this.routeMarkers.forEach(weatherMarker => {
      if (weatherMarker.routeId == routeId) weatherMarker.marker.setVisible(false);
    });
    this.routeMarkers = this.routeMarkers.filter(weatherMarker => weatherMarker.routeId != routeId);
  }
  private removeRainIndicators(routeId: number) {
    this.rainIndicators.forEach(routeRainIndicator => {
      if (routeRainIndicator.routeId == routeId) routeRainIndicator.rainIndicator.setVisible(false);
    });
    this.rainIndicators = this.rainIndicators.filter(routeRainIndicator => routeRainIndicator.routeId != routeId);
  }

  private removeRoutePolyline(routeId: number) {
    this.routePolylines.forEach(RoutePolyline => {
      if (RoutePolyline.routeId == routeId) RoutePolyline.polyline.setVisible(false);
    });
    this.routePolylines = this.routePolylines.filter(RoutePolyline => RoutePolyline.routeId != routeId);
  }

  private deleteMarker(marker: google.maps.Marker) {
    marker.setMap(null);
    marker = null;
  }

  private generateMap() {
    const mapProperties = {
      center: (this.userLocation == null)
        ? new google.maps.LatLng(this.defaultMapCenter.lat, this.defaultMapCenter.lng)
        : new google.maps.LatLng(this.userLocation.lat, this.userLocation.lng),
      zoom: 8
    };
    this.map = new google.maps.Map(document.getElementById('map'), mapProperties);

    this.map.addListener('click', (e: google.maps.MouseEvent) => {
      this.placeMarker(e);
    });
  }

  private placeMarker(e: google.maps.MouseEvent): void {
    if (!this.isStartHighlightedToBeClickable && !this.isDestinationHighlightedToBeClickable) {
      return;
    }

    this.mapClicked.emit({latLng: e.latLng, isStartMarker: this.isStartHighlightedToBeClickable});
  }

  private placeStartEndMarkers(routeId: number, routePoints: google.maps.LatLng[]) { // here?
    var startMarker = new google.maps.Marker({
      position: routePoints[0],
      map: this.map,
      icon: {
        url: this.assetService.startMarkerUrl,
        size: new google.maps.Size(20, 20),
        anchor: new google.maps.Point(10, 10)
      }
    });

    var endMarker = new google.maps.Marker({
      position: routePoints[routePoints.length - 1],
      map: this.map
    });

    this.routeMarkers.push({ routeId: routeId, marker: startMarker });
    this.routeMarkers.push({ routeId: routeId, marker: endMarker });
  }

  private async focusOnUserLocation() {
    navigator.geolocation.getCurrentPosition((position) => {
      this.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      this.map.setCenter(new google.maps.LatLng({lat: this.userLocation.lat, lng: this.userLocation.lng}));
      this.map.setZoom(16);
      this.addUserMarker(this.userLocation);
    });
  }

  private addUserMarker(userLocation: any) {
    this.userMarker = new google.maps.Marker({
      map: this.map,
      position: { lat: userLocation.lat, lng: userLocation.lng },
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
      }
    });
  }

  private removeAllRouteInformationGUI() { // TODO: Test maybe?
    this.routePolylines.forEach(element => {
      element.polyline.setVisible(false);
    });
    this.routePolylines = [];

    this.routeMarkers.forEach(element => {
      element.marker.setVisible(false);
    });
    this.routeMarkers = [];

    this.rainIndicators.forEach(element => {
      element.rainIndicator.setVisible(false);
    });
    this.rainIndicators = [];

    if (this.focusedStartMarker != null) {
      this.deleteMarker(this.focusedStartMarker);
    }

    if (this.focusedEndMarker != null) {
      this.deleteMarker(this.focusedEndMarker);
    }
  }
}
