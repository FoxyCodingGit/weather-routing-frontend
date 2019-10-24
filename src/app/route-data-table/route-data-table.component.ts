import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';
import 'datatables.net';

@Component({
  selector: 'app-route-data-table',
  templateUrl: './route-data-table.component.html',
  styleUrls: ['./route-data-table.component.scss']
})
export class RouteDataTableComponent implements OnInit {
  constructor() { }

  ngOnInit() {

    $('#table_id').DataTable(  );

    var t =  $('#table_id').DataTable(  );
    t.row.add([
      "adam",
      "adam",
      "adam",
      "adam",
      "adam",
      "adam"
    ]);
  }
}
