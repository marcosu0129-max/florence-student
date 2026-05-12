import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';

interface Notification {
  id: number;
  icon: string;
  iconBg: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    icon: 'rate_review',
    iconBg: 'bg-brand',
    title: 'Nuova risposta alla tua recensione',
    content: "Qualcuno ha trovato utile la tua recensione su Linguistica Generale.",
    time: '2 ore fa',
    read: false,
  },
  {
    id: 2,
    icon: 'folder',
    iconBg: 'bg-mint-deep',
    title: 'Nuovo materiale disponibile',
    content: 'Il Prof. Verdi ha caricato nuove slide per Letteratura Italiana I.',
    time: 'Ieri',
    read: false,
  },
  {
    id: 3,
    icon: 'school',
    iconBg: 'bg-amber',
    title: 'Nuovo corso disponibile',
    content: "E' stato aggiunto Semiotica del Testo al tuo programma.",
    time: '3 giorni fa',
    read: true,
  },
  {
    id: 4,
    icon: 'settings',
    iconBg: 'bg-surface-variant',
    title: 'Aggiornamento app',
    content: 'Florence Student v1.0.1 ora disponibile con nuove funzionalita',
    time: '1 settimana fa',
    read: true,
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Layout showBack={true} backTo="/profile">
      <div className="page-container flex flex-col gap-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
          className="flex justify-between items-center"
        >
          <h1 className="h-hero text-text-primary">
            Notifiche
          </h1>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={markAllAsRead}
                className="text-brand h-card text-sm font-medium hover:underline"
              >
                Segna tutte come lette
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Notifications List */}
        <div className="flex flex-col gap-4">
          {notifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1] as const,
              }}
              className={`
                bg-white rounded-2xl p-5 flex gap-4 shadow-sm border-2
                transition-all duration-300 hover:shadow-md
                ${notif.read ? 'border-surface-variant' : 'border-brand'}
              `}
            >
              {/* Unread Indicator */}
              {!notif.read && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute top-5 left-4 w-2.5 h-2.5 bg-brand rounded-full"
                  style={{
                    boxShadow: '0 0 8px rgba(46, 94, 162, 0.5)',
                  }}
                />
              )}

              {/* Icon Container */}
              <div
                className={`w-10 h-10 rounded-xl ${notif.iconBg} flex items-center justify-center shrink-0 relative`}
              >
                <span
                  className="material-symbols-outlined text-lg text-white"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  {notif.icon}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                  <h3 className="h-card text-text-primary font-semibold text-[15px] leading-tight">
                    {notif.title}
                  </h3>
                  <span className="text-[11px] text-text-muted t-label shrink-0">
                    {notif.time}
                  </span>
                </div>
                <p className="text-[13px] text-text-secondary t-body mt-2">
                  {notif.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-surface-cream flex items-center justify-center">
              <span
                className="material-symbols-outlined text-4xl text-text-muted"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                notifications_off
              </span>
            </div>
            <div className="text-center">
              <h3 className="h-card font-semibold text-text-primary mb-1">
                Nessuna notifica
              </h3>
              <p className="text-text-muted t-body text-sm max-w-xs">
                Quando riceverai notifiche, appariranno qui.
              </p>
            </div>
          </motion.div>
        )}

        {/* All Read State */}
        {notifications.length > 0 && unreadCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center py-12 gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-surface-cream flex items-center justify-center">
              <span
                className="material-symbols-outlined text-3xl text-text-muted"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                notifications_paused
              </span>
            </div>
            <p className="text-text-muted t-body text-sm text-center">
              Hai letto tutte le notifiche
            </p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
