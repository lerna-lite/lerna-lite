// replaces columnify package with a custom implementation to avoid a dependency and allow for better control over formatting, especially ANSI handling
// https://github.com/timoxley/columnify/blob/master/index.js

import { alignLeft, alignRight, stripAnsi, stringWidth } from '@lerna-lite/npmlog';

export function columnify(data: any, options: any = {}): string {
  const opts = Object.assign(
    {
      showHeaders: true,
      columns: undefined,
      include: undefined,
      config: {},
      columnSplitter: ' ',
    },
    options
  );

  // If input is a plain object (e.g., dependencies map), format as key + splitter + value per line
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data);
    return entries
      .map(([k, v]) => {
        if (opts.columnSplitter) {
          return `${k}${opts.columnSplitter}${String(v)}`;
        }
        return `${k} ${String(v)}`;
      })
      .join('\n');
  }

  const rows: Record<string, string>[] = (Array.isArray(data) ? data : []).map((r) => {
    const obj: Record<string, string> = {};
    for (const k of Object.keys(r || {})) {
      const v = (r as any)[k];
      obj[k] = v === undefined || v === null ? '' : String(v);
    }
    return obj;
  });

  if (!rows.length) {
    return '';
  }

  // determine column order
  const columns: string[] = opts.columns || opts.include || Object.keys(rows[0]);

  // compute widths
  const widths: Record<string, number> = {};

  for (const col of columns) {
    let w = 0;
    if (opts.showHeaders) {
      w = Math.max(w, String(col).length);
    }
    for (const row of rows) {
      const cell = row[col] ?? '';
      const raw = String(cell);
      const visible = stripAnsi(raw);
      w = Math.max(w, stringWidth(visible));
    }
    widths[col] = w;
  }

  // helper to pad according to config
  const padCell = (col: string, val: string) => {
    const cfg = opts.config?.[col];
    const align = cfg?.align === 'right' ? 'right' : 'left';
    const width = widths[col] || 0;
    const raw = String(val);

    // Delegate alignment to npmlog's wideAlign helpers which
    // correctly account for ANSI sequences and wide characters.
    if (align === 'right') {
      return alignRight(raw, width);
    }

    return alignLeft(raw, width);
  };

  const lines: string[] = [];

  if (opts.showHeaders) {
    // keep headers unpadded so snapshots remain stable (no trailing spaces)
    lines.push(columns.map((c) => String(c)).join(opts.columnSplitter));
  }

  for (const row of rows) {
    const parts = columns.map((col) => padCell(col, row[col] ?? ''));
    lines.push(parts.join(opts.columnSplitter));
  }

  return lines.join('\n');
}

export default columnify;
