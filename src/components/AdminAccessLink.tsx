import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { fetchAdminRole } from '../lib/materialsApi';
import Icon from './Icon';

/** UI discoverability only; every admin read/write independently enforces the server role. */
export default function AdminAccessLink({ userId, checking = false, className }: { userId?: string; checking?: boolean; className?: string }) {
  const { planYear } = useCatalog();
  const [allowedUser, setAllowedUser] = useState('');
  useEffect(() => {
    setAllowedUser('');
    if (!userId || checking) return;
    let active = true;
    fetchAdminRole().then(allowed => { if (active && allowed === true) setAllowedUser(userId); }).catch(() => {});
    return () => { active = false; };
  }, [userId, checking]);
  if (checking || !userId || allowedUser !== userId) return null;
  return <Link to={catalogLink('/admin', planYear)} className={className || 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-outline-variant bg-card-base px-5 py-2.5 text-ink'}><Icon name="shield" size={20} /><span className="min-w-0 text-left">Moderazione</span></Link>;
}
