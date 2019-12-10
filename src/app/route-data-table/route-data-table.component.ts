import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as $ from 'jquery';
import 'datatables.net';
import { RouteInformation } from '../map/Model/RouteInformation';
import { WeatherService } from '../shared/weather.service';

@Component({
  selector: 'app-route-data-table',
  templateUrl: './route-data-table.component.html',
  styleUrls: ['./route-data-table.component.scss']
})
export class RouteDataTableComponent implements OnInit {
  @Output() SelectRowAction: EventEmitter<any> = new EventEmitter(); // turn to model

  constructor() { }

  ngOnInit() {
    const tableSettings: DataTables.Settings = {
      columns: [
        { title: 'id', visible: false },
        { title: 'Name' },
        { title: 'Start' },
        { title: 'End' },
        { title: 'Duration', width: '5%' },
        { title: 'Distance', width: '5%' },
        { title: 'Leave Now', width: '10%' },
        { title: 'Leave in 5 Mins', width: '10%' },
        { title: 'Leave in 10 Mins', width: '10%' },
        { title: 'Leave in 15 Mins', width: '10%' },
        { title: 'Leave in 20 Mins', width: '10%' }
       ]
    };

    $('#table_id').DataTable(tableSettings);

    const componentScope = this;
    const table = $('#table_id').DataTable();

    const selectRowFunc = function() {
      let selectRowOutcome = true;

      if ($(this).hasClass('selected')) {
        $(this).removeClass('selected');
        selectRowOutcome = false;
      } else {
        table.$('tr.selected').removeClass('selected');
        $(this).addClass('selected');
      }

      const emitData = {routeIdfocused: table.row(this).data()[0], selectAction: selectRowOutcome};

      componentScope.SelectRowAction.emit(emitData);
      // TODO: hiddencolumForIdPosition is hacky. Tried placing id at start and hiding but would hide name column
    };

    $('#table_id').on('click', 'tr', selectRowFunc);
  }

  public addRouteToTable(routeInformation: RouteInformation, overallScores: string[]) {
    const scoreComparisonIcons = this.getCorrectIcons(overallScores);

    $('#table_id').DataTable().row.add([
      routeInformation.id,
      routeInformation.name,
      routeInformation.startLocation,
      routeInformation.endLocation,
      Math.round(routeInformation.travelTimeInSeconds / 60) + ' mins',
      routeInformation.distance + 'm',
      overallScores[0],
      overallScores[1] + scoreComparisonIcons[0],
      overallScores[2] + scoreComparisonIcons[1],
      overallScores[3] + scoreComparisonIcons[2],
      overallScores[4] + scoreComparisonIcons[3],
    ]).draw();
  }

  private getCorrectIcons(overallScores: string[]): string[] {
    const iconNames: string[] = [];

    for (let i = 0; i < overallScores.length; i++) {
      if (overallScores[i + 1] > overallScores[i]) { // hacky hack as comparing strings, should work but fragile.
        iconNames.push('<i class="fas fa-chevron-circle-up"></i>');
      } else if (overallScores[i + 1] === overallScores[i]) {
        iconNames.push('<i class="fas fa-minus-circle"></i>');
      } else {
        iconNames.push('<i class="fas fa-chevron-circle-down"></i>');
      }
    }

    return iconNames;
  }

  public selectRowByRouteId(routeId: number) {
    const table = $('#table_id').DataTable();
    table.$('tr.selected').removeClass('selected');

    for (let i = 0; i < table.rows().count(); i++) { // check count
      const focusedRouteId = table.row(i).data()[0];
      if (routeId === focusedRouteId) {
        table.
        $(table.row(i).node()).addClass('selected');
        break;
      }
    }

    // capitalisaiton
    const emitData = {routeIdfocused: routeId, selectAction: true}; // clicking on map route will always select the row. // kinda hack. using for trigger but no dynamic info sent over.
    this.SelectRowAction.emit(emitData);
  }
}
