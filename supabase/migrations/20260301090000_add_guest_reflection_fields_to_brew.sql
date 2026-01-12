-- Add guest reflection fields to brew table
alter table public.brew
  add column guest_token_hash text,
  add column guest_submitted_at timestamptz,
  add column guest_edit_expires_at timestamptz,
  add column guest_display_name text;

comment on column public.brew.guest_token_hash is 'Hashed guest reflection token for share links';
comment on column public.brew.guest_submitted_at is 'Timestamp when guest first submitted reflection';
comment on column public.brew.guest_edit_expires_at is 'Timestamp when guest edit window expires';
comment on column public.brew.guest_display_name is 'Optional guest name for the reflection';
