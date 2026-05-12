import { motion } from 'framer-motion';
import Layout from '../components/Layout';

export default function About() {
  return (
    <Layout showBack={true} backTo="/profile">
      <div className="page-container flex flex-col gap-10 pb-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2e5ea2] to-[#5a8fd4] flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_rgba(46,94,162,0.25)]">
            <span className="material-symbols-outlined text-[36px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          <h1 className="font-handwritten text-3xl text-text-primary mb-1">
            Florence Student
          </h1>
          <p className="text-text-muted text-xs t-label">Versione 1.0.0</p>
        </motion.div>

        {/* Mission */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[14px] leading-relaxed text-text-secondary t-body">
            Una piattaforma creata da studenti per studenti dell&apos;Università di Firenze. Aiutiamo a scegliere i corsi con recensioni oneste e informazioni sui docenti.
          </p>
        </motion.section>

        {/* Features — minimal grid */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: 'star', label: 'Recensioni corsi', color: '#F0A93D' },
              { icon: 'groups', label: 'Docenti', color: '#8c4e36' },
              { icon: 'folder_open', label: 'Materiali', color: '#6BAFA3' },
              { icon: 'favorite', label: 'Corsi salvati', color: '#E55B4C' },
            ].map((item) => (
              <div key={item.label} className="bg-surface-soft rounded-[16px] p-4 flex flex-col items-center gap-2 text-center">
                <span className="material-symbols-outlined text-[22px]" style={{ color: item.color, fontVariationSettings: "'FILL' 1" }}>
                  {item.icon}
                </span>
                <span className="text-[13px] text-text-secondary t-body">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Contact */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3"
        >
          <a
            href="mailto:marcosu0129@gmail.com"
            className="flex items-center gap-3 text-coral hover:text-danger text-[14px] transition-colors"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>mail</span>
            marcosu0129@gmail.com
          </a>
          <a
            href="https://instagram.com/sumarcoooo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-coral hover:text-danger text-[14px] transition-colors"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>link</span>
            @sumarcoooo
          </a>
        </motion.section>

        {/* Footer */}
        <footer className="text-center pt-6 border-t border-outline-variant/30">
          <p className="text-[12px] text-text-muted t-label">
            2024 Florence Student
          </p>
        </footer>
      </div>
    </Layout>
  );
}
