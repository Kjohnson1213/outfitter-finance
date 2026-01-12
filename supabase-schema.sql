create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  season_id uuid references seasons(id) on delete set null,

  -- optional: tie to hunt for true hunt-level P&L
  hunt_id uuid references hunts(id) on delete set null,

  expense_date date not null,
  vendor text,
  description text,
  category text not null default 'Uncategorized',

  amount_cents integer not null,
  payment_method text, -- card/cash/ach/check
  receipt_url text,    -- later (storage)

  source text not null default 'manual', -- manual/csv/bank
  external_id text, -- for de-dupe on imports

  created_at timestamptz not null default now()
);

create index if not exists expenses_org_date_idx on expenses(org_id, expense_date desc);
create index if not exists expenses_org_category_idx on expenses(org_id, category);
create index if not exists expenses_hunt_idx on expenses(hunt_id);

-- optional: de-dupe protection for CSV imports
create unique index if not exists expenses_org_external_unique
on expenses(org_id, external_id)
where external_id is not null;