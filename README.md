# Purchase Bill App

A two-page web application built for the Enhanzer *Full Stack Developer – Angular & .NET Core* assignment.

- **Login** – signs in against the Enhanzer staging API and saves the user's locations to SQL Server.
- **Purchase Bill** – available only after login. Add items with live cost, margin and selling-price calculations, review them in a table with a running summary, and save the bill to the backend.

## Architecture

```
Angular SPA ──► ASP.NET Core 8 Web API ──► Enhanzer staging API (Invoke)
                        │
                        └──► SQL Server (Location_Details, Purchase_Bills, Purchase_Bill_Items)
```

The browser only talks to this project's API. The API calls Enhanzer, which avoids CORS problems, keeps the integration in one place, and lets the API store the locations it gets back.

| Layer | Tech |
|---|---|
| Frontend | Angular 22 (standalone components, signals), Angular Material, TypeScript, SCSS, Vitest |
| Backend | ASP.NET Core 8 Web API, Entity Framework Core 8, JWT bearer auth, xUnit |
| Database | SQL Server 2022 (Docker for local development) |
| Tooling | pnpm, Husky + commitlint (Conventional Commits) |

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (a newer SDK also works; the projects target `net8.0`)
- [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/) 10+ (`npm i -g pnpm`)
- [Docker](https://www.docker.com/products/docker-desktop/) for the local SQL Server
- The EF Core CLI, only if you change the schema: `dotnet tool install -g dotnet-ef --version "8.*"`

## Getting started

Run these from the repository root unless a step says otherwise.

### 1. Install the root tooling

```bash
pnpm install     # installs Husky + commitlint (enforces Conventional Commit messages)
```

### 2. Start SQL Server

```bash
cp .env.example .env          # then edit .env and set your own MSSQL_SA_PASSWORD
docker compose up -d
```

SQL Server listens on `localhost:1433`. `.env` is git-ignored.

### 3. Configure and run the API

The signing key and connection string are secrets, so they are kept out of the repository. Store them with .NET user-secrets (use the same password you put in `.env`):

```bash
cd backend/src/PurchaseBill.Api
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 48)"
dotnet user-secrets set "ConnectionStrings:Default" "Server=localhost,1433;Database=PurchaseBill;User Id=sa;Password=<your MSSQL_SA_PASSWORD>;TrustServerCertificate=True;Encrypt=True"
dotnet run --launch-profile http
```

The API starts on `http://localhost:5011` with Swagger at `http://localhost:5011/swagger`. In the Development environment it creates the `PurchaseBill` database and applies the migrations on startup.

(`Jwt:Key` must be at least 32 characters. Without `openssl`, any random string of that length works. Environment variables `Jwt__Key` and `ConnectionStrings__Default` work too.)

### 4. Run the frontend

```bash
cd frontend
pnpm install
pnpm start
```

Open `http://localhost:4200`. The dev API address is set in `frontend/src/environments/environment.development.ts`.

### 5. Sign in

Use the test credentials given in the assignment brief. The first sign-in after the Enhanzer staging server has been idle can take a minute or two (it cold-starts); the button shows a spinner and the API retries automatically.

## Database script

`database/purchase_bill_schema.sql` creates every table and is safe to run more than once. To use it instead of the automatic migration:

1. Create an empty database, for example `CREATE DATABASE PurchaseBill;`
2. Run the script against it (SSMS, Azure Data Studio, or `sqlcmd -d PurchaseBill -i database/purchase_bill_schema.sql`).

| Table | Purpose |
|---|---|
| `Location_Details` | Locations saved at login. `Location_Code` is unique (names repeat, e.g. "Van 1" appears twice). |
| `Purchase_Bills` | One row per saved bill: owner and timestamp. |
| `Purchase_Bill_Items` | The bill's rows. `BatchCode` is a foreign key to `Location_Details.Location_Code`. |

After changing the model, add a migration and regenerate the script (from `backend/src/PurchaseBill.Api`):

```bash
dotnet ef migrations add <Name> -o Data/Migrations
dotnet ef migrations script --idempotent -o ../../../database/purchase_bill_schema.sql
```

## API

| Method and path | Auth | Description |
|---|---|---|
| `POST /api/auth/login` | – | Body `{ email, password }`. Calls Enhanzer, saves the user's locations, returns `{ token, expiresAtUtc, displayName, locations }`. |
| `GET /api/locations` | Bearer | Saved locations (feeds the Batch dropdown). |
| `POST /api/purchase-bills` | Bearer | Saves a bill: `{ items: [{ item, batchCode, standardCost, standardPrice, qty, freeQty, discountPercent }] }`. Returns `201` with server-calculated totals. |
| `GET /api/purchase-bills/{id}` | Bearer | A bill. Only its creator can read it; anyone else gets `404`. |

Error responses are `application/problem+json`: `400` invalid input, `401` bad credentials or missing/invalid token, `502` Enhanzer unavailable.

## Calculations

| Field | Formula | Example |
|---|---|---|
| Margin | Standard Price − Standard Cost | 150 − 100 = 50 |
| Total Cost | Standard Cost × Qty, less the discount % | 100 × 5, 20% → 400 |
| Total Selling | Standard Price × Qty | 150 × 5 = 750 |
| Total Items | Number of rows in the table | |
| Total Quantity | Sum of Qty over all rows | |

The form shows these live as you type. The API recalculates them itself when saving and ignores any totals from the client.

## Tests

```bash
# Backend: unit tests plus HTTP-level integration tests (in-memory database, Enhanzer faked)
dotnet test backend/tests/PurchaseBill.Api.Tests

# Frontend (from frontend/)
pnpm ng test --watch=false
pnpm build
```

The backend tests cover the calculator, the Enhanzer client (success, both failure shapes, retries, timeouts), location saving, bill creation and validation, per-user bill access, and the authorization rules over HTTP. The frontend tests cover the calculations, the auth service, the route guards, the login form, the item form, and the page's summary and save flow.

## Project structure

```
backend/
  src/PurchaseBill.Api/   Controllers, Services, Models (DTOs), Data (EF Core + migrations), Middleware
  tests/PurchaseBill.Api.Tests/
frontend/src/app/
  core/                   auth service, guards, interceptors, API services, models
  features/login/
  features/purchase-bill/ page + item-form, item-table, summary-panel components
database/                 deliverable SQL script
docker-compose.yml        local SQL Server
```

## Design notes

- **Security.** Passwords are never stored: only a short-lived JWT (60 minutes), the expiry and the display name are kept, in `sessionStorage`, so closing the tab signs the user out. The Purchase Bill route is protected by a guard in the browser and by `[Authorize]` on the API. Any `401` from the API clears the session and returns to the login page.
- **Enhanzer API behaviour.** It does not use HTTP status to report failures: a wrong password is HTTP 200 with `Doc_Msg: "Invalid Login Details"`, and an unknown email is HTTP 200 with `Status_Code: 401`. It also intermittently answers with HTTP 500 or an empty envelope, especially after being idle, and it mishandles chunked request bodies. The API client checks the body, sends a fixed-length request, and retries with a 60-second timeout.
- **Validation in both places.** The form validates for fast feedback; the API validates again (data annotations, the item list, and that the batch is a saved location), because the browser can't be trusted.
- **Batch list.** The dropdown shows every location saved so far, as the brief specifies ("from the previously saved Location_Details table"), not only the signed-in user's locations.

## Contributing

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (for example `feat(api): ...`); a Husky hook rejects anything else.
