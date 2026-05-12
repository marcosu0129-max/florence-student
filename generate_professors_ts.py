#!/usr/bin/env python3
import json

def clean_name(raw):
    # Take first line only, then deduplicate adjacent identical words
    first_line = raw.strip().split("\n")[0].strip()
    parts = first_line.split()
    # Deduplicate: if surname == first word and repeated, skip dup
    if len(parts) >= 2 and parts[0] == parts[-1]:
        parts = parts[:-1]
    return " ".join(parts)

def format_name(raw):
    parts = clean_name(raw).split()
    if len(parts) == 2:
        return f"Prof. {parts[1].title()} {parts[0].title()}"
    elif len(parts) >= 3:
        surname = parts[-1].title()
        given = " ".join(p.title() for p in parts[:-1])
        return f"Prof. {given} {surname}"
    else:
        return f"Prof. {raw.title()}"

def slugify(raw):
    cleaned = clean_name(raw).lower().replace("'", "").replace(".", "").replace("-", "_")
    words = cleaned.split()
    return "p_" + "_".join(words[:4])

with open("/tmp/unifi_professors_full.json") as f:
    data = json.load(f)

# Build course -> professor map
course_to_profs = {}
for p in data:
    # use clean name for dedup
    clean = clean_name(p["name"])
    for c in p.get("courses", []):
        key = c["code"].upper()
        if key not in course_to_profs:
            course_to_profs[key] = []
        if clean not in course_to_profs[key]:
            course_to_profs[key].append(clean)

# Generate professors TypeScript
lines = []
lines.append("// ===== Professors (scraped from UNIFI Cineca 2025/2026) =====")
lines.append("export const professors: Professor[] = [")

for p in data:
    pid = slugify(p["name"])
    formatted = format_name(p["name"])
    dept = (p.get("department") or "Dipartimento di Lettere e Filosofia").split(" - ")[-1]
    ssd = p.get("ssd") or ""
    bio = f"{('SSD: ' + ssd + '. ') if ssd else ''}Professore in {p.get('program', '')}."
    if p.get("email"):
        bio += f" Email: {p['email']}"
    bio = bio.replace('"', "'")
    n_courses = len(p.get("courses", []))
    programs = p.get("program", "")

    lines.append("  {")
    lines.append(f"    id: '{pid}',")
    lines.append(f'    name: "{formatted}",')
    lines.append(f'    department: "{dept}",')
    lines.append(f'    faculty: "Scuola di Studi Umanistici e della Formazione",')
    lines.append(f'    bio: "{bio}",')
    lines.append(f'    email: "{p.get("email") or ""}",')
    lines.append(f'    office: "",')
    lines.append(f"    rating: 0,")
    lines.append(f"    programs: ['{programs}'],")
    lines.append(f"    courseCount: {n_courses},")
    lines.append("  },")

lines.append("];")
ts_profs = "\n".join(lines)
with open("/tmp/profs_ts.txt", "w") as f:
    f.write(ts_profs)
print(f"Generated {len(data)} professors TS")

# Course -> first professor map
course_map = {}
for code, names in course_to_profs.items():
    name = names[0]
    pid = slugify(name)
    course_map[code] = (pid, format_name(name))

with open("/tmp/course_prof_map.txt", "w") as f:
    for code in sorted(course_map.keys()):
        pid, name = course_map[code]
        f.write(f"{code}|{pid}|{name}\n")
print(f"Course maps: {len(course_map)}")

# Verify
print("\nSample formatting:")
for p in data[:10]:
    print(f"  {p['name']:35s} -> {format_name(p['name'])}")
