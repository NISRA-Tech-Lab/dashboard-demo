// ===== IMPORTS =====
// Import the utility functions used to build the page, load the datasets,
// prepare charts, and insert values into the HTML
//
// Keeping these functions in separate modules makes this script easier to read
// and allows the same functionality to be reused across several pages

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Builds the shared page structure
import { readData } from "./utils/read-data.js"; // Loads a matrix CSV together with its metadata
import { insertValue } from "./utils/insert-value.js"; // Inserts a value into a specified HTML element
import { latest_year, updateYearSpans, last_year } from "./utils/update-years.js"; // Provides and updates year-related values
import { lineChart } from "./charts/line-chart.js"; // Creates a line chart
import { pieChart } from "./charts/pie-chart.js"; // Creates a pie chart
import { insertExpandButtons } from "./utils/expand-buttons.js"; // Adds controls for expanding chart sections
import { downloadButton } from "./utils/download-button.js"; // Adds a button for downloading the underlying data
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
    await insertHead("Population estimates"); // Wait until the document head has been prepared
    insertHeader(); // Adds the page header
    insertNavButtons(); // Adds the page navigation buttons
    insertFooter(); // Adds the page footer
    insertExpandButtons(); // Adds controls that open the expanded chart views

    // ===== POPULATE PAGE WITH DATA =====
    // Each matrix is now stored in two parts:
    //
    //   1. A CSV file containing the observations as rows and columns
    //   2. An entry in data.json containing metadata such as the matrix label,
    //      update date, subject code, and product code
    //
    // readData() returns both parts as a two-item array. Array destructuring is
    // used below to assign meaningful names to the CSV data and metadata.
    //
    // The CSV data is represented as an array of row objects. This is similar
    // to working with a data frame in R:
    //
    //   JavaScript array       R data frame
    //   ----------------       ------------
    //   one object             one row
    //   one object property    one column
    //   array of objects       complete data frame
    //
    // Methods such as filter() and map() can therefore be chained together in
    // a pipeline resembling dplyr operations such as filter() and pull().

    // ----- TOTAL POPULATION CARD -----
    // Step 1: Load the population totals matrix
    //
    // MYE01T05.csv contains the observation rows, while the MYE01T05 entry in
    // data.json contains the associated metadata
    const [pop_totals_data, pop_totals_meta] = await readData("MYE01T05");

    // Read the available years from the CSV data and update year references
    // displayed throughout the page
    updateYearSpans(pop_totals_data, pop_totals_meta);

    // Format the matrix update date stored in the metadata
    //
    // The metadata is kept separately from the CSV observations, so the update
    // date is read from pop_totals_meta rather than pop_totals_data
    const pop_totals_updated = dateFormat(pop_totals_meta.updated);

    // Step 2: Select the latest population total
    //
    // filter() keeps only rows where Year matches latest_year
    // map() then extracts the Unrounded column from the matching row
    //
    // This is similar to the following dplyr pipeline:
    //
    //   pop_total <- pop_totals_data %>%
    //     filter(Year == latest_year) %>%
    //     pull(Unrounded)
    const pop_total = pop_totals_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Unrounded"]);

    // Step 3: Display the population total
    //
    // toLocaleString() adds thousands separators, for example:
    //   1920000 becomes 1,920,000
    insertValue("pop-total", pop_total.toLocaleString());

    // ----- POPULATION CHANGE CARD -----
    // Calculate the percentage change between the latest year and the preceding year

    // Filter the population totals data to last_year and extract the Unrounded value
    //
    // This uses the same filter-and-select pattern as the latest-year calculation
    const pop_total_last = pop_totals_data
        .filter(row => row["Year"] == last_year)
        .map(col => col["Unrounded"]);

    // Calculate percentage change using:
    //
    //   (latest population - previous population)
    //   ----------------------------------------- × 100
    //              previous population
    const pop_change_value =
        (pop_total - pop_total_last) /
        pop_total_last *
        100;

    // Format the result for display
    //
    // A positive result receives a plus sign, a negative result receives a minus
    // sign, and a zero result is displayed without either sign
    //
    // Math.abs() removes the existing minus sign from a negative value because
    // the minus sign is added separately in the template string
    const pop_change =
        pop_change_value > 0
            ? `+ ${pop_change_value.toFixed(1)}`
            : pop_change_value < 0
                ? `- ${Math.abs(pop_change_value).toFixed(1)}`
                : `${pop_change_value.toFixed(1)}`;

    insertValue("pop-change", pop_change);

    // ----- GENDER BREAKDOWN CARDS -----
    // Load the matrix containing population estimates by broad age band and sex
    const [gender_pop_data, gender_pop_meta] = await readData("MYE01T03");

    // Format the update date stored in the matrix metadata
    const gender_pop_updated = dateFormat(gender_pop_meta.updated);

    // ----- FEMALE POPULATION -----
    // Filter the data to the latest year and the "All" broad age band
    //
    // Both conditions must be true for a row to be retained:
    //   1. Year equals latest_year
    //   2. Broad age band equals "All"
    //
    // map() then extracts the Females column from the matching row
    //
    // This is similar to:
    //
    //   female_pop <- gender_pop_data %>%
    //     filter(
    //       Year == latest_year,
    //       `Broad age band (4 cat)` == "All"
    //     ) %>%
    //     pull(Females)
    const female_pop = gender_pop_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (4 cat)"] == "All"
        )
        .map(col => col["Females"]);

    // Divide the female population by the total population and multiply by 100
    // to calculate the percentage of the population that is female
    const female_pop_pct = female_pop / pop_total * 100;

    // Display the percentage rounded to one decimal place
    insertValue("pop-female", female_pop_pct.toFixed(1));

    // ----- MALE POPULATION -----
    // Repeat the same filtering process and extract the Males column
    const male_pop = gender_pop_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (4 cat)"] == "All"
        )
        .map(col => col["Males"]);

    // Calculate the male share of the total population
    const male_pop_pct = male_pop / pop_total * 100;

    insertValue("pop-male", male_pop_pct.toFixed(1));

    // ----- AVERAGE ANNUAL CHANGE OVER 10 YEARS -----
    // Select the population total from ten years before the latest year
    //
    // latest_year - 10 calculates the required comparison year dynamically,
    // so the code does not need to contain a fixed calendar year
    const pop_total_first = pop_totals_data
        .filter(row => row["Year"] == latest_year - 10)
        .map(col => col["Unrounded"]);

    // Calculate the average annual percentage change over the ten-year period
    //
    // First calculate the total proportional change:
    //
    //   (latest population - population ten years earlier)
    //   --------------------------------------------------
    //             population ten years earlier
    //
    // Dividing by 10 gives the average change per year, and multiplying by 100
    // converts the result into a percentage
    const pop_change_10yr_value =
        (pop_total - pop_total_first) /
        pop_total_first /
        10 *
        100;

    // Format the ten-year average using the same sign rules as the annual change
    const pop_change_10yr =
        pop_change_10yr_value > 0
            ? `+ ${pop_change_10yr_value.toFixed(1)}`
            : pop_change_10yr_value < 0
                ? `- ${Math.abs(pop_change_10yr_value).toFixed(1)}`
                : `${pop_change_10yr_value.toFixed(1)}`;

    insertValue("pop-change-10yr", pop_change_10yr);

    // ===== LINE CHART: HISTORICAL POPULATION TREND =====
    // Prepare the years and population values needed to draw the historical line chart
    //
    // Because the CSV already stores one observation per row, the chart data can
    // be produced directly from the relevant columns without looping through a
    // deeply nested object

    // Extract the Year column from every row
    //
    // map() performs a column-selection operation similar to pull(Year) in dplyr
    //
    // slice(-26) retains the final 26 observations, limiting the chart to the
    // most recent 26 years available in the matrix
    const pop_line_years = pop_totals_data
        .map(col => col["Year"])
        .slice(-26);

    document.querySelectorAll(".line-first-year").forEach(span => {
        span.textContent = pop_line_years[0];
    });

    // Extract the corresponding Unrounded population values
    //
    // The same slice is applied to the years and values so that the two arrays
    // remain aligned:
    //
    //   pop_line_years[0] corresponds to pop_values[0]
    //   pop_line_years[1] corresponds to pop_values[1]
    //   and so on
    const pop_values = pop_totals_data
        .map(col => col["Unrounded"])
        .slice(-26);

    // lineChart() supports more than one line, so each series of values must be
    // placed inside an outer array
    //
    // This chart contains only one series: the mid-year population estimate
    const line_chart_lines = [
        pop_values
    ];

    // Supply the label that will identify the line in the chart legend
    const line_chart_labels = ["Mid-year population estimate"];

    // Draw the standard version of the line chart
    lineChart({
        years: pop_line_years, // Values displayed along the x-axis
        lines: line_chart_lines, // Population values plotted on the chart
        labels: line_chart_labels, // Labels used in the chart legend
        canvas_id: "pop-line", // HTML canvas where the chart will be drawn
        expanded_canvas_id: "pop-line-expanded", // Canvas used for the expanded chart view
        unit: ""
    });

    // ===== PIE CHART: GENDER BREAKDOWN =====
    // Prepare the latest-year male and female population values for the pie chart

    // Step 1: Filter the data to the latest year and the "All" broad age band
    //
    // Step 2: Use map() to create a new object containing only the columns needed
    // by pieChart()
    //
    // The resulting mapped array has one item, so [0] extracts that object:
    //
    //   {
    //       Males: value,
    //       Females: value
    //   }
    //
    // This is similar to using transmute() or select() in dplyr to construct a
    // smaller data frame containing only the required variables
    const pie_data = gender_pop_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (4 cat)"] == "All"
        )
        .map(col => ({
            "Males": col["Males"],
            "Females": col["Females"]
        }))[0];

    // Draw the standard pie chart
    //
    // pieChart() now receives one named object rather than separate label and
    // value arrays. The object property names become the slice labels and the
    // property values determine the sizes of the slices
    pieChart({
        data: pie_data,
        canvas_id: "pop-pie"
    });

    // Draw a second copy of the same chart for the expanded view
    pieChart({
        data: pie_data,
        canvas_id: "pop-pie-expanded"
    });

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Define the filters that will be passed to the download utility
    //
    // These filters describe the subset of the original matrix associated with
    // each chart rather than the structure of the locally stored CSV file

    // Request the unrounded population series used by the line chart
    const pop_line_query = {
        "Rounded or Unrounded": "Unrounded"
    };

    // Request the latest year, the combined age category, and both sex categories
    //
    // TLIST(A1), broadage4, and Sex are dimension codes used by the source matrix
    const pop_pie_query = {
        "Year": latest_year, // Restrict the download to the latest year
        "Broad age band (4 cat)": "All", // Select all broad age groups combined
        "Sex": ["Females", "Males"] // Select male and female categories
    };

    // Add a download button for the data underlying the line chart
    //
    // The formatted metadata date is passed to the utility so the downloaded
    // output can identify when the source matrix was last updated
    downloadButton(
        "pop-line-capture",
        "MYE01T05",
        pop_totals_updated,
        pop_line_query
    );

    // Add a download button for the data underlying the pie chart
    downloadButton(
        "pop-pie-capture",
        "MYE01T03",
        gender_pop_updated,
        pop_pie_query
    );

    // ===== INFO BOXES: HELP AND CONTEXT =====
    // Populate the expandable information boxes displayed below the page content
    //
    // populateInfoBoxes() receives:
    //   1. An array containing the box headings
    //   2. An array containing the corresponding HTML content
    //
    // Items at the same array position belong together:
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
            `<p>The page layout is built in <code>population-estimates.html</code> using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the content can adapt to different screen sizes and remain mobile friendly.</p>
            <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
            <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,

            // ----- SOURCE BOX -----
            // Identify the matrices used to populate the cards and charts
            `<p>The cards and charts on this page are populated by this script using data from the NISRA Data Portal.</p>
            <p>The main datasets are <strong>MYE01T05</strong> for population totals and <strong>MYE01T03</strong> for the population breakdown by sex.</p>
            <p>Each matrix is loaded as a CSV-style table. Rows are filtered using dimensions such as year and broad age band, and the required value columns are then selected for the cards and charts.</p>`,

            // ----- DATA MEANING BOX -----
            // Explain the inputs expected by the two chart utilities
            `<p>This page uses two charting functions.</p>
            <p><strong>lineChart()</strong> draws the historical population trend. It receives the years for the x-axis, one or more arrays of population values, the corresponding series labels, and the ID of the canvas where the chart should be drawn.</p>
            <p><strong>pieChart()</strong> displays the latest population breakdown by sex. It receives an object whose property names provide the slice labels and whose values determine the size of each slice, together with the ID of the chart canvas.</p>`
        ]
    );

}); // End of DOMContentLoaded event listener