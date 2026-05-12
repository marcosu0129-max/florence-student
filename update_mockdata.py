#!/usr/bin/env python3
"""Safe line-level professor link update — no entry boundary parsing."""
import re, json

def clean_name(raw):
    first_line = raw.strip().split("\n")[0].strip()
    parts = first_line.split()
    if len(parts) >= 2 and parts[0] == parts[-1]:
        parts = parts[:-1]
    return " ".join(parts)

def format_prof(raw):
    parts = raw.split()
    if len(parts) == 2:
        return f"Prof. {parts[1].title()} {parts[0].title()}"
    elif len(parts) >= 3:
        surname = parts[-1].title()
        given = " ".join(p.title() for p in parts[:-1])
        return f"Prof. {given} {surname}"
    else:
        return f"Prof. {raw.title()}"

def slugify(raw):
    cleaned = raw.lower().replace("'", "").replace(".", "").replace("-", "_")
    return "p_" + "_".join(cleaned.split()[:4])

# ---- Load scraped data ----
with open("/tmp/unifi_professors_full.json") as f:
    prof_data = json.load(f)

course_name_profs = {}
for p in prof_data:
    cname_raw = clean_name(p["name"])
    for c in p.get("courses", []):
        key = c["name"].upper().strip()
        if key not in course_name_profs:
            course_name_profs[key] = (cname_raw, c["code"])

# Manual maps for truncated names
MANUAL = {
    "COMUNICAZIONE CORPOREA E FILOSOFIE DELL": ("TOCCAFONDI FIORENZA",),
    "LINGUAGGI DELLA DIVERSITA": ("GHENO VERA",),
    "FILOSOFIA DELL'EDUCAZIONE E DELLA COMUNICAZIONE": ("MARIANI ALESSANDRO",),
    "STRATEGIA E VALORE D'IMPRESA": ("CIAPPEI CRISTIANO",),
    "ESTETICA E LINGUAGGI DELL'ARTE": ("MECACCI ANDREA",),
    "STRUMENTI E PRATICHE PER L'ANALISI DEL TESTO": ("BALLERINI MONICA",),
    "STRUMENTI PER L'ANALISI DELLA COMUNICAZIONE PARLATA": ("PANUNZI ALESSANDRO",),
    "FILOSOFIE DELL'ETA' MEDIEVALE": ("RODOLFI ANNA",),
    "STORIA DELL'ARTE MEDIEVALE": ("CERVINI FULVIO",),
    "ARCHEOLOGIA DELLE PRODUZIONI PREISTORICHE": ("LO VETRO DOMENICO",),
}

# Courses to leave as-is
SKIP = {
    "c6",  # Inglese B2
    "lm36_007", "lm36_008",
    "lm84_015",
    "lm89_013", "lm50_010", "lm5785_009",
    "lm50_011", "lm5785_010",
    "lm92_021",
    "lm2_004",
    "lm2_005",
    "lm37_004", "lm37_005", "lm37_006",
    "lm37_010", "lm37_015",
    "lm89_004", "lm89_007",
    "lm5785_006",
    "lm89_011",
    "lm84_006",
    "lm92_013", "lm92_018", "lm92_019",
    "c4",
}

def get_prof_info(course_name_upper):
    """Look up professor info for a course name."""
    # Try exact match
    if course_name_upper in course_name_profs:
        prof_raw, _ = course_name_profs[course_name_upper]
        return slugify(prof_raw), format_prof(prof_raw)

    # Try manual maps
    for key, (prof_raw,) in MANUAL.items():
        if course_name_upper.startswith(key.upper()):
            return slugify(prof_raw), format_prof(prof_raw)

    return None, None

# ---- Read mockData.ts ----
with open("src/data/mockData.ts") as f:
    lines = f.readlines()

# Parse: find "id: 'xxx'" and "name: 'xxx'" and update the following professor lines
i = 0
updated = 0
skipped = 0

while i < len(lines):
    line = lines[i]

    # Check if this line has "id: '...'"
    id_m = re.search(r"id:\s*['\"]([^'\"]+)['\"]", line)
    if id_m:
        course_id = id_m.group(1)
        # Look ahead for name line
        j = i + 1
        course_name = None
        while j < len(lines) and "name:" not in lines[j]:
            j += 1
        if j < len(lines):
            name_m = re.search(r"name:\s*['\"]([^'\"]+)['\"]", lines[j])
            if name_m:
                course_name = name_m.group(1)

        if course_name:
            upper = course_name.upper().replace("\\'", "'").strip()
            pid, pname = get_prof_info(upper)

            # Find and update professorId + professorName lines
            k = i
            pid_updated = False
            pname_updated = False
            while k < len(lines) and k < i + 20:
                if not pid_updated:
                    pid_m = re.search(r"professorId:\s*['\"]([^'\"]*)['\"]", lines[k])
                    if pid_m and pid_m.group(1) in ("", "p_"):
                        if pid:
                            lines[k] = re.sub(r"professorId:\s*['\"][^'\"]*['\"]",
                                f"professorId: '{pid}'", lines[k])
                            pid_updated = True
                if not pname_updated:
                    pname_m = re.search(r"professorName:\s*['\"]([^'\"]*)['\"]", lines[k])
                    if pname_m and (pname_m.group(1) in ("—", "") or pname_m.group(1).startswith("p_")):
                        if pname:
                            lines[k] = re.sub(r"professorName:\s*['\"][^'\"]*['\"]",
                                f"professorName: '{pname}'", lines[k])
                            pname_updated = True
                if pid_updated and pname_updated:
                    break
                k += 1

            if pid_updated:
                updated += 1
            elif course_id in SKIP:
                skipped += 1

    i += 1

# Write back
with open("src/data/mockData.ts", "w") as f:
    f.writelines(lines)

print(f"Updated {updated} courses, skipped {skipped}")

# Verify
with open("src/data/mockData.ts") as f:
    content = f.read()
filled = re.findall(r"professorId:\s*['\"](p_[^'\"]+)['\"]", content)
empty = re.findall(r"professorId:\s*['\"]['\"]", content)
print(f"Final: {len(filled)} filled, {len(empty)} empty")

# TypeScript check
import subprocess
result = subprocess.run(
    ["npx", "tsc", "--noEmit"],
    capture_output=True, text=True, timeout=30,
    cwd="/Users/suchuanhao/Desktop/vibe coding/游戏/佛罗伦萨学生-web"
)
errors = [l for l in result.stdout.split("\n") + result.stderr.split("\n") if "error TS" in l]
if errors:
    print(f"\nTS errors: {len(errors)}")
    for e in errors[:10]:
        print(f"  {e}")
else:
    print("\nNo TypeScript errors!")
