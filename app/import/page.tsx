"use client";

import { useState } from "react";
import Papa from "papaparse";

// ── Bookmarklet source code (Modified for Firefox / CSP safety) ───────────────
const LETTERBOXD_BOOKMARKLET = `(async function(){
  const el=document.createElement('div');
  el.id='mv-overlay';
  el.style='position:fixed;top:20px;right:20px;z-index:2147483647;background:#2f5d50;color:#fff;padding:14px 18px;border-radius:12px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;box-shadow:0 4px 24px rgba(0,0,0,.4);max-width:280px;line-height:1.5';
  document.body.appendChild(el);
  const say=t=>{el.textContent='🎬 MovieVault: '+t};
  say('Starting...');
  const match=location.pathname.match(/^\\/([^\\/]+)\\//);
  if(!match){say('Error: open your Letterboxd films page first.');return;}
  const user=match[1];
  const movies=[];const seen=new Set();
  let next='/'+user+'/films/';let page=0;
  while(next){
    page++;say('Scraping page '+page+'...');
    let html;
    try{const r=await fetch(next);if(!r.ok)break;html=await r.text();}catch(e){break;}
    const doc=new DOMParser().parseFromString(html,'text/html');
    doc.querySelectorAll('.griditem,.poster-container').forEach(el=>{
      const p=el.querySelector('[data-film-slug],[data-target-link],[data-item-link]');
      if(!p)return;
      const slug=p.dataset.filmSlug;
      const href=p.dataset.itemLink||p.dataset.targetLink||(slug?'/film/'+slug+'/':null);
      if(!href)return;
      const url='https://letterboxd.com'+href;
      if(seen.has(url))return;seen.add(url);
      let title=(p.dataset.itemName||p.dataset.filmName||p.querySelector('img')?.alt||'').replace(/\\s+\\(\\d{4}\\)$/,'').trim();
      if(!title)return;
      const dn=p.dataset.itemFullDisplayName||'';
      const ym=dn.match(/\\((\\d{4})\\)\\s*$/);
      const year=ym?parseInt(ym[1]):null;
      const re=el.querySelector('.rating');
      let rating=null;
      if(re){let r=0;for(const c of re.textContent){if(c==='\\u2605')r++;if(c==='\\u00bd')r+=.5;}if(r>0)rating=r;}
      movies.push({title,year,rating,sourceUrl:url,watchedDate:null});
    });
    const nx=doc.querySelector('.pagination a.next,.paginate-nextprev a.next');
    next=nx?nx.getAttribute('href'):null;
    if(next)await new Promise(r=>setTimeout(r,1200));
  }
  say('Downloading '+movies.length+' films...');
  try {
    const data = JSON.stringify({source:'letterboxd',movies}, null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movievault-letterboxd.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    el.style.background='#1a7a5e';
    say('Done! File downloaded. Upload it to MovieVault.');
  } catch(e) {
    el.style.background='#c0392b';
    say('Error saving file.');
  }
  setTimeout(()=>el.remove(),6000);
})();`;

// ── Component ─────────────────────────────────────────────────────────────────

function BookmarkletSection({
  code,
  label,
  icon,
  color,
  instructions
}: {
  code: string;
  label: string;
  icon: string;
  color: string;
  instructions: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-6 rounded-xl glass-card p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h2 className="font-black text-text">{label}</h2>
          <div className="text-xs font-semibold text-muted mt-1">{instructions}</div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-surface-2 p-4 rounded-lg">
        <button
          onClick={handleCopy}
          className={["shrink-0 px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition hover:scale-[1.02] active:scale-95", color].join(" ")}
        >
          {copied ? "✓ Copied to clipboard" : "Copy scraping code"}
        </button>
        <div className="text-sm font-medium text-muted">
          <p>1. Copy the code</p>
          <p>2. Open your profile page, press <kbd className="font-mono bg-surface border border-border px-1 py-0.5 rounded shadow-sm text-xs">F12</kbd> (Console)</p>
          <p>3. Paste the code and hit Enter</p>
        </div>
      </div>
    </section>
  );
}


