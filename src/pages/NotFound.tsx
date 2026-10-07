import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';

export default function NotFound() {
  const { planYear } = useCatalog();
  return <Layout><div className="py-12"><h1 className="text-3xl font-semibold">Pagina non trovata</h1><p className="mt-4 text-text">Il collegamento non corrisponde a una pagina disponibile.</p><Link to={catalogLink('/', planYear)} className="mt-6 inline-block underline underline-offset-4">Torna alla home</Link></div></Layout>;
}
