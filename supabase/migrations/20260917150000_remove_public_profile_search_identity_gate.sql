begin;

-- Public-profile visibility is determined by public.public_profiles. The
-- private identity table continues to enforce company-name uniqueness on
-- writes, but missing or display-divergent identity rows must not hide an
-- otherwise valid public profile from search.
create or replace function public.search_public_profiles(
  search_query text,
  result_limit integer default 10
)
returns table (
  user_id uuid,
  company_name text,
  avatar_id text,
  avatar_frame_id text,
  career_rank text,
  career_xp integer,
  reputation integer,
  success_rate numeric,
  completed_sessions integer,
  selected_badge_ids jsonb,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  folded_query text := private.company_name_casefold(private.company_name_display(coalesce(search_query, '')));
  escaped_query text;
  safe_limit integer := least(10, greatest(1, coalesce(result_limit, 10)));
begin
  if caller_id is null or char_length(folded_query) < 2 then
    return;
  end if;

  escaped_query := replace(replace(replace(folded_query, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_');

  return query
  select
    profile.user_id,
    profile.company_name,
    profile.avatar_id,
    profile.avatar_frame_id,
    profile.career_rank,
    profile.career_xp,
    profile.reputation,
    profile.success_rate,
    profile.completed_sessions,
    profile.selected_badge_ids,
    profile.updated_at
  from public.public_profiles as profile
  where profile.user_id <> caller_id
    and private.company_name_casefold(profile.company_name) like escaped_query || '%' escape E'\\'
  order by
    case when private.company_name_casefold(profile.company_name) = folded_query then 0 else 1 end,
    char_length(profile.company_name),
    private.company_name_casefold(profile.company_name),
    profile.user_id
  limit safe_limit;
end;
$$;

revoke all on function public.search_public_profiles(text, integer) from public, anon;
grant execute on function public.search_public_profiles(text, integer) to authenticated;

commit;
