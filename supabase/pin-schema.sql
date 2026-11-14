
create table foxy_private.pin_access (
 singleton boolean primary key default true check(singleton),
 user_id uuid not null references auth.users(id) on delete cascade,
 email text not null,
 pin_hash text not null,
 failures integer not null default 0,
 window_started timestamptz not null default now(),
 blocked_until timestamptz
);
alter table foxy_private.pin_access enable row level security;
revoke all on foxy_private.pin_access from public,anon,authenticated;
grant usage on schema foxy_private to service_role;
grant select,update on foxy_private.pin_access to service_role;
create function public.alisa_pin_attempt(p_pin text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare cfg foxy_private.pin_access%rowtype; target_email text; remaining integer;
begin
 if current_user <> 'service_role' then raise exception 'Not permitted';end if;
 select * into cfg from foxy_private.pin_access where singleton=true for update;
 if not found then return jsonb_build_object('ok',false);end if;
 if cfg.blocked_until>now() then
  return jsonb_build_object('ok',false,'limited',true,'retry_after',ceil(extract(epoch from cfg.blocked_until-now())));
 end if;
 if cfg.window_started<now()-interval '15 minutes' then
  cfg.failures:=0;
  update foxy_private.pin_access set failures=0,window_started=now(),blocked_until=null where singleton=true;
 end if;
 if p_pin ~ '^[0-9]{5}$' and extensions.crypt(p_pin,cfg.pin_hash)=cfg.pin_hash then
  target_email:=cfg.email;
  if target_email is null then return jsonb_build_object('ok',false);end if;
  update foxy_private.pin_access set failures=0,blocked_until=null where singleton=true;
  return jsonb_build_object('ok',true,'email',target_email);
 end if;
 update foxy_private.pin_access set failures=cfg.failures+1,
 blocked_until=case when cfg.failures+1>=5 then now()+interval '15 minutes' else null end
 where singleton=true;
 return jsonb_build_object('ok',false,'limited',cfg.failures+1>=5,'retry_after',case when cfg.failures+1>=5 then 900 else 0 end);
end;
$$;
revoke all on function public.alisa_pin_attempt(text) from public,anon,authenticated;
grant execute on function public.alisa_pin_attempt(text) to service_role;

create policy no_direct_pin_access on foxy_private.pin_access for all to authenticated using(false) with check(false);
