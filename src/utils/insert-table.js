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