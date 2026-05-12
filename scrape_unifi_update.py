#!/usr/bin/env python3
"""
Step 1: Fix mangled course names in DB by matching on program_code.
Then Step 2: Update all detail fields for LM-92 courses.
"""
import subprocess, json, re, time

SUPABASE_URL = "https://bydicprzizmiywzykofr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5ZGljcHJ6aXptaXl3enlrb2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTM4NTIsImV4cCI6MjA5MzcyOTg1Mn0.lyNiSTaXRfRrV2Srk4JCEoie7fTQuPsd8Lbwzj1K58I"
API_BASE = "https://unifi.coursecatalogue.cineca.it"


def curl(url, headers=None):
    args = ["curl", "-s", "-L", "--max-time", "15", url]
    args += ["-H", "Accept: application/json"]
    if headers:
        for k, v in headers.items():
            args += ["-H", f"{k}: {v}"]
    r = subprocess.run(args, capture_output=True, text=True, timeout=20)
    return r.stdout


def supa_get(path):
    r = subprocess.run(
        ["curl", "-s", f"{SUPABASE_URL}/rest/v1/{path}",
         "-H", f"apikey: {SUPABASE_KEY}",
         "-H", f"Authorization: Bearer {SUPABASE_KEY}",
         "-H", "Accept: application/json"],
        capture_output=True, text=True, timeout=15
    )
    return json.loads(r.stdout) if r.stdout.strip() else []


def supa_patch(path, record):
    rid = record["id"]
    r = subprocess.run(
        ["curl", "-s", "-X", "PATCH",
         f"{SUPABASE_URL}/rest/v1/{path}?id=eq.{rid}",
         "-H", f"apikey: {SUPABASE_KEY}",
         "-H", f"Authorization: Bearer {SUPABASE_KEY}",
         "-H", "Content-Type: application/json",
         "-H", "Prefer: resolution=merge-duplicates",
         "-d", json.dumps(record)],
        capture_output=True, text=True, timeout=15
    )
    return r.returncode, r.stdout[:80]


def strip_html(text):
    if not text: return ""
    return re.sub(r"<[^>]+>", "", text).strip()


def main():
    print("=" * 60)
    print("Step 1: Fix course names and update detail fields")
    print("=" * 60 + "\n")

    # Fetch DB courses
    db_courses = supa_get("courses?program_code=eq.LM-92&select=id,name,credits,year_level")
    name_to_db = {c["name"]: c for c in db_courses}
    print(f"DB has {len(db_courses)} LM-92 courses\n")

    # Fetch API list
    api_raw = curl(f"{API_BASE}/api/v1/corso-offerta/4680?codicione=0480107309300001",
                   {"Referer": f"{API_BASE}/"})
    api_data = json.loads(api_raw)
    api_items = []
    for pv in api_data.get("2025", {}).values():
        for att in pv.get("attivita", []):
            if att.get("aa") == "2025":
                api_items.append(att)
    seen, unique = set(), []
    for c in api_items:
        if c.get("cod", "") not in seen:
            seen.add(c.get("cod", "")); unique.append(c)
    api_items = unique
    name_to_api = {c["des_it"]: c for c in api_items}
    print(f"API has {len(api_items)} courses for 2025\n")

    # Step 1: Fix names by matching courses
    print("Step 1: Fixing course names...")
    name_fixes = 0
    for db_name, db_course in name_to_db.items():
        db_id = db_course["id"]
        # Try exact match first
        if db_name in name_to_api:
            continue
        # Try to find match by stripping broken chars
        # Look for a name that starts with the first 10 chars and ends with last 5
        prefix = db_name[:15].upper().replace("'", " ").replace("-", " ")
        suffix = db_name[-10:].upper().replace("'", " ")
        for api_name, api_item in name_to_api.items():
            if api_name.upper().startswith(prefix[:10]) and api_name.upper().endswith(suffix[-8:]):
                print(f"  Fix: {db_name[:50]} -> {api_name}")
                code, resp = supa_patch("courses", {"id": db_id, "name": api_name})
                if code == 0:
                    name_fixes += 1
                break
    print(f"  Fixed {name_fixes} names\n")

    # Rebuild name map
    time.sleep(1)
    db_courses = supa_get("courses?program_code=eq.LM-92&select=id,name")
    name_to_db = {c["name"]: c["id"] for c in db_courses}

    # Step 2: Update detail fields
    print("Step 2: Updating detail fields...")
    ok, fail = 0, 0
    for api_item in api_items:
        api_name = api_item.get("des_it", "")
        db_id = name_to_db.get(api_name)
        if not db_id:
            print(f"  [SKIP] {api_name}")
            continue

        cod = api_item.get("cod", "")
        af_id = api_item.get("af_percorso_id", "")
        cds_cod = api_item.get("cdsCod", "B385")
        anno_coorte = api_item.get("annoCoorte", "2025")

        detail_raw = curl(
            f"{API_BASE}/api/v1/insegnamento"
            f"?anno=2025&insegnamento={cod}&ordinamento_aa=2025"
            f"&af_percorso={af_id}&corso_cod=4680&corso_aa={anno_coorte}",
            {"Referer": f"{API_BASE}/"}
        )

        record = {"id": db_id}
        has_detail = False

        if detail_raw and detail_raw.strip().startswith("{"):
            detail = json.loads(detail_raw)
            has_detail = True

            record["lingua"] = detail.get("lingua_des_it", "")
            record["frequenza"] = detail.get("frequenza_it", "")
            record["ssd"] = detail.get("ssd", "")

            d_obj = detail.get("durata", {})
            totale = d_obj.get("totale", "")
            parts = []
            for t in d_obj.get("tipo", []):
                lbl = t.get("tipo_durata_des_it", "")
                val = t.get("valore", "")
                if lbl and val:
                    parts.append(f"{val} ore ({lbl})")
                elif val:
                    parts.append(f"{val} ore")
            record["durata"] = f"{totale} ore" if totale else (", ".join(parts) if parts else "")

            mapping = [
                ("obiettivi_formativi_it", "obiettivi_formativi"),
                ("contenuti_it", "contenuti"),
                ("prerequisiti_it", "prerequisiti"),
                ("metodi_didattici_est_it", "metodi_didattici"),
                ("verifica_apprendimento_it", "verifica_apprendimento"),
                ("programmazione_estesa_it", "programma_esteso"),
                ("testi_it", "testi"),
                ("obiettivi_svil_sos_des_it", "agenda_2030"),
                ("altro_it", "altro"),
            ]
            for t in detail.get("testiTotali", []):
                if t.get("etichetta_it") == "Lingua insegnamento":
                    record["lingua"] = strip_html(t.get("altri_testi_it", "")) or record["lingua"]
                for src, dst in mapping:
                    v = t.get(src, "")
                    if v:
                        record[dst] = strip_html(v)

        code, resp = supa_patch("courses", record)
        if code == 0 and not resp.strip():
            ok += 1
            ssd = f" ssd={record.get('ssd','')}" if has_detail else ""
            print(f"  [OK] {api_name[:55]}{ssd}")
        else:
            fail += 1
            print(f"  [FAIL] {api_name[:55]}: {resp[:60]}")

        time.sleep(0.3)

    print(f"\n{'='*60}")
    print(f"Summary: {ok} updated, {fail} failed, {name_fixes} names fixed")
    print("Done!")


if __name__ == "__main__":
    main()
