export const config = {
    // Dashboard title
    "title": "Dashboard Template",

    // Set order of page links and display text in navigation bar
    "navigation": [
        { href: "index.html", text: "Home" },
        { href: "page.html", text: "Page" },
        { href: "user-notes.html", text: "User Notes" }  
    ],
    
    "portal_url": "https://data.nisra.gov.uk/",

    // Departmental abbreviations. See departments.js for available options
    "department": "DoH",

    // Data portal tables to use in the dashboard.
    "matrix": [
        "EXAMPLETABLE1",
        "EXAMPLETABLE2"
    ],
    
    "rateit": "link-to-rateit"
    
}