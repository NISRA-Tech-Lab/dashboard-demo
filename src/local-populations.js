import { insertHeader, insertFooter, insertNavButtons, insertHead } from "./utils/page-layout.js"
import { readData } from "./utils/read-data.js";
import { plotMap } from "./utils/plot-map.js";
import { populateInfoBoxes } from "./utils/info-boxes.js";
import { downloadButton } from "./utils/download-button.js";
import { config } from "./config/config.js";
import { updateYearSpans, latest_year } from "./utils/update-years.js";
import { dateFormat } from "./utils/date-format.js";
import { insertTable } from "./utils/insert-table.js"

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Maps");
    insertHeader();
    insertNavButtons();
    const MYE01T06 = await readData("MYE01T06");
    const MYE01T06_stat = "Population totals";
    const MYE01T06_updated = dateFormat(MYE01T06.updated); // Format the last-update date nicely

    updateYearSpans(MYE01T06, MYE01T06_stat);

    const areas = Object.keys(MYE01T06.data[MYE01T06_stat][latest_year])
        .filter(x => x != "Northern Ireland");
    
    let map_data = {};

    for (let i = 0; i < areas.length; i ++) {
        map_data[areas[i]] = MYE01T06.data[MYE01T06_stat][latest_year][areas[i]].Unrounded;
    }

    // first draw
    plotMap("map-container", map_data);

    const map_query = {
        "TLIST(A1)": latest_year,
        "rounded_unrounded": "Unrounded"
    };

    downloadButton("map-capture", "MYE01T06", MYE01T06_updated, map_query, "map");

     const table_data = {
            "LGD": {
                "values": Object.keys(map_data),
                "format": "string"
            },
            [`Population ${latest_year}`]: {
                "values": Object.values(map_data),
                "format": "number"
            }
       };

    insertTable("map-data-table", table_data);

    // Populate info boxes
    populateInfoBoxes(
        ["Definitions", "Source", "What does the data mean?"], // Box titles
        [
            // Content for "Definitions" box
            `<p>The data used to populate this page comes from the NISRA Data Portal...</p>`,
            
            // Content for "Source" box  
            `<h3>Line chart functionality</h3>
            <p>The function <em>createLineChart</em> is used to generate the line chart...</p>
            <h3>Pie chart functionality</h3>
            <p>The function <em>createPieChart</em> is used to generate the pie chart...</p>`,

            // Content for "What does the data mean?" box
            `<p>Accessibility and best practice information goes here...</p>`
        ]
    );

        insertFooter();

});