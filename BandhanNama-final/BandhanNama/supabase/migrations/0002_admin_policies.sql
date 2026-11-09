-- Stage 5: authenticated admin/editor access. Apply after 0001_initial_schema.sql.
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.current_user_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles p
    where p.user_id = auth.uid() and p.role in ('admin', 'editor')
  );
$$;

revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_is_staff() from public;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_is_staff() to authenticated;

-- Staff can read records. Only admins can create/delete or change PIN hashes.
 grant select on public.sisters to authenticated;
 grant insert, update, delete on public.sisters to authenticated;
 grant select, insert, update, delete on public.public_name_suggestions to authenticated;
 grant select, insert, update on public.site_settings to authenticated;
 grant select on public.audit_logs to authenticated;
 grant select on public.admin_profiles to authenticated;

create policy "staff read sisters" on public.sisters for select to authenticated
using (public.current_user_is_staff());
create policy "admins insert sisters" on public.sisters for insert to authenticated
with check (public.current_user_is_admin());
create policy "admins update sisters" on public.sisters for update to authenticated
using (public.current_user_is_admin()) with check (public.current_user_is_admin());
create policy "admins delete sisters" on public.sisters for delete to authenticated
using (public.current_user_is_admin());

create policy "staff read public names" on public.public_name_suggestions for select to authenticated
using (public.current_user_is_staff());
create policy "admins insert public names" on public.public_name_suggestions for insert to authenticated
with check (public.current_user_is_admin());
create policy "admins update public names" on public.public_name_suggestions for update to authenticated
using (public.current_user_is_admin()) with check (public.current_user_is_admin());
create policy "admins delete public names" on public.public_name_suggestions for delete to authenticated
using (public.current_user_is_admin());

create policy "staff read site settings" on public.site_settings for select to authenticated
using (public.current_user_is_staff());
create policy "admins insert site settings" on public.site_settings for insert to authenticated
with check (public.current_user_is_admin());
create policy "admins update site settings" on public.site_settings for update to authenticated
using (public.current_user_is_admin()) with check (public.current_user_is_admin());

create policy "staff read audit logs" on public.audit_logs for select to authenticated
using (public.current_user_is_staff());
create policy "users read own admin profile" on public.admin_profiles for select to authenticated
using (user_id = auth.uid());

-- Bootstrap manually after creating the first Auth user:
-- insert into public.admin_profiles (user_id, role)
-- select id, 'admin' from auth.users where email = 'YOUR_ADMIN_EMAIL';
grant insert on public.audit_logs to authenticated;
create policy "staff write own audit entries" on public.audit_logs for insert to authenticated
with check (public.current_user_is_staff() and actor_id = auth.uid());
