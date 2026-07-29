import { loadShapes } from "./load-shapes.js";

export let map;
let geojsonData;

const palette = ["#d6e4f6", "#8db2e0", "#3878c5", "#22589c", "#00205b"];

// ===== PLOT A CHOROPLETH MAP =====
//
// Draw an interactive MapLibre choropleth map.
//
// A choropleth map colours geographic areas according to a numeric value.
// Larger values receive darker colours, while smaller values receive lighter
// colours.
//
// DATA STRUCTURE
//
// data
//   An array of row objects, usually created by Papa Parse from a CSV file.
//
//   This is broadly comparable to an R data frame:
//
//     • the array is similar to the complete data frame
//     • each object is similar to one row
//     • each object property is similar to one column
//
//   Example:
//
//     [
//       {
//         "Area": "Belfast",
//         "Population": 345418
//       },
//       {
//         "Area": "Mid and East Antrim",
//         "Population": 139274
//       }
//     ]
//
// The function matches each data row to a geographic feature using the area
// name.
//
// PARAMETERS
//
// The function receives one configuration object containing:
//
// elementId
//   The ID of the HTML element in which the MapLibre map should be created.
//
//   Example:
//
//     elementId: "map-container"
//
// area
//   The name of the CSV column containing the geographic area names.
//
//   The values in this column are matched against the LGDNAME property in the
//   geographic boundary file.
//
//   Example:
//
//     area: "Area"
//
// data
//   The CSV rows used to colour the map.
//
// value
//   The name of the numeric CSV column used to calculate the map colours.
//
//   Example:
//
//     value: "Population"
//
// MAP SHAPES
//
// The geographic boundaries are loaded by loadShapes().
//
// The loaded GeoJSON is stored in geojsonData so that the shape file only
// needs to be downloaded once during the page session.
//
// Each GeoJSON feature is given additional properties:
//
//   nisra_label
//     The area name displayed in the popup.
//
//   nisra_value
//     The value matched from the CSV rows.
//
//   nisra_fill
//     The colour assigned to the area.
//
//   nisra_hasValue
//     Whether the area has a usable value.
//
// COLOUR SCALE
//
// The minimum and maximum values in the selected CSV column are used to
// calculate the overall range.
//
// Each value is normalised to a position between the minimum and maximum,
// then passed to getColour().
//
// Missing values are displayed using:
//
//   #eeeeee
//
// MAP BEHAVIOUR
//
// The function:
//
//   • removes an existing map before drawing a new one
//   • creates a new MapLibre map
//   • adds zoom controls
//   • adds the geographic boundaries as a GeoJSON source
//   • adds a filled polygon layer
//   • adds a boundary outline layer
//   • highlights an area when the pointer moves over it
//   • displays the area's name and value in a popup
//
// RETURNS
//
// Returns a Promise because the shape file may need to be loaded
// asynchronously.
//
// The function does not explicitly return a value.
//
// The created MapLibre object is assigned to the exported map variable.
//
// SIDE EFFECTS
//
// The function:
//
//   • may download the geographic boundary file
//   • adds NISRA-specific properties to copied GeoJSON features
//   • removes any existing map instance
//   • creates a new MapLibre map
//   • adds map sources, layers, controls and event listeners
//   • updates the exported map variable
export async function plotMap({elementId, area, data, value}) {

  // ===== PREPARE THE VALUE RANGE =====
  const values = data
    .map(col => col[value]);

  const range_min = Math.floor(Math.min(...values));
  const range_max = Math.ceil(Math.max(...values));
  const range = range_max - range_min || 1;

  createLegend(range_min, range_max);

  // ===== LOAD AND PREPARE THE MAP SHAPES =====
  if (!geojsonData) geojsonData = await loadShapes();

  const features = geojsonData.features.map((feature, idx) => {
    const areaName = String(feature.properties.LGDNAME);
    const rawValue = data
      .filter(row => row[area] == areaName)
      .map(col => col[value])[0];

    return {
      ...feature,
      id: idx,
      properties: {
        ...feature.properties,
        nisra_label: areaName,
        nisra_value: rawValue,
        nisra_fill: rawValue == null
          ? "#eeeeee"
          : getColour((rawValue - range_min) / range),
        nisra_hasValue: rawValue !== null && rawValue !== undefined
      }
    };
  });

  const styledGeojson = {
    ...geojsonData,
    features
  };

  // ===== REMOVE ANY EXISTING MAP =====
  if (map) {
    map.remove();
    map = null;
  }

  // ===== CREATE THE MAP =====
  map = new maplibregl.Map({
    container: elementId,
    style: "public/map/style-omt.json",
    center: [-6.7, 54.7],
    zoom: window.innerWidth < 1200 ? 6 : 7.5,
    attributionControl: false,
    preserveDrawingBuffer: true,
    canvasContextAttributes: {
      preserveDrawingBuffer: true
    }
  });

  // ===== ADD THE MAP CONTROLS =====
  map.addControl(
    new maplibregl.NavigationControl({
      showZoom: true,
      showCompass: false,
      visualizePitch: false
    }),
    "top-right"
  );

  // ===== ADD THE MAP SOURCE AND LAYERS =====
  map.on("load", () => {
    map.setMinZoom(map.getZoom() - 1);
    map.setMaxZoom(map.getZoom() + 4);
    map.setRenderWorldCopies(false);

    map.addSource("shapes", {
      type: "geojson",
      data: styledGeojson,
      generateId: true
    });

    map.addLayer({
      id: "shapes-fill",
      type: "fill",
      source: "shapes",
      paint: {
        "fill-color": [
          "case",
          ["boolean", ["get", "nisra_hasValue"], false],
          ["get", "nisra_fill"],
          "#eeeeee"
        ],
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.8,
          0.7
        ]
      }
    });

    map.addLayer({
      id: "shapes-outline",
      type: "line",
      source: "shapes",
      paint: {
        "line-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#222222",
          "#555555"
        ],
        "line-width": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          2,
          1
        ],
        "line-opacity": 0.9
      }
    });

    // ===== ADD THE HOVER INTERACTION =====
    addHoverPopup(map);
  });
}

