import { wrapLabel } from "./wrap-label.js";

// ===== DRAW A HORIZONTAL Y-AXIS LABEL =====
//
// A custom Chart.js plugin that draws a horizontal label above the Y-axis.
//
// Chart.js normally displays Y-axis titles vertically. This plugin provides an
// alternative by drawing a horizontal title just above the axis line.
//
// Long labels are automatically wrapped onto multiple lines using the
// wrapLabel() helper.
//
// PARAMETERS
//
// The plugin is registered with Chart.js and is called automatically during the
// chart drawing process.
//
// Chart.js supplies:
//
// chart
//   The Chart.js chart object currently being drawn.
//
// _args
//   Internal drawing arguments supplied by Chart.js.
//
//   These are not used by this plugin.
//
// opts
//   The plugin configuration object.
//
// Supported options include:
//
//   text
//     The label to display.
//
//   maxChars
//     Optional.
//
//     The preferred maximum number of characters per line before wrapping.
//
//     Default:
//
//       12
//
//   font
//     Optional.
//
//     A Chart.js font configuration object.
//
//   color
//     Optional.
//
//     The label colour.
//
//   x
//     Optional.
//
//     An explicit horizontal position.
//
//     If omitted, the plugin automatically aligns the label with the selected
//     Y-axis.
//
//   offset
//     Optional.
//
//     The distance above the chart area where the first line should be drawn.
//
// AXIS POSITION
//
// The plugin works with either:
//
//   • the primary Y-axis ("y")
//   • the secondary Y-axis ("y1")
//
// If the axis is positioned on the right-hand side of the chart, the label is
// aligned with the left edge of that axis.
//
// Otherwise it is aligned with the right edge of the left-hand axis.
//
// TEXT WRAPPING
//
// The supplied text is wrapped using wrapLabel(), which returns an array of
// strings.
//
// Each array element is drawn on a separate line, starting closest to the chart
// and then stacking upwards.
//
// RETURNS
//
// This plugin does not explicitly return a value.
//
// SIDE EFFECTS
//
// During Chart.js rendering the plugin:
//
//   • measures the configured font
//   • draws one or more text labels on the canvas
//   • temporarily changes the canvas drawing context
//   • restores the original drawing context afterwards
export const yAxisLabelPlugin = {

    id: "yAxisLabel",

    // ===== DRAW THE AXIS LABEL =====
    afterDraw(chart, _args, opts) {
        const { ctx, chartArea, scales } = chart;
        const yScale = scales.y || scales.y1;
        if (!yScale || !opts?.text) return;

        const lines = wrapLabel(opts.text, opts.maxChars || 12);
        const font = Chart.helpers.toFont(opts.font || Chart.defaults.font);

        ctx.save();

        ctx.font = font.string;
        ctx.fillStyle = opts.color || Chart.defaults.color || "#6c757d";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        const axisX = (yScale.options.position === "right")
            ? yScale.left
            : yScale.right;

        const x = (typeof opts.x === "number")
            ? opts.x
            : axisX;

        let y = chartArea.top - (opts.offset ?? 6);
        const lineHeight = font.lineHeight || font.size * 1.25;

        for (let i = lines.length - 1; i >= 0; i--) {
            ctx.fillText(lines[i], x, y);
            y -= lineHeight;
        }

        ctx.restore();
    }
};