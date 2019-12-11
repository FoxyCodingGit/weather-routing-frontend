import { WeatherPoint } from './weatherPoint';

export class RouteInformation {
    public constructor(id: number, route: google.maps.Polyline, travelTimeInSeconds: number, name: string, color: string, distance: number, startLocation: string, endLocation: string) {
        this.id = id;
        this.route = route;
        this.travelTimeInSeconds = travelTimeInSeconds;
        this.color = color;
        this.basicContrastColour = this.calculateBasicContrastColour();
        this.name = name;
        this.distance = distance;
        this.bounds = this.createBoundForPolygon(route.getPath().getArray());
        this.startLocation = startLocation;
        this.endLocation = endLocation;
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

    private createBoundForPolygon(latLngs: google.maps.LatLng[]): google.maps.LatLngBounds {
        const bounds = new google.maps.LatLngBounds();

        for (const latLng of latLngs)  {
            bounds.extend(latLng);
        }

        return bounds;
    }

    private calculateBasicContrastColour(): string { // rename
        const rgbaRoughSplitter = this.color.split(',');
        const firstNumber = rgbaRoughSplitter[0].split('(')[1];
        const middleDarknessTotalRGBValue = 382;

        if (+firstNumber + +rgbaRoughSplitter[1].trim() + +rgbaRoughSplitter[2].trim() > middleDarknessTotalRGBValue) {
            return 'rgb(0, 0, 0)';
        } else {
            return 'rgb(255, 255, 255)';
        }
      }
}
