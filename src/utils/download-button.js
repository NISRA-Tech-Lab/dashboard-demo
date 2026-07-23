import { config } from "../config/config.js";
import { map } from "./plot-map.js";
import { readData } from "./read-data.js";

export async function downloadButton (capture_id, matrix, update_date, query, plot_type = "chart") {

    const capture = document.getElementById(capture_id);
    const footer = capture.parentElement.querySelector(".card-footer");

    if (footer.getElementsByClassName("dropdown").length > 0) {
        footer.removeChild(footer.querySelector(".dropdown"));
    };

    let footerContent = document.createElement("div");
    footerContent.classList.add("dropdown");

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

    const [matrix_data, matrix_meta] = await readData(matrix);

    const xl_query_string = csv_query_string.replace("csv", "xlsx");

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


    if (plot_type == "map") {
        document.getElementById(`download-${capture_id}`).addEventListener("click", async (e) => {
        e.preventDefault();

        const cardEl = document.getElementById(capture_id);
        const mapContainerEl = document.getElementById("map-container");

        const rawText = document.getElementById("map-title").textContent;

        const fileName = rawText
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, "")   // remove special characters
                    .replace(/\s+/g, "-")           // spaces → hyphens
                    .replace(/-+/g, "-");           // collapse multiple hyphens

        await exportCardWithMap(cardEl, map, mapContainerEl, `${fileName}.png`);
        });
    } else {
        document
            .getElementById(`download-${capture_id}`)
                .addEventListener("click", function (e) {
                    e.preventDefault();
                    
                    const header = capture.querySelector(".card-header");

                    // Generate filename from header text
                    const rawText = header.innerText || header.textContent;

                    const fileName = rawText
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, "")   // remove special characters
                    .replace(/\s+/g, "-")           // spaces → hyphens
                    .replace(/-+/g, "-");           // collapse multiple hyphens

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

async function exportCardWithMap(cardEl, map, mapContainerEl, filename) {
  // Wait until map is fully rendered
  await waitForMapReady(map);

  // Snapshot the WebGL canvas
  const mapCanvas = map.getCanvas();
  let dataUrl;
  try {
    dataUrl = mapCanvas.toDataURL("image/png");
  } catch (err) {
    console.error("Map canvas export failed (likely CORS taint):", err);
    throw err;
  }

  // Capture WITHOUT touching the live DOM
  const canvas = await html2canvas(cardEl, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,

    // Force html2canvas "virtual viewport" to match your real one,
    // so Bootstrap keeps the same breakpoint (xl, etc.)
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,

  onclone: (clonedDoc) => {
    // Find the equivalents in the cloned DOM
    const clonedCard = clonedDoc.getElementById(cardEl.id);
    const clonedMapContainer = clonedDoc.getElementById(mapContainerEl.id);

    if (!clonedCard || !clonedMapContainer) return;

    // ✅ Remove/hide footer in the CLONE so it doesn't appear in the export
    const clonedFooter = clonedCard.querySelector(".card-footer");
    if (clonedFooter) clonedFooter.remove(); // or: clonedFooter.style.display = "none";

    // Make sure the cloned map container keeps its size
    const w = mapContainerEl.clientWidth;
    const h = mapContainerEl.clientHeight;
    clonedMapContainer.style.width = `${w}px`;
    clonedMapContainer.style.height = `${h}px`;

    // Replace the cloned map container contents with the snapshot image
    clonedMapContainer.innerHTML = "";
    const img = clonedDoc.createElement("img");
    img.src = dataUrl;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.display = "block";
    clonedMapContainer.appendChild(img);

    // Lock cloned card width
    clonedCard.style.width = `${cardEl.getBoundingClientRect().width}px`;
  }

  });

  // Download
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

async function addLogoUnderCanvas(originalCanvas, logoSrc, options = {}) {
  const {
    padding = 24,
    logoHeight = 60
  } = options;

  const logo = new Image();
  logo.src = logoSrc;
  logo.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    logo.onload = resolve;
    logo.onerror = reject;
  });

  // Scale logo proportionally
  const scale = logoHeight / logo.height;
  const logoWidth = logo.width * scale;

  const newCanvas = document.createElement("canvas");
  newCanvas.width = originalCanvas.width;
  newCanvas.height =
    originalCanvas.height + padding * 2 + logoHeight;

  const ctx = newCanvas.getContext("2d");

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

  // Draw original capture
  ctx.drawImage(originalCanvas, 0, 0);

  // Bottom-right position
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

async function waitForMapReady(map) {
  // Make sure MapLibre has the correct size (important if container/layout changed)
  map.resize();

  // If it's already loaded and not moving, don't wait for an event that may never fire
  const alreadyReady =
    (map.loaded?.() || map.isStyleLoaded?.()) &&
    !map.isMoving?.() &&
    (map.areTilesLoaded ? map.areTilesLoaded() : true);

  if (alreadyReady) return;

  // Otherwise wait for idle, but also force a render cycle
  await new Promise((resolve) => {
    const done = () => resolve();

    map.once("idle", done);

    // Nudge a render so 'idle' can happen without needing a manual resize
    if (map.triggerRepaint) map.triggerRepaint();
  });
}



