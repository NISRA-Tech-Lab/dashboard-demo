import { chart_colours, text_colours } from "../config/colours.js";

export function treemapChart({
      raw_data,     
      stat,         
      year,         
      categories,   
      group_key,    
      canvas_id,
    }) {

    // Build chart data dynamically
    const data_for_year = raw_data[stat][year];

    const tree = categories.map(category => ({
      label: category,
      value: data_for_year[category][group_key]
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