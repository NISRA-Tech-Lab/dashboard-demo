export const getMaxEntry = (obj, type = "max") => {
    const entries = Object.entries(obj);
    const entry = entries.reduce((best, current) => {
        const compare = type === "min"
            ? current[1] < best[1]
            : current[1] > best[1];
        return compare ? current : best;
    });
    return { key: entry[0], value: entry[1] };
};
