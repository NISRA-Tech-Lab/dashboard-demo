import { chart_colours } from "../config/colours.js";

export function lineChart({years, lines, labels, unit = "%", canvas_id, showPoints = true}) {

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

    const line_data = {
        labels: years,
        datasets: line_values
    };

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
            instersect: false,
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${Number(context.raw).toFixed(2)} ${unit}`;
              }
            }
          }
        }
      }
    };


    const ctx_line = line_canvas.getContext('2d');
    return new Chart(ctx_line, config_line);




}
