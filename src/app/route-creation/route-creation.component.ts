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

  routeId = 0;
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

    this.routingService.GetRoutes(data.travelMode, this.startLat, this.startLng, this.endLat, this.endLng, this.numberOfAltRoutes).subscribe(
      async (routes: RouteFromAPI[]) => {
        let newRoutesFormat: RouteIWant[] = this.RouteFromAPIToRouteIWant(routes);

        let lestLatLngIndex = routes[0].points.length - 1;
        let startLocationName: string;
        let endLocationName: string;

        await this.getLocationName(new google.maps.LatLng(routes[0].points[0].latitude, routes[0].points[0].longitude)).then(result => {
          startLocationName = result;
        });

        await this.getLocationName(new google.maps.LatLng(routes[0].points[lestLatLngIndex].latitude, routes[0].points[lestLatLngIndex].longitude)).then(result => {
          endLocationName = result;
        });


        newRoutesFormat.forEach(async routeInformation => {

          let newRoutes: RouteAndWeatherInformation[] = [];

          await this.createRouteWithWeatherInfo(startLocationName, endLocationName, routeInformation, data).then(route => {
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
    await this.getLocationName(new google.maps.LatLng(this.startLat, this.startLng)).then(location => {
      this.startingPoint = location;
    });
  }

  public async populateDestination() {
    await this.getLocationName(new google.maps.LatLng(this.endLat, this.endLng)).then(location => {
      this.destination = location;
    });
  }

  private async getLocationName(latLng: google.maps.LatLng): Promise<string> {
    let geocoder = new google.maps.Geocoder;

    return new Promise(function(resolve, reject) {
      geocoder.geocode({ 'location': latLng }, function (results) {
        let addressOutput = '';

        if (!results) {
          addressOutput = 'Geocoder passed but result null';
        } else if (results[0]) {
          //that.zoom = 11;
          //that.currentLocation = results[0].formatted_address;

          console.log(results[0]);

          results[0].address_components.forEach(addressPart => {
            if (addressPart.types[0] === 'street_number'
            || addressPart.types[0] === 'route'
            || addressPart.types[0] === 'postal_code') {
              addressOutput += addressPart.long_name + ' ';
            }
          });

          addressOutput = addressOutput.substring(0, addressOutput.length - 1);

          resolve(addressOutput);
        } else {
          console.log('No results found');
          reject('Error!');
        }
      });
    });
  }

  private async createRouteWithWeatherInfo(startLocation: string, endLocation: string, routeInformation: RouteIWant, data: any): Promise<RouteAndWeatherInformation> {
    let mapRoute = new google.maps.Polyline({
      path: routeInformation.points,
      geodesic: true,
      strokeColor: routeInformation.colour + ', 1)',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    let thisRoute = new RouteInformation(this.routeId, mapRoute, routeInformation.travelTimeInSeconds, data.name, routeInformation.colour, routeInformation.distance, startLocation, endLocation);
    this.routeId++;

    return await this.weatherService.addWeatherInformationToRoute(thisRoute);
  }

}
