create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  slug text not null unique,
  description text,
  industry text,
  location text,
  average_rating numeric(2, 1) not null default 0.0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_average_rating_range check (average_rating >= 0.0 and average_rating <= 5.0),
  constraint companies_review_count_nonnegative check (review_count >= 0),
  constraint companies_slug_not_empty check (length(trim(slug)) > 0),
  constraint companies_name_not_empty check (length(trim(name)) > 0)
);

create table if not exists public.company_ratings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nickname text,
  benefits integer not null,
  environment integer not null,
  leadership integer not null,
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_ratings_benefits_range check (benefits between 1 and 5),
  constraint company_ratings_environment_range check (environment between 1 and 5),
  constraint company_ratings_leadership_range check (leadership between 1 and 5),
  constraint company_ratings_comment_min_length check (length(trim(comment)) >= 20),
  constraint company_ratings_nickname_max_length check (nickname is null or length(trim(nickname)) <= 50),
  constraint company_ratings_author_required check (
    user_id is not null or length(trim(coalesce(nickname, ''))) > 0
  )
);

create unique index if not exists company_ratings_one_user_rating_per_company
  on public.company_ratings(company_id, user_id)
  where user_id is not null;

create unique index if not exists company_ratings_one_anonymous_rating_per_company
  on public.company_ratings(company_id)
  where user_id is null;

create index if not exists company_ratings_company_id_created_at_idx
  on public.company_ratings(company_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row
  execute function public.set_updated_at();

drop trigger if exists company_ratings_set_updated_at on public.company_ratings;
create trigger company_ratings_set_updated_at
  before update on public.company_ratings
  for each row
  execute function public.set_updated_at();

create or replace function public.refresh_company_rating_stats(target_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.companies
  set
    average_rating = coalesce((
      select round(avg((benefits + environment + leadership)::numeric / 3), 1)
      from public.company_ratings
      where company_id = target_company_id
    ), 0.0),
    review_count = (
      select count(*)::integer
      from public.company_ratings
      where company_id = target_company_id
    )
  where id = target_company_id;
end;
$$;

create or replace function public.refresh_company_rating_stats_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_company_rating_stats(old.company_id);
    return old;
  end if;

  perform public.refresh_company_rating_stats(new.company_id);

  if tg_op = 'UPDATE' and old.company_id <> new.company_id then
    perform public.refresh_company_rating_stats(old.company_id);
  end if;

  return new;
end;
$$;

drop trigger if exists company_ratings_refresh_company_stats on public.company_ratings;
create trigger company_ratings_refresh_company_stats
  after insert or update or delete on public.company_ratings
  for each row
  execute function public.refresh_company_rating_stats_trigger();

alter table public.companies enable row level security;
alter table public.company_ratings enable row level security;

drop policy if exists "Companies are readable by everyone" on public.companies;
create policy "Companies are readable by everyone"
  on public.companies
  for select
  using (true);

drop policy if exists "Company ratings are readable by everyone" on public.company_ratings;
create policy "Company ratings are readable by everyone"
  on public.company_ratings
  for select
  using (true);

drop policy if exists "Authenticated users can create their own ratings" on public.company_ratings;
create policy "Authenticated users can create their own ratings"
  on public.company_ratings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can update their own ratings" on public.company_ratings;
create policy "Authenticated users can update their own ratings"
  on public.company_ratings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Anonymous users can create anonymous ratings" on public.company_ratings;
create policy "Anonymous users can create anonymous ratings"
  on public.company_ratings
  for insert
  to anon
  with check (
    user_id is null
    and length(trim(coalesce(nickname, ''))) > 0
  );

drop policy if exists "Anonymous users can update anonymous ratings" on public.company_ratings;
create policy "Anonymous users can update anonymous ratings"
  on public.company_ratings
  for update
  to anon
  using (user_id is null)
  with check (
    user_id is null
    and length(trim(coalesce(nickname, ''))) > 0
  );

insert into public.companies (
  name,
  logo,
  slug,
  description,
  industry,
  location,
  created_at,
  updated_at
) values
  (
    'Techcombank',
    'https://via.placeholder.com/80x80?text=TCB',
    'techcombank',
    'Ngân hàng TMCP Kỹ Thương Việt Nam - một trong những ngân hàng hàng đầu tại Việt Nam',
    'Ngân hàng / Tài chính',
    'Hà Nội',
    '2023-01-15T00:00:00Z',
    '2024-06-01T00:00:00Z'
  ),
  (
    'VNPT',
    'https://via.placeholder.com/80x80?text=VNPT',
    'vnpt',
    'Tập đoàn Bưu chính Viễn thông Việt Nam - nhà cung cấp dịch vụ viễn thông hàng đầu',
    'Viễn thông',
    'Hà Nội',
    '2023-02-20T00:00:00Z',
    '2024-05-15T00:00:00Z'
  ),
  (
    'VinGroup',
    'https://via.placeholder.com/80x80?text=VNG',
    'vingroup',
    'Tập đoàn tư nhân lớn nhất Việt Nam với nhiều lĩnh vực: bất động sản, ô tô, bán lẻ',
    'Đa ngành',
    'Vinhomes Riverside, Hà Nội',
    '2023-01-10T00:00:00Z',
    '2024-06-10T00:00:00Z'
  ),
  (
    'FPT Software',
    'https://via.placeholder.com/80x80?text=FPT',
    'fpt-software',
    'Công ty phần mềm hàng đầu Việt Nam với dịch vụ outsourcing và sản phẩm công nghệ',
    'Công nghệ thông tin',
    'Quận 7, TP.HCM',
    '2023-03-05T00:00:00Z',
    '2024-06-12T00:00:00Z'
  ),
  (
    'MoMo',
    'https://via.placeholder.com/80x80?text=MoMo',
    'momo',
    'Ví điện tử và nền tảng fintech phổ biến nhất Việt Nam',
    'Fintech',
    'TP.HCM',
    '2023-02-01T00:00:00Z',
    '2024-06-08T00:00:00Z'
  )
on conflict (slug) do update set
  name = excluded.name,
  logo = excluded.logo,
  description = excluded.description,
  industry = excluded.industry,
  location = excluded.location,
  updated_at = excluded.updated_at;

insert into public.company_ratings (
  company_id,
  nickname,
  benefits,
  environment,
  leadership,
  comment,
  created_at,
  updated_at
) values
  (
    (select id from public.companies where slug = 'techcombank'),
    'AnonUser123',
    4,
    4,
    5,
    'Công ty có văn hóa tốt, lãnh đạo thân thiện và lắng nghe nhân viên. Tuy nhiên áp lực công việc đôi khi cao.',
    '2024-06-01T00:00:00Z',
    '2024-06-01T00:00:00Z'
  )
on conflict do nothing;

do $$
declare
  company_record record;
begin
  for company_record in select id from public.companies loop
    perform public.refresh_company_rating_stats(company_record.id);
  end loop;
end;
$$;
