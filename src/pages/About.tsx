import Icon from '../components/Icon';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';

const FEATURES = [
  { icon: 'school', label: 'Piani di studio', description: 'Percorsi della Scuola di Studi Umanistici e della Formazione e fonti ufficiali.', to: '/' },
  { icon: 'groups', label: 'Docenti', description: 'Gli insegnamenti e i profili pubblicati.', to: '/professors' },
  { icon: 'bookmark', label: 'Corsi salvati', description: 'Preferiti locali e sincronizzazione con il tuo account.', to: '/profile/saved' },
  { icon: 'folder_open', label: 'Materiali', description: 'Documenti condivisi dagli studenti, con accesso e moderazione.', to: '/materials' },
];

export default function About() {
  const { planYear } = useCatalog();

  return (
    <Layout showBack backTo="/profile">
      <div className="flex flex-col gap-8">
        <header>
          <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-card-base text-ink">
            <Icon name="school" size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-semibold text-ink text-balance">
            Florence Student
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text text-pretty">
            Un progetto per gli studenti dell&apos;Università di Firenze.
            Esplora i corsi di laurea della Scuola di Studi Umanistici e della Formazione, consulta i docenti e salva gli insegnamenti che ti interessano.
          </p>
        </header>

        <section aria-labelledby="about-features">
          <h2 id="about-features" className="mb-4 text-xl font-semibold text-ink text-balance">
            Esplora Florence Student
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEATURES.map(item => (
              <li key={item.to}>
                <Link
                  to={catalogLink(item.to, planYear)}
                  className="flex h-full items-start gap-4 rounded-2xl border border-border-card bg-card-base p-5 transition-colors duration-150 hover:bg-surface-container"
                >
                  <Icon name={item.icon} size={20} className="text-ink" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-5 text-ink">{item.label}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-text text-pretty">{item.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="about-contact" className="flex flex-col gap-3">
          <h2 id="about-contact" className="text-xl font-semibold text-ink text-balance">Contatti</h2>
          <a
            href="mailto:marcosu0129@gmail.com"
            className="flex min-h-11 items-center gap-3 self-start text-sm text-text underline underline-offset-4 hover:text-ink"
          >
            <Icon name="mail" size={20} />
            <span className="min-w-0 break-all">marcosu0129@gmail.com</span>
          </a>
          <a
            href="https://instagram.com/sumarcoooo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-3 self-start text-sm text-text underline underline-offset-4 hover:text-ink"
          >
            <Icon name="open_in_new" size={20} />
            @sumarcoooo <span className="sr-only">(si apre in una nuova scheda)</span>
          </a>
        </section>

        <footer className="border-t border-outline-variant pt-6">
          <p className="text-xs text-text">Florence Student · Progetto in sviluppo</p>
        </footer>
      </div>
    </Layout>
  );
}
