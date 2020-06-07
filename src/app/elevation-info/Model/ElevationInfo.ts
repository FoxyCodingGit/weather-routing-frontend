import { RoutingService } from 'src/app/shared/routing.service';
import { Location } from 'src/app/shared/Models/Elevation/Location';
import { ElevationResult } from 'src/app/shared/Models/Elevation/ElevationResult';

export class ElevationInfo {
    public constructor(private routingService: RoutingService) {}
    
    public elevations: ElevationResult[];
    public totalElevationChange: number;
    public totalInclineElevationGain: number;
    
    public greatestIncline: number;
    public greatestInclineStartingIndex: number;    

    public greatestInclineAngleOverDistance: number;
    public greatestInclineDistanceOverDistance: number;
    public greatestInclineDistanceOverDistanceStartingIndex: number;
    public greatestInclineDistanceOverDistanceEndingIndex: number;

    InclinesOrDeclines: boolean[];

    public async setValues(route: google.maps.Polyline, cumulativeDistances: number[]) {
        await this.setElevation(route);
        this.calculateTotalElevationChange();
        this.calculateTotalInclineElevationGain();
        this.calculateLargestSlantAngle(cumulativeDistances);
        this.calculateGreatestInclineOverDistance(cumulativeDistances);
        this.calculateInclineOrDecline();
    }

    private async setElevation(route: google.maps.Polyline) {
        let locations: Location[] = [];

        route.getPath().getArray().forEach(latLngValue => {
            locations.push({ lat: latLngValue.lat().toString(), lng: latLngValue.lng().toString() })
        });

        await this.routingService.getElevation(locations).toPromise().then((elevations) => {
            this.elevations = elevations.results;
        });
    }

    
    private calculateTotalElevationChange(): void {
        let totalElevationChange = 0;
        let lastElevationValue = this.elevations[0].elevation;

        this.elevations.forEach(element => {
            totalElevationChange += Math.abs(element.elevation - lastElevationValue);
            lastElevationValue = element.elevation;
        });

        this.totalElevationChange = totalElevationChange;
    }

    private calculateTotalInclineElevationGain(): void {
        let totalInclineElevationGain = 0;
        let lastElevationValue = this.elevations[0].elevation;
        let newChange = 0;

        this.elevations.forEach(element => {
            newChange = element.elevation - lastElevationValue;
            if (newChange > 0) totalInclineElevationGain += newChange;
            lastElevationValue = element.elevation;
        });

        this.totalInclineElevationGain = totalInclineElevationGain;
    }

    private calculateLargestSlantAngle(cumulativeDistances: number[]) {
        let elevationDifferenceBetweenTwoPoints: number;
        let lastElevationValue = this.elevations[0].elevation;
        let focusedSlantAngle = 0;
        let maxSlantAngle = 0;
        let greatestInclineStartingIndex = 0;

        for (let i = 0; i < this.elevations.length; i++) {
            if (this.elevations[i].elevation > lastElevationValue) {
                elevationDifferenceBetweenTwoPoints = this.elevations[i].elevation - lastElevationValue;

                focusedSlantAngle = this.sohcahtoa(elevationDifferenceBetweenTwoPoints, cumulativeDistances[i] - cumulativeDistances[i - 1]);

                if (focusedSlantAngle > maxSlantAngle) {
                    maxSlantAngle = focusedSlantAngle;
                    greatestInclineStartingIndex = i - 1;
                }
            }
            lastElevationValue = this.elevations[i].elevation;
        }

        this.greatestIncline = maxSlantAngle;
        this.greatestInclineStartingIndex = greatestInclineStartingIndex;
    }

    private calculateGreatestInclineOverDistance(cumulativeDistances: number[]): void {
        let lastElevationValue = this.elevations[0].elevation;
        let currentIncline = 0;
        let currentDistance = 0;

        let inclines: number[] = [];
        let inclineDistances: number[] = [];
        let inclineStartIndexes: number[] = [];
        let inclineEndIndexes: number[] = [];

        for (let i = 0; i < this.elevations.length; i++) {
            if (this.elevations[i].elevation > lastElevationValue) {
                if (inclineStartIndexes.length === inclineEndIndexes.length) {
                    inclineStartIndexes.push(i);
                }
                currentIncline += this.elevations[i].elevation - lastElevationValue;
                currentDistance += cumulativeDistances[i] - cumulativeDistances[i - 1];
            } else {
                if (inclineStartIndexes.length - inclineEndIndexes.length > 0 && currentDistance != 0) {
                    this.setSubRouteInformation(currentIncline, currentDistance, i, inclines, inclineDistances, inclineStartIndexes, inclineEndIndexes);
                    currentIncline = 0;
                    currentDistance = 0;
                } 
            }
            lastElevationValue = this.elevations[i].elevation;
        }

        if (currentDistance != 0) {
            this.setSubRouteInformation(currentIncline, currentDistance, this.elevations.length, inclines, inclineDistances, inclineStartIndexes, inclineEndIndexes);
        }

        this.setLargestAngleSubsetInfo(inclines, inclineDistances, inclineStartIndexes, inclineEndIndexes);
    }

    private setSubRouteInformation(currentIncline: number, currentDistance: number, i: number, inclines: number[], inclineDistances: number[], inclineStartIndexes: number[], inclineEndIndexes: number[]) {
        inclines.push(currentIncline);
        inclineDistances.push(currentDistance);
        inclineStartIndexes.push(i);
        inclineEndIndexes.push(i - 1);
    }

    private setLargestAngleSubsetInfo(inclines: number[], inclineDistances: number[], inclineStartIndexes: number[], inclineEndIndexes: number[]) {
        let maxAngle: number = 0;
        let subRouteAngle: number = 0;
        let distanceOfMaxAngle: number = 0;
        let indexOfStartEndLegNum = 0;

        for(let i = 0; i < inclines.length; i++) {
            subRouteAngle = this.sohcahtoa(inclines[i], inclineDistances[i])
            if (subRouteAngle > maxAngle) {
                maxAngle = subRouteAngle;
                distanceOfMaxAngle = inclineDistances[i];
                indexOfStartEndLegNum = i;
            } 
        }

        this.greatestInclineAngleOverDistance = maxAngle;
        this.greatestInclineDistanceOverDistance = distanceOfMaxAngle;
        this.greatestInclineDistanceOverDistanceStartingIndex = inclineStartIndexes[indexOfStartEndLegNum];
        this.greatestInclineDistanceOverDistanceEndingIndex = inclineEndIndexes[indexOfStartEndLegNum];
    }

    private sohcahtoa(opposite: number, adjacent: number) {
        return this.radiantoDeg(Math.atan(opposite/ adjacent));
    }

    private radiantoDeg(radian: number) {
        return radian * 180/Math.PI;
    }

    private calculateInclineOrDecline() {
        let inclinesOrDeclines: boolean[] = [];
        let previousElevation: number = this.elevations[0].elevation;

        for (let i = 1; i < this.elevations.length; i++) {
            if (this.elevations[i].elevation > previousElevation) {
                inclinesOrDeclines.push(true);
            } else {
                inclinesOrDeclines.push(false);
            }
            previousElevation = this.elevations[i].elevation;
        }

        this.InclinesOrDeclines = inclinesOrDeclines;
    }
}