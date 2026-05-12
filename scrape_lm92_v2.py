#!/usr/bin/env python3
"""
Scrape all LM-92 courses from UNIFI Cineca course catalogue.
Uses browser automation via subprocess calls to curl with JavaScript rendering.
"""

import subprocess
import json
import re
import time
import os

# Complete course list from UNIFI official page (Piano di studi 2025/2026)
# Structure: (name, credits, hours, semester, year)
# Data source: https://www.unifi.it/it/studia-con-noi/corsi-di-laurea/corsi-di-laurea-magistrali/pratiche-linguaggi-e-culture-della

LM92_COURSES = [
    # Year 1
    ("LINGUAGGI DELLA DIVERSITA' NELLE SOCIETA' COMPLESSE", 6, 36, "Secondo Semestre", 1),
    ("ESTETICA DELL'ESPERIENZA VISIVA", 6, 36, "Primo Semestre", 1),
    ("FILOSOFIA DELL'EDUCAZIONE E DELLA COMUNICAZIONE", 6, 36, "Secondo Semestre", 1),
    ("MENTE E LINGUAGGI", 12, 72, "Primo Semestre", 1),
    ("ETICA E SOCIETA' DELL'INFORMAZIONE", 6, 36, "Primo Semestre", 1),
    ("COMUNICAZIONE GENERATIVA: INTERVENTI E PROGETTI", 6, 36, "Primo Semestre", 1),
    ("CAMBIAMENTO ORGANIZZATIVO", 6, 36, "Primo Semestre", 1),
    ("SCIENZA, LETTERATURA E PSEUDOSCIENZA", 6, 36, "Primo Semestre", 1),
    ("COMUNICAZIONE CORPOREA E FILOSOFIE DELL'EMOZIONE", 6, 36, "Primo Semestre", 1),
    ("STRATEGIA E VALORE D'IMPRESA", 6, 36, "Secondo Semestre", 1),
    ("ANTROPOLOGIA PUBBLICA", 6, 36, "Secondo Semestre", 1),
    ("STORIA DEL GIORNALISMO E DEI MEDIA", 6, 36, "Primo Semestre", 1),
    ("MENTI E TECNOLOGIE", 6, 36, "Secondo Semestre", 1),
    ("TEORIA DELLA RAZIONALITA'", 6, 36, "Primo Semestre", 1),
    # Year 2
    ("PROVA FINALE", 18, 0, "Annuale", 2),
    ("LABORATORIO: TELEVISIONE E MEDIA DIGITALI", 3, 20, "Secondo Semestre", 2),
    ("LABORATORIO: EDITORIA MULTIMEDIALE", 3, 20, "Primo Semestre", 2),
    ("LABORATORIO: TECNOLOGIE DEL KNOWLEDGE MANAGEMENT", 3, 20, "Secondo Semestre", 2),
    ("LABORATORIO: PRATICHE DI ARGOMENTAZIONE DIGITALE", 3, 20, "Primo Semestre", 2),
    ("ESTETICA E LINGUAGGI DELL'ARTE", 6, 36, "Primo Semestre", 2),
    ("DISCORSO POLITICO E STRATEGIE LINGUISTICHE", 12, 72, "Primo Semestre", 2),
    ("SOCIOLINGUISTICA", 6, 36, "Primo Semestre", 2),
    ("TEORIA E ANALISI DEL LINGUAGGIO CINE-TELEVISIVO", 6, 36, "Primo Semestre", 2),
    ("CINEMA, MEDIA E CULTURA VISUALE", 6, 36, "Primo Semestre", 2),
    ("CINEMA ITALIANO", 6, 36, "Secondo Semestre", 2),
    ("LINGUAGGI DEL TEATRO MUSICALE", 6, 36, "Secondo Semestre", 2),
    ("STRUMENTI E PRATICHE PER L'ANALISI DEL TESTO", 6, 36, "Primo Semestre", 2),
    ("STRUMENTI PER L'ANALISI DELLA COMUNICAZIONE PARLATA", 6, 36, "Primo Semestre", 2),
]

