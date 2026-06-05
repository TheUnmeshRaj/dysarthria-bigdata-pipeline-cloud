import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ChevronRight,
  Database,
  Server,
  Cpu,
  Globe,
  BookOpen,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { staggerContainer } from '../animations/variants';

interface GalleryItem {
  src: string;
  title: string;
  caption: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: '/figures/cloud_deployment_architecture.png',
    title: 'Cloud Deployment Architecture',
    caption: 'Overall cloud deployment structure and secure API routing.',
  },
  {
    src: '/figures/cloud_dataflow_smmary.png',
    title: 'Cloud Dataflow Summary',
    caption: 'Summary of the dataflow pipeline from frontend intake to HF inference and MongoDB Atlas cache.',
  },
  {
    src: '/figures/architecture_block_diagram.png',
    title: 'Architecture Diagram',
    caption: 'Overall cloud deployment and pipeline architecture.',
  },
  {
    src: '/figures/asr_pipeline_vs_dysarthria.png',
    title: 'ASR vs Dysarthria',
    caption: 'Comparing standard ASR challenges with dysarthric speech adaptions.',
  },
  {
    src: '/figures/data_pipeline_augmentation.png',
    title: 'Data Pipeline & Augmentation',
    caption: 'Speech augmentation workflows and noise injection filters.',
  },
  {
    src: '/figures/system_pipeline_flow.png',
    title: 'System Pipeline Flow',
    caption: 'The logical data intake and model serving pipeline.',
  },
  {
    src: '/figures/mel_spectrogram_example.png',
    title: 'Mel Spectrogram Example',
    caption: 'Feature extraction visualization of audio speech frequencies.',
  },
  {
    src: '/figures/waveform_vs_spectrogram.png',
    title: 'Waveform vs Spectrogram',
    caption: 'Acoustic waveforms compared alongside their spectrogram transforms.',
  },
  {
    src: '/figures/whisper_architecture.png',
    title: 'Whisper Model Architecture',
    caption: 'Encoder-decoder block diagram of the transformer foundation model.',
  },
];

