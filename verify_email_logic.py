import requests
import json
import random
import sys
import subprocess

API_URL = "http://localhost:3000/api"

def get_token():
    try:
        res = requests.post(f"{API_URL}/auth/login", json={"email": "admin@enginy.cat", "password": "admin123"})
        res.raise_for_status()
        return res.json()["token"]
    except Exception as e:
        print(f"Login failed: {e}")
        sys.exit(1)

def get_edition_id(token):
    res = requests.get(f"{API_URL}/catalog/workshops", headers={"Authorization": f"Bearer {token}"})
    data = res.json()
    # It seems to be a list directly based on controller logs inspection earlier?
    # Or maybe { "data": [...] }?
    # Let's inspect type
    if isinstance(data, list):
         return data[0]["editions"][0]["id"]
    elif "workshops" in data:
         return data["workshops"][0]["editions"][0]["id"]
    else:
         print("Unknown structure:", data.keys() if isinstance(data, dict) else type(data))
         sys.exit(1)

def create_teacher_via_sql():
    # Helper to create teacher directly in DB to bypass API limitations for Admin if any
    # Random suffix to avoid uniqueness issues
    rand_suff = random.randint(1000, 9999)
    email = f"profe.auto.{rand_suff}@test.cat"
    school_id_cmd = "docker exec enginy_postgres psql -U admin -d enginy_db -t -c 'SELECT id FROM schools LIMIT 1'"
    school_id = subprocess.check_output(school_id_cmd, shell=True).decode().strip()
    
    insert_cmd = f"docker exec enginy_postgres psql -U admin -d enginy_db -t -c \"INSERT INTO teachers (full_name, email, phone_number, school_id) VALUES ('Profe Auto {rand_suff}', '{email}', '123456789', '{school_id}') RETURNING id\""
    output = subprocess.check_output(insert_cmd, shell=True).decode().strip()
    # Output might contain "INSERT 0 1" or be multiline if captured poorly.
    # postgres -t usually outputs just ID but maybe whitespace.
    # Let's take the first non-empty line.
    for line in output.split('\n'):
        if line.strip() and "INSERT" not in line:
            return line.strip(), email
    return output.split()[0], email # Fallback

def assign_teacher(token, edition_id, teacher_id):
    payload = {
        "workshop_edition_id": edition_id,
        "teacher_id": teacher_id,
        "is_main_referent": True
    }
    print(f"Sending payload: {json.dumps(payload, indent=2)}")
    
    res = requests.post(
        f"{API_URL}/teachers/assign",
        headers={"Authorization": f"Bearer {token}"},
        json=payload
    )
    
    print(f"Status Code: {res.status_code}")
    try:
        print("Response JSON:", json.dumps(res.json(), indent=2))
        return res.json()
    except:
        print("Response Text:", res.text)
        return None

if __name__ == "__main__":
    print("--- START VERIFICATION ---")
    token = get_token()
    print("Token obtained.")
    
    edition_id = get_edition_id(token)
    print(f"Edition ID: {edition_id}")
    
    # Clear existing assignments to avoid 400 error
    subprocess.call(f"docker exec enginy_postgres psql -U admin -d enginy_db -c \"DELETE FROM workshop_assigned_teachers WHERE workshop_edition_id = '{edition_id}';\"", shell=True)
    print("Cleared existing assignments.")

    teacher_id, email = create_teacher_via_sql()
    print(f"Created new teacher: {teacher_id} ({email})")
    
    resp = assign_teacher(token, edition_id, teacher_id)
    
    if resp and resp.get("user_created") == True:
        print("SUCCESS: User created flag is TRUE.")
    else:
        print("FAILURE: User created flag is False or missing.")
        
    if resp and resp.get("email_sent") is not None:
         print(f"Email sent status: {resp.get('email_sent')}")
    
    print("--- END VERIFICATION ---")
