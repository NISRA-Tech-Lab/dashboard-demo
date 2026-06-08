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

    // ----- MEDIAN AGE CARD -----
    // Step 1: Fetch the data from the data source (JSON file or database)
    // MA01T01 is the code for the median age dataset
    // "await" pauses execution until the data finishes loading
    const MA01T01 = await readData("MA01T01");
    const MA01T01_stat = "Median Age"; // This is the specific statistic within the dataset we want
    updateYearSpans(MA01T01, MA01T01_stat); // Updates year labels on the page

    // Set a comparison year 25 years before the latest year
    const comparison_year = latest_year - 25;

    // Update all HTML elements with class="comparison-year" to show the comparison year
    const comparison_spans = document.getElementsByClassName("comparison-year");
    for (let span of comparison_spans) {
        span.textContent = comparison_year;
    }

    const MA01T01_updated = dateFormat(MA01T01.updated); // Format the last-update date nicely

    // Step 2: Extract the value from the nested data structure
    // MA01T01.data is a large object organized like: {statistic_name: {year: {sex: value}}}
    // Example structure:
    //   MA01T01.data = {
    //     "Median Age": {
    //       2021: { "All persons": 40.1, "Males": 39.2, "Females": 41.0 },
    //       2022: { "All persons": 40.3, "Males": 39.4, "Females": 41.2 }
    //     }
    //   }
    const median_age = MA01T01.data[MA01T01_stat][latest_year]["All persons"];

    // Step 3: Display on page
    insertValue("median-age", median_age);

    // ----- MEDIAN AGE CHANGE CARD -----
    // Calculate how much the median age has changed since the comparison year
    const comparison_age = MA01T01.data[MA01T01_stat][comparison_year]["All persons"];
    const age_change_value = median_age - comparison_age;

    // Format the change with a plus sign if the value is positive
    const age_change = age_change_value > 0 ? `+${age_change_value.toFixed(1)}` : age_change_value.toFixed(1);
    insertValue("age-change", age_change);

    // ----- MEDIAN AGE PERCENTAGE CHANGE CARD -----
    // Calculate the percentage change in median age from last year to this year
    const last_age = MA01T01.data[MA01T01_stat][last_year]["All persons"];
    const age_change_pct_value = ((median_age - last_age) / last_age) * 100;

    // Format the percentage change with a plus sign if the value is positive
    const age_change_pct = age_change_pct_value > 0 ? `+${age_change_pct_value.toFixed(1)}` : age_change_pct_value.toFixed(1);
    insertValue("age-change-pct", age_change_pct);

    // ----- AGE GROUP PERCENTAGE CARDS -----
    // Fetch a different dataset that has population breakdowns by broad age group and sex
    const MYE01T03 = await readData("MYE01T03");
    const MYE01T03_stat = "Mid-year population estimate";
    const MYE01T03_updated = dateFormat(MYE01T03.updated);

    // Calculate the percentage of the population aged 65 and over in the latest year
    const over_65_pct = MYE01T03.data[MYE01T03_stat][latest_year]["Age 65+"]["All persons"] / MYE01T03.data[MYE01T03_stat][latest_year]["All"]["All persons"] * 100;
    insertValue("over-65", over_65_pct.toFixed(1)); // Display with 1 decimal place

    // Calculate the percentage of the population aged 0 to 15 in the comparison year
    const child_pct_comparison = MYE01T03.data[MYE01T03_stat][comparison_year]["Age 0-15"]["All persons"] / MYE01T03.data[MYE01T03_stat][comparison_year]["All"]["All persons"] * 100;
    insertValue("child-pct-comparison", child_pct_comparison.toFixed(1));

    // Calculate the percentage of the population aged 0 to 15 in the latest year
    const child_pct = MYE01T03.data[MYE01T03_stat][latest_year]["Age 0-15"]["All persons"] / MYE01T03.data[MYE01T03_stat][latest_year]["All"]["All persons"] * 100;
    insertValue("child-pct", child_pct.toFixed(1));

    // ===== HORIZONTAL BAR CHART - AGE GROUP CHANGE OVER TIME =====
    // Create a chart showing the population share of different age groups over time

    // Build a list of years from the comparison year to the latest year
    // The "if" statement keeps selected years only, so the chart is easier to read
    let bar_years = [];
    for (let i = comparison_year; i <= latest_year; i ++) {
        if (i % 5 == 4) {
            bar_years.push(i);
        }
    }

    // Create empty arrays to hold the percentage values for each age group
    let under_15 = [];
    let age_16_to_64 = [];
    let over_65 = [];

    // ===== WHY USE A LOOP HERE? =====
    // We need to calculate values for several years and collect them into arrays
    // A loop is perfect for repetitive tasks like this
    // Instead of writing:
    //   under_15[0] = data[2004]
    //   under_15[1] = data[2009]
    //   ... (this would be tedious with many years!)
    // We use a loop to do it automatically
    for (let i = 0; i < bar_years.length; i++) {
        const bar_year = bar_years[i];

        // Get the total population for this year so each age group can be converted into a percentage
        const pop_total = MYE01T03.data[MYE01T03_stat][bar_year]["All"]["All persons"];
        
        // Calculate each age group's percentage of the total population and add it to the relevant array
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

    // Create the chart twice: once for the main view and once for the expanded/modal view
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

    // ===== POPULATION PYRAMID =====
    // Create a population pyramid showing the number of males and females at each age

    // Fetch a dataset that has population counts by single year of age and sex
    const MYE01T08 = await readData("MYE01T08");
    const MYE01T08_stat = "Mid-year population estimate";
    const MYE01T08_updated = dateFormat(MYE01T08.updated); // Format the last-update date nicely

    // Get all available ages from the latest year, excluding the summary "All" row
    const ages = Object.keys(MYE01T08.data[MYE01T08_stat][latest_year])
        .filter(x => x != "All");
    
    // Create empty arrays to hold male and female population values
    let male_values = [];
    let female_values = [];

    // Use a loop to extract the male and female population value for each age
    // This keeps the same logic for every age and avoids writing the same code over and over
    for (let i = 0; i < ages.length; i ++) {
        const age = ages[i];
        male_values.push(MYE01T08.data[MYE01T08_stat][latest_year][age]["Males"]);
        female_values.push(MYE01T08.data[MYE01T08_stat][latest_year][age]["Females"]);
    }

    // Prepare data in the format expected by createPyramidChart
    const pop_chart_data = {
        "Males": male_values,
        "Females": female_values
    };

    // Create the population pyramid twice: once normal, once expanded
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

    // ===== LINE CHART - MEDIAN AGE TREND =====
    // Create a chart showing how median age has changed over the years

    // Get all the years available in the data
    // Object.keys() extracts all property names (the years) from the data object
    // .slice(-26) keeps only the last 26 items (approximately 26 years of data)
    const median_line_years = Object.keys(MA01T01.data[MA01T01_stat]).slice(-26);
    
    // Create empty arrays to hold the median age values for all persons, males and females
    let median_values = [];
    let median_male = [];
    let median_female = [];

    // Use a loop to extract one value from each year and collect them into arrays
    for (let i = 0; i < median_line_years.length; i ++) {
        const year = median_line_years[i];
        median_values.push(MA01T01.data[MA01T01_stat][year]["All persons"]);
        median_male.push(MA01T01.data[MA01T01_stat][year]["Males"]);
        median_female.push(MA01T01.data[MA01T01_stat][year]["Females"]);
    }

    // Organize the data for the chart function
    // Each array becomes one line on the chart
    const line_chart_lines = [
        median_values,
        median_male,
        median_female
    ];

    // Labels for each line (shown in the legend)
    const line_chart_labels = [
        "Median age",
        "Males",
        "Females"
    ];

    // Create the line chart
    createLineChart({
        years: median_line_years, // The x-axis values (years)
        lines: line_chart_lines, // The data values for each line
        labels: line_chart_labels, // The legend labels
        canvas_id: "median-line", // Which HTML element to draw the chart in
        showPoints: false
    });

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Create query parameters that specify what data to download

    // These parameters request: selected years and all persons for the broad age group chart
    const age_chart_query = {
        "TLIST(A1)": bar_years.map(String),
        "Sex": "All"
    };

    // These parameters request: latest year, both male (1) and female (2)
    const pop_pyramid_query = {
        "TLIST(A1)": latest_year,
        "Sex": ["1", "2"]
    };

    // These parameters request: all years shown in the median age line chart
    const median_line_query = {
        "TLIST(A1)": median_line_years
    };

    // Create download buttons that allow users to download the underlying data
    downloadButton("age-bar-capture", "MYE01T03", MYE01T03_updated, age_chart_query);
    downloadButton("pop-pyramid-capture", "MYE01T08", MYE01T08_updated, pop_pyramid_query);
    downloadButton("median-line-capture", "MA01T01", MA01T01_updated, median_line_query);

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

