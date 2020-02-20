import { Currently } from '../shared/Models/Currently';
import { IconTextThings } from '../icon-text/Models/IconTextThings';

export class CurrentWeatherHelper {

    public static getSummary(currentWeather: Currently): IconTextThings {
        return {
            title: 'Summary',
            icons: ['/assets/images/summary-icon/' + currentWeather.icon + '.png'],
            text: currentWeather.summary
        };
    }

    public static getRain(precipIntensity: number, precipProb: number): IconTextThings { // This is rain information for current. (only first weather point).
        const precipIntensitySummary: string = this.workOutRainIntensity(precipIntensity); 
        
        return {
            title: 'Rain',
            icons: ['/assets/images/rain/' + precipIntensitySummary + '.png'],
            text: precipIntensitySummary.charAt(0).toUpperCase() + precipIntensitySummary.substring(1)
                + '<br>' +
                precipProb + "%"
        };
    }

    public static getTemperature(currentWeather: Currently): IconTextThings {
        return {
            title: 'Temperature',
            icons: ['/assets/images/temperature/' + this.workOutTemperatureIcon(currentWeather.apparentTemperature) + '.png'],
            text: Math.round(currentWeather.temperature).toString() + '°C'
                    + '<br>' +
                    'Feels Like ' +  Math.round(currentWeather.apparentTemperature).toString() + '°C'
        };
    }

    public static getWind(currentWeather: Currently): IconTextThings {
        return {
            title: 'Wind',
            icons: [
                '/assets/images/wind/' + this.workOutWindSpeedIntensity(currentWeather.windSpeed) + '.png',
                '/assets/images/bearing/' + this.workOutBearing(currentWeather.windBearing) + '.png'
            ],
            text: this.toHumanText(this.workOutWindSpeedIntensity(currentWeather.windSpeed))
                + '<br>' +
                (Math.round(currentWeather.windSpeed * 10) / 100).toString() + 'm/s' + ' (Gust ' + (Math.round(currentWeather.windGust * 10) / 100).toString() + 'm/s)'
        };
    }

    public static getCloudCoverage(cloudCover: number): IconTextThings {
        return {
            title: 'Cloud Coverage',
            icons: ['/assets/images/cloud-coverage/' + this.workOutCloudCoverageIcon(cloudCover) + '.png'],
            text: cloudCover * 100 + '%'
        };
    }

    public static getVisibility(visibility: number): IconTextThings {
        const visibilityIdentifier = this.workOutVisibility(visibility);

        return {
            title: 'Visibility',
            icons: ['/assets/images/visibility/' + visibilityIdentifier + '.png'],
            text: visibilityIdentifier.charAt(0).toUpperCase() + visibilityIdentifier.substring(1)
        };
    }

    public static getUvIndex(uvIndex: number): IconTextThings {
        return {
            title: 'UV Index',
            icons: ['/assets/images/uv-index/' + uvIndex + '.png'],
            text: '' // TODO: Advise people what to do depending on uc index.
        };
    }

    private static workOutRainIntensity(rainIntensity: number): string {
        if (rainIntensity < 0.01) {
            return Rain.NONE
        }        
        if (rainIntensity < 0.5) {
            return Rain.DRIZZLE;
        }
        if (rainIntensity < 1) {
            return Rain.LIGHT;
        }
        if (rainIntensity < 4) {
            return Rain.MODERATE;
        }        
        return Rain.HEAVY;   
    }

    private static workOutBearing(bearing: number): string {
        const northEast = 45;
        const east = 90;
        const southEast = 135;
        const south = 180;
        const southWest = 225;
        const west = 270;
        const northWest = 315;

        const angularSlack = 22.5;

        if (bearing <= northEast + angularSlack && bearing > northEast - angularSlack) {
            return CompassDirections.NORTH_EAST;
        } else if (bearing <= east + angularSlack && bearing > east - angularSlack) {
            return CompassDirections.EAST;
        }  else if (bearing <= southEast + angularSlack && bearing > southEast - angularSlack) {
            return CompassDirections.SOUTH_EAST;
        }  else if (bearing <= south + angularSlack && bearing > south - angularSlack) {
            return CompassDirections.SOUTH;
        }  else if (bearing <= southWest + angularSlack && bearing > southWest - angularSlack) {
            return CompassDirections.SOUTH_WEST;
        }  else if (bearing <= west + angularSlack && bearing > west - angularSlack) {
            return CompassDirections.WEST;
        }  else if (bearing <= northWest + angularSlack && bearing > northWest - angularSlack) {
            return CompassDirections.NORTH_WEST;
        } else {
            return CompassDirections.NORTH;
        }
    }

