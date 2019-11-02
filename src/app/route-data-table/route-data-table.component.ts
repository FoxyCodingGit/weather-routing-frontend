import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as $ from 'jquery';
import 'datatables.net';
import { RouteInteractive } from '../map/Model/routeInteractive';

@Component({
  selector: 'app-route-data-table',
  templateUrl: './route-data-table.component.html',
  styleUrls: ['./route-data-table.component.scss']
})
export class RouteDataTableComponent implements OnInit {
  @Output() RouteIdfocused: EventEmitter<number> = new EventEmitter();

  constructor() { }

  ngOnInit() {

    $('#table_id').DataTable( { // move to options!!
      columns: [
        { title: "Name" },
        { title: "Duration (Minutes)" },
        { title: "Distance (Metres)" },
        { title: "Overall Score" }
      ],
      // "columnDefs": [
      //   {
      //   targets: [ 4 ],
      //   visible: false,
      //   searchable: false
      //   }
      // ]
    });


    let componentScope = this;

    let table = $('#table_id').DataTable(); // assigning again

    let selectRowFunc = function() {
      if ($(this).hasClass('selected')) { // tried moving into own function but it cried.
        $(this).removeClass('selected');
      } else {
        table.$('tr.selected').removeClass('selected');
        $(this).addClass('selected');
      }
      componentScope.RouteIdfocused.emit(table.row(this).data()[4]); // TODO: 4 is hacky. Tried placing id at start and hiding but would hide name columb
    };

    $('#table_id').on('click', 'tr', selectRowFunc);
  }


  public addRouteToTable(routeInformation: RouteInteractive, overallScore: number, routePlacementInArray: number) {
    let t =  $('#table_id').DataTable(  );
    t.row.add([
      routeInformation.name,
      Math.round(routeInformation.travelTimeInSeconds / 60),
      routeInformation.distance,
      overallScore,
      routePlacementInArray
    ]).draw();
  }

}
