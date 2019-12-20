import { Component, ViewChild } from '@angular/core';
import { RouteAndWeatherInformation } from './map/Model/RouteAndWeatherInformation';
import { RouteDataTableComponent } from './route-data-table/route-data-table.component';
import { RouteCreationComponent } from './route-creation/route-creation.component';
import { MapComponent } from './map/map.component';
import { WeatherService } from './shared/weather.service';
import { ModalComponent } from './modal/modal.component';

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

  constructor(private weatherService: WeatherService) { }

  public processNewRoutes(newRoutes: RouteAndWeatherInformation[]): void {
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

  public updateLatLngInputValues(e: google.maps.MouseEvent) {
    this.routeCreation.updateLatLngInputValues(e);
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
