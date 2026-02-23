/**
 * Simple CSV Parser Utility
 * Converts CSV string data into an array of objects based on headers.
 */

export const parseCSV = <T>(csvText: string): T[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const results: T[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;

        const entry: any = {};
        headers.forEach((header, index) => {
            // Basic type inference
            const val = values[index];
            if (val.toLowerCase() === 'true') entry[header] = true;
            else if (val.toLowerCase() === 'false') entry[header] = false;
            else if (!isNaN(Number(val)) && val !== '') entry[header] = Number(val);
            else entry[header] = val;
        });
        results.push(entry as T);
    }

    return results;
};

/**
 * Maps CSV fields to our internal Database types
 */
export const mapFields = (data: any[], mapping: Record<string, string>) => {
    return data.map(item => {
        const mapped: any = {};
        Object.entries(mapping).forEach(([csvKey, internalKey]) => {
            mapped[internalKey] = item[csvKey];
        });
        return mapped;
    });
};
