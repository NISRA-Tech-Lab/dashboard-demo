import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year } from "./utils/update-years.js";
import { config } from "./config/config.js";
import { getMaxEntry } from "./utils/get-max-entry.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();
    insertFooter();

    // Calculate values for insertion into homepage cards below

    // Full worked examples using data from the NISRA Data Portal can be found in the dashboard-demo repository:
    // https://github.com/nisra-techlab/dashboard-demo

    // Content for card 1
    const headline_1 = (123456).toLocaleString();
    insertValue("headline-1", headline_1);

    // Content for card 2
    const headline_2 = 12.34;
    insertValue("headline-2", headline_2)

    // Content for card 3
    const headline_3 = -1.23;
    insertValue("headline-3", headline_3);

    // Content for card 4
    const example_4_area = "Example Area";
    insertValue("example-4-area", example_4_area);

    const max_LGD = getMaxEntry(LGD_change);

    const headline_6_value = max_LGD.value.toFixed(0);
    const headline_6_place = max_LGD.key;

    insertValue("headline-6-place", headline_6_place);
    insertValue("headline-6-value", headline_6_value);

})