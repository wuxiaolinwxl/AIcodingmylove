#!/usr/bin/env bash
# Memory-space API smoke test.
# Usage: BASE=http://127.0.0.1:3000 bash tests/api-smoke.sh
#
# Exits 0 if every assertion passes, non-zero otherwise.
# Inserted test users / couple / memories are NOT cleaned up automatically;
# wipe via cleanup.sh if needed.

set -u
BASE="${BASE:-http://127.0.0.1:3000}"
STAMP="$(date +%s)"
ALICE_USER="smoke_a_${STAMP}"
BOB_USER="smoke_b_${STAMP}"
PASS="Smoke_pass_123"

PASS_COUNT=0
FAIL_COUNT=0
FAILURES=()

color() { printf '\033[%sm%s\033[0m' "$1" "$2"; }
ok()   { PASS_COUNT=$((PASS_COUNT+1)); printf '  %s %s\n' "$(color 32 PASS)" "$1"; }
bad()  { FAIL_COUNT=$((FAIL_COUNT+1)); FAILURES+=("$1"); printf '  %s %s\n' "$(color 31 FAIL)" "$1"; [ -n "${2:-}" ] && printf '       %s\n' "$2"; }
step() { printf '\n%s %s\n' "$(color 36 '==>')" "$1"; }

# call METHOD PATH [BODY] [TOKEN] -> stores status in HTTP_CODE, body in BODY
call() {
  local method="$1" path="$2" body="${3:-}" token="${4:-}"
  local args=( -s -o /tmp/smoke_body -w '%{http_code}' -X "$method" "$BASE$path" )
  if [ -n "$token" ]; then args+=( -H "Authorization: Bearer $token" ); fi
  if [ -n "$body" ]; then args+=( -H 'Content-Type: application/json' -d "$body" ); fi
  HTTP_CODE="$(curl "${args[@]}")"
  BODY="$(cat /tmp/smoke_body)"
}

# expect_code EXPECTED LABEL
expect_code() {
  if [ "$HTTP_CODE" = "$1" ]; then ok "$2 ($HTTP_CODE)"; else bad "$2 expected $1 got $HTTP_CODE" "$BODY"; fi
}

json_field() { node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{try{const j=JSON.parse(d); const path='$1'.split('.'); let v=j; for(const k of path) v=v?.[k]; process.stdout.write(String(v??''))}catch{process.stdout.write('')}})" <<<"$BODY"; }

step "0. Health check"
call GET /
if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "200" ]; then ok "backend reachable ($HTTP_CODE)"; else bad "backend not reachable" "$HTTP_CODE $BODY"; exit 1; fi

# -----------------------------------------------------------------
step "1. Auth"
call POST /auth/register "{\"username\":\"$ALICE_USER\",\"password\":\"$PASS\",\"nickname\":\"Alice\"}"
expect_code 201 "register alice"
ALICE_TOKEN="$(json_field token)"

call POST /auth/register "{\"username\":\"$BOB_USER\",\"password\":\"$PASS\",\"nickname\":\"Bob\"}"
expect_code 201 "register bob"
BOB_TOKEN="$(json_field token)"

call POST /auth/register "{\"username\":\"$ALICE_USER\",\"password\":\"$PASS\"}"
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "409" ]; then ok "duplicate username rejected ($HTTP_CODE)"; else bad "duplicate username not rejected" "$HTTP_CODE $BODY"; fi

call POST /auth/register '{"username":"x","password":"123"}'
if [ "$HTTP_CODE" = "400" ]; then ok "weak input rejected (400)"; else bad "weak input not rejected" "$HTTP_CODE $BODY"; fi

call POST /auth/login "{\"username\":\"$ALICE_USER\",\"password\":\"wrong\"}"
expect_code 401 "login wrong password"

call POST /auth/login "{\"username\":\"$ALICE_USER\",\"password\":\"$PASS\"}"
expect_code 201 "login alice"
ALICE_TOKEN="$(json_field token)"
[ -n "$ALICE_TOKEN" ] && ok "alice token obtained" || bad "alice token missing"

call GET /auth/me "" "$ALICE_TOKEN"
expect_code 200 "GET /auth/me with token"

call GET /auth/me
expect_code 401 "GET /auth/me without token"

# -----------------------------------------------------------------
step "2. Couple bind"
call POST /couple/invite "" "$ALICE_TOKEN"
expect_code 201 "alice generate invite"
INVITE="$(json_field code)"
[ -n "$INVITE" ] && ok "got invite code: $INVITE" || bad "invite code missing" "$BODY"

call POST /couple/accept "{\"code\":\"BADCODE\"}" "$BOB_TOKEN"
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "404" ]; then ok "bad code rejected ($HTTP_CODE)"; else bad "bad code not rejected" "$HTTP_CODE $BODY"; fi

call POST /couple/accept "{\"code\":\"$INVITE\"}" "$ALICE_TOKEN"
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "403" ]; then ok "self-accept rejected ($HTTP_CODE)"; else bad "self-accept not rejected" "$HTTP_CODE $BODY"; fi

