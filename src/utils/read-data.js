// ===== READ CSV DATA AND MATRIX METADATA =====
//
// Load the data and metadata required for one statistical matrix.
//
// The function downloads two files:
//
//   • public/data/data.json
//   • public/data/<matrix>.csv
//
// The CSV file contains the statistical observations.
//
// The JSON file contains supporting metadata for each matrix, such as labels,
// descriptions, units or source information.
//
// DATA STRUCTURE
//
// The CSV is parsed by Papa Parse using:
//
//   header: true
//     The first CSV row is treated as the column names.
//
//   dynamicTyping: true
//     Numeric and Boolean values are converted from text where possible.
//
//   skipEmptyLines: true
//     Blank rows are excluded from the result.
//
// Papa Parse returns the CSV as an array of row objects.
//
// This is broadly comparable to an R data frame:
//
//   • the complete array is similar to the data frame
//   • each object is similar to one row
//   • each object property is similar to one column
//
// Example CSV result:
//
//   [
//     {
//       Area: "Belfast",
//       Year: 2024,
//       Population: 345418
//     },
//     {
//       Area: "Lisburn and Castlereagh",
//       Year: 2024,
//       Population: 149106
//     }
//   ]
//
// PARAMETER
//
// matrix
//   The matrix name used to identify both the CSV file and its metadata entry.
//
//   Example:
//
//     matrix: "population"
//
//   This loads:
//
//     public/data/population.csv
//
//   and returns:
//
//     data["population"]
//
// RETURNS
//
// Returns a Promise because the files are loaded asynchronously.
//
// When successful, the Promise resolves to an array containing two items:
//
//   [
//     csv_data,
//     data[matrix]
//   ]
//
// The first item is the parsed CSV rows.
//
// The second item is the metadata object for the selected matrix.
//
// The result can be unpacked using array destructuring:
//
//   const [data, metadata] = await readData("population");
//
// This is similar in R to returning a list and extracting its elements:
//
//   result <- read_data("population")
//   data <- result[[1]]
//   metadata <- result[[2]]
//
// ERROR HANDLING
//
// If either file cannot be loaded or parsed, the function:
//
//   • writes an error message to the browser console
//   • returns undefined
//
// SIDE EFFECTS
//
// The function:
//
//   • downloads a JSON file
//   • downloads a CSV file
//   • may write an error to the browser console
export async function readData (matrix) {

    // ===== LOAD THE METADATA =====
    try {
        const res = await fetch("public/data/data.json");
        const data = await res.json();

        // ===== LOAD AND PARSE THE CSV DATA =====
        const response = await fetch(`public/data/${matrix}.csv`);
        const text = await response.text();

        const result = Papa.parse(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });

        const csv_data = result.data;

        // ===== RETURN THE DATA AND METADATA =====
        return [csv_data, data[matrix]];

    // ===== HANDLE LOADING ERRORS =====
    } catch (error) {
        console.error("Failed to load data:", error);
        return; 
    }
    
}