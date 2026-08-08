/**
 * Minimal, dependency-free CSV serializer.
 * Escapes values per RFC 4180 (quotes, commas, newlines).
 */
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of plain objects to a CSV string.
 * @param {Array<Object>} rows
 * @param {Array<{ key: string, label: string }>} columns column definitions
 */
function toCSV(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCell(row[c.key])).join(','))
    .join('\r\n');
  return `${header}\r\n${body}`;
}

module.exports = { toCSV };
