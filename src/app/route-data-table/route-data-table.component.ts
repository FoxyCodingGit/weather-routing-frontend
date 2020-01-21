import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as $ from 'jquery'; // we need this apparently? must be a cleaner way
import 'datatables.net';
import { RouteInformation } from '../map/Model/RouteInformation';

@Component({
  selector: 'app-route-data-table',
  templateUrl: './route-data-table.component.html',
  styleUrls: ['./route-data-table.component.scss']
})
export class RouteDataTableComponent implements OnInit {
  @Output() SelectRowAction: EventEmitter<number> = new EventEmitter();
  @Output() routeInfoButtonPressed: EventEmitter<number> = new EventEmitter();

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
        { title: 'Leave in 5 Mins', width: '12%' },
        { title: 'Leave in 10 Mins', width: '12%' },
        { title: 'Leave in 15 Mins', width: '12%' },
        { title: 'Leave in 20 Mins', width: '12%' },
        { title: 'SPECIAL' }
       ]
    };

    $('#table_id').DataTable(tableSettings);

    const componentScope = this;
    const table = $('#table_id').DataTable();

    let that = this;

    const selectRowFunc = function() {
      let selectRowOutcome = true;

      if ($(this).hasClass('selected')) {
        $(this).removeClass('selected');
        selectRowOutcome = false;
      } else {
        table.$('tr.selected').removeClass('selected');
        $(this).addClass('selected');
      }

      componentScope.SelectRowAction.emit(table.row(this).data()[0]);

      // TODO: hiddencolumForIdPosition is hacky. Tried placing id at start and hiding but would hide name column
    };

    that = this;

    $('#table_id tbody').on( 'click', 'button.weatherInfo', function () {
      var data = table.row( $(this).parents('tr') ).data();
      that.sendRouteInfoButtonPressedOutput(data[0]);
    });

    $('#table_id tbody').on( 'click', 'i.fas.fa-star', function () {
      var data = table.row( $(this).parents('tr') ).data();
      that.toggleFavouriteRoute(data[0]);
    });

    $('#table_id').on('click', 'tr', selectRowFunc);
  }

  public addRouteToTable(routeInformation: RouteInformation, overallScores: string[]) {
    const scoreComparisonIcons = this.getCorrectIcons(overallScores);

    $('#table_id').DataTable().row.add([
      routeInformation.id,
      '<div class="wrapper"><div class="square" style="background-color: ' + routeInformation.color + ', 1); color: ' + routeInformation.basicContrastColour + '">'+ routeInformation.id + '</div>' + routeInformation.name + '</div>',
      routeInformation.startLocation, // move html to function for readability?
      routeInformation.endLocation,
      Math.round(routeInformation.travelTimeInSeconds / 60) + ' mins',
      routeInformation.distance + 'm',
      overallScores[0],
      overallScores[1] + scoreComparisonIcons[0],
      overallScores[2] + scoreComparisonIcons[1],
      overallScores[3] + scoreComparisonIcons[2],
      overallScores[4] + scoreComparisonIcons[3],
      '<button class="weatherInfo">CLICK ME!!!</button><i class="fas fa-star"></i>' // TODO: button no work. do on select row for dev.
    ]).draw();
  }

  public sendRouteInfoButtonPressedOutput(routeId: number): void {
    this.routeInfoButtonPressed.emit(routeId);
  }

  private toggleFavouriteRoute(routeId: number) {
    console.log("GROOVY IT WORKS WHN YOU PRESS THE STAR");
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
    //table.$('tr.selected').removeClass('selected');

    let rowIsSelected = false;

    for (let i = 0; i < table.rows().count(); i++) { // check count

      const focusedRouteId = table.row(i).data()[0];

      let node = $(table.row(i).node());

      if (routeId === focusedRouteId) {
        if (node.hasClass('selected')) {
          node.removeClass('selected');
        } else {
          node.addClass('selected');
          rowIsSelected = true;
        }
      } else {
        node.removeClass('selected');
      }
    }

    this.SelectRowAction.emit(routeId); // emitting whats passed in. have to emit to update gui, not happy with solution.
  }
}
