#!/usr/bin/env python3
"""
UNIFI Professor Scraper — Final Version
Steps:
  1. Visit /lista-docenti page for each programme → get professor Cineca IDs
  2. Visit /docente-id/{id}/{year} page → extract name, courses, SSD, email
  3. Save all results
"""

import asyncio
import re
import json
import urllib.parse
from collections import defaultdict
from playwright.async_api import async_playwright

PROGRAMMES = [
    ("LM-2",  "https://unifi.coursecatalogue.cineca.it/corsi/2025/4672"),
    ("LM-15", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4671"),
    ("LM-14", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4670"),
    ("LM-36", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4673"),
    ("LM-64", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4676"),
    ("LM-65", "https://unifi.coursecatalogue.cineca.it/corsi/2025/5473"),
    ("LM-78", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4677"),
    ("LM-78", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4864"),
    ("LM-5",  "https://unifi.coursecatalogue.cineca.it/corsi/2025/4674"),
    ("LM-84", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4678"),
    ("LM-89", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4679"),
    ("LM-92", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4680"),
    ("LM-50", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4675"),
    ("LM-57", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4669"),
]
SEDE = 1183  # Florence


def slugify(name: str) -> str:
    """Create a safe variable name from professor name."""
    cleaned = name.lower().replace("'", "").replace(".", "").replace("-", "_")
    words = cleaned.split()
    return "p_" + "_".join(words[:4])


async def scrape_program_professors(page, program_code: str, base_url: str) -> list[dict]:
    """Visit a programme's docenti list page, return professor IDs."""
    docenti_url = f"{base_url}/lista-docenti?sede={SEDE}"
    try:
        await page.goto(docenti_url, wait_until="networkidle", timeout=25000)
        await page.wait_for_timeout(2500)
    except Exception as e:
        print(f"  ERROR navigating to {docenti_url}: {e}")
        return []

    html = await page.content()
    pattern = re.compile(r'docente-id/([^/\s]+)/(\d{4})')
    matches = pattern.findall(html)
    # Deduplicate by (id, year)
    seen = set()
    results = []
    for prof_id, year in matches:
        key = (prof_id, year)
        if key not in seen:
            seen.add(key)
            results.append({"cineca_id": prof_id, "year": year, "program": program_code})
    return results


async def scrape_professor_detail(page, entry: dict) -> dict:
    """Visit professor detail page, extract name, courses, SSD, email."""
    prof_id = entry["cineca_id"]
    year = entry["year"]
    url = f"https://unifi.coursecatalogue.cineca.it/docente-id/{prof_id}/{year}"

    try:
        await page.goto(url, wait_until="networkidle", timeout=20000)
        await page.wait_for_timeout(1500)
        text = await page.inner_text("body")
    except Exception as e:
        entry["name"] = f"Unknown ({prof_id[:8]})"
        entry["courses"] = []
        entry["ssd"] = None
        entry["email"] = None
        entry["department"] = None
        return entry

    # Extract name
    name_match = re.search(r'Docente\s+([A-Z\'\s]+)', text)
    name = name_match.group(1).strip() if name_match else f"Unknown ({prof_id[:8]})"
    entry["name"] = name

    # Extract SSD
    ssd_match = re.search(r'SSD[:\s]*([A-Z0-9/\-]+)', text)
    entry["ssd"] = ssd_match.group(1).strip() if ssd_match else None

    # Extract email
    email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
    entry["email"] = email_match.group(0).lower() if email_match else None

    # Extract department
    dept_match = re.search(r'Unità organizzativa[:\s]*(\d+\s*-\s*[^\n\r]+)', text)
    if dept_match:
        dept = re.sub(r'\s+', ' ', dept_match.group(1).strip())
        entry["department"] = dept

    # Extract courses: [B0XXXXX] COURSE NAME
    course_entries = []
    course_pattern = re.compile(r'\[(B\d+)\]\s+([^\n\r]{3,100})')
    for cm in course_pattern.finditer(text):
        code = cm.group(1)
        cname = re.sub(r'\s+', ' ', cm.group(2).strip())
        course_entries.append({"code": code, "name": cname})
    entry["courses"] = course_entries

    return entry


async def main():
    print("=" * 60)
    print("UNIFI Professor Scraper — Final")
    print("=" * 60)

    # Step 1: Collect all professor IDs
    print("\n[Step 1] Getting professor IDs from docenti list pages...")
    all_prof_ids = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-web-security", "--ignore-certificate-errors"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        )
        page = await context.new_page()

        for program_code, base_url in PROGRAMMES:
            entries = await scrape_program_professors(page, program_code, base_url)
            all_prof_ids.extend(entries)
            print(f"  {program_code}: {len(entries)} professors")
            await asyncio.sleep(0.5)

        await browser.close()

    # Deduplicate by (cineca_id, year)
    seen = set()
    unique_profs = []
    for entry in all_prof_ids:
        key = (entry["cineca_id"], entry["year"])
        if key not in seen:
            seen.add(key)
            unique_profs.append(entry)

    print(f"\n  Total unique professors: {len(unique_profs)}")

    # Step 2: Get details for each professor (in batches)
    print("\n[Step 2] Scraping professor detail pages...")
    BATCH = 5
    total_batches = (len(unique_profs) + BATCH - 1) // BATCH

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-web-security", "--ignore-certificate-errors"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        )
        page = await context.new_page()

        for batch_idx in range(total_batches):
            batch_start = batch_idx * BATCH
            batch_end = min(batch_start + BATCH, len(unique_profs))
            batch = unique_profs[batch_start:batch_end]
            batch_num = batch_idx + 1

            print(f"\n  Batch {batch_num}/{total_batches}: ", end="", flush=True)
            tasks = [scrape_professor_detail(page, entry) for entry in batch]
            results = await asyncio.gather(*tasks)

            for prof in results:
                n = len(prof.get("courses", []))
                s = (prof.get("ssd") or "—")[:8]
                print(f"[{prof['name'][:18]:<18} {n}c SSD:{s}]", end=" ", flush=True)

            print(f"✓")
            await asyncio.sleep(1.0)

        await browser.close()

    # Step 3: Save JSON
    json_path = "/tmp/unifi_professors_full.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(unique_profs, f, ensure_ascii=False, indent=2)
    print(f"\n[Step 3] Saved JSON: {json_path}")

    # Step 4: Generate TypeScript professors array
    print("\n[Step 4] Generating TypeScript...")
    ts_lines = []
    ts_lines.append("// ===== Professors (from UNIFI Cineca) =====")
    for prof in unique_profs:
        pid = slugify(prof["name"])
        name_parts = prof["name"].split()
        # "BALDI BENEDETTA" -> "Prof. Benedetta Baldi"
        if len(name_parts) >= 2:
            formatted = f"Prof. {' '.join(name_parts[1:])} {' '.join(name_parts[:1])}"
        else:
            formatted = f"Prof. {prof['name']}"

        dept = prof.get("department") or "Dipartimento di Lettere e Filosofia"
        dept_short = dept.split(" - ")[-1] if " - " in dept else dept
        ssd_note = f"SSD: {prof.get('ssd', 'N/A')}." if prof.get("ssd") else ""
        bio = f"{ssd_note} Professore in {', '.join(prof['programs'])}."
        if prof.get("email"):
            bio += f" Email: {prof['email']}"

        ts_lines.append(f"  {{")
        ts_lines.append(f"    id: '{pid}',")
        ts_lines.append(f"    name: \"{formatted}\",")
        ts_lines.append(f"    department: \"{dept_short}\",")
        ts_lines.append(f"    faculty: \"Scuola di Studi Umanistici e della Formazione\",")
        ts_lines.append(f"    bio: \"{bio}\",")
        ts_lines.append(f"    email: \"{prof.get('email', '')}\",")
        ts_lines.append(f"    office: \"\",")
        ts_lines.append(f"    rating: 0,")
        ts_lines.append(f"    programs: {json.dumps(prof['programs'])},")
        ts_lines.append(f"    courseCount: {len(prof.get('courses', []))},")
        ts_lines.append(f"  }},")

    ts_path = "/tmp/unifi_professors.ts"
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write("\n".join(ts_lines))
    print(f"  TypeScript: {ts_path} ({len(ts_lines)} lines)")

    # Step 5: Generate course → professor mapping
    print("\n[Step 5] Course → Professor mapping...")
    course_map: dict[str, list[str]] = defaultdict(list)
    for prof in unique_profs:
        for course in prof.get("courses", []):
            key = f"[{course['code']}] {course['name']}"
            course_map[key].append(prof["name"])

    map_lines = [f"  // {k}: {', '.join(v)}" for k, v in sorted(course_map.items())]
    map_path = "/tmp/unifi_course_professor_map.ts"
    with open(map_path, "w", encoding="utf-8") as f:
        f.write("\n".join(map_lines))
    print(f"  {len(map_lines)} course-professor mappings: {map_path}")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    total_profs = len(unique_profs)
    with_courses = sum(1 for p in unique_profs if p.get("courses"))
    with_ssd = sum(1 for p in unique_profs if p.get("ssd"))
    with_email = sum(1 for p in unique_profs if p.get("email"))
    total_assignments = sum(len(p.get("courses", [])) for p in unique_profs)

    print(f"  Total professors: {total_profs}")
    print(f"  With courses: {with_courses}")
    print(f"  With SSD: {with_ssd}")
    print(f"  With email: {with_email}")
    print(f"  Total course assignments: {total_assignments}")

    from collections import Counter
    by_prog = Counter()
    for p in unique_profs:
        for prog in p.get("programs", []):
            by_prog[prog] += 1
    for prog, cnt in sorted(by_prog.items()):
        print(f"    {prog}: {cnt} professors")


if __name__ == "__main__":
    asyncio.run(main())
