// ===== IMPORTS =====
// Import the reusable functions used to build the page, load the population
// dataset, draw the map, create the table, and add supporting page content

import { insertHeader, insertFooter, insertNavButtons, insertHead } from "./utils/page-layout.js"; // Builds the shared page structure
import { readData } from "./utils/read-data.js"; // Loads a CSV dataset together with its metadata
import { plotMap } from "./charts/plot-map.js"; // Draws a map using row-based area and population data
import { populateInfoBoxes } from "./utils/info-boxes.js"; // Populates expandable information boxes
import { downloadButton } from "./utils/download-button.js"; // Adds a button for downloading the map data
import { updateYearSpans, latest_year } from "./utils/update-years.js"; // Provides the latest year and updates year labels
import { dateFormat } from "./utils/date-format.js"; // Formats dataset update dates for display
import { insertTable } from "./charts/insert-table.js"; // Builds and inserts an HTML data table
import { insertValue } from "./utils/insert-value.js"; // Inserts individual values into summary cards

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
    // pop_by_lgd_meta.
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

    // Read the matrix metadata to identify which CSV column represents the
    // time dimension, then use that column to calculate the available years
    // and update year references displayed throughout the page.
    //
    // This avoids assuming that every matrix uses a column literally called
    // "Year". The metadata tells updateYearSpans() which column corresponds
    // to the PxStat TLIST dimension.
    updateYearSpans(pop_by_lgd_data, pop_by_lgd_meta);

    // ===== PREPARE THE LATEST-YEAR LGD DATA =====
    // Filter the complete dataset to the rows used throughout the rest of
    // this page:
    //
    //   • the latest available year
    //   • individual local government districts only
    //
    // The Northern Ireland row is excluded because it represents the overall
    // total rather than an individual district.
    //
    // Keeping this filtered dataset in map_data means the same filtering does
    // not need to be repeated for every card, the map, and the table.
    //
    // This is similar to creating a reusable filtered tibble in R:
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
        );

    // ===== HIGHEST POPULATION CARD =====
    // Pull the Unrounded population column from the latest-year district rows
    // and find its maximum value.
    //
    // map() here performs a similar role to pull() in dplyr:
    //
    //   map_data %>%
    //     pull(Unrounded) %>%
    //     max()
    //
    // The spread operator (...) passes the array of population values to
    // Math.max() as individual numeric arguments.
    const top_population = Math.max(
        ...map_data.map(col => col["Unrounded"])
    );

    // Display the largest population using thousands separators
    insertValue("top-population", top_population.toLocaleString());

    // Find the row whose population equals the maximum value and extract the
    // corresponding local government district name.
    //
    // This is similar to:
    //
    //   map_data %>%
    //     filter(Unrounded == top_population) %>%
    //     pull(`Local Government District`)
    const top_area = map_data
        .filter(row => row["Unrounded"] == top_population)
        .map(col => col["Local Government District"]);

    insertValue("top-area", top_area);

    // ===== LOWEST POPULATION CARD =====
    // Repeat the same process using Math.min() to identify the district with
    // the smallest latest-year population.
    //
    // R equivalent:
    //
    //   bottom_population <- map_data %>%
    //     pull(Unrounded) %>%
    //     min()
    const bottom_population = Math.min(
        ...map_data.map(col => col["Unrounded"])
    );

    insertValue("bottom-population", bottom_population.toLocaleString());

    // Find the district associated with the minimum population value
    const bottom_area = map_data
        .filter(row => row["Unrounded"] == bottom_population)
        .map(col => col["Local Government District"]);

    insertValue("bottom-area", bottom_area);

    // ===== CALCULATE TEN-YEAR POPULATION GROWTH =====
    // Add a calculated percentage-change value to each row in map_data.
    //
    // forEach() visits each latest-year district row in turn. For that district,
    // the corresponding population from ten years earlier is found in the
    // complete pop_by_lgd_data dataset.
    //
    // A new property called "change" is then added to the latest-year row.
    //
    // Conceptually this is similar to using mutate() in R after matching each
    // district to its earlier population:
    //
    //   map_data %>%
    //     mutate(
    //       change =
    //         (Unrounded - population_10_years_ago) /
    //         population_10_years_ago * 100
    //     )
    map_data.forEach(lgd => {

        // Find the population for the same district ten years before the
        // latest year
        const pop_10_years_ago = pop_by_lgd_data
            .filter(row =>
                row["Year"] == latest_year - 10 &&
                row["Local Government District"] == lgd["Local Government District"]
            )
            .map(col => col["Unrounded"]);

        // Calculate the ten-year percentage change and store it as a new
        // property on the latest-year district row
        lgd["change"] =
            (lgd["Unrounded"] - pop_10_years_ago) /
            pop_10_years_ago *
            100;
    });

    // ===== HIGHEST GROWTH CARD =====
    // Extract the calculated change column and identify the largest value.
    //
    // This is similar to:
    //
    //   map_data %>%
    //     pull(change) %>%
    //     max()
    const top_growth = Math.max(
        ...map_data.map(col => col["change"])
    );

    // Display the growth rate to one decimal place
    insertValue("top-growth", `+${top_growth.toFixed(1)}`);

    // Find the district associated with the highest growth rate
    const top_growth_area = map_data
        .filter(row => row["change"] == top_growth)
        .map(col => col["Local Government District"]);

    insertValue("top-growth-area", top_growth_area);

    // ===== LOWEST GROWTH CARD =====
    // Identify the smallest ten-year percentage change.
    //
    // This may represent either:
    //
    //   • the district with the slowest growth
    //   • the district with the largest decline, if the value is negative
    const bottom_growth = Math.min(
        ...map_data.map(col => col["change"])
    );

    insertValue("bottom-growth", `+${bottom_growth.toFixed(1)}`);

    // Find the district associated with the minimum growth value
    const bottom_growth_area = map_data
        .filter(row => row["change"] == bottom_growth)
        .map(col => col["Local Government District"]);

    insertValue("bottom-growth-area", bottom_growth_area);

    // ===== DRAW THE MAP =====
    // Pass the same filtered latest-year LGD rows used by the summary cards
    // directly to plotMap().
    //
    // elementId
    //   identifies the HTML container where the map should appear
    //
    // legendId
    //   identifies the HTML container where the map legend should appear
    //
    // data
    //   contains the latest-year district rows
    //
    // meta
    //   supplies the matrix metadata
    //
    // area
    //   identifies the column containing the district names
    //
    // value
    //   identifies the numeric population column used to shade the map
    plotMap({
        elementId: "map-container",
        legendId: "map-legend",
        data: map_data,
        meta: pop_by_lgd_meta,
        area: "Local Government District",
        value: "Unrounded"
    });

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Define the matrix selections associated with the map.
    //
    // Unlike the local CSV filtering above, this object describes the
    // dimensions to request from the source API when users download the data.
    const map_query = {
        "Year": latest_year,
        "Rounded or unrounded": "Unrounded"
    };

    // Add a download button for the data underlying the map.
    //
    // The final "map" argument tells downloadButton() to use the map-specific
    // image export process.
    downloadButton(
        "map-capture",
        "MYE01T06",
        MYE01T06_updated,
        map_query,
        "map"
    );

    // ===== TABLE OF MAP DATA =====
    // Reshape the same latest-year LGD rows into the column-oriented structure
    // expected by insertTable().
    //
    // map() extracts one property from every row, which is similar to pull()
    // in dplyr.
    const table_data = {
        "LGD": {
            "values": map_data
                .map(col => col["Local Government District"]),
            "format": "string"
        },
        [`Population ${latest_year}`]: {
            "values": map_data
                .map(col => col["Unrounded"]),
            "format": "number"
        }
    };

    // Insert the completed table into the page
    insertTable("map-data-table", null, table_data);

    // ===== INFO BOXES: HELP AND CONTEXT =====
    // Populate the expandable information boxes displayed below the map.
    //
    // The first array contains the headings and the second contains the
    // corresponding HTML content.
    populateInfoBoxes(
        ["Definitions", "Source", "What does the data mean?"],
        [
            // ----- DEFINITIONS BOX -----
            `<p>The layout for this page is built in the dashboard HTML template using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the map, table, and supporting content can adapt to different screen sizes and remain mobile friendly.</p>
            <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
            <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,

            // ----- SOURCE BOX -----
            `<p>The summary cards, map and table on this page are populated by this script using data from the NISRA Data Portal.</p>
            <p>The dataset used is <strong>MYE01T06</strong>, which contains population totals by local government district.</p>
            <p>The matrix is loaded as a CSV-style table. Rows are filtered by year and area, while population values are selected or used to calculate ten-year percentage changes for the summary cards.</p>`,

            // ----- DATA MEANING BOX -----
            `<p>This page uses the <strong>plotMap()</strong> function to draw the local population map.</p>
            <p>The function receives the filtered CSV rows, the map and legend container IDs, the matrix metadata, the column containing the local government district names, and the numeric population column used to represent each area.</p>
            <p>The same filtered rows are reused for the summary cards and accompanying table so that all elements on the page are based on the same latest-year district data.</p>`
        ]
    );

    // ===== FINISH THE PAGE =====
    // Add the shared footer after the page content has been prepared
    insertFooter();

});