import { motion } from 'motion/react';
import { useReducedMotionPreference } from '../lib/reducedMotion';
import { Link, useLocation } from 'react-router-dom';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';

import { activeNavPath, type ReturnNavigationState } from '../lib/navigation';
import Icon from './Icon';

export default function TopNav({ backTo, showBack, backState = { restoreScroll: true } }: { backTo: string; showBack: boolean; backState?: ReturnNavigationState }) {
  const { pathname } = useLocation();
  const reducedMotion = useReducedMotionPreference();
  const { planYear, programKey } = useCatalog();
  const tabs = [{ path: '/', label: 'Home', active: activeNavPath(pathname) === '/' }, { path: '/courses', label: 'Corsi', active: activeNavPath(pathname) === '/courses' }, { path: '/professors', label: 'Docenti', active: activeNavPath(pathname) === '/professors' }, { path: '/profile', label: 'Profilo', active: activeNavPath(pathname) === '/profile' }];
  return <header className="w-full"><div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-margin-desktop gap-6">
    <div>{showBack && <Link to={backTo} state={backState} className="text-sm text-text flex items-center gap-2"><Icon name="arrow_back" size={20} />Indietro</Link>}</div>
    <nav aria-label="Navigazione principale" className="flex items-center gap-8">{tabs.map(tab => <Link key={tab.path} to={catalogLink(tab.path, planYear, programKey)} aria-current={tab.active ? 'page' : undefined} className={`relative isolate inline-flex min-h-11 items-center rounded-full px-4 font-top-nav ${tab.active ? 'text-ink' : 'text-text'}`}>{tab.active && <motion.span aria-hidden="true" layoutId="desktop-navigation-selection" className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-card-base" transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }} />}{tab.label}</Link>)}</nav>
  </div></header>;
}
