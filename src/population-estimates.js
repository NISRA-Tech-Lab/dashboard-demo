import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { config } from "./config/config.js";
import { createBarChart, createLineChart, createPieChart } from "./utils/charts.js";
import { insertExpandButtons } from "./utils/expand-buttons.js";
import { downloadButton } from "./utils/download-button.js";
import { dateFormat } from "./utils/date-format.js";
import { populateInfoBoxes } from "./utils/info-boxes.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();
    insertFooter();
    insertExpandButtons();

    // Insert values into page cards

    // Total population
    const MYE01T05 = await readData("MYE01T05");
    const MYE01T05_stat = "Population totals";
    updateYearSpans(MYE01T05, MYE01T05_stat);

    const MYE01T05_updated = dateFormat(MYE01T05.updated);


    const pop_total = (MYE01T05.data[MYE01T05_stat][latest_year]["Unrounded"]);
        
    insertValue("pop-total", pop_total.toLocaleString());

    // Population change
    const pop_total_last = MYE01T05.data[MYE01T05_stat][last_year]["Unrounded"];
    const pop_change_value = (pop_total - pop_total_last) / pop_total_last * 100;
    let pop_change;
    if (pop_change_value > 0) {
        pop_change = `↑ ${pop_change_value.toFixed(1)}`;
    } else {
        pop_change = `↓ ${Math.abs(pop_change_value).toFixed(1)}`;
    }
    insertValue("pop-change", pop_change);

    // Female population
    const MYE01T03 = await readData("MYE01T03");
    const MYE01T03_stat = "Mid-year population estimate";
    const MYE01T03_updated = dateFormat(MYE01T03.updated);

    const female_pop = MYE01T03.data[MYE01T03_stat][latest_year]["All"]["Females"];
    const female_pop_pct = female_pop / pop_total * 100;
    insertValue("pop-female", female_pop_pct.toFixed(1));

    // Male population
    const male_pop = MYE01T03.data[MYE01T03_stat][latest_year]["All"]["Males"];
    const male_pop_pct = male_pop / pop_total * 100;
    insertValue("pop-male", male_pop_pct.toFixed(1));

    // Average year-on-year change over last 10 years
    const pop_total_first = MYE01T05.data[MYE01T05_stat][latest_year - 10]["Unrounded"];
    const pop_change_10yr_value = (pop_total - pop_total_first) / pop_total_first / 10 * 100;
    let pop_change_10yr;
    if (pop_change_10yr_value > 0) {
        pop_change_10yr = `↑ ${pop_change_10yr_value.toFixed(1)}`;
    } else {
        pop_change_10yr = `↓ ${Math.abs(pop_change_10yr_value).toFixed(1)}`;
    }
    insertValue("pop-change-10yr", pop_change_10yr);

    // Line chart example - replace with dynamic data as needed

    const pop_line_years = Object.keys(MYE01T05.data[MYE01T05_stat]).slice(-26); // last 25 years

    const line_chart_years = [2015, 2016, 2017, 2018, 2019, 2020];

    let pop_values = [];
    for (let i = 0; i < pop_line_years.length; i ++) {
        const year = pop_line_years[i];
        const value = MYE01T05.data[MYE01T05_stat][year]["Unrounded"];
        pop_values.push(value);
    }

    const line_chart_lines = [
        pop_values
    ];
    const line_chart_labels = ["Mid-year population estimate"];

    createLineChart({
        years: pop_line_years,
        lines: line_chart_lines,
        labels: line_chart_labels,
        canvas_id: "pop-line"
    });

    createLineChart({
        years: pop_line_years,
        lines: line_chart_lines,
        labels: line_chart_labels,
        canvas_id: "pop-line-expanded"
    });

    // Pie chart gender
    const genders = ["Female", "Male"];
    const pie_values = [MYE01T03.data[MYE01T03_stat][latest_year]["All"]["Females"],
        MYE01T03.data[MYE01T03_stat][latest_year]["All"]["Males"]];


    createPieChart({labels: genders, values: pie_values, canvas_id: "pop-pie"});

    createPieChart({labels: genders, values: pie_values, canvas_id: "pop-pie-expanded"});

    const pop_line_query = {
        rounded_unrounded: "Unrounded"
    };

    const pop_pie_query = {
        "TLIST(A1)": latest_year,
        "broadage4": "All",
        "Sex": ["1", "2"]
    }

    downloadButton("pop-line-capture", "MYE01T05", MYE01T05_updated, pop_line_query);
    downloadButton("pop-pie-capture", "MYE01T03", MYE01T03_updated, pop_pie_query);

    populateInfoBoxes(["Definitions", "Source", "What does the data mean?"],

        [
        `<p>The data use to populate this page comes from the NISRA Data Portal...</p>`,
            
        `<h3>Line chart functionality</h3>
        <p>The function <em>createLineChart</em> is used to generate the line chart...</p>
        <h3>Pie chart functionality</h3>
        <p>The function <em>createPieChart</em> is used to generate the pie chart...</p>`,

        `<p>Accessibility and best practice information goes here...</p>`
    ]
    )

})