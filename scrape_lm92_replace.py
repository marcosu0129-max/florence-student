#!/usr/bin/env python3
"""
Full replacement script for Pratiche LM-92 (corso_cod=4680, B385) 2025.
1. Delete existing LM-92 courses and their course_professor links
2. Re-scrape all 28 courses (14 B385 + 14 B252)
3. Write to Supabase
"""
import subprocess, json, re, time, hashlib, uuid as _uuid

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


def supa_delete(path, body):
    r = subprocess.run(
        ["curl", "-s", "-X", "DELETE", f"{SUPABASE_URL}/rest/v1/{path}",
         "-H", f"apikey: {SUPABASE_KEY}", "-H", f"Authorization: Bearer {SUPABASE_KEY}",
         "-H", "Content-Type: application/json",
         "-d", json.dumps(body)],
        capture_output=True, text=True, timeout=30
    )
    return r.returncode, r.stdout[:200]


def supa_upsert(table, records):
    if not records:
        return 0, "skipped"
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", f"{SUPABASE_URL}/rest/v1/{table}",
         "-H", f"apikey: {SUPABASE_KEY}", "-H", f"Authorization: Bearer {SUPABASE_KEY}",
         "-H", "Content-Type: application/json",
         "-H", "Prefer: resolution=merge-duplicates",
         "-d", json.dumps(records, ensure_ascii=False)],
        capture_output=True, text=True, timeout=30
    )
    return 0, r.stdout[:200]


def supa_patch_one(table, record):
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


def strip_html(text):
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", text).strip()


def course_idx_key(item):
    """Generate a stable key from the course item for consistent ordering."""
    cds = item.get("cdsCod", "B385")
    cod = item.get("cod", "")
    return (cds, cod)


def course_id_from_item(item, seq):
    """Generate a valid UUID for course using only hex chars."""
    name = item.get("des_it", f"course{seq}")
    seed = f"LM92_{ACADEMIC_YEAR}_{seq}_{name[:20]}"
    h = hashlib.md5(seed.encode()).hexdigest()  # 32 hex chars
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"


def professor_id_from_name(name):
    h = hashlib.md5(name.encode()).hexdigest()
    return f"{h[:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}"


def normalize_semester(p):
    if not p:
        return "N/A"
    p = p.lower()
    if "primo" in p or "s1" in p:
        return "I Sem"
    if "secondo" in p or "s2" in p:
        return "II Sem"
    if "annuale" in p:
        return "Annuale"
    return "N/A"


def extract_fields(detail):
    f = {k: "" for k in [
        "lingua", "durata", "frequenza", "ssd",
        "obiettivi_formativi", "contenuti", "prerequisiti",
        "metodi_didattici", "verifica_apprendimento",
        "programma_esteso", "testi", "agenda_2030", "altro"
    ]}
    if not detail:
        return f

    f["lingua"] = detail.get("lingua_des_it", "")
    f["frequenza"] = detail.get("frequenza_it", "")
    f["ssd"] = detail.get("ssd", "")

    d = detail.get("durata", {})
    totale = d.get("totale", "")
    parts = []
    for t in d.get("tipo", []):
        lbl = t.get("tipo_durata_des_it", "")
        val = t.get("valore", "")
        if lbl and val:
            parts.append(f"{val} ore ({lbl})")
        elif val:
            parts.append(f"{val} ore")
    f["durata"] = f"{totale} ore" if totale else (", ".join(parts) if parts else "")

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
            f["lingua"] = strip_html(t.get("altri_testi_it", "")) or f["lingua"]
        for src, dst in mapping:
            v = t.get(src, "")
            if v:
                f[dst] = strip_html(v)
    return f


def fetch_detail(cds_cod, cod, af_id, anno_coorte):
    url = (f"{API_BASE}/api/v1/insegnamento"
           f"?anno={ACADEMIC_YEAR}&insegnamento={cod}"
           f"&ordinamento_aa={ACADEMIC_YEAR}&af_percorso={af_id}"
           f"&corso_cod={CORSO_COD}&corso_aa={anno_coorte}")
    raw = curl(url, {"Referer": f"{API_BASE}/"})
    if raw and raw.strip().startswith("{"):
        return json.loads(raw)
    return {}


def fetch_course_list():
    """Fetch all courses for 2025 from the list API."""
    url = f"{API_BASE}/api/v1/corso-offerta/{CORSO_COD}?codicione={CODICIONE}"
    raw = curl(url, {"Referer": f"{API_BASE}/"})
    data = json.loads(raw)
    items = []
    for pv in data.get(str(ACADEMIC_YEAR), {}).values():
        for att in pv.get("attivita", []):
            if att.get("aa") == str(ACADEMIC_YEAR):
                att["_periodo"] = pv.get("periodo_didattico_it", "N/A")
                items.append(att)
    # dedup
    seen, unique = set(), []
    for c in items:
        key = course_idx_key(c)
        if key not in seen:
            seen.add(key)
            unique.append(c)
    return unique


