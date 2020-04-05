import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RouteFromAPI } from '../map/Model/RouteFromAPI';
import { RouteIWant } from '../map/Model/RouteIWant';
import { RouteInformation } from '../map/Model/RouteInformation';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';
import { RoutingService } from '../shared/routing.service';
import { WeatherService } from '../shared/weather.service';
import { AssetService } from 'src/assets/asset.service';
import { TempRouteHelper } from '../shared/tempRouteHelper';

@Component({
  selector: 'app-route-creation',
  templateUrl: './route-creation.component.html',
  styleUrls: ['./route-creation.component.scss']
})
export class RouteCreationComponent implements OnInit {
  @Output() settingLocationByName: EventEmitter<google.maps.LatLng> = new EventEmitter();
  @Output() canAssignMarkersOnClick: EventEmitter<boolean> = new EventEmitter();

  constructor(private routingService: RoutingService, private weatherService: WeatherService, private assetService: AssetService) { }

  public canClickMapForMarker: boolean = false;

  public showStartLatLng = false;
  public showEndLatLng = false;

  public startingPoint: string;
  public destination: string;

  public defaultRouteName = 'My Route';
  public defaultTravelMode = 'pedestrian';

  public startLat = 55.583156;
  public startLng = -1.922514;
  public endLat = 55.575684;
  public endLng = -1.920110;

  public isStartLatLngFocused = true;

  ngOnInit() {
  }

  public onRoutingSubmit(data: any) {
    this.routingService.alalalal(null, false, data.name, data.travelMode, this.startLat, this.startLng, this.endLat, this.endLng);
  }

  public updateLatLngInputValues(latLng: google.maps.LatLng): void {
    if (this.isStartLatLngFocused) {
      this.startLat = +latLng.lat().toFixed(6);
      this.startLng = +latLng.lng().toFixed(6);

      this.populateStartingPoint();

      this.isStartLatLngFocused = !this.isStartLatLngFocused;
    } else {
      this.endLat = latLng.lat();
      this.endLng = latLng.lng();

      this.populateDestination();

      this.isStartLatLngFocused = !this.isStartLatLngFocused;
    }
  }

  public async populateStartingPoint() {
    await TempRouteHelper.getLocationName(new google.maps.LatLng(this.startLat, this.startLng)).then(location => {
      this.startingPoint = location;
    });
  }

  public async populateDestination() {
    await TempRouteHelper.getLocationName(new google.maps.LatLng(this.endLat, this.endLng)).then(location => {
      this.destination = location;
    });
  }

  public async setStartName() {
    await TempRouteHelper.getLatLngValue(this.startingPoint).then(latLng => {
      this.isStartLatLngFocused = true; // if clicked on map this would then be wrong.
      this.settingLocationByName.emit(latLng);
    });
  }

  public async setEndName() {
    await TempRouteHelper.getLatLngValue(this.destination).then(latLng => {
      this.isStartLatLngFocused = false; // if clicked on map this would then be wrong.
      this.settingLocationByName.emit(latLng);
    });
  }

  public setMapClickableState() {
    this.canAssignMarkersOnClick.emit(this.canClickMapForMarker);
  }
}