    private static workOutTemperatureIcon(feelsLikeTemp: number) {
        if (feelsLikeTemp < 10) {
            return Temperature.COLD;
        } else if (feelsLikeTemp < 20) {
            return Temperature.TEMPERATE;
        } else {
            return Temperature.WARM;
        }
    }

    private static workOutWindSpeedIntensity(windSpeed: number) { // https://en.wikipedia.org/wiki/Beaufort_scale
        if (windSpeed < 0.5) {
            return WindSpeed.CALM;
        } else if (windSpeed < 1.5) {
            return WindSpeed.LIGHT_AIR;
        } else if (windSpeed < 3.3) {
            return WindSpeed.LIGHT_BREEZE;
        } else if (windSpeed < 5.5) {
            return WindSpeed.GENTLE_BREEZE;
        } else if (windSpeed < 7.9) {
            return WindSpeed.MODERATE_BREEZE;
        } else if (windSpeed < 10.7) {
            return WindSpeed.FRESH_BREEZE;
        } else if (windSpeed < 13.8) {
            return WindSpeed.STRONG_BREEZE;
        } else if (windSpeed < 17.1) {
            return WindSpeed.HIGH_WIND;
        } else { // could continue to include tornadoes etc etc etc.
            return WindSpeed.HIGH_WIND;
        }
    }

    private static workOutCloudCoverageIcon(cloudCover: number) {
        if (cloudCover < 0.1) {
            return CloudCoverage.NONE;
        } else if (cloudCover < 0.4) {
            return CloudCoverage.LITTLE;
        } else if (cloudCover < 0.8) {
            return CloudCoverage.MODERATE;
        } else {
            return CloudCoverage.HIGH;
        }
    }

    private static workOutVisibility(visibility: number) { // https://en.wikipedia.org/wiki/Visibility
        if (visibility < 0.1) { // very low visibility
            return Visibility.VERY_POOR;
        } else if (visibility < 2) { // 1 - 2km is fog (no citation though)
            return Visibility.POOR;
        } else if (visibility < 5) { // 2 - 5 is haze
            return Visibility.MODERATE;
        } else {
            return Visibility.GOOD;
        }
    }

    private static toHumanText(uglyString: string): string {
        const capitalised = uglyString.charAt(0).toUpperCase() + uglyString.substring(1);
        return capitalised.split("-").join(" ");
    }
}

export enum Rain {
    NONE = 'none',
    DRIZZLE = 'drizzle',
    LIGHT = 'light',
    MODERATE = 'moderate',
    HEAVY = 'heavy'
}

export enum CompassDirections {
    NORTH = 'north',
    NORTH_EAST = 'north-east',
    EAST = 'east',
    SOUTH_EAST = 'south-east',
    SOUTH = 'south',
    SOUTH_WEST = 'south-west',
    WEST = 'west',
    NORTH_WEST = 'north-west'
}

export enum Temperature {
    COLD = 'cold',
    TEMPERATE = 'temperate',
    WARM = 'warm'
}

export enum WindSpeed {
    CALM = 'calm',
    LIGHT_AIR = 'light-air',
    LIGHT_BREEZE = 'light-breeze',
    GENTLE_BREEZE = 'gentle-breeze',
    MODERATE_BREEZE = 'moderate-breeze',
    FRESH_BREEZE = 'fresh-breeze',
    STRONG_BREEZE = 'strong-breeze',
    HIGH_WIND = 'high-wind'
}

export enum CloudCoverage {
    NONE = 'none',
    LITTLE = 'little',
    MODERATE = 'moderate',
    HIGH = 'high'
}

export enum Visibility {
    VERY_POOR = 'very-poor',
    POOR = 'poor',
    MODERATE = 'moderate',
    GOOD = 'good'
}
