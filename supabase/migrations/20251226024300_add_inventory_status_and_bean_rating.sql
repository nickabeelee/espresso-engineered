-- Migration: Add inventory status tracking and bean rating system
-- Purpose: Transform bag tracking from weight-based to status-based and add individual bean ratings
-- Affected tables: bag (add inventory_status), bean_rating (new table)
-- Requirements: 11.1, 11.2, 11.4, 10.5

-- Create inventory_status enum type for bag status tracking
create type inventory_status as enum (
  'unopened',
  'plenty',
  'getting_low',
  'empty'
);

-- Add inventory_status field to bag table with default value
alter table bag add column inventory_status inventory_status default 'unopened';

-- Create bean_rating table for individual barista ratings
create table bean_rating (
  id uuid primary key default gen_random_uuid(),
  bean_id uuid not null references bean(id) on delete cascade,
  barista_id uuid not null references barista(id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(bean_id, barista_id)
);

-- Add comment to bean_rating table
comment on table bean_rating is 'Individual barista ratings for beans on a 5-star scale';
comment on column bean_rating.rating is 'Rating from 1 to 5 stars';
comment on column bean_rating.bean_id is 'Reference to the bean being rated';
comment on column bean_rating.barista_id is 'Reference to the barista who created the rating';

-- Enable Row Level Security on bean_rating table
alter table bean_rating enable row level security;

-- Create RLS policies for bean_rating table
-- Policy: Bean ratings are viewable by everyone (for community averages)
create policy "Bean ratings are viewable by everyone" on bean_rating
  for select
  to anon, authenticated
  using (true);

-- Policy: Authenticated users can create bean ratings
create policy "Authenticated users can create bean ratings" on bean_rating
  for insert
  to authenticated
  with check ((select auth.uid()) = barista_id);

-- Policy: Users can update their own bean ratings
create policy "Users can update their own bean ratings" on bean_rating
  for update
  to authenticated
  using ((select auth.uid()) = barista_id)
  with check ((select auth.uid()) = barista_id);

-- Policy: Users can delete their own bean ratings
create policy "Users can delete their own bean ratings" on bean_rating
  for delete
  to authenticated
  using ((select auth.uid()) = barista_id);

-- Add index on bean_rating for performance
create index idx_bean_rating_bean_id on bean_rating(bean_id);
create index idx_bean_rating_barista_id on bean_rating(barista_id);;
