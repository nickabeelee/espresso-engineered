-- Fix barista auto-provision trigger to include name metadata and ensure email column

-- Ensure email column exists for trigger insert
alter table public.barista
add column if not exists email text;

-- Recreate trigger function to populate barista row with metadata fallbacks
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  first_name text := nullif(trim(metadata->> 'first_name'), '');
  last_name text := nullif(trim(metadata->> 'last_name'), '');
  display_name text := nullif(trim(metadata->> 'display_name'), '');
begin
  if display_name is null then
    if first_name is not null and last_name is not null then
      display_name := first_name || ' ' || last_name;
    elsif first_name is not null then
      display_name := first_name;
    elsif last_name is not null then
      display_name := last_name;
    else
      display_name := split_part(new.email, '@', 1);
    end if;
  end if;

  insert into public.barista (id, email, first_name, last_name, display_name)
  values (new.id, new.email, first_name, last_name, display_name);

  return new;
end;
$$;;
