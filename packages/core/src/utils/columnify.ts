import stringWidth from 'fast-string-width';

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

  if (!rows.length) return '';

  // determine column order
  const columns: string[] = opts.columns || opts.include || Object.keys(rows[0]);

  // compute widths
  const widths: Record<string, number> = {};
  // build an ANSI-regex without embedding control characters in source
  const esc = String.fromCharCode(27);
  const ansiRegex = new RegExp(esc + '\\[[0-9;]*m', 'g');

  for (const col of columns) {
    let w = 0;
    if (opts.showHeaders) w = Math.max(w, String(col).length);
    for (const row of rows) {
      const cell = row[col] ?? '';
      const raw = String(cell);
      const visible = raw.replace(ansiRegex, '');
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
    const visible = raw.replace(ansiRegex, '');
    const visibleWidth = stringWidth(visible);
    // compute target code-unit length to pad to. raw.length includes ANSI
    // sequences, so add the delta between desired visible width and actual
    // visible width to raw.length to get the proper pad target.
    const delta = width - visibleWidth;
    const target = raw.length + (delta > 0 ? delta : 0);
    if (target <= raw.length) return raw;
    if (align === 'right') return raw.padStart(target, ' ');
    return raw.padEnd(target, ' ');
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
