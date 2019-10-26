import { ChartOptions } from 'chart.js';

export class myChartOptions {

    public static noLabelBeginAtZero: ChartOptions = { 
        responsive: true,
        scales: {
            yAxes: [{
            ticks: {
            beginAtZero: true
            }
            }]
        },
        legend: {
            display: false
        }
    };

    public static upToHundred: ChartOptions = {
        responsive: true,
        scales: {
            yAxes: [{
            ticks: {
                beginAtZero: true,
                max : 100
            }
            }]
            // xAxes: [{
            //     type: 'linear',
            //     display: true,
            //     scaleLabel: {
            //         display: true,
            //         labelString: 'When to Leave'
            //     }
            // }]                
        }
    };

    public static rainIntensityAndProb: ChartOptions = {
        responsive: true,
        scales: {
            yAxes: [{
            id: 'rainIntensity',
            display: true,
            type: 'linear',
            position: 'left',
            gridLines: {
                display: false
            },
            ticks: {
            beginAtZero: true
            }
            }, {
            id: 'rainProbability',
            display: true,
            type: 'linear',
            position: 'right',
            ticks: {
                beginAtZero: true,
                max : 100
            }
            }]
        },
        legend: {
            display: false
        }
    };
}