def main():
    print("=" * 60)
    print("LM-92 Full Replacement - Pratiche, Linguaggi e Culture")
    print("=" * 60)

    # Step 1: Get existing LM-92 course IDs
    existing = supa_get("courses?program_code=eq.LM-92&select=id")
    existing_ids = [c["id"] for c in existing]
    print(f"\n[1] Found {len(existing_ids)} existing LM-92 courses")

    # Step 2: Delete course_professor links
    if existing_ids:
        print("[2] Deleting course_professor links...")
        for cid in existing_ids:
            supa_delete("course_professor?course_id=eq." + cid, [{"id": cid}])
        print(f"    Deleted links for {len(existing_ids)} courses")

    # Step 3: Delete old courses
    if existing_ids:
        print("[3] Deleting old LM-92 courses...")
        batch = [{"id": cid} for cid in existing_ids]
        code, resp = supa_delete("courses", batch)
        print(f"    Delete response: {resp[:100]}")
        print(f"    Return code: {code}")

    # Step 4: Fetch course list
    print("\n[4] Fetching course list from UniFi API...")
    items = fetch_course_list()
    print(f"    Found {len(items)} unique courses")

    # Sort: B385 first (seq 1-14), then B252 (seq 15-28)
    b385 = sorted([c for c in items if c.get("cdsCod") == "B385"], key=lambda x: x.get("cod",""))
    b252 = sorted([c for c in items if c.get("cdsCod") == "B252"], key=lambda x: x.get("cod",""))
    items = b385 + b252

    # Step 5: Build records
    print("\n[5] Fetching details and building records...")
    all_courses = {}
    all_profs = {}
    all_cp = []

    for idx, item in enumerate(items, 1):
        name = item.get("des_it", "")
        cds = item.get("cdsCod", "B385")
        cod = item.get("cod", "")
        af_id = item.get("af_percorso_id", "")
        anno_coorte = item.get("annoCoorte", str(ACADEMIC_YEAR))
        periodo = item.get("_periodo", "N/A")

        print(f"\n  [{idx}/{len(items)}] {cds} | {name[:55]}")

        # Fetch detail
        detail = fetch_detail(cds, cod, af_id, anno_coorte)
        fields = extract_fields(detail)

        has_detail = bool(fields["ssd"])
        if not has_detail:
            print(f"           (no detail API, using list data)")

        # Course record
        program_code = item.get("classeCod", "LM-92")
        tipo_ins = item.get("tipo_ins_des_it", "Obbligatorio")
        tipo = item.get("tipo_it", "")
        is_required = "obbligatorio" in tipo_ins.lower()

        desc_parts = [name, tipo, tipo_ins]
        if fields.get("obiettivi_formativi"):
            desc_parts.append(fields["obiettivi_formativi"][:200])

        course_record = {
            "id": course_id_from_item(item, idx),
            "name": name,
            "faculty": "Scuola di Studi Umanistici e della Formazione",
            "credits": item.get("crediti", 0),
            "description": ". ".join(d for d in desc_parts if d).strip(),
            "semester": normalize_semester(periodo),
            "is_required": is_required,
            "year_level": item.get("annoCorso", 1),
            "program_code": program_code,
            **fields,
        }

        # Use name as key (no duplicates now)
        all_courses[name] = course_record

        # Professors
        professors = []
        if detail:
            for d in detail.get("docenti", []):
                pname = d.get("des", "").title()
                if pname:
                    professors.append(pname)
        # Fallback to list docenti
        if not professors:
            for d in item.get("docenti", []):
                pname = d.get("des", "").title()
                if pname:
                    professors.append(pname)

        if not professors:
            print(f"           [WARN] No professor found")

        for pname in professors:
            dept = detail.get("dip_des_it", "") if detail else ""
            ssd = fields.get("ssd", "")
            all_profs[pname] = {
                "id": professor_id_from_name(pname),
                "name": pname,
                "department": dept,
                "faculty": "Scuola di Studi Umanistici e della Formazione",
                "bio": f"SSD: {ssd}. Professore." if ssd else "Professore.",
            }
            all_cp.append({
                "id": str(_uuid.uuid4()),
                "course_id": course_record["id"],
                "professor_id": professor_id_from_name(pname),
                "semester": normalize_semester(periodo),
            })

        time.sleep(0.3)

    # Step 6: Write to Supabase
    print(f"\n{'='*60}")
    print(f"Summary: {len(all_courses)} courses, {len(all_profs)} professors, {len(all_cp)} links")
    print(f"{'='*60}\n")

    print("[6] Writing to Supabase...")

    # Courses
    c_records = list(all_courses.values())
    code, resp = supa_upsert("courses", c_records)
    print(f"    courses upsert: code={code} -> {len(c_records)} rows")
    if code != 0:
        print(f"    response: {resp}")

    # Professors
    p_records = list(all_profs.values())
    code, resp = supa_upsert("professors", p_records)
    print(f"    professors upsert: code={code} -> {len(p_records)} rows")

    # course_professor
    cp_records = all_cp
    code, resp = supa_upsert("course_professor", cp_records)
    print(f"    course_professor upsert: code={code} -> {len(cp_records)} rows")

    print("\nDone!")


if __name__ == "__main__":
    main()
