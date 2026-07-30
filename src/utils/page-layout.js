import { config } from "../config/config.js";
import { departments } from "../config/departments.js";

// ===== INSERT THE PAGE HEADER =====
//
// Build and insert the main application header.
//
// The header contains:
//
//   • an accessibility skip link
//   • a feedback banner
//   • the NISRA logo
//   • the application title
//   • the relevant government department logo
//
// Most of the displayed values are taken from the shared configuration
// objects imported at the top of this file.
//
// CONFIGURATION USED
//
// config.title
//   The application title displayed in the centre of the header.
//
// config.department
//   The code used to identify the relevant department.
//
// config.rateit
//   The identifier added to the NISRA feedback survey URL.
//
// departments
//   An object containing department information.
//
//   The selected department entry is expected to contain:
//
//     name
//       The full department name.
//
//     url
//       The department website address.
//
// EXPECTED HTML
//
// The page should contain an element with the ID:
//
//   banner
//
// The function replaces the contents of that element with the generated
// header.
//
// ACCESSIBILITY BEHAVIOUR
//
// The skip link is initially hidden.
//
// When the user presses the Tab key, the skip link becomes visible. Selecting
// it moves keyboard focus towards the main page content.
//
// The skip link points to:
//
//   #content
//
// Therefore, the page's main content area should contain an element with the
// ID "content".
//
// RETURNS
//
// This function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • adds classes and styles to the #banner element
//   • replaces the banner's HTML
//   • adds a keydown listener to the window
//   • adds a click listener to the skip link
//   • updates the browser URL after the skip link is selected
export function insertHeader () {

    // ===== PREPARE THE BANNER =====
    const banner = document.getElementById("banner");

    banner.classList.add("navbar");
    banner.classList.add("p-0");
    banner.style.backgroundColor = "#00205b";

    // ===== INSERT THE HEADER CONTENT =====
    banner.innerHTML = `<div id="skip-link" class="container-fluid bg-warning py-2 d-none"><a class="text-black" href="#content">Skip to main content</a></div>
    <div class="container-fluid d-flex flex-column align-items-stretch p-0">
    <!-- Feedback banner -->
    <div aria-label="Feedback" class="w-100" style="background-color:#3878c5;">
        <div class="text-white text-center py-2 px-3">
            We welcome feedback from users through our 
                <a href="https://dttselfserve.nidirect.gov.uk/NISRA/RateIt#/${config.rateit}" target="_blank" rel="noopener noreferrer">short survey</a>
            
        </div>
    </div>
  <!-- Main navigation banner -->
  <div role="banner" class="d-flex row align-items-center justify-content-between w-100 py-3 px-2">

    <!-- NISRA logo -->
    <div class="col-12 col-xl-4 d-flex justify-content-center justify-content-xl-start">
      <a class="navbar-brand ps-2 d-flex align-items-center" href="https://www.nisra.gov.uk/" target="_blank" rel="noopener noreferrer">
        <img src="assets/img/logo/nisra-only-white.svg"
            alt="NISRA logo" height="60" class="me-3" role="img" title="NISRA Website (opens in new tab)">
      </a>
    </div>

    <!-- Application title -->
    <div class="col-12 col-xl-4 d-flex justify-content-center">
      <h1 class="mb-0 text-white fs-2 app-title text-center">${config.title}</h1>
    </div>

    <!-- Department logo -->
    <div class="col-12 col-xl-4 d-flex justify-content-center justify-content-xl-end">
      <a class="navbar-brand pe-2 d-flex align-items-center" href="${departments[config.department].url}" target="_blank" rel="noopener noreferrer">
        <img id="banner-logo" src="assets/img/logo/dep_white/${config.department}.svg"
            alt="${departments[config.department].name} logo" height="60" class="ms-3" title="${departments[config.department].name} Website (opens in new tab)" role="img">
      </a>
    </div>

  </div>

  `

  // ===== CONFIGURE THE SKIP LINK =====
  const skip_link = document.getElementById("skip-link");

  window.addEventListener("keydown", (e) => {
    if (e.keyCode === 9) {
      skip_link.classList.remove("d-none");
    }
  })

  skip_link.addEventListener("click", (e) => {
    setTimeout(() => {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }, 1)
  })


}

