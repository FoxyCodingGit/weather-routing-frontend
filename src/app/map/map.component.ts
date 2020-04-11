/// <reference types="@types/googlemaps" />

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RouteInformation } from './Model/RouteInformation';
import { GraphComponent } from '../graph/graph.component';
import { RouteAndWeatherInformation } from './Model/RouteAndWeatherInformation';
import { AssetService } from 'src/assets/asset.service';
import { Visibility } from '../modal/CurrentWeatherHelper';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  @Output() mapClicked: EventEmitter<any> = new EventEmitter();

  private map: google.maps.Map;
  private userMarker: google.maps.Marker;

  private focusedStartMarker: google.maps.Marker;
  private focusedEndMarker: google.maps.Marker;

  private highlighedStrokeWeight = 8;
  private unhighlighedStrokeWeight = 2;

  public weatherMarkerVisibilities = true;
  public rainIndicatorVisibilities = true;

  public weatherMarkers: google.maps.Marker[] = [];

  public isStartHighlightedToBeClickable: boolean = false;
  public isDestinationHighlightedToBeClickable: boolean = false;

  private routeRainIndicators: google.maps.Circle[] = [];

  constructor(private assetService: AssetService) { }

  ngOnInit(): void {
    this.generateMap();
    this.displayUserLocation();
  }

  public placeWeatherMarkers(thisRoute: RouteInformation) {
    for (let i = 1; i < thisRoute.weatherPoints.length - 1; i++) {
      this.weatherMarkers.push(
        new google.maps.Marker({
          map: this.map,
          position: { lat: thisRoute.route.getPath().getArray()[thisRoute.weatherPoints[i].legNumberInRoute].lat(),
            lng: thisRoute.route.getPath().getArray()[thisRoute.weatherPoints[i].legNumberInRoute].lng() },
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          },
          visible: this.weatherMarkerVisibilities
        })
      );
    }
  }
  
  public showWeatherMarkers(isVisible: boolean): void {
    this.weatherMarkers.forEach(marker => {
      marker.setVisible(isVisible);
    });

    this.weatherMarkerVisibilities = isVisible;
  }

  public placeRainIndicatorsAtWeatherPoints(thisRoute: RouteAndWeatherInformation) {
    let focusedrainintensity: number;

    for (let i = 1; i < thisRoute.routeInformation.weatherPoints.length - 1; i++) {
      focusedrainintensity = thisRoute.rainIntensities[0][i];

      var cityCircle = new google.maps.Circle({
        strokeColor: GraphComponent.getColourForRouteRainIntensity(focusedrainintensity),
        strokeOpacity: 0.2,
        strokeWeight: 2,
        fillColor: GraphComponent.getColourForRouteRainIntensity(focusedrainintensity),
        fillOpacity: 0.35,
        map: this.map,
        center: {
          lat: thisRoute.routeInformation.route.getPath().getArray()[thisRoute.routeInformation.weatherPoints[i].legNumberInRoute].lat(),
          lng: thisRoute.routeInformation.route.getPath().getArray()[thisRoute.routeInformation.weatherPoints[i].legNumberInRoute].lng()
        },
        radius: this.calculateQuickRainCircleColourRadius(focusedrainintensity),
        visible: this.rainIndicatorVisibilities
      });

      this.routeRainIndicators.push(cityCircle);
    }
  }

  public showRainIndicators(isVisible: boolean): void {
    this.routeRainIndicators.forEach(indicator => {
      indicator.setVisible(isVisible);
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
    this.placeStartEndMarkers(route.routeInformation.route.getPath().getArray());
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
