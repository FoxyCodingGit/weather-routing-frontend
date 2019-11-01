import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';
import 'datatables.net';
import { RouteInteractive } from '../map/Model/routeInteractive';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-route-data-table',
  templateUrl: './route-data-table.component.html',
  styleUrls: ['./route-data-table.component.scss']
})
export class RouteDataTableComponent implements OnInit {
  constructor() { }

  ngOnInit() {

    $('#table_id').DataTable( { // move to options!!
      columns: [
        { title: "Name" },
        { title: "Duration (Minutes)" },
        { title: "Distance (Metres)" },
        { title: "Overall Score" }
      ],
      "columnDefs": [
        {
        targets: [ 0 ],
        visible: false,
        searchable: false
        }
      ]
    });

    let table = $('#table_id').DataTable(); // assigning again

    let selectRowFunc = function() {
      if ($(this).hasClass('selected')) { // tried moving into own function but it cried.
        $(this).removeClass('selected');
      } else {
        table.$('tr.selected').removeClass('selected');
        $(this).addClass('selected');
      }
      alert('this is the row: ' + table.row(this).data()[0]);
    };

    $('#table_id').on('click', 'tr', selectRowFunc);
  }


  public addRouteToTable(routeInformation: RouteInteractive, overallScore: number, routePlacementInArray: number) {
    let t =  $('#table_id').DataTable(  );
    t.row.add([
      routePlacementInArray,
      routeInformation.name,
      Math.round(routeInformation.travelTimeInSeconds / 60),
      routeInformation.distance,
      overallScore
    ]).draw();
  }

}
