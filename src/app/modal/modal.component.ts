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
  @ViewChild(GraphComponent, {static: false}) graph: GraphComponent;

  constructor() { }

  ngOnInit() { }

  public doThing(focusedRoute: RouteAndWeatherInformation): void {
    $('#exampleModal').modal();

    this.graph.graphIntensityandProb(focusedRoute.rainIntensities, focusedRoute.rainProbabilitiesAverage);
  }
}
