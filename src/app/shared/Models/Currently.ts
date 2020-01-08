export class Currently {
    time: number; // DONT CARE ABOUT
    summary: string;
    icon: IconType;
    NearestStormDistance: number;
    NearestStormBearing: number;
    PrecipIntensity: number; // DONT CARE ABOUT?
    PrecipProbability: number; // DONT CARE ABOUT?
    Temperature: number;
    ApparentTemperature: number;
    DewPoint: number; // DONT CARE ABOUT
    Humidity: number;
    Pressure: number; // DONT CARE ABOUT
    WindSpeed: number;
    WindGust: number;
    WindBearing: number;
    CloudCover: number;
    UvIndex: number;
    Visibility: number;
    Ozone: number; // DONT CARE ABOUT
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