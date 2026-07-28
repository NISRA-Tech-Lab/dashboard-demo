import { chart_colours } from "../config/colours.js";
import { wrapLabel } from "../utils/wrap-label.js";

export function pyramidChart({ data, categories, values, canvas_id, year }) {
  const bar_canvas = document.getElementById(canvas_id);

  let chart_data = {};

  values.forEach(
    value => {
      chart_data[value] = data
        .filter(row => row["Year"] == year)
        .map(col => col[value]);
    }
  )

  const category_labels = data
    .filter(row => row["Year"] == year)
    .map(col => col[categories])
  
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

  const ctx = bar_canvas.getContext("2d");

  const bar_chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: category_labels,
      datasets: chart_datasets
    },
    options: baseOptions
  });

  return bar_chart;
}