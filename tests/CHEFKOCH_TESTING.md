# Chefkoch ingredients — isolated extension

Release 5.2. User authorized release after successful server tests.

The separate `chefkoch-import` Edge Function is deployed. It validates an existing opaque device token against `recipe_devices` and only fetches structured public Recipe data from an allowlisted HTTPS Chefkoch recipe URL. No database writes, redirects, arbitrary hosts, cookies, credentials in URLs, or server keys in the client. Fetch timeout 12 s, body limit 2 MB. A failed lookup leaves existing recipe data unchanged. Live server test passed: supplied recipe gives 10 ingredients and 6 servings; valid device accepted, missing/invalid/revoked devices denied; forbidden URLs rejected.

The test UI adds one button inside the existing recipe editor, visible for Chefkoch URLs only. Ingredients are staged in the editor and are saved using the existing recipe persistence/sync flow. Existing nonempty ingredients require replacement confirmation. Name, notes, instructions, source URL and favorites are preserved. Servings are shown with the import result; quantities retain the source recipe's default servings. Ingredient selection uses the existing shopping-list workflow.

`npm test` includes isolated unit tests and Chromium/WebKit UI tests. The UI tests mock both backend routes and never access private production recipes. The supplied actual recipe HTML was retrieved separately and parsed locally with `CHEFKOCH_HTML=/tmp/chefkoch-nudelsalat.html node tests/chefkoch-unit.mjs`. It is not committed. Expected: 10 ingredients, default 6 servings. No copyrighted full recipe fixture is shipped.

The live workflow test runs only on the feature branch and prints synthetic household IDs for cleanup. It uses actual Edge requests and two logins in Chromium/WebKit via a local proxy. No schema migration or existing function changes. Physical iPhone/Android execution remains unverified.
