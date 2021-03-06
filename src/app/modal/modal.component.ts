import { Component, OnInit, ViewChild } from '@angular/core';
import { GraphComponent } from '../graph/graph.component';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';

// import * as $ from 'jquery'; // cant have this as Property 'modal' does not exist on type 'JQuery<HTMLElement>'.
import * as bootstrap from 'bootstrap'; // This works DONT REMOVE
import { Currently } from '../shared/Models/Currently';
import { IconTextThings } from '../icon-text/Models/IconTextThings';
import { CurrentWeatherHelper } from './CurrentWeatherHelper';
import { RoutingService } from '../shared/routing.service';
// https://stackoverflow.com/questions/32735396/error-ts2339-property-modal-does-not-exist-on-type-jquery

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {
  @ViewChild('rainInfo') rainInfoGraph: GraphComponent;
  @ViewChild('averageRainIntensity') averageRainIntensityGraph: GraphComponent;

  public selectedDepartureTime = 0;
  public iconTextThings: IconTextThings[];
  private weatherInformationToBeUsed: RouteAndWeatherInformation;
  private focusedRouteId: number;

  constructor(private routingService: RoutingService) { }

  ngOnInit() { }

  public open(focusedRouteId: number): void {
    this.focusedRouteId = focusedRouteId;
    this.weatherInformationToBeUsed = this.routingService.getRouteAndWeatherInformationById(focusedRouteId);
    this.assignCurrentWeatherInfo(this.weatherInformationToBeUsed.currentWeather);

    $('#exampleModal').modal();

    this.rainInfoGraph.graphIntensityandProb(this.weatherInformationToBeUsed.rainIntensities, this.weatherInformationToBeUsed.rainProbabilitiesAverage);
    this.averageRainIntensityGraph.graphAverageRainIntensityOfAllRoutes(this.selectedDepartureTime, focusedRouteId);
  }

  public departureTimeChange() {
    this.averageRainIntensityGraph.graphAverageRainIntensityOfAllRoutes(this.selectedDepartureTime, this.focusedRouteId);
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
