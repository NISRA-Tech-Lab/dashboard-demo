import { chart_colours } from "../config/colours.js";
import { yAxisLabelPlugin } from "../utils/yAxisLabelPlugin.js";

export function barChart({ data, value, bars = null, categories, canvas_id, label_format, stacked = false, align = "vertical" }) {
  const bar_canvas = document.getElementById(canvas_id);

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

  const baseOptions = {
    indexAxis: align === "horizontal" ? "y" : "x",
    maintainAspectRatio: false,
    layout: { padding: { right: 40 } },
    plugins: {
      legend: {
            onClick: () => {},          
          },
      datalabels: {
        anchor: stacked ? "center": "end",
        align: stacked ? "center": "start",
        formatter: (v) => {
          if (label_format === "%") return `${v}%`;
          if (label_format === ",") return Number(v).toLocaleString();
          return v;
        },
        color: "#ffffff",
        clamp: true
      },      
        yAxisLabel: {
          text: "Population",
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

  const bar_chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: bar_categories,
      datasets: chart_datasets
    },
    options: baseOptions,
    plugins: [ChartDataLabels, 
      yAxisLabelPlugin]
    
  });

  return bar_chart;
}
