import { RouteInformation } from './RouteInformation';

export class RouteAndWeatherInformation {

    public constructor(routeInformation: RouteInformation, rainIntensities: number[][], rainProbabilities: number[][]) {
        this.routeInformation = routeInformation;
        this.rainIntensities = rainIntensities;
        this.rainProbabilities = rainProbabilities;
        this.rainProbabilitiesAverage = this.getAveragePercentageValues();
    }

    public routeInformation: RouteInformation;
    public rainIntensities: number[][];
    public rainProbabilities: number[][]; // NOT * 100 yet.
    public rainProbabilitiesAverage: number[];

    private getAveragePercentageValues(): number[] {
        let averageRainProbForEachDeparture: number[] = [];

        this.rainProbabilities.forEach(departureTimeRainProbabilities => {
            let average = 0;

            departureTimeRainProbabilities.forEach(probabilies => {
                average += probabilies * 100;
            });

            averageRainProbForEachDeparture.push(+(average / departureTimeRainProbabilities.length).toFixed(0));
        });

        return averageRainProbForEachDeparture;
    }
}
