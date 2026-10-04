# Deploy Wayfarer v1.0

The supported topology is one persistent Node 24.19 process and one HTTPS reverse proxy. The supplied stack keeps the browser/client and `/socket` on the same HTTPS origin. It stores the realm SQLite database on a Docker volume and automatically acquires HTTPS certificates through Caddy. You need a persistent Linux host, Docker Compose, a hostname you control and a certificate contact email.

## 1. Prepare the host

Extract `wayfarer-v1.0-official-server.zip`, enter `wayfarer-v1.0`, and point your hostname's DNS A record to the host. Set an AAAA record only if IPv6 reaches that host. Allow inbound TCP 80/443; UDP 443 is optional for HTTP/3. Keep the game port private. Outbound HTTPS is needed for image/dependency downloads and certificate issuance.

```sh
cp .env.example .env
```

Edit `.env`:

```dotenv
DOMAIN=play.your-real-domain.com
EMAIL=your-certificate-contact@example.com
REALM_CAPACITY=16
```

`DOMAIN` is a hostname only, without `https://`, a path or a trailing slash. No application password or deployment token belongs in this file. Do not commit it.

## 2. Validate and start

```sh
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 realm gateway
```

The realm must become healthy before the gateway starts. The realm logs a JSON `ready` event. Caddy issues the certificate for `DOMAIN`. Visit `https://YOUR_DOMAIN` and join. Use a second browser profile for another character.

```sh
curl --fail https://YOUR_DOMAIN/health
curl --fail -I https://YOUR_DOMAIN/dist/realm-client.js
```

Expect health JSON containing `ready: true`, version `1.0.0`, capacity and a progressing tick. JavaScript must return a JavaScript MIME type, not an HTML fallback. Check the browser's Network panel: `/socket` upgrades with status 101 and the `wayfarer.realm.v2` subprotocol. Verify two players see each other, save a change, restart the realm and rejoin with the same browser cookie.

The source package was tested locally, but this exact Docker/Caddy stack and live DNS/TLS were not executed in the creation environment. Complete these host checks before announcing a public launch. Browser/device visual checks remain outstanding.

## Persistence and identity

Production data is `/data/realm.sqlite`, in the `realm-data` volume. SQLite uses WAL and `synchronous=FULL`. The database stores the cookie signing secret, validated player exports and Xam's save. A separate `realm.lease.sqlite` holds an exclusive OS lock for the running realm. Never run multiple game replicas against this data directory or use shared network storage. The SQLite lock releases when the process dies; do not delete a live lease database.

Guest cookies are HttpOnly, SameSite=Strict, host-only and Secure in public mode. Their one-year lifetime is a browser cookie lifetime, not an account-recovery service. Copying a guest cookie grants access to that guest; protect backups because they contain the signing secret. Clearing cookies or moving to another browser creates a new character. One guest identity can have one active socket. Reconnect is manual: use Join again.

Player position, appearance, quest, inventory/equipment, XP, bank/skilling and relative cooldowns persist through validated server exports. Active drill steps, health, encounter state, victory counters and shared-world events are session/runtime state. There is no offline XP, multi-device login, administrative account portal or password recovery.

The default save interval is one second. Abrupt termination can lose progress since the latest committed save. SIGTERM saves connected players and Xam before exit. SQLite transactions prevent partial batches; filesystem/hardware integrity still matters.

## Back up

Use the SQLite backup API, not a plain copy of a live database: a live database may also depend on its WAL file.

```sh
docker compose exec -T realm node tools/backup.mjs /data/backups/realm-before-upgrade.sqlite
mkdir -p backups
docker compose cp realm:/data/backups/realm-before-upgrade.sqlite ./backups/realm-before-upgrade.sqlite
```

The command refuses to overwrite an existing backup. Use a new filename each time. Keep a protected copy off the game host and periodically verify it can be opened and restored. No recurring backup schedule is installed by this package. Native runs can use `npm run backup -- backups/NAME.sqlite`.

## Restore

Stop the realm before replacing data. Preserve the current database as another backup first. Restoring an older save deliberately rolls progression back to that backup.

```sh
docker compose stop realm
docker compose run --rm -T --no-deps --entrypoint node realm tools/restore.mjs - < ./backups/realm-before-upgrade.sqlite
docker compose up -d realm
```

`restore.mjs` validates the backup, acquires the realm lease, keeps the previous database as a timestamped backup and replaces the realm database. A backup without the original cookie secret would invalidate previous guest identities. After restoring, verify `/health` and rejoin with an existing browser.

