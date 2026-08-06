// ===== INSERT A FORMATTED HTML TABLE =====
//
// Populate an existing HTML table using a structured table object.
//
// Unlike the chart helpers, this function does not use the CSV rows directly.
// Instead, it expects the data to have already been rearranged into a
// column-oriented structure where each column stores:
//
//   • an array of values
//   • the formatting that should be applied to those values
//
// This structure is similar to a named list in R where each list element
// represents one column of a data frame together with some metadata.
//
// PARAMETERS
//
// tableId
//   The ID of the HTML table to populate.
//
//   The table is expected to already contain:
//
//     • a <thead>
//     • a <tbody>
//
//   Example:
//
//     tableId: "summary-table"
//
// table_data
//   An object describing each column of the table.
//
//   Each property name becomes a column heading.
//
//   Each property should contain:
//
//     values
//       An array containing one value for every row.
//
//     format
//       A string describing how the values should be displayed.
//
//   Supported formats are:
//
//     "string"
//       Display text exactly as supplied.
//
//     "number"
//       Display numbers using the browser's locale formatting.
//
//     "change"
//       Display numbers with an up/down arrow indicating whether the value is
//       positive or negative.
//
//     "change_percent"
//       Display a percentage value inside a coloured background.
//
//   Example:
//
//     {
//       Area: {
//         values: ["Belfast", "Armagh"],
//         format: "string"
//       },
//       Population: {
//         values: [345418, 174792],
//         format: "number"
//       }
//     }
//
// IMPORTANT INPUT REQUIREMENTS
//
//   • every column should contain the same number of values
//   • each column should define a supported format
//   • the target table should already exist in the page
//
// RETURNS
//
// This function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • clears the existing table contents
//   • creates a new header row
//   • creates a new table body
//   • inserts formatted HTML into some cells
//   • applies CSS classes and alignment to selected cells
export function insertTable(tableId, table_data) {

  // ===== PREPARE THE TABLE =====
  const table = document.getElementById(tableId);
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const columns = Object.keys(table_data);
  const rowCount = table_data[columns[0]].values.length;

  // ===== BUILD THE TABLE HEADER =====
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

  // ===== FORMAT CHANGE VALUES =====
  function formatChange(value) {
    const arrow = value >= 0 ? "🠉" : "🠋";
    const arrowClass = value >= 0 ? "up" : "down";

    const display = value >= 0
      ? value.toLocaleString()
      : "-" + Math.abs(value).toLocaleString();

    return `
      <span class="change-wrapper">
        <span class="arrow ${arrowClass}">${arrow}</span>
        <span class="change-value">${display}</span>
      </span>
    `;
  }

  // ===== FORMAT PERCENTAGE VALUES =====
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

  // ===== BUILD THE TABLE ROWS =====
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