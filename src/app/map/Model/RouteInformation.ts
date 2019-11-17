import { WeatherPoint } from './weatherPoint';

export class RouteInformation {
    public constructor(id: number, route: google.maps.Polyline, travelTimeInSeconds: number, name: string, color: string, distance: number) {
        this.id = id;
        this.route = route;
        this.travelTimeInSeconds = travelTimeInSeconds;
        this.color = color;
        this.name = name;
        this.distance = distance;
        this.bounds = this.createBoundForPolygon(route.getPath().getArray());
    }

    public id: number;
    public route: google.maps.Polyline;
    public travelTimeInSeconds: number;
    public color: string;
    public name: string;
    public distance: number;
    public bounds: google.maps.LatLngBounds;
    public weatherPoints: WeatherPoint[] = [];

    private createBoundForPolygon(latLngs: google.maps.LatLng[]): google.maps.LatLngBounds {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < latLngs.length; i++) {
        bounds.extend(latLngs[i]);
        }
        return bounds;
    }
}