// ===== INSERT THE NAVIGATION BUTTONS =====
//
// Build the application's main page navigation.
//
// The function creates two versions of the navigation:
//
//   • a dropdown menu for screens smaller than Bootstrap's large breakpoint
//   • a horizontal row of buttons for large screens and above
//
// Both versions are generated from config.navigation.
//
// CONFIGURATION USED
//
// config.navigation
//   An array of navigation-link objects.
//
//   Each item is expected to contain:
//
//     href
//       The HTML page to open.
//
//     text
//       The text shown to the user.
//
//   Example:
//
//     {
//       href: "population.html",
//       text: "Population"
//     }
//
// config.show_projections
//   Controls whether the link to projections.html is included.
//
//   When this is false, the projections link is removed from the navigation.
//
// EXPECTED HTML
//
// The page should contain an element with the ID:
//
//   nav
//
// The generated navigation is appended to the element's existing HTML.
//
// CURRENT-PAGE BEHAVIOUR
//
// The function reads the current filename from window.location.pathname.
//
// For example:
//
//   population.html
//
// becomes:
//
//   population
//
// The corresponding desktop button receives the "current-page" class so that
// it can be styled differently.
//
// The mobile dropdown uses Bootstrap's "active" class for the current page.
//
// RETURNS
//
// This function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • reads the current browser path
//   • filters the configured navigation links
//   • appends navigation HTML to the #nav element
//   • adds current-page styling to the active desktop link
export function insertNavButtons() {

  // ===== PREPARE THE NAVIGATION LINKS =====
  const nav = document.getElementById("nav");

  const links = config.navigation.filter(l => l.href !== "projections.html" || config.show_projections);

  const pathname = window.location.pathname;
  const file = pathname.slice(pathname.lastIndexOf("/") + 1) || "index.html";
  const pageKey = file.replace(".html", "");

  // ===== INSERT THE MOBILE AND DESKTOP NAVIGATION =====
  nav.innerHTML += `
    <div class="container-fluid px-1">

      <!-- Mobile navigation -->
      <div class="d-lg-none w-100 text-center pb-2 mt-1">
        <div class="dropdown d-inline-block">
          <button class="btn btn-primary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            aria-label="Open menu">
            <span class="me-1 display-6">Menu
            <i class="bi bi-list" aria-hidden="true"></i></span>
          </button>

          <ul class="dropdown-menu start-50 translate-middle-x">
            ${links
            .map(
              (l) => `
                <li>
                  <a class="dropdown-item ${l.href.replace(".html", "-btn") === `${pageKey}-btn` ? "active" : ""}"
                    id="${l.href.replace(".html", "-btn")}-mobile"
                    href="${l.href}">
                    ${l.text}
                  </a>
                </li>`
            )
            .join("")}
          </ul>
        </div>
      </div>

      <!-- Desktop navigation -->
      <div class="d-none d-lg-block">
        <div class="row g-2">
          ${links
            .map(
              (l) => `
                <a id="${l.href.replace(".html", "-btn")}" class="col nav-btn d-flex justify-content-center align-items-center text-center" href="${l.href}">
                  ${l.text}
                </a>`
            )
            .join("")}
        </div>
      </div>

    </div>
  `;

  // ===== HIGHLIGHT THE CURRENT DESKTOP PAGE =====
  const currentDesktop = document.getElementById(`${pageKey}-btn`);
  if (currentDesktop) {
    currentDesktop.classList.add("current-page");
    currentDesktop.classList.remove("nav-btn");
    currentDesktop.innerHTML = currentDesktop.textContent;
  }
}


// ===== INSERT THE PAGE FOOTER =====
//
// Build and insert the shared application footer.
//
// The footer contains:
//
//   • links to NISRA data tools
//   • corporate links
//   • social-media links
//   • copyright, privacy and accessibility links
//
// EXPECTED HTML
//
// The page should contain:
//
//   • an element with the ID "footer"
//
// The heights of these elements are used when calculating whether additional
// space is required above the footer.
//
// RETURNS
//
// This function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • adds classes to the #footer element
//   • replaces the footer's HTML
export function insertFooter () {

    // ===== PREPARE THE FOOTER =====
    const footer = document.getElementById("footer");

    footer.classList.add("footer");
    footer.classList.add("py-4");
    footer.classList.add("bg-nisra");
    footer.classList.add("text-nisra");
    
    // ===== INSERT THE FOOTER CONTENT =====
    footer.innerHTML = `<div class="container">
      <!-- Main footer links -->
      <div class="row mb-3">
        <div class="col-md-4">
          <h3 class="h5">Data Tools</h3>
          <ul class="list-unstyled">
            <li><a href="https://explore.nisra.gov.uk/local-stats/">Local Statistics Explorer</a></li>
            <li><a href="https://data.nisra.gov.uk">Data Portal</a></li>
            <li><a href="https://build.nisra.gov.uk/en/">Census Flexible Table Builder</a></li>
          </ul>
        </div>
        <div class="col-md-4">
          <h3 class="h5">Corporate</h3>
          <ul class="list-unstyled">
            <li><a href="https://www.nisra.gov.uk/">NISRA Website</a></li>
            <li><a href="https://www.nisra.gov.uk/about-us/careers">Careers</a></li>
            <li><a href="https://www.nisra.gov.uk/contact">Contact</a></li>
          </ul>
        </div>
        <div class="col-md-4">
          <h3 class="h5">Follow</h3>
          <ul class="list-inline">
            <li class="list-inline-item">
              <a href="https://www.facebook.com/nisra.gov.uk">
                <img src="assets/img/logo/facebook-brands-solid-full.svg" title="Facebook" role="img" class="img-50"/>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="https://x.com/NISRA/">
                <img src="assets/img/logo/x-twitter-brands-solid-full.svg" title="Twitter/X" role="img" class="img-50"/>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="https://www.youtube.com/user/nisrastats">
                <img src="assets/img/logo/youtube-brands-solid-full.svg" title="YouTube" role="img" class="img-50"/>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="https://www.linkedin.com/company/northern-ireland-statistics-and-research-agency/">
                <img src="assets/img/logo/linkedin-in-brands-solid-full.svg" title="LinkedIn" role="img" class="img-50"/>
              </a>
            </li>
            <li class="list-inline-item">
              <a href="https://www.instagram.com/nisra.gov.uk/">
                <img src="assets/img/logo/instagram-brands-solid-full.svg" title="Instagram" role="img" class="img-50"/>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Legal and accessibility links -->
      <ul class="list-inline footer-links text-center mb-0">
        <li class="list-inline-item"><a href="https://www.nisra.gov.uk/crown-copyright">© Crown Copyright</a></li>
        <li class="list-inline-item">|</li>
        <li class="list-inline-item"><a href="https://www.nisra.gov.uk/terms-and-conditions">Terms and conditions</a></li>
        <li class="list-inline-item">|</li>
        <li class="list-inline-item"><a href="https://www.nisra.gov.uk/cookies">Cookies</a></li>
        <li class="list-inline-item">|</li>
        <li class="list-inline-item"><a href="https://www.nisra.gov.uk/nisra-privacy-notice">Privacy</a></li>
        <li class="list-inline-item">|</li>
        <li class="list-inline-item"><a href="https://datavis.nisra.gov.uk/dissemination/accessibility-statement-visualisations.html">Accessibility Statement</a></li>
      </ul>
    </div>`

}