export default function ProjectDetails() {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-6 py-12 space-y-20"
    >
      {/* SECTION 2: WHY THIS MATTERS */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Why Dysarthric Speech Is Challenging
          </h2>
          <div className="w-12 h-0.5 bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-purple)] mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4 text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              Dysarthria is a motor speech impairment caused by neurological conditions such as stroke, traumatic brain injury, cerebral palsy, Parkinson's disease, or ALS. It limits the fine muscle control needed to produce speech.
            </p>
            <ul className="space-y-2.5 list-disc pl-5">
              <li>Articulation becomes slurred, distorted, or heavily prolonged.</li>
              <li>Atypical vocal rhythms make it difficult for standard systems to recognize word boundaries.</li>
              <li>Commercial speech-to-text algorithms (Google, Siri, Alexa) are trained on typical speech profiles and perform extremely poorly.</li>
              <li>This creates a severe digital and social communication barrier for millions globally.</li>
            </ul>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {/* Stat Card 1 */}
            <div className="glass-card p-4 flex flex-col justify-between border-l-4 border-cyan-500">
              <span className="text-xs uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Normal Speech ASR</span>
              <span className="text-2xl font-bold text-[var(--color-accent-cyan)] mt-1">15–20% WER</span>
              <span className="text-[10px] text-[var(--color-text-secondary)] mt-1">Average commercial Word Error Rate</span>
            </div>

            {/* Stat Card 2 */}
            <div className="glass-card p-4 flex flex-col justify-between border-l-4 border-red-500">
              <span className="text-xs uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Dysarthric Speech ASR</span>
              <span className="text-2xl font-bold text-[var(--color-error)] mt-1">30–70% WER</span>
              <span className="text-[10px] text-[var(--color-text-secondary)] mt-1">Unadapted model failure rates</span>
            </div>

            {/* Stat Card 3 */}
            <div className="glass-card p-4 flex flex-col justify-between border-l-4 border-purple-500">
              <span className="text-xs uppercase font-semibold text-[var(--color-text-tertiary)] tracking-wider">Acoustic Scarcity</span>
              <span className="text-2xl font-bold text-[var(--color-accent-purple)] mt-1">Only ~16 Speakers</span>
              <span className="text-[10px] text-[var(--color-text-secondary)] mt-1">UASpeech dataset limits training size</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: WHAT WE BUILT */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            What Makes This Different?
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto">
            This project is not a generic Whisper setup. It incorporates research-driven adaptions to optimize transcription for slurred articulation.
          </p>
          <div className="w-12 h-0.5 bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-purple)] mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card p-5 space-y-2">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Whisper Small Foundation
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Utilizes OpenAI's multi-lingual Transformer-based sequence-to-sequence speech model as our robust acoustic encoder base.
            </p>
          </div>

          <div className="glass-card p-5 space-y-2">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              LoRA Fine-Tuning
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Applies Low-Rank Adaptation (LoRA) to adapt the Whisper attention blocks, preserving pre-trained weights while modeling atypical phonemes.
            </p>
          </div>

          <div className="glass-card p-5 space-y-2">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Data Augmentation
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Combines pitch-shifting, time-stretching, and dynamic range compression to artificially expand dysarthric vocal datasets.
            </p>
          </div>

          <div className="glass-card p-5 space-y-2">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Synthetic Speech Generation
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Generates artificial dysarthric voice samples to solve dataset scarcity and provide the model with dense atypical audio signals.
            </p>
          </div>

          <div className="glass-card p-5 space-y-2">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Noise Robustness
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Injects environmental noise and dynamic filters during training, ensuring transcription accuracy in real-world environments.
            </p>
          </div>

          <div className="glass-card p-5 space-y-2">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Cloud-Based Deployment
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Features an end-to-end cloud pipeline deploying model endpoints, databases, and microservices for scalable assistive utilities.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW THE SYSTEM WORKS */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            System Workflow
          </h2>
          <div className="w-12 h-0.5 bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-purple)] mx-auto" />
        </div>

        <div className="glass-card p-6 md:p-8 space-y-8">
          <div className="max-w-3xl mx-auto border border-[var(--color-border-default)] rounded-xl overflow-hidden bg-black/30">
            <img
              src="/figures/cloud_deployment_architecture.png"
              alt="Cloud Deployment Architecture diagram"
              className="w-full h-auto cursor-zoom-in hover:scale-[1.01] transition-transform duration-300"
              onClick={() => setSelectedImage(GALLERY_ITEMS[0])}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Execution Stages:</h3>
              <ol className="space-y-2 text-xs md:text-sm text-[var(--color-text-secondary)] list-decimal pl-5">
                <li>User uploads dysarthric audio or video file via the dashboard.</li>
                <li>The FastAPI server ingests the upload and coordinates processing.</li>
                <li>The audio is split and processed by the Whisper-LoRA model on Hugging Face Spaces.</li>
                <li>The acoustic model transcribes the slurred phonemes.</li>
                <li>Transcripts and runtime metadata are cached and stored in MongoDB Atlas.</li>
                <li>The formatted transcripts are returned dynamically to the frontend dashboard.</li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Horizontal Pipeline Flow:</h3>
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-950/40 border border-[var(--color-border-default)] font-mono text-[10px] md:text-xs">
                <span className="px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/20 text-[var(--color-accent-cyan)] flex items-center gap-1">
                  <Globe className="w-3 h-3" /> User
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                <span className="px-2.5 py-1 rounded bg-purple-950/40 border border-purple-500/20 text-[var(--color-accent-purple)] flex items-center gap-1">
                  <Server className="w-3 h-3" /> FastAPI
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                <span className="px-2.5 py-1 rounded bg-blue-950/40 border border-blue-500/20 text-[var(--color-accent-blue)] flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Hugging Face
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                <span className="px-2.5 py-1 rounded bg-green-950/40 border border-green-500/20 text-[var(--color-success)] flex items-center gap-1">
                  <Database className="w-3 h-3" /> MongoDB
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                <span className="px-2.5 py-1 rounded bg-pink-950/40 border border-pink-500/20 text-[var(--color-accent-pink)] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Results
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: PROJECT GALLERY */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Project Development & Deployment
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto">
            Review the research models, database structures, and deployment dashboards backing this cloud platform.
          </p>
          <div className="w-12 h-0.5 bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-purple)] mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_ITEMS.map((item, index) => (
            <motion.div
              key={`gallery-${index}`}
              className="glass-card overflow-hidden group cursor-pointer border border-[var(--color-border-default)] hover:border-[var(--color-border-glow)] transition-all duration-300"
              whileHover={{ y: -4 }}
              onClick={() => setSelectedImage(item)}
            >
              <div className="h-44 overflow-hidden relative bg-black/40 flex items-center justify-center border-b border-[var(--color-border-default)]">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageIcon className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="p-4 space-y-1 text-left">
                <h3 className="font-bold text-xs uppercase text-[var(--color-text-primary)] tracking-wider group-hover:text-[var(--color-accent-cyan)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                  {item.caption}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 6: RESEARCH IMPACT */}
      <section className="space-y-8 max-w-4xl mx-auto">
        <div className="glass-card p-6 md:p-8 space-y-6 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center justify-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--color-accent-purple)] animate-pulse-glow" />
              Research Contribution
            </h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-purple)] mx-auto" />
          </div>

          <div className="space-y-4 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
            <p>
              This project addresses a real accessibility challenge by adapting state-of-the-art speech recognition models to dysarthric speech.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mt-6">
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Parameter-efficient LoRA fine-tuning of Whisper.</span>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Acoustic data augmentation tackling sparsity.</span>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">End-to-end cloud database & model deployment.</span>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs">Solid framework for speech accessibility research.</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--color-border-default)]">
            <p className="italic text-base md:text-lg text-glow-cyan font-serif text-[var(--color-accent-cyan)] font-medium">
              "Technology should adapt to people, not the other way around."
            </p>
          </div>
        </div>
      </section>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card max-w-4xl w-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 flex items-center justify-between border-b border-[var(--color-border-default)] bg-black/40">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)]">
                  {selectedImage.title}
                </h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors text-[var(--color-text-secondary)] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 bg-black/20 flex items-center justify-center max-h-[70vh] overflow-auto">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  className="max-w-full max-h-[60vh] object-contain rounded"
                />
              </div>
              <div className="p-4 bg-black/40 border-t border-[var(--color-border-default)] text-left">
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {selectedImage.caption}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
