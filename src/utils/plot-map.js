import { loadShapes } from "./load-shapes.js";

export let map;
let geojsonData;

const palette = ["#d6e4f6", "#8db2e0", "#3878c5", "#22589c", "#00205b"];

export async function plotMap(elementId, map_data) {
  const areas = Object.keys(map_data);
  const values = areas.map(area => map_data[area]).filter(v => v != null);

  const range_min = Math.floor(Math.min(...values));
  const range_max = Math.ceil(Math.max(...values));
  const range = range_max - range_min || 1;

  if (!geojsonData) geojsonData = await loadShapes();

  const features = geojsonData.features.map((feature, idx) => {
    const areaName = String(feature.properties.LGDNAME);
    const rawValue = map_data[areaName];

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

  if (map) {
    map.remove();
    map = null;
  }

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

  map.addControl(
    new maplibregl.NavigationControl({
      showZoom: true,
      showCompass: false,
      visualizePitch: false
    }),
    "top-right"
  );

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

    addHoverPopup(map);
  });
}

function getColour(norm) {
  if (norm == null || norm < 0) return "#d3d3d3";

  const idx = Math.max(0, Math.min(4, Math.round(norm * 4)));
  return palette[idx];
}

function addHoverPopup(map) {
  let hoveredId = null;

  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: [0, -6],
    className: "nisra-popup"
  });

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

  map.on("mouseleave", "shapes-fill", () => {
    map.getCanvas().style.cursor = "";

    if (hoveredId !== null) {
      map.setFeatureState({ source: "shapes", id: hoveredId }, { hover: false });
      hoveredId = null;
    }

    popup.remove();
  });
}