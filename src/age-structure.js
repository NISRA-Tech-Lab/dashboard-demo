// ===== IMPORTS =====
// Import the utility functions used to build the page, load datasets,
// create charts, and insert values into the HTML
//
// Keeping these functions in separate modules makes this script easier to read
// and allows the same functionality to be reused across other pages

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Builds the shared page structure
import { readData } from "./utils/read-data.js"; // Loads a matrix CSV together with its associated metadata
import { insertValue } from "./utils/insert-value.js"; // Inserts a value into a specified HTML element
import { latest_year, updateYearSpans, last_year } from "./utils/update-years.js"; // Provides and updates year-related values
import { barChart } from "./charts/bar-chart.js"; // Creates vertical or horizontal bar charts
import { lineChart } from "./charts/line-chart.js"; // Creates line charts
import { pyramidChart } from "./charts/pyramid-chart.js"; // Creates population pyramid charts
import { insertExpandButtons } from "./utils/expand-buttons.js"; // Adds controls for expanding chart sections
import { downloadButton } from "./utils/download-button.js"; // Adds buttons for downloading the underlying data
import { dateFormat } from "./utils/date-format.js"; // Formats dataset update dates for display
import { populateInfoBoxes } from "./utils/info-boxes.js"; // Populates expandable information boxes

