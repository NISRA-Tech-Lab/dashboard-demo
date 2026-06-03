// ===== IMPORTS =====
// Import utility functions that will help build the page layout and populate it with data
// These are small, reusable functions stored in separate files to keep code organized

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Functions to build page structure
import { readData } from "./utils/read-data.js"; // Fetches data from external source (e.g., JSON file)
import { insertValue } from "./utils/insert-value.js"; // Places values into HTML elements on the page
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js"; // Handles year-related calculations
import { toTitleCase } from "./utils/to-title-case.js"; // Converts text to Title Case format
import { config } from "./config/config.js"; // Configuration settings
import { createBarChart, createHorizontalBarChart, createLineChart, createPieChart } from "./utils/charts.js"; // Creates different chart types
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
    const MIG01T02 = await readData("MIG01T02");
    const MIG01T02_stat = "Net Migration"; // This is the specific statistic within the dataset we want
    updateYearSpans(MIG01T02, MIG01T02_stat); // Updates year labels on the page

    const MIG01T02_updated = dateFormat(MIG01T02.updated); // Format the last-update date nicely

    // Step 2: Extract the value from the nested data structure
    // MIG01T02.data is a large object organized like: {statistic_name: {year: {metric: value}}}
    // Example structure:
    //   MIG01T02.data = {
    //     "Net Migration": {
    //       2021: { "All": { "All persons": { "Total Net": 12345 } } },
    //       2022: { "All": { "All persons": { "Total Net": 23456 } } }
    //     }
    //   }

    const pop_change_value = MIG01T02.data[MIG01T02_stat][latest_year]["All"]["All persons"]["Total Net"];
    
    // Format the net migration value with a plus or minus sign and commas
    const pop_change = pop_change_value > 0 ? `+ ${pop_change_value.toLocaleString()}` : pop_change_value < 0 ? `- ${Math.abs(pop_change_value).toLocaleString()}` : `${pop_change_value}`;

    // Step 3: Display on page - toLocaleString() adds commas (e.g., 1,234,567)
    insertValue("pop-change", pop_change.toLocaleString());

    // ----- PERCENTAGE POPULATION CHANGE CARD -----
    // Calculate how much the population changed from last year to this year
    const pop_change_last = MIG01T02.data[MIG01T02_stat][last_year]["All"]["All persons"]["Total Net"];
    const pop_change_pct_value = ((pop_change_value - pop_change_last) / Math.abs(pop_change_last)) * 100; // Percentage change formula
    const pop_change_pct = pop_change_pct_value > 0 ? `+ ${pop_change_pct_value.toFixed(0)}` : pop_change_pct_value < 0 ? `- ${Math.abs(pop_change_pct_value).toFixed(0)}` : `${pop_change_pct_value.toFixed(0)}`;
    insertValue("pop-change-pct", pop_change_pct);

    // ----- LARGEST NET LOSS/GAIN CARDS -----
    // Get the list of age groups from the current year, excluding the summary "All" row
    // These age groups will be used for the chart labels and for finding the largest gain/loss
    const age_groups = Object.keys(MIG01T02.data[MIG01T02_stat][latest_year]).filter(key => key !== "All");
    let age_nets = {};

    // Use a loop to extract the net migration value for each age group
    // This keeps the same logic for every group and avoids writing the same code over and over
    for (let i = 0; i < age_groups.length; i++) {
        const age_group = age_groups[i];
        const net_value = MIG01T02.data[MIG01T02_stat][latest_year][age_group]["All persons"]["Total Net"];
        age_nets[age_group] = net_value;
    }

    insertValue("gain-age", getMaxEntry(age_nets).key);
    insertValue("loss-age", getMaxEntry(age_nets, "min").key);    

    // ----- INWARD MIGRATION FROM OUTSIDE UK CARD -----
    const MIG01T03 = await readData("MIG01T03");
    const MIG01T03_stat = "Migration Flows";

    const MIG01T03_updated = dateFormat(MIG01T03.updated); // Format the last-update date nicely
    // Find the latest year key in the migration flows dataset
    const MIG01T03_latest_year = Object.keys(MIG01T03.data[MIG01T03_stat]).slice(-1)[0];
    
    const row_inflows = MIG01T03.data[MIG01T03_stat][MIG01T03_latest_year]["Rest of World Inflows"];

    insertValue("outside-uk", row_inflows.toLocaleString());

    // ----- NET MIGRATION BY AGE AND SEX - HORIZONTAL BAR CHART -----
    // Extract data for Males and Females by age group
    const female_migration_by_age = [];
    const male_migration_by_age = [];

    for (let i = 0; i < age_groups.length; i++) {
        const age_group = age_groups[i];
        const female_net = MIG01T02.data[MIG01T02_stat][latest_year][age_group]["Females"]["Total Net"];
        const male_net = MIG01T02.data[MIG01T02_stat][latest_year][age_group]["Males"]["Total Net"];
        
        female_migration_by_age.push(female_net);
        male_migration_by_age.push(male_net);
    }

    // Prepare data in the format expected by createHorizontalBarChart
    const migration_chart_data = {
        "Females": female_migration_by_age,
        "Males": male_migration_by_age
    };

    // Create the horizontal bar chart
    createHorizontalBarChart({
        chart_data: migration_chart_data,
        categories: age_groups,
        canvas_id: "migration-bar",
        label_format: ","
    });

    createHorizontalBarChart({
        chart_data: migration_chart_data,
        categories: age_groups,
        canvas_id: "migration-bar-expanded",
        label_format: ","
    });

    // ----- Net migration from and to the UK and the rest of the world -----
    // Extract years and net migration values for UK, Rest of World, and Total
    // Sort the years so the chart draws them in chronological order from left to right
    const migration_years = Object.keys(MIG01T03.data[MIG01T03_stat]).sort();
    
    const uk_net_line = [];
    const row_net_line = [];
    const total_net_line = [];

    // ===== WHY USE A LOOP HERE? =====
    // We need to extract one value from each year and collect them into arrays
    // A loop is perfect for repetitive tasks like this
    // Instead of writing:
    //   uk_net_line[0] = data[2015]
    //   uk_net_line[1] = data[2016]
    //   ... (this would be tedious with many years!)
    // We use a loop to do it automatically
    for (let i = 0; i < migration_years.length; i++) {
        const year = migration_years[i];
        
        uk_net_line.push(MIG01T03.data[MIG01T03_stat][year]["United Kingdom Net"]);
        row_net_line.push(MIG01T03.data[MIG01T03_stat][year]["Rest of World Net"]);
        total_net_line.push(MIG01T03.data[MIG01T03_stat][year]["Total Net"]);
    }

    // Create the line chart
    createLineChart({
        years: migration_years,
        lines: [uk_net_line, row_net_line, total_net_line],
        labels: ["United Kingdom Net", "Rest of World Net", "Total Net"],
        unit: "",
        canvas_id: "migration-line",
        showPoints: false
    });

    createLineChart({
        years: migration_years,
        lines: [uk_net_line, row_net_line, total_net_line],
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

}); // End of DOMContentLoaded event listener