# Papertrail

React frontend for an AI Knowledge Assistant that lets users upload a PDF and ask questions about it.

## Run the frontend

```sh
# run dev server
```bash
npm install
# build for production and preview
## API usage

The app runs at `http://localhost:5173`.

## FastAPI contract
  - `@vitejs/plugin-rsc/plugin`
The frontend expects a separate FastAPI backend at `http://localhost:8000`:

- `POST /api/documents/upload` with multipart field `file`
- `POST /api/questions` with JSON `{ "document_id": "...", "question": "..." }`
- You can use [`vite-plugin-inspect`](https://github.com/antfu-collective/vite-plugin-inspect) to understand how `"use client"` and `"use server"` directives are transformed internally.
Set `VITE_API_URL` to change the API base URL. No backend is included in this project.
  - `import.meta.viteRsc.loadModule`
