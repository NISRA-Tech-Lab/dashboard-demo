// ===== IMPORTS =====
// Import the reusable functions used to build the page, load the population
// dataset, draw the map, create the table, and add supporting page content

import { insertHeader, insertFooter, insertNavButtons, insertHead } from "./utils/page-layout.js"; // Builds the shared page structure
import { readData } from "./utils/read-data.js"; // Loads a CSV dataset together with its metadata
import { plotMap } from "./utils/plot-map.js"; // Draws a map using row-based area and population data
import { populateInfoBoxes } from "./utils/info-boxes.js"; // Populates expandable information boxes
import { downloadButton } from "./utils/download-button.js"; // Adds a button for downloading the map data
import { updateYearSpans, latest_year } from "./utils/update-years.js"; // Provides the latest year and updates year labels
import { dateFormat } from "./utils/date-format.js"; // Formats dataset update dates for display
import { insertTable } from "./utils/insert-table.js"; // Builds and inserts an HTML data table

// ===== MAIN EXECUTION =====
// Run the page setup and data-processing code after the initial HTML
// document has finished loading
//
// Declaring the function as async allows await to be used while shared page
// components and datasets are loaded
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // Insert the shared page head, header, and navigation controls
    await insertHead("Local populations"); // Wait until the document head has been prepared
    insertHeader(); // Adds the page header
    insertNavButtons(); // Adds the navigation buttons

    // ===== LOAD THE LOCAL POPULATION DATA =====
    // readData() returns two items:
    //
    //   1. The parsed rows from MYE01T06.csv
    //   2. The MYE01T06 metadata stored in data.json
    //
    // Array destructuring assigns these to pop_by_lgd_data and
    // pop_by_lgd_meta
    //
    // The CSV observations are represented as an array of row objects.
    // This is similar to working with a data frame or tibble in R:
    //
    //   JavaScript array of objects   ≈ R data frame
    //   one object                    ≈ one row
    //   one object property           ≈ one column
    const [pop_by_lgd_data, pop_by_lgd_meta] = await readData("MYE01T06");

    // Format the matrix update date stored separately in the metadata
    const MYE01T06_updated = dateFormat(pop_by_lgd_meta.updated);

    // Read the available years from the CSV rows and update year references
    // displayed throughout the page
    updateYearSpans(pop_by_lgd_data);

    // ===== PREPARE THE MAP DATA =====
    // Filter the CSV rows to:
    //
    //   the latest available year
    //   individual local government districts
    //
    // The Northern Ireland total is excluded because it represents the overall
    // summary rather than an individual area on the map
    //
    // This is similar to:
    //
    //   map_data <- pop_by_lgd_data %>%
    //     filter(
    //       Year == latest_year,
    //       `Local Government District` != "Northern Ireland"
    //     )
    const map_data = pop_by_lgd_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Local Government District"] != "Northern Ireland"
        )

    // ===== DRAW THE MAP =====
    // Pass the filtered CSV rows directly to plotMap()
    //
    // elementId identifies the HTML container where the map should appear
    //
    // area identifies the column containing the local government district names
    //
    // value identifies the numeric population column used to shade and label
    // each area
    plotMap({
        elementId: "map-container",
        data: map_data,
        area: "Local Government District",
        value: "Unrounded"
    });

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Define the source-matrix filters associated with the map
    //
    // The query requests the latest available year and the unrounded
    // population measure used in the visualisation
    const map_query = {
        "TLIST(A1)": latest_year,
        rounded_unrounded: "Unrounded"
    };

    // Add a download button for the data underlying the map
    //
    // The final "map" argument identifies this download as belonging to a map
    // capture rather than a standard chart
    downloadButton("map-capture", "MYE01T06", MYE01T06_updated, map_query, "map");

    // ===== TABLE OF MAP DATA =====
    // Reshape the filtered rows into the column-based structure expected by
    // insertTable()
    //
    // map() extracts one column value from every row. This resembles pull()
    // or select() in dplyr
    const table_data = {
        "LGD": {
            // Extract the local government district name from each row
            "values": map_data.map(col => col["Local Government District"]),
            "format": "string"
        },
        [`Population ${latest_year}`]: {
            // Extract the unrounded population value from each row
            "values": map_data.map(col => col["Unrounded"]),
            "format": "number"
        }
    };

    // Insert the completed table into the specified HTML element
    insertTable("map-data-table", table_data);

    // ===== INFO BOXES: HELP AND CONTEXT =====
    // Populate the expandable information boxes displayed below the map
    //
    // The first array contains the box headings
    // The second array contains the corresponding HTML content
    populateInfoBoxes(
        ["Definitions", "Source", "What does the data mean?"], // Information-box headings
        [
            // ----- DEFINITIONS BOX -----
            // Explain how the page layout is constructed and made responsive
            `<p>The layout for this page is built in the dashboard HTML template using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the map, table, and supporting content can adapt to different screen sizes and remain mobile friendly.</p>
            <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
            <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,
            
            // ----- SOURCE BOX -----
            // Identify the matrix used to populate the map and table
            `<p>The map and table on this page are populated by this script using data from the NISRA Data Portal.</p>
            <p>The dataset used is <strong>MYE01T06</strong>, which contains population totals by local government district.</p>
            <p>The matrix is loaded as a CSV-style table. Rows are filtered by year and area, and the local government district and unrounded population columns are passed to the map and table functions.</p>`,

            // ----- DATA MEANING BOX -----
            // Explain the inputs expected by the map utility
            `<p>This page uses the <strong>plotMap()</strong> function to draw the local population map.</p>
            <p>The function receives the filtered CSV rows, the ID of the HTML map container, the column containing the local government district names, and the numeric population column used to represent each area.</p>
            <p>The same filtered rows are also used to create the accompanying table, ensuring that the map and table show the same areas and population values.</p>`
        ]
    );

    // ===== FINISH THE PAGE =====
    // Add the shared footer after the page content has been prepared
    insertFooter();

});