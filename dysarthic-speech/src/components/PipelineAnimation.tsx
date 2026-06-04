// ═══════════════════════════════════════════════════
// Pipeline Animation — Step-by-step Processing Viz
// ═══════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Music,
  BarChart3,
  Brain,
  FileText,
  Check,
  Loader,
} from 'lucide-react';
import type { AppStage } from '../hooks/useAppState';
import type { ProcessingStage } from '../services/mockApi';
import { fadeInUp, staggerContainer } from '../animations/variants';

interface PipelineAnimationProps {
  stage: AppStage;
  currentProcessingStage: ProcessingStage | null;
  processingStageIndex: number;
  extractionProgress: number;
}

interface PipelineStepConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  stages: AppStage[];
  color: string;
}

const STEPS: PipelineStepConfig[] = [
  {
    id: 'upload',
    label: 'File Uploaded',
    icon: Upload,
    stages: ['uploading'],
    color: '#00D4FF',
  },
  {
    id: 'extract',
    label: 'Extracting Audio',
    icon: Music,
    stages: ['extracting_audio'],
    color: '#3B82F6',
  },
  {
    id: 'analyze',
    label: 'Analyzing Speech',
    icon: BarChart3,
    stages: ['processing'],
    color: '#7C3AED',
  },
  {
    id: 'process',
    label: 'AI Processing',
    icon: Brain,
    stages: ['processing'],
    color: '#EC4899',
  },
  {
    id: 'generate',
    label: 'Generating Transcript',
    icon: FileText,
    stages: ['generating_text'],
    color: '#22C55E',
  },
];

function getStepStatus(step: PipelineStepConfig, currentStage: AppStage, processingIndex: number) {
  const stageOrder: AppStage[] = ['idle', 'uploading', 'extracting_audio', 'processing', 'generating_text', 'completed'];
  const currentIdx = stageOrder.indexOf(currentStage);

  // Map each pipeline step to an approximate stage index
  const stepStageMap: Record<string, number> = {
    upload: 1,
    extract: 2,
    analyze: 3,
    process: 3,
    generate: 4,
  };

  const stepIdx = stepStageMap[step.id];

  if (currentStage === 'completed') return 'completed';
  if (currentStage === 'error') return currentIdx >= stepIdx ? 'error' : 'completed';

  // Special handling for processing sub-steps
  if (step.id === 'analyze' && currentStage === 'processing') {
    return processingIndex < 2 ? 'active' : 'completed';
  }
  if (step.id === 'process' && currentStage === 'processing') {
    return processingIndex >= 2 ? 'active' : 'pending';
  }

  if (currentIdx > stepIdx) return 'completed';
  if (currentIdx === stepIdx) return 'active';
  return 'pending';
}

// Flowing particles along the pipeline connector
function PipelineParticles({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="absolute left-[15px] top-8 bottom-0 w-0.5 overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[var(--color-accent-cyan)]"
          style={{ left: '-1px' }}
          animate={{
            y: [0, 40],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

export default function PipelineAnimation({
  stage,
  currentProcessingStage,
  processingStageIndex,
  extractionProgress,
}: PipelineAnimationProps) {
  if (stage === 'idle') return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="glass-card p-5"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] animate-pulse-glow" />
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Processing Pipeline</span>
      </div>

      <div className="space-y-1">
        {STEPS.map((step, i) => {
          const status = getStepStatus(step, stage, processingStageIndex);
          const Icon = step.icon;
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <motion.div
              key={step.id}
              variants={fadeInUp}
              className="pipeline-step py-2.5"
            >
              <PipelineParticles active={isActive && i < STEPS.length - 1} />

              <div className="flex items-center gap-3">
                {/* Status Icon */}
                <motion.div
                  className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: isCompleted
                      ? `${step.color}20`
                      : isActive
                      ? `${step.color}15`
                      : 'var(--color-bg-tertiary)',
                    border: `1.5px solid ${isCompleted || isActive ? step.color : 'var(--color-border-default)'}`,
                  }}
                  animate={
                    isActive
                      ? {
                          boxShadow: [
                            `0 0 0px ${step.color}00`,
                            `0 0 15px ${step.color}40`,
                            `0 0 0px ${step.color}00`,
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" style={{ color: step.color }} />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader className="w-3.5 h-3.5" style={{ color: step.color }} />
                    </motion.div>
                  ) : (
                    <Icon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                  )}
                </motion.div>

                {/* Label & Info */}
                <div className="ml-1 flex-1">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[var(--color-text-primary)]'
                        : isCompleted
                        ? 'text-[var(--color-text-secondary)]'
                        : 'text-[var(--color-text-tertiary)]'
                    }`}
                  >
                    {step.label}
                  </p>

                  {/* Active sub-status */}
                  <AnimatePresence>
                    {isActive && currentProcessingStage && step.id === 'analyze' && processingStageIndex < 2 && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs font-mono mt-0.5"
                        style={{ color: step.color }}
                      >
                        {currentProcessingStage.label}
                      </motion.p>
                    )}
                    {isActive && currentProcessingStage && step.id === 'process' && processingStageIndex >= 2 && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs font-mono mt-0.5"
                        style={{ color: step.color }}
                      >
                        {currentProcessingStage.label}
                      </motion.p>
                    )}
                    {isActive && step.id === 'extract' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1.5"
                      >
                        <div className="h-1 rounded-full bg-[var(--color-bg-primary)] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${step.color}, #00D4FF)` }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${extractionProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-[10px] font-mono text-[var(--color-text-tertiary)] mt-1">
                          {extractionProgress}% extracted
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
