import { chart_colours } from "../config/colours.js";

// ===== LINE CHART =====
//
// Create a reusable Chart.js line chart from one or more series.
//
// The function expects the category values for the horizontal axis separately
// from the numeric values for each line.
//
// DATA STRUCTURE
//
// years
//   An array containing the labels shown on the x-axis.
//
//   Although this parameter is called years, it can contain any ordered
//   category labels suitable for a line chart.
//
//   Example:
//
//     [2014, 2015, 2016, 2017]
//
// lines
//   An array containing one numeric array for each line.
//
//   Each inner array should contain one value for every item in years.
//
//   Example:
//
//     [
//       [10.2, 10.8, 11.1, 11.7],
//       [9.5, 9.8, 10.0, 10.4]
//     ]
//
//   This is similar to storing several numeric vectors in a list in R.
//
// labels
//   An array containing the name of each line.
//
//   The order must match the order of the arrays in lines.
//
//   Example:
//
//     ["Males", "Females"]
//
//   Here, labels[0] describes lines[0], labels[1] describes lines[1],
//   and so on.
//
// unit
//   The unit added to values in the chart tooltip.
//
//   Examples:
//
//     "%"
//     "years"
//     "persons"
//
//   The default is "%".
//
// canvas_id
//   The ID of the HTML <canvas> element where the chart will be drawn.
//
//   Example:
//
//     canvas_id: "population-line-chart"
//
// showPoints
//   Controls whether individual data points are visible on each line.
//
//     true   shows the point markers
//     false  hides the point markers
//
//   The default is true.
//
// IMPORTANT INPUT REQUIREMENTS
//
//   • lines and labels should contain the same number of items
//   • every array inside lines should contain the same number of values
//     as years
//   • values in lines should be numeric
//   • canvas_id should match an existing <canvas> element in the HTML
//
// RETURNS
//
// Returns the completed Chart.js chart object.
//
// This allows the calling script to retain a reference to the chart if it
// later needs to update, resize, or destroy it.
//
// SIDE EFFECTS
//
// The function finds the specified canvas element and draws a Chart.js line
// chart inside it.
export function lineChart({years, lines, labels, unit = "%", canvas_id, showPoints = true}) {

    // ===== BUILD THE LINE DATASETS =====
    const line_canvas = document.getElementById(canvas_id);

    let line_values = [];
 
    for (let i = 0; i < lines.length; i++) {
      line_values.push({
        axis: "y",
        label: labels[i],
        data: lines[i],
        fill: false,
        backgroundColor: chart_colours[i],
        borderColor: chart_colours[i],
        borderWidth: 2,
        pointRadius: showPoints ? 4 : 0,
        pointHoverRadius: showPoints ? 6 : 0,
        pointBackgroundColor: chart_colours[i],
        pointBorderColor: chart_colours[i]
      });
    }

    // ===== COMBINE THE AXIS LABELS AND DATASETS =====
    const line_data = {
        labels: years,
        datasets: line_values
    };

    // ===== CONFIGURE THE CHART =====
    const config_line = {
      type: 'line',
      data: line_data,
      options: {
        maintainAspectRatio: false,
        layout: {
          padding: {
            right: 40
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 3,
            }
          },
          x: {
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              autoSkip: true,
              autoSkipPadding: 4
            },
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            onClick: () => {}  
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${unit == "" ? Number(context.raw).toLocaleString() : Number(context.raw).toFixed(2)} ${unit}`;
              }
            }
          }
        }
      }
    };

    // ===== DRAW AND RETURN THE CHART =====
    const ctx_line = line_canvas.getContext('2d');
    return new Chart(ctx_line, config_line);

}
