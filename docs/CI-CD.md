# CI/CD

The GitHub Actions workflow at `.github/workflows/ci-cd.yml` validates every
pull request to `main` and every push to `main`.

## What the workflow checks

1. The frontend's locked dependencies install with `npm ci` and its Vite
   production build succeeds.
2. The backend's dependencies install with Python 3.12, all backend modules
   compile, and the FastAPI application imports successfully. The CI job uses
   deliberately fake, key-shaped environment values and never starts the app,
   connects to MongoDB, or calls Mistral or Tavily.

## Configure deployment

Render deploy hooks are intentionally stored as GitHub secrets. They are
capability URLs: anyone who has one can trigger a deployment.

1. In Render, open the backend service and choose **Settings** > **Deploy Hook**
   > **Create Deploy Hook**. Give it a name such as `github-actions-backend`,
   then copy the generated URL.
2. Repeat for the frontend static site, naming it `github-actions-frontend`.
3. In GitHub, open the repository and select **Settings** > **Secrets and
   variables** > **Actions** > **New repository secret**.
4. Create these two secrets, pasting the matching hook URL as each value:

   - `RENDER_BACKEND_DEPLOY_HOOK_URL`
   - `RENDER_FRONTEND_DEPLOY_HOOK_URL`

5. Push a commit to `main`. GitHub Actions runs both validation jobs in
   parallel. Only if both succeed does the `Deploy to Render` job POST to both
   hooks.

You can use the **Actions** tab in GitHub to follow the build and deployment
trigger. The hooks acknowledge the trigger; Render's dashboard shows the actual
build and rollout logs.

## Required Render configuration

The Render services still need their regular environment variables. In
particular, set `VITE_API_BASE_URL` on the frontend and set `FRONTEND_ORIGINS`,
`COOKIE_SECURE=true`, and `COOKIE_SAMESITE=none` on the backend. Keep Mistral,
Tavily, MongoDB, and JWT secrets in Render—not GitHub Actions.

If the deploy job says a secret is missing, add the corresponding secret above
and re-run the failed workflow from the Actions tab.
