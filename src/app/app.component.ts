import { Component, ViewChild } from '@angular/core';
import { RouteAndWeatherInformation } from './map/Model/RouteAndWeatherInformation';
import { RouteDataTableComponent } from './route-data-table/route-data-table.component';
import { RouteCreationComponent } from './route-creation/route-creation.component';
import { MapComponent } from './map/map.component';
import { WeatherService } from './shared/weather.service';
import { ModalComponent } from './modal/modal.component';
import { AlertService } from './shared/alert.service';

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

  private routeAndWeatherInformation: RouteAndWeatherInformation[] = []; // TODO: WHEN INVLAID ONE ADDED FOR BEING TOO LONG. ARRAY NOT UDPATED prop so get id match problems
  private focusedRouteId: number;

  title = 'WeatherRoutingFrontend';

  public async toot() {
    await this.weatherService.GetCurrentForPoint(55.583156106988, -1.9225142006598617).then( result => {
      console.log(result);
    });
  }


  constructor(private weatherService: WeatherService, private alertService: AlertService) { }

  public processNewRoutes(newRoutes: RouteAndWeatherInformation[]): void {
    this.alertService.error("This is an error :o");
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
}
