# APIs, CLIs and workers

How to run steps 5 and 8 of the e2e-test skill on code with no page: an HTTP API, a CLI, a job or queue worker. A web app's backend uses the "Trace" and "Data" parts of this file too.

## Set up

```bash
SCRATCH="$(mktemp -d)"     # ledger: $SCRATCH; every dump and log copy goes here
```

Find the base URL, the auth the API wants (a test token in `.env.example`, a test login route, a seed user) and the log location. Never paste a real token into a command line the user can see in history or a file you keep: read it from the environment (`-H "Authorization: Bearer $API_TOKEN"`).

## Call it

```bash
curl -sS -o "$SCRATCH/r1.json" -w '%{http_code} %{time_total}s\n' \
  -H 'Content-Type: application/json' -d '{"name":"e2e test"}' \
  http://localhost:8080/api/pipelines
jq . "$SCRATCH/r1.json"
```

- `-w '%{http_code}'` prints the status; `-i` shows headers; `-c "$SCRATCH/jar" -b "$SCRATCH/jar"` keeps cookies across calls.
- For each `new` endpoint test: a good request, a missing field, a wrong type, a too-long value, no auth, someone else's id (must be 403 or 404, never their data), and the same request twice (idempotent or a clear 409).
- Check the body, not just the status: the shape the client expects, no stack traces or secrets in error bodies, the right content type.
- A CLI: run each command with good input, bad input and `--help`; check the exit code (`echo $?`), stdout and stderr separately.

## Trace

For each call, follow it down while the backend runs locally:

1. **Response:** status, body, headers.
2. **Server log:** the line for this request and anything after it. Tail the file the project writes (`tail -n 50 logs/app.log`), or read the output of the server you started (if you started it, start it with its output going to `$SCRATCH/server.log`). Look for stack traces, warnings, slow queries.
3. **Data, read-only:** the row or message the call should have made.

```bash
psql "$DATABASE_URL" -c "select id, name, updated_at from pipelines order by updated_at desc limit 5"
sqlite3 -readonly app.db "select * from pipelines order by rowid desc limit 5"
redis-cli LLEN queue:exports            # read commands only: LLEN, LRANGE, GET, XRANGE
docker compose logs --tail 50 worker
```

Only `select` and read commands. A write to check something (an insert, a `DEL`, a queue purge) is a data change: the hard rules in SKILL.md apply.

## Error states

Make the API's own dependencies fail where the project lets you do it safely: a bad config value in a scratch `.env`, a stopped local dependency the project starts with `docker compose`, a fake upstream the project ships. When the API sits behind a web app, a Playwright mock is easier and touches nothing: see "Error states with mocks" in `web.md`. In a Playwright spec, `request.get` / `request.post` (the `request` fixture, an `APIRequestContext`) call the API with the browser's cookies.

## Workers and queues

Start the job the way a user would trigger it (the API call or the CLI command), then watch: the queue length goes up and back down, the worker log shows it start and finish, the result (file, row, email in a local mail catcher) appears. Time it. A job that never finishes is a `fail` with the last log line as evidence.

## Clean up and prove it

Stop each server and worker you started (`kill <pid>`, `docker compose stop <svc>` for ones you started; leave the rest). Delete `$SCRATCH` after moving the report out. Then check: `lsof -iTCP -sTCP:LISTEN -P | grep <port>` shows only what was running before you came, and `git status --short` shows only the files the session meant to change.
