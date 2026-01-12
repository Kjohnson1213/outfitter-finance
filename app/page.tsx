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
      <div className="mt-2 text-3xl font-semibold text-neutral-50">
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-neutral-500">{sub}</div> : null}
    </div>
  );
}

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
      <div
        className={`mt-2 text-xl font-semibold ${
          danger ? "text-red-300" : ""
        }`}
      >
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
            <div
              className={`text-sm font-medium ${
                danger ? "text-red-300" : ""
              }`}
            >
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const kpis: Kpi[] = [
    { label: "Total Booked Revenue (Season)", value: "$285,400" },
    { label: "Collected", value: "$195,200", sub: "Cash received" },
    { label: "Outstanding", value: "$90,200", sub: "Open balances" },
    { label: "Upcoming Payments (Next 60 days)", value: "$52,800" },
    { label: "Net Profit (Booked)", value: "$78,450" },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Outfitter Financial Dashboard
            </h1>
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

        {/* KPI Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card title={kpis[0].label} value={kpis[0].value} />
          <Card
            title="Collected vs Outstanding"
            value={`${kpis[1].value} / ${kpis[2].value}`}
            sub="Collected / Outstanding"
          />
          <Card title={kpis[3].label} value={kpis[3].value} />
          <Card title={kpis[4].label} value={kpis[4].value} />
        </div>

        {/* Middle Section */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Profit by Hunt Type */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="text-sm text-neutral-400">
              Profit by Hunt Type
            </div>
            <div className="mt-4 space-y-3">
              {[
                { name: "Elk Backcountry", value: "$18,700" },
                { name: "Whitetail Deer", value: "$12,500" },
                { name: "Turkey Hunts", value: "$7,800" },
                { name: "Bear Hunts", value: "-$3,200" },
              ].map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between"
                >
                  <div className="text-sm">{row.name}</div>
                  <div className="text-sm font-medium">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 lg:col-span-2">
            <div className="text-sm text-neutral-400">Payment Timeline</div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <TimelineCard
                title="Deposit Due"
                date="Apr 15"
                amount="$14,500"
              />
              <TimelineCard
                title="Final Payment"
                date="Jun 10"
                amount="$38,300"
              />
              <TimelineCard
                title="Past Due"
                date="$3,400"
                amount="Overdue"
                danger
              />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatList
            title="Recent Expenses"
            items={[
              { name: "Guide Pay", value: "$5,400" },
              { name: "Horse Feed", value: "$1,200" },
              { name: "Land Access Fee", value: "$900" },
              { name: "Fuel", value: "$750" },
            ]}
          />
          <StatList
            title="Top Profitable Hunts"
            items={[
              { name: "Elk Backcountry", value: "$8,900" },
              { name: "Mule Deer Camp", value: "$6,400" },
              { name: "Spring Turkey", value: "$5,200" },
            ]}
          />
          <StatList
            title="Loss Leaders"
            danger
            items={[
              { name: "Bear Hunts", value: "-$3,200" },
              { name: "Discounted Dove Hunt", value: "-$2,100" },
              { name: "Goodwill Hunt", value: "-$1,500" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
