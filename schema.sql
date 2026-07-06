create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  climber_height_m float8 default 1.70,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_filename text,
  total_time_sec float8,
  tut_percentage float8,
  avg_wall_distance_cm float8,
  off_balance_percentage float8,
  dyno_count int4,
  total_distance_m float8,
  frame_data jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  moving_time_sec numeric,
  static_time_sec numeric,
  symmetry_left numeric,
  symmetry_right numeric,
  max_reach_m numeric
);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created 
  after insert on auth.users 
  for each row execute procedure public.handle_new_user();