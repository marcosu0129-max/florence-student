#!/usr/bin/env python3
"""
Parse all scraped UNIFI PDF data and generate TypeScript mockData.ts content.
"""

import re

# ── Extracted course data from PDFs ────────────────────────────────────────────

PROGRAMS = [
    {
        "code": "LM-2",
        "name": "Archeologia",
        "cineca_code": "B347",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof. Luca Cappuccini",
    },
    {
        "code": "LM-15",
        "name": "Filologia, letteratura e storia dell'antichità",
        "cineca_code": "B334",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof. Giulio Vannini",
    },
    # LM-14 already exists as c7 in mockData
    {
        "code": "LM-36",
        "name": "Lingue e civiltà dell'Asia e dell'Africa",
        "cineca_code": "B363",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof.ssa Valentina Pedone",
    },
    {
        "code": "LM-37",
        "name": "Lingue e letterature europee e americane",
        "cineca_code": "B413",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof. Federico Fastelli",
    },
    {
        "code": "LM-78-Logica",
        "name": "Logica, Filosofia delle Scienze e Metodi della Ricerca",
        "cineca_code": "B391",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof.ssa Elena Castellani",
    },
    {
        "code": "LM-5",
        "name": "Scienze archivistiche e biblioteconomiche",
        "cineca_code": "B349",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof.ssa Annantonia Martorano",
    },
    {
        "code": "LM-65",
        "name": "Scienze dello spettacolo",
        "cineca_code": "B420",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof.ssa Anna Masecchia",
    },
    {
        "code": "LM-78-Filosofia",
        "name": "Scienze filosofiche",
        "cineca_code": "B378",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof.ssa Anna Rodolfi",
    },
    {
        "code": "LM-84",
        "name": "Scienze storiche",
        "cineca_code": "B380",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof.ssa Ida Gilda Mastrorosa",
    },
    {
        "code": "LM-89",
        "name": "Storia dell'arte",
        "cineca_code": "B384",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof. Cristiano Giometti",
    },
    # LM-92 already exists
    {
        "code": "LM-50",
        "name": "Dirigenza scolastica e pedagogia per l'inclusione",
        "cineca_code": "B367",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof. Davide Capperucci",
    },
    {
        "code": "LM-57-85",
        "name": "Scienze pedagogiche e management della formazione per lo sviluppo sostenibile",
        "cineca_code": "B389",
        "faculty": "Scuola di Studi Umanistici e della Formazione",
        "totalCredits": 120,
        "courseCount": 0,
        "requiredCount": 0,
        "president": "Prof.ssa Giovanna Del Gobbo",
    },
]

# ── All courses extracted from PDFs ─────────────────────────────────────────────
# Format: (programCode, name, cfu, semester, year, isRequired, ssd)