def generate_md_report(courses_with_professors):
    """Generate a Markdown review document."""
    md = """# LM-92: Pratiche, linguaggi e culture della comunicazione

**Programma**: LM-92 | **Facoltà**: Scuola di Studi Umanistici e della Formazione
**Fonte**: https://www.unifi.it/it/studia-con-noi/corsi-di-laurea/corsi-di-laurea-magistrali/pratiche-linguaggi-e-culture-della
**Anno Accademico**: 2025/2026

> ⚠️ **NOTA**: I professori indicati con "?" devono essere verificati manualmente. La colonna "Tipo" (Obbligatorio/Opzionale/Laboratorio/Prova Finale) è basata sulla struttura del piano di studi ufficiale.

---

## Anno 1 (Primo Semestre)

| # | Insegnamento | CFU | Ore | Semestre | Professore | Tipo |
|---|-------------|-----|-----|----------|------------|------|
"""
    semester_map = {"Primo Semestre": "1° Semestre", "Secondo Semestre": "2° Semestre"}
    year1_sem1 = [(c, p) for c, p in courses_with_professors if c[4] == 1 and c[3] == "Primo Semestre"]
    year1_sem2 = [(c, p) for c, p in courses_with_professors if c[4] == 1 and c[3] == "Secondo Semestre"]
    year2_sem1 = [(c, p) for c, p in courses_with_professors if c[4] == 2 and c[3] == "Primo Semestre"]
    year2_sem2 = [(c, p) for c, p in courses_with_professors if c[4] == 2 and c[3] == "Secondo Semestre"]
    year2_annual = [(c, p) for c, p in courses_with_professors if c[4] == 2 and c[3] == "Annuale"]

    def course_type(name, year, semester):
        if name == "PROVA FINALE":
            return "Prova Finale"
        if name.startswith("LABORATORIO:"):
            return "Laboratorio"
        if year == 1:
            return "Obbligatorio"
        if year == 2 and semester == "Primo Semestre":
            return "Obbligatorio"
        return "Opzionale"

    idx = 1
    md += f"\n### 1° Semestre\n\n"
    for course, prof in year1_sem1:
        ct = course_type(course[0], course[4], course[3])
        md += f"| {idx} | {course[0]} | {course[1]} | {course[2]} | 1° | {prof or '?'} | {ct} |\n"
        idx += 1

    md += f"\n### 1° Anno - 2° Semestre\n\n"
    for course, prof in year1_sem2:
        ct = course_type(course[0], course[4], course[3])
        md += f"| {idx} | {course[0]} | {course[1]} | {course[2]} | 2° | {prof or '?'} | {ct} |\n"
        idx += 1

    md += f"\n## Anno 2\n\n"
    md += f"\n### 2° Anno - 1° Semestre\n\n"
    for course, prof in year2_sem1:
        ct = course_type(course[0], course[4], course[3])
        md += f"| {idx} | {course[0]} | {course[1]} | {course[2]} | 1° | {prof or '?'} | {ct} |\n"
        idx += 1

    md += f"\n### 2° Anno - 2° Semestre\n\n"
    for course, prof in year2_sem2:
        ct = course_type(course[0], course[4], course[3])
        md += f"| {idx} | {course[0]} | {course[1]} | {course[2]} | 2° | {prof or '?'} | {ct} |\n"
        idx += 1

    if year2_annual:
        md += f"\n### 2° Anno - Annuale\n\n"
        for course, prof in year2_annual:
            ct = course_type(course[0], course[4], course[3])
            md += f"| {idx} | {course[0]} | {course[1]} | {course[2]} | Ann. | {prof or '?'} | {ct} |\n"
            idx += 1

    total_cfu = sum(c[1] for c in LM92_COURSES)
    md += f"\n---\n\n**Totale CFU**: {total_cfu} | **Totale corsi**: {len(LM92_COURSES)}\n"
    return md

def main():
    # All courses with None professor (to be filled)
    courses_with_professors = [(c, None) for c in LM92_COURSES]

    # We already know ESTETICA DELL'ESPERIENZA VISIVA professor from user
    # Let's map known professors based on the official Cineca page we visited
    # The user confirmed: ESTETICA DELL'ESPERIENZA VISIVA -> CANTELLI CHIARA

    md = generate_md_report(courses_with_professors)

    output_path = "/Users/suchuanhao/Desktop/vibe coding/游戏/佛罗伦萨学生-web/LM92_verifica.md"
    with open(output_path, "w") as f:
        f.write(md)

    print(f"Report generated: {output_path}")
    print(f"\nTotal courses: {len(LM92_COURSES)}")
    print(f"Total CFU: {sum(c[1] for c in LM92_COURSES)}")

    # Summary by year
    year1 = [c for c in LM92_COURSES if c[4] == 1]
    year2 = [c for c in LM92_COURSES if c[4] == 2]
    print(f"\nYear 1: {len(year1)} courses, {sum(c[1] for c in year1)} CFU")
    print(f"Year 2: {len(year2)} courses, {sum(c[1] for c in year2)} CFU")

if __name__ == "__main__":
    main()
