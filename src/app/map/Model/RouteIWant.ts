export class RouteIWant {

    public constructor(points: google.maps.LatLng[], travelTimeInSeconds: number, distance: number) {
        this.points = points;
        this.travelTimeInSeconds = travelTimeInSeconds;
        this.distance = distance;
    }

    public points: google.maps.LatLng[];
    public travelTimeInSeconds: number;
    public distance: number;
}