COURSES = [
    # LM-2 ARCHEOLOGIA (B347) ──────────────────────────────────────────────────
    # Year 1 (a.a. 2025/2026)
    ("LM-2", "Archeologia siro-anatolica", 12, "Annuale", 1, True, "L-OR/05"),
    ("LM-2", "Archeologia preistorica", 12, "Annuale", 1, True, "L-ANT/01"),
    ("LM-2", "Religioni del Vicino Oriente antico", 6, "Primo Semestre", 1, True, "L-OR/01"),
    ("LM-2", "Abilità informatiche in archeologia", 6, "Primo Semestre", 1, True, "L-ANT/10"),
    ("LM-2", "Preistoria del Mediterraneo", 12, "Annuale", 1, True, "L-ANT/01"),
    ("LM-2", "Ittitologia", 6, "Primo Semestre", 1, True, "L-OR/04"),
    ("LM-2", "Egittologia", 6, "Primo Semestre", 1, True, "L-OR/02"),
    ("LM-2", "Assiriologia", 6, "Primo Semestre", 1, True, "L-OR/03"),
    ("LM-2", "Archeologia classica", 12, "Annuale", 1, True, "L-ANT/07"),
    ("LM-2", "Etruscologia", 6, "Primo Semestre", 1, True, "L-ANT/06"),
    ("LM-2", "Urbanistica del mondo romano", 12, "Annuale", 1, True, "L-ANT/09"),
    ("LM-2", "Archeologia medievale del Mediterraneo", 12, "Annuale", 1, True, "L-ANT/08"),
    ("LM-2", "Archeologia e contesti nell'Italia romana", 6, "Primo Semestre", 1, True, "L-ANT/07"),
    # Year 2 (a.a. 2026/2027)
    ("LM-2", "Archeologia delle produzioni preistoriche", 6, "Primo Semestre", 2, True, "L-ANT/01"),
    ("LM-2", "Storia dell'arte preistorica", 6, "Primo Semestre", 2, True, "L-ANT/01"),
    ("LM-2", "Paleoantropologia", 6, "Primo Semestre", 2, False, "BIO/08"),
    ("LM-2", "Archeometria", 6, "Primo Semestre", 2, False, "L-ANT/10"),
    ("LM-2", "Tirocinio archeologico", 6, "Primo Semestre", 2, False, None),
    ("LM-2", "Laboratorio di archeologia", 6, "Primo Semestre", 2, False, None),
    ("LM-2", "Prova finale di laurea", 24, "Annuale", 2, True, None),

    # LM-15 FILOLOGIA, LETTERATURA E STORIA DELL'ANTICHITÀ (B334) ───────────
    # Year 1
    ("LM-15", "Letteratura greca", 12, "Annuale", 1, True, "HELL-01/B"),
    ("LM-15", "Letteratura latina", 6, "Primo Semestre", 1, True, "LATI-01/A"),
    ("LM-15", "Storia della tarda antichità", 6, "Primo Semestre", 1, True, "STAN-01/B"),
    ("LM-15", "Geografia storica del mondo antico", 6, "Primo Semestre", 1, True, "STAN-01/A"),
    ("LM-15", "Storia della trasmissione dei classici", 6, "Primo Semestre", 1, True, "FICP-01/A"),
    ("LM-15", "Filologia Classica", 12, "Annuale", 2, True, "FICP-01/A"),
    ("LM-15", "Papirologia", 6, "Primo Semestre", 2, True, "FICP-01/C"),
    ("LM-15", "Letteratura cristiana antica", 6, "Primo Semestre", 2, True, "FICP-01/B"),
    ("LM-15", "Archeologia classica", 12, "Annuale", 2, True, "ARCH-01/D"),
    ("LM-15", "Paleografia greca e latina", 12, "Annuale", 1, False, "HIST-04/D"),
    ("LM-15", "Paleografia latina e codicologia", 12, "Annuale", 1, False, "HIST-04/D"),
    ("LM-15", "Glottologia", 6, "Primo Semestre", 1, False, "GLOT-01/A"),
    ("LM-15", "Epigrafia greca", 6, "Primo Semestre", 1, False, "STAN-01/A"),
    ("LM-15", "Epigrafia latina", 6, "Primo Semestre", 1, False, "L-ANT/03"),
    ("LM-15", "Critica ed esegesi dei testi latini", 6, "Primo Semestre", 1, False, "LATI-01/A"),
    ("LM-15", "Storia della filosofia antica", 6, "Primo Semestre", 2, False, "PHIL-05/B"),
    ("LM-15", "Laboratorio di epigrafia greca e latina", 3, "Primo Semestre", 1, False, None),
    ("LM-15", "Laboratorio di papirologia", 3, "Primo Semestre", 1, False, None),
    ("LM-15", "Laboratorio di storia antica", 3, "Primo Semestre", 1, False, None),
    ("LM-15", "Tirocinio", 6, "Secondo Semestre", 2, False, None),
    ("LM-15", "Prova finale di laurea", 18, "Annuale", 2, True, None),

    # LM-36 LINGUE E CIVILTÀ DELL'ASIA E DELL'AFRICA (B363)
    # Year 1
    ("LM-36", "Lingua e letteratura araba 1", 12, "Annuale", 1, True, "L-OR/12"),
    ("LM-36", "Lingua e letteratura cinese 1", 12, "Annuale", 1, True, "L-OR/21"),
    ("LM-36", "Lingua e letteratura ebraica 1", 12, "Annuale", 1, True, "L-OR/08"),
    ("LM-36", "Lingua e letteratura giapponese 1", 12, "Annuale", 1, True, "L-OR/22"),
    ("LM-36", "Storia e culture dell'Asia", 6, "Primo Semestre", 1, True, "L-OR/10"),
    ("LM-36", "Antropologia culturale dell'Asia", 6, "Primo Semestre", 1, True, "M-DEA/01"),
    # Year 2
    ("LM-36", "Lingua e letteratura araba 2", 12, "Annuale", 2, True, "L-OR/12"),
    ("LM-36", "Lingua e letteratura cinese 2", 12, "Annuale", 2, True, "L-OR/21"),
    ("LM-36", "Lingua e letteratura ebraica 2", 12, "Annuale", 2, True, "L-OR/08"),
    ("LM-36", "Lingua e letteratura giapponese 2", 12, "Annuale", 2, True, "L-OR/22"),
    ("LM-36", "Storia delle religioni asiatiche", 6, "Primo Semestre", 2, False, "L-OR/13"),
    ("LM-36", "Tirocinio", 6, "Secondo Semestre", 2, False, None),
    ("LM-36", "Prova finale di laurea", 18, "Annuale", 2, True, None),

    # LM-37 LINGUE E LETTERATURE EUROPEE E AMERICANE (B413)
    # Year 1
    ("LM-37", "Letteratura italiana moderna e contemporanea", 6, "Primo Semestre", 1, True, "L-FIL-LET/11"),
    ("LM-37", "Letterature comparate", 6, "Primo Semestre", 1, True, "L-FIL-LET/14"),
    ("LM-37", "Linguistica e traduzione francese 1", 9, "Annuale", 1, True, "L-LIN/04"),
    ("LM-37", "Linguistica e traduzione inglese 1", 9, "Annuale", 1, True, "L-LIN/12"),
    ("LM-37", "Linguistica e traduzione spagnola 1", 9, "Annuale", 1, True, "L-LIN/07"),
    ("LM-37", "Linguistica e traduzione tedesca 1", 9, "Annuale", 1, True, "L-LIN/14"),
    ("LM-37", "Linguistica e traduzione portoghese e brasiliana 1", 9, "Annuale", 1, True, "L-LIN/09"),
    ("LM-37", "Linguistica e traduzione russa 1", 9, "Annuale", 1, True, "L-LIN/21"),
    ("LM-37", "Linguistica e traduzione ugrofinnica 1", 9, "Annuale", 1, True, "L-LIN/19"),
    ("LM-37", "Filologia germanica", 6, "Primo Semestre", 1, True, "L-FIL-LET/15"),
    ("LM-37", "Filologia romanza", 6, "Primo Semestre", 1, True, "L-FIL-LET/09"),
    ("LM-37", "Filologia slava", 6, "Primo Semestre", 1, True, "L-LIN/21"),
    ("LM-37", "Letteratura anglo-americana 1", 9, "Annuale", 1, True, "L-LIN/11"),
    ("LM-37", "Letteratura francese 1", 9, "Annuale", 1, True, "L-LIN/03"),
    ("LM-37", "Letteratura inglese 1", 9, "Annuale", 1, True, "L-LIN/10"),
    ("LM-37", "Letteratura spagnola 1", 9, "Annuale", 1, True, "L-LIN/05"),
    ("LM-37", "Letteratura russa 1", 9, "Annuale", 1, True, "L-LIN/21"),
    ("LM-37", "Letteratura tedesca 1", 9, "Annuale", 1, True, "L-LIN/13"),
    # Year 2
    ("LM-37", "Letteratura anglo-americana 2", 6, "Annuale", 2, True, "L-LIN/11"),
    ("LM-37", "Letteratura francese 2", 6, "Annuale", 2, True, "L-LIN/03"),
    ("LM-37", "Letteratura inglese 2", 6, "Annuale", 2, True, "L-LIN/10"),
    ("LM-37", "Letteratura spagnola 2", 6, "Annuale", 2, True, "L-LIN/05"),
    ("LM-37", "Letteratura russa 2", 6, "Annuale", 2, True, "L-LIN/21"),
    ("LM-37", "Letteratura tedesca 2", 6, "Annuale", 2, True, "L-LIN/13"),
    ("LM-37", "Descrizione e teoria linguistica", 6, "Primo Semestre", 2, True, "L-LIN/01"),
    ("LM-37", "Linguistica italiana", 6, "Primo Semestre", 1, True, "L-FIL-LET/12"),
    ("LM-37", "Linguistica dei corpora", 6, "Primo Semestre", 2, False, "L-LIN/01"),
    ("LM-37", "Filologia germanica 2", 6, "Primo Semestre", 2, False, "L-FIL-LET/15"),
    ("LM-37", "Filologia romanza 2", 6, "Primo Semestre", 2, False, "L-FIL-LET/09"),
    ("LM-37", "Glottologia", 6, "Primo Semestre", 2, False, "L-LIN/01"),
    ("LM-37", "Analisi del parlato", 6, "Primo Semestre", 2, False, "L-LIN/01"),
    ("LM-37", "Lingua e letteratura araba", 12, "Annuale", 1, False, "L-OR/12"),
    ("LM-37", "Lingua e letteratura cinese", 12, "Annuale", 1, False, "L-OR/21"),
    ("LM-37", "Lingua e letteratura ebraica", 12, "Annuale", 1, False, "L-OR/08"),
    ("LM-37", "Lingua e letteratura giapponese", 12, "Annuale", 1, False, "L-OR/22"),
    ("LM-37", "Laboratorio di traduzione inglese", 3, "Primo Semestre", 2, False, "L-LIN/10"),
    ("LM-37", "Laboratorio di traduzione spagnola", 3, "Primo Semestre", 2, False, "L-LIN/05"),
    ("LM-37", "Laboratorio di traduzione francese", 3, "Primo Semestre", 2, False, "L-LIN/03"),
    ("LM-37", "Laboratorio di traduzione tedesca", 3, "Primo Semestre", 2, False, "L-LIN/13"),
    ("LM-37", "Laboratorio di cultura digitale per studi linguistici e filologici", 6, "Primo Semestre", 1, False, None),
    ("LM-37", "Tirocinio", 6, "Secondo Semestre", 2, False, None),
    ("LM-37", "Prova finale di laurea", 24, "Annuale", 2, True, None),

    # LM-78-Logica LOGICA, FILOSOFIA DELLE SCIENZE (B391)
    # Year 1
    ("LM-78-Logica", "Logica e metafisica nel pensiero antico", 6, "Primo Semestre", 1, True, "M-FIL/07"),
    ("LM-78-Logica", "Storia della scienza", 6, "Primo Semestre", 1, True, "M-STO/05"),
    ("LM-78-Logica", "Temi avanzati di filosofia della scienza", 12, "Annuale", 1, True, "M-FIL/02"),
    ("LM-78-Logica", "Temi avanzati di logica", 12, "Annuale", 1, True, "M-FIL/02"),
    ("LM-78-Logica", "Temi di filosofia dell'età moderna e contemporanea", 6, "Primo Semestre", 1, True, "M-FIL/06"),
    ("LM-78-Logica", "Topics in the philosophy of logic and mathematics", 6, "Primo Semestre", 1, True, "M-FIL/02"),
    ("LM-78-Logica", "Linguaggio, cognizione e computazione", 6, "Primo Semestre", 1, False, "L-LIN/01"),
    ("LM-78-Logica", "Linguistica generale", 6, "Primo Semestre", 1, False, "L-LIN/01"),
    ("LM-78-Logica", "Logica applicata", 6, "Primo Semestre", 1, False, "MAT/01"),
    ("LM-78-Logica", "Logica e computazione quantistica", 6, "Primo Semestre", 1, False, "FIS/02"),
    # Year 2
    ("LM-78-Logica", "Foundations of cognition and artificial intelligence", 6, "Primo Semestre", 2, True, "INF/01"),
    ("LM-78-Logica", "Theories of rationality: behaviors, decisions and games", 6, "Primo Semestre", 2, True, "SECS-P/01"),
    ("LM-78-Logica", "Seminario per laureandi", 6, "Primo Semestre", 2, False, None),
    ("LM-78-Logica", "Tirocinio", 6, "Secondo Semestre", 2, False, None),
    ("LM-78-Logica", "Ulteriori conoscenze linguistiche", 6, "Secondo Semestre", 2, False, None),
    ("LM-78-Logica", "Prova finale di laurea", 30, "Annuale", 2, True, None),

    # LM-5 SCIENZE ARCHIVISTICHE E BIBLIOTECONOMICHE (B349)
    # Year 1
    ("LM-5", "Storia moderna", 6, "Primo Semestre", 1, True, "M-STO/02"),
    ("LM-5", "Archivistica privata", 6, "Primo Semestre", 1, True, "M-STO/08"),
    ("LM-5", "Archivistica digitale", 6, "Primo Semestre", 1, True, "M-STO/08"),
    ("LM-5", "Archivistica pubblica", 12, "Annuale", 1, True, "M-STO/08"),
    ("LM-5", "Paleografia e codicologia", 12, "Annuale", 1, True, "M-STO/09"),
    ("LM-5", "Bibliologia", 12, "Annuale", 1, True, "M-STO/08"),
    ("LM-5", "Biblioteconomia digitale", 6, "Primo Semestre", 1, True, "M-STO/08"),
    ("LM-5", "Bibliografia", 6, "Primo Semestre", 1, True, "M-STO/08"),
    ("LM-5", "Diplomatica", 6, "Primo Semestre", 1, True, "M-STO/09"),
    ("LM-5", "Storia dell'arte contemporanea", 6, "Primo Semestre", 1, False, "L-ART/03"),
    ("LM-5", "Filologia romanza", 6, "Primo Semestre", 1, False, "L-FIL-LET/09"),
    ("LM-5", "Filologia dantesca", 6, "Primo Semestre", 1, False, "L-FIL-LET/13"),
    ("LM-5", "Letteratura teatrale italiana", 6, "Primo Semestre", 1, False, "L-FIL-LET/10"),
    ("LM-5", "Storia economica medievale e moderna", 6, "Primo Semestre", 1, False, "SECS-P/12"),
    ("LM-5", "Laboratorio di archivistica", 6, "Primo Semestre", 1, False, None),
    ("LM-5", "Laboratorio di trascrizione e descrizione del manoscritto", 6, "Primo Semestre", 1, False, None),
    ("LM-5", "Laboratorio di catalogazione e metadatazione", 6, "Primo Semestre", 1, False, None),
    ("LM-5", "Tirocinio", 6, "Secondo Semestre", 1, True, None),
    ("LM-5", "Prova finale di laurea", 24, "Annuale", 2, True, None),

    # LM-65 SCIENZE DELLO SPETTACOLO (B420)
    # Year 1
    ("LM-65", "Archivistica pubblica", 6, "Primo Semestre", 1, True, "M-STO/08"),
    ("LM-65", "Cinema e cultura visuale", 12, "Annuale", 1, True, "L-ART/06"),
    ("LM-65", "Storia culturale dell'età contemporanea", 6, "Primo Semestre", 1, True, "M-STO/04"),
    ("LM-65", "Tutela dei beni culturali", 6, "Primo Semestre", 1, True, "L-ART/01"),
    ("LM-65", "Storia degli attori e della recitazione", 6, "Primo Semestre", 1, True, "L-ART/05"),
    ("LM-65", "Istituzioni di regia", 6, "Primo Semestre", 1, True, "L-ART/05"),
    ("LM-65", "Teatro e arti performative", 6, "Primo Semestre", 1, True, "L-ART/05"),
    ("LM-65", "Etnomusicologia", 12, "Annuale", 1, True, "L-ART/08"),
    ("LM-65", "Teoria e pratica dello spettacolo", 6, "Primo Semestre", 1, True, "L-ART/05"),
    ("LM-65", "Strumenti per il management e il marketing", 6, "Primo Semestre", 1, True, "SECS-P/08"),
    ("LM-65", "Fonti, strumenti e metodi per la ricerca musicologica", 12, "Annuale", 1, True, "L-ART/07"),
    ("LM-65", "Analisi e interpretazione dei testi musicali", 6, "Primo Semestre", 1, True, "L-ART/07"),
    ("LM-65", "Letteratura italiana", 6, "Primo Semestre", 1, False, "L-FIL-LET/10"),
    ("LM-65", "Letteratura teatrale italiana", 6, "Primo Semestre", 1, False, "L-FIL-LET/10"),
    ("LM-65", "Laboratorio di culture digitali e arti performative", 3, "Primo Semestre", 1, False, None),
    ("LM-65", "Laboratorio di cinema e produzione", 3, "Primo Semestre", 1, False, None),
    ("LM-65", "Laboratorio di musica e produzione", 3, "Primo Semestre", 1, False, None),
    ("LM-65", "Laboratorio di teatro e produzione", 3, "Primo Semestre", 1, False, None),
    # Year 2
    ("LM-65", "Telematica per le scienze dello spettacolo", 6, "Primo Semestre", 2, True, "ING-INF/03"),
    ("LM-65", "Analisi e critica dello spettacolo", 6, "Primo Semestre", 2, True, "L-ART/05"),
    ("LM-65", "Cinema italiano", 6, "Primo Semestre", 2, True, "L-ART/06"),
    ("LM-65", "Teoria e analisi del linguaggio cine-televisivo", 6, "Primo Semestre", 2, True, "L-ART/06"),
    ("LM-65", "Etnomusicologia 2", 6, "Primo Semestre", 2, True, "L-ART/08"),
    ("LM-65", "Drammaturgia musicale", 6, "Primo Semestre", 2, True, "L-ART/07"),
    ("LM-65", "Forme e pratiche della popular music", 6, "Primo Semestre", 2, True, "L-ART/08"),
    ("LM-65", "Laboratorio di economia per lo spettacolo", 3, "Primo Semestre", 2, False, None),
    ("LM-65", "Laboratorio di diritto per lo spettacolo", 3, "Primo Semestre", 2, False, None),
    ("LM-65", "Laboratorio di programmazione e gestione economico-finanziaria per lo spettacolo dal vivo", 3, "Primo Semestre", 2, False, None),
    ("LM-65", "Tirocinio", 6, "Secondo Semestre", 2, False, None),
    ("LM-65", "Prova finale di laurea", 24, "Annuale", 2, True, None),

    # LM-78-Filosofia SCIENZE FILOSOFICHE (B378)
    # Year 1
    ("LM-78-Filosofia", "Filosofie dell'età medievale", 6, "Primo Semestre", 1, True, "M-FIL/08"),
    ("LM-78-Filosofia", "Filosofie del Novecento", 6, "Primo Semestre", 1, True, "M-FIL/06"),
    ("LM-78-Filosofia", "Filosofia antica", 6, "Primo Semestre", 1, True, "M-FIL/07"),
    ("LM-78-Filosofia", "Storia della filosofia del Rinascimento", 6, "Primo Semestre", 1, True, "M-FIL/06"),
    ("LM-78-Filosofia", "Filosofie dell'età moderna", 6, "Primo Semestre", 1, True, "M-FIL/06"),
    ("LM-78-Filosofia", "Antropologia filosofica", 6, "Primo Semestre", 1, True, "M-FIL/03"),
    ("LM-78-Filosofia", "Estetica visuale e dei media", 6, "Primo Semestre", 1, True, "M-FIL/04"),
    ("LM-78-Filosofia", "Estetica e scienza", 6, "Primo Semestre", 1, True, "M-FIL/04"),
    ("LM-78-Filosofia", "Filosofia teoretica", 6, "Primo Semestre", 1, True, "M-FIL/01"),
    ("LM-78-Filosofia", "Etica", 6, "Primo Semestre", 1, False, "M-FIL/03"),
    ("LM-78-Filosofia", "Filosofia della storia", 6, "Primo Semestre", 1, False, "M-FIL/03"),
    ("LM-78-Filosofia", "Temi avanzati di filosofia della mente", 6, "Primo Semestre", 1, False, "M-FIL/01"),
    ("LM-78-Filosofia", "Fenomenologia della tecnologia", 6, "Primo Semestre", 1, False, "M-FIL/01"),
    ("LM-78-Filosofia", "Filosofia delle istituzioni", 6, "Primo Semestre", 1, False, "SPS/01"),
    ("LM-78-Filosofia", "Filosofia politica", 6, "Primo Semestre", 1, False, "SPS/01"),
    ("LM-78-Filosofia", "Filosofia sociale", 6, "Primo Semestre", 1, False, "SPS/01"),
    ("LM-78-Filosofia", "Linguistica generale", 6, "Primo Semestre", 1, False, "L-LIN/01"),
    ("LM-78-Filosofia", "Letteratura greca", 6, "Primo Semestre", 1, False, "L-FIL-LET/02"),
    ("LM-78-Filosofia", "Letteratura latina", 6, "Primo Semestre", 1, False, "L-FIL-LET/04"),
    ("LM-78-Filosofia", "Storia del pensiero scientifico", 6, "Primo Semestre", 1, False, "M-STO/05"),
    ("LM-78-Filosofia", "Storia delle religioni", 6, "Primo Semestre", 1, False, "M-STO/06"),
    ("LM-78-Filosofia", "Bioetica", 6, "Primo Semestre", 1, False, "M-FIL/03"),
    ("LM-78-Filosofia", "Storia della filosofia araba medievale", 6, "Primo Semestre", 1, False, "M-FIL/08"),
    ("LM-78-Filosofia", "Didattica della filosofia e metodologie dell'insegnamento", 6, "Primo Semestre", 2, True, "M-FIL/06"),
    ("LM-78-Filosofia", "Testi e percorsi della filosofia", 6, "Primo Semestre", 2, True, "M-FIL/06"),
    ("LM-78-Filosofia", "Abilità informatiche avanzate per le discipline umanistiche", 6, "Primo Semestre", 2, True, None),
    ("LM-78-Filosofia", "Tirocinio", 6, "Secondo Semestre", 2, False, None),
    ("LM-78-Filosofia", "Ulteriori conoscenze linguistiche", 6, "Secondo Semestre", 2, False, None),
    ("LM-78-Filosofia", "Prova finale di laurea", 30, "Annuale", 2, True, None),

    # LM-84 SCIENZE STORICHE (B380)
    # Year 1
    ("LM-84", "Fonti e metodi per la ricerca medievistica", 6, "Primo Semestre", 1, True, "M-STO/01"),
    ("LM-84", "Fonti e metodi per la storia contemporanea", 6, "Primo Semestre", 1, True, "M-STO/04"),
    ("LM-84", "Fonti e metodi per la storia moderna", 6, "Primo Semestre", 1, True, "M-STO/02"),
    ("LM-84", "Storia globale del mondo contemporaneo", 6, "Primo Semestre", 1, True, "M-STO/04"),
    ("LM-84", "Storia dell'Illuminismo", 6, "Primo Semestre", 1, True, "M-STO/02"),
    ("LM-84", "Storia di genere", 6, "Primo Semestre", 1, True, "M-STO/04"),
    ("LM-84", "Storia politica e sociale dell'età contemporanea", 6, "Primo Semestre", 1, True, "M-STO/04"),
    ("LM-84", "Storia politica nel Medioevo", 6, "Primo Semestre", 1, True, "M-STO/01"),
    ("LM-84", "Storia sociale del Medioevo", 6, "Primo Semestre", 1, True, "M-STO/01"),
    ("LM-84", "Archeologia medievale", 6, "Primo Semestre", 1, False, "L-ANT/08"),
    ("LM-84", "Paleografia", 6, "Primo Semestre", 2, True, "M-STO/09"),
    ("LM-84", "Archivistica, bibliografia e biblioteconomia", 6, "Primo Semestre", 2, True, "M-STO/08"),
    ("LM-84", "Diplomatica", 6, "Primo Semestre", 2, True, "M-STO/09"),
    ("LM-84", "Museologia e critica artistica e del restauro", 6, "Primo Semestre", 2, True, "L-ART/04"),
    ("LM-84", "Storia del Rinascimento", 6, "Primo Semestre", 1, False, "M-STO/02"),
    ("LM-84", "Storia dell'Italia contemporanea", 6, "Primo Semestre", 1, False, "M-STO/04"),
    ("LM-84", "Storia del Mediterraneo in età moderna", 6, "Primo Semestre", 1, False, "M-STO/02"),
    ("LM-84", "Storia dell'Europa orientale in età contemporanea", 6, "Primo Semestre", 1, False, "M-STO/03"),
    ("LM-84", "Geografia sociale", 6, "Primo Semestre", 2, False, "M-GGR/01"),
    ("LM-84", "Storia delle religioni", 6, "Primo Semestre", 1, False, "M-STO/06"),
    ("LM-84", "Storia economica della globalizzazione", 6, "Primo Semestre", 1, False, "SECS-P/12"),
    ("LM-84", "Storia economica medievale e moderna", 6, "Primo Semestre", 1, False, "SECS-P/12"),
    ("LM-84", "Workshop Digital Humanities", 6, "Primo Semestre", 2, False, None),
    ("LM-84", "Ambasciatori della storia", 6, "Primo Semestre", 2, False, None),
    ("LM-84", "Tirocinio", 6, "Secondo Semestre", 2, True, None),
    ("LM-84", "Prova finale di laurea", 30, "Annuale", 2, True, None),

    # LM-89 STORIA DELL'ARTE (B384)
    # Year 1
    ("LM-89", "Storia dell'architettura", 6, "Primo Semestre", 1, True, "ICAR/18"),
    ("LM-89", "Storia dell'arte contemporanea", 12, "Annuale", 1, True, "L-ART/03"),
    ("LM-89", "Storia dell'arte medievale (miniatura)", 12, "Annuale", 1, True, "L-ART/01"),
    ("LM-89", "Storia dell'arte medievale (contesti)", 12, "Annuale", 1, True, "L-ART/01"),
    ("LM-89", "Storia della fotografia (teoria, critica, archiviazione)", 12, "Annuale", 1, True, "L-ART/03"),
    ("LM-89", "Storia del disegno e della grafica", 12, "Annuale", 1, True, "L-ART/02"),
    ("LM-89", "Didattica della storia dell'arte", 6, "Primo Semestre", 1, True, "L-ART/04"),
    ("LM-89", "Museologia", 6, "Primo Semestre", 1, True, "L-ART/04"),
    ("LM-89", "Storia della critica d'arte (iconografia e iconologia)", 6, "Primo Semestre", 1, True, "L-ART/04"),
    ("LM-89", "Teoria e storia del restauro", 6, "Primo Semestre", 1, True, "L-ART/04"),
    ("LM-89", "Museologia 2", 6, "Primo Semestre", 1, False, "L-ART/04"),
    ("LM-89", "Storia dell'arte moderna", 6, "Primo Semestre", 1, False, "L-ART/02"),
    ("LM-89", "Storia delle arti applicate e dell'oreficeria", 6, "Primo Semestre", 1, False, "L-ART/02"),
    # Year 2
    ("LM-89", "Laboratorio di critica d'arte in lingua inglese", 6, "Primo Semestre", 2, True, None),
    ("LM-89", "Laboratorio di Digital Humanities", 6, "Primo Semestre", 2, True, None),
    ("LM-89", "Tirocinio", 6, "Secondo Semestre", 2, True, None),
    ("LM-89", "Prova finale di laurea", 30, "Annuale", 2, True, None),

    # LM-50 DIRIGENZA SCOLASTICA (B367)
    # Year 1
    ("LM-50", "Etica della formazione", 6, "Primo Semestre", 1, True, "M-FIL/03"),
    ("LM-50", "Neuropsichiatria dell'infanzia e dell'adolescenza", 6, "Primo Semestre", 1, True, "MED/39"),
    ("LM-50", "Pedagogia di genere", 6, "Primo Semestre", 1, True, "M-PED/01"),
    ("LM-50", "Metodologie della ricerca educativa", 6, "Primo Semestre", 1, True, "M-PED/04"),
    ("LM-50", "Psicologia della disabilità e dell'inclusione", 6, "Primo Semestre", 1, True, "M-PSI/04"),
    ("LM-50", "Diritto amministrativo nel quadro costituzionale", 12, "Annuale", 1, True, "IUS/10"),
    ("LM-50", "Didattica generale per la formazione docente", 6, "Primo Semestre", 1, False, "M-PED/03"),
    ("LM-50", "Pedagogia delle politiche educative e scolastiche", 6, "Primo Semestre", 1, False, "M-PED/01"),
    # Year 2
    ("LM-50", "Storia dei processi formativi con laboratorio di public history of education", 12, "Annuale", 2, True, "M-PED/02"),
    ("LM-50", "Valutazione e autovalutazione delle istituzioni educative", 12, "Annuale", 2, True, "M-PED/04"),
    ("LM-50", "Dirigenza scolastica e leadership inclusiva", 12, "Annuale", 2, True, "M-PED/03"),
    ("LM-50", "Pedagogia per l'inclusione e studi sulla disabilità", 12, "Annuale", 2, True, "M-PED/03"),
    ("LM-50", "Sociologia giuridica e della devianza", 6, "Primo Semestre", 2, False, "SPS/12"),
    ("LM-50", "Sociologia urbana", 6, "Primo Semestre", 2, False, "SPS/10"),
    ("LM-50", "Tirocinio", 6, "Secondo Semestre", 1, True, None),
    ("LM-50", "Prova finale", 12, "Annuale", 2, True, None),

    # LM-57-85 SCIENZE PEDAGOGICHE (B389)
    # Year 1
    ("LM-57-85", "Etica delle organizzazioni", 6, "Primo Semestre", 1, True, "M-FIL/03"),
    ("LM-57-85", "Metodologia della ricerca in educazione e formazione", 12, "Annuale", 1, True, "M-PED/04"),
    ("LM-57-85", "Pedagogia del lavoro", 12, "Annuale", 1, True, "M-PED/01"),
    ("LM-57-85", "Sociologia della formazione sociale e istituzionale", 12, "Annuale", 1, True, "SPS/08"),
    ("LM-57-85", "Fondamenti di educazione degli adulti", 6, "Primo Semestre", 1, False, "M-PED/01"),
    ("LM-57-85", "Modelli di formazione e guidance per la transizione verde", 6, "Primo Semestre", 1, False, "M-PED/04"),
    ("LM-57-85", "Metodi di progettazione e valutazione per la formazione", 6, "Primo Semestre", 1, False, "M-PED/04"),
    ("LM-57-85", "Metodi e tecniche della didattica", 6, "Primo Semestre", 1, False, "M-PED/03"),
    ("LM-57-85", "Metodi e tecniche della formazione online", 6, "Primo Semestre", 1, False, "M-PED/03"),
    ("LM-57-85", "Processi formativi e storia del lavoro", 6, "Primo Semestre", 1, False, "M-PED/02"),
    ("LM-57-85", "Processi formativi e storia delle istituzioni educative", 6, "Primo Semestre", 1, False, "M-PED/02"),
    # Year 2
    ("LM-57-85", "Diritto dell'Unione Europea", 6, "Primo Semestre", 2, True, "IUS/14"),
    ("LM-57-85", "Organizzazione aziendale e sviluppo delle risorse umane", 6, "Primo Semestre", 2, True, "SECS-P/10"),
    ("LM-57-85", "Psicologia del ciclo di vita", 6, "Primo Semestre", 2, True, "M-PSI/04"),
    ("LM-57-85", "Pedagogia dell'innovazione nelle organizzazioni", 6, "Primo Semestre", 2, False, "M-PED/01"),
    ("LM-57-85", "Coordinamento socio-pedagogico dei servizi territoriale", 6, "Primo Semestre", 2, False, "M-PED/01"),
    ("LM-57-85", "Gestione dati e documentazione per le professioni educative", 3, "Primo Semestre", 2, False, "M-PED/02"),
    ("LM-57-85", "Service learning per lo sviluppo sostenibile", 3, "Primo Semestre", 2, False, None),
    ("LM-57-85", "Metodi e tecniche di progettazione e valutazione di impatto", 3, "Primo Semestre", 2, False, "M-PED/04"),
    ("LM-57-85", "Tirocinio", 6, "Secondo Semestre", 2, False, None),
    ("LM-57-85", "Prova finale", 12, "Annuale", 2, True, None),
]


