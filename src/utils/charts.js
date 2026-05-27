    
import { wrapLabel } from "./wrap-label.js";
import { getNested } from "./get-nested.js";

export const chart_colours = [
  "#3878c5",
  "#00205B",
  "#68A41E",
  "#732777",
  "#ce70d2",
  "#434700",
  "#a88f8f",
  "#3b3b3b",
  "#e64791",
  "#400b23"
];

export const text_colours = [
  "#000000",  // #3878c5
  "#FFFFFF", // #00205B
  "#000000", // #68A41E
  "#FFFFFF", // #732777
  "#000000", // #ce70d2
  "#FFFFFF", // #434700
  "#000000", // #a88f8f
  "#FFFFFF", // #3b3b3b
  "#000000", // #e64791
  "#FFFFFF" // #400b23
];

export function createLineChart({years, lines, labels, unit = "%", canvas_id}) {

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
        borderWidth: 2
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

export function createBarChart({ chart_data, categories, canvas_id, label_format }) {
  const bar_canvas = document.getElementById(canvas_id);

  const baseOptions = {
    indexAxis: "y",
    maintainAspectRatio: false,
    layout: { padding: { right: 40 } },
    plugins: {
      legend: {
            onClick: () => {}  
          },
      datalabels: {
        anchor: "end",
        align: "right",
        formatter: (v) => {
          if (label_format === "%") return `${v}%`;
          if (label_format === ",") return Number(v).toLocaleString();
          return v;
        },
        color: "#000",
        clamp: true
      }
    },
    scales: {
      x: { beginAtZero: true,
        ticks : {
          precision: 0,
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true
        }
       },
      y: {
        grid: { display: false },
        ticks: {
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return wrapLabel(label, 18);
          }
        }
      }
    }
  };

  // initial chart
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
      labels: categories,
      datasets: chart_datasets
    },
    options: baseOptions,
    plugins: [ChartDataLabels]
  });

  return bar_chart;
}

export function splitLabel(label, maxChars) {
    const lines = [];
    let start = 0;
    while (start < label.length) {
      let end = start + maxChars;
      if (end < label.length && label[end] !== " ") {
        const spaceIndex = label.lastIndexOf(" ", end);
        if (spaceIndex > start) end = spaceIndex;
      }
      lines.push(label.substring(start, end).trim());
      start = end;
      if (label[start] === " ") start++;
    }
    return lines.filter(Boolean);
  }

  export function formatValue(v) {
    return Number(v).toLocaleString("en", { maximumFractionDigits: 2 });
  }

  export function get_tree_data(level, sectorName = null, sectorTotals, sectorIndex, treemap_data) {

  const tree =
    level === "sector"
      ? sectorTotals // [{ sector, value }]
      : treemap_data
          .filter(d => d.sector === sectorName)
          .map(d => ({
            subsector: d.subsector,                   // keep original if you need it for drilldown
            subsector_tidy: d.subsector_tidy ?? d.subsector, // label to display
            value: Number(d.value),
            value_abs: Math.abs(Number(d.value))
          }));

  const groupField = level === "sector" ? "sector" : "subsector_tidy";

  const lightenColor = (hex, amount = 0.4) => {
    const clean = hex.replace("#", "");
    const num = parseInt(clean, 16);

    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);

    return `rgb(${r}, ${g}, ${b})`;
  };

  return {
    datasets: [{
      type: "treemap",
      tree,
      key: "value_abs",
      groups: [groupField],

      label: "",
      label2: level,

      spacing: 1,
      borderWidth: 1,
      hoverBorderWidth: 3,
      hoverBorderColor: "#000",
      borderColor: level === "sector" ? "#ffffff" : "#000",

      backgroundColor: (ctx) => {
  let baseColor;
  let signedValue = 0;

  if (level === "sector") {
    const sector = ctx.raw?.g;
    const i = sectorIndex.get(sector) ?? 0;
    baseColor = chart_colours[i % chart_colours.length];

    // sector level value
    signedValue = ctx.raw?._data?.value ?? 0;

  } else {
    const i = sectorIndex.get(sectorName) ?? 0;
    baseColor = chart_colours[i % chart_colours.length];

    // subsector level value (your working access pattern)
    signedValue = ctx.raw?._data?.children?.[0]?.value ?? 0;
  }

  return signedValue < 0
    ? lightenColor(baseColor, 0.5)
    : baseColor;
},

      labels: {
        display: true,
        align: "center",
        position: "center",

        color: (ctx_tree) => {
          if (level === "sector") {
            const sector = ctx_tree.raw?.g;
            const i = sectorIndex.get(sector) ?? 0;
            return text_colours[i % text_colours.length];
          }
          const i = sectorIndex.get(sectorName) ?? 0;
          return text_colours[i % text_colours.length];
        },

        formatter: (ctx_tree) => {
          const label = ctx_tree.raw?.g ?? ""; // now this will be subsector_tidy
          const chars_per_line = Math.max(1, Math.round(ctx_tree.raw.w / 10));
          const lines = splitLabel(label, chars_per_line);
          lines.push(formatValue(ctx_tree.raw["_data"].children[0].value));
          return lines;
        }
      }
    }]
  };
}

function createPieChart({labels, values, canvas_id}) {
    const pie_data = {
    labels: labels,
    datasets: [{
        label: 'Population',
        data: values,
        backgroundColor: chart_colours.slice(0, values.length),
        hoverOffset: 4
    }]
    };

    const pie_config = {
    type: 'doughnut',
    data: pie_data,
    };

    const pie_canvas = document.getElementById(canvas_id);
    new Chart(pie_canvas, pie_config);
}
