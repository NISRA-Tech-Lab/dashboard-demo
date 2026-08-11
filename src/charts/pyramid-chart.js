import { chart_colours } from "../config/colours.js";

// ===== POPULATION PYRAMID =====
//
// Create a horizontal population pyramid using Chart.js.
//
// The function filters the supplied row-based data to one year, extracts the
// requested population series, and plots the first series on the left-hand
// side and the second series on the right-hand side.
//
// DATA STRUCTURE
//
// data
//   An array of row objects, usually created from a CSV file by Papa Parse.
//
//   This is broadly similar to an R data frame:
//
//     JavaScript array of objects   ≈ R data frame
//     one object                    ≈ one row
//     one object property           ≈ one column
//
//   The data must include:
//
//     • a "Year" column
//     • the category column named in categories
//     • each numeric column named in values
//
//   Example:
//
//     [
//       { Year: 2023, Age: 0, Females: 12000, Males: 12500 },
//       { Year: 2023, Age: 1, Females: 11800, Males: 12300 }
//     ]
//
// categories
//   The column containing the labels shown on the vertical axis.
//
//   For a population pyramid, this is usually a single-year-of-age column.
//
//   Example:
//
//     categories: "Single year of age"
//
// values
//   An array containing the names of the two numeric population columns.
//
//   Example:
//
//     values: ["Females", "Males"]
//
//   The first series is multiplied by -1 so that it appears on the left-hand
//   side of the pyramid. The second series remains positive and appears on the
//   right-hand side.
//
// canvas_id
//   The ID of the HTML <canvas> element where the chart will be drawn.
//
//   Example:
//
//     canvas_id: "population-pyramid"
//
// year
//   The year to display.
//
//   The function uses this parameter in two ways:
//
//     • it filters the data to rows where Year matches the supplied year
//     • it adds the year to each legend label
//
// IMPORTANT INPUT REQUIREMENTS
//
//   • data should contain rows for the requested year
//   • values should normally contain exactly two numeric column names
//   • the order of values determines which series appears on the left
//     and which appears on the right
//   • canvas_id should match an existing <canvas> element in the HTML
//
// DISPLAY BEHAVIOUR
//
// The first population series is stored as negative values so Chart.js draws
// it to the left of zero. Axis labels and tooltips use Math.abs() so users see
// positive population figures on both sides.
//
// The horizontal axis displays values in thousands, while tooltips display
// the full population value with thousands separators.
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
//   • filters the supplied rows to the requested year
//   • creates a Chart.js bar chart inside the specified canvas
//   • reverses the vertical axis so the age categories appear in pyramid order
export function pyramidChart({ data, meta, categories, values, canvas_id, expanded_canvas_id = null, year }) {

  // ===== PREPARE THE SELECTED YEAR'S DATA =====
  let chart_data = {};

  const year_column = meta.variables
    .filter(x => x["code"].includes("TLIST"))
    .map(x => x["name"])[0];

  values.forEach(
    value => {
      chart_data[value] = data
        .filter(row => row[year_column] == year)
        .map(col => col[value]);
    }
  )

  const category_labels = data
    .filter(row => row[year_column] == year)
    .map(col => col[categories])
  
  // ===== BUILD THE LEFT- AND RIGHT-HAND SERIES =====
  const keys = Object.keys(chart_data);

  const chart_datasets = keys.map((key, i) => ({
    label: `${key} ${year}`,
    data: i === 0
      ? chart_data[key].map(value => value * -1)
      : chart_data[key],
    backgroundColor: chart_colours[i % chart_colours.length],
    barPercentage: 1,
    categoryPercentage: 1
  }));

  // ===== CONFIGURE THE CHART =====
  const baseOptions = {
    indexAxis: "y",
    maintainAspectRatio: false,
    layout: { padding: { right: 40 } },
    plugins: {
  legend: {
    reverse: false,
    onClick: () => {},
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.dataset.label || "";
          const value = Math.abs(context.raw);

          return `${label}: ${value.toLocaleString()}`;
        }
      }
    }
  },
    scales: {
      x: {
        beginAtZero: true,
        stacked: true,
        title: {
          display: true,
          text: "Persons (thousands)"
        },
        ticks: {
          precision: 0,
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          callback: function(value) {
            return Math.abs(value) / 1000;
          }
        }
      },
      y: {
        reverse: true,
        grid: { display: false },
        stacked: true,
        ticks: {
          precision: 0,
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return label;
          }
        }
      }
    }
  };

  // ===== DRAW AND RETURN THE CHART =====
  const bar_canvas = document.getElementById(canvas_id);
  const ctx = bar_canvas.getContext("2d");

  const charts = {
        standard: new Chart(ctx, {
          type: "bar",
          data: {
            labels: category_labels,
            datasets: chart_datasets
          },
          options: baseOptions
          
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
            labels: category_labels,
            datasets: chart_datasets
          },
          options: baseOptions
          
        });
    }

  return charts;
}