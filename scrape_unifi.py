#!/usr/bin/env python3
"""
UniFi Course Scraper - LM-92 (B385) 2025
Fetches courses from UNIFI course catalogue API and upserts to Supabase.
"""

import json
import re
import uuid
import time
import hashlib
import subprocess
from datetime import datetime

SUPABASE_URL = "https://bydicprzizmiywzykofr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5ZGljcHJ6aXptaXl3enlrb2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTM4NTIsImV4cCI6MjA5MzcyOTg1Mn0.lyNiSTaXRfRrV2Srk4JCEoie7fTQuPsd8Lbwzj1K58I"

API_BASE = "https://unifi.coursecatalogue.cineca.it"

# Degree program B385 (LM-92) for 2025
CORSO_COD = "4680"
CODICIONE = "0480107309300001"
ACADEMIC_YEAR = 2025


def curl_get(url: str) -> str:
    result = subprocess.run(
        ["curl", "-s", "-L", "--max-time", "15",
         "-H", "Accept: application/json",
         "-H", f"Referer: {API_BASE}/",
         url],
        capture_output=True, text=True, timeout=20
    )
    return result.stdout


def api_get(url: str, retries: int = 3) -> dict | list:
    for attempt in range(retries):
        try:
            raw = curl_get(url)
            if raw and raw.strip().startswith("{"):
                return json.loads(raw)
            if raw and raw.strip().startswith("["):
                return json.loads(raw)
            print(f"  [Retry {attempt+1}/{retries}] unexpected response for {url}")
        except json.JSONDecodeError as e:
            print(f"  [Retry {attempt+1}/{retries}] JSON parse error: {e}")
        except Exception as e:
            print(f"  [Retry {attempt+1}/{retries}] {url} -> {e}")
        time.sleep(1)
    return {}


def supabase_rest(method: str, path: str, body: list[dict] | None = None) -> dict:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    header_args = [
        "-H", f"apikey: {SUPABASE_KEY}",
        "-H", f"Authorization: Bearer {SUPABASE_KEY}",
        "-H", "Content-Type: application/json",
        "-H", "Prefer: resolution=merge-duplicates",
    ]
    cmd = ["curl", "-s", "-X", method, url] + header_args
    if body:
        cmd += ["-d", json.dumps(body)]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        try:
            return {"status": 200, "data": json.loads(result.stdout)}
        except json.JSONDecodeError:
            return {"status": 200, "raw": result.stdout[:200]}
    except Exception as e:
        return {"status": 0, "error": str(e)}


