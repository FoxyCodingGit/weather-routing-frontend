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

  constructor(private routingService: RoutingService, private weatherService: WeatherService, private assetService: AssetService) { }

  public showStartLatLng = false;
  public showEndLatLng = false;

  public startingPoint: string;
  public destination: string;

  public defaultRouteName = 'My Route';
  public defaultTravelMode = 'pedestrian';

  public startLat = 55.583156106988;
  public startLng = -1.9225142006598617;
  public endLat = 55.575684498080676;
  public endLng = -1.920110941382518;

  public isStartLatLngFocused = true;

  ngOnInit() {
  }

  public onRoutingSubmit(data: any) {
    this.routingService.alalalal(false, data.name, data.travelMode, this.startLat, this.startLng, this.endLat, this.endLng);
  }

  public updateLatLngInputValues(e: google.maps.MouseEvent): void {
    if (this.isStartLatLngFocused) {
      this.startLat = e.latLng.lat();
      this.startLng = e.latLng.lng();

      this.populateStartingPoint();

      this.isStartLatLngFocused = !this.isStartLatLngFocused;
    } else {
      this.endLat = e.latLng.lat();
      this.endLng = e.latLng.lng();

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
}
