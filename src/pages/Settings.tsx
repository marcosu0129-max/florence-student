import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

export default function Settings() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(false);

  return (
    <Layout showBack={true} backTo="/profile">
      <div className="page-container flex flex-col gap-8">
        {/* Page Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-handwritten text-text-primary text-3xl md:text-4xl"
        >
          Impostazioni
        </motion.h1>

        {/* Account Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-surface-soft rounded-[20px] p-6 shadow-[0_4px_16px_rgba(42,37,32,0.04)] border border-outline-variant/30"
        >
          {/* Avatar + Info Row */}
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar Circle */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2e5ea2] to-[#5a8fd4] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(46,94,162,0.2)]">
              <span className="h-hero text-white text-3xl font-bold">U</span>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-handwritten text-text-primary text-xl">
                Utente Demo
              </h2>
              <p className="text-text-muted t-body text-sm">
                modalita demo
              </p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button className="w-full py-3 px-4 bg-coral text-white h-card text-sm font-medium rounded-full hover:bg-[#d14a3b] transition-colors shadow-[0_4px_12px_rgba(229,91,76,0.2)]">
            Modifica Profilo
          </button>
        </motion.section>

        {/* Preferenze Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col gap-3"
        >
          <h2 className="h-section text-text-primary text-lg">
            Preferenze
          </h2>

          <div className="bg-surface-soft rounded-[20px] shadow-[0_4px_16px_rgba(42,37,32,0.04)] border border-outline-variant/30 overflow-hidden divide-y divide-outline-variant/30">
            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-rose-500" style={{ fontVariationSettings: "'FILL' 0" }}>
                    notifications
                  </span>
                </div>
                <span className="h-card text-text-primary">Notifiche Push</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={() => setPushNotifications(!pushNotifications)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2e5ea2]/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#2e5ea2]" style={{ fontVariationSettings: "'FILL' 0" }}>
                    mail
                  </span>
                </div>
                <span className="h-card text-text-primary">Notifiche Email</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Anonymous Mode */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-400/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400" style={{ fontVariationSettings: "'FILL' 0" }}>
                    visibility_off
                  </span>
                </div>
                <span className="h-card text-text-primary">Modalita Anonima</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={anonymousMode}
                  onChange={() => setAnonymousMode(!anonymousMode)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </motion.section>

        {/* Info Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          <h2 className="h-section text-text-primary text-lg">
            Info
          </h2>

          <div className="bg-surface-soft rounded-[20px] shadow-[0_4px_16px_rgba(42,37,32,0.04)] border border-outline-variant/30 overflow-hidden">
            <Link
              to="/about"
              className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-brand" style={{ fontVariationSettings: "'FILL' 0" }}>
                    info
                  </span>
                </div>
                <div>
                  <span className="h-card text-text-primary">Info su Florence Student</span>
                  <p className="text-text-muted t-label text-[10px] mt-0.5">v1.0.0</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-text-muted">chevron_right</span>
            </Link>
          </div>
        </motion.section>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => (window.location.href = '/login')}
          className="flex items-center justify-center gap-2 py-4 bg-surface-soft text-coral h-card font-medium rounded-full border border-coral/30 hover:bg-coral/5 transition-colors shadow-[0_4px_16px_rgba(229,91,76,0.1)]"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
            logout
          </span>
          Esci dall&apos;account
        </motion.button>
      </div>
    </Layout>
  );
}
