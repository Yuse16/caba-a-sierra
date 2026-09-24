alter table public.cabins
  drop constraint if exists cabins_check;

alter table public.cabins
  add constraint cabins_check
  check (
    max_guests >= 0
    and (
      publication_state <> 'published'::public.publication_state
      or max_guests >= min_guests
    )
  );
