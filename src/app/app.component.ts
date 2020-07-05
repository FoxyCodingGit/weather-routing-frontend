import { Component, ViewChild, OnInit } from '@angular/core';
import { RouteAndWeatherInformation } from './map/Model/RouteAndWeatherInformation';
import { RouteDataTableComponent } from './route-data-table/route-data-table.component';
import { RouteCreationComponent } from './route-creation/route-creation.component';
import { MapComponent } from './map/map.component';
import { WeatherService } from './shared/weather.service';
import { ModalComponent } from './modal/modal.component';
import { LoginModalComponent } from './login/login-modal/login-modal.component';
import { AuthenticationService } from './login/services/authentification.service';
import { RoutingService } from './shared/routing.service';
import { HighlightState, LocationType } from './shared/Models/HighLightState';
import { UserToken } from './shared/Models/UserToken';
import { RouteSelectedState } from './shared/Models/RouteSelectedState';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  ngOnInit(): void {
    this.routingService.getUserShouldBeLoggedOut().subscribe(() => { // here is observables being used to com from service to component.
      this.logOut();
    });

    this.routingService.getNewRoutes().subscribe((newRoutes) => {
      this.processNewRoutes(newRoutes);
    });

    if (this.currentUser != null) {
      this.routingService.applyUserDefinedRoutes();
    }
  }

  @ViewChild(MapComponent) map: MapComponent;
  @ViewChild(RouteDataTableComponent) routeTable: RouteDataTableComponent;
  @ViewChild(RouteCreationComponent) routeCreation: RouteCreationComponent;
  @ViewChild(ModalComponent) modal: ModalComponent;
  @ViewChild(LoginModalComponent) loginModal: LoginModalComponent;

  private currentUser: UserToken;

  title = 'WeatherRoutingFrontend';

  constructor(private weatherService: WeatherService, private authenticationService: AuthenticationService, private routingService: RoutingService) {
    this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
  }

  public processNewRoutes(newRoutes: RouteAndWeatherInformation[]): void {
    newRoutes.forEach(route => {
      this.map.addRouteToMap(route);

      route.routeInformation.route.addListener('click', () => {
        this.routeTable.selectRowByRouteId(route.routeInformation.id);
      });

      this.routingService.pushToRouteAndWeatherInformation(route);
    });

    let newestRoute = this.routingService.getLastRoute();
    this.map.focusOnRoute(newestRoute.routeInformation);

    let averageRouteRainIntensities: string[] = [];

    for (let departureTime = 0; departureTime <= 20; departureTime += 5) {
      averageRouteRainIntensities.push(this.weatherService.workOutRainIntensityAverageOfRoute(newestRoute, departureTime)); // can delete this.whenleavingfortable
    }

    this.routeTable.addRouteToTable(newestRoute.routeInformation, averageRouteRainIntensities); // HOW IS THIS WORKING
  }

  public placeMarker(e: any) {
    this.routeCreation.updateLatLngInputValues(e.latLng, e.isStartMarker);
    this.routeCreation.updateLocationInputAdress(e.isStartMarker);
    this.map.placeFocusedStartOrEndMarkers(e.latLng, e.isStartMarker);
    this.map.focusOnPoint(e.latLng);
    this.setClickableMarkerAssignmentStates();
  }

  private setClickableMarkerAssignmentStates(): void {
    this.map.isStartHighlightedToBeClickable = false;
    this.map.isDestinationHighlightedToBeClickable = false;
    this.routeCreation.isStartingLocationClickableFocused = false;
    this.routeCreation.isDestinationClickableFocused = false;
  }

  public rowSelected(routeSelectedState: RouteSelectedState): void {
    this.map.currentlyFocusedRouteId = (routeSelectedState.isHighlightedRow) ? routeSelectedState.focusedRouteId : null;
    this.map.setHighlightStateOfAllRoutes(routeSelectedState.focusedRouteId, routeSelectedState.isHighlightedRow);

    this.map.showElevation = routeSelectedState.isHighlightedRow;
    if (routeSelectedState.isHighlightedRow) {
      this.map.displayElevation(this.routingService.getRouteAndWeatherInformationById(routeSelectedState.focusedRouteId).routeInformation);
    }
  }

  public routeInfoButtonPressed(routeId: number): void {
    this.modal.open(routeId);
  }

  public login(): void { // again, do funcs that only are used in html have to be public??
    this.loginModal.start();
  }

  public logOut(): void {
    this.authenticationService.logout();
    this.map.removeAllRouteUI();
    this.routeTable.clearTable();
    this.routingService.clearAllSavedRouteAndWeatherInformation();
  }

  public updateLocationMarkerHighlightable(tt: HighlightState) {
    if (!tt.isHighlighted) {
      this.map.isStartHighlightedToBeClickable = false;
      this.map.isDestinationHighlightedToBeClickable = false;
      return;
    }

    if (tt.location === LocationType.STARTING_LOCATION) {
      this.map.isStartHighlightedToBeClickable = true;
      this.map.isDestinationHighlightedToBeClickable = false;
      this.routeCreation.isDestinationClickableFocused = false;
    } else {
      this.map.isDestinationHighlightedToBeClickable = true;
      this.map.isStartHighlightedToBeClickable = false;
      this.routeCreation.isStartingLocationClickableFocused = false;
    }
  }

  public searchForStart() {
    this.map.focusOnPoint(new google.maps.LatLng(this.routeCreation.startLat, this.routeCreation.startLng));
  }

  public searchForEnd() {
    this.map.focusOnPoint(new google.maps.LatLng(this.routeCreation.endLat, this.routeCreation.endLng));
  }

  public routeCreationComplete() {
    this.routeCreation.routeCreationLoading = false;
  }

  public routeDeleted(routeId: number) {
    this.map.removeRouteUI(routeId);
  }
}
