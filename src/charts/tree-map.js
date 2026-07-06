
function splitLabel(label, maxChars) {
    const lines = [];
    let start = 0;
    while (start < label.length) {
      let end = start + maxChars;
      if (end < label.length && label[end] !== " ") {
        const spaceIndex = label.lastIndexOf(" ", end);
        if (spaceIndex > start) end = spaceIndex;
      }
      lines.push(label.substring(start, end).trim());
      start = end;
      if (label[start] === " ") start++;
    }
    return lines.filter(Boolean);
  }

  function formatValue(v) {
    return Number(v).toLocaleString("en", { maximumFractionDigits: 2 });
  }

  function get_tree_data(level, sectorName = null, sectorTotals, sectorIndex, treemap_data) {

  const tree =
    level === "sector"
      ? sectorTotals // [{ sector, value }]
      : treemap_data
          .filter(d => d.sector === sectorName)
          .map(d => ({
            subsector: d.subsector,                   // keep original if you need it for drilldown
            subsector_tidy: d.subsector_tidy ?? d.subsector, // label to display
            value: Number(d.value),
            value_abs: Math.abs(Number(d.value))
          }));

  const groupField = level === "sector" ? "sector" : "subsector_tidy";

  const lightenColor = (hex, amount = 0.4) => {
    const clean = hex.replace("#", "");
    const num = parseInt(clean, 16);

    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);

    return `rgb(${r}, ${g}, ${b})`;
  };

  return {
    datasets: [{
      type: "treemap",
      tree,
      key: "value_abs",
      groups: [groupField],

      label: "",
      label2: level,

      spacing: 1,
      borderWidth: 1,
      hoverBorderWidth: 3,
      hoverBorderColor: "#000",
      borderColor: level === "sector" ? "#ffffff" : "#000",

      backgroundColor: (ctx) => {
  let baseColor;
  let signedValue = 0;

  if (level === "sector") {
    const sector = ctx.raw?.g;
    const i = sectorIndex.get(sector) ?? 0;
    baseColor = chart_colours[i % chart_colours.length];

    // sector level value
    signedValue = ctx.raw?._data?.value ?? 0;

  } else {
    const i = sectorIndex.get(sectorName) ?? 0;
    baseColor = chart_colours[i % chart_colours.length];

    // subsector level value (your working access pattern)
    signedValue = ctx.raw?._data?.children?.[0]?.value ?? 0;
  }

  return signedValue < 0
    ? lightenColor(baseColor, 0.5)
    : baseColor;
},

      labels: {
        display: true,
        align: "center",
        position: "center",

        color: (ctx_tree) => {
          if (level === "sector") {
            const sector = ctx_tree.raw?.g;
            const i = sectorIndex.get(sector) ?? 0;
            return text_colours[i % text_colours.length];
          }
          const i = sectorIndex.get(sectorName) ?? 0;
          return text_colours[i % text_colours.length];
        },

        formatter: (ctx_tree) => {
          const label = ctx_tree.raw?.g ?? ""; // now this will be subsector_tidy
          const chars_per_line = Math.max(1, Math.round(ctx_tree.raw.w / 10));
          const lines = splitLabel(label, chars_per_line);
          lines.push(formatValue(ctx_tree.raw["_data"].children[0].value));
          return lines;
        }
      }
    }]
  };
}








 