def slugify(name: str) -> str:
    """Create a URL-safe slug from a course name."""
    import urllib.parse
    return urllib.parse.quote(name.replace("'", "").replace("(", "").replace(")", "").replace(",", "").lower())


def generate_courses_ts(courses: list) -> str:
    """Generate TypeScript course entries."""
    lines = []
    prev_program = None
    counter = {}

    for prog, name, cfu, sem, year, req, ssd in courses:
        # Build course ID
        if prog not in counter:
            counter[prog] = 1
        ctr = counter[prog]
        counter[prog] += 1

        # Create ID like: lm2_001, lm15_001, lm36_001
        prefix = prog.lower().replace("-", "").replace(" ", "")[:6]
        cid = f"{prefix}_{ctr:03d}"

        # Description
        desc = f"{name} - {cfu} CFU. {sem}."

        if prog != prev_program:
            if prev_program is not None:
                lines.append("")
            lines.append(f"// ===== {prog} =====")
            prev_program = prog

        lines.append(f"  {{")
        lines.append(f"    id: '{cid}',")
        lines.append(f"    name: \"{name}\",")
        lines.append(f"    professorId: '',")
        lines.append(f"    professorName: '—',")
        lines.append(f"    credits: {cfu},")
        lines.append(f"    semester: '{sem}',")
        lines.append(f"    yearLevel: {year},")
        lines.append(f"    isRequired: {str(req).lower()},")
        lines.append(f"    programCode: '{prog}',")
        lines.append(f"    description: \"{desc}\",")
        if ssd:
            lines.append(f"    ssd: '{ssd}',")
        lines.append(f"  }},")

    return "\n".join(lines)


def generate_programs_ts(programs: list) -> str:
    """Generate TypeScript program entries."""
    lines = []
    for p in programs:
        lines.append(f"  {{")
        lines.append(f"    code: '{p['code']}',")
        lines.append(f"    name: '{p['name']}',")
        lines.append(f"    faculty: '{p['faculty']}',")
        lines.append(f"    totalCredits: {p['totalCredits']},")
        lines.append(f"    description: '{p['name']} - {p['totalCredits']} CFU.',")
        lines.append(f"    president: '{p['president']}',")
        lines.append(f"    courseCount: 0,")
        lines.append(f"    requiredCount: 0,")
        lines.append(f"  }},")
    return "\n".join(lines)


def main():
    print("=== Programs ===")
    print(generate_programs_ts(PROGRAMS))
    print()
    print("=== Courses ===")
    print(generate_courses_ts(COURSES))
    print()
    print(f"Total programs: {len(PROGRAMS)}")
    print(f"Total courses: {len(COURSES)}")


if __name__ == "__main__":
    main()
