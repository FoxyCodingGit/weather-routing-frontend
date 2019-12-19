import { Component, ViewChild } from '@angular/core';
import { RouteAndWeatherInformation } from './map/Model/RouteAndWeatherInformation';
import { GraphComponent } from './graph/graph.component';
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
  @ViewChild(GraphComponent, {static: false}) graph: GraphComponent;
  @ViewChild(RouteDataTableComponent, {static: false}) routeTable: RouteDataTableComponent;
  @ViewChild(RouteCreationComponent, {static: false}) routeCreation: RouteCreationComponent;
  @ViewChild(ModalComponent, {static: false}) modal: ModalComponent;

  private routeAndWeatherInformation: RouteAndWeatherInformation[] = [];
  private focusedRouteId: number;

  title = 'WeatherRoutingFrontend';

  constructor(private weatherService: WeatherService) { } // This wasnt here initially

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

    this.graph.graphExpectedTotalRainOnRoute(this.routeAndWeatherInformation, 0);

    let overallScores: string[] = [];
    for (let departureTime = 0; departureTime <= 20; departureTime += 5) {
      overallScores.push(this.weatherService.generateOverallRouteScore(newestRoute, departureTime)); // can delete this.whenleavingfortable
    }
    this.routeTable.addRouteToTable(newestRoute.routeInformation, overallScores); // HOW IS THIS WORKING
  }

  public updateLatLngInputValues(e: google.maps.MouseEvent) {
    this.routeCreation.updateLatLngInputValues(e);
  }

  public rowSelected(routeIdFocused: number): void { // needs model
    this.routeAndWeatherInformation.forEach(routeAndWeatherInfo => {
      this.map.highlightSelectedRoute(routeIdFocused, routeAndWeatherInfo.routeInformation);
    });

    this.getIntProbGraph();
  }

  public getIntProbGraph() {
    this.graph.graphIntensityandProb(this.routeAndWeatherInformation[this.focusedRouteId].rainIntensities,
      this.routeAndWeatherInformation[this.focusedRouteId].rainProbabilitiesAverage);
  }

  public getTotalRainGraph() {
    this.graph.graphExpectedTotalRainOnRoute(this.routeAndWeatherInformation, 0);
  }

  public openModal() {

    console.log("!!!");
    console.log(this.routeAndWeatherInformation);
    console.log(this.routeAndWeatherInformation[this.focusedRouteId]);
    console.log(this.focusedRouteId);

    this.modal.doThing(this.routeAndWeatherInformation[this.focusedRouteId]);
  }
}
