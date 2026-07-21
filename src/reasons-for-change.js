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
    const COPC01T01 = await readData("COPC01T01");
    const COPC01T01_stat = "Components of population change"; // This is the specific statistic within the dataset we want
    updateYearSpans(COPC01T01, COPC01T01_stat); // Updates year labels on the page

    // Step 2: Extract the value from the nested data structure
    // COPC01T01.data is a large object organized like: {statistic_name: {year: {metric: value}}}
    // Example structure:
    //   COPC01T01.data = {
    //     "Components of population change": {
    //       2021: { "Starting population": 12345, "End population": 12346 },
    //       2022: { "Starting population": 23456, "End population": 23457 }
    //     }
    //   }
    const start_pop = COPC01T01.data[COPC01T01_stat][latest_year]["Starting population"];
    const end_pop = COPC01T01.data[COPC01T01_stat][latest_year]["End population"];
    const pop_change = end_pop - start_pop;

    // Step 3: Display on page - toLocaleString() adds commas (e.g., 1,234,567)
    insertValue("pop-change", pop_change.toLocaleString());

    // ----- BIRTHS VS DEATHS CARD -----
    const births_num = COPC01T01.data[COPC01T01_stat][latest_year]["Births"];
    const deaths_num = COPC01T01.data[COPC01T01_stat][latest_year]["Deaths"];
    const births_deaths = births_num - deaths_num;
    insertValue("pop-births-deaths", births_deaths.toLocaleString());

    // ----- INFLOW CARD -----
    const inflows_num = COPC01T01.data[COPC01T01_stat][latest_year]["Total Inflows"];
    insertValue("pop-inflows", inflows_num.toLocaleString());

    // ----- OUTFLOW CARD -----
    const outflows_num = COPC01T01.data[COPC01T01_stat][latest_year]["Total Outflows"];
    insertValue("pop-outflows", outflows_num.toLocaleString());

    // ----- NET CHANGE CARD -----
    // Calculate how much the population changed from last year to this year
    const net_num = COPC01T01.data[COPC01T01_stat][latest_year]["Total Net"];
    const nat_change_num = COPC01T01.data[COPC01T01_stat][latest_year]["Natural Change"];
    const net_change = (net_num / (net_num + nat_change_num)) * 100; 
    insertValue("pop-net-change", net_change.toFixed(1));

    // ----- BAR CHART - AGE BREAKDOWN -----
    // Create a chart showing how the population is split by age group and sex

    const MYE01T03 = await readData("MYE01T03");
    const MYE01T03_stat = "Mid-year population estimate";
    const MYE01T03_updated = dateFormat(MYE01T03.updated);
    
    // Get the data for the latest year
    const year_data = MYE01T03.data[MYE01T03_stat][latest_year];

    // Remove the summary "All" group so the chart only shows age bands
    const age_groups = Object.keys(year_data).filter(a => a !== "All");

    // Build two arrays of values: one for females and one for males
    const chart_data = {
        "Females": age_groups.map(age => year_data[age]["Females"]),
        "Males": age_groups.map(age => year_data[age]["Males"])
    };

    // Create the bar chart twice: once for the main view and once for the expanded view
    barChart({
        chart_data,
        categories: age_groups,
        canvas_id: "population-age-bar",
        label_format: ","   // comma formatting for large numbers
    });

    barChart({
        chart_data,
        categories: age_groups,
        canvas_id: "population-age-bar-expanded",
        label_format: ","   // comma formatting for large numbers
    });

    // ----- TABLE OF POPULATION CHANGES BY LOCAL GOVERNMENT DISTRICT -----
    // Step 1: Fetch the data from the data source (JSON file or database)
    // MYE01T06 is the code for the population totals dataset
    // "await" pauses execution until the data finishes loading
    const MYE01T06 = await readData("MYE01T06");
    const MYE01T06_stat = "Population totals";
    const MYE01T06_updated = dateFormat(MYE01T06.updated);

    // Step 2: Extract the values from the nested data structure
    const lgds = Object.keys(MYE01T06.data[MYE01T06_stat][latest_year]);

    let latest_year_pop = [];
    let last_year_pop = [];
    let change = [];
    let change_pct = [];

    // ===== WHY USE A LOOP HERE? =====
    // We need to extract one value from each local authority and collect them into arrays
    // A loop is perfect for repetitive tasks like this
    // Instead of writing:
    //   latest_year_pop[0] = data[2015]
    //   latest_year_pop[1] = data[2016]
    //   ... (this would be tedious with many areas!)
    // We use a loop to do it automatically
    for (let i = 0; i < lgds.length; i++) {
        const latest_year_value = MYE01T06.data[MYE01T06_stat][latest_year][lgds[i]]["Unrounded"];
        latest_year_pop.push(latest_year_value);

        const last_year_value = MYE01T06.data[MYE01T06_stat][last_year][lgds[i]]["Unrounded"];
        last_year_pop.push(last_year_value);

        const change_value = latest_year_value - last_year_value;
        change.push(change_value);
        change_pct.push(change_value / last_year_value * 100);
    }

    const table_data = {
        "Local Government District": {
            "values": lgds,
            "format": "string"
        },
        [`Population ${latest_year}`]: {
            "values": latest_year_pop,
            "format": "number"
        },
        [`Population ${last_year}`]: {
            "values": last_year_pop,
            "format": "number"
        },
        "Change": {
            "values": change,
            "format": "change"
        },
        "Change (%)": {
            "values": change_pct,
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
    const pop_bar_query = {
        "TLIST(A1)": latest_year, // Latest year only
        "Sex": ["1", "2"],  // Genders (1=Male, 2=Female)
        "broadage4": age_groups // All age groups combined 
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

});
