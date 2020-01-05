/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { WeatherService } from '../shared/weather.service';
import { RouteInformation } from './Model/RouteInformation';
import { GraphComponent } from '../graph/graph.component';
import { RouteDataTableComponent } from '../route-data-table/route-data-table.component';
import { RouteAndWeatherInformation } from './Model/RouteAndWeatherInformation';
import { RouteCreationComponent } from '../route-creation/route-creation.component';
import { AssetService } from 'src/assets/asset.service';

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

  public isChecked1 = true;
  public isChecked2 = true;

  private currentlyFocusedRouteRainIndication: google.maps.Circle[] = [];

  constructor(private assetService: AssetService) { }

  ngOnInit(): void {
    this.generateMap();
    this.displayUserLocation();
  }

  public placeWeatherMarkers(thisRoute: RouteInformation) {
    for (let i = 1; i < thisRoute.weatherPoints.length - 1; i++) {
      let weatherMarker = new google.maps.Marker({ // add marker to array that is currntly not being used.
        map: this.map,
        position: { lat: thisRoute.route.getPath().getArray()[thisRoute.weatherPoints[i].legNumberInRoute].lat(),
          lng: thisRoute.route.getPath().getArray()[thisRoute.weatherPoints[i].legNumberInRoute].lng() },
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        }
      });
    }
  }

  public placeRainIndicatorsAtWeatherPoints(thisRoute: RouteAndWeatherInformation) {
    for (let i = 1; i < thisRoute.routeInformation.weatherPoints.length - 1; i++) {

      var cityCircle = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.2,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: this.map,
        center: {
          lat: thisRoute.routeInformation.route.getPath().getArray()[thisRoute.routeInformation.weatherPoints[i].legNumberInRoute].lat(),
          lng: thisRoute.routeInformation.route.getPath().getArray()[thisRoute.routeInformation.weatherPoints[i].legNumberInRoute].lng()
        },
        radius: 20 //thisRoute.rainIntensities[0][i] * 100 // 0 so deprature time of now.  //Math.sqrt(citymap[city].population) * 100
      });

      this.currentlyFocusedRouteRainIndication.push(cityCircle);
    }
  }

  public focusOnRoute(routeInformation: RouteInformation) {
    this.map.fitBounds(routeInformation.bounds);
  }

  public addRouteToMap(route: RouteAndWeatherInformation) {
    this.placeStartEndMarkers(route.routeInformation.route.getPath().getArray());
    route.routeInformation.route.setMap(this.map);

    if (this.isChecked1) {
      this.placeWeatherMarkers(route.routeInformation);
    }

    if (this.isChecked2) {
      this.placeRainIndicatorsAtWeatherPoints(route);
    }
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

  public placeFocusedStartOrEndMarkers(e: google.maps.MouseEvent, isStartFocused: boolean) {
    if (isStartFocused) {
      if (this.focusedStartMarker !== undefined) {
        this.deleteMarker(this.focusedStartMarker);
      }      

      this.focusedStartMarker = new google.maps.Marker({position: e.latLng, map: this.map, 
        icon: {
        url: this.assetService.focusedEndMarkerFile
        }
      });
    } else {
      if (this.focusedEndMarker !== undefined) {
        this.deleteMarker(this.focusedEndMarker);
      }
            
      this.focusedEndMarker = new google.maps.Marker({position: e.latLng, map: this.map, 
        icon: {
        url:  this.assetService.focusedStartMarkerFile
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
      this.updateLatLngInputValues(e);
    });
  }

  private updateLatLngInputValues(e: google.maps.MouseEvent): void {
    this.mapClicked.emit(e);
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
