export class RouteInformation {

    public constructor(route: google.maps.Polyline, travelTimeInSeconds: number, name: string, color: string, distance: number) {
        this.route = route;
        this.travelTimeInSeconds = travelTimeInSeconds;
        this.color = color;
        this.name = name;
        this.distance = distance;
    }

    public route: google.maps.Polyline;
    public travelTimeInSeconds: number;
    public color: string;
    public name: string;
    public distance: number;
}
