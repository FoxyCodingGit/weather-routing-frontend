import { RouteInformation } from './RouteInformation';
import { Currently } from 'src/app/shared/Models/Currently';

export class RouteAndWeatherInformation {

    public constructor(routeInformation: RouteInformation, rainIntensities: number[][], rainProbabilities: number[][], currentWeather: Currently) {
        this.routeInformation = routeInformation;
        this.rainIntensities = rainIntensities;
        this.rainProbabilities = rainProbabilities;
        this.rainProbabilitiesAverage = this.getAveragePercentageValues();
        this.currentWeather = currentWeather;
    }

    public routeInformation: RouteInformation;
    public rainIntensities: number[][];
    public rainProbabilities: number[][]; // NOT * 100 yet.
    public rainProbabilitiesAverage: number[];
    public currentWeather: Currently;

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
