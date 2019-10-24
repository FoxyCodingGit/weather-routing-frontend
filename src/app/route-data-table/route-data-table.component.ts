import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';
import 'datatables.net';
import { RouteInteractive } from '../map/Model/routeInteractive';

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
        { title: "Distance (Meters)" },
        { title: "Overall Score" }
      ]
    });
  }


  public addRouteToTable(routeInformation: RouteInteractive, overallScore: number) {
    let t =  $('#table_id').DataTable(  );
    t.row.add([
      routeInformation.name,
      Math.round(routeInformation.travelTimeInSeconds / 60),
      routeInformation.distance,
      overallScore
    ]).draw();
  }

}
