import React from "react";

type Kpi = { label: string; value: string; sub?: string };

function Card({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-neutral-50">{value}</div>
      {sub ? <div className="mt-1 text-xs text-neutral-500">{sub}</div> : null}
    </div>
  );
}

export default function DashboardPage() {
  const kpis: Kpi[] = [
    { label: "Total Booked Revenue (Season)", value: "$285,400" },
    { label: "Collected", value: "$195,200", sub: "Cash received" },
    { label: "Outstanding", value: "$90,200", sub: "Open balances" },
    { label: "Upcoming Payments (Next 60 days)", value: "$52,800" },
    { label: "Net Profit (Booked)", value: "$78,450", sub: "Revenue – expenses – guide pay" },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Outfitter Financial Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Season view • cash-flow + profitability
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/hunts/new"
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm"
            >
              New Hunt
            </a>
            <a
              href="/expenses"
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm"
            >
              Add Expense
            </a>
          </div>
        </div>

        {/* Filters */}
        <FilterBar />

        {/* KPI Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card title={kpis[0].label} value={kpis[0].value} />
          <Card
            title="Collected vs Outstanding"
            value={`${kpis[1].value} / ${kpis[2].value}`}
            sub="Collected / Outstanding"
          />
          <Card title={kpis[3].label} value={kpis[3].value} />
          <Card title="Deposit Compliance" value="86%" sub="Deposits paid on time" />
          <Card title={kpis[4].label} value={kpis[4].value} sub={kpis[4].sub} />
        </div>

        {/* Alerts + What Changed */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <InsightsPanel />
          <AlertsPanel />
          <ExportsPanel />
        </div>

        {/* Cashflow Forecast + Collections */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-400">Cashflow Forecast (Next 90 Days)</div>
              <div className="text-xs text-neutral-500">Expected inflows by week</div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <ForecastCard title="Next 7 days" amount="$8,100" sub="2 deposits due" />
              <ForecastCard title="Next 30 days" amount="$24,900" sub="Deposits + finals" />
              <ForecastCard title="Next 90 days" amount="$52,800" sub="Season pipeline" />
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
              <table className="w-full text-sm">
                <thead className="bg-neutral-900 text-neutral-400">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Week</th>
                    <th className="px-3 py-2 text-right font-medium">Expected In</th>
                    <th className="px-3 py-2 text-right font-medium">Forecast Spend</th>
                    <th className="px-3 py-2 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { week: "Jan 13–19", inflow: "$6,200", out: "$4,900", net: "$1,300" },
                    { week: "Jan 20–26", inflow: "$3,100", out: "$5,600", net: "-$2,500" },
                    { week: "Jan 27–Feb 2", inflow: "$9,400", out: "$4,200", net: "$5,200" },
                  ].map((r) => (
                    <tr key={r.week} className="border-t border-neutral-800">
                      <td className="px-3 py-2">{r.week}</td>
                      <td className="px-3 py-2 text-right font-medium">{r.inflow}</td>
                      <td className="px-3 py-2 text-right text-neutral-300">{r.out}</td>
                      <td className={`px-3 py-2 text-right font-medium ${r.net.startsWith("-") ? "text-red-300" : "text-emerald-300"}`}>
                        {r.net}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-neutral-500">
              Next step: wire this to invoice schedule items + expenses trend.
            </div>
          </div>

          <OverdueTable />
        </div>

        {/* Middle Section: Profit by type + Payment Timeline */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Profit by Hunt Type */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-sm text-neutral-400">Profit by Hunt Type</div>
            <div className="mt-4 space-y-3">
              {[
                { name: "Elk Backcountry", value: "$18,700" },
                { name: "Whitetail Deer", value: "$12,500" },
                { name: "Turkey Hunts", value: "$7,800" },
                { name: "Bear Hunts", value: "-$3,200" },
              ].map((row) => (
                <div key={row.name} className="flex items-center justify-between">
                  <div className="text-sm">{row.name}</div>
                  <div className={`text-sm font-medium ${row.value.startsWith("-") ? "text-red-300" : ""}`}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-neutral-500">
              Next step: calculate from hunt revenue − attached expenses − guide pay.
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 lg:col-span-2">
            <div className="text-sm text-neutral-400">Payment Timeline</div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <TimelineCard title="Deposit Due" date="Apr 15" amount="$14,500" />
              <TimelineCard title="Final Payment" date="Jun 10" amount="$38,300" />
              <TimelineCard title="Past Due" date="Overdue" amount="$3,400" danger />
            </div>
            <div className="mt-3 text-xs text-neutral-500">
              Next step: pull from invoice schedule items + mark paid.
            </div>
          </div>
        </div>

        {/* Spend Intelligence */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatList
            title="Spend by Category (MTD)"
            items={[
              { name: "Guide Pay", value: "$5,400" },
              { name: "Feed / Hay", value: "$1,900" },
              { name: "Fuel", value: "$1,250" },
              { name: "Land Access", value: "$900" },
              { name: "Repairs", value: "$620" },
            ]}
          />
          <StatList
            title="Biggest Vendors (MTD)"
            items={[
              { name: "Murdoch's", value: "$1,120" },
              { name: "Cenex Fuel", value: "$980" },
              { name: "Tractor Supply", value: "$740" },
              { name: "USFS Permit Fees", value: "$620" },
            ]}
          />
          <SpendSpikes />
        </div>

        {/* Recurring + Budget vs Actual */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RecurringWatchlist />
          <BudgetVsActual />
          <GuidePayForecast />
        </div>

        {/* Hunt P&L Tables */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <HuntPnLTable />
          <StatList
            title="Top Profitable Hunts"
            items={[
              { name: "Elk Backcountry — Smith", value: "$8,900" },
              { name: "Mule Deer Camp — Carter", value: "$6,400" },
              { name: "Spring Turkey — Lee", value: "$5,200" },
            ]}
          />
          <StatList
            title="Loss Leaders"
            danger
            items={[
              { name: "Bear Hunts — Promo", value: "-$3,200" },
              { name: "Discounted Dove — Group", value: "-$2,100" },
              { name: "Goodwill Hunt — Make-good", value: "-$1,500" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Added Advanced Components ---------- */

function FilterBar() {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {["MTD", "Last 30", "Season", "Custom"].map((label) => (
          <button
            key={label}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm">
          <option>Season: 2026</option>
          <option>Season: 2025</option>
        </select>

        <label className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm">
          <input type="checkbox" />
          Include unpaid
        </label>
      </div>
    </div>
  );
}

function ForecastCard({ title, amount, sub }: { title: string; amount: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-xs text-neutral-400">{title}</div>
      <div className="mt-2 text-xl font-semibold">{amount}</div>
      {sub ? <div className="mt-1 text-xs text-neutral-500">{sub}</div> : null}
    </div>
  );
}

function OverdueTable() {
  const rows = [
    { client: "John Smith", hunt: "Elk Backcountry", due: "Jan 03", amount: "$2,500", days: 8, type: "Final" },
    { client: "Kyle Adams", hunt: "Mule Deer Camp", due: "Dec 28", amount: "$1,800", days: 14, type: "Deposit" },
    { client: "Aaron Lee", hunt: "Spring Turkey", due: "Jan 06", amount: "$900", days: 5, type: "Final" },
  ];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-400">Collections</div>
          <div className="mt-1 text-xs text-neutral-500">Overdue deposits + finals</div>
        </div>
        <button className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm">
          Send reminders
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Client</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Due</th>
              <th className="px-3 py-2 text-left font-medium">Days</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.client + r.due} className="border-t border-neutral-800">
                <td className="px-3 py-2">
                  <div className="text-sm">{r.client}</div>
                  <div className="text-xs text-neutral-500">{r.hunt}</div>
                </td>
                <td className="px-3 py-2 text-neutral-300">{r.type}</td>
                <td className="px-3 py-2">{r.due}</td>
                <td className="px-3 py-2 text-red-300 font-medium">{r.days}</td>
                <td className="px-3 py-2 text-right font-medium">{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-neutral-500">
        Next step: connect to invoice schedule items + send SMS/email reminders.
      </div>
    </div>
  );
}

function SpendSpikes() {
  const rows = [
    { vendor: "Fuel", change: "+42%", note: "More scouting + hauling", level: "bad" },
    { vendor: "Feed / Hay", change: "+18%", note: "Winter increase", level: "warn" },
    { vendor: "Land Access", change: "+0%", note: "Stable", level: "ok" },
  ];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="text-sm text-neutral-400">Spend Spikes</div>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.vendor} className="flex justify-between gap-3">
            <div>
              <div className="text-sm">{r.vendor}</div>
              <div className="text-xs text-neutral-500">{r.note}</div>
            </div>
            <div
              className={`text-sm font-medium ${
                r.level === "bad" ? "text-red-300" : r.level === "warn" ? "text-amber-300" : "text-emerald-300"
              }`}
            >
              {r.change}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-neutral-500">
        Next step: compare current period vs previous period from expenses.
      </div>
    </div>
  );
}

function RecurringWatchlist() {
  const rows = [
    { vendor: "QuickBooks", amount: "$90/mo", note: "Recurring since Aug" },
    { vendor: "GoDaddy", amount: "$32/mo", note: "Recurring since Mar" },
    { vendor: "Unknown Vendor", amount: "$49/mo", note: "New recurring pattern" },
  ];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-400">Recurring Watchlist</div>
          <div className="mt-1 text-xs text-neutral-500">Possible subscriptions + duplicates</div>
        </div>
        <button className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm">
          Review
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.vendor} className="flex justify-between">
            <div>
              <div className="text-sm">{r.vendor}</div>
              <div className="text-xs text-neutral-500">{r.note}</div>
            </div>
            <div className="text-sm font-medium">{r.amount}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-neutral-500">
        Next step: detect recurring cadence (monthly/weekly) from expenses.
      </div>
    </div>
  );
}

function BudgetVsActual() {
  const rows = [
    { bucket: "Owner Pay", budget: "$12,000", actual: "$8,500", status: "ok" },
    { bucket: "Taxes", budget: "$8,000", actual: "$2,200", status: "warn" },
    { bucket: "Operating", budget: "$18,000", actual: "$20,400", status: "bad" },
    { bucket: "Guides", budget: "$22,000", actual: "$19,100", status: "ok" },
    { bucket: "Horses / Feed", budget: "$6,000", actual: "$6,900", status: "warn" },
  ];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="text-sm text-neutral-400">Budget vs Actual (Profit-First)</div>

      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Bucket</th>
              <th className="px-3 py-2 text-right font-medium">Budget</th>
              <th className="px-3 py-2 text-right font-medium">Actual</th>
              <th className="px-3 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.bucket} className="border-t border-neutral-800">
                <td className="px-3 py-2">{r.bucket}</td>
                <td className="px-3 py-2 text-right text-neutral-300">{r.budget}</td>
                <td className="px-3 py-2 text-right font-medium">{r.actual}</td>
                <td
                  className={`px-3 py-2 text-right font-medium ${
                    r.status === "bad" ? "text-red-300" : r.status === "warn" ? "text-amber-300" : "text-emerald-300"
                  }`}
                >
                  {r.status.toUpperCase()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-neutral-500">
        Next step: compute actuals from expense categories + payroll.
      </div>
    </div>
  );
}

function GuidePayForecast() {
  const rows = [
    { label: "Next 14 days", value: "$6,800", sub: "Expected guide payroll" },
    { label: "Next 30 days", value: "$14,200", sub: "Based on booked hunts" },
  ];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="text-sm text-neutral-400">Guide Pay Forecast</div>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <div>
              <div className="text-sm">{r.label}</div>
              <div className="text-xs text-neutral-500">{r.sub}</div>
            </div>
            <div className="text-sm font-medium">{r.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-neutral-500">
        Next step: guide pay rules engine (day rate / % / flat) + hunt days.
      </div>
    </div>
  );
}

function HuntPnLTable() {
  const rows = [
    { hunt: "Elk Backcountry — Smith", revenue: "$9,500", costs: "$600", guide: "$2,100", profit: "$6,800" },
    { hunt: "Mule Deer Camp — Carter", revenue: "$8,000", costs: "$800", guide: "$1,700", profit: "$5,500" },
    { hunt: "Bear Hunts — Promo", revenue: "$4,500", costs: "$1,900", guide: "$2,100", profit: "-$ -500" },
  ];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 lg:col-span-1">
      <div className="text-sm text-neutral-400">Hunt P&L (True)</div>
      <div className="mt-1 text-xs text-neutral-500">Revenue − expenses − guide pay</div>

      <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Hunt</th>
              <th className="px-3 py-2 text-right font-medium">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.hunt} className="border-t border-neutral-800">
                <td className="px-3 py-2">
                  <div className="text-sm">{r.hunt}</div>
                  <div className="text-xs text-neutral-500">
                    Rev {r.revenue} • Exp {r.costs} • Guide {r.guide}
                  </div>
                </td>
                <td className={`px-3 py-2 text-right font-medium ${r.profit.includes("-") ? "text-red-300" : "text-emerald-300"}`}>
                  {r.profit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-neutral-500">
        Next step: attach expenses to hunts + calculate profit rankings automatically.
      </div>
    </div>
  );
}

function InsightsPanel() {
  const rows = [
    { title: "Expenses up 18% vs last period", sub: "Mainly Fuel + Feed" },
    { title: "5 overdue payments", sub: "Total overdue: $3,400" },
    { title: "Collected down due to late finals", sub: "2 finals missed this week" },
  ];
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="text-sm text-neutral-400">What changed?</div>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.title}>
            <div className="text-sm">{r.title}</div>
            <div className="text-xs text-neutral-500">{r.sub}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-neutral-500">Next step: generate these from real trend deltas.</div>
    </div>
  );
}

function AlertsPanel() {
  const rows = [
    { label: "Cash gap risk", sub: "Week of Jan 20–26 forecast net -$2,500", level: "bad" },
    { label: "New recurring vendor", sub: "Unknown Vendor $49/mo", level: "warn" },
    { label: "High spend vendor", sub: "Murdoch's exceeded last month by 22%", level: "warn" },
  ];
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="text-sm text-neutral-400">Alerts</div>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm">{r.label}</div>
              <div className="text-xs text-neutral-500">{r.sub}</div>
            </div>
            <span
              className={`rounded-lg border px-2 py-1 text-xs ${
                r.level === "bad"
                  ? "border-red-900/50 bg-red-950 text-red-300"
                  : "border-amber-900/50 bg-amber-950 text-amber-300"
              }`}
            >
              {r.level.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-neutral-500">Next step: auto-alert rules (thresholds + anomalies).</div>
    </div>
  );
}

function ExportsPanel() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="text-sm text-neutral-400">Accountant Mode</div>
      <div className="mt-1 text-xs text-neutral-500">Exports + reconciliation</div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <button className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-left">
          Export expenses (CSV)
        </button>
        <button className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-left">
          Export hunt P&L (CSV)
        </button>
        <button className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-left">
          Export invoices + payments
        </button>
      </div>

      <div className="mt-3 text-xs text-neutral-500">
        Next step: implement exports via server route + Supabase queries.
      </div>
    </div>
  );
}

/* ---------- Helper Components ---------- */

function TimelineCard({
  title,
  date,
  amount,
  danger,
}: {
  title: string;
  date: string;
  amount: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-xs text-neutral-400">{title}</div>
      <div className={`mt-2 text-xl font-semibold ${danger ? "text-red-300" : ""}`}>
        {date}
      </div>
      <div className="mt-1 text-sm text-neutral-300">{amount}</div>
    </div>
  );
}

function StatList({
  title,
  items,
  danger,
}: {
  title: string;
  items: { name: string; value: string }[];
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-4 space-y-3">
        {items.map((row) => (
          <div key={row.name} className="flex justify-between">
            <div className="text-sm">{row.name}</div>
            <div className={`text-sm font-medium ${danger ? "text-red-300" : ""}`}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
