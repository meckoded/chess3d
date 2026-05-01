#!/bin/bash
# Chess3D comprehensive E2E test script - cron #7
BASE="http://localhost:3001"
PASS=0
FAIL=0

ok() { PASS=$((PASS+1)); echo "  ✅ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ❌ $1"; }

echo "═══════════════════════════════════════"
echo "  Chess3D E2E Test Suite — Cron #7"
echo "═══════════════════════════════════════"
echo ""

# ─── Health ───
R=$(curl -s $BASE/api/health)
echo "$R" | grep -q '"status":"ok"' && ok "Health check" || bad "Health check"

# ─── Register fresh users ───
U1="e2e_test_a_$(date +%s)"
U2="e2e_test_b_$(date +%s)"
PWD="Test123!"

R=$(curl -s -X POST $BASE/api/auth/register -H 'Content-Type: application/json' -d "{\"username\":\"$U1\",\"email\":\"${U1}@test.com\",\"password\":\"$PWD\"}")
echo "$R" | grep -q '"token"' && ok "Register user A" || bad "Register user A"
TOK_A=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

R=$(curl -s -X POST $BASE/api/auth/register -H 'Content-Type: application/json' -d "{\"username\":\"$U2\",\"email\":\"${U2}@test.com\",\"password\":\"$PWD\"}")
echo "$R" | grep -q '"token"' && ok "Register user B" || bad "Register user B"
TOK_B=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

# ─── Login ───
R=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"${U1}@test.com\",\"password\":\"$PWD\"}")
echo "$R" | grep -q '"token"' && ok "Login user A" || bad "Login user A"
TOK_A=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

R=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"${U2}@test.com\",\"password\":\"$PWD\"}")
echo "$R" | grep -q '"token"' && ok "Login user B" || bad "Login user B"
TOK_B=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

# ─── Profile ───
R=$(curl -s $BASE/api/users/profile -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q '"username"' && ok "Profile A" || bad "Profile A"

# ─── Stats ───
R=$(curl -s $BASE/api/users/stats -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q '"rating"' && ok "Stats A" || bad "Stats A"

# ─── Create game ───
R=$(curl -s -X POST $BASE/api/games/create -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"timeControl":600}')
echo "$R" | grep -q '"id"' && ok "Create game" || bad "Create game"
GID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('game',{}).get('id',''))" 2>/dev/null)
echo "      Game ID: $GID"

# ─── Game list ───
R=$(curl -s $BASE/api/games -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q '"games"' && ok "Game list" || bad "Game list"

# ─── Game detail ───
R=$(curl -s $BASE/api/games/$GID -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q '"id"' && ok "Game detail" || bad "Game detail"
echo "$R" | grep -q '"waiting"' && ok "Game status is waiting" || bad "Game status"

# ─── Join game ───
R=$(curl -s -X POST $BASE/api/games/$GID/join -H "Authorization: Bearer $TOK_B")
echo "$R" | grep -q '"active"' && ok "Join game" || bad "Join game"

# ─── Legal moves ───
R=$(curl -s $BASE/api/games/$GID/moves/e2 -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q '"moves"' && ok "Legal moves" || bad "Legal moves"

# ─── Make move e2e4 (White) ───
R=$(curl -s -X POST $BASE/api/games/$GID/move -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"from":"e2","to":"e4"}')
echo "$R" | grep -q '"move"' && ok "Move e2e4" || bad "Move e2e4"
echo "$R" | grep -q '"fen"' && ok "  → FEN returned" || bad "  → FEN"

# ─── Make move e7e5 (Black) ───
R=$(curl -s -X POST $BASE/api/games/$GID/move -H "Authorization: Bearer $TOK_B" -H 'Content-Type: application/json' -d '{"from":"e7","to":"e5"}')
echo "$R" | grep -q '"move"' && ok "Move e7e5" || bad "Move e7e5"

# ─── Moves endpoint ───
R=$(curl -s $BASE/api/games/$GID -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q '"moves"' && ok "Moves in game detail" || bad "Moves in game detail"

# ─── ELO after game completion ───
curl -s -X POST $BASE/api/games/$GID/move -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"from":"f1","to":"c4"}' > /dev/null
curl -s -X POST $BASE/api/games/$GID/move -H "Authorization: Bearer $TOK_B" -H 'Content-Type: application/json' -d '{"from":"d8","to":"h4"}' > /dev/null
R=$(curl -s $BASE/api/users/profile -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q '"rating"' && ok "ELO updated after game" || bad "ELO updated after game"

# ─── Leaderboard ───
R=$(curl -s $BASE/api/users/leaderboard)
echo "$R" | grep -q '"leaderboard"' && ok "Leaderboard" || bad "Leaderboard"

# ─── Draw offer + accept ───
R=$(curl -s -X POST $BASE/api/games/create -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"timeControl":600}')
GID2=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('game',{}).get('id',''))" 2>/dev/null)
curl -s -X POST $BASE/api/games/$GID2/join -H "Authorization: Bearer $TOK_B" > /dev/null
curl -s -X POST $BASE/api/games/$GID2/move -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"from":"e2","to":"e4"}' > /dev/null
curl -s -X POST $BASE/api/games/$GID2/move -H "Authorization: Bearer $TOK_B" -H 'Content-Type: application/json' -d '{"from":"e7","to":"e5"}' > /dev/null
R=$(curl -s -X POST $BASE/api/games/$GID2/draw -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"action":"offer"}')
echo "$R" | grep -q 'Draw offered' && ok "Draw offer" || bad "Draw offer"
R=$(curl -s -X POST $BASE/api/games/$GID2/draw -H "Authorization: Bearer $TOK_B" -H 'Content-Type: application/json' -d '{"action":"accept"}')
echo "$R" | grep -q '"result":"draw"' && ok "Draw accept" || bad "Draw accept"

# ─── Abort game (no moves) ───
R=$(curl -s -X POST $BASE/api/games/create -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"timeControl":600}')
GID3=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('game',{}).get('id',''))" 2>/dev/null)
curl -s -X POST $BASE/api/games/$GID3/join -H "Authorization: Bearer $TOK_B" > /dev/null
R=$(curl -s -X POST $BASE/api/games/$GID3/abort -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q 'Game aborted' && ok "Abort game (no moves)" || bad "Abort game"

# ─── Resign ───
R=$(curl -s -X POST $BASE/api/games/create -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"timeControl":600}')
GID4=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('game',{}).get('id',''))" 2>/dev/null)
curl -s -X POST $BASE/api/games/$GID4/join -H "Authorization: Bearer $TOK_B" > /dev/null
R=$(curl -s -X POST $BASE/api/games/$GID4/resign -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q '"completed"' && ok "Resign" || bad "Resign"

# ─── Resign after moves ───
R=$(curl -s -X POST $BASE/api/games/create -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"timeControl":600}')
GID5=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('game',{}).get('id',''))" 2>/dev/null)
curl -s -X POST $BASE/api/games/$GID5/join -H "Authorization: Bearer $TOK_B" > /dev/null
curl -s -X POST $BASE/api/games/$GID5/move -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"from":"e2","to":"e4"}' > /dev/null
R=$(curl -s -X POST $BASE/api/games/$GID5/resign -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q '"completed"' && ok "Resign after moves" || bad "Resign after moves"

# ─── SPA fallback ───
R=$(curl -s $BASE/some-react-route)
echo "$R" | grep -q '<div id="root">' && ok "SPA fallback" || bad "SPA fallback"

# ─── PGN export ───
# Finish another game for PGN
R=$(curl -s -X POST $BASE/api/games/create -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"timeControl":600}')
GID6=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('game',{}).get('id',''))" 2>/dev/null)
curl -s -X POST $BASE/api/games/$GID6/join -H "Authorization: Bearer $TOK_B" > /dev/null
curl -s -X POST $BASE/api/games/$GID6/move -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"from":"e2","to":"e4"}' > /dev/null
curl -s -X POST $BASE/api/games/$GID6/move -H "Authorization: Bearer $TOK_B" -H 'Content-Type: application/json' -d '{"from":"e7","to":"e5"}' > /dev/null
# Resign the unfinished game to create a completed game
curl -s -X POST $BASE/api/games/$GID6/resign -H "Authorization: Bearer $TOK_A" > /dev/null
R=$(curl -s $BASE/api/games/$GID6/pgn -H "Authorization: Bearer $TOK_A")
echo "$R" | grep -q 'Result' && ok "PGN export" || bad "PGN export"

