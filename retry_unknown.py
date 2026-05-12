#!/usr/bin/env python3
"""Parallel retry for Unknown professors — 10 concurrent pages."""
import json, asyncio, re
from playwright.async_api import async_playwright

CONCURRENCY = 10

async def fetch_prof_detail(page, sem, prof):
    async with sem:
        url = f"https://unifi.coursecatalogue.cineca.it/docente-id/{prof['cineca_id']}/{prof['year']}"
        try:
            await page.goto(url, wait_until="networkidle", timeout=20000)
            await page.wait_for_timeout(2000)
            text = await page.inner_text("body")
        except Exception:
            return prof

        name_match = re.search(r"Docente\s+([A-Z][A-Z\s\'-]{4,60})", text)
        if name_match:
            name = name_match.group(1).strip()
            if name and "Unknown" not in name and len(name) > 5:
                prof["name"] = name

        courses = []
        for cm in re.finditer(r"\[(B\d+)\]\s+([^\n\r]{3,100})", text):
            cname = re.sub(r"\s+", " ", cm.group(2).strip())
            courses.append({"code": cm.group(1), "name": cname})
        prof["courses"] = courses
        return prof

async def main():
    with open("/tmp/unifi_professors_full.json") as f:
        data = json.load(f)

    unknown = [p for p in data if p["name"].startswith("Unknown")]
    named_before = sum(1 for p in data if not p["name"].startswith("Unknown"))
    print(f"Unknown: {len(unknown)}, Named before: {named_before}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-web-security", "--ignore-certificate-errors"]
        )
        sem = asyncio.Semaphore(CONCURRENCY)

        # Create CONCURRENCY pages
        pages = []
        for _ in range(CONCURRENCY):
            ctx = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
            )
            pages.append(await ctx.new_page())

        for i in range(0, len(unknown), CONCURRENCY):
            batch = unknown[i : i + CONCURRENCY]
            page_tasks = [
                fetch_prof_detail(pages[j % CONCURRENCY], sem, batch[j])
                for j in range(len(batch))
            ]
            results = await asyncio.gather(*page_tasks)
            for updated in results:
                for orig in data:
                    if orig["cineca_id"] == updated["cineca_id"]:
                        orig.update(updated)
                        break

            named_now = sum(1 for p in data if not p["name"].startswith("Unknown"))
            print(f"  {min(i+CONCURRENCY,len(unknown))}/{len(unknown)} | Named: {named_now}")

        for pg in pages:
            await pg.context.close()
        await browser.close()

    with open("/tmp/unifi_professors_full.json", "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    named_after = sum(1 for p in data if not p["name"].startswith("Unknown"))
    total = sum(len(p.get("courses", [])) for p in data if not p["name"].startswith("Unknown"))
    print(f"\nDone! {named_before} -> {named_after} (+{named_after-named_before})")
    print(f"Course assignments: {total}")

    from collections import Counter
    by_prog = Counter(p["program"] for p in data if not p["name"].startswith("Unknown"))
    for prog, cnt in sorted(by_prog.items()):
        print(f"  {prog}: {cnt}")

if __name__ == "__main__":
    asyncio.run(main())