// ===== SELECT A MAP COLOUR =====
//
// Convert a normalised numeric value into one of the colours in the map
// palette.
//
// PARAMETER
//
// norm
//   A numeric value normally ranging from 0 to 1.
//
//   A value near 0 receives a lighter colour.
//
//   A value near 1 receives a darker colour.
//
//   Example:
//
//     getColour(0)
//     getColour(0.5)
//     getColour(1)
//
// VALUES OUTSIDE THE EXPECTED RANGE
//
// Negative or missing values return a light grey colour.
//
// Values greater than 1 are limited to the darkest colour.
//
// The calculated colour position is also restricted to an array index between
// 0 and 4.
//
// RETURNS
//
// Returns a CSS colour string.
//
// Examples:
//
//   "#d6e4f6"
//   "#3878c5"
//   "#00205b"
//
// SIDE EFFECTS
//
// None.
function getColour(norm) {

  // ===== MATCH THE VALUE TO THE COLOUR PALETTE =====
  if (norm == null || norm < 0) return "#d3d3d3";

  const idx = Math.max(0, Math.min(4, Math.round(norm * 4)));
  return palette[idx];
}

// ===== ADD A HOVER POPUP TO THE MAP =====
//
// Add pointer interaction to the map's filled geographic areas.
//
// When the pointer moves over an area, the function:
//
//   • changes the cursor to a pointer
//   • highlights the current feature
//   • removes highlighting from the previous feature
//   • displays the area's label and value in a popup
//
// When the pointer leaves the layer, the function:
//
//   • resets the cursor
//   • removes the hover state
//   • closes the popup
//
// PARAMETER
//
// map
//   The MapLibre map object that contains the "shapes-fill" layer.
//
//   The map is expected to contain:
//
//     • a source named "shapes"
//     • a layer named "shapes-fill"
//     • feature properties named nisra_label and nisra_value
//
// VALUE DISPLAY
//
// Numeric values are formatted using the British English locale.
//
// Example:
//
//   345418
//
// becomes:
//
//   345,418
//
// Missing values are displayed as:
//
//   Not available
//
// RETURNS
//
// This function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • creates a MapLibre popup
//   • attaches mousemove and mouseleave event listeners
//   • changes the map canvas cursor
//   • updates MapLibre feature-state values
//   • displays and removes popup content
function addHoverPopup(map) {

  // ===== PREPARE THE HOVER STATE AND POPUP =====
  let hoveredId = null;

  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: [0, -6],
    className: "nisra-popup"
  });

  // ===== SHOW THE HOVERED AREA =====
  map.on("mousemove", "shapes-fill", e => {
    map.getCanvas().style.cursor = "pointer";

    const feature = e.features?.[0];
    if (!feature) return;

    if (hoveredId !== null) {
      map.setFeatureState({ source: "shapes", id: hoveredId }, { hover: false });
    }

    hoveredId = feature.id;
    map.setFeatureState({ source: "shapes", id: hoveredId }, { hover: true });

    const props = feature.properties;
    const value = props.nisra_value == null
      ? "Not available"
      : Number(props.nisra_value).toLocaleString("en-GB");

    popup
      .setLngLat(e.lngLat)
      .setHTML(`<div><strong>${props.nisra_label}</strong>: <strong>${value}</strong></div>`)
      .addTo(map);
  });

  // ===== CLEAR THE HOVERED AREA =====
  map.on("mouseleave", "shapes-fill", () => {
    map.getCanvas().style.cursor = "";

    if (hoveredId !== null) {
      map.setFeatureState({ source: "shapes", id: hoveredId }, { hover: false });
      hoveredId = null;
    }

    popup.remove();
  });
}

