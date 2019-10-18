export class RouteInteractive {

    public constructor(route: google.maps.Polyline, travelTimeInSeconds: number, name: string, color: string) {
        this.route = route;
        this.travelTimeInSeconds = travelTimeInSeconds;
        this.color = color;
        this.name = name;
    }

    public route: google.maps.Polyline;
    public travelTimeInSeconds: number;
    public color: string;
    public name: string;
}