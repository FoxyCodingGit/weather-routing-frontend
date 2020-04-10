import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RoutingService } from '../shared/routing.service';
import { TempRouteHelper } from '../shared/tempRouteHelper';
import { AlertService } from '../shared/alert.service';
import { HighlightState, LocationType } from '../shared/Models/HighLightState';

@Component({
  selector: 'app-route-creation',
  templateUrl: './route-creation.component.html',
  styleUrls: ['./route-creation.component.scss']
})
export class RouteCreationComponent implements OnInit {
  @Output() settingLocationByName: EventEmitter<any> = new EventEmitter();
  @Output() updateLocationMarkerHighlightable: EventEmitter<HighlightState> = new EventEmitter();
  @Output() searchForStart: EventEmitter<any> = new EventEmitter();
  @Output() searchForEnd: EventEmitter<any> = new EventEmitter();

  constructor(private routingService: RoutingService, private alertService: AlertService) { }

  public canClickMapForMarker: boolean = false;

  public showStartLatLng = false;
  public showEndLatLng = false;

  public calculatedStartLocation: string;
  public calculatedEndLocation: string;

  public startingPoint: string;
  public destination: string;

  public defaultRouteName = 'My Route';
  public defaultTravelMode = 'pedestrian';

  public startLat = 55.583156;
  public startLng = -1.922514;
  public endLat = 55.575684;
  public endLng = -1.920110;

  public isStartingLocationClickableFocused = false;
  public isDestinationClickableFocused = false;

  ngOnInit() {
  }

  public onRoutingSubmit(data: any) {
    this.routingService.alalalal(null, false, data.name, data.travelMode, this.startLat, this.startLng, this.endLat, this.endLng);
  }

  public updateLatLngInputValues(latLng: google.maps.LatLng, isStartMarker: boolean): void {
    if (isStartMarker) {
      this.startLat = +latLng.lat().toFixed(6);
      this.startLng = +latLng.lng().toFixed(6);
    } else {
      this.endLat = latLng.lat();
      this.endLng = latLng.lng();
    }
  }

  public async updateLocationInputAdress(isStartMarker: boolean) {
    if (isStartMarker) {
      await TempRouteHelper.getLocationName(new google.maps.LatLng(this.startLat, this.startLng)).then(location => {
        this.startingPoint = location;
        this.calculatedStartLocation = location;
      },
      reason => {
        this.startingPoint = this.calculatedStartLocation;
        this.alertService.error(reason);
      });
    } else {
      await TempRouteHelper.getLocationName(new google.maps.LatLng(this.endLat, this.endLng)).then(location => {
        this.destination = location;
        this.calculatedEndLocation = location;
      },
      reason => {
        this.destination = this.calculatedEndLocation;
        this.alertService.error(reason);
      });
    }
  }

  public async setStartName() {
    if (this.calculatedStartLocation == this.startingPoint) {
      this.searchForStart.emit();
      return;
    }

    if (this.startingPoint == "") {
      this.startingPoint = this.calculatedStartLocation;
    }

    await TempRouteHelper.getLatLngValue(this.startingPoint).then(latLng => {
      this.settingLocationByName.emit({latLng: latLng, isStartMarker: true});
      this.calculatedStartLocation = this.startingPoint
    },
      reason => { 
        this.startingPoint = this.calculatedStartLocation;
        this.alertService.error(reason);
    });
  }

  public async setEndName() {
    if (this.calculatedEndLocation == this.destination) {
      this.searchForEnd.emit();
      return;
    }
    
    if (this.destination == "") {
      this.destination = this.calculatedEndLocation;
    }

    await TempRouteHelper.getLatLngValue(this.destination).then(latLng => {
      this.settingLocationByName.emit({latLng: latLng, isStartMarker: false});
      this.calculatedEndLocation = this.destination;
    },
      reason => {
        this.destination = this.calculatedEndLocation;
        this.alertService.error(reason);
    });
  }

  public setMapClickableState() {
    
  }

  public startingLocationInClickableState() {
    if (this.isStartingLocationClickableFocused) {
      this.isStartingLocationClickableFocused = false;
      this.updateLocationMarkerHighlightable.emit({location: LocationType.STARTING_LOCATION, isHighlighted: false});
    }
    else
    {
      this.isStartingLocationClickableFocused = true;
      this.isDestinationClickableFocused = false;
      this.updateLocationMarkerHighlightable.emit({location: LocationType.STARTING_LOCATION, isHighlighted: true});
    }
  }

  public destinationLocationInClickableState() {
    if (this.isDestinationClickableFocused) {
      this.isDestinationClickableFocused = false;
      this.updateLocationMarkerHighlightable.emit({location: LocationType.DESTINATION, isHighlighted: false});
    }
    else
    {
      this.isDestinationClickableFocused = true;
      this.isStartingLocationClickableFocused = false;
      this.updateLocationMarkerHighlightable.emit({location: LocationType.DESTINATION, isHighlighted: true});
    }
  }
}
