import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProfessorById, createProfessorReview } from '../lib/dataService';

function StarRatingInput({
  label, icon, value, onChange, activeColor,
}: {
  label: string; icon?: string; value: number; onChange: (v: number) => void; activeColor: string;
}) {
  return (
    <div className="bg-canvas border border-surface-container rounded-xl px-5 py-4 shadow-card flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="material-symbols-outlined" style={{ color: activeColor, fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        )}
        <span className="font-card-title text-card-title text-ink">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="material-symbols-outlined text-[22px] transition-all duration-150 cursor-pointer p-0.5 hover:scale-110"
            style={{
              fontVariationSettings: `'FILL' ${i < value ? 1 : 0}`,
              color: i < value ? activeColor : '#d8c2bb',
            }}
          >
            star
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AddProfessorReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chiarezza, setChiarezza] = useState(3);
  const [disponibilita, setDisponibilita] = useState(3);
  const [equita, setEquita] = useState(3);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchProfessorById(id).then((data) => {
      setProfessor(data);
      setLoading(false);
    });
  }, [id]);

  const canSubmit = content.length >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !id) return;
    setIsSubmitting(true);
    setError('');
    const result = await createProfessorReview({
      professorId: id,
      chiarezzaScore: chiarezza,
      disponibilitaScore: disponibilita,
      equitaScore: equita,
      content,
    });
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error || 'Errore di connessione. Riprova.');
      return;
    }
    navigate(`/professors/${id}`);
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute bottom-[15%] left-[10%] rotate-12 opacity-60 pointer-events-none hidden sm:block">
        <span className="text-6xl">&#9733;</span>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-card-base rounded-xl p-card-padding shadow-card rotate-1">
          <div className="text-center mb-8">
            <h1 className="font-h1-editorial text-[36px] md:text-[48px] text-ink mb-2">La tua<br/>valutazione</h1>
            {professor && (
              <p className="font-body-main text-body-main text-text-muted mt-2">
                per <span className="font-semibold text-ink">{professor.name}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-canvas rounded-2xl p-6 shadow-card space-y-3">
              <h2 className="font-h2-section text-h2-section text-ink mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-pop-yellow" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                Valuta il Docente
              </h2>
              <StarRatingInput label="Chiarezza" icon="lightbulb" value={chiarezza} onChange={setChiarezza} activeColor="#4F8BFF" />
              <StarRatingInput label="Disponibilita" icon="support_agent" value={disponibilita} onChange={setDisponibilita} activeColor="#4ADE80" />
              <StarRatingInput label="Equita" icon="balance" value={equita} onChange={setEquita} activeColor="#FF6B35" />
            </div>

            <div>
              <h2 className="font-h2-section text-h2-section text-ink mb-3">
                Descrizione dell&apos;esperienza
              </h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Racconta la tua esperienza con questo docente..."
                rows={5}
                className="w-full bg-canvas border border-outline-variant rounded-xl p-4 font-body-main text-body-main text-ink placeholder:text-text-faint focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 transition-all resize-none shadow-card"
              />
              <p className={`text-[12px] mt-2 font-semibold ${content.length < 20 ? 'text-error' : 'text-pop-green'}`}>
                {content.length < 20 ? `Almeno 20 caratteri (${content.length}/20)` : '\u2713 Requisito raggiunto'}
              </p>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 rounded-xl p-4">
                <p className="text-[14px] text-error font-semibold text-center">{error}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-surface-container hover:bg-surface-container-high text-ink font-card-title text-card-title py-3 px-6 rounded-full transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={`bg-ink text-canvas font-card-title text-card-title py-3 px-8 rounded-full shadow-card transition-all ${
                  !canSubmit || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-ink-soft'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                    Invio...
                  </span>
                ) : 'Invia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