call POST /couple/accept "{\"code\":\"$INVITE\"}" "$BOB_TOKEN"
expect_code 201 "bob accept invite"

call GET /couple/info "" "$ALICE_TOKEN"
expect_code 200 "alice /couple/info"

call GET /couple/info "" "$BOB_TOKEN"
expect_code 200 "bob /couple/info"

TODAY="$(date +%F)"
call PATCH /couple/info "{\"spaceName\":\"SmokeSpace_${STAMP}\",\"anniversaryDate\":\"$TODAY\"}" "$ALICE_TOKEN"
expect_code 200 "update couple info"

# -----------------------------------------------------------------
step "3. Memory CRUD + filters"
NOW_ISO="$(date -u +%FT%TZ)"
for t in photo video song text; do
  call POST /memories "{\"type\":\"$t\",\"title\":\"smoke $t\",\"content\":\"hello-$t-$STAMP\",\"memoryDate\":\"$NOW_ISO\"}" "$ALICE_TOKEN"
  expect_code 201 "create memory $t"
  eval "MID_${t}=\"$(json_field id)\""
done

call GET '/memories?page=1&pageSize=20' "" "$ALICE_TOKEN"
expect_code 200 "list memories default page"
TOTAL="$(json_field total)"
[ "$TOTAL" -ge 4 ] 2>/dev/null && ok "total >= 4 ($TOTAL)" || bad "total unexpected" "$TOTAL"

call GET '/memories?type=photo' "" "$ALICE_TOKEN"
expect_code 200 "list memories type=photo"

call GET "/memories?keyword=hello-text-$STAMP" "" "$ALICE_TOKEN"
expect_code 200 "list memories keyword"

call GET '/memories?pageSize=99999' "" "$ALICE_TOKEN"
expect_code 200 "pageSize cap accepted"
PS="$(json_field pageSize)"
[ "$PS" = "100" ] && ok "pageSize clamped to 100" || bad "pageSize not clamped" "got $PS"

call GET /memories/months "" "$ALICE_TOKEN"
expect_code 200 "GET /memories/months"

call GET /memories/stats "" "$ALICE_TOKEN"
expect_code 200 "GET /memories/stats"
PHOTO_C="$(json_field photo)"
[ "$PHOTO_C" -ge 1 ] 2>/dev/null && ok "stats.photo >= 1 ($PHOTO_C)" || bad "stats.photo unexpected" "$BODY"

# bob can list shared
call GET /memories "" "$BOB_TOKEN"
expect_code 200 "bob can list shared memories"

# bob delete alice's -> 403
call DELETE "/memories/${MID_text}" "" "$BOB_TOKEN"
expect_code 403 "bob cannot delete alice's memory"

# alice delete own -> 200
call DELETE "/memories/${MID_text}" "" "$ALICE_TOKEN"
expect_code 200 "alice deletes own text memory"

# -----------------------------------------------------------------
step "4. AuthZ guards"
call GET /memories
expect_code 401 "no-token /memories rejected"

call GET /memories "" "garbage.token.value"
expect_code 401 "bad-token /memories rejected"

# -----------------------------------------------------------------
step "5. Chat REST"
call GET '/messages?limit=99999' "" "$ALICE_TOKEN"
expect_code 200 "messages history limit cap accepted"

call GET '/messages/search?q=hello&pageSize=99999' "" "$ALICE_TOKEN"
expect_code 200 "messages search pageSize cap"
PS2="$(json_field pageSize)"
[ "$PS2" = "100" ] && ok "search pageSize clamped to 100" || bad "search pageSize not clamped" "got $PS2"

call GET '/messages/search?q=%25_special' "" "$ALICE_TOKEN"
expect_code 200 "messages search with SQL wildcard escape"

# -----------------------------------------------------------------
step "6. OSS upload"
TMP_IMG="/tmp/smoke_${STAMP}.png"
# 1x1 png
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDAT\x78\x9cb\x00\x01\x00\x00\x05\x00\x01\r\n\x2d\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > "$TMP_IMG"
UP_CODE=$(curl -s -o /tmp/smoke_body -w '%{http_code}' -X POST "$BASE/oss/upload?scope=memory&type=photo" -H "Authorization: Bearer $ALICE_TOKEN" -F "file=@${TMP_IMG}")
HTTP_CODE="$UP_CODE"; BODY="$(cat /tmp/smoke_body)"
expect_code 201 "OSS upload png"
OSS_URL="$(json_field url)"
[ -n "$OSS_URL" ] && ok "oss url returned: $OSS_URL" || bad "oss url missing" "$BODY"

# -----------------------------------------------------------------
echo
echo "==================================="
echo "PASS: $PASS_COUNT   FAIL: $FAIL_COUNT"
echo "==================================="
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "Failures:"
  for f in "${FAILURES[@]}"; do echo "  - $f"; done
  exit 1
fi
exit 0
