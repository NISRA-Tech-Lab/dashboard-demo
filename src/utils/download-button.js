import { map } from "./plot-map.js";
import { readData } from "./read-data.js";

// ===== ADD DOWNLOAD OPTIONS TO A CARD =====
//
// Add a download dropdown to a dashboard card.
//
// The dropdown allows users to download:
//
//   • the selected data as a CSV file
//   • the selected data as an Excel file
//   • the displayed chart or map as a PNG image
//
// The function converts the supplied query object into the query structure
// expected by the PxStat API. It also reads the matrix metadata to obtain the
// subject and product names required for the API download URLs.
//
// PARAMETERS
//
// capture_id
//   The ID of the dashboard card that contains the chart or map.
//
//   The function uses this ID to:
//
//     • find the card in the page
//     • find its footer
//     • create a unique ID for the download link
//     • capture the card as an image
//
//   Example:
//
//     capture_id: "population-chart-card"
//
// matrix
//   The matrix code identifying the dataset.
//
//   This is passed to readData(), which returns:
//
//     • matrix_data: the rows loaded from the matrix CSV file
//     • matrix_meta: metadata for the matrix from data.json
//
//   The metadata must include subject and product properties because these
//   values are inserted into the PxStat API download URLs.
//
// update_date
//   A formatted date describing when the data was last updated.
//
//   This value is displayed in the card footer.
//
//   Example:
//
//     update_date: "30 June 2025"
//
// query
//   An object describing which values should be included in the downloaded
//   dataset.
//
//   Each property name is a PxStat dimension code. Its value is either one
//   selected item or an array of selected items.
//
//   Example:
//
//     {
//       Year: [2022, 2023],
//       Sex: "All persons"
//     }
//
//   The function converts this object into the longer array structure expected
//   by the PxStat API.
//
//   This conversion is broadly similar to reshaping or mapping values into a
//   list of query specifications in R.
//
// plot_type
//   Controls how the image export is created.
//
//     "chart"  captures a standard chart card using html2canvas
//     "map"    captures the MapLibre map separately before combining it
//              with the rest of the card
//
//   The default is "chart".
//
// RETURNS
//
// Returns a Promise because the function is asynchronous.
//
// The Promise resolves after the download controls and event listeners have
// been added to the page. The function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • removes any existing download dropdown from the card footer
//   • adds a new download dropdown to the footer
//   • reads the matrix CSV rows and metadata
//   • creates CSV and Excel download URLs
//   • attaches an image-download event listener
//   • triggers browser downloads when the user selects an option
export async function downloadButton (capture_id, matrix, update_date, query, plot_type = "chart") {

    // ===== PREPARE THE CARD FOOTER =====
    const capture = document.getElementById(capture_id);
    const footer = capture.parentElement.querySelector(".card-footer");

    if (footer.getElementsByClassName("dropdown").length > 0) {
        footer.removeChild(footer.querySelector(".dropdown"));
    };

    let footerContent = document.createElement("div");
    footerContent.classList.add("dropdown");

    // ===== BUILD THE PXSTAT QUERY =====
    let query_long = [];
    for (let i = 0; i < Object.keys(query).length; i ++) {
      query_long.push({
        "code": Object.keys(query)[i],
        "selection": {
          "filter": "item",
          "values": Array.isArray(Object.values(query)[i]) ? Object.values(query)[i] : [Object.values(query)[i]]
        }
      })
    }

    const csv_query_string = encodeURIComponent(JSON.stringify({
      "query": query_long,
      "response": {
        "format": "csv",
        "pivot": null,
        "codes": false
      }
    }));

    // ===== READ THE MATRIX METADATA =====
    const [, matrix_meta] = await readData(matrix);

    const xl_query_string = csv_query_string.replace("csv", "xlsx");

    // ===== ADD THE DOWNLOAD MENU =====
    footerContent.innerHTML = `
        <strong>Data last updated:</strong> ${update_date}.
        <div>
            <button class="btn btn-secondary dropdown-toggle btn-primary mt-2" type="button" id="${capture_id}-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
                Download
            </button>
            
            <ul class="dropdown-menu" aria-labelledby="${capture_id}-dropdown">
                <li><a class="dropdown-item" href="https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.PxAPIv1/en/${matrix_meta.subject}/${matrix_meta.product}/${matrix}?query=${csv_query_string}">data (in CSV format)</a></li>
                <li><a class="dropdown-item" href="https://ws-data.nisra.gov.uk/public/api.restful/PxStat.Data.Cube_API.PxAPIv1/en/${matrix_meta.subject}/${matrix_meta.product}/${matrix}?query=${xl_query_string}">data (in Excel format)</a></li>
                <li><a class="dropdown-item" href="#" id="download-${capture_id}">${plot_type} (as image)</a></li>
            </ul>
            </div>
        
    `;

    footer.appendChild(footerContent);

    // ===== CONFIGURE MAP IMAGE DOWNLOADS =====
    if (plot_type == "map") {
        document.getElementById(`download-${capture_id}`).addEventListener("click", async (e) => {
        e.preventDefault();

        const cardEl = document.getElementById(capture_id);
        const mapContainerEl = document.getElementById("map-container");

        const rawText = document.getElementById("map-title").textContent;

        const fileName = rawText
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, "")   // Remove special characters
                    .replace(/\s+/g, "-")           // Replace spaces with hyphens
                    .replace(/-+/g, "-");           // Collapse repeated hyphens

        await exportCardWithMap(cardEl, map, mapContainerEl, `${fileName}.png`);
        });

    // ===== CONFIGURE STANDARD CHART IMAGE DOWNLOADS =====
    } else {
        document
            .getElementById(`download-${capture_id}`)
                .addEventListener("click", function (e) {
                    e.preventDefault();
                    
                    const header = capture.querySelector(".card-header");

                    const rawText = header.innerText || header.textContent;

                    const fileName = rawText
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, "")   // Remove special characters
                    .replace(/\s+/g, "-")           // Replace spaces with hyphens
                    .replace(/-+/g, "-");           // Collapse repeated hyphens

                    html2canvas(capture, {
                        backgroundColor: "#ffffff",
                        scale: 2,
                        useCORS: true
                    }).then(async (canvas) => {

                        const finalCanvas = await addLogoUnderCanvas(
                            canvas,
                            "assets/img/logo/nisra-only-colour.png",
                            {
                            logoHeight: 70,
                            padding: 24
                            }
                        );

                        const link = document.createElement("a");
                        link.download = `${fileName}.png`;
                        link.href = finalCanvas.toDataURL("image/png");
                        link.click();
                    });

                });
    }

    

}

