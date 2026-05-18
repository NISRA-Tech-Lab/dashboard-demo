import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { config } from "./config/config.js";
import { createBarChart, createLineChart } from "./utils/charts.js";
import { insertExpandButtons } from "./utils/expand-buttons.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();
    insertFooter();
    insertExpandButtons();

    // Insert values into page cards

    const card_1_value = (123456).toLocaleString();
    insertValue("card-1-value", card_1_value);

    const card_2_value = 5.67;
    insertValue("card-2-value", card_2_value);

    const card_3_value = 2.89;
    insertValue("card-3-value", card_3_value);

    const card_4_value = (9876).toLocaleString();
    insertValue("card-4-value", card_4_value);

    const card_5_area = "Example Region A";
    insertValue("card-5-area", card_5_area);

    const card_5_value = (45678).toLocaleString();
    insertValue("card-5-value", card_5_value);

    const card_6_area = "Example Region B";
    insertValue("card-6-area", card_6_area);

    const card_6_value = (12345).toLocaleString();
    insertValue("card-6-value", card_6_value);


    // Line chart example - replace with dynamic data as needed

    const line_chart_years = [2015, 2016, 2017, 2018, 2019, 2020];
    const line_chart_lines = [
        [1.2, 1.5, 1.7, 1.6, 1.8, 2.0],
        [0.8, 0.9, 1.0, 1.1, 1.2, 1.3]
    ];
    const line_chart_labels = ["Sector 1", "Sector 2"];
    createLineChart({
        years: line_chart_years,
        lines: line_chart_lines,
        labels: line_chart_labels,
        canvas_id: "line-example"
    });

    createLineChart({
        years: line_chart_years,
        lines: line_chart_lines,
        labels: line_chart_labels,
        canvas_id: "line-example-expanded"
    });

    // Bar chart example - replace with dynamic data as needed

    const bar_chart_categories = ["Category A", "Category B"];
    const bar_chart_data = {"Type 1": [10, 15, 3], "Type 2": [5, 7, 2]};

    createBarChart({
        categories: bar_chart_categories,
        chart_data: bar_chart_data,
        canvas_id: "bar-example"
    });

    createBarChart({
        categories: bar_chart_categories,
        chart_data: bar_chart_data,
        canvas_id: "bar-example-expanded"
    });


})