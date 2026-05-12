#!/usr/bin/env python3
"""
Scrape LM-92 (Pratiche, linguaggi e culture della comunicazione) courses
from the official UNIFI course catalogue.

Target: https://unifi.coursecatalogue.cineca.it/corsi/2025/4680/...
"""

import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import json
import re
import sys

def fetch(url: str) -> BeautifulSoup:
    """Fetch a URL and return a BeautifulSoup object."""
    print(f"Fetching: {url}")
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='replace')
            return BeautifulSoup(html, 'html.parser')
    except Exception as e:
        print(f"  ERROR fetching {url}: {e}", file=sys.stderr)
        return None

def parse_courses_from_page(soup: BeautifulSoup) -> list[dict]:
    """Parse course blocks from a course catalogue page."""
    courses = []

    # The Cineca catalogue uses specific table structures.
    # Try multiple selectors to find course rows.
    rows = soup.select('table tbody tr, table tr, .corso-row, .insegnamento-row, .pds-row')

    for row in rows:
        # Try extracting course name from links
        links = row.select('a[href*="insegnament"], a[href*="ad="], .nome-corso, .insegnamento-nome, td:nth-child(2), td:nth-child(3)')
        for link in links:
            text = link.get_text(strip=True)
            if text and len(text) > 3:
                print(f"  Found text: {text}")

    return courses

def scrape_program_courses(program_code: str, year: int = 2025):
    """
    Scrape all courses for a given program code.
    Uses the Cineca course catalogue structure.
    """
    all_courses = []

    # Main program catalogue URL
    # The URL pattern from the user's example:
    # https://unifi.coursecatalogue.cineca.it/corsi/2025/4680/insegnamenti/2025/58140_B385-25-25_113457_779277/2025/58140?annoOrdinamento=2025&coorte=2025
    #
    # General pattern: /corsi/{YEAR}/{corso_id}/insegnamenti/{YEAR}/{ad_code}/{YEAR}/{ad_code}?annoOrdinamento={YEAR}&coorte={YEAR}
    #
    # The LM-92 (Pratiche) URL from the user:
    base_url = f"https://unifi.coursecatalogue.cineca.it/corsi/{year}/4680"

    print(f"\n=== Scraping LM-92 (Pratiche) - Year {year} ===\n")

    # Try the main program page first
    main_url = f"https://unifi.coursecatalogue.cineca.it/af/{year}?corso=B385&annoOrdinamento={year}&pds=GEN&coorte={year}&ad=B032223"

    soup = fetch(main_url)
    if soup:
        print(f"Page title: {soup.title.string if soup.title else 'N/A'}")

        # Print the page structure to understand it
        # Look for the main content area
        main_content = soup.select('#main-content, .main-content, main, .content, #content')
        if main_content:
            print(f"Main content found, children: {len(main_content[0].find_children())}")

        # Look for tables
        tables = soup.select('table')
        print(f"Tables found: {len(tables)}")

        # Look for links to individual courses
        course_links = soup.select('a[href*="insegnament"], a[href*="/ad/"]')
        print(f"Course links found: {len(course_links)}")
        for link in course_links[:10]:
            print(f"  - {link.get_text(strip=True)}: {link.get('href', '')}")

        # Try to find year sections
        year_sections = soup.select('[class*="anno"], [class*="year"], h2, h3')
        for sec in year_sections[:20]:
            text = sec.get_text(strip=True)
            if text and len(text) > 3:
                print(f"  Section: {text}")

    return all_courses

def scrape_specific_course(url: str) -> dict:
    """Scrape a specific course page to get professor info."""
    soup = fetch(url)
    if not soup:
        return {}

    course = {}

    # Extract course name
    title = soup.select('h1, .page-title, .corso-titolo')
    if title:
        course['name'] = title[0].get_text(strip=True)

    # Look for professor info
    # Patterns: "Docente:", "Professore:", links with "docente" in href
    professor_links = soup.select('a[href*="docente"], .docente, [class*="professor"]')
    for p in professor_links:
        text = p.get_text(strip=True)
        if text and len(text) > 3:
            course['professor'] = text
            break

    # Also check the URL for professor info
    # From user example: professor is CANTELLI CHIARA

    return course

def main():
    print("=" * 60)
    print("UNIFI LM-92 Course Scraper")
    print("=" * 60)

    year = 2025

    # The program URL
    program_url = f"https://unifi.coursecatalogue.cineca.it/corsi/{year}/4680/insegnamenti/{year}/58140_B385-25-25_113457_779277/{year}/58140?annoOrdinamento={year}&coorte={year}"

    print(f"\nTarget URL: {program_url}\n")

    soup = fetch(program_url)
    if not soup:
        print("Failed to fetch the page.")
        return

    print(f"\nPage title: {soup.title.string if soup.title else 'N/A'}")

    # Let's examine the page structure
    # Print all text to understand the structure
    # Look for course-related data
    courses = []

    # Method 1: Look for tables
    tables = soup.find_all('table')
    print(f"\nFound {len(tables)} tables")

    for i, table in enumerate(tables):
        print(f"\n--- Table {i+1} ---")
        rows = table.find_all('tr')
        for row in rows[:5]:
            cells = row.find_all(['td', 'th'])
            row_text = ' | '.join(c.get_text(strip=True) for c in cells)
            if row_text.strip():
                print(f"  {row_text}")

    # Method 2: Look for specific course data patterns
    print("\n\n--- Searching for course data ---")

    # Look for links that might be course links
    all_links = soup.find_all('a')
    course_candidate_links = []
    for link in all_links:
        href = link.get('href', '')
        text = link.get_text(strip=True)
        if text and ('insegnamento' in href.lower() or 'corso' in href.lower() or
                     'B385' in href or 'LM-92' in text.upper()):
            course_candidate_links.append({'text': text, 'href': href})

    print(f"\nFound {len(course_candidate_links)} course-related links:")
    for item in course_candidate_links[:20]:
        print(f"  {item['text']}: {item['href']}")

    # Method 3: Look for structured data in script tags
    scripts = soup.find_all('script', type='application/ld+json')
    print(f"\nFound {len(scripts)} JSON-LD scripts")

    for script in scripts:
        try:
            data = json.loads(script.string)
            print(f"  JSON-LD type: {data.get('@type', 'N/A')}")
        except:
            pass

    # Save raw HTML for debugging
    with open('/tmp/unifi_lm92_raw.html', 'w') as f:
        f.write(str(soup.prettify()))
    print(f"\nRaw HTML saved to /tmp/unifi_lm92_raw.html")

    # Now try the program page with B385 code
    program_page_url = f"https://unifi.coursecatalogue.cineca.it/af/{year}?corso=B385&annoOrdinamento={year}&pds=GEN&coorte={year}"
    print(f"\n\nFetching program page: {program_page_url}")
    soup2 = fetch(program_page_url)
    if soup2:
        with open('/tmp/unifi_lm92_program.html', 'w') as f:
            f.write(str(soup2.prettify()))
        print("Program page saved")

        # Find all course links in the program page
        all_links2 = soup2.find_all('a')
        for link in all_links2:
            href = link.get('href', '')
            text = link.get_text(strip=True)
            if text and 'B385' in href:
                print(f"  B385 link: {text} -> {href}")

    print("\n\nDone. Check the saved HTML files for detailed inspection.")

if __name__ == '__main__':
    main()
