-- Fix search path security issue for handle_new_user function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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
