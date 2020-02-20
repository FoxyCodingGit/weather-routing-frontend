import { Component, OnInit, ViewChild } from '@angular/core';
import { GraphComponent } from '../graph/graph.component';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';

// import * as $ from 'jquery'; // cant have this as Property 'modal' does not exist on type 'JQuery<HTMLElement>'.
import * as bootstrap from 'bootstrap'; // This works DONT REMOVE
import { Currently } from '../shared/Models/Currently';
import { IconTextThings } from '../icon-text/Models/IconTextThings';
import { CurrentWeatherHelper } from './CurrentWeatherHelper';
// https://stackoverflow.com/questions/32735396/error-ts2339-property-modal-does-not-exist-on-type-jquery

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {
  @ViewChild('rainInfo', {static: false}) rainInfoGraph: GraphComponent;
  @ViewChild('totalRain', {static: false}) totalRainGraph: GraphComponent;

  private iconTextThings: IconTextThings[];

  constructor() { }

  ngOnInit() { }

  public doThing(routes: RouteAndWeatherInformation[], focusedRouteId: number): void {
    this.assignCurrentWeatherInfo(routes[focusedRouteId].currentWeather);

    $('#exampleModal').modal();

    // TODO: change [focusedRoute] to check id.
    this.rainInfoGraph.graphIntensityandProb(routes[focusedRouteId].rainIntensities, routes[focusedRouteId].rainProbabilitiesAverage);
    this.totalRainGraph.graphExpectedTotalRainOnRoute(routes, 0, focusedRouteId);
  }

  private assignCurrentWeatherInfo(currentWeather: Currently) {
    this.iconTextThings = [];
    this.iconTextThings.push(CurrentWeatherHelper.getSummary(currentWeather));
    this.iconTextThings.push(CurrentWeatherHelper.getRain(currentWeather.precipIntensity, currentWeather.precipProbability));
    this.iconTextThings.push(CurrentWeatherHelper.getTemperature(currentWeather));
    this.iconTextThings.push(CurrentWeatherHelper.getWind(currentWeather));
    this.iconTextThings.push(CurrentWeatherHelper.getCloudCoverage(currentWeather.cloudCover));
    this.iconTextThings.push(CurrentWeatherHelper.getVisibility(currentWeather.visibility));
    this.iconTextThings.push(CurrentWeatherHelper.getUvIndex(currentWeather.uvIndex));
  }
}