// ===== EXPORT A CARD CONTAINING A MAP =====
//
// Capture a dashboard card containing a MapLibre map and download it as a PNG.
//
// MapLibre maps use a WebGL canvas, which html2canvas may not capture reliably.
// This helper therefore:
//
//   • waits for the map to finish rendering
//   • converts the live map canvas into an image
//   • creates a cloned version of the dashboard card
//   • replaces the cloned map with the captured image
//   • captures the cloned card with html2canvas
//   • adds the NISRA logo beneath the result
//   • downloads the final PNG
//
// PARAMETERS
//
// cardEl
//   The dashboard card element to capture.
//
// map
//   The MapLibre map object.
//
//   The object is expected to provide methods such as:
//
//     getCanvas()
//     resize()
//     loaded()
//     isStyleLoaded()
//     isMoving()
//     areTilesLoaded()
//     once()
//     triggerRepaint()
//
// mapContainerEl
//   The HTML element containing the live map.
//
//   Its dimensions are copied to the cloned map container so that the exported
//   image retains the same layout.
//
// filename
//   The filename used for the downloaded PNG.
//
//   Example:
//
//     "population-by-area.png"
//
// RETURNS
//
// Returns a Promise because the map capture, HTML capture and logo loading are
// asynchronous.
//
// The Promise resolves after the browser download has been triggered. The
// function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • reads pixels from the MapLibre canvas
//   • creates a temporary cloned version of the card
//   • creates several temporary canvases and image elements
//   • triggers a PNG download
//   • writes an error to the console if the map canvas cannot be exported
async function exportCardWithMap(cardEl, map, mapContainerEl, filename) {

  // ===== WAIT FOR THE MAP TO FINISH RENDERING =====
  await waitForMapReady(map);

  // ===== CAPTURE THE MAP CANVAS =====
  const mapCanvas = map.getCanvas();
  let dataUrl;
  try {
    dataUrl = mapCanvas.toDataURL("image/png");
  } catch (err) {
    console.error("Map canvas export failed (likely CORS taint):", err);
    throw err;
  }

  // ===== CAPTURE A CLONED VERSION OF THE CARD =====
  const canvas = await html2canvas(cardEl, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,

    // Keep the cloned page at the same responsive Bootstrap breakpoint
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,

  onclone: (clonedDoc) => {
    const clonedCard = clonedDoc.getElementById(cardEl.id);
    const clonedMapContainer = clonedDoc.getElementById(mapContainerEl.id);

    if (!clonedCard || !clonedMapContainer) return;

    // Remove the footer only from the cloned card used for the export
    const clonedFooter = clonedCard.querySelector(".card-footer");
    if (clonedFooter) clonedFooter.remove();

    // Preserve the dimensions of the live map container
    const w = mapContainerEl.clientWidth;
    const h = mapContainerEl.clientHeight;
    clonedMapContainer.style.width = `${w}px`;
    clonedMapContainer.style.height = `${h}px`;

    // Replace the cloned interactive map with the captured map image
    clonedMapContainer.innerHTML = "";
    const img = clonedDoc.createElement("img");
    img.src = dataUrl;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.display = "block";
    clonedMapContainer.appendChild(img);

    // Preserve the width of the live dashboard card
    clonedCard.style.width = `${cardEl.getBoundingClientRect().width}px`;
  }

  });

  // ===== ADD THE LOGO AND DOWNLOAD THE IMAGE =====
  const link = document.createElement("a");
  link.download = filename;
  const finalCanvas = await addLogoUnderCanvas(
    canvas,
    "assets/img/logo/nisra-only-colour.png",
    {
        logoHeight: 70,
        padding: 24
    }
    );

    link.href = finalCanvas.toDataURL("image/png");
  link.click();
}

