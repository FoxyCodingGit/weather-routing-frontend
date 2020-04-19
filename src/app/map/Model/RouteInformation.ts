import { WeatherPoint } from './weatherPoint';
import { TempRouteHelper } from 'src/app/shared/tempRouteHelper';
import { TravelMode } from 'src/app/shared/Models/travelMode';
import { ElevationResult } from 'src/app/shared/Models/Elevation/ElevationResult';
import { Location } from 'src/app/shared/Models/Elevation/Location';
import { RoutingService } from 'src/app/shared/routing.service';

export class RouteInformation {
    public constructor(private routingService: RoutingService, id: number, route: google.maps.Polyline, travelTimeInSeconds: number, name: string, color: string, distance: number, isFavourite: boolean, databaseRouteId: string, travelMode: TravelMode) {
        this.id = id;
        this.route = route;
        this.travelTimeInSeconds = travelTimeInSeconds;
        this.color = color;
        this.basicContrastColour = this.calculateBasicContrastColour();
        this.name = name;
        this.distance = distance;
        this.bounds = this.createBoundForPolygon(route.getPath().getArray());
        this.isFavourite = isFavourite;
        this.databaseRouteId = databaseRouteId;
        this.getStartEndLocationName();
        this.travelMode = travelMode;
        this.applyElevationToRoute();
        this.setRouteCumulativeDistances();
    }

    public id: number;
    public route: google.maps.Polyline;
    public travelTimeInSeconds: number;
    public color: string;
    public basicContrastColour: string;
    public name: string;
    public distance: number;
    public bounds: google.maps.LatLngBounds;
    public weatherPoints: WeatherPoint[] = [];
    public startLocation: string;
    public endLocation: string;
    public isFavourite: boolean;
    public databaseRouteId: string;
    public travelMode: TravelMode;
    public elevation: ElevationResult[];
    public cumulativeDistances: number[] = [];
    
    public setRouteCumulativeDistances() {
        let route = this.route.getPath().getArray();
        let cumulativeDistance = 0;
        this.cumulativeDistances.push(0);

        for(let i = 0; i < route.length - 1; i++) {
            cumulativeDistance += this.routingService.distanceToNextLatLngValue(this.route.getPath().getArray(), i);
            this.cumulativeDistances.push(cumulativeDistance);
        }
    }

    private createBoundForPolygon(latLngs: google.maps.LatLng[]): google.maps.LatLngBounds {
        const bounds = new google.maps.LatLngBounds();

        for (const latLng of latLngs) {
            bounds.extend(latLng);
        }

        return bounds;
    }

    private calculateBasicContrastColour(): string {
        const rgbaRoughSplitter = this.color.split(',');
        const firstNumber = rgbaRoughSplitter[0].split('(')[1];
        const middleDarknessTotalRGBValue = 382;

        if (+firstNumber + +rgbaRoughSplitter[1].trim() + +rgbaRoughSplitter[2].trim() > middleDarknessTotalRGBValue) {
            return 'rgb(0, 0, 0)';
        } else {
            return 'rgb(255, 255, 255)';
        }
    }

    private async getStartEndLocationName() {
        const startLat = this.route.getPath().getArray()[0].lat();
        const startLng = this.route.getPath().getArray()[0].lng();

        const lestLatLngIndex = this.route.getPath().getArray().length - 1;
        const endLat = this.route.getPath().getArray()[lestLatLngIndex].lat();
        const endLng = this.route.getPath().getArray()[lestLatLngIndex].lng();

        await TempRouteHelper.getLocationName(new google.maps.LatLng(startLat, startLng)).then(result => {
            this.startLocation = result;
        });

        await TempRouteHelper.getLocationName(new google.maps.LatLng(endLat, endLng)).then(result => {
            this.endLocation = result;
        });
    }

    private applyElevationToRoute() {
        let locations: Location[] = [];

        this.route.getPath().getArray().forEach(latLngValue => {
            locations.push({ lat: latLngValue.lat().toString(), lng: latLngValue.lng().toString() })
        });

        this.routingService.getElevation(locations).subscribe((elevations) => {
            this.elevation = elevations.results;
        });
    }
}
