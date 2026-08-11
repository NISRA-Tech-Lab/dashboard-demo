// ===== LOAD MAP SHAPES =====
//
// Load the geographic boundary file used to draw the interactive map.
//
// The function downloads a GeoJSON file containing the map boundaries for the
// requested map type and converts it into a standard GeoJSON FeatureCollection
// if necessary.
//
// GeoJSON is a common format for storing geographic features such as local
// government districts, wards or countries. Each feature contains both its
// geometry (the map shape) and associated properties (such as an area code or
// name).
//
// PARAMETERS
//
// type
//   The map type selector. The only valid values are the four names defined in
//   the types constant below the function definition:
//
//   • "Local Government District"
//   • "Assembly Area (2024)"
//   • "Health and Social Care Trust"
//   • "Assembly Area"
//
// RETURNS
//
// Returns a Promise because the map data is loaded asynchronously.
//
// The Promise resolves to a GeoJSON object.
//
// Normally this will be a GeoJSON FeatureCollection containing all of the map
// features required by the application.
//
// If the downloaded file is already GeoJSON, it is returned unchanged.
//
// If the downloaded file is TopoJSON and the TopoJSON library is available,
// the function converts it into GeoJSON before returning it.
//
// SIDE EFFECTS
//
// The function:
//
//   • downloads the map file from the server
//   • may convert TopoJSON into GeoJSON
//
// ERRORS
//
// The function throws an error if:
//
//   • no map file has been specified
//   • the map file cannot be downloaded
export async function loadShapes(type) {

  // ===== LOAD THE MAP FILE =====
  const url = types[type]?.url;
  if (!url) throw new Error(`No shape URL for ${type} shapes`);

  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const data = await res.json();

  // ===== CONVERT TO STANDARD GEOJSON IF REQUIRED =====
  const geojson = (data.type === "Topology" && window.topojson)
    ? topojson.feature(data, Object.values(data.objects)[0])
    : data;

  // ===== RETURN THE MAP SHAPES =====
  return [geojson, types[type]];
}

const types = {
  "Local Government District": {
    "url": "public/map/LGD2014.geo.json",
    "name": "LGDNAME",
    "code": "LGDCode"
  },
  "Assembly Area (2024)": {
    "url": "public/map/AA2024.geo.json",
    "name": "PC_NAME",
    "code": "PC_Code"
  },
  "Health and Social Care Trust": {
    "url": "public/map/HSCT.geo.json",
    "name": "TrustName",
    "code": "TrustCode"
  },
  "Assembly Area": {
    "url": "public/map/AA.geo.json",
    "name": "PC_NAME",
    "code": "PC_ID"
  }
}