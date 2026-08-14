import { chart_colours, text_colours } from "../config/colours.js";

// ===== TREE MAP CHART =====
//
// Create a reusable Chart.js tree map from row-based data.
//
// Each row represents one category and its corresponding numeric value.
// The size of each rectangle is based on the value supplied for that category.
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
//   Example:
//
//     [
//       { "Age group": "0 to 15", "Population": 380000 },
//       { "Age group": "16 to 64", "Population": 1180000 },
//       { "Age group": "65 and over", "Population": 330000 }
//     ]
//
// categories
//   The column containing the category names.
//
//   These values are used to label the tree map rectangles.
//
//   Example:
//
//     categories: "Age group"
//
// value
//   The column containing the numeric values used to size the rectangles.
//
//   Categories with larger values occupy a larger area of the chart.
//
//   Example:
//
//     value: "Population"
//
// canvas_id
//   The ID of the HTML <canvas> element where the chart will be drawn.
//
//   Example:
//
//     canvas_id: "population-tree-map"
//
// IMPORTANT INPUT REQUIREMENTS
//
//   • data should contain the columns named in categories and value
//   • the values in the value column should be numeric
//   • category names should identify the separate tree map groups
//   • canvas_id should match an existing <canvas> element in the HTML
//
// DISPLAY BEHAVIOUR
//
// Each rectangle displays:
//
//   • the category label
//   • the numeric value with thousands separators
//
// Rectangle colours are selected from chart_colours.
//
// Label colours are selected from text_colours so that the text remains
// readable against the corresponding rectangle colour.
//
// The standard Chart.js legend is hidden because each rectangle is labelled
// directly.
//
// RETURNS
//
// This function does not explicitly return a value.
//
// It creates the Chart.js tree map directly inside the specified canvas.
//
// SIDE EFFECTS
//
// The function:
//
//   • writes the supplied data to the browser console
//   • creates a Chart.js tree map inside the specified canvas
//   • adds labels and tooltips containing category names and values
export function treemapChart({
      data,     
      categories,   
      value,    
      canvas_id,
      expanded_canvas_id = null
    }) {

    // ===== PREPARE THE TREE MAP DATA =====
    const category_labels = data
      .map(col => col[categories]);

    const tree = category_labels.map(category => ({
      label: category,
      value: data
        .filter(row => row[categories] == category)
        .map(col => col[value])
    }));

     const createTreeConfig = () => ({
      type: "treemap",
      data: {
        datasets: [{
          tree: tree,
          key: "value",
          groups: ["label"],

          backgroundColor: (ctx) =>
            chart_colours[ctx.dataIndex % chart_colours.length],

          borderWidth: 1,
          borderColor: "#ffffff",

          labels: {
            display: true,
            align: "center",
            position: "center",

            color: (ctx) =>
              text_colours[ctx.dataIndex % text_colours.length],

            formatter: (ctx) => {
              const label = ctx.raw?.g;
              const value = ctx.raw?.v;

              if (!label || value == null) return null;

              return [
                label,
                value.toLocaleString()
              ];
            }
          }
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            callbacks: {
              title: function(ctx) {
                return `${ctx[0].raw.g}`;
              },
              label: function(ctx) {
                return ctx.raw.v.toLocaleString();
              }
            }
          }
        }
      }
    });

    // ===== CONFIGURE AND DRAW THE CHART =====
    const tree_canvas = document.getElementById(canvas_id);
    const ctx = tree_canvas.getContext("2d");

    const charts = {
      standard: new Chart(ctx, createTreeConfig()),
      expanded: null
    };

    // ===== DRAW THE EXPANDED CHART, IF REQUESTED =====
    if (expanded_canvas_id) {
      const expanded_canvas = document.getElementById(expanded_canvas_id);
      const expanded_ctx = expanded_canvas.getContext("2d");

      charts.expanded = new Chart(expanded_ctx, createTreeConfig());
    }

    return charts;
  }