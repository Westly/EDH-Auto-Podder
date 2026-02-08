import { AppState } from "../state/model";

function esc(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function openPrintView(state: AppState) {
  const w = window.open("", "_blank");
  if (!w) return;

  const playersById = new Map(state.players.map(p => [p.playerId, p]));
  const catsById = new Map(state.categories.map(c => [c.categoryId, c]));

  const tables = state.tables
    .slice()
    .sort((a, b) => {
      const an = Number(String(a.name).trim());
      const bn = Number(String(b.name).trim());
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return String(a.name).localeCompare(String(b.name));
    });

  const body = tables
    .map(t => {
      const lines = t.seats.map((pid, idx) => {
        if (!pid) {
          return `<div class="row"><span class="seat">${idx + 1}.</span><span class="empty">&mdash;</span></div>`;
        }
        const p = playersById.get(pid);
        const cat = p ? catsById.get(p.categoryId) : null;
        const catName = cat ? ` (${esc(cat.name)})` : "";
        const name = esc(p?.displayName ?? pid);
        return `<div class="row"><span class="seat">${idx + 1}.</span><span class="name">${name}</span><span class="cat">${catName}</span></div>`;
      });

      return `
        <section class="table">
          <div class="tableTitle">Table ${esc(t.name)}</div>
          <div class="tableBody">${lines.join("")}</div>
        </section>
      `;
    })
    .join("");

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Auto Podder - Print</title>
      <style>
        :root { color-scheme: light; }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 24px; color: #111; }
        h1 { font-size: 18px; margin: 0 0 14px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
        .table { border: 1px solid #ddd; border-radius: 10px; padding: 12px; }
        .tableTitle { font-weight: 800; font-size: 16px; margin-bottom: 10px; }
        .row { display: grid; grid-template-columns: 24px 1fr auto; gap: 8px; align-items: baseline; padding: 3px 0; }
        .seat { font-weight: 700; color: #444; }
        .name { font-weight: 700; }
        .cat { color: #555; font-size: 12px; }
        .empty { color: #999; }
        @media print {
          body { margin: 0; }
          .table { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>Auto Podder Seating</h1>
      <div class="grid">${body}</div>
      <script>window.onload = () => window.print();</script>
    </body>
  </html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}
