// ===== IMPORTS =====
// Import utility functions that will help build the page layout and populate it with data
// These are small, reusable functions stored in separate files to keep code organized

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Functions to build page structure
import { readData } from "./utils/read-data.js"; // Fetches data from external source (e.g., JSON file)
import { insertValue } from "./utils/insert-value.js"; // Places values into HTML elements on the page
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js"; // Handles year-related calculations
import { toTitleCase } from "./utils/to-title-case.js"; // Converts text to Title Case format
import { config } from "./config/config.js"; // Configuration settings
import { barChart } from "./charts/bar-chart.js"; // Creates a bar chart from a helper module
import { insertTable } from "./utils/insert-table.js"; // Builds tables for the page
import { insertExpandButtons } from "./utils/expand-buttons.js"; // Adds expandable sections
import { dateFormat } from "./utils/date-format.js"; // Formats dates nicely
import { downloadButton } from "./utils/download-button.js"; // Creates download buttons for data
import { populateInfoBoxes } from "./utils/info-boxes.js"; // Populates info/help boxes

// ===== MAIN EXECUTION =====
// This runs AFTER the entire HTML page has loaded (DOMContentLoaded event)
// The "async" keyword allows us to use "await" inside this function to pause and wait for data to load
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // These functions insert the header, footer, navigation buttons, etc. into the HTML
    await insertHead("Home"); // "await" pauses here until the page head is ready
    insertHeader(); // Adds header to the page
    insertNavButtons(); // Adds navigation buttons
    insertFooter(); // Adds footer to the page
    insertExpandButtons(); // Adds buttons that allow sections to expand/collapse

    // ===== POPULATE PAGE WITH DATA =====
    // This section: fetches data → extracts specific values → calculates if needed → displays on page

    // ----- TOTAL POPULATION CHANGE CARD -----
    // Step 1: Fetch the data from the data source (JSON file or database)
    // COPC01T01 is the code for the components of population change dataset
    // "await" pauses execution until the data finishes loading
    const [COPC01T01, COPC01T01_meta] = await readData("COPC01T01");
    updateYearSpans(COPC01T01); // Updates year labels on the page

    // Step 2: Extract the value from the nested data structure
    // COPC01T01.data is a large object organized like: {statistic_name: {year: {metric: value}}}
    // Example structure:
    //   COPC01T01.data = {
    //     "Components of population change": {
    //       2021: { "Starting population": 12345, "End population": 12346 },
    //       2022: { "Starting population": 23456, "End population": 23457 }
    //     }
    //   }

    const COPC01T01_latest_year = COPC01T01
        .filter(row => row["Year"] == latest_year);
    
    const start_pop = COPC01T01_latest_year
        .map(col => col["Starting population"])

    const end_pop = COPC01T01_latest_year
        .map(col => col["End population"])
    
    const pop_change = end_pop - start_pop;

    // Step 3: Display on page - toLocaleString() adds commas (e.g., 1,234,567)
    insertValue("pop-change", pop_change.toLocaleString());

    // ----- BIRTHS VS DEATHS CARD -----
    const births_num = COPC01T01_latest_year
        .map(col => col["Births"])

    const deaths_num = COPC01T01_latest_year
        .map(col => col["Deaths"])

    const births_deaths = births_num - deaths_num;
    insertValue("pop-births-deaths", births_deaths.toLocaleString());

    // ----- INFLOW CARD -----
    const inflows_num = COPC01T01_latest_year
        .map(col => col["Total Inflows"])

    insertValue("pop-inflows", inflows_num.toLocaleString());

    // ----- OUTFLOW CARD -----
    const outflows_num = COPC01T01_latest_year
        .map(col => col["Total Outflows"])
    
    insertValue("pop-outflows", outflows_num.toLocaleString());

    // ----- NET CHANGE CARD -----
    // Calculate how much the population changed from last year to this year
    const net_num = COPC01T01_latest_year
        .map(col => col["Total Net"])

    const net_change = (net_num / pop_change) * 100; 
    insertValue("pop-net-change", net_change.toFixed(1));

    // ----- BAR CHART - AGE BREAKDOWN -----
    // Create a chart showing how the population is split by age group and sex

    const [MYE01T03, MYE01T03_meta] = await readData("MYE01T03");
    const MYE01T03_updated = dateFormat(MYE01T03_meta.updated);
    
    // Get the data for the latest year and filter out "All category"
    const chart_data = MYE01T03
        .filter(row => row["Year"] == latest_year &&
                       row["Broad age band (4 cat)"] != "All")

    // Create the bar chart twice: once for the main view and once for the expanded view
    barChart({
        data: chart_data,
        values: ["Females", "Males"],
        categories: "Broad age band (4 cat)",
        canvas_id: "population-age-bar",
        label_format: ","   // comma formatting for large numbers
    });

    barChart({
        data: chart_data,
        values: ["Females", "Males"],
        categories: "Broad age band (4 cat)",
        canvas_id: "population-age-bar-expanded",
        label_format: ","   // comma formatting for large numbers
    });

    // ----- TABLE OF POPULATION CHANGES BY LOCAL GOVERNMENT DISTRICT -----
    // Step 1: Fetch the data from the data source (JSON file or database)
    // MYE01T06 is the code for the population totals dataset
    // "await" pauses execution until the data finishes loading
    const [MYE01T06, MYE01T06_meta] = await readData("MYE01T06");
    // const MYE01T06_stat = "Population totals";
    const MYE01T06_updated = dateFormat(MYE01T06_meta.updated);

    MYE01T06.forEach(row => {
        const row_year = row["Year"];
        const row_lgd = row["Local Government District"];
        if (row_year == latest_year) {
            row["last_year_pop"] = MYE01T06
                .filter(row => row["Year"] == last_year && row["Local Government District"] == row_lgd)
                .map(col => col["Unrounded"])
            row["change"] = row["Unrounded"] - row["last_year_pop"]
            row["change_pct"] = row["change"] / row["last_year_pop"] * 100
        }
    })

    // Step 2: Extract the values from the nested data structure
    // const lgds = Object.keys(MYE01T06.data[MYE01T06_stat][latest_year]); 
    const MYE01T06_latest_year = MYE01T06
        .filter(row => row["Year"] == latest_year);

    const table_data = {
        "Local Government District": {
            "values": MYE01T06_latest_year.map(col => col["Local Government District"]),
            "format": "string"
        },
        [`Population ${latest_year}`]: {
            "values": MYE01T06_latest_year.map(col => col["Unrounded"]),
            "format": "number"
        },
        [`Population ${last_year}`]: {
            "values": MYE01T06_latest_year.map(col => col["last_year_pop"]),
            "format": "number"
        },
        "Change": {
            "values": MYE01T06_latest_year.map(col => col["change"]),
            "format": "change"
        },
        "Change (%)": {
            "values": MYE01T06_latest_year.map(col => col["change_pct"]),
            "format": "change_percent"
        }
    };

    // Step 3: Display on page
    insertTable("pop-table", table_data);
    insertTable("pop-table-expanded", table_data);

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Create query parameters that specify what data to download
    // These tell the API: "I want the unrounded population figures"
    const pop_table_query = {
        "TLIST(A1)": [last_year, latest_year],
        rounded_unrounded: "Unrounded"
    };

    // These parameters request: "Latest year, all age groups, both male (1) and female (2)"
    // console.log(chart_data.map(col => col["Broad age band (4 cat)"]))
    const pop_bar_query = {
        "TLIST(A1)": latest_year, // Latest year only
        "Sex": ["1", "2"],  // Genders (1=Male, 2=Female)
        "broadage4": ["1", "2", "3", "4"] // All age groups combined 
    };

    // Create download buttons that allow users to download the underlying data
    downloadButton("pop-bar-capture", "MYE01T03", MYE01T03_updated, pop_bar_query);
    downloadButton("pop-table-capture", "MYE01T06", MYE01T06_updated, pop_table_query);

    // ===== INFO BOXES - HELP AND METADATA =====
    // Populate the expandable info boxes with definitions and help text
    // Takes 3 arrays: box titles, and their corresponding content
    populateInfoBoxes(
        ["Definitions", "Source", "What does the data mean?"], // Box titles
        [
            // Content for "Definitions" box
            `<p>The layout for this page is built in the dashboard HTML template using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the cards, chart, and table can adapt to different screen sizes and remain mobile friendly.</p>
            <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
            <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,
            
            // Content for "Source" box  
            `<p>The top cards, chart, and table on this page are populated from this script using data from the NISRA Data Portal.</p>
            <p>The main datasets used are <strong>COPC01T01</strong> for components of population change, <strong>MYE01T03</strong> for the age breakdown chart, and <strong>MYE01T06</strong> for the local authority table.</p>
            <p>Values are selected by following the structure and column order shown in the relevant data matrix on the NISRA Data Portal.</p>`,

            // Content for "What does the data mean?" box
            `<p>This page uses <strong>barChart()</strong> to draw the age-group breakdown.</p>
            <p>The function needs the chart values, the category labels, the canvas ID, and the label format so the bars can be drawn correctly.</p>`
        ]
    );

});
