/**
 * A small CSV reader for the admin bulk-import screen.
 *
 * Deliberately dependency-free and deliberately limited: it handles quoted
 * fields, escaped double-quotes ("") and newlines inside quotes, which covers
 * the "export from Sheets/Excel" case this screen exists for. It is not a
 * full RFC 4180 implementation and makes no attempt at encoding detection or
 * separator sniffing — if this screen ever needs to ingest arbitrary
 * third-party files, swap it for a real parser (papaparse) rather than
 * growing this one.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Normalise line endings first so \r\n inside quotes doesn't leak through.
  const src = text.replace(/\r\n?/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const char = src[i];

    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // Flush the trailing field/row unless the file simply ended with a newline.
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Column headers the import screen understands, in the order of the template. */
export const IMPORT_COLUMNS = [
  "name",
  "industrySlug",
  "regionSlug",
  "website",
  "shortDescription",
  "longDescription",
  "city",
  "foundingYear",
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number];

/** Turns a parsed CSV grid into objects keyed by the header row. */
export function rowsToObjects(grid: string[][]): {
  objects: Record<string, string>[];
  unknownColumns: string[];
  missingColumns: string[];
} {
  if (!grid.length) return { objects: [], unknownColumns: [], missingColumns: [...IMPORT_COLUMNS] };

  const header = grid[0].map((h) => h.trim());
  const known = new Set<string>(IMPORT_COLUMNS);
  const unknownColumns = header.filter((h) => h && !known.has(h));
  const required: ImportColumn[] = [
    "name",
    "industrySlug",
    "regionSlug",
    "website",
    "shortDescription",
    "longDescription",
  ];
  const missingColumns = required.filter((c) => !header.includes(c));

  const objects = grid.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    header.forEach((key, idx) => {
      if (key) obj[key] = (cells[idx] ?? "").trim();
    });
    return obj;
  });

  return { objects, unknownColumns, missingColumns };
}

export const IMPORT_TEMPLATE = `${IMPORT_COLUMNS.join(",")}
Example Microfinance,lending,lagos,https://example.com,"A one-line summary shown in the directory table.","The longer profile description that appears on the company page. At least twenty characters.",Ikeja,2019`;
