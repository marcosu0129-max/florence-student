#!/usr/bin/env python3
"""Patch is_required for LM-92 courses based on API tipo_ins values.
Uses name-based matching from the actual DB course names.
"""
import subprocess, json

SUPABASE_URL = "https://bydicprzizmiywzykofr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5ZGljcHJ6aXptaXl3enlrb2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTM4NTIsImV4cCI6MjA5MzcyOTg1Mn0.lyNiSTaXRfRrV2Srk4JCEoie7fTQuPsd8Lbwzj1K58I"
API_BASE = "https://unifi.coursecatalogue.cineca.it"
CORSO_COD = "4680"
CODICIONE = "0480107309300001"
ACADEMIC_YEAR = 2025


def curl(url, headers=None):
    args = ["curl", "-s", "-L", "--max-time", "15", url, "-H", "Accept: application/json"]
    if headers:
        for k, v in headers.items():
            args += ["-H", f"{k}: {v}"]
    r = subprocess.run(args, capture_output=True, text=True, timeout=20)
    return r.stdout


def supa_get(path):
    r = subprocess.run(
        ["curl", "-s", f"{SUPABASE_URL}/rest/v1/{path}",
         "-H", f"apikey: {SUPABASE_KEY}", "-H", f"Authorization: Bearer {SUPABASE_KEY}",
         "-H", "Accept: application/json"],
        capture_output=True, text=True, timeout=15
    )
    return json.loads(r.stdout) if r.stdout.strip() else []


def supa_patch(table, record):
    rid = record["id"]
    r = subprocess.run(
        ["curl", "-s", "-X", "PATCH",
         f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{rid}",
         "-H", f"apikey: {SUPABASE_KEY}", "-H", f"Authorization: Bearer {SUPABASE_KEY}",
         "-H", "Content-Type: application/json",
         "-H", "Prefer: resolution=merge-duplicates",
         "-d", json.dumps(record)],
        capture_output=True, text=True, timeout=15
    )
    return r.returncode, r.stdout[:80]


def main():
    # Fetch API data
    url = f"{API_BASE}/api/v1/corso-offerta/{CORSO_COD}?codicione={CODICIONE}"
    raw = curl(url, {"Referer": f"{API_BASE}/"})
    data = json.loads(raw)

    # Build name -> is_required map from API
    api_required = {}
    for pv in data.get(str(ACADEMIC_YEAR), {}).values():
        for att in pv.get("attivita", []):
            if att.get("aa") == str(ACADEMIC_YEAR):
                name = att.get("des_it", "")
                tipo = att.get("tipo_ins_des_it", "Obbligatorio")
                api_required[name] = "obbligatorio" in tipo.lower()

    print(f"API courses: {len(api_required)}")
    for n, r in sorted(api_required.items()):
        print(f"  {'REQ' if r else 'OPT'} | {n}")

    # Fetch DB courses
    db_courses = supa_get("courses?program_code=eq.LM-92&select=id,name,is_required")
    print(f"\nDB courses: {len(db_courses)}")

    # Try name matching
    patched = 0
    skipped = 0
    errors = 0
    not_in_api = []

    for c in db_courses:
        cid = c["id"]
        cname = c["name"]
        current = c.get("is_required", False)

        if cname in api_required:
            should_be = api_required[cname]
            if current != should_be:
                code, resp = supa_patch("courses", {"id": cid, "is_required": should_be})
                if code == 0:
                    print(f"  PATCH {cname[:55]}: {current} -> {should_be}")
                    patched += 1
                else:
                    print(f"  ERROR {cname[:50]}: {resp}")
                    errors += 1
            else:
                print(f"  OK    {cname[:55]}: already {should_be}")
                skipped += 1
        else:
            print(f"  WARN  not in API: {cname}")
            not_in_api.append(cname)

    print(f"\nResults: patched={patched}, skipped={skipped}, errors={errors}, not_in_api={len(not_in_api)}")


if __name__ == "__main__":
    main()
