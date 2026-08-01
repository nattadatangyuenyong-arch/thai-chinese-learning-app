-- Run this entire file in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.decks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocabulary_items (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  chinese text not null,
  pinyin text not null default '',
  thai_translation text not null default '',
  example_sentence text,
  example_sentence_pinyin text,
  example_sentence_thai text,
  learning_status text not null default 'new' check (learning_status in ('new','learning','known')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists decks_user_id_idx on public.decks(user_id);
create index if not exists vocabulary_items_user_id_idx on public.vocabulary_items(user_id);
create index if not exists vocabulary_items_deck_id_idx on public.vocabulary_items(deck_id);

alter table public.decks enable row level security;
alter table public.vocabulary_items enable row level security;

drop policy if exists "Users can read own decks" on public.decks;
drop policy if exists "Users can insert own decks" on public.decks;
drop policy if exists "Users can update own decks" on public.decks;
drop policy if exists "Users can delete own decks" on public.decks;

create policy "Users can read own decks" on public.decks for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own decks" on public.decks for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own decks" on public.decks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own decks" on public.decks for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own vocabulary" on public.vocabulary_items;
drop policy if exists "Users can insert own vocabulary" on public.vocabulary_items;
drop policy if exists "Users can update own vocabulary" on public.vocabulary_items;
drop policy if exists "Users can delete own vocabulary" on public.vocabulary_items;

create policy "Users can read own vocabulary" on public.vocabulary_items for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own vocabulary" on public.vocabulary_items for insert to authenticated with check (
  auth.uid() = user_id and exists (select 1 from public.decks d where d.id = deck_id and d.user_id = auth.uid())
);
create policy "Users can update own vocabulary" on public.vocabulary_items for update to authenticated using (auth.uid() = user_id) with check (
  auth.uid() = user_id and exists (select 1 from public.decks d where d.id = deck_id and d.user_id = auth.uid())
);
create policy "Users can delete own vocabulary" on public.vocabulary_items for delete to authenticated using (auth.uid() = user_id);
