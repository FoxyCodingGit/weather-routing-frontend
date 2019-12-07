export class RouteIWant {

    public constructor(points: google.maps.LatLng[], travelTimeInSeconds: number, distance: number) {
        this.points = points;
        this.travelTimeInSeconds = travelTimeInSeconds;
        this.distance = distance;
        this.colour = 'rgba(' + this.randomIntFromInterval(0, 200) + ', ' + this.randomIntFromInterval(0, 200)
        + ', ' + this.randomIntFromInterval(0, 200);
    }

    public startLocation: string;
    public endLocation: string;
    public points: google.maps.LatLng[];
    public travelTimeInSeconds: number;
    public distance: number;
    public colour: string;

    private randomIntFromInterval(min, max): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}
