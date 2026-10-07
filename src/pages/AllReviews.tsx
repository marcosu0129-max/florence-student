import Layout from '../components/Layout';
import CommunityReviews from '../components/CommunityReviews';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
export default function AllReviews() {
  const { planYear } = useCatalog();
  return <Layout showBack backTo={catalogLink('/', planYear)}><div className="space-y-6"><h1 className="text-3xl font-semibold text-ink text-balance sm:text-4xl">Tutte le recensioni</h1><CommunityReviews /></div></Layout>;
}
