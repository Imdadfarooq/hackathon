/**
 * Minimal, dependency-free PDF generator.
 *
 * Produces a valid single-page PDF (Helvetica) with a title and body lines and
 * a correct cross-reference table. Used by the seed script to attach sample
 * course material; the mentor upload path accepts real uploaded PDFs instead.
 */

// Escape the characters that are special inside a PDF literal string.
function escapeText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // Drop any non-ASCII so the latin1 byte offsets stay exact.
    .replace(/[^\x20-\x7E]/g, '');
}

// Greedy word-wrap so long lines fit the page width.
function wrap(text, max = 88) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > max) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * @param {string} title Heading rendered at the top of the page.
 * @param {string[]} paragraphs Body paragraphs (word-wrapped automatically).
 * @returns {Buffer} PDF bytes.
 */
function makePdf(title, paragraphs = []) {
  // Build the content stream (text drawing operators).
  const ops = ['BT', '/F1 20 Tf', '72 740 Td', `(${escapeText(title)}) Tj`, '/F1 11 Tf', '0 -34 Td'];
  const bodyLines = [];
  paragraphs.forEach((p, idx) => {
    if (idx > 0) bodyLines.push(''); // blank line between paragraphs
    wrap(p).forEach((l) => bodyLines.push(l));
  });
  // Cap to what fits on one page.
  bodyLines.slice(0, 55).forEach((line) => {
    ops.push(`(${escapeText(line)}) Tj`);
    ops.push('0 -16 Td');
  });
  ops.push('ET');
  const contentStream = ops.join('\n');

  // PDF object bodies (1-indexed).
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
      + '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length); // byte offset of this object (ASCII => length == bytes)
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}

module.exports = { makePdf };
