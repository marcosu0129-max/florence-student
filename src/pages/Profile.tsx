import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BottomSheet from '../components/BottomSheet';
import HoverTextSwap from '../components/HoverTextSwap';
import { getSavedCourseIds, fetchUserReviews, fetchCourses } from '../lib/dataService';

const FACULTIES = [
  'Scuola di Studi Umanistici e della Formazione',
  'Facolta di Economia',
  'Facolta di Giurisprudenza',
  'Facolta di Scienze Politiche',
  'Facolta di Ingegneria',
  'Facolta di Scienze Matematiche, Fisiche e Naturali',
];

const YEARS = Array.from({ length: 12 }, (_, i) => String(2015 + i));

export default function Profile() {
  const navigate = useNavigate();
  const [savedCount, setSavedCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editName, setEditName] = useState('Studente Demo');
  const [editFaculty, setEditFaculty] = useState(FACULTIES[0]);
  const [editYear, setEditYear] = useState('2023');

  useEffect(() => {
    const saved = getSavedCourseIds();
    setSavedCount(saved.length);
    Promise.all([fetchUserReviews(), fetchCourses()]).then(([userReviews, courses]) => {
      const courseMap: Record<string, string> = {};
      for (const c of courses) courseMap[c.id] = c.name;
      const enriched = userReviews.map((r) => ({
        ...r,
        courseName: r.courseName || courseMap[r.courseId] || 'Corso',
      }));
      setReviews(enriched);
      setIsLoading(false);
    });
  }, []);

  const recentReviews = reviews.slice(0, 3);

  return (
    <Layout>
      <div className="flex flex-col gap-16 md:gap-20">

        {/* User Header */}
        <section className="flex flex-col items-center text-center -rotate-1">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-4 shadow-card">
            <span className="text-4xl font-black text-ink">{editName.charAt(0).toUpperCase()}</span>
          </div>
          <h1 className="font-h1-editorial text-h1-editorial text-ink mb-2">{editName}</h1>
          <p className="font-body-main text-body-main text-text-muted mb-1">{editFaculty}</p>
          <p className="font-body-main text-body-main text-text-muted mb-6">Iscritto {editYear}</p>
          <button
            onClick={() => setEditSheetOpen(true)}
            className="px-6 py-2.5 bg-ink text-canvas text-sm font-semibold rounded-full hover:bg-ink-soft transition-colors shadow-float"
          >
            Modifica profilo
          </button>
        </section>

        {/* My Activity */}
        <section className="grid grid-cols-2 gap-6">
          <Link
            to="/profile/saved"
            className="bg-card-base border border-border-card rounded-xl p-card-padding text-center shadow-card hover:shadow-float transition-all duration-300 rotate-1"
          >
            <div className="font-data-display text-data-display text-ink leading-none mb-2">{savedCount}</div>
            <p className="font-body-main text-body-main text-text-muted">Corsi salvati</p>
          </Link>
          <Link
            to="/my-reviews"
            className="bg-card-base border border-border-card rounded-xl p-card-padding text-center shadow-card hover:shadow-float transition-all duration-300 -rotate-1"
          >
            <div className="font-data-display text-data-display text-ink leading-none mb-2">{reviews.length}</div>
            <p className="font-body-main text-body-main text-text-muted">Recensioni</p>
          </Link>
        </section>

        {/* Settings & Info */}
        <section className="flex flex-col gap-10">
          {/* Impostazioni */}
          <div className="text-center">
            <h2 className="font-h2-section text-h2-section text-ink mb-5">Impostazioni</h2>
            <div className="inline-flex flex-wrap justify-center gap-3">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-card-base rounded-full border border-outline-variant shadow-card hover:shadow-float hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">
                <span className="material-symbols-outlined text-base text-text-muted" style={{ fontVariationSettings: "'FILL' 0" }}>translate</span>
                <span className="font-body-main text-body-main text-ink">Lingua</span>
                <span className="font-body-main text-body-main text-text-muted">Italiano</span>
              </button>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-card-base rounded-full border border-outline-variant shadow-card">
                <span className="font-body-main text-body-main text-ink">Versione</span>
                <span className="font-body-main text-body-main text-text-muted">v1.0</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="text-center">
            <h2 className="font-h2-section text-h2-section text-ink mb-5">Info</h2>
            <div className="inline-flex flex-wrap justify-center gap-3">
              <Link
                to="/profile/about"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-card-base rounded-full border border-outline-variant shadow-card hover:shadow-float hover:scale-105 active:scale-95 transition-all duration-200"
                onMouseEnter={(e) => {
                  const visible = e.currentTarget.querySelector('.hts-label--visible');
                  const hidden = e.currentTarget.querySelector('.hts-label--hidden');
                  if (visible) (visible as HTMLElement).style.opacity = '0';
                  if (hidden) (hidden as HTMLElement).style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const visible = e.currentTarget.querySelector('.hts-label--visible');
                  const hidden = e.currentTarget.querySelector('.hts-label--hidden');
                  if (visible) (visible as HTMLElement).style.opacity = '1';
                  if (hidden) (hidden as HTMLElement).style.opacity = '0';
                }}
              >
                <span className="material-symbols-outlined text-base text-text-muted" style={{ fontVariationSettings: "'FILL' 0" }}>info</span>
                <span className="whitespace-nowrap"><HoverTextSwap visible="Chi siamo" hidden="SCOPRI" /></span>
              </Link>
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-card-base rounded-full border border-outline-variant shadow-card hover:shadow-float hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer min-w-[188px] justify-center"
                onMouseEnter={(e) => {
                  const visible = e.currentTarget.querySelector('.hts-label--visible');
                  const hidden = e.currentTarget.querySelector('.hts-label--hidden');
                  if (visible) (visible as HTMLElement).style.opacity = '0';
                  if (hidden) (hidden as HTMLElement).style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const visible = e.currentTarget.querySelector('.hts-label--visible');
                  const hidden = e.currentTarget.querySelector('.hts-label--hidden');
                  if (visible) (visible as HTMLElement).style.opacity = '1';
                  if (hidden) (hidden as HTMLElement).style.opacity = '0';
                }}
              >
                <span className="material-symbols-outlined text-base text-text-muted" style={{ fontVariationSettings: "'FILL' 0" }}>shield</span>
                <span className="whitespace-nowrap"><HoverTextSwap visible="Privacy" hidden="DATI SICURI" /></span>
              </button>
              <a
                href="https://instagram.com/sumarcoooo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-card-base rounded-full border border-outline-variant shadow-card hover:shadow-float hover:scale-105 active:scale-95 transition-all duration-200"
                onMouseEnter={(e) => {
                  const visible = e.currentTarget.querySelector('.hts-label--visible');
                  const hidden = e.currentTarget.querySelector('.hts-label--hidden');
                  if (visible) (visible as HTMLElement).style.opacity = '0';
                  if (hidden) (hidden as HTMLElement).style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const visible = e.currentTarget.querySelector('.hts-label--visible');
                  const hidden = e.currentTarget.querySelector('.hts-label--hidden');
                  if (visible) (visible as HTMLElement).style.opacity = '1';
                  if (hidden) (hidden as HTMLElement).style.opacity = '0';
                }}
              >
                <span className="material-symbols-outlined text-base text-text-muted" style={{ fontVariationSettings: "'FILL' 0" }}>link</span>
                <span className="whitespace-nowrap"><HoverTextSwap visible="Contattaci" hidden="SCRIVICI!" /></span>
              </a>
            </div>
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center justify-center gap-2 py-4 bg-card-base text-ink font-card-title text-card-title rounded-xl border border-outline-variant hover:bg-surface-container transition-colors shadow-card"
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
          Esci
        </button>
      </div>

      {/* Edit Profile Bottom Sheet */}
      <BottomSheet open={editSheetOpen} onClose={() => setEditSheetOpen(false)} title="Modifica profilo">
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2">Nome</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-canvas border border-outline-variant rounded-xl px-4 py-3 text-[14px] text-ink placeholder:text-text-faint focus:outline-none focus:border-ink transition-colors shadow-card"
              placeholder="Il tuo nome"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2">Facolta</label>
            <select
              value={editFaculty}
              onChange={(e) => setEditFaculty(e.target.value)}
              className="w-full bg-canvas border border-outline-variant rounded-xl px-4 py-3 text-[14px] text-ink focus:outline-none focus:border-ink transition-colors shadow-card"
            >
              {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide mb-2">Anno di immatricolazione</label>
            <select
              value={editYear}
              onChange={(e) => setEditYear(e.target.value)}
              className="w-full bg-canvas border border-outline-variant rounded-xl px-4 py-3 text-[14px] text-ink focus:outline-none focus:border-ink transition-colors shadow-card"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={() => setEditSheetOpen(false)}
            className="w-full bg-ink text-canvas font-card-title text-card-title py-3 rounded-full hover:bg-ink-soft transition-colors shadow-card"
          >
            Salva
          </button>
        </div>
      </BottomSheet>
    </Layout>
  );
}
