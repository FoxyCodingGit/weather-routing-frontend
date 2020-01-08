export class Currently {
    time: number; // DONT CARE ABOUT
    summary: string;
    icon: IconType;
    nearestStormDistance: number;
    nearestStormBearing: number;
    precipIntensity: number; // DONT CARE ABOUT?
    precipProbability: number; // DONT CARE ABOUT?
    temperature: number;
    apparentTemperature: number;
    dewPoint: number; // DONT CARE ABOUT
    humidity: number;
    pressure: number; // DONT CARE ABOUT
    windSpeed: number;
    windGust: number;
    windBearing: number;
    cloudCover: number;
    uvIndex: number;
    visibility: number;
    ozone: number; // DONT CARE ABOUT
}

export enum IconType {
    CLEAR_DAY = 'clear-day',
    CLEAR_NIGHT = 'clear-night',
    RAIN = 'rain',
    SNOW = 'snow',
    SLEET = 'sleet',
    WIND = 'wind',
    FOG = 'fog',
    CLOUDY = 'cloudy',
    PARTLY_CLOUDY_DAY = 'partly-cloudy-day',
    PARTLY_CLOUDY_NIGHT = 'partly-cloudy-night'
}