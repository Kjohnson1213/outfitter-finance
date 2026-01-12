"use client";

import React, { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type FormState = {
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  huntTitle: string;
  huntType: string; // Elk, Deer, Turkey, Bear
  totalPrice: string; // dollars
  depositPercent: string; // 0-100
  huntStart: string; // YYYY-MM-DD
};

function dollarsToCents(dollars: string): number {
  const n = Number(dollars);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function addDays(dateStr: string, days: number): string {
  // dateStr: YYYY-MM-DD
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
}

export default function NewHuntPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // MVP default org/season: you will wire these from onboarding soon.
  // For now, hardcode after you create them in Supabase (or temporarily paste IDs).
  const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || "";
  const SEASON_ID = process.env.NEXT_PUBLIC_SEASON_ID || "";

  const [form, setForm] = useState<FormState>({
    clientFirstName: "",
    clientLastName: "",
    clientEmail: "",
    huntTitle: "",
    huntType: "Elk",
    totalPrice: "6000",
    depositPercent: "50",
    huntStart: "",
  });

  const totalCents = useMemo(() => dollarsToCents(form.totalPrice), [form.totalPrice]);
  const depositCents = useMemo(() => {
    const pct = Number(form.depositPercent);
    if (!Number.isFinite(pct)) return 0;
    return Math.round(totalCents * (pct / 100));
  }, [totalCents, form.depositPercent]);
  const finalCents = useMemo(() => Math.max(totalCents - depositCents, 0), [totalCents, depositCents]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!ORG_ID || !SEASON_ID) {
      setMsg(
        "Missing ORG_ID / SEASON_ID. Temporary MVP: add NEXT_PUBLIC_ORG_ID and NEXT_PUBLIC_SEASON_ID to .env.local."
      );
      return;
    }
    if (!form.huntStart) {
      setMsg("Please select a hunt start date.");
      return;
    }
    if (!form.huntTitle.trim()) {
      setMsg("Please enter a hunt title.");
      return;
    }

    setLoading(true);
    try {
      // 1) Create client
      const { data: client, error: clientErr } = await supabase
        .from("clients")
        .insert({
          org_id: ORG_ID,
          first_name: form.clientFirstName,
          last_name: form.clientLastName,
          email: form.clientEmail,
        })
        .select()
        .single();

      if (clientErr) throw clientErr;

      // 2) Create hunt
      const { data: hunt, error: huntErr } = await supabase
        .from("hunts")
        .insert({
          org_id: ORG_ID,
          season_id: SEASON_ID,
          client_id: client.id,
          title: form.huntTitle,
          hunt_start: form.huntStart,
          total_price_cents: totalCents,
          status: "booked",
        })
        .select()
        .single();

      if (huntErr) throw huntErr;

      // 3) Create invoice
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          org_id: ORG_ID,
          hunt_id: hunt.id,
          total_cents: totalCents,
          currency: "USD",
        })
        .select()
        .single();

      if (invErr) throw invErr;

      // 4) Create schedule items
      // Deposit due today, final due based on hunt type timing rule (simple MVP rules)
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      // Timing rules (you can edit later):
      // Elk: final 60 days prior; Deer/Bear: 45 days prior; Turkey: 30 days prior
      const daysPrior =
        form.huntType === "Elk" ? 60 : form.huntType === "Turkey" ? 30 : 45;

      const finalDue = subtractDays(form.huntStart, daysPrior);

      const schedule = [
        {
          org_id: ORG_ID,
          invoice_id: invoice.id,
          label: "Deposit",
          due_date: todayStr,
          amount_cents: depositCents,
          status: "due",
        },
        {
          org_id: ORG_ID,
          invoice_id: invoice.id,
          label: "Final Payment",
          due_date: finalDue,
          amount_cents: finalCents,
          status: "due",
        },
      ].filter((x) => x.amount_cents > 0);

      const { error: schedErr } = await supabase
        .from("invoice_schedule_items")
        .insert(schedule);

      if (schedErr) throw schedErr;

      setMsg("✅ Hunt created with invoice + deposit/final schedule.");
      setForm((f) => ({ ...f, huntTitle: "", clientEmail: "", clientFirstName: "", clientLastName: "" }));
    } catch (err: any) {
      setMsg(`❌ Error: ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">New Hunt</h1>
        <p className="mt-2 text-neutral-400">
          MVP: creates Client → Hunt → Invoice → Deposit/Final schedule in Supabase.
        </p>

        {msg ? (
          <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm">
            {msg}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <div className="text-xs text-neutral-400">Client First Name</div>
              <input
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
                value={form.clientFirstName}
                onChange={(e) => setForm({ ...form, clientFirstName: e.target.value })}
              />
            </label>

            <label className="space-y-1">
              <div className="text-xs text-neutral-400">Client Last Name</div>
              <input
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
                value={form.clientLastName}
                onChange={(e) => setForm({ ...form, clientLastName: e.target.value })}
              />
            </label>
          </div>

          <label className="space-y-1">
            <div className="text-xs text-neutral-400">Client Email</div>
            <input
              type="email"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
              value={form.clientEmail}
              onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
            />
          </label>

          <label className="space-y-1">
            <div className="text-xs text-neutral-400">Hunt Title</div>
            <input
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
              placeholder="Smith - Public Land Elk (1x1)"
              value={form.huntTitle}
              onChange={(e) => setForm({ ...form, huntTitle: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="space-y-1">
              <div className="text-xs text-neutral-400">Hunt Type</div>
              <select
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
                value={form.huntType}
                onChange={(e) => setForm({ ...form, huntType: e.target.value })}
              >
                <option>Elk</option>
                <option>Deer</option>
                <option>Turkey</option>
                <option>Bear</option>
              </select>
            </label>

            <label className="space-y-1">
              <div className="text-xs text-neutral-400">Total Price ($)</div>
              <input
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
                value={form.totalPrice}
                onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
              />
            </label>

            <label className="space-y-1">
              <div className="text-xs text-neutral-400">Deposit %</div>
              <input
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
                value={form.depositPercent}
                onChange={(e) => setForm({ ...form, depositPercent: e.target.value })}
              />
            </label>
          </div>

          <label className="space-y-1">
            <div className="text-xs text-neutral-400">Hunt Start Date</div>
            <input
              type="date"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
              value={form.huntStart}
              onChange={(e) => setForm({ ...form, huntStart: e.target.value })}
            />
          </label>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Deposit</span>
              <span>${(depositCents / 100).toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-neutral-400">Final</span>
              <span>${(finalCents / 100).toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Hunt"}
          </button>
        </form>

        <a
          href="/dashboard"
          className="mt-6 inline-block rounded-xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-sm"
        >
          ← Back to Dashboard
        </a>
      </div>
    </main>
  );
}
