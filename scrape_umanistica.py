#!/usr/bin/env python3
"""
Scrape all Scuola di Studi Umanistici e della Formazione degree programmes
from UNIFI official pages via web search results.

Programs found at:
https://www.st-umaform.unifi.it/index.php?func=viewpage&module=CMpro&pageid=49
"""

import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import json
import re
import time
import sys
import os

# ── Programme catalogue URLs ──────────────────────────────────────────────────
PROGRAMMES = [
    # Area Studi Umanistici
    ("LM-2",  "Archeologia",                 "B347", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4672"),
    ("LM-15", "Filologia, letteratura e storia dell'antichità", "B334", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4671"),
    ("LM-14", "Filologia moderna",           "B333", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4670"),
    ("LM-80", "Geography, spatial management and heritage for international cooperation", "B427", "https://unifi.coursecatalogue.cineca.it/corsi/2025/5474"),
    ("LM-64", "Intermediazione culturale e religiosa", "B342", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4676"),
    ("LM-36", "Lingue e civiltà dell'Asia e dell'Africa", "B363", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4673"),
    ("LM-37", "Lingue e letterature europee e americane", "B413", "https://unifi.coursecatalogue.cineca.it/corsi/2025/5472"),
    ("LM-78", "Logica, Filosofia delle Scienze e Metodi della Ricerca", "B391", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4864"),
    ("LM-5",  "Scienze archivistiche e biblioteconomiche", "B349", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4674"),
    ("LM-65", "Scienze dello spettacolo",    "B420", "https://unifi.coursecatalogue.cineca.it/corsi/2025/5473"),
    ("LM-78", "Scienze filosofiche",         "B378", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4677"),
    ("LM-84", "Scienze storiche",            "B380", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4678"),
    ("LM-89", "Storia dell'arte",            "B384", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4679"),
    ("LM-92", "Pratiche, linguaggi e culture della comunicazione", "B385", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4680"),
    # Area della Formazione
    ("LM-50", "Dirigenza scolastica e pedagogia per l'inclusione", "B367", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4675"),
    ("LM-57/LM-85", "Scienze pedagogiche e management della formazione per lo sviluppo sostenibile", "B389", "https://unifi.coursecatalogue.cineca.it/corsi/2025/4669"),
]


def fetch(url: str, timeout: int = 15) -> BeautifulSoup | None:
    """Fetch a URL and return a BeautifulSoup object."""
    print(f"  Fetching: {url}")
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode('utf-8', errors='replace')
            return BeautifulSoup(html, 'html.parser')
    except Exception as e:
        print(f"  ERROR: {e}", file=sys.stderr)
        return None


def scrape_program_page(soup: BeautifulSoup) -> list[dict]:
    """Parse a Cineca programme page for courses and professors."""
    courses = []

    # Try to find course tables
    tables = soup.find_all('table')
    for table in tables:
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) < 2:
                continue
            # Extract text from all cells
            cell_texts = [c.get_text(strip=True) for c in cells]
            print(f"    Row: {cell_texts}")

    # Try to find links to individual courses (they contain "ad=" in URL)
    course_links = soup.find_all('a', href=re.compile(r'ad='))
    print(f"  Found {len(course_links)} course links")

    for link in course_links:
        href = link.get('href', '')
        text = link.get_text(strip=True)
        if text and len(text) > 3:
            courses.append({
                'name': text,
                'url': href,
            })

    return courses


def search_courses(program_code: str, program_name: str) -> list[dict]:
    """Use DuckDuckGo to search for courses and professors."""
    import urllib.parse
    query = f"UNIFI {program_code} piano di studi 2025 obbligatori opzionali professori"
    url = f"https://duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    print(f"\n  Searching: {query[:80]}...")
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='replace')
            soup = BeautifulSoup(html, 'html.parser')
            results = soup.find_all('a', class_='result__a')
            print(f"  Found {len(results)} search results")
            for r in results[:5]:
                print(f"    - {r.get_text(strip=True)}")
    except Exception as e:
        print(f"  Search error: {e}")


def main():
    print("=" * 70)
    print("UNIFI Scuola di Studi Umanistici e della Formazione — Course Scraper")
    print("=" * 70)

    for code, name, cineca_code, url in PROGRAMMES:
        print(f"\n{'─' * 60}")
        print(f"Programme: {code} — {name} (Cineca: {cineca_code})")
        print(f"URL: {url}")

        soup = fetch(url)
        if not soup:
            print(f"  → Could not fetch page, skipping")
            continue

        # Save raw HTML for inspection
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', code)[:20]
        html_path = f"/tmp/unifi_{safe_name}.html"
        with open(html_path, 'w') as f:
            f.write(str(soup.prettify()))
        print(f"  → Saved HTML to {html_path}")

        courses = scrape_program_page(soup)
        print(f"  → Found {len(courses)} course entries")

        # Also try searching
        search_courses(code, name)

        time.sleep(1)

    print(f"\n{'=' * 70}")
    print("Done. Check /tmp/unifi_*.html for raw HTML.")
    print("Run again with --scrape-links to follow course links.")


if __name__ == '__main__':
    main()
