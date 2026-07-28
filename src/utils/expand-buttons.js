// ===== INSERT EXPAND BUTTONS =====
//
// Add fullscreen-style expand buttons to chart and table cards.
//
// The function searches the page for:
//
//   • elements with the class "chart-canvas"
//   • elements with the class "table"
//
// For each matching element, it creates:
//
//   • an expand button in the card footer
//   • a Bootstrap modal containing an enlarged chart canvas or copied table
//
// PARAMETERS
//
// None.
//
// The function finds all eligible charts and tables directly from the page.
//
// EXPECTED HTML STRUCTURE
//
// Charts should use the class:
//
//   chart-canvas
//
// Tables should use the class:
//
//   table
//
// Each chart or table should:
//
//   • have a unique id
//   • be contained within a Bootstrap-style card
//   • have access to a corresponding .card-header
//   • have access to a corresponding .card-footer
//
// The function relies on the current parent-element structure to locate those
// headers and footers.
//
// CHART BEHAVIOUR
//
// For a chart, the modal contains a new empty <canvas> element.
//
// If the original chart has the ID:
//
//   population-chart
//
// the expanded canvas receives the ID:
//
//   population-chart-expanded
//
// This helper creates the expanded canvas, but it does not copy or redraw the
// original Chart.js chart itself. Another part of the application must use the
// expanded canvas ID to render the enlarged chart.
//
// TABLE BEHAVIOUR
//
// For a table, the modal contains a copy of the table's current HTML.
//
// The copied table:
//
//   • keeps the original table classes
//   • receives an ID ending in "-expanded"
//   • contains the original table's inner HTML
//
// MODAL BEHAVIOUR
//
// Each expand button opens a Bootstrap modal.
//
// The modal:
//
//   • uses an extra-large width
//   • is vertically centred
//   • allows scrolling when its content is too large
//   • displays the original card title
//
// RETURNS
//
// This function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • searches the current document for charts and tables
//   • adds buttons to card footers
//   • creates Bootstrap tooltips
//   • creates and inserts Bootstrap modal elements
//   • copies table HTML into expanded table elements
export function insertExpandButtons () {

    // ===== FIND CHARTS AND TABLES =====
    const elements = [
        ...document.getElementsByClassName("chart-canvas"),
        ...document.getElementsByClassName("table")
    ];

    // ===== ADD AN EXPAND CONTROL TO EACH ELEMENT =====
    for (let i = 0; i < elements.length; i ++) {

        const element = elements[i];
        const is_canvas = element.classList.contains("chart-canvas");
        const type = is_canvas ? "chart" : "table";

        // ===== FIND THE CARD FOOTER =====
        const card_footer = element.parentElement.parentElement.parentElement.parentElement?.querySelector(".card-footer")
            || element.parentElement.parentElement.parentElement?.querySelector(".card-footer");

        if (card_footer) {

            // ===== CREATE THE EXPAND BUTTON =====
            const button = document.createElement("button");
            button.className = "btn btn-sm btn-outline-secondary rounded-circle d-none d-xl-flex ms-auto justify-content-between align-items-center";
            button.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
            button.setAttribute("data-bs-toggle", "modal");
            button.setAttribute("data-bs-target", `#${element.id}-modal`);
            button.setAttribute("title", `Expand ${type}`);
            button.setAttribute("data-bs-placement", "left");
            button.style.marginTop = "-50px";
            button.style.marginBottom = "20px";
            button.style.marginLeft = "80px";
            new bootstrap.Tooltip(button);
            card_footer.appendChild(button);

            // ===== PREPARE THE MODAL CONTENT =====
            const title = is_canvas
                ? element.parentElement.parentElement.parentElement.querySelector(".card-header").innerHTML
                : element.parentElement.parentElement.querySelector(".card-header").innerHTML;

            const modal_body = is_canvas
                ? `<canvas id="${element.id}-expanded"></canvas>`
                : `
                    <table id="${element.id}-expanded" class="${element.className}">
                        ${element.innerHTML}
                    </table>
                `;

            // ===== CREATE AND INSERT THE MODAL =====
            const modal = document.createElement("div");
            modal.classList.add("modal", "fade");
            modal.id = `${element.id}-modal`;
            modal.tabIndex = -1;
            modal.setAttribute("aria-hidden", "true");
            modal.innerHTML = `
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <p class="h5 modal-title">${title}</p>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${modal_body}
                    </div>
                </div>
            </div>
            `;
            element.parentNode.appendChild(modal);

        }

    }

}