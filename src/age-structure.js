// ===== IMPORTS =====
// Import utility functions that will help build the page layout and populate it with data
// These are small, reusable functions stored in separate files to keep code organized

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Functions to build page structure
import { readData } from "./utils/read-data.js"; // Fetches data from external source (e.g., JSON file)
import { insertValue } from "./utils/insert-value.js"; // Places values into HTML elements on the page
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js"; // Handles year-related calculations
import { toTitleCase } from "./utils/to-title-case.js"; // Converts text to Title Case format
import { config } from "./config/config.js"; // Configuration settings
import { createBarChart, createHorizontalBarChart, createLineChart, createPieChart, createPyramidChart } from "./utils/charts.js"; // Creates different chart types
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
    await insertHead("Age structure"); // "await" pauses here until the page head is ready
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
    const MA01T01 = await readData("MA01T01");
    const MA01T01_stat = "Median Age"; // This is the specific statistic within the dataset we want
    updateYearSpans(MA01T01, MA01T01_stat); // Updates year labels on the page

    const comparison_year = latest_year - 25;
    const coparison_spans = document.getElementsByClassName("comparison-year");
    for (let span of coparison_spans) {
        span.textContent = comparison_year;
    }

    const MA01T01_updated = dateFormat(MA01T01.updated); // Format the last-update date nicely
    
    // Step 2: Extract the value from the nested data structure
    // MIG01T02.data is a large object organized like: {statistic_name: {year: {metric: value}}}
    // Example structure:
    //   MIG01T02.data = {
    //     "Net Migration": {
    //       2021: { "All": { "All persons": { "Total Net": 12345 } } },
    //       2022: { "All": { "All persons": { "Total Net": 23456 } } }
    //     }
    //   }

    const median_age = MA01T01.data[MA01T01_stat][latest_year]["All persons"];

    insertValue("median-age", median_age); // Places the median age value into the HTML element with id="age-change"
    
    const comparison_age = MA01T01.data[MA01T01_stat][comparison_year]["All persons"];
    const age_change_value = median_age - comparison_age;
    const age_change = age_change_value > 0 ? `+${age_change_value.toFixed(1)}` : age_change_value.toFixed(1); // Add "+" sign if positive
    insertValue("age-change", age_change); // Calculate change and insert into page

    const last_age = MA01T01.data[MA01T01_stat][last_year]["All persons"];
    const age_change_pct_value = ((median_age - last_age) / last_age) * 100;
    const age_change_pct = age_change_pct_value > 0 ? `+${age_change_pct_value.toFixed(1)}` : age_change_pct_value.toFixed(1); // Add "+" sign if positive
    insertValue("age-change-pct", age_change_pct); // Calculate percentage change and insert into page



    const MYE01T03 = await readData("MYE01T03");
    const MYE01T03_stat = "Mid-year population estimate";
    const MYE01T03_updated = dateFormat(MYE01T03.updated);
    const over_65_pct = MYE01T03.data[MYE01T03_stat][latest_year]["Age 65+"]["All persons"] / MYE01T03.data[MYE01T03_stat][latest_year]["All"]["All persons"] * 100;
    
    insertValue("over-65", over_65_pct.toFixed(1)); // Insert percentage of population aged 65 and over into page

    const child_pct_comparison = MYE01T03.data[MYE01T03_stat][comparison_year]["Age 0-15"]["All persons"] / MYE01T03.data[MYE01T03_stat][comparison_year]["All"]["All persons"] * 100;
    insertValue("child-pct-comparison", child_pct_comparison.toFixed(1)); // Insert percentage of population aged 0-15 in comparison year into page

    const child_pct = MYE01T03.data[MYE01T03_stat][latest_year]["Age 0-15"]["All persons"] / MYE01T03.data[MYE01T03_stat][latest_year]["All"]["All persons"] * 100;
    insertValue("child-pct", child_pct.toFixed(1)); // Insert percentage of population aged 0-15 in latest year into page


    let bar_years = [];
    for (let i = comparison_year; i <= latest_year; i ++) {
        if (i % 5 == 4) {
            bar_years.push(i);
        }
    }

    let under_15 = [];
    let age_16_to_64 = [];
    let over_65 = [];

    for (let i = 0; i < bar_years.length; i++) {
        const bar_year = bar_years[i];
        const pop_total = MYE01T03.data[MYE01T03_stat][bar_year]["All"]["All persons"];
        
        under_15.push((MYE01T03.data[MYE01T03_stat][bar_year]["Age 0-15"]["All persons"] / pop_total * 100).toFixed(1));
        age_16_to_64.push(((MYE01T03.data[MYE01T03_stat][bar_year]["Age 16-39"]["All persons"] + MYE01T03.data[MYE01T03_stat][bar_year]["Age 40-64"]["All persons"]) / pop_total * 100).toFixed(1));
        over_65.push((MYE01T03.data[MYE01T03_stat][bar_year]["Age 65+"]["All persons"] / pop_total * 100).toFixed(1));        
        
    }

    // Prepare data in the format expected by createHorizontalBarChart
    const age_chart_data = {
        "0 to 15 years": under_15,
        "16 to 64 years": age_16_to_64,
        "65 years and over": over_65
    };

    // Create the horizontal bar chart
    createHorizontalBarChart({
        chart_data: age_chart_data,
        categories: bar_years,
        canvas_id: "age-bar",
        label_format: ",",
        stacked: true
    });

    createHorizontalBarChart({
        chart_data: age_chart_data,
        categories: bar_years,
        canvas_id: "age-bar-expanded",
        label_format: ",",
        stacked: true
    });

    // Population Pyramid
    const MYE01T08 = await readData("MYE01T08");
    const MYE01T08_stat = "Mid-year population estimate";
    const MYE01T08_updated = dateFormat(MYE01T08.updated); // Format the last-update date nicely

    let ages = Object.keys(MYE01T08.data[MYE01T08_stat][latest_year])
        .filter(x => x != "All");
    
    let male_values = [];
    let female_values = [];

    for (let i = 0; i < ages.length; i ++) {
        const age = ages[i];
        male_values.push(MYE01T08.data[MYE01T08_stat][latest_year][age]["Males"]);
        female_values.push(MYE01T08.data[MYE01T08_stat][latest_year][age]["Females"]);
    }

    const pop_chart_data = {
        "Males": male_values,
        "Females": female_values
    }

    createPyramidChart({
        chart_data: pop_chart_data,
        categories: ages.map(x => x === "90" ? "90+" : x),
        canvas_id: "pop-pyramid",
        year: latest_year
    });

    createPyramidChart({
        chart_data: pop_chart_data,
        categories: ages.map(x => x === "90" ? "90+" : x),
        canvas_id: "pop-pyramid-expanded",
        year: latest_year
    });

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Create query parameters that specify what data to download
    // These tell the API: "I want the unrounded population figures"
    const age_chart_query = {
        "TLIST(A1)": bar_years.map(String),
        "Sex": "All"
    };

    const pop_pyramid_query = {
        "TLIST(A1)": latest_year,
        "Sex": ["1", "2"]
    }

    // Create download buttons that allow users to download the underlying data
    downloadButton("age-bar-capture", "MYE01T03", MYE01T03_updated, age_chart_query);
    downloadButton("pop-pyramid-capture", "MYE01T08", MYE01T08_updated, pop_pyramid_query);

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