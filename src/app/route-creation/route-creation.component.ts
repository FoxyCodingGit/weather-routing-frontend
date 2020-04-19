import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RoutingService } from '../shared/routing.service';
import { TempRouteHelper } from '../shared/tempRouteHelper';
import { AlertService } from '../shared/alert.service';
import { HighlightState, LocationType } from '../shared/Models/HighLightState';
import { Location } from '../shared/Models/Elevation/Location';

@Component({
  selector: 'app-route-creation',
  templateUrl: './route-creation.component.html',
  styleUrls: ['./route-creation.component.scss']
})
export class RouteCreationComponent implements OnInit {
  @Output() placeMarker: EventEmitter<any> = new EventEmitter();
  @Output() updateLocationMarkerHighlightable: EventEmitter<HighlightState> = new EventEmitter();
  @Output() searchForStart: EventEmitter<any> = new EventEmitter();
  @Output() searchForEnd: EventEmitter<any> = new EventEmitter();

  constructor(private routingService: RoutingService, private alertService: AlertService) { }
  
  ngOnInit(): void {
    this.routingService.getRouteCreationOnError().subscribe(() => {this.routeCreationLoading = false});
  }

  public canClickMapForMarker: boolean = false;

  public showStartLatLng = false;
  public showEndLatLng = false;

  public calculatedStartLocation: string;
  public calculatedEndLocation: string;

  public startingPoint: string;
  public destination: string;

  public defaultRouteName = 'My Route';
  public selectedTravelMode = 'pedestrian';

  public startLat = 55.583156;
  public lastFocusedStartLat;
  public startLng = -1.922514;
  public lastFocusedStartLng;
  public endLat = 55.575684;
  public lastFocusedEndLat;
  public endLng = -1.920110;
  public lastFocusedEndLng;

  public isStartingLocationClickableFocused = false;
  public isDestinationClickableFocused = false;

  public routeCreationLoading = false;

  public onRoutingSubmit(data: any) {
    this.routeCreationLoading = true;

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
    if (isStartMarker)
    {
      if (this.areAllLatLngValuesTheSame(this.startLat, this.lastFocusedStartLat, this.startLng, this.lastFocusedStartLng)) {
        return;
      }

      await TempRouteHelper.getLocationName(new google.maps.LatLng(this.startLat, this.startLng)).then(location => {
        this.startingPoint = location;
        this.calculatedStartLocation = location;

        this.lastFocusedStartLat = this.startLat;
        this.lastFocusedStartLng = this.startLng;
      },
      reason => {
        this.startingPoint = this.calculatedStartLocation;
        this.alertService.error(reason);
      });
    }
    else
    {
      if (this.areAllLatLngValuesTheSame(this.endLat, this.lastFocusedEndLat, this.endLng, this.lastFocusedEndLng)) {
        return;
      }

      await TempRouteHelper.getLocationName(new google.maps.LatLng(this.endLat, this.endLng)).then(location => {
        this.destination = location;
        this.calculatedEndLocation = location;

        this.lastFocusedEndLat = this.endLat;
        this.lastFocusedEndLng = this.endLng;
      },
      reason => {
        this.destination = this.calculatedEndLocation;
        this.alertService.error(reason);
      });
    }
  }

  public pp(isStartMarker: boolean): void {
    if (isStartMarker) {
      if (this.areAllLatLngValuesTheSame(this.lastFocusedStartLat, this.startLat, this.lastFocusedStartLng, this.startLng)) {
        this.searchForStart.emit();
        return;
      }

      this.placeMarker.emit({latLng: new google.maps.LatLng(this.startLat, this.startLng), isStartMarker: true});
    } else {
      if (this.areAllLatLngValuesTheSame(this.lastFocusedEndLat, this.endLat, this.lastFocusedEndLng, this.endLng)) {
        this.searchForEnd.emit();
        return;
      }

      this.placeMarker.emit({latLng: new google.maps.LatLng(this.endLat, this.endLng), isStartMarker: false});
    }
  }

  private areAllLatLngValuesTheSame(lastFocusedLat: number, newLat: number, lastFocusedLng: number, newLng: number,): boolean {
    return lastFocusedLat == newLat  && lastFocusedLng == newLng;
  }

  public async setNewLocationByName(calculatedLocation: string, newLocation: string, searchEventEmitter: EventEmitter<any>, isStartLocation: boolean) {
    if (this.isSameLocationBeingDisplayed(calculatedLocation, newLocation)) {
      searchEventEmitter.emit();
      return;
    }

    if (newLocation == "") {
      newLocation = calculatedLocation;
    }

    await TempRouteHelper.getLatLngValue(newLocation).then(latLng => {
      this.placeMarker.emit({latLng: latLng, isStartMarker: isStartLocation});
      calculatedLocation = newLocation;
    },
      reason => { 
        newLocation = calculatedLocation;
        this.alertService.error(reason);
    });
  }

  private isSameLocationBeingDisplayed(currentLocation: string, newLocation: string): boolean {
    return currentLocation == newLocation;
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
