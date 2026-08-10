import { chart_colours } from "../config/colours.js";
import { yAxisLabelPlugin } from "../utils/yAxisLabelPlugin.js";
import { wrapLabel } from "../utils/wrap-label.js";

// ===== BAR CHART =====
//
// Create a reusable Chart.js bar chart from row-based data.
//
// The function can produce:
//
//   • a standard bar chart
//   • a grouped bar chart
//   • a stacked bar chart
//   • a vertical or horizontal chart
//
// DATA STRUCTURE
//
// data should be an array of row objects, like the result returned by
// Papa Parse when a CSV file is loaded.
//
// This is broadly similar to an R data frame:
//
//   JavaScript array of objects   ≈ R data frame
//   one object                    ≈ one row
//   one object property           ≈ one column
//
// PARAMETERS
//
// data
//   The array of rows used to create the chart.
//
//   Example:
//
//     [
//       { Year: 2023, Sex: "Males", Population: 100 },
//       { Year: 2023, Sex: "Females", Population: 120 }
//     ]
//
// value
//   Identifies the numeric values to plot.
//
//   When bars is supplied, value should be a column name:
//
//     value: "Population"
//
//   When bars is null, value should be an array containing the names of
//   the numeric columns that should become separate chart series:
//
//     value: ["Males", "Females"]
//
// bars
//   Optional. The column used to divide the data into separate bar series.
//
//   For example:
//
//     bars: "Sex"
//
//   creates separate datasets for values such as "Males" and "Females".
//
//   The default is null. When bars is null, the column names supplied in
//   value are used as the chart series instead.
//
// categories
//   The column containing the chart categories.
//
//   For example:
//
//     categories: "Year"
//
//   The unique values in this column become the labels on the category axis.
//
// canvas_id
//   The ID of the HTML <canvas> element where the chart will be drawn.
//
//   Example:
//
//     canvas_id: "population-chart"
//
// expanded_canvas_id
//   The ID of the HTML <canvas> element where the expanded chart will be drawn.
//
//   Example:
//
//     expanded_canvas_id: "population-chart-expanded"
// label_format
//   Controls how values are displayed in the chart labels.
//
//     "%"  adds a percentage sign
//     ","  displays numbers with locale-aware thousands separators
//
//   When label_format is "%" and stacked is true, the function also converts
//   the supplied values into percentages within each category before drawing
//   the chart.
//
// stacked
//   Controls whether the datasets are stacked.
//
//     false  draws separate or grouped bars
//     true   draws stacked bars
//
//   The default is false.
//
// align
//   Controls the direction of the bars.
//
//     "vertical"    categories are shown on the x-axis
//     "horizontal"  categories are shown on the y-axis
//
//   The default is "vertical".
//
// y_label
//   Text to display along top of y axis
//
// RETURNS
//
// Returns the completed Chart.js chart object.
//
// This allows the calling script to keep a reference to the chart if it later
// needs to update, resize, or destroy it.
//
// SIDE EFFECTS
//
// The function:
//
//   • finds the specified canvas element in the page
//   • creates a Chart.js chart inside that canvas
//   • converts values to percentages when both stacked and percentage
//     formatting are requested
export function barChart({ data, value, bars = null, categories, canvas_id, expanded_canvas_id = null, label_format, stacked = false, align = "vertical", y_label }) {

  // ===== PREPARE THE CATEGORIES AND SERIES =====
  let bar_categories = data
    .map(col => col[categories]);

  bar_categories = [...new Set(bar_categories)];

  let chart_data_keys = data
    .map(col => col[bars]);
  
  chart_data_keys = [...new Set(chart_data_keys)]

  let chart_data = {};

  if (bars == null) {
    value.forEach(v => {
    chart_data[v] = bar_categories
    .map(cat => data
      .filter(row => row[categories] == cat)
      .map(col => col[v]))
    })
  } else {
    chart_data_keys.forEach(key => {
      chart_data[key] = data
        .filter(row => row[bars] == key)
        .map(col => col[value])
    });
  }

  // ===== CALCULATE STACKED PERCENTAGES =====
  // For each category, calculate the total across all series and convert
  // each value into its percentage share of that total
  if (label_format == "%" && stacked == true) {
    for (let i = 0; i < bar_categories.length; i ++) {
      let bar_sum = 0;
      Object.values(chart_data).forEach(key => {
       bar_sum += key[i]
    });
      Object.keys(chart_data).forEach(key => {
        const old_value = chart_data[key][i];
        chart_data[key][i] = (old_value / bar_sum * 100).toFixed(1)
      })
    }
  }

  const isMobile = window.innerWidth <= 768;
  const totalBars = bar_categories.length * Object.keys(chart_data).length;
  const hideLabels = isMobile && totalBars >= 7;

  // ===== CONFIGURE THE CHART =====
  const baseOptions = {
    indexAxis: align === "horizontal" ? "y" : "x",
    maintainAspectRatio: false,
    layout: { padding: { right: 40 } },
    plugins: {
      legend: {
            onClick: () => {},          
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                let value = ctx.raw;
                if (Array.isArray(value)) {
                  value = value.find(v => v != null);
                }
                return `${ctx.dataset.label}: ${Number(value).toLocaleString()}`;
              }
            }
      },
      datalabels: {
        display: !hideLabels,
        anchor: stacked ? "center": "end",
        align: stacked ? "center": "start",
        color: "#ffffff",
        clamp: true,
        formatter: (value) => {
          return Number(value).toLocaleString();
        }
      },      
        yAxisLabel: {
          text: y_label,
          maxChars: 12,
          font: { size: 14, weight: "500", family: "'Roboto', Arial, sans-serif" },
          offset: 18,
          color: "#6c757d"
        }
    },
    scales: {
      x: { beginAtZero: true,
        stacked: stacked,
        ticks : {
          precision: 0,
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true
        }
       },
      y: {
        grid: { display: false },
        stacked: stacked,
        ticks: {
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return wrapLabel(label, 18);
          }
        },    
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },

  };

  // ===== BUILD THE DATASETS =====
  const bar_canvas = document.getElementById(canvas_id);
  const ctx = bar_canvas.getContext("2d");
  
  let chart_datasets = [];

  for (let i = 0; i < Object.keys(chart_data).length; i++) {
    const key = Object.keys(chart_data)[i];
    chart_datasets[i] = {
      label: key,
      data: chart_data[key],
      backgroundColor: chart_colours[i % chart_colours.length]
    };
  }

  // ===== DRAW AND RETURN THE CHART =====
  const charts = {
        standard: new Chart(ctx, {
          type: "bar",
          data: {
            labels: bar_categories,
            datasets: chart_datasets
          },
          options: baseOptions,
          plugins: [ChartDataLabels, 
            yAxisLabelPlugin]
          
        }),
        expanded: null
    };

  // ===== DRAW THE EXPANDED CHART, IF REQUESTED =====
    if (expanded_canvas_id) {
        const expanded_canvas = document.getElementById(expanded_canvas_id);
        const expanded_ctx = expanded_canvas.getContext("2d");

        charts.expanded = new Chart(expanded_ctx, {
          type: "bar",
          data: {
            labels: bar_categories,
            datasets: chart_datasets
          },
          options: baseOptions,
          plugins: [ChartDataLabels, 
            yAxisLabelPlugin]
          
        });
    }

  return charts;
}