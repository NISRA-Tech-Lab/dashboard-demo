// ===== INSERT A SINGLE VALUE INTO THE PAGE =====
//
// Display a single value inside an HTML element.
//
// This helper is intended for simple statistics such as totals, percentages,
// dates or other individual values that are shown outside charts and tables.
//
// PARAMETERS
//
// element_id
//   The ID of the HTML element whose text should be updated.
//
//   Example:
//
//     element_id: "population-total"
//
// value
//   The value to display.
//
//   This may be a string, number, or any other value that can be converted to
//   text.
//
//   Examples:
//
//     "Northern Ireland"
//
//     1945321
//
//     "31 March 2025"
//
// BEHAVIOUR
//
// The function first checks whether an element with the supplied ID exists.
//
// If the element exists:
//
//   • its textContent is replaced with the supplied value
//
// If the element does not exist:
//
//   • nothing happens
//   • no error is generated
//
// Using textContent means the value is treated as plain text rather than HTML.
// Any HTML tags supplied as part of the value are displayed literally instead
// of being interpreted by the browser.
//
// RETURNS
//
// This function does not explicitly return a value.
//
// SIDE EFFECTS
//
// If the target element exists, its displayed text is replaced.
export function insertValue (element_id, value) {

    // ===== UPDATE THE ELEMENT'S TEXT =====
    document.getElementById(element_id)
        ? document.getElementById(element_id).textContent = value
        : null;

}