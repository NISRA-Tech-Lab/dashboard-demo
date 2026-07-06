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