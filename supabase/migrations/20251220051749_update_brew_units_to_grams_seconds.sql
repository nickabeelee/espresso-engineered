-- Update brew table to use grams and seconds instead of milligrams and milliseconds
-- This migration changes field names and data types for better usability

-- First, add new columns with proper decimal precision
alter table public.brew 
  add column dose_g decimal(5,1),
  add column yield_g decimal(5,1),
  add column brew_time_s decimal(6,2),
  add column flow_rate_g_per_s decimal(6,2),
  add column ratio decimal(4,2);

-- Convert existing data from mg/ms to g/s
update public.brew set
  dose_g = dose_mg / 1000.0,
  yield_g = yield_mg / 1000.0,
  brew_time_s = brew_time_ms / 1000.0,
  flow_rate_g_per_s = "flow_rate_mg/s" / 1000.0,
  ratio = ratio_dec;

-- Make dose_g not null since it was required before
alter table public.brew alter column dose_g set not null;

-- Drop old columns
alter table public.brew 
  drop column dose_mg,
  drop column yield_mg,
  drop column brew_time_ms,
  drop column "flow_rate_mg/s",
  drop column ratio_dec;

-- Update bag table weight from mg to g
alter table public.bag 
  add column weight_g decimal(7,1);

-- Convert existing bag weight data
update public.bag set weight_g = weight_mg / 1000.0;

-- Drop old weight column
alter table public.bag drop column weight_mg;

-- Add comments to document the new precision
comment on column public.brew.dose_g is 'Coffee dose in grams with 0.1g precision';
comment on column public.brew.yield_g is 'Espresso yield in grams with 0.1g precision';
comment on column public.brew.brew_time_s is 'Brew time in seconds with 0.01s precision';
comment on column public.brew.flow_rate_g_per_s is 'Flow rate in grams per second with 0.01 precision';
comment on column public.brew.ratio is 'Brew ratio (yield/dose) with 0.01 precision';
comment on column public.bag.weight_g is 'Bag weight in grams with 0.1g precision';;
