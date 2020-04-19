/// <reference types="@types/googlemaps" />

import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { RouteInformation } from './Model/RouteInformation';
import { GraphComponent } from '../graph/graph.component';
import { RouteAndWeatherInformation } from './Model/RouteAndWeatherInformation';
import { AssetService } from 'src/assets/asset.service';
import { RouteMarker } from './Model/RouteMarker';
import { RoutRainIndicators } from './Model/RouteRainIndicators';
import { RoutePolyline } from './Model/RoutePolyline';
import { ElevationResult } from '../shared/Models/Elevation/ElevationResult';
import { RoutingService } from '../shared/routing.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  @ViewChild('elevation', {static: false}) elevationGraph: GraphComponent;
  
  @Output() mapClicked: EventEmitter<any> = new EventEmitter();

  private map: google.maps.Map;
  private userMarker: google.maps.Marker;

  private focusedStartMarker: google.maps.Marker;
  private focusedEndMarker: google.maps.Marker;

  private highlighedStrokeWeight = 8;
  private unhighlighedStrokeWeight = 2;

  public weatherMarkerVisibilities = true;
  public rainIndicatorVisibilities = true;

  private routePolylines: RoutePolyline[] = []; 
  private routeMarkers: RouteMarker[] = [];
  private rainIndicators: RoutRainIndicators[] = [];

  public isStartHighlightedToBeClickable: boolean = false;
  public isDestinationHighlightedToBeClickable: boolean = false;

  private focusedElevationElement: google.maps.Circle;
  private currentlyFocusedLegElevationIndex: number;  
  public currentlyFocusedRouteId: number; 


  constructor(private assetService: AssetService, private routingService: RoutingService) { }

  ngOnInit(): void {
    this.generateMap();
    this.displayUserLocation();
  }

  public displayElevation(elevationResult: ElevationResult[]): void {
    this.elevationGraph.graphElevation(elevationResult);
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
          visible: this.weatherMarkerVisibilities
        })
      });
    }
  }
  
  public showWeatherMarkers(isVisible: boolean): void {
    this.routeMarkers.forEach(routeMarker => {
      routeMarker.marker.setVisible(isVisible);
    });

    this.weatherMarkerVisibilities = isVisible;
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
    let baseSize = 50;
    let lowestRainIntensity = 0.01;

    if (intensity < lowestRainIntensity) {
      return 0;
    } else {
      return baseSize + (intensity * (150 / 8))  // if biggest 8 want size of 150 so max radiusn is 200 
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

  public highlightSelectedRoute(routeId: any, routeInfo: RouteInformation) {
    if (routeId === routeInfo.id) {
      if (this.isCurrentlyHighlighted(routeInfo.route)) {
        routeInfo.route.setOptions({ strokeWeight: this.unhighlighedStrokeWeight });
      } else {
        routeInfo.route.setOptions({ strokeWeight: this.highlighedStrokeWeight });
        this.map.fitBounds(routeInfo.bounds);
      }
    } else {
      routeInfo.route.setOptions({ strokeWeight: this.unhighlighedStrokeWeight });
    }
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
  }

  public mapFocusedElevation(routeLegIndex: number) {
    if (this.isElevationAlreadyHighlighted(routeLegIndex)) {
      return;
    }

    this.currentlyFocusedLegElevationIndex = routeLegIndex;
    this.hideCurrentElevationHiglight();
    this.focusedElevationElement = this.createElevationIndicatorElement(routeLegIndex, this.routingService.getRouteAndWeatherInformationById(this.currentlyFocusedRouteId));
  } 

  private hideCurrentElevationHiglight(): void {
    if (this.focusedElevationElement != null) this.focusedElevationElement.setVisible(false);
  }

  private isElevationAlreadyHighlighted(routeLegIndex: number) {
    return this.currentlyFocusedLegElevationIndex != null && this.currentlyFocusedLegElevationIndex == routeLegIndex;
  }

  private createRainIndicatorElement(thisRoute: RouteAndWeatherInformation, weatherPointIndex: number, focusedrainintensity: number) {
    return new google.maps.Circle({
      strokeColor: GraphComponent.getColourForRouteRainIntensity(focusedrainintensity),
      strokeOpacity: 0.2,
      strokeWeight: 2,
      fillColor: GraphComponent.getColourForRouteRainIntensity(focusedrainintensity),
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

  private createElevationIndicatorElement(routeLegIndex: number, routeInfo: RouteAndWeatherInformation): google.maps.Circle {
    return new google.maps.Circle({
      strokeColor: "rgb(0, 188, 0)",
      strokeOpacity: 0.6,
      strokeWeight: 2,
      fillColor: "rgb(0, 255, 0)",
      fillOpacity: 0.2,
      map: this.map,
      center: {
        lat: routeInfo.routeInformation.route.getPath().getArray()[routeLegIndex].lat(),
        lng: routeInfo.routeInformation.route.getPath().getArray()[routeLegIndex].lng()
      },
      radius: 40,
      visible: this.rainIndicatorVisibilities
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

  private isCurrentlyHighlighted(hello: google.maps.Polyline): boolean {
    if (hello.get('strokeWeight') === this.highlighedStrokeWeight) { return true; }
    return false;
  }

  private generateMap() {
    const mapProperties = {
      center: new google.maps.LatLng(55.586698, -1.909815),
      zoom: 15
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

  private placeStartEndMarkers(routeId: number, routePoints: google.maps.LatLng[]) {
    var startMarker = new google.maps.Marker({position: routePoints[0], map: this.map});
    var endMarker = new google.maps.Marker({position: routePoints[routePoints.length - 1], map: this.map});

    this.routeMarkers.push({ routeId: routeId, marker: startMarker });
    this.routeMarkers.push({ routeId: routeId, marker: endMarker });
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