## Upgrade and rollback

1. Take a consistent backup and keep the current source package.
2. Stop the realm, replace source with the new release and run `docker compose up -d --build`.
3. Verify health, two-player joining and saved-character recovery.
4. Roll back by stopping the realm and rebuilding the prior source. Restore its compatible database backup if a later release migrated the schema.

Do not run `docker compose down -v`: it deletes the saved-progress and certificate volumes. Normal `docker compose down` keeps them. Changing the directory/project name changes the default Compose volume names; keep a stable project name or explicitly reuse the existing volumes.

## Configuration

For the supplied stack, `.env` controls DOMAIN, EMAIL and REALM_CAPACITY. Other options are server environment variables and require a Compose edit or another process supervisor.

| Variable | Default | Behavior |
| --- | --- | --- |
| NODE_ENV | development | `production` requires PUBLIC_ORIGIN |
| PUBLIC_ORIGIN | unset | Exact HTTPS origin; public mode binds all interfaces |
| PORT | 8081 | Integer 1–65535 |
| DATA_DIR | runtime | Persistent local directory; Docker uses /data |
| REALM_CAPACITY | 16 | Human players, 1–32; Xam is additional |
| SAVE_INTERVAL_MS | 1000 | Integer 100–60000; longer intervals risk more unsaved progress |
| MAX_PROFILES | 10000 | Guest enrollment cap, 1–10000; existing guests remain usable at the cap |
| XAM_ENABLED | true | Literal `true` or `false` |
| TRUST_PROXY | false | Literal `true` or `false`; only enable behind an exclusive trusted gateway |

The stack enables TRUST_PROXY because only its internal gateway reaches the realm port. The gateway supplies the final forwarded client address. Never expose that realm port directly with TRUST_PROXY enabled. Native public hosting must provide TLS termination and preserve Host/Origin; untrusted forwarded headers are ignored by default.

HTTP requests are bounded to 300/address/minute, guest enrollments to 5/address/minute and socket upgrades to 30/address/minute. Each limiter holds at most 4096 address windows. Socket frames retain the existing 256-byte cap, 60-frame/second limit, handshake timeout, heartbeat and output backpressure. These are application safeguards, not a substitute for a hosting provider's network-level protection.

## Migrate earlier JSON profiles

Stop the old server. Preserve its files. Use an empty v1.0 destination and run:

```sh
DATA_DIR=runtime node tools/migrate-profiles.mjs /path/to/profiles.json /path/to/xam.json
```

The Xam filename is optional. All saves are validated before the transaction; the legacy secret/revisions are preserved so cookies still work on the same origin. Migration refuses a nonempty destination. The guest browser must still carry its original cookie; a cookie cannot be transferred automatically from a localhost development origin to a public hostname.

## Vercel and other platforms

Vercel currently supports WebSockets in beta, but function connections end at the function's duration limit and reconnects may reach another instance. The current Wayfarer simulation uses a single in-memory authority with persistent local SQLite. This package does not implement distributed coordination or externalized simulation state, so it is not configured as a Vercel Function. Deploy the full stack on a persistent container/VM host. A future Vercel front end would also need explicit remote socket routing, identity/CORS design and an independently persistent authority.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| PUBLIC_ORIGIN startup error | Exact `https://hostname` with no trailing slash |
| Gateway has no certificate | DNS reaches host, TCP 80/443 open, email configured; inspect gateway logs |
| HTTP/socket 403 | Host and Origin match PUBLIC_ORIGIN; cookie exists; a reverse proxy preserves Host |
| Socket 409 | Same guest is already joined, or its disconnect save is finishing |
| HTTP 429 | Request/enrollment/upgrade limit; wait a minute |
| New guests receive 503 but existing guests work | MAX_PROFILES reached; inspect enrollment policy before increasing it |
| Health 503 or process restarts | Inspect realm logs and persistent-disk capacity/permissions; do not discard saves |
| Another realm owns data directory | Stop competing processes; do not remove a live lease file |
| Browser loses 3D | Use the existing 2D fallback/retry controls; GPU/device compatibility still needs testing |

Official reference documentation checked during release work:

- [Vercel WebSockets](https://vercel.com/docs/functions/websockets)
- [Node SQLite API](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)
- [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)

Node's built-in SQLite API is experimental in the selected Node 24 runtime. Its warning is expected; the package pins and tests Node 24.19.0 rather than silently using a different runtime.
