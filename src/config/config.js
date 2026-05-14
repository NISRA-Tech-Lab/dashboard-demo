export const config = {
    // Dashboard title
    "title": "Demo Dashboard",

    // Set order of page links and display text in navigation bar
    "navigation": [
        { href: "index.html", text: "Home" },
        { href: "population-estimates.html", text: "Population Estimates" },
        { href: "population-change.html", text: "Population Change" },
        { href: "migration.html", text: "Migration"},
        { href: "age-structure.html", text: "Age Structure" }, 
        { href: "over-85s.html", text: "Over 85s" }, 
        {href: "local-populations.html", text: "Local Populations"},
        { href: "user-notes.html", text: "User Notes" }  
    ],
    
    "portal_url": "https://data.nisra.gov.uk/",

    // Departmental abbreviations. See departments.js for available options
    "department": "DoF",

    // Data portal tables to use in the dashboard.
    "matrix": [
        "MYE01T05",  // Population totals
        "MYE01T03",  // Broad age bands
        "MYE01T06",  // Local Government Districts
        "MYE01T025", // Over 85s
        "COPC01T01"  // Component of population change
    ],
    
    "rateit": "link-to-rateit"
    
}