// ═══════════════════════════════════════════════════
// Particle System for AI Pipeline Visualization
// ═══════════════════════════════════════════════════

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
  delay: number;
}

const COLORS = ['#00D4FF', '#7C3AED', '#3B82F6', '#22C55E'];

export function generateParticles(count: number, startY: number, _endY?: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80, // percentage
    y: startY,
    size: 2 + Math.random() * 4,
    speed: 1.5 + Math.random() * 2,
    opacity: 0.3 + Math.random() * 0.7,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: i * 0.2 + Math.random() * 0.5,
  }));
}

export function generateConnectionParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    speed: 0.5 + Math.random() * 1,
    opacity: 0.2 + Math.random() * 0.4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 3,
  }));
}

// Neural network layer config
export interface NeuralLayer {
  id: string;
  label: string;
  nodes: number;
  color: string;
}

export const NEURAL_LAYERS: NeuralLayer[] = [
  { id: 'input', label: 'Audio Input', nodes: 6, color: '#00D4FF' },
  { id: 'encoder', label: 'Encoder', nodes: 8, color: '#3B82F6' },
  { id: 'features', label: 'Feature Extraction', nodes: 10, color: '#7C3AED' },
  { id: 'decoder', label: 'Decoder', nodes: 8, color: '#EC4899' },
  { id: 'output', label: 'Text Output', nodes: 5, color: '#22C55E' },
];