def strip_html(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def fetch_existing_course_ids() -> dict[str, str]:
    """Fetch all LM-92 course IDs from Supabase, keyed by name."""
    url = f"{SUPABASE_URL}/rest/v1/courses?program_code=eq.LM-92&select=id,name"
    raw = curl_get(url)
    result = {}
    try:
        data = json.loads(raw)
        for c in data:
            result[c["name"]] = c["id"]
    except:
        pass
    return result


def course_uuid_from_code(program_code: str, seq: int) -> str:
    suffix = f"{ACADEMIC_YEAR}{seq:03d}"
    h = hashlib.md5(suffix.encode()).hexdigest()[:12]
    return f"b00000{program_code[:3]}-{ACADEMIC_YEAR}-{h}"


def professor_uuid_from_name(name: str) -> str:
    h = hashlib.md5(name.encode()).hexdigest()[:12]
    return f"a0000001-0000-0000-0000-{h}"


def normalize_semester(periodo_it: str | None) -> str:
    if not periodo_it:
        return "N/A"
    p = periodo_it.lower()
    if "primo" in p or "s1" in p:
        return "I Sem"
    if "secondo" in p or "s2" in p:
        return "II Sem"
    if "annuale" in p or "annual" in p:
        return "Annuale"
    return "N/A"


def fetch_course_list() -> list[dict]:
    url = f"{API_BASE}/api/v1/corso-offerta/{CORSO_COD}?codicione={CODICIONE}"
    print(f"Fetching course list from {url}")
    data = api_get(url)
    if not data:
        print("  [ERROR] Could not fetch course list")
        return []
    courses = []

    year_data = data.get(str(ACADEMIC_YEAR), {})
    for period_key, period_val in year_data.items():
        periodo_label = period_val.get("periodo_didattico_it", "N/A")
        for att in period_val.get("attivita", []):
            if att.get("aa") != str(ACADEMIC_YEAR):
                continue
            item = dict(att)
            item["_periodo"] = periodo_label
            courses.append(item)

    # dedup
    seen = set()
    unique = []
    for c in courses:
        cod = c.get("cod", "")
        if cod not in seen:
            seen.add(cod)
            unique.append(c)
    print(f"  Found {len(unique)} unique courses for {ACADEMIC_YEAR}")
    return unique


def fetch_course_detail(cds_cod: str, insegnamento_id: str, af_percorso_id: str, anno_coorte: str) -> dict:
    corso_aa = anno_coorte
    url = (
        f"{API_BASE}/api/v1/insegnamento"
        f"?anno={ACADEMIC_YEAR}"
        f"&insegnamento={insegnamento_id}"
        f"&ordinamento_aa={ACADEMIC_YEAR}"
        f"&af_percorso={af_percorso_id}"
        f"&corso_cod={CORSO_COD}"
        f"&corso_aa={corso_aa}"
    )
    data = api_get(url)
    # B252 courses from older cohorts may not have 2025 details; try with 2024
    if not data and cds_cod == "B252":
        url2 = (
            f"{API_BASE}/api/v1/insegnamento"
            f"?anno={ACADEMIC_YEAR}"
            f"&insegnamento={insegnamento_id}"
            f"&ordinamento_aa={ACADEMIC_YEAR}"
            f"&af_percorso={af_percorso_id}"
            f"&corso_cod={CORSO_COD}"
            f"&corso_aa=2025"
        )
        data = api_get(url2)
    return data


def extract_professors(detail: dict) -> list[dict]:
    result = []
    for d in detail.get("docenti", []):
        name = d.get("des", "").title()
        if name:
            result.append({
                "name": name,
                "matricola": d.get("matricola", ""),
                "cod": d.get("cod", ""),
            })
    return result


def extract_detail_fields(detail: dict) -> dict:
    """Extract all detail fields from course detail JSON."""
    result = {
        "lingua": "",
        "durata": "",
        "frequenza": "",
        "ssd": "",
        "obiettivi_formativi": "",
        "contenuti": "",
        "prerequisiti": "",
        "metodi_didattici": "",
        "verifica_apprendimento": "",
        "programma_esteso": "",
        "testi": "",
        "agenda_2030": "",
        "altro": "",
    }
    if not detail:
        return result

    result["lingua"] = detail.get("lingua_des_it", "")
    result["frequenza"] = detail.get("frequenza_it", "")
    result["ssd"] = detail.get("ssd", "")

    durata_obj = detail.get("durata", {})
    if durata_obj:
        totale = durata_obj.get("totale", "")
        tipo_parts = []
        for t in durata_obj.get("tipo", []):
            label = t.get("tipo_durata_des_it", "")
            val = t.get("valore", "")
            if label and val:
                tipo_parts.append(f"{val} ore ({label})")
            elif val:
                tipo_parts.append(f"{val} ore")
        result["durata"] = f"{totale} ore" if totale else (", ".join(tipo_parts) if tipo_parts else "")

    for item in detail.get("testiTotali", []):
        if item.get("etichetta_it") == "Lingua insegnamento":
            result["lingua"] = strip_html(item.get("altri_testi_it", ""))
        v = item.get("obiettivi_formativi_it", "")
        if v:
            result["obiettivi_formativi"] = strip_html(v)
        v = item.get("contenuti_it", "")
        if v:
            result["contenuti"] = strip_html(v)
        v = item.get("prerequisiti_it", "")
        if v:
            result["prerequisiti"] = strip_html(v)
        v = item.get("metodi_didattici_est_it", "")
        if v:
            result["metodi_didattici"] = strip_html(v)
        v = item.get("verifica_apprendimento_it", "")
        if v:
            result["verifica_apprendimento"] = strip_html(v)
        v = item.get("programmazione_estesa_it", "")
        if v:
            result["programma_esteso"] = strip_html(v)
        v = item.get("testi_it", "")
        if v:
            result["testi"] = strip_html(v)
        v = item.get("obiettivi_svil_sos_des_it", "")
        if v:
            result["agenda_2030"] = strip_html(v)
        v = item.get("altro_it", "")
        if v:
            result["altro"] = strip_html(v)

    return result


def upsert_records(table: str, records: list[dict]) -> dict:
    if not records:
        return {"status": 0, "skipped": True}
    result = supabase_rest("POST", table, records)
    if result.get("status") not in (200, 201):
        print(f"  [WARN] {table} upsert issue: {str(result)[:200]}")
    return result


def main():
    print(f"\n{'='*60}")
    print(f"UniFi Course Scraper - LM-92 (B385) {ACADEMIC_YEAR}")
    print(f"{'='*60}\n")

    courses = fetch_course_list()
    if not courses:
        return

    existing_ids = fetch_existing_course_ids()
    print(f"  Found {len(existing_ids)} existing LM-92 courses in DB\n")

    all_professors = {}
    all_courses = {}
    all_cp = []

    for idx, item in enumerate(courses, 1):
        cod = item.get("cod", "")
        name = item.get("des_it", "Unknown")
        af_id = item.get("af_percorso_id", "")
        cds_cod = item.get("cdsCod", "B385")
        anno_coorte = item.get("annoCoorte", str(ACADEMIC_YEAR))

        print(f"[{idx}/{len(courses)}] {name[:60]}")

        detail = fetch_course_detail(cds_cod, cod, af_id, anno_coorte)

        # Extract detail fields
        detail_fields = extract_detail_fields(detail) if detail else {}

        # Use existing DB ID if available, otherwise generate new one
        program_code = item.get("classeCod", "LM-92")
        course_id = existing_ids.get(name) or course_uuid_from_code(program_code, idx)
        is_new = name not in existing_ids
        periodo = (detail.get("periodo_didattico_it") or item.get("_periodo") or "") if detail else item.get("_periodo", "")
        tipo_ins = (detail.get("tipo_ins_des_it", "Obbligatorio") or item.get("tipo_ins_des_it", "Obbligatorio")) if detail else item.get("tipo_ins_des_it", "Obbligatorio")
        tipo = (detail.get("tipo_it", "") or item.get("tipo_it", "")) if detail else item.get("tipo_it", "")
        ssd = (detail.get("ssd", "") or detail_fields.get("ssd", "") or "") if detail else detail_fields.get("ssd", "")
        is_required = "obbligatorio" in tipo_ins.lower()

        desc_parts = [item.get("des_it", "")]
        if tipo:
            desc_parts.append(tipo)
        desc_parts.append(tipo_ins)
        if detail_fields.get("obiettivi_formativi"):
            desc_parts.append(detail_fields["obiettivi_formativi"][:200])

        course_record = {
            "id": course_id,
            "name": item.get("des_it", ""),
            "faculty": "Scuola di Studi Umanistici e della Formazione",
            "credits": item.get("crediti", 0),
            "description": ". ".join(d for d in desc_parts if d).strip(),
            "semester": normalize_semester(periodo),
            "is_required": is_required,
            "year_level": item.get("annoCorso", 1),
            "program_code": program_code,
            # Detail fields
            "lingua": detail_fields.get("lingua", ""),
            "durata": detail_fields.get("durata", ""),
            "frequenza": detail_fields.get("frequenza", ""),
            "ssd": ssd,
            "obiettivi_formativi": detail_fields.get("obiettivi_formativi", ""),
            "contenuti": detail_fields.get("contenuti", ""),
            "prerequisiti": detail_fields.get("prerequisiti", ""),
            "metodi_didattici": detail_fields.get("metodi_didattici", ""),
            "verifica_apprendimento": detail_fields.get("verifica_apprendimento", ""),
            "programma_esteso": detail_fields.get("programma_esteso", ""),
            "testi": detail_fields.get("testi", ""),
            "agenda_2030": detail_fields.get("agenda_2030", ""),
            "altro": detail_fields.get("altro", ""),
        }

        all_courses[name] = course_record

        # Extract professors from detail or list
        professors = extract_professors(detail) if detail else []
        # Fallback: try to get docenti from the list item
        if not professors:
            for d in item.get("docenti", []):
                name_d = d.get("des", "").title()
                if name_d:
                    professors.append({"name": name_d, "matricola": d.get("matricola", ""), "cod": d.get("cod", "")})

        if not professors:
            print(f"  [WARN] No professors found for {name}")

        for p in professors:
            dept = (detail.get("dip_des_it", "") or item.get("dip_des_it", "")) if detail else item.get("dip_des_it", "")
            all_professors[p["name"]] = {
                "id": professor_uuid_from_name(p["name"]),
                "name": p["name"],
                "department": dept,
                "faculty": "Scuola di Studi Umanistici e della Formazione",
                "bio": f"SSD: {ssd}. Professore." if ssd else "Professore.",
            }
            all_cp.append({
                "id": str(uuid.uuid4()),
                "course_id": course_id,
                "professor_id": professor_uuid_from_name(p["name"]),
                "semester": normalize_semester(periodo),
            })

        if not detail:
            print(f"  [WARN] No detail (used list data only)")

        time.sleep(0.3)

    print(f"\n{'='*60}")
    print(f"Summary: {len(all_courses)} courses, {len(all_professors)} professors, {len(all_cp)} links\n")

    print("Uploading to Supabase...\n")

    r = upsert_records("courses", list(all_courses.values()))
    print(f"  courses upsert: {r.get('status')} - {len(all_courses)} rows")

    r = upsert_records("professors", list(all_professors.values()))
    print(f"  professors upsert: {r.get('status')} - {len(all_professors)} rows")

    r = upsert_records("course_professor", all_cp)
    print(f"  course_professor upsert: {r.get('status')} - {len(all_cp)} rows")

    print(f"\nDone!")


if __name__ == "__main__":
    main()
