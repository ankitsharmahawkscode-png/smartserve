// "November 3, 2026 at 1:10 PM"
export const fmtDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
};

// ---------- icons ----------
const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    {children}
  </svg>
);
export const LockIcon = () => (
  <Svg><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>
);
export const UnlockIcon = () => (
  <Svg><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></Svg>
);
export const CheckIcon = () => (
  <Svg><path d="M20 6 9 17l-5-5" /></Svg>
);
export const UndoIcon = () => (
  <Svg><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></Svg>
);
export const EyeIcon = () => (
  <Svg><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const EyeOffIcon = () => (
  <Svg><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19C5 19 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9" /><path d="M9.9 4.2A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a18.5 18.5 0 0 1-2.2 3.2" /><path d="M1 1l22 22" /></Svg>
);

export const actionBtn =
  'inline-flex h-8 w-9 items-center justify-center rounded text-white transition-opacity hover:opacity-85 disabled:opacity-50';

// ---------- table styling ----------
export const rowCls = 'border-b border-gray-200 even:bg-white odd:bg-[#f3f7fa] last:border-b-0';
export const td = 'border-r border-gray-200 px-3 py-3 align-top';
export const tdLast = 'px-3 py-3 align-top';

export function DataTable({ columns, minWidth = 900, children }) {
  return (
    <div className="overflow-x-auto rounded border border-gray-300">
      <table className="w-full border-collapse text-left text-[13px] text-gray-600" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-gray-300 text-gray-800">
            {columns.map((h) => (
              <th key={h} className="border-r border-gray-200 px-3 py-3 font-bold last:border-r-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// White card with a centred orange title and an optional button on the right
export function PageCard({ title, subtitle, action, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow sm:p-6">
      <div className="mb-5 flex flex-col items-center gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        <span className="hidden sm:block" />
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-[#d97706] sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="sm:justify-self-end">{action}</div>
      </div>
      {children}
    </div>
  );
}

// Reads whichever paging field names the API returns
export const serverPaging = (data, shown) => {
  const perPage = data?.perPage ?? data?.limit ?? 10;
  const total = data?.total ?? data?.totalItems ?? data?.count ?? shown;
  const totalPages = Math.max(1, data?.totalPages ?? data?.pages ?? Math.ceil(total / perPage));
  return { perPage, total, totalPages };
};

// "Showing 1 to 10 of N entries" + Previous / numbers / Next
export function TableFooter({ page, onPage, total, perPage, totalPages, shown }) {
  const current = Math.min(page, totalPages);
  const start = (current - 1) * perPage;

  const nums = [];
  const from = Math.max(1, Math.min(current - 2, totalPages - 4));
  const to = Math.min(totalPages, from + 4);
  for (let i = from; i <= to; i++) nums.push(i);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-teal-600 underline">
        Showing {start + 1} to {start + shown} of {total} entries
      </p>
      <div className="flex items-center gap-1 text-sm">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, current - 1))}
          disabled={current === 1}
          className="rounded bg-gray-500 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPage(n)}
            className={`min-w-[36px] rounded px-3 py-2 font-medium ${
              n === current ? 'bg-teal-600 text-white' : 'text-teal-700 hover:bg-gray-100'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages, current + 1))}
          disabled={current === totalPages}
          className="rounded bg-gray-500 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}