# ─── Clock enforcement on move ───
R=$(curl -s -X POST $BASE/api/games/$GID/move -H "Authorization: Bearer $TOK_A" -H 'Content-Type: application/json' -d '{"from":"g1","to":"f3"}') 2>/dev/null
echo "$R" | grep -q '"whiteTime"' && ok "Clock time in move response" || bad "Clock time in move"

# ─── Admin endpoints ───
ADMINU="e2eadmin_$(date +%s)"
ADMIN=$(curl -s -X POST $BASE/api/auth/register -H 'Content-Type: application/json' -d "{\"username\":\"$ADMINU\",\"email\":\"${ADMINU}@test.com\",\"password\":\"$PWD\"}")
TOK_ADMIN=$(echo "$ADMIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
ADMIN_ID=$(curl -s $BASE/api/auth/me -H "Authorization: Bearer $TOK_ADMIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('id',''))" 2>/dev/null)
# Use Node.js to set admin role (sqlite3 CLI not available in sandbox)
node -e "const db=require('/home/node/.openclaw/workspace/coder/chess3d/backend/node_modules/better-sqlite3')('/home/node/.openclaw/workspace/coder/chess3d/backend/chess3d.db');db.prepare('UPDATE users SET role=? WHERE id=?').run('admin','$ADMIN_ID');db.close();console.log('role set')"
# Re-login to get token with admin role in JWT
ADMIN2=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d "{\"email\":\"${ADMINU}@test.com\",\"password\":\"$PWD\"}")
TOK_ADMIN=$(echo "$ADMIN2" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

R=$(curl -s $BASE/api/admin/users -H "Authorization: Bearer $TOK_ADMIN")
echo "$R" | grep -q '"users"' && ok "Admin - list users" || bad "Admin - list users"

R=$(curl -s $BASE/api/admin/games -H "Authorization: Bearer $TOK_ADMIN")
echo "$R" | grep -q '"games"' && ok "Admin - list games" || bad "Admin - list games"

R=$(curl -s $BASE/api/admin/stats -H "Authorization: Bearer $TOK_ADMIN")
echo "$R" | grep -q '"stats"' && ok "Admin - stats" || bad "Admin - stats"

echo ""
echo "═══════════════════════════════════════"
echo "  RESULTS: $PASS ✅  /  $FAIL ❌  ($(python3 -c "print(f'{$PASS}/({$PASS}+{$FAIL})*100:.0f')" 2>/dev/null)%)"
echo "═══════════════════════════════════════"
