import { Component, ViewChild, OnInit } from '@angular/core';
import { RouteAndWeatherInformation } from './map/Model/RouteAndWeatherInformation';
import { RouteDataTableComponent } from './route-data-table/route-data-table.component';
import { RouteCreationComponent } from './route-creation/route-creation.component';
import { MapComponent } from './map/map.component';
import { WeatherService } from './shared/weather.service';
import { ModalComponent } from './modal/modal.component';
import { LoginModalComponent } from './login/login-modal/login-modal.component';
import { AuthenticationService } from './login/services/authentification.service';
import { User } from './login/user';
import { RoutingService } from './shared/routing.service';
import { HighlightState, LocationType } from './shared/Models/HighLightState';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  ngOnInit(): void {
    this.routingService.getNewRoutes().subscribe((newRoutes) => {
      this.processNewRoutes(newRoutes);
    });

    if (this.currentUser != null) {
      this.routingService.applyUserDefinedRoutes();
    }
  }

  @ViewChild(MapComponent, {static: false}) map: MapComponent;
  @ViewChild(RouteDataTableComponent, {static: false}) routeTable: RouteDataTableComponent;
  @ViewChild(RouteCreationComponent, {static: false}) routeCreation: RouteCreationComponent;
  @ViewChild(ModalComponent, {static: false}) modal: ModalComponent;
  @ViewChild(LoginModalComponent, {static: false} ) loginModal: LoginModalComponent;

  private focusedRouteId: number;
  private currentUser: User;

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

      RoutingService.routeAndWeatherInformation.push(route);
    });

    let newestRoute = RoutingService.routeAndWeatherInformation[RoutingService.routeAndWeatherInformation.length - 1];
    this.map.focusOnRoute(newestRoute.routeInformation);
    this.focusedRouteId = newestRoute.routeInformation.id;

    let overallScores: string[] = [];
    for (let departureTime = 0; departureTime <= 20; departureTime += 5) {
      overallScores.push(this.weatherService.generateOverallRouteScore(newestRoute, departureTime)); // can delete this.whenleavingfortable
    }
    this.routeTable.addRouteToTable(newestRoute.routeInformation, overallScores); // HOW IS THIS WORKING
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

  public rowSelected(routeIdFocused: number): void {
    this.focusedRouteId = routeIdFocused; // move focused id to service??
    RoutingService.routeAndWeatherInformation.forEach(routeAndWeatherInfo => {
      this.map.highlightSelectedRoute(routeIdFocused, routeAndWeatherInfo.routeInformation);
    });
  }

  public routeInfoButtonPressed(): void {
    this.openModal();
  }

  private openModal(): void {
    console.log(this.focusedRouteId);
    this.modal.doThing(RoutingService.routeAndWeatherInformation, this.focusedRouteId);
  }

  public login(): void { // again, do funcs that only are used in html have to be public??
    this.loginModal.start();
  }

  public logOut(): void {
    this.authenticationService.logout();
  }

  public updateLocationMarkerHighlightable(tt: HighlightState) {
    if (!tt.isHighlighted) {
      this.map.isStartHighlightedToBeClickable = false;
      this.map.isDestinationHighlightedToBeClickable = false;
      return;
    }

    if (tt.location == LocationType.STARTING_LOCATION) {
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
