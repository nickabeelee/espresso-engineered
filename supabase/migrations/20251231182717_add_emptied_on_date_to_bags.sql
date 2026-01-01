-- Migration: Add emptied_on_date field to bags table
-- Purpose: Track when bags are marked as empty for inventory management
-- Affected tables: bag
-- Requirements: 7.1, 7.2, 7.4 from home-page-dashboard spec

-- Add emptied_on_date column to track when a bag was marked as empty
alter table public.bag 
add column emptied_on_date timestamptz;

-- Add comment explaining the purpose of the new column
comment on column public.bag.emptied_on_date is 'Timestamp when the bag was marked as empty. Used for inventory filtering and lifecycle tracking.';

-- Create index for efficient querying by emptied_on_date
create index idx_bag_emptied_on_date on public.bag(emptied_on_date);

-- Add partial index for non-empty bags (most common query pattern)
create index idx_bag_not_emptied on public.bag(inventory_status) where emptied_on_date is null;;
