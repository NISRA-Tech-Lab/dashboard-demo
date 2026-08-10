// ===== WRAP A LABEL ONTO MULTIPLE LINES =====
//
// Split a long text label into multiple shorter lines.
//
// This helper is primarily intended for chart labels where long category names
// need to wrap onto multiple lines rather than extending beyond the available
// space.
//
// The function breaks the label at word boundaries. Individual words are never
// split in half.
//
// PARAMETERS
//
// label
//   The text label to wrap.
//
//   Example:
//
//     "Causeway Coast and Glens"
//
// maxChars
//   Optional.
//
//   The maximum preferred number of characters per line.
//
//   The default is:
//
//     28
//
//   Smaller values produce more lines.
//
//   Larger values produce fewer lines.
//
// RETURN VALUE
//
// Returns an array of strings, where each element represents one line of the
// wrapped label.
//
// Example:
//
//   wrapLabel(
//     "Causeway Coast and Glens",
//     12
//   )
//
// Returns:
//
//   [
//     "Causeway",
//     "Coast and",
//     "Glens"
//   ]
//
// This format is recognised by Chart.js, which displays each array element on
// a separate line when used as an axis or legend label.
//
// R COMPARISON
//
// This helper is broadly similar to preparing wrapped text before plotting in
// R. Instead of returning one long character string, it returns a character
// vector containing one element for each display line.
//
// SIDE EFFECTS
//
// None.
export function wrapLabel(label, maxChars = 28) {

  // ===== BUILD THE WRAPPED LABEL =====
  const words = label.split(' ');
  const lines = [];
  let line = '';

  for (const w of words) {
    const testLine = line ? line + ' ' + w : w;

    if (testLine.length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);

  // ===== RETURN THE WRAPPED LABEL =====
  return lines;
}