Dependency check result: All packages used in server source files are listed in `package.json` and installed.

Quick setup (server):

- From the `server` folder run:
  - `npm install` (installs dependencies listed in `server/package.json`)
  - or, to explicitly install the packages you mentioned:
    - `npm install express cors mongoose dotenv`
    - `npm i -D nodemon`

Repository-level helper:

- This repo provides a root-level script to install both server and client dependencies automatically. From the project root run:

  - `npm run install:all`

- Additionally, `postinstall` is configured at the root so running `npm install` at the repo root will trigger installation for both `server` and `client`.

Start dev servers:

- Server: `npm run dev --prefix server`
- Client: `npm run dev --prefix client`

Note: For cookie-based auth to work on localhost, set `secure` to `process.env.NODE_ENV === 'production'` when calling `res.cookie` and send cookies from the client with `credentials: 'include'` or the Axios option `withCredentials: true`.
