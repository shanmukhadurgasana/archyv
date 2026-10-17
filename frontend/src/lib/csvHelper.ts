/**
 * Shared CSV parsing and formatting utilities for ARCHYV Spreadsheet Viewer & Editor
 */

export interface ParsedCsvGrid {
  columns: string[];
  gridData: string[][];
}

/**
 * Parses raw CSV string into columns and grid rows
 */
export function parseCsvToGrid(rawContent: string): ParsedCsvGrid {
  const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return {
      columns: ["A", "B", "C", "D", "E"],
      gridData: [
        ["", "", "", "", ""],
        ["", "", "", "", ""]
      ]
    };
  }

  // Parse standard CSV handling commas inside quotes and escaped quotes
  const parsedRows: string[][] = lines.map(line => {
    const cells: string[] = [];
    let curr = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(curr.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        curr = "";
      } else {
        curr += ch;
      }
    }
    cells.push(curr.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return cells;
  });

  if (parsedRows.length === 0) {
    return {
      columns: ["A", "B", "C", "D", "E"],
      gridData: [["", "", "", "", ""]]
    };
  }

  const firstRow = parsedRows[0];
  const hasHeaderLikeRow = firstRow.some((c: string) => isNaN(Number(c)) && c.length > 0);
  let colLabels: string[];
  let bodyRows: string[][];

  if (hasHeaderLikeRow && parsedRows.length > 1) {
    colLabels = firstRow;
    bodyRows = parsedRows.slice(1);
  } else {
    const maxCols = Math.max(...parsedRows.map((r: string[]) => r.length), 5);
    colLabels = Array.from({ length: maxCols }, (_, i) => String.fromCharCode(65 + i));
    bodyRows = parsedRows;
  }

  const numCols = Math.max(colLabels.length, 5);
  while (colLabels.length < numCols) {
    colLabels.push(String.fromCharCode(65 + colLabels.length));
  }

  const normalizedRows = bodyRows.map(r => {
    const row = [...r];
    while (row.length < numCols) row.push("");
    return row;
  });

  return {
    columns: colLabels,
    gridData: normalizedRows
  };
}

/**
 * Converts columns and grid rows into CSV text with proper quotation
 */
export function gridToCsv(columns: string[], gridData: string[][]): string {
  const escapeCell = (val: string | undefined | null) => {
    const str = val === undefined || val === null ? "" : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerLine = columns.map(escapeCell).join(",");
  const bodyLines = gridData.map(row => row.map(escapeCell).join(","));

  return [headerLine, ...bodyLines].join("\n");
}

/**
 * Generates downloadable blob with UTF-8 BOM so Microsoft Excel opens directly without charset glitches
 */
export function createCsvBlob(columns: string[], gridData: string[][]): Blob {
  const csv = gridToCsv(columns, gridData).replace(/\n/g, "\r\n");
  return new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
}
