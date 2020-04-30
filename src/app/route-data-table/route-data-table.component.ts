import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as $ from 'jquery'; // we need this apparently? must be a cleaner way
import 'datatables.net';
import { RouteInformation } from '../map/Model/RouteInformation';
import { Subject, Observable } from 'rxjs';
import { RoutingService } from '../shared/routing.service';
import { RouteSelectedState } from '../shared/Models/RouteSelectedState';
import { AuthenticationService } from '../login/services/authentification.service';

@Component({
  selector: 'app-route-data-table',
  templateUrl: './route-data-table.component.html',
  styleUrls: ['./route-data-table.component.scss']
})
export class RouteDataTableComponent implements OnInit {
  @Output() SelectRowAction: EventEmitter<RouteSelectedState> = new EventEmitter();
  @Output() routeInfoButtonPressed: EventEmitter<number> = new EventEmitter();
  @Output() routeCreationComplete: EventEmitter<void> = new EventEmitter();
  @Output() routeDeleted: EventEmitter<number> = new EventEmitter();

  private favouritePressedSubject = new Subject<number>(); // This can be removed as there is no need for subject. Can just use code directly on favbuttonpressed

  constructor(private routingService: RoutingService, private authService: AuthenticationService) { }

  public getFavouriteObserver(): Observable<number> {
    return this.favouritePressedSubject.asObservable();
  }

  private changeFavouriteStatus(routeId: number) {
    const table = $('#table_id').DataTable();

    if (this.routingService.getRouteAndWeatherInformationById(routeId).routeInformation.isFavourite) {
      table.cell({row: routeId, column: 1}).data('<i class="fas fa-star"></i><i class="fas fa-trash"></i><button style="margin-left:10px" class="weatherInfo">Current Weather</button>');
    } else {
      table.cell({row: routeId, column: 1}).data('<i class="far fa-star"></i><i class="fas fa-trash"></i><button style="margin-left:10px" class="weatherInfo">Current Weather</button>');
    }
    $('#table_id').DataTable().draw();
  }

  private async deleteFromDB(routeId: number) {
    await this.routingService.deleteUserDefinedRouteOnDB(this.routingService.getRouteAndWeatherInformationById(routeId).routeInformation.databaseRouteId).toPromise().then(
      (result) => {
        this.routingService.getRouteAndWeatherInformationById(routeId).routeInformation.isFavourite = false;
        this.routingService.getRouteAndWeatherInformationById(routeId).routeInformation.databaseRouteId = null;
      }
    );
  }

  private async addToDB(routeId: number) {
    await this.routingService.createUserDefinedRoute(this.routingService.getRouteAndWeatherInformationById(routeId).routeInformation).toPromise().then(
      (result) => {
        this.routingService.getRouteAndWeatherInformationById(routeId).routeInformation.isFavourite = true;
        this.routingService.getRouteAndWeatherInformationById(routeId).routeInformation.databaseRouteId = result.routeId.toString();
      }
    );
  }

