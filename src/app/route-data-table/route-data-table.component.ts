import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as $ from 'jquery';
import 'datatables.net';
import { RouteInformation } from '../map/Model/RouteInformation';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';
import { WeatherService } from '../shared/weather.service';

@Component({
  selector: 'app-route-data-table',
  templateUrl: './route-data-table.component.html',
  styleUrls: ['./route-data-table.component.scss']
})
export class RouteDataTableComponent implements OnInit {
  @Output() RouteIdfocused: EventEmitter<number> = new EventEmitter();

  constructor(private weatherService: WeatherService) { }

  ngOnInit() {
    const tableSettings: DataTables.Settings = {
      columns: [
        { title: "Name" },
        { title: "Duration (Minutes)" },
        { title: "Distance (Metres)" },
        { title: "Expected Rain (less is better)" }
      ]
    };

    $('#table_id').DataTable(tableSettings);

    const componentScope = this;
    let table = $('#table_id').DataTable();

    let selectRowFunc = function() {
      if ($(this).hasClass('selected')) {
        $(this).removeClass('selected');
      } else {
        table.$('tr.selected').removeClass('selected');
        $(this).addClass('selected');
      }
      componentScope.RouteIdfocused.emit(table.row(this).data()[4]);
      // TODO: 4 is hacky. Tried placing id at start and hiding but would hide name columb
    };

    $('#table_id').on('click', 'tr', selectRowFunc);
  }

  public addRouteToTable(routeInformation: RouteInformation, overallScore: number, routePlacementInArray: number) {
    $('#table_id').DataTable().row.add([
      routeInformation.name,
      Math.round(routeInformation.travelTimeInSeconds / 60),
      routeInformation.distance,
      overallScore,
      routePlacementInArray
    ]).draw();
  }

  public changeEachRowScore(whichDepartureTimeIsChosen: number, routeAndWeatherInformation: RouteAndWeatherInformation[]) {
    let table = $('#table_id').DataTable();

    for (let i = 0; i < table.rows().count(); i++) { // check count
      let routeId = table.row(i).data()[4];
      const newScore: any = this.weatherService.generateOverallRouteScore(routeAndWeatherInformation[routeId], whichDepartureTimeIsChosen);

      table.cell({row: i, column: 3}).data(newScore);
    }

    $('#table_id').DataTable().draw();
  }
}
