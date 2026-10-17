-- Additive: old recipes remain NULL; existing columns, rows and policies unchanged.
alter table public.shared_recipes add column if not exists base_servings numeric;
alter table public.shared_recipes add constraint shared_recipes_base_servings_valid check (base_servings is null or (base_servings > 0 and base_servings <= 1000));
