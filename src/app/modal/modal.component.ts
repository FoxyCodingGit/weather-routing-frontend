import { Component, OnInit, ViewChild } from '@angular/core';
import { GraphComponent } from '../graph/graph.component';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';

// import * as $ from 'jquery'; // cant have this as Property 'modal' does not exist on type 'JQuery<HTMLElement>'.
import * as bootstrap from 'bootstrap'; // This works DONT REMOVE
// https://stackoverflow.com/questions/32735396/error-ts2339-property-modal-does-not-exist-on-type-jquery

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {
  @ViewChild('rainInfo', {static: false}) rainInfoGraph: GraphComponent;
  @ViewChild('totalRain', {static: false}) totalRainGraph: GraphComponent;

  constructor() { }

  ngOnInit() { }

  public doThing(routes: RouteAndWeatherInformation[], focusedRouteId: number): void {
    $('#exampleModal').modal();

    // TODO: change [focusedRoute] to check id.
    this.rainInfoGraph.graphIntensityandProb(routes[focusedRouteId].rainIntensities, routes[focusedRouteId].rainProbabilitiesAverage);
    this.totalRainGraph.graphExpectedTotalRainOnRoute(routes, 0, focusedRouteId);
  }
}