// ===== CREATE A MAP LEGEND =====
//
// Create a colour legend that explains the choropleth shading used on the map.
//
// The legend uses the same colour palette as the map polygons, displaying:
//
//   • the minimum value on the left
//   • the maximum value on the right
//   • a row of colour blocks between them
//
// The legend is rendered into the HTML element with ID:
//
//   map-legend
//
// This element is expected to exist on the page before the function is called.
//
// COLOUR SCALE
//
// The colour blocks are created using the shared palette array.
//
// Colours are displayed from lightest to darkest, matching the way values
// are assigned to areas by getColour().
//
// PARAMETERS
//
// minValue
//   The lowest value found in the selected data column.
//
// maxValue
//   The highest value found in the selected data column.
//
// VALUE DISPLAY
//
// Values are formatted using the British English locale.
//
// Example:
//
//   345678
//
// becomes:
//
//   345,678
//
// RETURNS
//
// This function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • clears any existing legend content
//   • creates legend rows and colour blocks
//   • updates the map-legend HTML element
//   • displays the minimum and maximum values
function createLegend(minValue, maxValue) {

    const legend = document.getElementById("map-legend");
    if (!legend) return;

    legend.innerHTML = "";
    legend.classList.add("map-legend");

    const legend_row_1 = document.createElement("div");
    legend_row_1.classList.add("row");

    const min_value = document.createElement("div");
    min_value.id = "legend-min";
    min_value.classList.add("legend-min");
    min_value.textContent = Number(minValue).toLocaleString("en-GB");

    const unit_value = document.createElement("div");
    unit_value.classList.add("legend-unit");

    const max_value = document.createElement("div");
    max_value.id = "legend-max";
    max_value.classList.add("legend-max");
    max_value.textContent = Number(maxValue).toLocaleString("en-GB");

    legend_row_1.appendChild(min_value);
    legend_row_1.appendChild(unit_value);
    legend_row_1.appendChild(max_value);

    legend.appendChild(legend_row_1);

    const legend_row_2 = document.createElement("div");
    legend_row_2.classList.add("row");

    for (let i = 0; i < palette.length; i++) {

        const colour_block = document.createElement("div");

        colour_block.style.backgroundColor = palette[i];
        colour_block.style.opacity = "0.8";

        colour_block.classList.add("colour-block");

        if (i === palette.length - 1) {
            colour_block.style.borderRight = "1px #555555 solid";
        }

        legend_row_2.appendChild(colour_block);
    }

    legend.appendChild(legend_row_2);
}