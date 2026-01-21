#!/bin/bash

# Login
echo "Logging in..."
LOGIN_RES=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@enginy.cat", "password": "admin123"}')

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "Login failed. Response: $LOGIN_RES"
    exit 1
fi
echo "Got Token"

# Fetch Workshops
echo "Fetching workshops..."
WORKSHOPS_RES=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/catalog/workshops)

# Check if response is valid JSON array or object
# Structure expected: { "workshops": [ ... ] } or just [ ... ] ?
# Based on previous error "list indices must be integers", it seems I treated it as dict but maybe it was list, or vice versa.
# Let's use python to inspect and print.

EDITION_ID=$(echo "$WORKSHOPS_RES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # data is list of workshops? or dict with key 'workshops'?
    # Checking controller.js usually reveals it. catalog/controller.js -> listWorkshops -> res.json(result.rows) -> likely LIST.
    if isinstance(data, list) and len(data) > 0:
         # Each item is a workshop. Does it have editions?
         # Check first item
         w = data[0]
         if 'editions' in w and len(w['editions']) > 0:
             print(w['editions'][0]['id'])
         else:
             print('NO_EDITIONS')
    else:
        print('EMPTY_OR_DICT')
except Exception as e:
    print('ERROR')
")

if [ "$EDITION_ID" == "ERROR" ] || [ "$EDITION_ID" == "EMPTY_OR_DICT" ] || [ "$EDITION_ID" == "NO_EDITIONS" ]; then
    echo "Failed to get edition ID. Response start: ${WORKSHOPS_RES:0:100}..."
    exit 1
fi
echo "Edition ID: $EDITION_ID"

# Fetch Candidates
echo "Fetching candidate for Edition $EDITION_ID..."
CANDIDATES_RES=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/teachers/candidates/$EDITION_ID")

TEACHER_ID=$(echo "$CANDIDATES_RES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, list) and len(data) > 0:
        print(data[0]['teacher_id'])
    else:
        print('NONE')
except:
    print('ERROR')
")

if [ "$TEACHER_ID" == "NONE" ] || [ "$TEACHER_ID" == "ERROR" ]; then
    echo "No candidates found via preference. Fetching ANY teacher from ESCOLA TEST (or first school)..."
    # Get First school
    SCHOOL_ID=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/centers | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])")
    
    # Get teachers from that school. Admin cannot call getByCenter directly easily as it uses req.user to find school.
    # But wait, Admin can do anything? No, getByCenter uses `req.user.id` to find school. Admin doesn't manage a school directly in this logic usually.
    # Let's try to use SQL via docker exec since API access to all teachers might be restricted for Admin in this specific controller implementation.
    # OR: The 'candidates' endpoint was empty because no requests.
    
    # Let's use docker exec to get a teacher ID to be sure.
    TEACHER_ID=$(docker exec enginy_postgres psql -U admin -d enginy_db -t -c "SELECT id FROM teachers LIMIT 1" | xargs)
    echo "Fallback Teacher ID: $TEACHER_ID"
fi

if [ -z "$TEACHER_ID" ]; then
    echo "Still no teacher found."
    exit 1
fi
echo "Teacher ID: $TEACHER_ID"

# Assign
echo "Assigning..."
ASSIGN_RES=$(curl -s -X POST http://localhost:3000/api/teachers/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"workshop_edition_id\": \"$EDITION_ID\", \"teacher_id\": \"$TEACHER_ID\", \"is_main_referent\": true}")

echo "Response: $ASSIGN_RES"
