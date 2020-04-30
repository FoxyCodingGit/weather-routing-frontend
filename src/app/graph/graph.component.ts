import { Component, Output, EventEmitter } from '@angular/core';
import { RouteInformation } from '../map/Model/RouteInformation';
import { ChartDataSets, ChartOptions, ChartType, ChartColor } from 'chart.js';
import { myChartOptions } from './model/myChartOptions';
import { WeatherService } from '../shared/weather.service';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';
import { Color } from 'ng2-charts';
import { RoutingService } from '../shared/routing.service';
// ng2-charts is needed to allow canvas to be used to show the graph. Removed @types/chart.js as i dont think this added anything.

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html'
})
export class GraphComponent {
  @Output() graphHoveredOn: EventEmitter<number> = new EventEmitter();

  public title: string;
  public chartData: ChartDataSets[];
  public chartLabels: string[];
  public chartColours: Color[];
  public mainChartType: ChartType;
  public chartOptions: ChartOptions;

  public static elevationGraphDistanceIntervalInMeters = 20; // move all this values to config file or something to have all in one place?

  constructor(private routingService: RoutingService, private weatherService: WeatherService) { }

  private setupCanvas(mainChartType: ChartType, chartOptions: ChartOptions) {
    this.chartData = [];
    this.chartColours = [];
    this.mainChartType = mainChartType;
    this.chartOptions = chartOptions;
    this.generateLabelsForDepartureTimes();
  }

  public graphIntensityandProb(rainIntensities: number[][], rainProbs: number[]) {
    this.title = 'rain Intensity and Probability at Different departure times';
    this.setupCanvas('bar', myChartOptions.rainIntensityAndProb);
    this.addRainIntensities(rainIntensities, 'rainIntensity');
    this.addRainPercentages(rainProbs, undefined, 'rgba(255, 99, 132, 0.2)', 'rainProbability');
  }

  // public JustIntensity(rainIntensities: number[][]) {
  //   this.title = 'rain Intensity at Different departure times';
  //   this.setupCanvas('bar', myChartOptions.AverageRainIntensitiesOptions);
  //   this.addRainIntensities(rainIntensities);
  // }

  // public graphRainPercentageForRoute(percentages: number[], route: RouteInformation) {
  //   this.title = 'rain Probability at Different departure times';
  //   this.setupCanvas('line', myChartOptions.upToHundred);
  //   this.addRainPercentages(percentages, route.name, route.color + ', 0.6)');
  // }

  public graphAverageRainIntensityOfAllRoutes(departureTime: number, focusedRouteId: number) {
    this.title = "Average Rain Intensity of all routes";
    this.chartData = [];
    this.chartColours = [];
    this.mainChartType = 'bar';
    this.chartOptions = myChartOptions.AverageRainIntensitiesOptions;
    this.generateLabelsForRoutes();

    this.displayAverageRainIntensityOfAllRoutes(departureTime, focusedRouteId);
  }

  public graphElevation(routeInfo: RouteInformation) {
    this.title = "Elevation"
    this.chartData = [];
    this.chartColours = [];
    this.mainChartType = "line";
    this.chartOptions = myChartOptions.elevationOptions;

    var elevationResult: number[] = [];
    routeInfo.elevationInfo.elevations.forEach(elevation => {
      elevationResult.push(elevation.elevation);
    });

    this.chartLabels = [];
    for (let i = 0; i < routeInfo.distance; i += GraphComponent.elevationGraphDistanceIntervalInMeters) {
      this.chartLabels.push((i).toString());
    }

    this.chartData.push({
      data: this.generateElevationData(routeInfo),
      type: 'line'
    });
    
    const green = 'rgba(102, 255, 153, 0.2)';
    this.chartColours.push({backgroundColor: green});

  }

  public onChartHover(event: any) {
    let focusedLegIndex = event.active[0]._index;
    this.graphHoveredOn.emit(focusedLegIndex * GraphComponent.elevationGraphDistanceIntervalInMeters);
  }

  private generateElevationData(routeInfo: RouteInformation): number[] {
    let elevationData: number[] = [];

    for (let currentDistance = 0; currentDistance < routeInfo.distance; currentDistance += GraphComponent.elevationGraphDistanceIntervalInMeters) { // will miss last part if ont multiple of elevationGraphDistanceIntervalInMeters.
      if (currentDistance == 0) {
        elevationData.push(routeInfo.elevationInfo.elevations[0].elevation);
        continue;
      }

      let indexofNextRecordedElevation: number = this.findindexofNextRecordedElevation(currentDistance, routeInfo.cumulativeDistances);
      let percentageOfCurrentLocationFromPreviousRecordedDistance = this.getPercentageOfCurrentDistanceFromPrevDistanceToNextDistance(currentDistance, indexofNextRecordedElevation, routeInfo);
      let whatElevationWouldBeAtThisPercentage = this.calculateWhatElevationValueWouldBeAtThisDistance(percentageOfCurrentLocationFromPreviousRecordedDistance, indexofNextRecordedElevation, routeInfo)
      elevationData.push(whatElevationWouldBeAtThisPercentage);
    }
    return elevationData;
  }

