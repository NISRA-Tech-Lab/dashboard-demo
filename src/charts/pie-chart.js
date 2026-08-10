import { chart_colours } from "../config/colours.js";

// ===== PIE OR DOUGHNUT CHART =====
//
// Create a reusable Chart.js pie or doughnut chart.
//
// The function calculates the percentage represented by each value and adds
// custom labels directly to the chart.
//
// Larger pie-chart segments are labelled inside the segment. Smaller segments
// are labelled outside the chart using a connecting line.
//
// Doughnut-chart labels are always placed outside the segments.
//
// DATA STRUCTURE
//
// data
//   An object in which each property name is a category label and each
//   property value is the corresponding numeric value.
//
//   Example:
//
//     {
//       "0 to 15": 380000,
//       "16 to 64": 1180000,
//       "65 and over": 330000
//     }
//
//   Object.keys(data) becomes the chart labels, while Object.values(data)
//   becomes the numeric chart values.
//
//   This is similar to a named numeric vector in R:
//
//     c(
//       "0 to 15" = 380000,
//       "16 to 64" = 1180000,
//       "65 and over" = 330000
//     )
//
// canvas_id
//   The ID of the HTML <canvas> element where the chart will be drawn.
//
//   Example:
//
//     canvas_id: "population-pie-chart"
//
// type
//   Controls the type of circular chart.
//
//     "pie"       draws a standard pie chart
//     "doughnut"  draws a doughnut chart with an empty centre
//
//   The default is "pie".
//
// LABEL BEHAVIOUR
//
// The function calculates each category's percentage of the total.
//
// For a pie chart:
//
//   • segments representing at least 6% are labelled inside
//   • segments representing less than 6% are labelled outside
//
// For a doughnut chart:
//
//   • all labels are placed outside
//
// Outside labels are connected to their segment using a short line.
//
// Percentages are rounded to the nearest whole number.
//
// IMPORTANT INPUT REQUIREMENTS
//
//   • data should contain category names paired with numeric values
//   • values should be numbers or values that can be converted to numbers
//   • canvas_id should match an existing <canvas> element in the HTML
//   • type should normally be either "pie" or "doughnut"
//
// RETURNS
//
// This function does not explicitly return a value.
//
// It creates the Chart.js chart directly inside the specified canvas.
//
// SIDE EFFECTS
//
// The function:
//
//   • finds the specified canvas element
//   • calculates percentages from the supplied values
//   • creates a Chart.js pie or doughnut chart
//   • draws custom category and percentage labels on the canvas
export function pieChart({data, canvas_id, expanded_canvas_id = null, type = "pie"}) {

    // ===== PREPARE THE LABELS AND VALUES =====
    const labels = Object.keys(data);
    const values = Object.values(data);

    const total = values.reduce((sum, value) => sum + Number(value), 0);
    const percentThreshold = 0.06; // Place pie-chart labels outside when a segment is less than 6%

    const formatPercent = (value) => {
      return total > 0 ? `${Math.round((Number(value) / total) * 100)}%` : "0%";
    };

    // ===== BUILD THE CHART DATA =====
    const pie_data = {
      labels: labels,
      datasets: [{
        label: 'Value',
        data: values,
        backgroundColor: chart_colours.slice(0, values.length),
        hoverOffset: 4
      }]
    };

    // ===== CONFIGURE THE CHART AND CUSTOM LABELS =====
    const pie_config = {
      type: type,
      data: pie_data,
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      },
      plugins: [{
        id: 'pieLabelConnector',
        afterDatasetsDraw(chart) {
          const ctx = chart.ctx;
          const dataset = chart.data.datasets[0];
          const meta = chart.getDatasetMeta(0);

          ctx.save();
          const fontSize = 14;
          const lineHeight = fontSize + 4;
          ctx.font = `${fontSize}px Arial`;
          ctx.textBaseline = 'middle';

          meta.data.forEach((arc, index) => {
            const value = Number(dataset.data[index]);
            const percent = total > 0 ? value / total : 0;
            const labelLines = [
              `${chart.data.labels[index]}:`,
              formatPercent(value)
            ];
            const angle = (arc.startAngle + arc.endAngle) / 2;
            const radius = (arc.outerRadius + arc.innerRadius) / 2;
            const centerX = arc.x + Math.cos(angle) * radius;
            const centerY = arc.y + Math.sin(angle) * radius;
            const outsideLabel = type === 'doughnut' || percent < percentThreshold;

            if (outsideLabel) {
              const outsideRadius = arc.outerRadius + 18;
              const labelX = arc.x + Math.cos(angle) * outsideRadius;
              const labelY = arc.y + Math.sin(angle) * outsideRadius;
              const lineStartX = arc.x + Math.cos(angle) * (arc.outerRadius + 4);
              const lineStartY = arc.y + Math.sin(angle) * (arc.outerRadius + 4);

              ctx.strokeStyle = '#666';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(lineStartX, lineStartY);
              ctx.lineTo(labelX, labelY);
              ctx.stroke();

              ctx.fillStyle = '#000';
              ctx.textAlign = angle > Math.PI / 2 && angle < (3 * Math.PI) / 2 ? 'right' : 'left';
              const textX = labelX + (ctx.textAlign === 'left' ? 4 : -4);
              const startY = labelY - ((labelLines.length - 1) * lineHeight) / 2;

              labelLines.forEach((line, lineIndex) => {
                ctx.fillText(line, textX, startY + lineIndex * lineHeight);
              });
            } else {
              ctx.fillStyle = '#fff';
              ctx.textAlign = 'center';
              const startY = centerY - ((labelLines.length - 1) * lineHeight) / 2;

              labelLines.forEach((line, lineIndex) => {
                ctx.fillText(line, centerX, startY + lineIndex * lineHeight);
              });
            }
          });

          ctx.restore();
        }
      }]
    };

    // ===== DRAW THE CHART =====
    const pie_canvas = document.getElementById(canvas_id);
    // new Chart(pie_canvas, pie_config);

    const ctx_pie = pie_canvas.getContext('2d');

    const charts = {
        standard: new Chart(ctx_pie, pie_config),
        expanded: null
    };

    // ===== DRAW THE EXPANDED CHART, IF REQUESTED =====
    if (expanded_canvas_id) {
        const expanded_canvas = document.getElementById(expanded_canvas_id);
        const expanded_ctx = expanded_canvas.getContext("2d");

        charts.expanded = new Chart(expanded_ctx, pie_config);
    }

    return charts;
}