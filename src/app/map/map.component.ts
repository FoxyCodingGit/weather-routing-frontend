/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild } from '@angular/core';
import { MapRoutingService } from '../shared/map-routing.service';

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

  constructor(private mapRoutingService: MapRoutingService) { }

  ngOnInit(): void {
    this.generateMap();

    const kesgraveHighschoolLocation = {lat: 52.066921, lng: 1.245011};
    const kesgraveHighschoolMarker = new google.maps.Marker({position: kesgraveHighschoolLocation, map: this.map});
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

        mapRoute.setMap(this.map);
      }
    );
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
}