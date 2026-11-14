
create schema if not exists foxy_private;
revoke all on schema foxy_private from public, anon, authenticated;
create table public.foxy_diaries (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload)='object'),
 revision bigint not null default 1 check (revision>0),
 updated_at timestamptz not null default now()
);
alter table public.foxy_diaries enable row level security;
revoke all on public.foxy_diaries from anon;
grant select,insert,update on public.foxy_diaries to authenticated;
create policy own_diary_read on public.foxy_diaries for select to authenticated using ((select auth.uid())=user_id);
create policy own_diary_insert on public.foxy_diaries for insert to authenticated with check ((select auth.uid())=user_id);
create policy own_diary_update on public.foxy_diaries for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create table foxy_private.history_imports (
 email text primary key,
 payload jsonb not null check (jsonb_typeof(payload)='object'),
 created_at timestamptz not null default now()
);
alter table foxy_private.history_imports enable row level security;
revoke all on foxy_private.history_imports from public,anon,authenticated;
create function public.foxy_claim_history()
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; confirmed_email text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select lower(email) into confirmed_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if confirmed_email is null then raise exception 'Confirm your email first'; end if;
 select payload into result from foxy_private.history_imports where email=confirmed_email;
 return result;
end;
$$;
revoke all on function public.foxy_claim_history() from public,anon;
grant execute on function public.foxy_claim_history() to authenticated;
create function public.foxy_save_diary(p_payload jsonb,p_revision bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if jsonb_typeof(p_payload->'programs') is distinct from 'array'
 or jsonb_typeof(p_payload->'sessions') is distinct from 'array'
 or jsonb_typeof(p_payload->'measurements') is distinct from 'array'
 or jsonb_typeof(p_payload->'schedule') is distinct from 'object' then
 raise exception 'Invalid diary format'; end if;
 if p_revision=0 then
  insert into public.foxy_diaries(user_id,payload) values(auth.uid(),p_payload)
  on conflict(user_id) do nothing returning to_jsonb(foxy_diaries) into result;
 else
  update public.foxy_diaries set payload=p_payload,revision=revision+1,updated_at=now()
  where user_id=auth.uid() and revision=p_revision
  returning to_jsonb(foxy_diaries) into result;
 end if;
 if result is null then raise exception 'FOXY_REVISION_CONFLICT'; end if;
 return result;
end;
$$;
revoke all on function public.foxy_save_diary(jsonb,bigint) from public,anon;
grant execute on function public.foxy_save_diary(jsonb,bigint) to authenticated;

alter function public.foxy_claim_history() set schema foxy_private;
alter function foxy_private.foxy_claim_history() rename to claim_history;
grant usage on schema foxy_private to authenticated;
create policy no_direct_history_access on foxy_private.history_imports for all to authenticated using (false) with check (false);
create function public.foxy_claim_history() returns jsonb language sql security invoker set search_path='' as $$
 select foxy_private.claim_history();
$$;
revoke all on function public.foxy_claim_history() from public,anon;
grant execute on function public.foxy_claim_history() to authenticated;
