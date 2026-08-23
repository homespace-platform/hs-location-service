# Vietnam Location Service

Self-hosted Vietnamese administrative location service using local JSON files.

## 1. Generate the latest JSON snapshot

Requires Node.js 18+.

```bash
npm run sync:data
```

The command downloads the maintained source dataset once, validates it, and writes:

- `data/provinces.json`
- `data/wards.json`

The runtime API does not call the upstream source.

The sync script validates:

- 34 province-level units
- 3,321 commune-level units
- no duplicate official codes
- every ward references an existing province
- code `75` is `Thành phố Đồng Nai` (2026 update check)

Commit the generated JSON files to your repository or store them as a versioned deployment artifact.

## 2. Run locally

```bash
npm install
npm run sync:data
npm run dev
```

## API

```text
GET /health
GET /api/v1/provinces
GET /api/v1/provinces/:code
GET /api/v1/provinces/:code/wards
GET /api/v1/wards/:code
```

Examples:

```text
GET /api/v1/provinces
GET /api/v1/provinces/79/wards
GET /api/v1/provinces/75
```

## Docker

First generate the JSON snapshot:

```bash
npm run sync:data
```

Then build:

```bash
docker build -t hs-location-service .
docker run --rm -p 9999:9999 hs-location-service
```

This intentionally avoids fetching external data during container startup.
