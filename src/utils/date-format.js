export function dateFormat(dateString) {
    return new Date(dateString).toLocaleDateString("en-GB",
        {
            day: "2-digit", 
            month: "long",
            year: "numeric"
        });
}