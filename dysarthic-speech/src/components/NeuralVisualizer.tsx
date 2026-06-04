// ═══════════════════════════════════════════════════
// Neural Visualizer — AI Neural Network Animation
// The HERO animation component of the dashboard
// ═══════════════════════════════════════════════════

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { NEURAL_LAYERS } from '../animations/particles';
import type { AppStage } from '../hooks/useAppState';

interface NeuralVisualizerProps {
  stage: AppStage;
  processingStageIndex: number;
}

// Map processing stage to which layer is active
function getActiveLayer(stage: AppStage, processingIdx: number): number {
  if (stage === 'extracting_audio') return 0;
  if (stage === 'processing') {
    if (processingIdx <= 0) return 1;
    if (processingIdx === 1) return 2;
    if (processingIdx === 2) return 3;
    if (processingIdx >= 3) return 4;
  }
  if (stage === 'generating_text') return 4;
  if (stage === 'completed') return 5; // all completed
  return -1;
}

export default function NeuralVisualizer({ stage, processingStageIndex }: NeuralVisualizerProps) {
  const isActive = stage === 'processing' || stage === 'extracting_audio' || stage === 'generating_text';
  const isCompleted = stage === 'completed';
  const activeLayer = getActiveLayer(stage, processingStageIndex);

  // Generate node positions for each layer
  const layerPositions = useMemo(() => {
    const svgWidth = 320;
    const svgHeight = 260;
    const layerCount = NEURAL_LAYERS.length;
    const layerSpacing = svgWidth / (layerCount + 1);

    return NEURAL_LAYERS.map((layer, li) => {
      const x = layerSpacing * (li + 1);
      const nodeSpacing = svgHeight / (layer.nodes + 1);

      return {
        ...layer,
        x,
        nodes: Array.from({ length: layer.nodes }, (_, ni) => ({
          id: `${layer.id}-${ni}`,
          x,
          y: nodeSpacing * (ni + 1),
        })),
      };
    });
  }, []);

  // Generate connections between adjacent layers
  const connections = useMemo(() => {
    const conns: { x1: number; y1: number; x2: number; y2: number; layerIdx: number; key: string }[] = [];

    for (let li = 0; li < layerPositions.length - 1; li++) {
      const current = layerPositions[li];
      const next = layerPositions[li + 1];

      // Connect each node to 2-3 nodes in next layer for sparse look
      current.nodes.forEach((node) => {
        const step = Math.max(1, Math.floor(next.nodes.length / 3));
        for (let j = 0; j < next.nodes.length; j += step) {
          conns.push({
            x1: node.x,
            y1: node.y,
            x2: next.nodes[j].x,
            y2: next.nodes[j].y,
            layerIdx: li,
            key: `${node.id}-${next.nodes[j].id}`,
          });
        }
      });
    }

    return conns;
  }, [layerPositions]);

  if (!isActive && !isCompleted && stage !== 'uploading') return null;

  return (
    <motion.div
      className="glass-card p-5 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ background: isActive ? '#7C3AED' : isCompleted ? '#22C55E' : '#6B7280' }}
          animate={isActive ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Neural Network</span>
      </div>

      <svg
        viewBox="0 0 320 260"
        className="w-full"
        style={{ maxHeight: 220 }}
      >
        <defs>
          {/* Gradient for active connections */}
          <linearGradient id="connGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="connCompleted" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.4" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connections */}
        {connections.map((conn) => {
          const isConnActive = isActive && conn.layerIdx <= activeLayer && conn.layerIdx >= activeLayer - 1;
          const isConnCompleted = isCompleted || conn.layerIdx < activeLayer - 1;

          return (
            <motion.line
              key={conn.key}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke={
                isConnActive
                  ? 'url(#connGradient)'
                  : isConnCompleted
                  ? 'url(#connCompleted)'
                  : 'rgba(255,255,255,0.03)'
              }
              strokeWidth={isConnActive ? 1.5 : 0.5}
              initial={{ opacity: 0 }}
              animate={{
                opacity: isConnActive ? [0.3, 0.8, 0.3] : isConnCompleted ? 0.4 : 0.15,
              }}
              transition={
                isConnActive
                  ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.5 }
              }
            />
          );
        })}

        {/* Data flow particles along active connections */}
        {isActive &&
          connections
            .filter((c) => c.layerIdx === activeLayer - 1 || c.layerIdx === activeLayer)
            .slice(0, 6)
            .map((conn, i) => (
              <motion.circle
                key={`particle-${conn.key}`}
                r={1.5}
                fill="#00D4FF"
                filter="url(#glow)"
                initial={{ cx: conn.x1, cy: conn.y1, opacity: 0 }}
                animate={{
                  cx: [conn.x1, conn.x2],
                  cy: [conn.y1, conn.y2],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'linear',
                }}
              />
            ))}

        {/* Nodes */}
        {layerPositions.map((layer, li) => {
          const isLayerActive = isActive && li === activeLayer;
          const isLayerCompleted = isCompleted || li < activeLayer;

          return layer.nodes.map((node, ni) => (
            <motion.circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={isLayerActive ? 5 : 4}
              fill={
                isLayerActive
                  ? layer.color
                  : isLayerCompleted
                  ? '#22C55E'
                  : '#1a2235'
              }
              stroke={
                isLayerActive
                  ? layer.color
                  : isLayerCompleted
                  ? '#22C55E'
                  : 'rgba(255,255,255,0.08)'
              }
              strokeWidth={1}
              filter={isLayerActive ? 'url(#glow)' : undefined}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isLayerActive ? [1, 1.3, 1] : 1,
                opacity: 1,
              }}
              transition={
                isLayerActive
                  ? {
                      scale: {
                        duration: 1.5,
                        repeat: Infinity,
                        delay: ni * 0.1,
                        ease: 'easeInOut',
                      },
                      opacity: { duration: 0.3, delay: li * 0.1 + ni * 0.05 },
                    }
                  : { duration: 0.3, delay: li * 0.1 + ni * 0.05 }
              }
            />
          ));
        })}

        {/* Layer labels */}
        {layerPositions.map((layer, li) => {
          const isLayerActive = isActive && li === activeLayer;
          return (
            <motion.text
              key={`label-${layer.id}`}
              x={layer.x}
              y={250}
              textAnchor="middle"
              fontSize="7"
              fontFamily="var(--font-mono)"
              fill={isLayerActive ? layer.color : isCompleted ? '#22C55E' : '#6B7280'}
              initial={{ opacity: 0 }}
              animate={{ opacity: isLayerActive ? 1 : 0.6 }}
              transition={{ duration: 0.3 }}
            >
              {layer.label}
            </motion.text>
          );
        })}
      </svg>
    </motion.div>
  );
}