  ngOnInit() {
    this.getFavouriteObserver().subscribe(
      async (routeId) => {
        if (this.authService.currentUserValue == null) {
          return;
        }

        if (this.routingService.getRouteAndWeatherInformationById(routeId).routeInformation.isFavourite) { await this.deleteFromDB(routeId); }
        else { await this.addToDB(routeId); }

        this.changeFavouriteStatus(routeId);
    });

    const tableSettings: DataTables.Settings = {
      columns: [
        { title: 'id', visible: false },
        { title: '', width: "10%", orderable: false },
        { title: 'Name', width: "10%" },
        { title: 'Start', width: "10%" },
        { title: 'End', width: "10%" },
        { title: 'Duration' },
        { title: 'Distance' },
        { title: 'Leave Now', width: "10%"},
        { title: 'Leave in 5 Mins', width: "10%" },
        { title: 'Leave in 10 Mins', width: "10%" },
        { title: 'Leave in 15 Mins', width: "10%" },
        { title: 'Leave in 20 Mins', width: "10%" },
       ],
       pageLength: 5
    };

    $('#table_id').DataTable(tableSettings);

    const componentScope = this;
    const table = $('#table_id').DataTable();

    let that = this;

    const selectRowFunc = function() {
      let isHighlightingRow: boolean;

      if ($(this).hasClass('selected')) {
        $(this).removeClass('selected');
        isHighlightingRow = false;
      } else {
        table.$('tr.selected').removeClass('selected');
        $(this).addClass('selected');
        isHighlightingRow = true;
      }

      componentScope.SelectRowAction.emit({ focusedRouteId: table.row(this).data()[0], isHighlightedRow: isHighlightingRow });
    };

    that = this;

    $('#table_id tbody').on( 'click', 'button.weatherInfo', function () {
      var data = table.row( $(this).parents('tr') ).data();
      that.sendRouteInfoButtonPressedOutput(data[0]);
    });

    $('#table_id tbody').on( 'click', 'i.fa-star', function () {
      var data = table.row( $(this).parents('tr') ).data();
      that.favouriteClicked(data[0]);
    });

    $('#table_id tbody').on( 'click', 'i.fa-trash', function () {
      var data = table.row($(this).parents('tr')).data();
      that.removeRouteEntirely(data[0]);
      
      table.row($(this).parents('tr')).remove();
      $('#table_id').DataTable().draw();
    });

    $('#table_id').on('click', 'tr', selectRowFunc);
  }

  public clearTable(): void {
    $('#table_id').DataTable().clear().draw();
  }

  public addRouteToTable(routeInformation: RouteInformation, overallScores: string[]) {
    const scoreComparisonIcons = this.getCorrectIcons(overallScores);

    let starIconType: string;
    if (routeInformation.isFavourite) {
      starIconType = 'fas';
    } else {
      starIconType = 'far';
    }

    $('#table_id').DataTable().row.add([
      routeInformation.id,
      '<i class="' + starIconType + ' fa-star"></i><i class="fas fa-trash"></i><button style="margin-left:10px" class="weatherInfo">Current Weather</button>',
      '<div class="wrapper"><div class="square" style="background-color: ' + routeInformation.color + ', 1); color: ' + routeInformation.basicContrastColour + '">'+ routeInformation.id + '</div>' + routeInformation.name + '</div>',
      routeInformation.startLocation, // move html to function for readability?
      routeInformation.endLocation,
      Math.round(routeInformation.travelTimeInSeconds / 60) + ' mins',
      routeInformation.distance + 'm',
      overallScores[0],
      overallScores[1] + scoreComparisonIcons[0],
      overallScores[2] + scoreComparisonIcons[1],
      overallScores[3] + scoreComparisonIcons[2],
      overallScores[4] + scoreComparisonIcons[3]
    ]).draw();

    this.routeCreationComplete.emit();
  }

  public sendRouteInfoButtonPressedOutput(routeId: number): void {
    this.routeInfoButtonPressed.emit(routeId);
  }

  private removeRouteEntirely(routeId: number): void {
    if (this.routingService.getRouteAndWeatherInformationById(routeId).routeInformation.databaseRouteId != null) {
      this.deleteFromDB(routeId);
    }

    this.routingService.removeRouteAndWeatherInformationOfrouteId(routeId);
    this.routeDeleted.emit(routeId);
  }

  private favouriteClicked(routeId: number) {
    this.favouritePressedSubject.next(routeId);
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

  public selectRowByRouteId(routeId: number) { // TODO: DOESNT WORK CLICKING ON ROUTE IN GUI TO SELECT ON MAP
    const table = $('#table_id').DataTable();

    let isHighlightingRow = false;

    for (let i = 0; i < table.rows().count(); i++) { // check count

      const focusedRouteId = table.row(i).data()[0];

      let node = $(table.row(i).node());

      if (routeId === focusedRouteId) {
        if (node.hasClass('selected')) {
          node.removeClass('selected');
        } else {
          node.addClass('selected');
          isHighlightingRow = true;
        }
      } else {
        node.removeClass('selected');
      }
    }

    this.SelectRowAction.emit({ focusedRouteId: routeId, isHighlightedRow: isHighlightingRow });
  }
}
