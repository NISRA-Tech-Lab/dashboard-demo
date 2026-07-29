// ===== FORMAT A DATE =====
//
// Convert a date into a human-readable UK date.
//
// The function accepts any date that can be interpreted by JavaScript's
// Date object and returns a formatted date string using UK conventions.
//
// PARAMETERS
//
// dateString
//   A date value that can be converted into a JavaScript Date object.
//
//   Typical examples include:
//
//     "2025-06-30"
//     "2025-06-30T14:30:00Z"
//
// RETURNS
//
// Returns a string in UK date format.
//
// Example:
//
//   Input:
//     "2025-06-30"
//
//   Output:
//     "30 June 2025"
//
// SIDE EFFECTS
//
// None. The function simply converts the supplied date into a formatted string.
export function dateFormat(dateString) {
    return new Date(dateString).toLocaleDateString("en-GB",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
}