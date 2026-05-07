import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { config } from "./config/config.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();
    insertFooter();

    // Insert values into homepage cards below

    // Full worked examples using data from the NISRA Data Portal can be found in the dashboard-demo repository:
    // https://github.com/nisra-techlab/dashboard-demo
    const headline_1 = (123456).toLocaleString();
    insertValue("headline-1", headline_1);

    const headline_2 = 12.34;
    insertValue("headline-2", headline_2)

    const headline_3 = 1.23;
    insertValue("headline-3", headline_3);

    const example_4_area = "Example Area";
    insertValue("example-4-area", example_4_area);

    const example_4_value = (1234).toLocaleString();
    insertValue("example-4-value", example_4_value);

    const example_5_value = 56.78;
    insertValue("example-5-value", example_5_value);

    const example_6_value = (98765).toLocaleString();
    insertValue("example-6-value", example_6_value);
    
    

})