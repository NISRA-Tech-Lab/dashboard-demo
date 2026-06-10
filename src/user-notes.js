import { insertHeader, insertFooter, insertNavButtons, insertHead } from "./utils/page-layout.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("User notes");
    insertHeader();
    insertNavButtons();
    insertFooter();

});