// ===== IMPORTS =====
// Import utility functions that will help build the page layout and populate it with data
// These are small, reusable functions stored in separate files to keep code organized

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Functions to build page structure
import { readData } from "./utils/read-data.js"; // Fetches data from external source (e.g., JSON file)
import { insertValue } from "./utils/insert-value.js"; // Places values into HTML elements on the page
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js"; // Handles year-related calculations
import { toTitleCase } from "./utils/to-title-case.js"; // Converts text to Title Case format
import { config } from "./config/config.js"; // Configuration settings
import { lineChart } from "./charts/line-chart.js"; // Creates different chart types
import { horizontalBarChart} from "./charts/horizontal-bar-chart.js";
import { insertExpandButtons } from "./utils/expand-buttons.js"; // Adds expandable sections
import { downloadButton } from "./utils/download-button.js"; // Creates download buttons for data
import { dateFormat } from "./utils/date-format.js"; // Formats dates nicely
import { populateInfoBoxes } from "./utils/info-boxes.js"; // Populates info/help boxes
import { getMaxEntry } from "./utils/get-max-entry.js"; // Finds the key with the maximum value in an object

// ===== MAIN EXECUTION =====
// This runs AFTER the entire HTML page has loaded (DOMContentLoaded event)
// The "async" keyword allows us to use "await" inside this function to pause and wait for data to load
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // These functions insert the header, footer, navigation buttons, etc. into the HTML
    await insertHead("Migration"); // "await" pauses here until the page head is ready
    insertHeader(); // Adds header to the page
    insertNavButtons(); // Adds navigation buttons
    insertFooter(); // Adds footer to the page
    insertExpandButtons(); // Adds buttons that allow sections to expand/collapse

    // ===== POPULATE PAGE WITH DATA =====
    // This section: fetches data → extracts specific values → calculates if needed → displays on page

    // ----- POPULATION CHANGE CARD -----
    // Step 1: Fetch the data from the data source (JSON file or database)
    // MIG01T02 is the code for the net migration dataset
    // "await" pauses execution until the data finishes loading
    const [MIG01T02, MIG01T02_meta] = await readData("MIG01T02");
    updateYearSpans(MIG01T02); // Updates year labels on the page

    const MIG01T02_updated = dateFormat(MIG01T02_meta.updated); // Format the last-update date nicely

    // Step 2: Extract the value from the nested data structure
    // MIG01T02.data is a large object organized like: {statistic_name: {year: {metric: value}}}
    // Example structure:
    //   MIG01T02.data = {
    //     "Net Migration": {
    //       2021: { "All": { "All persons": { "Total Net": 12345 } } },
    //       2022: { "All": { "All persons": { "Total Net": 23456 } } }
    //     }
    //   }

    const pop_change_value = MIG01T02
        .filter(row => row["Year"] == latest_year &&
                       row["Broad age band (7 cat)"] == "All" &&
                       row["Sex"] == "All persons")
        .map(col => col["Total Net"])
    
    // Format the net migration value with a plus or minus sign and commas
    const pop_change = pop_change_value > 0 ? `+ ${pop_change_value.toLocaleString()}` : pop_change_value < 0 ? `- ${Math.abs(pop_change_value).toLocaleString()}` : `${pop_change_value}`;

    // Step 3: Display on page - toLocaleString() adds commas (e.g., 1,234,567)
    insertValue("pop-change", pop_change.toLocaleString());

    // ----- PERCENTAGE POPULATION CHANGE CARD -----
    // Calculate how much the population changed from last year to this year
    const pop_change_last = MIG01T02
        .filter(row => row["Year"] == last_year &&
                       row["Broad age band (7 cat)"] == "All" &&
                       row["Sex"] == "All persons")
        .map(col => col["Total Net"])

    const pop_change_pct_value = ((pop_change_value - pop_change_last) / Math.abs(pop_change_last)) * 100; // Percentage change formula
    const pop_change_pct = pop_change_pct_value > 0 ? `+ ${pop_change_pct_value.toFixed(0)}` : pop_change_pct_value < 0 ? `- ${Math.abs(pop_change_pct_value).toFixed(0)}` : `${pop_change_pct_value.toFixed(0)}`;
    insertValue("pop-change-pct", pop_change_pct);

    // ----- LARGEST NET LOSS/GAIN CARDS -----
    // Get the list of age groups from the current year, excluding the summary "All" row
    // These age groups will be used for the chart labels and for finding the largest gain/loss

    const age_group_data = MIG01T02
        .filter(
            row => row["Year"] == latest_year &&
            row["Sex"] == "All persons" &&
            row["Broad age band (7 cat)"] != "All"
        )
    
    const net_values = age_group_data
        .map(col => col["Total Net"]);

    const max_net = Math.max(...net_values);
    const min_net = Math.min(...net_values);

    const max_age = age_group_data
        .filter(row => row["Total Net"] == max_net)
        .map(col => col["Broad age band (7 cat)"])

    const min_age = age_group_data
        .filter(row => row["Total Net"] == min_net)
        .map(col => col["Broad age band (7 cat)"])

    insertValue("gain-age", max_age);
    insertValue("loss-age", min_age);    

    // ----- INWARD MIGRATION FROM OUTSIDE UK CARD -----
    const [MIG01T03, MIG01T03_meta] = await readData("MIG01T03");

    const MIG01T03_updated = dateFormat(MIG01T03_meta.updated); // Format the last-update date nicely

    const row_inflows = MIG01T03
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Rest of World Inflows"])


    insertValue("outside-uk", row_inflows.toLocaleString());

    // ----- NET MIGRATION BY AGE AND SEX - HORIZONTAL BAR CHART -----
    const migration_chart_data = MIG01T02
        .filter(
            row => row["Year"] == latest_year &&
            row["Broad age band (7 cat)"] != "All" &&
            row["Sex"] != "All persons"
        );

    // Create the horizontal bar chart
    horizontalBarChart({
        data: migration_chart_data,
        value: "Total Net",
        bars: "Sex",
        categories: "Broad age band (7 cat)",
        canvas_id: "migration-bar",
        label_format: ","
    });

    horizontalBarChart({
        data: migration_chart_data,
        value: "Total Net",
        bars: "Sex",
        categories: "Broad age band (7 cat)",
        canvas_id: "migration-bar-expanded",
        label_format: ","
    });

    // ----- Net migration from and to the UK and the rest of the world -----
    // Extract years and net migration values for UK, Rest of World, and Total
    // Sort the years so the chart draws them in chronological order from left to right
    // const migration_years = Object.keys(MIG01T03.data[MIG01T03_stat]).sort();
    const migration_years = MIG01T03.map(col => col["Year"]);

    const lines = [
        MIG01T03.map(col => col["United Kingdom Net"]),
        MIG01T03.map(col => col["Rest of World Net"]),
        MIG01T03.map(col => col["Total Net"])
    ];

    // Create the line chart
    lineChart({
        years: migration_years,
        lines: lines,
        labels: ["United Kingdom Net", "Rest of World Net", "Total Net"],
        unit: "",
        canvas_id: "migration-line",
        showPoints: false
    });

    lineChart({
        years: migration_years,
        lines: lines,
        labels: ["United Kingdom Net", "Rest of World Net", "Total Net"],
        unit: "",
        canvas_id: "migration-line-expanded",
        showPoints: false
    });

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Create query parameters that specify what data to download
    // These tell the API: "I want the unrounded population figures"
    const pop_line_query = {
        rounded_unrounded: "Unrounded"
    };

    // These parameters request: "Latest year, all age groups, both male (1) and female (2)"
    const migration_bar_query = {
        "TLIST(A1)": latest_year, // Latest year only
        "broadage7": ["1, 2", "3", "4", "5", "6", "7"], // All age groups combined
        "Sex": ["1", "2"], // Genders (1=Male, 2=Female)
        "type": "TOTNET"
    };

    const migration_line_query = {
        "type9": ["UKNET", "ROWNET", "TOTNET"] // Request the three net migration types for the line chart
    }

    // Create download buttons that allow users to download the underlying data
    downloadButton("migration-bar-capture", "MIG01T02", MIG01T02_updated, migration_bar_query);
    downloadButton("migration-line-capture", "MIG01T03", MIG01T03_updated, migration_line_query);


    // ===== INFO BOXES - HELP AND METADATA =====
    // Populate the expandable info boxes with definitions and help text
    // Takes 3 arrays: box titles, and their corresponding content
    populateInfoBoxes(
        ["Definitions", "Source", "What does the data mean?"], // Box titles
        [
            // Content for "Definitions" box
            `<p>The layout for this page is built in the dashboard HTML template using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the cards and charts can adapt to different screen sizes and remain mobile friendly.</p>
            <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
            <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,
            
            // Content for "Source" box  
            `<p>The top cards and charts on this page are populated from this script using data from the NISRA Data Portal.</p>
            <p>The main datasets used are <strong>MIG01T02</strong> for net migration values and <strong>MIG01T03</strong> for the time-series view of migration flows.</p>
            <p>Values are selected by following the structure and column order shown in the relevant data matrix on the NISRA Data Portal.</p>`,

            // Content for "What does the data mean?" box
            `<p>This page uses two charting functions.</p>
            <p><strong>horizontalBarChart()</strong> is used for the age-by-sex migration chart and requires chart data, category labels, a canvas ID, and the label format.</p>
            <p><strong>lineChart()</strong> is used for the migration trend over time and requires the years, the values for each line, the line labels, the chart unit, and the canvas ID.</p>`
        ]
    );

}); // End of DOMContentLoaded event listener