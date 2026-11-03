export const config = {
    // Dashboard title
    "title": "Dashboard template",

    // Set order of page links and display text in navigation bar
    "navigation": [
        { href: "index.html", text: "Home" },
        { href: "page.html", text: "Page" },
        { href: "user-notes.html", text: "User Notes" }  
    ],
    
    // Version of NISRA Data portal to use.
    // Enter "data" for the live portal or "pp" for the pre-production portal.
    "portal": "data",

    // Departmental abbreviations. See departments.js for available options
    "department": "DoF",

    // Data portal tables to use in the dashboard.
    // Re-run "src/r/data.R" script after each update to list below
    "matrix": [
        "EXAMPLETABLE1",
        "EXAMPLETABLE2"
    ],
    
    "rateit": "link-to-rateit"
    
}