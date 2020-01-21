import { Component, ViewChild } from '@angular/core';
import { RouteAndWeatherInformation } from './map/Model/RouteAndWeatherInformation';
import { RouteDataTableComponent } from './route-data-table/route-data-table.component';
import { RouteCreationComponent } from './route-creation/route-creation.component';
import { MapComponent } from './map/map.component';
import { WeatherService } from './shared/weather.service';
import { ModalComponent } from './modal/modal.component';
import { AlertService } from './shared/alert.service';
import { LoginModalComponent } from './login/login-modal/login-modal.component';
import { Router } from '@angular/router';
import { AuthenticationService } from './login/services/authentification.service';
import { User } from './login/user';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild(MapComponent, {static: false}) map: MapComponent;
  @ViewChild(RouteDataTableComponent, {static: false}) routeTable: RouteDataTableComponent;
  @ViewChild(RouteCreationComponent, {static: false}) routeCreation: RouteCreationComponent;
  @ViewChild(ModalComponent, {static: false}) modal: ModalComponent;
  @ViewChild(LoginModalComponent, {static: false} ) loginModal: LoginModalComponent;

  private routeAndWeatherInformation: RouteAndWeatherInformation[] = []; // TODO: WHEN INVLAID ONE ADDED FOR BEING TOO LONG. ARRAY NOT UDPATED prop so get id match problems
  private focusedRouteId: number;
  private currentUser: User;

  title = 'WeatherRoutingFrontend';

  public async toot() {
    await this.weatherService.GetCurrentForPoint(55.583156106988, -1.9225142006598617).then( result => {
      console.log(result);
    });
  }

  constructor(private weatherService: WeatherService, private alertService: AlertService, private router: Router,
              private authenticationService: AuthenticationService) {
                this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
              }

  public processNewRoutes(newRoutes: RouteAndWeatherInformation[]): void {
    //this.alertService.error("This is an error :o");
    newRoutes.forEach(route => {
      this.map.addRouteToMap(route);

      route.routeInformation.route.addListener('click', () => {
        this.routeTable.selectRowByRouteId(route.routeInformation.id);
      });

      this.routeAndWeatherInformation.push(route);
    });

    let newestRoute = this.routeAndWeatherInformation[this.routeAndWeatherInformation.length - 1];
    this.map.focusOnRoute(newestRoute.routeInformation);
    this.focusedRouteId = newestRoute.routeInformation.id;

    let overallScores: string[] = [];
    for (let departureTime = 0; departureTime <= 20; departureTime += 5) {
      overallScores.push(this.weatherService.generateOverallRouteScore(newestRoute, departureTime)); // can delete this.whenleavingfortable
    }
    this.routeTable.addRouteToTable(newestRoute.routeInformation, overallScores); // HOW IS THIS WORKING
  }

  public updateLatLngInputValues(e: google.maps.MouseEvent) { // TODO: update so shows that map icon is also changed
    this.routeCreation.updateLatLngInputValues(e);
    this.updateOrPlaceMapMarkerFORstartorEmndREEE(e);
  }

  private updateOrPlaceMapMarkerFORstartorEmndREEE(e: google.maps.MouseEvent) {
    this.map.placeFocusedStartOrEndMarkers(e, this.routeCreation.isStartLatLngFocused);
  }

  public rowSelected(routeIdFocused: number): void {
    this.focusedRouteId = routeIdFocused;
    this.routeAndWeatherInformation.forEach(routeAndWeatherInfo => {
      this.map.highlightSelectedRoute(routeIdFocused, routeAndWeatherInfo.routeInformation);
    });
  }

  public routeInfoButtonPressed(): void {
    this.openModal();
  }

  private openModal(): void {
    console.log(this.focusedRouteId);
    this.modal.doThing(this.routeAndWeatherInformation, this.focusedRouteId);
  }

  public login(): void { // again, do funcs that only are used in html have to be public??
    this.loginModal.start();
  }

  public logOut(): void {
    this.authenticationService.logout();
    this.router.navigate(['/login']);
  }
}