function FileUploader() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    setError(null);

    try {
      const text = await file.text();
      let payload;

      if (file.name.toLowerCase().endsWith(".csv")) {
        const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true });
        if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
          throw new Error("Failed to parse CSV: " + parseResult.errors[0].message);
        }
        
        const rows = parseResult.data as Record<string, string>[];
        if (rows.length === 0) throw new Error("CSV file seems empty or invalid.");
        
        // Find the correct keys regardless of case
        const sample = rows[0];
        const keys = Object.keys(sample);
        const titleKey = keys.find(k => k.trim().toLowerCase() === "title");
        const ratingKey = keys.find(k => k.trim().toLowerCase() === "your rating");
        const urlKey = keys.find(k => k.trim().toLowerCase() === "url");
        const yearKey = keys.find(k => k.trim().toLowerCase() === "year");
        const dateKey = keys.find(k => k.trim().toLowerCase() === "date rated");
        
        if (!titleKey || !urlKey) {
          throw new Error("Invalid IMDb CSV format: missing Title or URL columns. Found columns: " + keys.join(", "));
        }
        
        const movies = [];
        for (const row of rows) {
          const title = row[titleKey];
          if (!title || !title.trim()) continue;
          
          const ratingStr = ratingKey ? row[ratingKey] : null;
          const ratingVal = ratingStr && ratingStr.trim() ? parseFloat(ratingStr) : null;
          
          movies.push({
            title: title.trim(),
            year: yearKey && row[yearKey] ? parseInt(row[yearKey]) : null,
            rating: ratingVal !== null ? ratingVal / 2 : null,
            sourceUrl: row[urlKey].trim(),
            watchedDate: dateKey && row[dateKey] ? row[dateKey] : null
          });
        }
        if (movies.length === 0) throw new Error("No valid movies found in the CSV.");
        payload = { source: "imdb", movies };
      } else {
        // Letterboxd JSON
        try {
          payload = JSON.parse(text);
          if (!payload.movies || payload.movies.length === 0) {
            throw new Error("No movies found in the JSON file.");
          }
        } catch {
          throw new Error("Invalid JSON file. Please upload the file generated by the scraper.");
        }
      }

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import");

      setResult({ added: data.addedCount, updated: data.updatedCount });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <section className="mt-8 rounded-xl border-2 border-dashed border-border bg-surface p-8 text-center transition-colors hover:border-accent/50">
      <h2 className="text-xl font-black text-text mb-2">Upload your file</h2>
      <p className="text-sm text-muted font-semibold mb-6">
        Accepts <code className="font-mono text-xs text-accent">movievault-letterboxd.json</code> OR IMDb&apos;s <code className="font-mono text-xs text-accent">ratings.csv</code>.
      </p>

      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-bold text-background shadow-soft transition hover:bg-accent/90 active:scale-95">
        {uploading ? "Importing..." : "Choose File (.json or .csv)"}
        <input
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      {result && (
        <div className="mt-4 block rounded-lg bg-surface-2 border border-border px-4 py-2 text-sm font-bold text-text">
          ✅ Import complete: {result.added} new movies added, {result.updated} updated.
        </div>
      )}
      {error && (
        <div className="mt-4 block rounded-lg bg-red-950/20 border border-red-900/50 px-4 py-2 text-sm font-bold text-red-500">
          ❌ {error}
        </div>
      )}
    </section>
  );
}

function PosterEnricher() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; remaining: number } | null>(null);

  async function startEnrichment() {
    setRunning(true);
    try {
      while (true) {
        const res = await fetch("/api/enrich", { method: "POST" });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Enrichment failed");
        
        setProgress({ processed: data.processed, remaining: data.totalRemaining });
        
        if (data.totalRemaining === 0 || data.processed === 0) {
          break; // Done
        }
      }
    } catch (err) {
      console.error(err);
      alert("Enrichment stopped or failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-black text-text">Fetch Movie Posters</h2>
        <p className="text-sm font-medium text-muted">
          Match your imported titles with TMDB to automatically download posters and overviews.
        </p>
      </div>
      
      <div className="flex flex-col items-end shrink-0">
        <button
          onClick={startEnrichment}
          disabled={running}
          className="rounded-lg bg-surface-2 border border-border px-5 py-2.5 text-sm font-bold text-text shadow-sm transition hover:bg-border disabled:opacity-50"
        >
          {running ? "Fetching..." : "Fetch Posters"}
        </button>
        {progress && (
          <p className="text-xs font-semibold text-muted mt-2">
            {progress.remaining > 0 ? `${progress.remaining} movies left` : "All movies enriched!"}
          </p>
        )}
      </div>
    </section>
  );
}

export default function ImportPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-14">
      {/* Header */}
      <section>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-accent">
          <span>⚡</span>
          Bulletproof Import
        </p>
        <h1 className="text-4xl font-black leading-tight tracking-[-0.03em] text-text sm:text-5xl">
          Bypass all restrictions.
        </h1>
        <p className="mt-4 max-w-xl text-base font-semibold text-muted">
          Because of strict bot protection on Letterboxd and IMDb, the most reliable way to get your data is using browser scripts or official exports.
        </p>
      </section>

      {/* Letterboxd Script */}
      <BookmarkletSection
        code={LETTERBOXD_BOOKMARKLET}
        label="Letterboxd — All Films"
        icon="🎞️"
        color="bg-[#2f5d50]"
        instructions={
          <>
            Go to <code className="rounded bg-ink/6 px-1 font-mono">letterboxd.com/cthboss001/films/</code>
          </>
        }
      />

      {/* IMDb CSV Instructions */}
      <section className="mt-4 rounded-xl glass-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <h2 className="font-black text-text">IMDb — All Ratings</h2>
            <div className="text-xs font-semibold text-muted mt-1">
              IMDb has a built-in export feature. No script needed!
            </div>
          </div>
        </div>
        
        <div className="text-sm font-medium text-muted/80 space-y-2 mt-4 ml-1">
          <p>1. Go to your <a href="https://www.imdb.com/list/ratings" target="_blank" rel="noreferrer" className="text-accent hover:underline">IMDb Ratings page</a>.</p>
          <p>2. Look for the <strong>Export</strong> button (it&apos;s often near the top right, sometimes behind a 3-dots menu icon).</p>
          <p>3. This will download a file named <code className="font-mono bg-surface-2 border border-border px-1 py-0.5 rounded text-xs">ratings.csv</code>.</p>
          <p>4. Upload that CSV file below.</p>
        </div>
      </section>

      {/* Uploader */}
      <FileUploader />

      {/* Poster Enrichment */}
      <PosterEnricher />

      {/* Notes */}
      <section className="mt-8 rounded-xl glass-card px-5 py-4 text-sm font-semibold text-muted">
        <p className="font-black text-text mb-1">📌 How to use the Console (F12) for Letterboxd</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Press <strong>F12</strong> (or right-click and select &quot;Inspect&quot;) to open Developer Tools</li>
          <li>Click the <strong>Console</strong> tab</li>
          <li>Paste the code and press Enter. A green box will appear showing progress.</li>
          <li>If your browser warns you about pasting code, you may need to type <code className="font-mono bg-surface-2 border border-border px-1 rounded">allow pasting</code> first.</li>
        </ul>
      </section>
    </main>
  );
}