  private getPercentageOfCurrentDistanceFromPrevDistanceToNextDistance(currentDistance: number, indexofNextRecordedElevation: number, routeInfo: RouteInformation): number {
    let previousRecordedDistance = routeInfo.cumulativeDistances[indexofNextRecordedElevation - 1];
    let nextRecordedElevationDistance: number = routeInfo.cumulativeDistances[indexofNextRecordedElevation];
    let distanceBetweenRecordedDistances = nextRecordedElevationDistance - previousRecordedDistance;
    return (currentDistance - previousRecordedDistance) / distanceBetweenRecordedDistances;
  }

  private calculateWhatElevationValueWouldBeAtThisDistance(percentageOfCurrentLocationFromPreviousRecordedDistance: number, indexofNextRecordedElevation: number, routeInfo: RouteInformation): number {
    let previousRecordedElevationValue: number = routeInfo.elevationInfo.elevations[indexofNextRecordedElevation - 1].elevation;
    let nextRecordedElevationValue: number = routeInfo.elevationInfo.elevations[indexofNextRecordedElevation].elevation;
    let valueDifferenceBetweenRecordedValues = nextRecordedElevationValue - previousRecordedElevationValue;
    return previousRecordedElevationValue + (valueDifferenceBetweenRecordedValues * percentageOfCurrentLocationFromPreviousRecordedDistance); 
  }

  private findindexofNextRecordedElevation(currentDistance: number, elevationDistances: number[]): number {
    for (let i = 0; i < elevationDistances.length; i++) {
      if (elevationDistances[i] >= currentDistance) {
        return i;
      }
    }
    return elevationDistances.length - 1; // this means distance does not match up and current distance is past last elevation recorded distance. stil works as later percentage greater than 1 so no worries as there is no "next" one.
  }

  private generateLabelsForDepartureTimes() { // make dynamic
    this.chartLabels = [];
    for (let i = 0; i < 5; i++) {
      this.chartLabels.push((i * 5).toString());
    }
  }

  private generateLabelsForRoutes() {
    let routeWeatherInfo = this.routingService.getRouteAndWeatherInformation();
    this.chartLabels = [];
    routeWeatherInfo.forEach(info => {
      this.chartLabels.push(info.routeInformation.name);
    });
  }

  private addRainIntensities(rainIntensities: number[][], yAxisID?: string) {
    let routeIntensities: number[];

    for (let focusedWeatherStation = 0; focusedWeatherStation < rainIntensities[0].length; focusedWeatherStation++) {
      routeIntensities = [];
      rainIntensities.forEach(intervalIntensities => {
        routeIntensities.push(intervalIntensities[focusedWeatherStation]);
      });

      this.chartData.push({
        data: routeIntensities,
        type: 'bar',
        yAxisID
      });

      const lightBlue = 'rgba(173, 216, 230, 0.8)';
      this.chartColours.push({backgroundColor: lightBlue});
    }
  }

  private addRainPercentages(percentages: number[], label?: string, colour?: string, yAxisID?: string) { // is it okay to have udnefined??
    this.chartData.push({
      data: percentages,
      label,
      type: 'line',
      yAxisID
    });
    this.chartColours.push({backgroundColor: colour});
  }

  private displayAverageRainIntensityOfAllRoutes(departureTime: number, focusedRouteId: number): void {
    let IntensityAverages: number[] = [];
    let colours: Array<ChartColor> = [];
    let borderWidths: Array<number> = [];

    this.routingService.getRouteAndWeatherInformation().forEach(routeAndWeather => {
      let IntensityAverage = this.weatherService.workOutRainIntensityAverageOfRoute(routeAndWeather, departureTime);
      IntensityAverages.push(+IntensityAverage);
      console.log("average mm per hour for route is (for each weather point do intesity until next one. divide by total time) :" + IntensityAverage);

      colours.push(WeatherService.getColourForRouteRainIntensity(+IntensityAverage));
      this.highLightCurrrentRouteIntensityAverage(focusedRouteId, routeAndWeather, borderWidths);
    });

    this.chartData.push({
      data: IntensityAverages,
      backgroundColor: colours,
      borderColor: 'rgb(255,0,0)',
      borderWidth: borderWidths
    });
  }

  private highLightCurrrentRouteIntensityAverage(focusedRouteId: number, routeAndWeather: RouteAndWeatherInformation, borderWidths: Array<number>) {
    if (focusedRouteId !== null) {
      if (routeAndWeather.routeInformation.id === focusedRouteId) {
        borderWidths.push(10);
      } else {
        borderWidths.push(0);
      }
    }
  }
}
