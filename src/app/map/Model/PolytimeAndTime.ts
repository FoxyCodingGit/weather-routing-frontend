export class PolytimeandTime {

    public constructor(route: google.maps.Polyline, travelTimeInSeconds: number) {
        this.route = route;
        this.travelTimeInSeconds = travelTimeInSeconds;
    }

    public route: google.maps.Polyline;
    public travelTimeInSeconds: number;
}