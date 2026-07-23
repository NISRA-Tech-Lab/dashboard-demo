export async function readData (matrix) {

    try {
        const res = await fetch("public/data/data.json");
        const data = await res.json();

        const response = await fetch(`public/data/${matrix}.csv`);
        const text = await response.text();

        const result = Papa.parse(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });

        const csv_data = result.data;

        return [data[matrix], csv_data];

    } catch (error) {
        console.error("Failed to load data:", error);
        return; 
    }
    
}