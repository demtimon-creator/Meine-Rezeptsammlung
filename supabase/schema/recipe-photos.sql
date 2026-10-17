-- Optional external source picture. No Storage bucket or existing recipe rewrites.
alter table public.shared_recipes add column if not exists image_url text;
alter table public.shared_recipes add constraint shared_recipes_image_url_valid check (image_url is null or (length(image_url)<=2000 and image_url ~ '^https://img[.]chefkoch-cdn[.]de/rezepte/'));
