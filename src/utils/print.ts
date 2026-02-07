import { AppState } from "../state/model";

/**
 * Opens a print-friendly window containing the current table assignments.
 * Prints only table name/number and seated player list (with seat numbers).
 */
export function printPods(state: AppState) {
  const playersById = new Map(state.players.map(p => [p.playerId, p]));
  const catsById = new Map(state.categories.map(c => [c.categoryId, c]));

  const tables = [...state.tables].sort((a, b) => {
    // Keep in sync with tablesSorted() but avoid importing React code.
    const na = leadingNumber(a.name);
    const nb = leadingNumber(b.name);
    if (na !== null && nb !== null) return na - nb || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const blocks = tables
    .map(t => {
      const seated = t.seats
        .map((pid, idx) => ({ pid, idx }))
        .filter(x => !!x.pid)
        .map(x => {
          const p = playersById.get(x.pid!);
          const cat = p ? catsById.get(p.categoryId) : null;
          const catName = cat?.name ? ` (${cat.name})` : "";
          return `<li><span class="seat">${x.idx + 1}.</span> ${escapeHtml(p?.displayName ?? x.pid!)}${escapeHtml(catName)}</li>`;
        });

      if (seated.length === 0) return null;

      return `
        <section class="card">
          <div class="title">Table ${escapeHtml(String(t.name || ""))}</div>
          <ul class="list">
            ${seated.join("\n")}
          </ul>
        </section>
      `;
    })
    .filter(Boolean)
    .join("\n");

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>FNM Podder - Print</title>
      <style>
        :root { color-scheme: light; }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; }
        h1 { font-size: 18px; margin: 0 0 14px; }
        .sub { color: #444; font-size: 12px; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .card { border: 1px solid #ddd; border-radius: 10px; padding: 12px 14px; }
        .title { font-weight: 800; font-size: 16px; margin-bottom: 8px; }
        .list { margin: 0; padding-left: 0; list-style: none; }
        .list li { padding: 3px 0; font-size: 14px; }
        .seat { display: inline-block; width: 28px; color: #666; }
        @media print {
          body { margin: 12mm; }
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    </head>
    <body>
      <h1>FNM Podder — Table Assignments</h1>
      <div class="sub">Generated ${escapeHtml(new Date().toLocaleString())}</div>
      <div class="grid">
        ${blocks || "<div>No seated players.</div>"}
      </div>
      <script>
        // Auto-trigger print for one-click workflows.
        window.onload = () => window.print();
      </script>
    </body>
  </html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function leadingNumber(s: string): number | null {
  const m = String(s ?? "").trim().match(/^(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
