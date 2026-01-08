---
description: Update project with latest changes from GitHub
---

To update your local project with changes made on another computer/production:

1. Open your terminal in the project folder.

2. Download the latest files from GitHub:
   ```powershell
   git pull
   ```

3. If you added new libraries/packages on the other computer, install them here:
   ```powershell
   npm install
   ```

4. If there were database changes (migrations), you might need to run them (check `package.json` scripts, usually `npm run migrate` or similar if configured).
   *Note: Since this project uses Supabase, database changes are likely handled via the Supabase dashboard or CLI, but keep an eye on migration files.*

5. Restart your development server to ensure everything loads correctly:
   ```powershell
   npm run dev
   ```
