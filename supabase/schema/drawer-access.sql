create table if not exists public.recipe_drawer_logins (
 login_name text primary key,
 household_id uuid not null references public.recipe_households(id) on delete cascade,
 password_hash text not null,
 salt text not null,
 attempts integer not null default 0,
 window_start timestamptz not null default now()
);
alter table public.recipe_drawer_logins enable row level security;
revoke all on public.recipe_drawer_logins from anon,authenticated;
grant all on public.recipe_drawer_logins to service_role;
create or replace function public.recipe_claim_login(p_name text)
returns table(household_id uuid,password_hash text,salt text)
language sql security invoker set search_path=public as $$
 update public.recipe_drawer_logins d set
 attempts=case when d.window_start < now()-interval '15 minutes' then 1 else d.attempts+1 end,
 window_start=case when d.window_start < now()-interval '15 minutes' then now() else d.window_start end
 where d.login_name=p_name and (d.attempts<8 or d.window_start < now()-interval '15 minutes')
 returning d.household_id,d.password_hash,d.salt;
$$;
revoke all on function public.recipe_claim_login(text) from public,anon,authenticated;
grant execute on function public.recipe_claim_login(text) to service_role;
create or replace function public.recipe_merge_drawers(p_source uuid,p_target uuid)
returns void language plpgsql security invoker set search_path=public as $$
begin
 if p_source=p_target then return; end if;
 perform id from public.recipe_households where id in(p_source,p_target) order by id for update;
 update public.shared_recipes set household_id=p_target where household_id=p_source;
 update public.recipe_shopping set household_id=p_target where household_id=p_source;
 update public.recipe_devices set household_id=p_target where household_id=p_source;
 update public.recipe_drawer_logins set household_id=p_target where household_id=p_source;
 update public.recipe_family_codes set active=false where household_id=p_source;
end;
$$;
revoke all on function public.recipe_merge_drawers(uuid,uuid) from public,anon,authenticated;
grant execute on function public.recipe_merge_drawers(uuid,uuid) to service_role;
