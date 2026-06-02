import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { config } from "./config/config.js";
import { createBarChart, createLineChart, insertTable } from "./utils/charts.js";
import { insertExpandButtons } from "./utils/expand-buttons.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();
    insertFooter();
    insertExpandButtons();

    // Total population
    const MYE01T05 = await readData("MYE01T05");
    const MYE01T05_stat = "Population totals";
    updateYearSpans(MYE01T05, MYE01T05_stat);

    // const pop_total = (MYE01T05.data[MYE01T05_stat][latest_year]["Unrounded"]);
        
    // insertValue("pop-total", pop_total.toLocaleString());

    const raw = MYE01T05["data"]["Population totals"];

    const year1 = "2024";
    const year2 = "2023";

    const result = Object.keys(raw[year1]).map(lgd => ({
    LGD: lgd,
    [`Population ${year1}`]: raw[year1][lgd]?.Unrounded ?? null,
    [`Population ${year2}`]: raw[year2][lgd]?.Unrounded ?? null
    }));

    console.log("result", result);

    const data = [
        { LGD: "Antrim and Newtownabbey", 'Population 2022': 146148, 'Population 2021': 145852 },
        { LGD: "Ards and North Down", 'Population 2022': 164223, 'Population 2021': 163827 },
        { LGD: "Armagh City, Banbridge and Craigavon", 'Population 2022': 220271, 'Population 2021': 219127 },
        { LGD: "Belfast", 'Population 2022': 348005, 'Population 2021': 344992 },
        { LGD: "Causeway Coast and Glens", 'Population 2022': 141316, 'Population 2021': 141664 },
    ];

    data.forEach(row => {
        const change = row['Population 2022'] - row['Population 2021'];
        const percent = (change / row['Population 2021']) * 100;
        // Arrow logic (same as before)
        const arrow = change >= 0 ? "🠉" : "🠋";
        const arrowClass = change >= 0 ? "up" : "down";
        // Force minus sign while keeping arrows
        const changeDisplay =
            change >= 0
            ? change.toLocaleString()
            : "-" + Math.abs(change).toLocaleString();
        // Gradient from white (0.0) → #7ca6da (0.9)
        let bgColor = "white";
        if (percent > 0) {
            const max = 0.9; // your upper bound
            const intensity = Math.min(percent / max, 1);
            // Interpolate between white and #7ca6da
            const r = Math.round(255 + (124 - 255) * intensity);
            const g = Math.round(255 + (166 - 255) * intensity);
            const b = Math.round(255 + (218 - 255) * intensity);
            bgColor = `rgb(${r}, ${g}, ${b})`;
        }        
    })

    data.forEach(row => {
        const change = row['Population 2022'] - row['Population 2021'];
        const percent = (change / row['Population 2021']) * 100;

        row['Change'] = change;
        row['Change (%)'] = percent;
    });

    console.log(data)

    const table_data = {
        "LGD": {
            "values": data.map(row => row.LGD),
            "format": "string"
        },
        "Population 2022": {
            "values": data.map(row => row['Population 2022']),
            "format": "number"
        },
        "Population 2021": {
            "values": data.map(row => row['Population 2021']),
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
//     let bardata = await readData("EXPDA");
//     let reported_data = await readData("LDARPG");
//     const relationship_data = await readData("DARPV");
// console.log( bardata)
//     const update_date = new Date(bardata.updated).toLocaleDateString("en-GB",
//       {
//           day: "2-digit", 
//           month: "long",
//           year: "numeric"
//       });

//     const relationship_update_date = new Date(relationship_data.updated).toLocaleDateString("en-GB",
//       {
//           day: "2-digit", 
//           month: "long",
//           year: "numeric"
//       });

    // let bardata = await readData("MYE01T03");
    // console.log( bardata)

    // const update_date = new Date(bardata.updated).toLocaleDateString("en-GB",
    //   {
    //       day: "2-digit", 
    //       month: "long",
    //       year: "numeric"
    //   });
    // console.log("update_date", update_date)
    

    //  "MYE01T03": {
    // "label": "Mid-year population estimates - Northern Ireland",
    // "updated": "2025-09-19",
    // "data": {
    //   "Mid-year population estimate": {
    //     "1971": {
    //       "Age 0-15": {
    //         "Females": 236737,
    //         "Males": 246007,
    //         "All persons": 482744
    //       },
    //       "Age 16-39": {
    //         "Females": 242884,
    //         "Males": 248911,
    //         "All persons": 491795
    //       },
    //       "Age 40-64": {
    //         "Females": 207353,
    //         "Males": 192443,
    //         "All persons": 399796
    //       },
    //       "Age 65+": {
    //         "Females": 98826,
    //         "Males": 67252,
    //         "All persons": 166078
    //       },
    //       "All": {
    //         "Females": 785800,
    //         "Males": 754613,
    //         "All persons": 1540413
    //       }
    //     },
 
    const MYE01T03 = await readData("MYE01T03");
    console.log(MYE01T03)

    const stat = "Mid-year population estimate";
    const years = Object.keys(MYE01T03.data[stat]);
    const latest_year = years[years.length - 1];

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

})

