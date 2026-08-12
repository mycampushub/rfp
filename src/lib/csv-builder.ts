/**
 * Simple CSV builder utility — no external dependencies.
 * Handles quoting, escaping, and BOM for Excel UTF-8 compatibility.
 */

/**
 * Escape a single CSV cell value.
 * Wraps in double quotes if the value contains commas, double quotes, or newlines.
 * Doubles any existing double quotes per RFC 4180.
 */
export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value)
  if (raw.includes('"') || raw.includes(",") || raw.includes("\n") || raw.includes("\r")) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

/**
 * Build a CSV string from headers and rows.
 */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(",")
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(","))
  return [headerLine, ...dataLines].join("\n")
}

/**
 * Return a CSV Response with proper headers including BOM for Excel.
 */
export function csvResponse(csv: string, filename: string): Response {
  const bom = "\uFEFF"
  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

/**
 * Return a JSON Response for the ?format=json fallback.
 */
export function jsonDataResponse<T>(data: T): Response {
  return Response.json(data)
}
