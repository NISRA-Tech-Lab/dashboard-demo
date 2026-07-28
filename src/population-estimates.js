// ===== IMPORTS =====
// Import utility functions that will help build the page layout and populate it with data
// These are small, reusable functions stored in separate files to keep code organized

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Functions to build page structure
import { readData } from "./utils/read-data.js"; // Fetches data from external source (e.g., JSON file)
import { insertValue } from "./utils/insert-value.js"; // Places values into HTML elements on the page
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js"; // Handles year-related calculations
import { toTitleCase } from "./utils/to-title-case.js"; // Converts text to Title Case format
import { config } from "./config/config.js"; // Configuration settings
import { lineChart } from "./charts/line-chart.js";
import { pieChart } from "./charts/pie-chart.js";
import { insertExpandButtons } from "./utils/expand-buttons.js"; // Adds expandable sections
import { downloadButton } from "./utils/download-button.js"; // Creates download buttons for data
import { dateFormat } from "./utils/date-format.js"; // Formats dates nicely
import { populateInfoBoxes } from "./utils/info-boxes.js"; // Populates info/help boxes

// ===== MAIN EXECUTION =====
// This runs AFTER the entire HTML page has loaded (DOMContentLoaded event)
// The "async" keyword allows us to use "await" inside this function to pause and wait for data to load
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // These functions insert the header, footer, navigation buttons, etc. into the HTML
    await insertHead("Population estimates"); // "await" pauses here until the page head is ready
    insertHeader(); // Adds header to the page
    insertNavButtons(); // Adds navigation buttons
    insertFooter(); // Adds footer to the page
    insertExpandButtons(); // Adds buttons that allow sections to expand/collapse

    // ===== POPULATE PAGE WITH DATA =====
    // This section: fetches data → extracts specific values → calculates if needed → displays on page

    // ----- TOTAL POPULATION CARD -----
    // Step 1: Fetch the data from the data source (JSON file or database)
    // MYE01T05 is the code for "Population totals" dataset
    // "await" pauses execution until the data finishes loading
    const MYE01T05 = await readData("MYE01T05");
    const MYE01T05_stat = "Population totals"; // This is the specific statistic within the dataset we want
    updateYearSpans(MYE01T05, MYE01T05_stat); // Updates year labels on the page

    const MYE01T05_updated = dateFormat(MYE01T05.updated); // Format the last-update date nicely

    // Step 2: Extract the value from the nested data structure
    // MYE01T05.data is a large object organized like: {statistic_name: {year: {metric: value}}}
    // Example structure:
    //   MYE01T05.data = {
    //     "Population totals": {
    //       2021: { "Unrounded": 1234567, "Rounded": 1234570 },
    //       2022: { "Unrounded": 1245678, "Rounded": 1245680 }
    //     }
    //   }
    const pop_total = (MYE01T05.data[MYE01T05_stat][latest_year]["Unrounded"]);
    
    // Step 3: Display on page - toLocaleString() adds commas (e.g., 1,234,567)
    insertValue("pop-total", pop_total.toLocaleString());

    // ----- POPULATION CHANGE CARD -----
    // Calculate how much the population changed from last year to this year
    const pop_total_last = MYE01T05.data[MYE01T05_stat][last_year]["Unrounded"];
    // Formula: (current - previous) / previous * 100 = percent change
    const pop_change_value = (pop_total - pop_total_last) / pop_total_last * 100;
    
    // Format the change with an arrow symbol (+ for increase, - for decrease, no symbol for zero)  
    const pop_change = pop_change_value > 0 ? `+ ${pop_change_value.toFixed(1)}` : pop_change_value < 0 ? `- ${Math.abs(pop_change_value).toFixed(1)}` : `${pop_change_value.toFixed(1)}`;

    insertValue("pop-change", pop_change); // Display the formatted change on the page

    // ----- GENDER BREAKDOWN CARDS (Female and Male) -----
    // Fetch a different dataset that has gender breakdowns
    const MYE01T03 = await readData("MYE01T03");
    const MYE01T03_stat = "Mid-year population estimate";
    const MYE01T03_updated = dateFormat(MYE01T03.updated);

    // Extract female population and calculate percentage of total
    // The data structure is: data[statistic][year]["All"]["Females"]
    // "All" means all age groups combined
    const female_pop = MYE01T03.data[MYE01T03_stat][latest_year]["All"]["Females"];
    const female_pop_pct = female_pop / pop_total * 100; // Divide by total to get percentage
    insertValue("pop-female", female_pop_pct.toFixed(1)); // Display with 1 decimal place

    // Same process for male population
    const male_pop = MYE01T03.data[MYE01T03_stat][latest_year]["All"]["Males"];
    const male_pop_pct = male_pop / pop_total * 100;
    insertValue("pop-male", male_pop_pct.toFixed(1));

    // ----- AVERAGE ANNUAL CHANGE OVER 10 YEARS -----
    // Look back 10 years and calculate average yearly change
    const pop_total_first = MYE01T05.data[MYE01T05_stat][latest_year - 10]["Unrounded"];
    // Formula: ((current - 10yr_ago) / 10yr_ago) / 10 * 100 = average annual percent change
    const pop_change_10yr_value = (pop_total - pop_total_first) / pop_total_first / 10 * 100;
    
    // Format with arrow symbol (+ for increase, - for decrease, no symbol for zero)
    const pop_change_10yr = pop_change_10yr_value > 0 ? `+ ${pop_change_10yr_value.toFixed(1)}` : pop_change_10yr_value < 0 ? `- ${Math.abs(pop_change_10yr_value).toFixed(1)}` : `${pop_change_10yr_value.toFixed(1)}`;
    insertValue("pop-change-10yr", pop_change_10yr);

    // ===== LINE CHART - HISTORICAL TREND =====
    // Create a chart showing how population has changed over the years

    // Get all the years available in the data
    // Object.keys() extracts all property names (the years) from the data object
    // .slice(-26) keeps only the last 26 items (approximately 26 years of data)
    const pop_line_years = Object.keys(MYE01T05.data[MYE01T05_stat]).slice(-26);

    // ===== WHY USE A LOOP HERE? =====
    // We need to extract one value from each year and collect them into an array
    // A loop is perfect for repetitive tasks like this
    // Instead of writing:
    //   pop_values[0] = data[2015]
    //   pop_values[1] = data[2016]
    //   ... (this would be tedious with 26 years!)
    // We use a loop to do it automatically
    let pop_values = []; // Start with an empty array to hold our values
    for (let i = 0; i < pop_line_years.length; i++) { // i starts at 0, increases by 1 each time
        const year = pop_line_years[i]; // Get the year at position i
        // Extract the population value for this year
        const value = MYE01T05.data[MYE01T05_stat][year]["Unrounded"];
        pop_values.push(value); // Add this value to the end of our array
    }
    // After the loop, pop_values contains: [value_yr1, value_yr2, value_yr3, ...]

    // Organize the data for the chart function
    // We put our values array inside another array because the chart can show multiple lines
    const line_chart_lines = [
        pop_values // This is the first (and only) line on the chart
    ];
    // Labels for each line (shown in the legend)
    const line_chart_labels = ["Mid-year population estimate"];

    // Create the chart twice: once for the main view and once for the expanded/modal view
    lineChart({
        years: pop_line_years, // The x-axis values (years)
        lines: line_chart_lines, // The data values for each line
        labels: line_chart_labels, // The legend labels
        canvas_id: "pop-line", // Which HTML element to draw the chart in
    });

    lineChart({
        years: pop_line_years,
        lines: line_chart_lines,
        labels: line_chart_labels,
        canvas_id: "pop-line-expanded" // The expanded version in a modal/dialog
    });

    // ===== PIE CHART - GENDER BREAKDOWN =====
    // Create a pie chart showing the split between female and male population

    // Create arrays with the category labels and their corresponding values
    const genders = ["Female", "Male"]; // Labels for the pie slices
    // Extract the actual population numbers for females and males from the data
    const pie_values = [
        MYE01T03.data[MYE01T03_stat][latest_year]["All"]["Females"],
        MYE01T03.data[MYE01T03_stat][latest_year]["All"]["Males"]
    ];

    // Create the pie chart twice: once normal, once expanded
    pieChart({
        labels: genders, // What to label each slice
        values: pie_values, // The size of each slice (based on population numbers)
        canvas_id: "pop-pie" // Which HTML element to draw into
    });

    pieChart({
        labels: genders,
        values: pie_values,
        canvas_id: "pop-pie-expanded" // The expanded version
    });

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Create query parameters that specify what data to download
    // These tell the API: "I want the unrounded population figures"
    const pop_line_query = {
        rounded_unrounded: "Unrounded"
    };

    // These parameters request: "Latest year, all age groups, both male (1) and female (2)"
    const pop_pie_query = {
        "TLIST(A1)": latest_year, // Latest year only
        "broadage4": "All", // All age groups combined
        "Sex": ["1", "2"] // Genders (1=Male, 2=Female)
    };

    // Create download buttons that allow users to download the underlying data
    downloadButton("pop-line-capture", "MYE01T05", MYE01T05_updated, pop_line_query);
    downloadButton("pop-pie-capture", "MYE01T03", MYE01T03_updated, pop_pie_query);

    // ===== INFO BOXES - HELP AND METADATA =====
    // Populate the expandable info boxes with definitions and help text
    // Takes 3 arrays: box titles, and their corresponding content
    populateInfoBoxes(
        ["Definitions", "Source", "What does the data mean?"], // Box titles
        [
            // Content for "Definitions" box
            `<p>The page layout is built in <code>population-estimates.html</code> using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the content can adapt to different screen sizes and remain mobile friendly.</p>
            <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
            <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,
            
            // Content for "Source" box  
            `<p>The top cards on this page are populated from this script using data from the NISRA Data Portal.</p>
            <p>The main datasets used are <strong>MYE01T05</strong> for population totals and <strong>MYE01T03</strong> for the gender breakdown. The card values also use <strong>COPC01T01</strong> for the components of population change and <strong>MA01T01</strong> for median age.</p>
            <p>Values are selected by following the structure and column order shown in the data matrix on the NISRA Data Portal, so the correct row and column are pulled for each card.</p>`,

            // Content for "What does the data mean?" box
            `<p>This page uses two charting functions.</p>
            <p><strong>lineChart()</strong> is used to draw the historical population trend and requires the years to plot on the x-axis, the population values for each line, the labels for each line, and the canvas ID where the chart should appear.</p>
            <p><strong>pieChart()</strong> is used for the gender breakdown and requires the chart labels, the values for each slice, and the canvas ID for the chart container.</p>`
        ]
    );

}); // End of DOMContentLoaded event listener