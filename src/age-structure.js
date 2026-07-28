// ===== IMPORTS =====
// Import utility functions that will help build the page layout and populate it with data
// These are small, reusable functions stored in separate files to keep code organized

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Functions to build page structure
import { readData } from "./utils/read-data.js"; // Fetches data from external source (e.g., JSON file)
import { insertValue } from "./utils/insert-value.js"; // Places values into HTML elements on the page
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js"; // Handles year-related calculations
import { toTitleCase } from "./utils/to-title-case.js"; // Converts text to Title Case format
import { config } from "./config/config.js"; // Configuration settings
import { barChart } from "./charts/bar-chart.js";
import { lineChart } from "./charts/line-chart.js";
import { pyramidChart } from "./charts/pyramid-chart.js";
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
    const [median_age_data, median_age_meta] = await readData("MA01T01");
    const MA01T01_stat = "Median Age"; // This is the specific statistic within the dataset we want
    updateYearSpans(median_age_data); // Updates year labels on the page

    // Set a comparison year 25 years before the latest year
    const comparison_year = latest_year - 25;

    // Update all HTML elements with class="comparison-year" to show the comparison year
    const comparison_spans = document.getElementsByClassName("comparison-year");
    for (let span of comparison_spans) {
        span.textContent = comparison_year;
    }

    const median_age_updated = dateFormat(median_age_meta.updated); // Format the last-update date nicely

    // Step 2: Extract the value from the nested data structure
    // MA01T01.data is a large object organized like: {statistic_name: {year: {sex: value}}}
    // Example structure:
    //   MA01T01.data = {
    //     "Median Age": {
    //       2021: { "All persons": 40.1, "Males": 39.2, "Females": 41.0 },
    //       2022: { "All persons": 40.3, "Males": 39.4, "Females": 41.2 }
    //     }
    //   }

    const median_age = median_age_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["All persons"])


    // Step 3: Display on page
    insertValue("median-age", median_age);

    // ----- MEDIAN AGE CHANGE CARD -----
    // Calculate how much the median age has changed since the comparison year
    const comparison_age = median_age_data
        .filter(row => row["Year"] == comparison_year)
        .map(col => col["All persons"])

    const age_change_value = median_age - comparison_age;

    // Format the change with a plus sign if the value is positive
    const age_change = age_change_value > 0 ? `+${age_change_value.toFixed(1)}` : age_change_value.toFixed(1);
    insertValue("age-change", age_change);

    // ----- MEDIAN AGE PERCENTAGE CHANGE CARD -----
    // Calculate the percentage change in median age from last year to this year
    const last_age = median_age_data
        .filter(row => row["Year"] == last_year)
        .map(col => col["All persons"])

    const age_change_pct_value = ((median_age - last_age) / last_age) * 100;

    // Format the percentage change with a plus sign if the value is positive
    const age_change_pct = age_change_pct_value > 0 ? `+${age_change_pct_value.toFixed(1)}` : age_change_pct_value.toFixed(1);
    insertValue("age-change-pct", age_change_pct);

    // ----- AGE GROUP PERCENTAGE CARDS -----
    // Fetch a different dataset that has population breakdowns by broad age group and sex
    const [pop_age_data, pop_age_meta] = await readData("MYE01T03");
    const pop_age_updated = dateFormat(pop_age_meta.updated);

    // Calculate the percentage of the population aged 65 and over in the latest year
    const over_65_pop = pop_age_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (4 cat)"] == "Age 65+"
        )
        .map(col => col["All persons"])
    
    const all_pop  = pop_age_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (4 cat)"] == "All"
        )
        .map(col => col["All persons"])

    const over_65_pct = over_65_pop / all_pop * 100;
    insertValue("over-65", over_65_pct.toFixed(1)); // Display with 1 decimal place

    // Calculate the percentage of the population aged 0 to 15 in the comparison year

    const child_pop_comparison = pop_age_data
        .filter(row =>
            row["Year"] == comparison_year &&
            row["Broad age band (4 cat)"] == "Age 0-15"
        )
        .map(col => col["All persons"])

    const all_pop_comparison = pop_age_data
        .filter(row =>
            row["Year"] == comparison_year &&
            row["Broad age band (4 cat)"] == "All"
        )
        .map(col => col["All persons"])

    const child_pct_comparison = child_pop_comparison / all_pop_comparison * 100;
    insertValue("child-pct-comparison", child_pct_comparison.toFixed(1));

    // Calculate the percentage of the population aged 0 to 15 in the latest year
    const child_pop = pop_age_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (4 cat)"] == "Age 0-15"
        )
        .map(col => col["All persons"])

    const child_pct = child_pop / all_pop * 100;
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
    const age_chart_data = pop_age_data
        .filter(row =>
            bar_years.includes(row["Year"]) &&
            row["Broad age band (4 cat)"] != "All"
        ) 

    // Create the chart twice: once for the main view and once for the expanded/modal view
    barChart({
        data: age_chart_data,
        value: "All persons",
        categories: "Year",
        bars: "Broad age band (4 cat)",
        canvas_id: "age-bar",
        label_format: "%",
        stacked: true,
        align: "horizontal"
    });

    barChart({
        data: age_chart_data,
        value: "All persons",
        categories: "Year",
        bars: "Broad age band (4 cat)",
        canvas_id: "age-bar-expanded",
        label_format: "%",
        stacked: true,
        align: "horizontal"
    });

    // ===== POPULATION PYRAMID =====
    // Create a population pyramid showing the number of males and females at each age

    // Fetch a dataset that has population counts by single year of age and sex
    const [pop_single_age_data, pop_single_age_meta] = await readData("MYE01T08");
    const pop_single_age_updated = dateFormat(pop_single_age_meta.updated); // Format the last-update date nicely

    // Loop over each row of pop_single_age_data and replace "90" with "90+"
    pop_single_age_data.forEach(row => {
        const age = row["Single year of age"];
        if (age == 90) {
            row["Single year of age"] = "90+";
        }
    })

    const pop_chart_data = pop_single_age_data
        .filter(row => row["Single year of age"] != "All")

    // Create the population pyramid twice: once normal, once expanded
    pyramidChart({
        data: pop_chart_data,
        categories: "Single year of age",
        values: ["Females", "Males"],
        canvas_id: "pop-pyramid",
        year: latest_year
    });

    pyramidChart({
        data: pop_chart_data,
        categories: "Single year of age",
        values: ["Females", "Males"],
        canvas_id: "pop-pyramid-expanded",
        year: latest_year
    });

    // ===== LINE CHART - MEDIAN AGE TREND =====
    // Create a chart showing how median age has changed over the years

    // Get all the years available in the data
    // Object.keys() extracts all property names (the years) from the data object
    // .slice(-26) keeps only the last 26 items (approximately 26 years of data)
    // const median_line_years = Object.keys(MA01T01.data[MA01T01_stat]).slice(-26);

    const median_line_years = median_age_data
        .map(col => col["Year"])
        .slice(-26);

    const median_values = median_age_data
        .map(col => col["All persons"])
        .slice(-26);

    const median_male = median_age_data
        .map(col => col["Males"])
        .slice(-26);

    const median_female = median_age_data
        .map(col => col["Females"])
        .slice(-26)

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
    lineChart({
        years: median_line_years, // The x-axis values (years)
        lines: line_chart_lines, // The data values for each line
        labels: line_chart_labels, // The legend labels
        canvas_id: "median-line", // Which HTML element to draw the chart in
        showPoints: false
    });

    lineChart({
        years: median_line_years, // The x-axis values (years)
        lines: line_chart_lines, // The data values for each line
        labels: line_chart_labels, // The legend labels
        canvas_id: "median-line-expanded", // Which HTML element to draw the chart in
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
    downloadButton("age-bar-capture", "MYE01T03", pop_age_updated, age_chart_query);
    downloadButton("pop-pyramid-capture", "MYE01T08", pop_single_age_updated, pop_pyramid_query);
    downloadButton("median-line-capture", "MA01T01", median_age_updated, median_line_query);

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
            `<p>The top cards on this page are populated from this script using data from the NISRA Data Portal.</p>
            <p>The main datasets used are <strong>MA01T01</strong> for median age, <strong>MYE01T03</strong> for age-group percentages, and <strong>MYE01T08</strong> for the population pyramid.</p>
            <p>Values are selected by following the structure and column order shown in the relevant data matrix on the NISRA Data Portal.</p>`,

            // Content for "What does the data mean?" box
            `<p>This page uses three charting functions.</p>
            <p><strong>horizontalBarChart()</strong> is used for the age-group trend chart and requires chart data, category labels, a canvas ID, and an optional stacked flag.</p>
            <p><strong>pyramidChart()</strong> is used for the population pyramid and requires the male and female values, age labels, and the canvas ID where the chart should appear.</p>
            <p><strong>lineChart()</strong> is used for the median age trend and requires the years, the values for each line, the line labels, and the canvas ID.</p>`
        ]
    );

}); // End of DOMContentLoaded event listener

