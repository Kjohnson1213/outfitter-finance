"use client";

import React, { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

function dollarsToCents(dollars: string): number {
  const n = Number(dollars);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function parseCSV(text: string): string[][] {
  // Simple CSV parser (handles quoted fields)
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((v) => v.trim().length > 0)) rows.push(row);
      row = [];
      continue;
    }
    cur += ch;
  }
  row.push(cur);
  if (row.some((v) => v.trim().length > 0)) rows.push(row);
  return rows;
}

function toISODate(input: string): string | null {
  // Accepts YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY
  const s = input.trim();
  if (!s) return null;

  // YYYY-MM-DD
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return s;

  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (us) {
    const mm = us[1].padStart(2, "0");
    const dd = us[2].padStart(2, "0");
    return `${us[3]}-${mm}-${dd}`;
  }
  return null;
}

export default function ExpensesPage() {
  const ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || "";
  const SEASON_ID = process.env.NEXT_PUBLIC_SEASON_ID || "";

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Manual expense form
  const [date, setDate] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [amount, setAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [huntId, setHuntId] = useState<string>(""); // "" = not attached
  const [hunts, setHunts] = useState<{ id: string; title: string }[]>([]);

  const amountCents = useMemo(() => dollarsToCents(amount), [amount]);

  React.useEffect(() => {
    async function loadHunts() {
      if (!ORG_ID) return;
      const q = supabase
        .from("hunts")
        .select("id,title")
        .eq("org_id", ORG_ID)
        .order("created_at", { ascending: false });

      const { data, error } = await q;
      if (!error && data) setHunts(data as any);
    }
    loadHunts();
  }, [ORG_ID]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!ORG_ID) return setMsg("Missing NEXT_PUBLIC_ORG_ID in .env.local");
    if (!date) return setMsg("Pick an expense date.");
    if (!amountCents) return setMsg("Enter a valid amount.");

    setLoading(true);
    try {
      const { error } = await supabase.from("expenses").insert({
        org_id: ORG_ID,
        season_id: SEASON_ID || null,
        hunt_id: huntId || null,
        expense_date: date,
        vendor: vendor || null,
        description: description || null,
        category: category || "Uncategorized",
        amount_cents: amountCents,
        payment_method: paymentMethod || null,
        source: "manual",
      });
      if (error) throw error;

      setMsg("✅ Expense saved.");
      setVendor("");
      setDescription("");
      setCategory("Uncategorized");
      setAmount("0");
    } catch (err: any) {
      setMsg(`❌ ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function importCSV(file: File) {
    setMsg(null);

    if (!ORG_ID) return setMsg("Missing NEXT_PUBLIC_ORG_ID in .env.local");

    setLoading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        setMsg("CSV looks empty.");
        return;
      }

      // You map columns by header names.
      // Expected headers (case-insensitive): date, amount, vendor, description, category, external_id
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (name: string) => header.indexOf(name);

      const iDate = idx("date");
      const iAmount = idx("amount");

      if (iDate === -1 || iAmount === -1) {
        setMsg(
          "CSV must include headers: date, amount (required). Optional: vendor, description, category, external_id"
        );
        return;
      }

      const iVendor = idx("vendor");
      const iDesc = idx("description");
      const iCat = idx("category");
      const iExt = idx("external_id");

      const payload = rows.slice(1).map((r) => {
        const d = toISODate(r[iDate] ?? "");
        const a = dollarsToCents((r[iAmount] ?? "").replace("$", "").replace(",", ""));
        const vendor = iVendor >= 0 ? (r[iVendor] || "").trim() : "";
        const desc = iDesc >= 0 ? (r[iDesc] || "").trim() : "";
        const cat = iCat >= 0 ? (r[iCat] || "").trim() : "Uncategorized";
        const ext = iExt >= 0 ? (r[iExt] || "").trim() : "";

        return {
          org_id: ORG_ID,
          season_id: SEASON_ID || null,
          hunt_id: null,
          expense_date: d,
          vendor: vendor || null,
          description: desc || null,
          category: cat || "Uncategorized",
          amount_cents: a,
          payment_method: null,
          source: "csv",
          external_id: ext || null,
        };
      }).filter(x => x.expense_date && x.amount_cents);

      if (payload.length === 0) {
        setMsg("No valid rows found. Check date/amount formatting.");
        return;
      }

      // Insert in chunks to avoid limits
      const chunkSize = 500;
      let inserted = 0;

      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);

        // upsert to handle external_id dedupe (works even if external_id is null, will just insert)
        const { error } = await supabase
          .from("expenses")
          .upsert(chunk, { onConflict: "org_id,external_id", ignoreDuplicates: true });

        if (error) throw error;
        inserted += chunk.length;
      }

      setMsg(`✅ Imported ${inserted} expenses from CSV.`);
    } catch (err: any) {
      setMsg(`❌ ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Expenses</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Add single expenses or import a CSV export (MVP).
            </p>
          </div>
          <a
            href="/dashboard"
            className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm"
          >
            ← Back
          </a>
        </div>

        {msg ? (
          <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm">
            {msg}
          </div>
        ) : null}

        {/* CSV Import */}
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="text-sm text-neutral-400">CSV Import</div>
          <p className="mt-2 text-sm text-neutral-300">
            CSV headers required: <span className="font-medium">date, amount</span>.
            Optional: vendor, description, category, external_id.
          </p>

          <input
            type="file"
            accept=".csv,text/csv"
            className="mt-4 block w-full text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCSV(f);
            }}
            disabled={loading}
          />

          <div className="mt-3 text-xs text-neutral-500">
            Tip: Use external_id to prevent duplicates (e.g. bank transaction ID).
          </div>
        </div>

        {/* Manual Expense */}
        <form
          onSubmit={addExpense}
          className="mt-6 space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-6"
        >
          <div className="text-sm text-neutral-400">Add Expense</div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <div className="text-xs text-neutral-400">Date</div>
              <input
                type="date"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label className="space-y-1">
              <div className="text-xs text-neutral-400">Amount ($)</div>
              <input
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
          </div>

          <label className="space-y-1">
            <div className="text-xs text-neutral-400">Vendor</div>
            <input
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <div className="text-xs text-neutral-400">Description</div>
            <input
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <div className="text-xs text-neutral-400">Attach to Hunt (optional)</div>
            <select
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
              value={huntId}
              onChange={(e) => setHuntId(e.target.value)}
            >
              <option value="">Not attached</option>
              {hunts.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <div className="text-xs text-neutral-400">Category</div>
              <input
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </label>

            <label className="space-y-1">
              <div className="text-xs text-neutral-400">Payment Method</div>
              <select
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="card">Card</option>
                <option value="ach">ACH</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
              </select>
            </label>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Expense"}
          </button>
        </form>
      </div>
    </main>
  );
}
