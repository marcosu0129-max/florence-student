import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import { resources } from '../data/mockData';

const RESOURCE_TYPES = [
  { label: 'Tutti', value: 'all' },
  { label: 'PDF', value: 'pdf' },
  { label: 'DOC', value: 'doc' },
  { label: 'AUDIO', value: 'audio' },
];

const TYPE_ICONS: Record<string, string> = {
  pdf: 'picture_as_pdf',
  doc: 'description',
  audio: 'audio_file',
  video: 'video_file',
  image: 'image',
};

const TYPE_COLORS: Record<string, { bg: string; icon: string }> = {
  pdf: { bg: 'bg-amber/20', icon: 'text-amber' },
  doc: { bg: 'bg-primary/10', icon: 'text-primary' },
  audio: { bg: 'bg-coral/10', icon: 'text-coral' },
  video: { bg: 'bg-purple/20', icon: 'text-purple' },
  image: { bg: 'bg-pink/20', icon: 'text-pink' },
};

const CATEGORY_LABELS: Record<string, string> = {
  pdf: 'APPUNTI',
  doc: 'SLIDE',
  audio: 'AUDIO',
  video: 'VIDEO',
  image: 'IMMAGINE',
};

export default function Materials() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');

  const filtered = resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.uploader.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      activeType === 'all' || r.type === activeType;
    return matchesSearch && matchesType;
  });

  return (
    <Layout>
      <div className="min-h-screen flex flex-col gap-6 pb-32 md:pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="h-hero text-3xl text-text-primary">
            Centro Materiali
          </h1>
          <p className="text-text-muted t-label text-xs mt-2">
            Scarica appunti, esercizi e temi d&apos;esame condivisi dagli studenti.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <SearchBar
            placeholder="Cerca materiali..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          {RESOURCE_TYPES.map((type) => (
            <motion.button
              key={type.value}
              onClick={() => setActiveType(type.value)}
              whileTap={{ scale: 0.95 }}
              className={`
                px-4 py-2 text-[13px] h-card font-medium rounded-full border transition-all flex-shrink-0
                ${activeType === type.value
                  ? 'bg-coral text-white border-coral shadow-[0_2px_8px_rgba(229,91,76,0.3)]'
                  : 'bg-surface-soft text-text-secondary border-surface-variant hover:border-outline-variant'
                }
              `}
            >
              {type.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Materials Grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-surface-cream flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-text-muted" style={{ fontVariationSettings: "'FILL' 1" }}>
                folder_open
              </span>
            </div>
            <div className="text-center">
              <h3 className="h-card font-semibold text-lg text-text-primary mb-1">
                Nessun materiale
              </h3>
              <p className="text-text-muted t-label text-xs max-w-xs">
                Prova a cercare con altre parole chiave o contribuisci caricando tu!
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((resource, index) => {
              const typeColor = TYPE_COLORS[resource.type] || TYPE_COLORS.pdf;
              const typeIcon = TYPE_ICONS[resource.type] || TYPE_ICONS.pdf;
              const categoryLabel = CATEGORY_LABELS[resource.type] || resource.type.toUpperCase();

              return (
                <motion.article
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-surface-soft rounded-[20px] p-5 shadow-[0_4px_16px_rgba(42,37,32,0.04)] hover:shadow-[0_8px_24px_rgba(42,37,32,0.08)] transition-all duration-300"
                >
                  {/* Type Icon & Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-full ${typeColor.bg} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined text-[24px] ${typeColor.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {typeIcon}
                      </span>
                    </div>
                    <span className="text-[10px] h-card font-semibold px-2.5 py-1 rounded-full bg-surface-container text-text-secondary uppercase tracking-wide">
                      {categoryLabel}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="h-card font-semibold text-[15px] text-text-primary mb-2 line-clamp-2">
                    {resource.title}
                  </h3>

                  {/* Description */}
                  {resource.description && (
                    <p className="text-[13px] text-text-muted t-label mb-4 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-[12px] text-text-muted t-label mb-4 pt-3 border-t border-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      {resource.uploader}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      {resource.downloads}
                    </span>
                  </div>

                  {/* Download Button */}
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-coral text-white h-card font-medium text-[14px] rounded-[20px] hover:bg-danger transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Scarica
                  </motion.button>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* FAB */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 md:bottom-8 right-4 w-14 h-14 bg-coral text-white rounded-full shadow-[0_4px_16px_rgba(229,91,76,0.4)] flex items-center justify-center hover:bg-danger transition-colors z-40"
          aria-label="Carica materiale"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </motion.button>
      </div>
    </Layout>
  );
}
