// ===== POPULATE INFORMATION BOXES =====
//
// Create a tabbed information section using Bootstrap's Collapse component.
//
// The function builds a row of labelled buttons and a shared content panel.
// Clicking a button displays the corresponding title and content.
//
// Only one information panel is shown at a time.
//
// PARAMETERS
//
// labels
//   An array of strings used as the button labels and information headings.
//
//   Example:
//
//     [
//       "What does the chart show?",
//       "How were the figures calculated?",
//       "What should I know about the data?"
//     ]
//
// content
//   An array containing the HTML content associated with each label.
//
//   The order must match the order of labels.
//
//   Example:
//
//     [
//       "<p>The chart shows population change over time.</p>",
//       "<p>The figures were calculated from annual estimates.</p>",
//       "<p>Figures may not sum because of rounding.</p>"
//     ]
//
//   Here:
//
//     labels[0] matches content[0]
//     labels[1] matches content[1]
//     labels[2] matches content[2]
//
//   The content is inserted using innerHTML, so each item may contain HTML
//   elements such as paragraphs, lists, links and emphasis.
//
// EXPECTED HTML
//
// The page should contain an element with the ID:
//
//   info-boxes
//
// The generated interface also depends on Bootstrap's JavaScript Collapse
// component being available through the global bootstrap object.
//
// IMPORTANT INPUT REQUIREMENTS
//
//   • labels and content should contain the same number of items
//   • each label should be suitable for display as a button and heading
//   • content may contain HTML and should therefore come from a trusted source
//   • the page should contain exactly one element with the ID "info-boxes"
//
// INTERACTION BEHAVIOUR
//
// When the information panel is closed:
//
//   • clicking a button inserts its content
//   • the selected button becomes active
//   • Bootstrap opens the panel with an animation
//
// When the information panel is open:
//
//   • clicking the active button closes the panel with an animation
//   • clicking a different button immediately replaces the displayed content
//     without closing and reopening the panel
//
// The first and last buttons receive additional inline styling so that the
// complete row has rounded outer corners.
//
// RETURNS
//
// This function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • replaces the contents of the #info-boxes element
//   • creates information buttons and a shared content panel
//   • creates or retrieves a Bootstrap Collapse controller
//   • attaches click event listeners to each button
//   • updates button classes and accessibility attributes
//   • inserts the selected content into the page using innerHTML
export function populateInfoBoxes(labels, content) {

  // ===== BUILD THE INFORMATION BUTTONS =====
  const info_boxes = document.getElementById("info-boxes");

  let buttons = "";
  for (let i = 0; i < labels.length; i++) {
    let button_style = "";
    if (i === labels.length - 1) {
      button_style += "border-right: 2px solid #00205B; border-top-right-radius: 0.5rem; border-bottom-right-radius: 0.5rem;";
    }
    if (i === 0) {
      button_style += "border-top-left-radius: 0.5rem; border-bottom-left-radius: 0.5rem;";
    }

    buttons += `
      <div class="col p-0">
        <h2 class="accordion-header h-100" role="heading">
          <button
            class="accordion-button collapsed h-100 info-tab-btn"
            type="button"
            style="${button_style}"
            data-index="${i}"
            aria-expanded="false"
            aria-controls="infoCollapse"
          >
            ${labels[i]}
          </button>
        </h2>
      </div>
    `;
  }

  // ===== INSERT THE INFORMATION PANEL =====
  info_boxes.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-12 col-xl-8 accordion py-4" id="infoAccordion">
        <div class="row g-3">
          ${buttons}
        </div>

        <div class="info-card-wrap">
          <div id="info-card" class="card my-3">

            <div id="infoCollapse" class="accordion-collapse collapse" data-active-index="">
              <div class="accordion-body">
                <h2 id="infoTitle" style="color:#00205B;"></h2>
                <div id="infoBody"></div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;

  // ===== PREPARE THE INTERACTIVE ELEMENTS =====
  const collapseEl = document.getElementById("infoCollapse");
  const titleEl = document.getElementById("infoTitle");
  const bodyEl = document.getElementById("infoBody");
  const btns = info_boxes.querySelectorAll(".info-tab-btn");

  const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });

  // ===== UPDATE THE ACTIVE BUTTON =====
  function setActiveButton(activeIdx) {
    btns.forEach((b, idx) => {
      const isActive = idx === activeIdx;
      b.classList.toggle("collapsed", !isActive);
      b.setAttribute("aria-expanded", String(isActive));
    });
  }

  // ===== UPDATE THE DISPLAYED CONTENT =====
  function setContent(idx) {
    titleEl.textContent = labels[idx];
    bodyEl.innerHTML = content[idx];
    collapseEl.dataset.activeIndex = String(idx);
  }

  // ===== HANDLE BUTTON CLICKS =====
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      const isOpen = collapseEl.classList.contains("show");
      const activeIdx = collapseEl.dataset.activeIndex === "" ? null : Number(collapseEl.dataset.activeIndex);

      // Open the panel and display the selected content
      if (!isOpen) {
        setContent(idx);
        setActiveButton(idx);
        bsCollapse.show();
        return;
      }

      // Close the panel when the active button is selected again
      if (activeIdx === idx) {
        setActiveButton(-1);
        bsCollapse.hide();
        collapseEl.dataset.activeIndex = "";
        return;
      }

      // Replace the content when a different button is selected
      setContent(idx);
      setActiveButton(idx);
    });
  });

  // ===== RESET THE BUTTONS AFTER THE PANEL CLOSES =====
  collapseEl.addEventListener("hidden.bs.collapse", () => {
    btns.forEach((b) => {
      b.classList.add("collapsed");
      b.setAttribute("aria-expanded", "false");
    });
  });
}