// ===== ADD A LOGO BENEATH A CANVAS =====
//
// Create a new canvas containing an existing captured image with a logo placed
// beneath it in the bottom-right corner.
//
// The logo is scaled proportionally so that its original aspect ratio is
// preserved.
//
// PARAMETERS
//
// originalCanvas
//   The canvas containing the captured chart, map or dashboard card.
//
// logoSrc
//   The path or URL of the logo image.
//
//   Example:
//
//     "assets/img/logo/nisra-only-colour.png"
//
// options
//   An optional configuration object.
//
//   Supported properties:
//
//     padding
//       The space around the logo in canvas pixels.
//
//       The default is 24.
//
//     logoHeight
//       The height at which the logo should be drawn.
//
//       The logo width is calculated proportionally from this height.
//
//       The default is 60.
//
// RETURNS
//
// Returns a Promise that resolves to a new HTML canvas element.
//
// The returned canvas contains:
//
//   • a white background
//   • the original captured canvas
//   • the logo beneath the original image
//
// SIDE EFFECTS
//
// The function creates a temporary Image object and a new canvas element.
// It does not modify the original canvas.
async function addLogoUnderCanvas(originalCanvas, logoSrc, options = {}) {

  // ===== READ THE DISPLAY OPTIONS =====
  const {
    padding = 24,
    logoHeight = 60
  } = options;

  // ===== LOAD THE LOGO =====
  const logo = new Image();
  logo.src = logoSrc;
  logo.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    logo.onload = resolve;
    logo.onerror = reject;
  });

  // ===== CALCULATE THE LOGO SIZE =====
  const scale = logoHeight / logo.height;
  const logoWidth = logo.width * scale;

  // ===== CREATE THE NEW CANVAS =====
  const newCanvas = document.createElement("canvas");
  newCanvas.width = originalCanvas.width;
  newCanvas.height =
    originalCanvas.height + padding * 2 + logoHeight;

  const ctx = newCanvas.getContext("2d");

  // ===== DRAW THE BACKGROUND AND ORIGINAL CAPTURE =====
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

  ctx.drawImage(originalCanvas, 0, 0);

  // ===== POSITION AND DRAW THE LOGO =====
  const x =
    newCanvas.width - logoWidth - padding;
  const y =
    originalCanvas.height + padding;

  ctx.drawImage(
    logo,
    x,
    y,
    logoWidth,
    logoHeight
  );

  return newCanvas;
}

// ===== WAIT FOR A MAP TO FINISH RENDERING =====
//
// Ensure that a MapLibre map has finished loading, moving and drawing its
// tiles before it is captured as an image.
//
// The helper first checks whether the map is already ready. This avoids waiting
// for an idle event that may never occur after the map has completed rendering.
//
// When the map is not ready, the function listens for its next idle event and
// requests another render cycle.
//
// PARAMETERS
//
// map
//   The MapLibre map object to inspect.
//
//   The function uses the map's loading, movement and tile status methods to
//   determine whether it is ready to capture.
//
// RETURNS
//
// Returns a Promise.
//
// The Promise resolves immediately when the map is already ready. Otherwise,
// it resolves when the map emits its next idle event.
//
// SIDE EFFECTS
//
// The function:
//
//   • calls map.resize()
//   • may attach a one-time idle event listener
//   • may request another map render using triggerRepaint()
async function waitForMapReady(map) {

  // ===== REFRESH THE MAP SIZE =====
  map.resize();

  // ===== CHECK WHETHER THE MAP IS ALREADY READY =====
  const alreadyReady =
    (map.loaded?.() || map.isStyleLoaded?.()) &&
    !map.isMoving?.() &&
    (map.areTilesLoaded ? map.areTilesLoaded() : true);

  if (alreadyReady) return;

  // ===== WAIT FOR THE NEXT IDLE EVENT =====
  await new Promise((resolve) => {
    const done = () => resolve();

    map.once("idle", done);

    // Request another render so that the idle event can be emitted
    if (map.triggerRepaint) map.triggerRepaint();
  });
}
