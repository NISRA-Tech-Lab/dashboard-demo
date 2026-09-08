import { insertHeader, insertFooter, insertNavButtons, insertHead } from "./utils/page-layout.js";
import { initCookieConsent } from "./utils/cookies.js";

window.addEventListener("DOMContentLoaded", async () => {

    initCookieConsent();
    await insertHead("User notes");
    insertHeader();
    insertNavButtons();
    insertFooter();

});