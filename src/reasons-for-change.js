import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { config } from "./config/config.js";
import { createBarChart, createLineChart, insertTable } from "./utils/charts.js";
import { insertExpandButtons } from "./utils/expand-buttons.js";
import { dateFormat } from "./utils/date-format.js";
import { downloadButton } from "./utils/download-button.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();
    insertFooter();
    insertExpandButtons();

    // Total population
    const MYE01T03 = await readData("MYE01T03");
    const MYE01T03_updated = dateFormat(MYE01T03.updated);
    const MYE01T05 = await readData("MYE01T05");
    const MYE01T05_stat = "Population totals";
    updateYearSpans(MYE01T05, MYE01T05_stat);

    const MYE01T05_updated = dateFormat(MYE01T05.updated);
    const pop_table_query = {
        rounded_unrounded: "Unrounded"
    };

    const MYE01T06 = await readData("MYE01T06");
    const MYE01T06_stat = "Population totals";
    updateYearSpans(MYE01T06, MYE01T06_stat);
    const MYE01T06_updated = dateFormat(MYE01T06.updated);

    const pop_total = (MYE01T05.data[MYE01T05_stat][latest_year]["Unrounded"]);

    const raws = MYE01T06.data["Population totals"];

    const MYE01T06_raw = MYE01T06.data["Population totals"];

    const MYE01T06_data = Object.keys(MYE01T06_raw[latest_year]).map(lgd => ({
    LGD: lgd,
    [`Population ${latest_year}`]: MYE01T06_raw[latest_year][lgd]?.Unrounded,
    [`Population ${last_year}`]: MYE01T06_raw[last_year][lgd]?.Unrounded
    }));

    console.log(MYE01T06_data);

    const data = MYE01T06_data;

    data.forEach(row => {
    const change = row[`Population ${latest_year}`] - row[`Population ${last_year}`];
    const percent = (change / row[`Population ${last_year}`]) * 100;

    const arrow = change >= 0 ? "🠉" : "🠋";
    const arrowClass = change >= 0 ? "up" : "down";

    const changeDisplay =
        change >= 0
        ? change.toLocaleString()
        : "-" + Math.abs(change).toLocaleString();

    let bgColor = "white";
    if (percent > 0) {
        const max = 0.9;
        const intensity = Math.min(percent / max, 1);

        const r = Math.round(255 + (124 - 255) * intensity);
        const g = Math.round(255 + (166 - 255) * intensity);
        const b = Math.round(255 + (218 - 255) * intensity);

        bgColor = `rgb(${r}, ${g}, ${b})`;
    }
    });

    data.forEach(row => {
        const change = row[`Population ${latest_year}`] - row[`Population ${last_year}`];
        const percent = (change / row[`Population ${last_year}`]) * 100;

        row['Change'] = change;
        row['Change (%)'] = percent;
    });

    console.log(data)

    const table_data = {
        "LGD": {
            "values": data.map(row => row.LGD),
            "format": "string"
        },
        [`Population ${latest_year}`]: {
            "values": data.map(row => row[`Population ${latest_year}`]),
            "format": "number"
        },
        [`Population ${last_year}`]: {
            "values": data.map(row => row[`Population ${last_year}`]),
            "format": "number"
        },
        "Change": {
            "values": data.map(row => row.Change),
            "format": "change"
        },
        "Change (%)": {
            "values": data.map(row => row['Change (%)']),
            "format": "change_percent"
        }
   };

    insertTable("pop-table", table_data);

    // Bar Chart
    const pop_bar_query = {
        rounded_unrounded: "Unrounded"
    };

    const stat = "Mid-year population estimate";
    const years = Object.keys(MYE01T03.data[stat]);

    const year_data = MYE01T03.data[stat][latest_year];

    const age_groups = Object.keys(year_data).filter(a => a !== "All");

    const chart_data = {
        "Females": age_groups.map(age => year_data[age]["Females"]),
        "Males": age_groups.map(age => year_data[age]["Males"])
    };

    createBarChart({
        chart_data,
        categories: age_groups,
        canvas_id: "population-age-bar",
        label_format: ","   // comma formatting for large numbers
    });

    downloadButton("pop-bar-capture", "MYE01T03", MYE01T03_updated, pop_bar_query);
    downloadButton("pop-table-capture", "MYE01T05", MYE01T05_updated, pop_table_query);

    const COPC01T01 = await readData("COPC01T01");
    const COPC01T01_stat = "Components of population change";
    
    // Total Population Change
    const start_pop = COPC01T01.data[COPC01T01_stat][latest_year]["Starting population"];
    const end_pop = COPC01T01.data[COPC01T01_stat][latest_year]["End population"];
    const pop_change = end_pop - start_pop;
    insertValue("pop-change", pop_change.toLocaleString());

    // Births vs deaths 
    const births_num = COPC01T01.data[COPC01T01_stat][latest_year]["Births"];
    const deaths_num = COPC01T01.data[COPC01T01_stat][latest_year]["Deaths"];
    const births_deaths = births_num - deaths_num;
    insertValue("pop-births-deaths", births_deaths.toLocaleString());

    // Inflow
    const inflows_num = COPC01T01.data[COPC01T01_stat][latest_year]["Total Inflows"];
    insertValue("pop-inflows", inflows_num.toLocaleString());

    // Outflow
    const outflows_num = COPC01T01.data[COPC01T01_stat][latest_year]["Total Outflows"];
    insertValue("pop-outflows", outflows_num.toLocaleString());

    // Net change
    const net_num = COPC01T01.data[COPC01T01_stat][latest_year]["Total Net"];
    const nat_change_num = COPC01T01.data[COPC01T01_stat][latest_year]["Natural Change"];
    const net_change = (net_num/(net_num + nat_change_num)) * 100; 
    insertValue("pop-net-change", net_change.toFixed(1));

    document.getElementById("latest-year").textContent = latest_year;
    document.getElementById("last-year").textContent = last_year;    
})

