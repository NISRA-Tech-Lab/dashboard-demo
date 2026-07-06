export function createStackedPercentageChart({
      labels,        
      stacked_values,    
      years,
      canvas_id
    }) {

    // Convert values to percentages
    const percentages = years.map((_, i) => {
      const total = stacked_values.reduce((sum, arr) => sum + arr[i], 0);
      return stacked_values.map(arr => (arr[i] / total) * 100);
    });

    // Transpose → datasets per category
    const datasets = labels.map((label, datasetIndex) => ({
      label,
      data: percentages.map(row => Number(row[datasetIndex].toFixed(1))),
      rawData: stacked_values[datasetIndex],
      backgroundColor: chart_colours[datasetIndex]
    }));

    new Chart(document.getElementById(canvas_id), {
      type: "bar",
      data: {
        labels: years,
        datasets
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            max: 100,
            ticks: {
              callback: value => value + "%"
            }
          }
        },
        plugins: {

          tooltip: {
            callbacks: {
              label: function(ctx) {
                const rawValue = ctx.dataset.rawData[ctx.dataIndex];
                const pct = ctx.raw;

                return `${ctx.dataset.label}: ${rawValue.toLocaleString()}`;
              }
            }
          },

          datalabels: {
            color: (ctx) => text_colours[ctx.datasetIndex],
            formatter: (value) => value.toFixed(1) + "%",
            anchor: "centre",
            align: "centre"
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }