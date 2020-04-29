export class Alert {
    type: AlertType;
    header: string;
    message: string;
    cssClass: string;
}

export enum AlertType {
    SUCCESS = "sucess",
    WARNING = "warning",
    ERROR = "error"
}