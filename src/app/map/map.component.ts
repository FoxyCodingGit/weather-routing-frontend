/// <reference types="@types/googlemaps" />

import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PointFromAPI } from './Model/PointFromAPI';

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

  private tempRoute: Array<PointFromAPI>; // model

  constructor(private httpClient: HttpClient) { }

  ngOnInit(): void {

    let obs = this.httpClient.get('https://localhost:44338/routing/52.041817/1.167004/52.049953/1.129070');


    obs.subscribe((response: Array<PointFromAPI>) => {
      this.tempRoute = response;
      console.log(this.tempRoute);
    });

    const mapProperties = {
      center: new google.maps.LatLng(52.0626, 1.2339),
      zoom: 14
    };
    this.map = new google.maps.Map(document.getElementById('map'), mapProperties);

    var kesgraveHighschoolLocation = {lat: 52.066921, lng: 1.245011};

    var marker = new google.maps.Marker({position: kesgraveHighschoolLocation, map: this.map});

  }

  public onSubmit(data: any): void { // make model
    console.log(data.lat);
    console.log(data.lng);
    this.changeFocus(data.lat, data.lng);
  }

  public changeFocus(latitide: string, longitude: string): void { // change back to number as casting is stiupdi
    console.log(latitide + longitude);
    this.map.setCenter({lat: parseInt(latitide), lng: parseInt(longitude)});
  }

  public onRoutingSubmit(data: any): void {

    let tempCoords: google.maps.LatLng[] = [];


    this.tempRoute.forEach(adamREE => {
      tempCoords.push(new google.maps.LatLng(adamREE.latitude, adamREE.longitude));
    });

    var flightPath = new google.maps.Polyline({
      path: tempCoords,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    this.PlaceStartEndMArkers(tempCoords);

    flightPath.setMap(this.map);
  }

  private PlaceStartEndMArkers(tempCoords: google.maps.LatLng[]) {
    new google.maps.Marker({position: tempCoords[0], map: this.map});
    new google.maps.Marker({position: tempCoords[tempCoords.length-1], map: this.map});
    
  }
}