// ===== MAIN EXECUTION =====
// This function runs after the initial HTML document has finished loading
//
// Declaring the function as "async" allows await to be used while datasets
// and shared page components are loaded
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // Insert the shared elements used across the website, including the page head,
    // header, navigation buttons, footer, and chart expansion controls
    await insertHead("Age structure"); // Wait until the document head has been prepared
    insertHeader(); // Adds the page header
    insertNavButtons(); // Adds the navigation buttons
    insertFooter(); // Adds the page footer
    insertExpandButtons(); // Adds controls for opening expanded chart views

    // ===== POPULATE PAGE WITH DATA =====
    // Each matrix is now stored in two parts:
    //
    //   1. A CSV file containing observations as rows and columns
    //   2. An entry in data.json containing metadata such as the matrix label,
    //      update date, subject code, and product code
    //
    // readData() returns both parts as a two-item array. Array destructuring is
    // used below to assign meaningful names to the CSV data and its metadata.
    //
    // The CSV observations are represented as an array of row objects. This is
    // similar to working with a data frame or tibble in R:
    //
    //   JavaScript array       R data frame
    //   ----------------       ------------
    //   one object             one row
    //   one object property    one column
    //   array of objects       complete data frame
    //
    // JavaScript array methods can therefore be chained together in a pipeline
    // resembling common dplyr operations:
    //
    //   filter()     resembles filter()
    //   map()        resembles pull(), select(), or transmute()
    //   forEach()    can be used like mutate() when changing each row
    //   includes()   resembles %in%

    // ===== MEDIAN AGE CARDS =====

    // ----- MEDIAN AGE CARD -----
    // Load the median-age matrix
    //
    // MA01T01.csv contains one row per year, with separate columns for:
    //
    //   All persons
    //   Males
    //   Females
    //
    // The MA01T01 entry in data.json contains the corresponding metadata
    const [median_age_data, median_age_meta] = await readData("MA01T01");

    // Read the available years from the CSV rows and update year references
    // displayed throughout the page
    updateYearSpans(median_age_data);

    // Set a comparison year 25 years before the latest available year
    //
    // Calculating this dynamically means the code does not need to contain a
    // fixed calendar year
    const comparison_year = latest_year - 25;

    // Find every HTML element with class="comparison-year"
    //
    // getElementsByClassName() returns a collection because the comparison year
    // may appear in several cards, headings, or explanatory sentences
    const comparison_spans =
        document.getElementsByClassName("comparison-year");

    // Update each matching HTML element with the calculated comparison year
    for (let span of comparison_spans) {
        span.textContent = comparison_year;
    }

    // Format the matrix update date stored separately in the metadata
    const median_age_updated = dateFormat(median_age_meta.updated);

    // Filter to the latest-year row and extract the All persons column
    //
    // This is similar to:
    //
    //   median_age <- median_age_data %>%
    //     filter(Year == latest_year) %>%
    //     pull(`All persons`)
    const median_age = median_age_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["All persons"]);

    // Display the latest median age in the relevant card
    insertValue("median-age", median_age);

    // ----- MEDIAN AGE CHANGE OVER 25 YEARS CARD -----
    // Select the median age for the comparison year
    const comparison_age = median_age_data
        .filter(row => row["Year"] == comparison_year)
        .map(col => col["All persons"]);

    // Calculate the numeric difference between the latest median age and the
    // median age 25 years earlier
    const age_change_value = median_age - comparison_age;

    // Format the change with a plus sign when the result is positive
    //
    // toFixed(1) rounds the value to one decimal place
    const age_change =
        age_change_value > 0
            ? `+${age_change_value.toFixed(1)}`
            : age_change_value.toFixed(1);

    insertValue("age-change", age_change);

    // ----- ANNUAL MEDIAN AGE PERCENTAGE CHANGE CARD -----
    // Select the All persons median age for the preceding year
    const last_age = median_age_data
        .filter(row => row["Year"] == last_year)
        .map(col => col["All persons"]);

    // Calculate percentage change using:
    //
    //   latest median age - previous median age
    //   ---------------------------------------- × 100
    //             previous median age
    const age_change_pct_value =
        ((median_age - last_age) / last_age) *
        100;

    // Add a plus sign to positive results and display one decimal place
    const age_change_pct =
        age_change_pct_value > 0
            ? `+${age_change_pct_value.toFixed(1)}`
            : age_change_pct_value.toFixed(1);

    insertValue("age-change-pct", age_change_pct);

    // ===== AGE-GROUP PERCENTAGE CARDS =====
    // Load the broad-age population matrix
    //
    // MYE01T03 contains one row for each combination of year and broad age band.
    // The population measures are stored in columns such as:
    //
    //   All persons
    //   Males
    //   Females
    const [pop_age_data, pop_age_meta] = await readData("MYE01T03");

    // Format the update date stored in the matrix metadata
    const pop_age_updated = dateFormat(pop_age_meta.updated);

    // ----- POPULATION AGED 65 AND OVER -----
    // Filter to the latest-year Age 65+ row and extract the All persons value
    const over_65_pop = pop_age_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (4 cat)"] == "Age 65+"
        )
        .map(col => col["All persons"]);

    // Filter to the latest-year summary row and extract the total population
    //
    // The "All" age-band row provides the denominator for percentage calculations
    const all_pop = pop_age_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (4 cat)"] == "All"
        )
        .map(col => col["All persons"]);

    // Calculate the percentage of the latest-year population aged 65 and over
    const over_65_pct = over_65_pop / all_pop * 100;

    // Display the percentage rounded to one decimal place
    insertValue("over-65", over_65_pct.toFixed(1));

    // ----- CHILD POPULATION IN THE COMPARISON YEAR -----
    // Select the population aged 0 to 15 in the comparison year
    const child_pop_comparison = pop_age_data
        .filter(row =>
            row["Year"] == comparison_year &&
            row["Broad age band (4 cat)"] == "Age 0-15"
        )
        .map(col => col["All persons"]);

    // Select the total population for the same comparison year
    const all_pop_comparison = pop_age_data
        .filter(row =>
            row["Year"] == comparison_year &&
            row["Broad age band (4 cat)"] == "All"
        )
        .map(col => col["All persons"]);

    // Calculate the percentage of the comparison-year population aged 0 to 15
    const child_pct_comparison =
        child_pop_comparison /
        all_pop_comparison *
        100;

    insertValue(
        "child-pct-comparison",
        child_pct_comparison.toFixed(1)
    );

    // ----- CHILD POPULATION IN THE LATEST YEAR -----
    // Select the latest-year population aged 0 to 15
    const child_pop = pop_age_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (4 cat)"] == "Age 0-15"
        )
        .map(col => col["All persons"]);

    // Use the previously selected latest-year total as the denominator
    const child_pct = child_pop / all_pop * 100;

    insertValue("child-pct", child_pct.toFixed(1));

    // ===== HORIZONTAL STACKED BAR CHART: AGE STRUCTURE OVER TIME =====
    // Create a chart showing the population values for broad age groups at
    // selected points between the comparison year and the latest year

    // Build an array of selected years
    //
    // The loop visits every year in the 25-year period, while the modulo test
    // keeps only years that follow the chosen five-year pattern
    //
    // The % operator returns the remainder after division. For example:
    //
    //   2004 % 5 gives 4
    //   2009 % 5 gives 4
    //
    // These years are retained to keep the chart readable
    let bar_years = [];

    for (let i = comparison_year; i <= latest_year; i++) {
        if (i % 5 == 4) {
            bar_years.push(i);
        }
    }

    // Filter the broad-age data to:
    //
    //   rows whose Year appears in bar_years
    //   individual age bands rather than the "All" summary category
    //
    // includes() checks whether the row's year appears in the selected-year array.
    // This is similar to using %in% in R:
    //
    //   age_chart_data <- pop_age_data %>%
    //     filter(
    //       Year %in% bar_years,
    //       `Broad age band (4 cat)` != "All"
    //     )
    const age_chart_data = pop_age_data
        .filter(row =>
            bar_years.includes(row["Year"]) &&
            row["Broad age band (4 cat)"] != "All"
        );

    // Pass the population counts for each broad age band to barChart()
    //
    // Because stacked is true and label_format is "%", barChart() calculates the
    // total population for each year and converts each age-band value into its
    // percentage share before drawing the chart
    //
    // This is conceptually similar to grouping by Year in dplyr and calculating:
    //
    //   age_chart_data %>%
    //     group_by(Year) %>%
    //     mutate(percentage = `All persons` / sum(`All persons`) * 100)
    barChart({
        data: age_chart_data,
        value: "All persons",
        categories: "Year",
        bars: "Broad age band (4 cat)",
        canvas_id: "age-bar",
        label_format: "%",
        stacked: true,
        align: "horizontal",
        y_label: "Year"
    });

    // Draw a second copy of the chart for the expanded view
    barChart({
        data: age_chart_data,
        value: "All persons",
        categories: "Year",
        bars: "Broad age band (4 cat)",
        canvas_id: "age-bar-expanded",
        label_format: "%",
        stacked: true,
        align: "horizontal",
        y_label: "Year"
    });

    // ===== POPULATION PYRAMID =====
    // Create a population pyramid showing male and female population counts
    // for each single year of age

    // Load the single-year-of-age population matrix
    //
    // MYE01T08 contains age rows with separate numeric columns for males and females
    const [pop_single_age_data, pop_single_age_meta] =
        await readData("MYE01T08");

    // Format the update date stored in the matrix metadata
    const pop_single_age_updated =
        dateFormat(pop_single_age_meta.updated);

    // Visit every row and replace the final age label, 90, with 90+
    //
    // This changes the displayed category label so users understand that the
    // final group includes everyone aged 90 and over
    //
    // Adding or changing a property on each row is conceptually similar to:
    //
    //   pop_single_age_data <- pop_single_age_data %>%
    //     mutate(
    //       `Single year of age` =
    //         if_else(`Single year of age` == 90, "90+", ...)
    //     )
    pop_single_age_data.forEach(row => {
        const age = row["Single year of age"];

        if (age == 90) {
            row["Single year of age"] = "90+";
        }
    });

    // Remove the "All" summary row so the pyramid contains only individual ages
    const pop_chart_data = pop_single_age_data
        .filter(row => row["Single year of age"] != "All");

    // Draw the standard population pyramid
    //
    // pyramidChart() receives the row-based data directly:
    //
    //   categories identifies the age-label column
    //   values identifies the female and male numeric columns
    pyramidChart({
        data: pop_chart_data,
        categories: "Single year of age",
        values: ["Females", "Males"],
        canvas_id: "pop-pyramid",
        year: latest_year
    });

    // Draw a second copy of the pyramid for the expanded view
    pyramidChart({
        data: pop_chart_data,
        categories: "Single year of age",
        values: ["Females", "Males"],
        canvas_id: "pop-pyramid-expanded",
        year: latest_year
    });

    // ===== LINE CHART: MEDIAN AGE TREND =====
    // Create a chart showing how median age has changed over the most recent
    // 26 observations

    // Pull the Year column from each row
    //
    // slice(-26) retains the final 26 values in the array
    const median_line_years = median_age_data
        .map(col => col["Year"])
        .slice(-26);

    // Pull the All persons median-age column for the same 26 rows
    const median_values = median_age_data
        .map(col => col["All persons"])
        .slice(-26);

    // Pull the male median-age column for the same 26 rows
    const median_male = median_age_data
        .map(col => col["Males"])
        .slice(-26);

    // Pull the female median-age column for the same 26 rows
    const median_female = median_age_data
        .map(col => col["Females"])
        .slice(-26);

    // Organise the numeric arrays into the structure expected by lineChart()
    //
    // Each inner array becomes a separate line:
    //
    //   line 1: all persons
    //   line 2: males
    //   line 3: females
    //
    // Because all values are extracted from the same ordered rows and use the
    // same slice, they remain aligned with median_line_years
    const line_chart_lines = [
        median_values,
        median_male,
        median_female
    ];

    // Define the labels displayed in the chart legend
    //
    // The label order must match the order of the arrays above
    const line_chart_labels = [
        "Median age",
        "Males",
        "Females"
    ];

    // Draw the standard median-age line chart
    lineChart({
        years: median_line_years, // Values displayed along the x-axis
        lines: line_chart_lines, // Arrays containing each median-age series
        labels: line_chart_labels, // Labels displayed in the legend
        canvas_id: "median-line", // HTML canvas where the chart is drawn
        showPoints: false // Draw lines without a marker for every observation
    });

    // Draw a second copy of the line chart for the expanded view
    lineChart({
        years: median_line_years,
        lines: line_chart_lines,
        labels: line_chart_labels,
        canvas_id: "median-line-expanded",
        showPoints: false
    });

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Define the source-matrix filters associated with each chart
    //
    // These query objects describe the subset of the original NISRA matrices
    // users should receive when downloading the underlying data

    // Request the selected years and the All persons category used by the
    // broad-age chart
    //
    // map(String) converts each numeric year into a string because the download
    // query expects year category codes as text
    const age_chart_query = {
        "TLIST(A1)": bar_years.map(String),
        "Sex": "All"
    };

    // Request the latest year and both male and female categories used by the
    // population pyramid
    const pop_pyramid_query = {
        "TLIST(A1)": latest_year,
        "Sex": ["1", "2"]
    };

    // Request all years displayed in the median-age line chart
    const median_line_query = {
        "TLIST(A1)": median_line_years
    };

    // Add a download button for the broad-age chart
    downloadButton(
        "age-bar-capture",
        "MYE01T03",
        pop_age_updated,
        age_chart_query
    );

    // Add a download button for the population pyramid
    downloadButton(
        "pop-pyramid-capture",
        "MYE01T08",
        pop_single_age_updated,
        pop_pyramid_query
    );

    // Add a download button for the median-age line chart
    downloadButton(
        "median-line-capture",
        "MA01T01",
        median_age_updated,
        median_line_query
    );

    // ===== INFO BOXES: HELP AND CONTEXT =====
    // Populate the expandable information boxes displayed below the page content
    //
    // populateInfoBoxes() receives:
    //
    //   1. An array containing the box headings
    //   2. An array containing the corresponding HTML content
    //
    // Items at the same array position belong together:
    //
    //   headings[0] is paired with content[0]
    //   headings[1] is paired with content[1]
    //   headings[2] is paired with content[2]
    populateInfoBoxes(
        [
            "Definitions",
            "Source",
            "What does the data mean?"
        ],
        [
            // ----- DEFINITIONS BOX -----
            // Explain how the page layout is constructed and made responsive
            `<p>The layout for this page is built in the dashboard HTML template using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the cards and charts can adapt to different screen sizes and remain mobile friendly.</p>
            <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
            <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,

            // ----- SOURCE BOX -----
            // Identify the matrices used to populate the cards and charts
            `<p>The cards and charts on this page are populated by this script using data from the NISRA Data Portal.</p>
            <p>The main datasets are <strong>MA01T01</strong> for median age, <strong>MYE01T03</strong> for broad age-group population values, and <strong>MYE01T08</strong> for population by single year of age and sex.</p>
            <p>Each matrix is loaded as a CSV-style table. Rows are filtered using dimensions such as year and age group, while the required population or median-age columns are selected for the cards and charts.</p>`,

            // ----- DATA MEANING BOX -----
            // Explain the inputs expected by the three chart utilities
            `<p>This page uses three charting functions.</p>
            <p><strong>barChart()</strong> draws the stacked horizontal broad-age chart. It receives the filtered data rows, the numeric value column, the year category column, the column defining the separate age-band segments, the canvas ID, the label format, and the chart layout settings.</p>
            <p><strong>pyramidChart()</strong> draws the population pyramid. It receives the single-age rows, the column containing the age labels, the female and male value columns, the canvas ID, and the displayed year.</p>
            <p><strong>lineChart()</strong> draws the median-age trend. It receives the years, the arrays of values for each line, the corresponding line labels, the canvas ID, and the point-display setting.</p>`
        ]
    );

}); // End of DOMContentLoaded event listener
