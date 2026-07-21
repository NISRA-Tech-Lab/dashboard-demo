// ===== IMPORTS =====
// Import utility functions that will help build the page layout and populate it with data
// These are small, reusable functions stored in separate files to keep code organized

import { insertHeader, insertFooter, insertNavButtons, insertHead } from "./utils/page-layout.js"; // Functions to build page structure
import { readData } from "./utils/read-data.js"; // Fetches data from external source (e.g., JSON file)
import { plotMap } from "./utils/plot-map.js"; // Draws the map using the prepared data
import { populateInfoBoxes } from "./utils/info-boxes.js"; // Populates info/help boxes
import { downloadButton } from "./utils/download-button.js"; // Creates a download button for the map
import { config } from "./config/config.js"; // Configuration settings
import { updateYearSpans, latest_year } from "./utils/update-years.js"; // Handles year-related calculations
import { dateFormat } from "./utils/date-format.js"; // Formats dates nicely
import { insertTable } from "./utils/insert-table.js"; // Builds a table for the page

// ===== MAIN EXECUTION =====
// This runs AFTER the entire HTML page has loaded (DOMContentLoaded event)
// The "async" keyword allows us to use "await" inside this function to pause and wait for data to load
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // These functions insert the header, navigation, and page title into the HTML
    await insertHead("Maps"); // "await" pauses here until the page head is ready
    insertHeader(); // Adds header to the page
    insertNavButtons(); // Adds navigation buttons

    // ===== LOAD AND PREPARE MAP DATA =====
    // Step 1: Fetch the population totals dataset
    const MYE01T06 = await readData("MYE01T06");
    const MYE01T06_stat = "Population totals"; // This is the specific statistic within the dataset we want
    const MYE01T06_updated = dateFormat(MYE01T06.updated); // Format the last-update date nicely

    // Step 2: Update the year labels shown across the page
    updateYearSpans(MYE01T06, MYE01T06_stat);

    // Step 3: Collect the local government district names and their latest population values
    // We remove Northern Ireland so the map only shows the local areas we want to highlight
    const areas = Object.keys(MYE01T06.data[MYE01T06_stat][latest_year])
        .filter(x => x !== "Northern Ireland");

    let map_data = {};

    // ===== WHY USE A LOOP HERE? =====
    // We need to turn the raw nested data into a simpler map-friendly object
    // A loop lets us do this for every area without writing a long list of repeated lines
    for (let i = 0; i < areas.length; i++) {
        map_data[areas[i]] = MYE01T06.data[MYE01T06_stat][latest_year][areas[i]].Unrounded;
    }

    // ===== DRAW THE MAP =====
    // Send the prepared data to the map helper so it can render the visual
    plotMap("map-container", map_data);

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Create query parameters that tell the API which data to download for the map
    const map_query = {
        "TLIST(A1)": latest_year,
        rounded_unrounded: "Unrounded"
    };

    // Create a download button so users can export the map data
    downloadButton("map-capture", "MYE01T06", MYE01T06_updated, map_query, "map");

    // ===== TABLE OF MAP DATA =====
    // Build a simple table showing each area and its population value
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

    // ===== INFO BOXES - HELP AND METADATA =====
    // Populate the expandable info boxes with definitions and help text
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

    // ===== FINISH THE PAGE =====
    insertFooter();

});