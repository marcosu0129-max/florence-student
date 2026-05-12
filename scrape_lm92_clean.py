#!/usr/bin/env python3
"""
Clean rebuild for Pratiche LM-92 (corso_cod=4680).
Deletes ALL courses with program_code matching 'LM-92*' or name matching known Pratiche courses,
then re-scrapes and inserts with correct data.
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


def supa_delete_by_id(table, ids):
    for cid in ids:
        subprocess.run(
            ["curl", "-s", "-X", "DELETE", f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{cid}",
             "-H", f"apikey: {SUPABASE_KEY}", "-H", f"Authorization: Bearer {SUPABASE_KEY}"],
            capture_output=True, text=True, timeout=10
        )


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
    return 0, r.stdout[:100]


def strip_html(text):
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", text).strip()


def course_id_from_name_seq(name, seq):
    seed = f"LM92_{ACADEMIC_YEAR}_{seq}_{name[:20]}"
    h = hashlib.md5(seed.encode()).hexdigest()
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
    url = f"{API_BASE}/api/v1/corso-offerta/{CORSO_COD}?codicione={CODICIONE}"
    raw = curl(url, {"Referer": f"{API_BASE}/"})
    data = json.loads(raw)
    items = []
    for pv in data.get(str(ACADEMIC_YEAR), {}).values():
        for att in pv.get("attivita", []):
            if att.get("aa") == str(ACADEMIC_YEAR):
                att["_periodo"] = pv.get("periodo_didattico_it", "N/A")
                items.append(att)
    seen, unique = set(), []
    for c in items:
        key = (c.get("cdsCod"), c.get("cod"))
        if key not in seen:
            seen.add(key)
            unique.append(c)
    b385 = sorted([c for c in unique if c.get("cdsCod") == "B385"], key=lambda x: x.get("cod", ""))
    b252 = sorted([c for c in unique if c.get("cdsCod") == "B252"], key=lambda x: x.get("cod", ""))
    return b385 + b252


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


def main():
    print("=" * 60)
    print("LM-92 Clean Rebuild - Pratiche, Linguaggi e Culture")
    print("=" * 60)

    # Step 1: Find all courses to delete (program_code like LM-92%)
    print("\n[1] Finding LM-92 courses to delete...")
    all_to_delete = []
    for pc in ["LM-92", "LM-92 R"]:
        courses = supa_get(f"courses?program_code=eq.{pc}&select=id,name")
        for c in courses:
            all_to_delete.append(c["id"])
            print(f"    will delete: {c['name'][:50]}")

    # Also delete the 2 partial ones from before
    partial = supa_get("courses?name=ilike.*ESTETICA*&select=id")
    for c in partial:
        if c["id"] not in all_to_delete:
            all_to_delete.append(c["id"])
            print(f"    + partial: {c['id']}")
    partial2 = supa_get("courses?name=ilike.*FILOSOFIA*EDUCAZIONE*&select=id")
    for c in partial2:
        if c["id"] not in all_to_delete:
            all_to_delete.append(c["id"])
            print(f"    + partial: {c['id']}")

    print(f"  Total to delete: {len(all_to_delete)}")

    # Step 2: Delete course_professor links first
    print("\n[2] Deleting course_professor links...")
    supa_delete_by_id("course_professor", all_to_delete)

    # Step 3: Delete courses
    print("\n[3] Deleting courses...")
    supa_delete_by_id("courses", all_to_delete)
    print(f"  Deleted {len(all_to_delete)} courses")

    # Step 4: Fetch fresh course list
    print("\n[4] Fetching course list from UniFi...")
    items = fetch_course_list()
    print(f"  Total unique courses: {len(items)}")

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

        detail = fetch_detail(cds, cod, af_id, anno_coorte)
        fields = extract_fields(detail)

        has_detail = bool(fields["ssd"])
        if not has_detail:
            print(f"         (no detail API)")
        else:
            print(f"         ssd={fields['ssd']} lang={fields['lingua']}")

        # NORMALIZE program_code to LM-92 for ALL courses
        program_code = "LM-92"
        is_required = True

        desc_parts = [name]
        if fields.get("obiettivi_formativi"):
            desc_parts.append(fields["obiettivi_formativi"][:200])

        course_record = {
            "id": course_id_from_name_seq(name, idx),
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

        all_courses[name] = course_record

        # Professors
        professors = []
        if detail:
            for d in detail.get("docenti", []):
                pname = d.get("des", "").title()
                if pname:
                    professors.append(pname)
        if not professors:
            for d in item.get("docenti", []):
                pname = d.get("des", "").title()
                if pname:
                    professors.append(pname)

        if not professors:
            print(f"         [WARN] No professor")

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

    print(f"\n{'='*60}")
    print(f"Summary: {len(all_courses)} courses, {len(all_profs)} professors, {len(all_cp)} links")
    print(f"{'='*60}\n")

    # Step 6: Write to Supabase
    print("[6] Writing to Supabase...")

    c_records = list(all_courses.values())
    code, resp = supa_upsert("courses", c_records)
    print(f"  courses upsert: code={code} -> {len(c_records)} rows ({resp})")

    p_records = list(all_profs.values())
    code, resp = supa_upsert("professors", p_records)
    print(f"  professors upsert: code={code} -> {len(p_records)} rows")

    cp_records = all_cp
    code, resp = supa_upsert("course_professor", cp_records)
    print(f"  course_professor upsert: code={code} -> {len(cp_records)} rows")

    # Step 7: Verify
    print("\n[7] Verifying...")
    courses = supa_get("courses?program_code=eq.LM-92&select=id,name,credits,year_level,ssd&order=year_level,name")
    y1 = [c for c in courses if c.get("year_level") == 1]
    y2 = [c for c in courses if c.get("year_level") == 2]
    print(f"  DB LM-92 courses: {len(courses)} | Year1={len(y1)} | Year2={len(y2)}")

    print("\nDone!")


if __name__ == "__main__":
    main()
