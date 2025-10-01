import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ChevronDown, X, Loader2 } from "lucide-react";

// ---- Helper UI bits (minimal, Tailwind only) ----
const Chip = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs leading-none">
    {children}
  </span>
);

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 select-none cursor-pointer">
    <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e)=>onChange(e.target.checked)} />
    <span className="h-5 w-9 rounded-full bg-gray-300 peer-checked:bg-blue-600 relative transition-colors">
      <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
    </span>
    <span className="text-sm">{label}</span>
  </label>
);

const Dropdown = ({ label, items, selected, setSelected, placeholder = "Select…" }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
      >
        <Filter className="h-4 w-4" />
        {label}
        <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-64 rounded-xl border bg-white p-2 shadow-lg">
          <div className="max-h-64 overflow-auto pr-1">
            {items.map((it) => {
              const isSel = selected.includes(it);
              return (
                <button
                  key={it}
                  onClick={() => {
                    setSelected(
                      isSel ? selected.filter((s) => s !== it) : [...selected, it]
                    );
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-gray-50 ${
                    isSel ? "bg-gray-50" : ""
                  }`}
                >
                  <span className="truncate">{it}</span>
                  <span className={`h-4 w-4 rounded-sm border ${isSel ? "bg-blue-600 border-blue-600" : "bg-white"}`} />
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => setSelected([])}
              className="text-xs underline"
            >
              Clear
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Pagination = ({ page, pageSize, total, onPage }) => {
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="opacity-70">Page {page} of {maxPage}</span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border px-3 py-2 disabled:opacity-50"
        >
          Prev
        </button>
        <button
          disabled={page >= maxPage}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border px-3 py-2 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ---- Mock data (used when no fetchUrl provided) ----
const MOCK = {
  items: [
    {
      id: 1,
      name: "Acme Systems",
      logoUrl: "https://dummyimage.com/80x80/eee/333&text=A",
      country: "Canada",
      region: "North America",
      tier: "Gold",
      solutions: [
        { id: 3, name: "OpenText Content Suite", slug: "content-suite" },
        { id: 7, name: "Documentum", slug: "documentum" },
      ],
    },
    {
      id: 2,
      name: "ByteWorks GmbH",
      logoUrl: "https://dummyimage.com/80x80/eee/333&text=B",
      country: "Germany",
      region: "EMEA",
      tier: "Silver",
      solutions: [],
    },
    {
      id: 3,
      name: "CloudNine LLC",
      logoUrl: "https://dummyimage.com/80x80/eee/333&text=C",
      country: "USA",
      region: "North America",
      tier: "Platinum",
      solutions: [
        { id: 9, name: "Core Capture", slug: "core-capture" },
      ],
    },
  ],
};

// ---- Main Component ----
export default function PartnerDirectoryDemo({ fetchUrl, initialData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partners, setPartners] = useState(initialData?.items ?? MOCK.items);

  // Filters
  const [query, setQuery] = useState("");
  const [regions, setRegions] = useState([]); // multi-select
  const [tiers, setTiers] = useState([]); // multi-select
  const [solutionsFilter, setSolutionsFilter] = useState([]); // multi-select by solution name
  const [onlyWithSolutions, setOnlyWithSolutions] = useState(false); // "Listed Solutions" toggle

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Load from API (optional)
  useEffect(() => {
    if (!fetchUrl) return;
    let ignore = false;
    setLoading(true);
    fetch(fetchUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!ignore) {
          const list = data.items ?? data;
          setPartners(list);
        }
      })
      .catch((e) => !ignore && setError(e.message))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, [fetchUrl]);

  // Derive filter options from data
  const allRegions = useMemo(
    () => Array.from(new Set((partners ?? []).map((p) => p.region).filter(Boolean))).sort(),
    [partners]
  );
  const allTiers = useMemo(
    () => Array.from(new Set((partners ?? []).map((p) => p.tier).filter(Boolean))).sort(),
    [partners]
  );
  const allSolutions = useMemo(
    () => Array.from(
      new Set(
        partners
          .flatMap((p) => p.solutions?.map((s) => s.name) ?? [])
          .filter(Boolean)
      )
    ).sort(),
    [partners]
  );

  // Filtering logic
  const filtered = useMemo(() => {
    let list = partners ?? [];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.solutions ?? []).some((s) => s.name.toLowerCase().includes(q))
      );
    }

    if (onlyWithSolutions) {
      list = list.filter((p) => (p.solutions?.length ?? 0) > 0);
    }

    if (regions.length) {
      list = list.filter((p) => regions.includes(p.region));
    }

    if (tiers.length) {
      list = list.filter((p) => tiers.includes(p.tier));
    }

    if (solutionsFilter.length) {
      list = list.filter((p) =>
        (p.solutions ?? []).some((s) => solutionsFilter.includes(s.name))
      );
    }

    return list;
  }, [partners, query, regions, tiers, solutionsFilter, onlyWithSolutions]);

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [query, regions, tiers, solutionsFilter, onlyWithSolutions]);

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Partner Directory</h1>
          <p className="mt-1 text-sm opacity-70">
            Combined view showing partners and their associated solutions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Toggle
            checked={onlyWithSolutions}
            onChange={setOnlyWithSolutions}
            label="Listed Solutions"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search partners or solutions"
            className="w-72 rounded-xl border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <Dropdown label="Region" items={allRegions} selected={regions} setSelected={setRegions} />
        <Dropdown label="Tier" items={allTiers} selected={tiers} setSelected={setTiers} />
        <Dropdown label="Solutions" items={allSolutions} selected={solutionsFilter} setSelected={setSolutionsFilter} />

        {/* Active filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {regions.map((r) => (
            <Chip key={`r-${r}`}>
              {r}
              <button className="ml-1" onClick={() => setRegions(regions.filter((x) => x !== r))}>
                <X className="h-3 w-3" />
              </button>
            </Chip>
          ))}
          {tiers.map((t) => (
            <Chip key={`t-${t}`}>
              {t}
              <button className="ml-1" onClick={() => setTiers(tiers.filter((x) => x !== t))}>
                <X className="h-3 w-3" />
              </button>
            </Chip>
          ))}
          {solutionsFilter.map((s) => (
            <Chip key={`s-${s}`}>
              {s}
              <button className="ml-1" onClick={() => setSolutionsFilter(solutionsFilter.filter((x) => x !== s))}>
                <X className="h-3 w-3" />
              </button>
            </Chip>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm opacity-70">{total} result{total === 1 ? "" : "s"}</div>
        <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} />
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm opacity-70">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.logoUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded bg-white object-contain ring-1 ring-gray-200"
                />
                <div>
                  <div className="font-medium leading-tight">{p.name}</div>
                  <div className="text-xs opacity-70">
                    {[p.region, p.country, p.tier].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(p.solutions ?? []).slice(0, 4).map((s) => (
                  <Chip key={s.slug}>{s.name}</Chip>
                ))}
                {(p.solutions?.length ?? 0) > 4 && (
                  <span className="text-xs opacity-70">+{p.solutions.length - 4} more</span>
                )}
                {(p.solutions?.length ?? 0) === 0 && (
                  <span className="text-xs opacity-50 italic">No listed solutions</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6">
        <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} />
      </div>

      {/* Dev note / how-to-wire */}
      <div className="mt-8 rounded-xl border p-4 text-xs opacity-70">
        <p className="mb-2 font-medium">Wiring this to your API</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Pass <code>fetchUrl</code> pointing to your endpoint that returns an array of partners or
            <code>{`{ items: Partner[] }`}</code>.
          </li>
          <li>
            Each partner should include <code>solutions</code> as an array of <code>{`{ id, name, slug }`}</code>.
          </li>
          <li>Remove this note block in production.</li>
        </ol>
      </div>
    </div>
  );
}
