# Chefkoch ingredients — isolated extension

This branch is not deployed or merged. Production remains version 5.1.

The separate `chefkoch-import` Edge Function is NOT deployed. It validates an existing opaque device token against `recipe_devices` and only fetches structured public Recipe data from an allowlisted HTTPS Chefkoch recipe URL. No database writes, redirects, arbitrary hosts, cookies, credentials in URLs, or server keys in the client. Fetch timeout 12 s, body limit 2 MB. A failed lookup leaves existing recipe data unchanged. Supabase Edge deployment and real authenticated Edge execution are still unverified.

The test UI adds one button inside the existing recipe editor, visible for Chefkoch URLs only. Ingredients are staged in the editor and are saved using the existing recipe persistence/sync flow. Existing nonempty ingredients require replacement confirmation. Name, notes, instructions, source URL and favorites are preserved. Servings are shown with the import result; quantities retain the source recipe's default servings. Ingredient selection uses the existing shopping-list workflow.

`npm test` includes isolated unit tests and Chromium/WebKit UI tests. The UI tests mock both backend routes and never access private production recipes. The supplied actual recipe HTML was retrieved separately and parsed locally with `CHEFKOCH_HTML=/tmp/chefkoch-nudelsalat.html node tests/chefkoch-unit.mjs`. It is not committed. Expected: 10 ingredients, default 6 servings. No copyrighted full recipe fixture is shipped.

Before any release: obtain user approval to change production, deploy the separate function (custom device authentication, platform JWT verification disabled), verify valid/revoked device tokens and upstream fetch in the real Edge environment using isolated data, then release the tested frontend. No automatic deployment or database migration is included here.
