    
import { wrapLabel } from "./wrap-label.js";
import { getNested } from "./get-nested.js";
import { yAxisLabelPlugin } from "./yAxisLabelPlugin.js";

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

export function createLineChart({years, lines, labels, unit = "%", canvas_id, showPoints = true}) {

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

export function createBarChart({ chart_data, categories, canvas_id, label_format }) {
  const bar_canvas = document.getElementById(canvas_id);

  const baseOptions = {
    indexAxis: "x",
    maintainAspectRatio: false,
    layout: { padding: { right: 40 } },
    plugins: {
      legend: {
            onClick: () => {},          
            title: {
              display: true,
              text: "Gender",
              font: { size: 14, weight: "500", family: "'Roboto', Arial, sans-serif"}
            } 
          },
      datalabels: {
        anchor: "end",
        align: "start",
        // offset: -20, 
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
        },    
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },

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
    plugins: [ChartDataLabels, 
      yAxisLabelPlugin]
    
  });

  return bar_chart;
}

export function createHorizontalBarChart({ chart_data, categories, canvas_id, label_format, stacked = false }) {
  const bar_canvas = document.getElementById(canvas_id);

  const baseOptions = {
    indexAxis: "y",
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
      labels: categories,
      datasets: chart_datasets
    },
    options: baseOptions,
    plugins: [ChartDataLabels, 
      yAxisLabelPlugin]
    
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

export function createPieChart({labels, values, canvas_id, type = "pie"}) {
    const total = values.reduce((sum, value) => sum + Number(value), 0);
    const percentThreshold = 0.06; // 6%

    const formatPercent = (value) => {
      return total > 0 ? `${Math.round((Number(value) / total) * 100)}%` : "0%";
    };

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
        afterDraw(chart) {
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

    const pie_canvas = document.getElementById(canvas_id);
    new Chart(pie_canvas, pie_config);
}


export function insertTable(tableId, table_data) {
  const table = document.getElementById(tableId);
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const columns = Object.keys(table_data);
  const rowCount = table_data[columns[0]].values.length;

  const headerRow = document.createElement("tr");
  
  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;

    const format = table_data[col].format;

    if (format === "number" || format === "change" || format === "change_percent") {
      th.style.textAlign = "right";
    } else {
      th.style.textAlign = "left";
    }

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);

  function formatChange(value) {
    const arrow = value >= 0 ? "🠉" : "🠋";
    const arrowClass = value >= 0 ? "up" : "down";

    const display = value >= 0
      ? value.toLocaleString()
      : "-" + Math.abs(value).toLocaleString();

    return `
      <span class="arrow ${arrowClass}">${arrow}</span>
      ${display}
    `;
  }

  function formatPercent(value) {
    let bgColor = "white";

    if (value > 0) {
      const max = 0.9;
      const intensity = Math.min(value / max, 1);

      const r = Math.round(255 + (124 - 255) * intensity);
      const g = Math.round(255 + (166 - 255) * intensity);
      const b = Math.round(255 + (218 - 255) * intensity);

      bgColor = `rgb(${r}, ${g}, ${b})`;
    }

    return `
      <span class="percent-wrapper" style="background-color:${bgColor}">
        ${value.toFixed(1)}
      </span>
    `;
  }

  // Rows
  for (let i = 0; i < rowCount; i++) {
    const tr = document.createElement("tr");

    columns.forEach(col => {
      const { values, format } = table_data[col];
      const val = values[i];

      const td = document.createElement("td");

      if (format === "string") {
        td.textContent = val;
      }

      else if (format === "number") {
        td.textContent = val.toLocaleString();
        td.classList.add("number");
      }

      else if (format === "change") {
        td.innerHTML = formatChange(val);
        td.classList.add("change-cell");
      }

      else if (format === "change_percent") {
        td.innerHTML = formatPercent(val);
        td.style.textAlign = "right";
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  }
}

