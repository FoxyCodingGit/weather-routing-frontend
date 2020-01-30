import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RouteFromAPI } from '../map/Model/RouteFromAPI';
import { RouteIWant } from '../map/Model/RouteIWant';
import { RouteInformation } from '../map/Model/RouteInformation';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';
import { RoutingService } from '../shared/routing.service';
import { WeatherService } from '../shared/weather.service';
import { AssetService } from 'src/assets/asset.service';

@Component({
  selector: 'app-route-creation',
  templateUrl: './route-creation.component.html',
  styleUrls: ['./route-creation.component.scss']
})
export class RouteCreationComponent implements OnInit {
  @Output() RoutesCreated: EventEmitter<RouteAndWeatherInformation[]> = new EventEmitter();

  constructor(private routingService: RoutingService, private weatherService: WeatherService, private assetService: AssetService) { }

  public showStartLatLng: boolean = false;
  public showEndLatLng: boolean = false;

  public startingPoint: string;
  public destination: string;

  public defaultRouteName = 'My Route';
  public defaultTravelMode = 'pedestrian';
  private numberOfAltRoutes = 1;

  public startLat = 55.583156106988;
  public startLng = -1.9225142006598617;
  public endLat = 55.575684498080676;
  public endLng = -1.920110941382518;

  public isStartLatLngFocused = true;

  ngOnInit() {
  }

  public onRoutingSubmit(data: any) {

    this.routingService.GetUserDefinedRoutes().subscribe(
      (result) => {
        console.log("!!!!!!!!!");
        console.log(result);
      }
    );

    this.alalalal(data.name, data.travelMode, this.startLat, this.startLng, this.endLat, this.endLng);
  }

  public alalalal(routeName: string, travelMode: string, startLat: number, startLng: number, endLat: number, endLng: number) {
    this.routingService.GetRoutes(travelMode, startLat, startLng, endLat, endLng, this.numberOfAltRoutes).subscribe(
      async (routes: RouteFromAPI[]) => {

        let newRoutesFormat: RouteIWant[] = this.RouteFromAPIToRouteIWant(routes);
        newRoutesFormat.forEach(async routeInformation => {

          let newRoutes: RouteAndWeatherInformation[] = [];

          await this.createRouteWithWeatherInfo(routeInformation, routeName).then(route => {
            newRoutes.push(route);
          });

          this.RoutesCreated.emit(newRoutes);
        });
      }
    );
  }

  public updateLatLngInputValues(e: google.maps.MouseEvent): void {
    if (this.isStartLatLngFocused) {
      this.startLat = e.latLng.lat();
      this.startLng = e.latLng.lng();

      this.populateStartingPoint();

      this.isStartLatLngFocused = !this.isStartLatLngFocused;
    } else {
      this.endLat = e.latLng.lat();
      this.endLng = e.latLng.lng();

      this.populateDestination();

      this.isStartLatLngFocused = !this.isStartLatLngFocused;
    }
  }

  private RouteFromAPIToRouteIWant(routes: RouteFromAPI[]): RouteIWant[] { // move to service or someytinh
    let newRouteIWantFormat: RouteIWant[] = [];

    routes.forEach(route => {
      let latLngs: google.maps.LatLng[] = [];
      route.points.forEach(point => {
        latLngs.push(new google.maps.LatLng(point.latitude, point.longitude));
      });

      newRouteIWantFormat.push(new RouteIWant(latLngs, route.travelTimeInSeconds, route.distance));
    });

    return newRouteIWantFormat;
  }

  public async populateStartingPoint() {
    await RoutingService.getLocationName(new google.maps.LatLng(this.startLat, this.startLng)).then(location => {
      this.startingPoint = location;
    });
  }

  public async populateDestination() {
    await RoutingService.getLocationName(new google.maps.LatLng(this.endLat, this.endLng)).then(location => {
      this.destination = location;
    });
  }

  private async createRouteWithWeatherInfo(routeInformation: RouteIWant, routeName: string): Promise<RouteAndWeatherInformation> {
    let mapRoute = new google.maps.Polyline({
      path: routeInformation.points,
      geodesic: true,
      strokeColor: routeInformation.colour + ', 1)',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    let thisRoute = new RouteInformation(RoutingService.routeId, mapRoute, routeInformation.travelTimeInSeconds, routeName, routeInformation.colour, routeInformation.distance);
    RoutingService.routeId++;

    return await this.weatherService.addWeatherInformationToRoute(thisRoute);
  }

}
