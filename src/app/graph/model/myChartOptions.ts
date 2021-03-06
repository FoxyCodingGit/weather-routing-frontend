import { ChartOptions } from "chart.js";

export class myChartOptions {
  public static AverageRainIntensitiesOptions: ChartOptions = {
    responsive: true,
    scales: {
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString:
              "Average Rain Intensity (mm per hour)",
          },
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Routes",
          },
        },
      ],
    },
    legend: {
      display: false,
    },
  };

  public static totalExpectedRainOption: ChartOptions = {
    responsive: true,
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
    },
    legend: {
      display: false,
    },
  };

  public static elevationOptions: ChartOptions = {
    responsive: true,
    scales: {
      yAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Elevation (meters)",
          },
        },
      ],
      xAxes: [
        {
          scaleLabel: {
            display: true,
            labelString: "Distance (meters)",
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 4,
          },
        },
      ],
    },
    legend: {
      display: false,
    },
    hover: {
      mode: "index",
      intersect: false,
    },
    tooltips: {
      mode: "index",
      intersect: false,
      callbacks: {
        label: function (tooltipItems, data) {
          return Number.parseFloat(tooltipItems.yLabel as string).toFixed(2);
        },
      },
    },
  };

  public static upToHundred: ChartOptions = {
    responsive: true,
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
            max: 100,
          },
        },
      ],
      // xAxes: [{
      //     type: 'linear',
      //     display: true,
      //     scaleLabel: {
      //         display: true,
      //         labelString: 'When to Leave'
      //     }
      // }]
    },
  };

  public static rainIntensityAndProb: ChartOptions = {
    responsive: true,
    scales: {
      yAxes: [
        {
          id: "rainIntensity",
          display: true,
          type: "linear",
          scaleLabel: {
            display: true,
            labelString: "Rain Intensity (mm per hour)",
          },
          position: "left",
          gridLines: {
            display: false,
          },
          ticks: {
            beginAtZero: true,
          },
        },
        {
          id: "rainProbability",
          display: true,
          type: "linear",
          scaleLabel: {
            display: true,
            labelString: "Rain Probability (%)",
          },
          position: "right",
          ticks: {
            beginAtZero: true,
            max: 100,
          },
        },
      ],
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: "When to Leave (minutes)",
          },
        },
      ],
    },
    legend: {
      display: false,
    },
  };
}