// ===== INSERT THE DOCUMENT HEAD AND LOAD SHARED LIBRARIES =====
//
// Replace the document's <head> contents and load the external stylesheets and
// JavaScript libraries required by the application.
//
// The function sets:
//
//   • character encoding
//   • responsive viewport settings
//   • the page title
//   • fonts
//   • Bootstrap styles
//   • Bootstrap Icons
//   • favicon files
//   • MapLibre styles
//   • the application's own stylesheet
//
// It then loads the shared JavaScript libraries one after another.
//
// PARAMETER
//
// title
//   The title of the current page.
//
//   It is combined with config.title to create the browser-tab title.
//
//   Example:
//
//     config.title: "Population Explorer"
//     title: "Migration"
//
//   Result:
//
//     Population Explorer - Migration
//
// LIBRARIES LOADED
//
// The function loads:
//
//   • Bootstrap
//   • Chart.js
//   • Chart.js Annotation
//   • Chart.js Data Labels
//   • MapLibre GL
//   • html2canvas
//   • Chart.js Treemap
//   • Papa Parse
//
// The scripts are awaited in sequence. This helps ensure that libraries which
// depend on earlier scripts are not loaded before their dependencies.
//
// RETURNS
//
// Returns a Promise because the external scripts are loaded asynchronously.
//
// The Promise resolves after all scripts have loaded and the body's inline
// style attribute has been removed.
//
// ERRORS
//
// If one of the scripts fails to load, the Promise returned by loadScript()
// rejects and insertHead() stops at that point.
//
// SIDE EFFECTS
//
// The function:
//
//   • replaces all existing content inside document.head
//   • changes the browser-tab title
//   • loads external stylesheets and scripts
//   • exposes the loaded libraries through their global browser objects
//   • removes the body's inline style attribute
export async function insertHead(title) {

  // ===== INSERT THE DOCUMENT METADATA AND STYLESHEETS =====
  const head = document.head;

  head.innerHTML = `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${config.title} - ${title}</title>

    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">

    <link rel="icon" href="assets/img/icon/favicon.ico" type="image/vnd.microsoft.icon" />
    <link rel="icon" type="image/png" href="assets/img/icon/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="assets/img/icon/favicon.svg" />
    <link rel="shortcut icon" href="assets/img/icon/favicon.ico" />
    <link rel="apple-touch-icon" sizes="180x180" href="assets/img/icon/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-title" content="${config.title} - ${title}" />

    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.css">

    <link rel="stylesheet" href="assets/css/styles.css">
  `;

  // ===== DEFINE THE SCRIPT LOADER =====
  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.onload = resolve;
      s.onerror = reject;
      head.appendChild(s);
    });

  // ===== LOAD THE SHARED JAVASCRIPT LIBRARIES =====
  await loadScript("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/3.0.1/chartjs-plugin-annotation.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2");
  await loadScript("https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.js");
  await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/chartjs-chart-treemap/dist/chartjs-chart-treemap.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/papaparse@5.5.3/papaparse.min.js");

  // ===== REVEAL THE PAGE BODY =====
  document.body.removeAttribute("style");

}