import { chart_colours, text_colours } from "../config/colours.js";

export function treemapChart({
      data,     
      categories,   
      value,    
      canvas_id,
    }) {

    const category_labels = data
      .map(col => col[categories]);

    console.log(data)

    const tree = category_labels.map(category => ({
      label: category,
      value: data
        .filter(row => row[categories] == category)
        .map(col => col[value])
    }));

    new Chart(document.getElementById(canvas_id), {
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
          legend: { display: false },          
        tooltip: {
          enabled: true,   // 
          callbacks: {
            label: function(ctx) {
              return `${ctx.raw.label}: ${ctx.raw.value.toLocaleString()}`;
            }
          }
        }
        }
      }
    });
  }