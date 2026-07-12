import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Cpu,
  Layers,
  Sparkles,
  Play,
  TrendingDown,
  Clock,
  ArrowRight,
  TrendingUp,
  FileAudio,
} from 'lucide-react';
import { fadeInUp, staggerContainer } from '../animations/variants';

export default function PipelineDashboard() {
  const [chartScriptLoaded, setChartScriptLoaded] = useState(false);

  const werChartRef = useRef<HTMLCanvasElement | null>(null);
  const benchChartRef = useRef<HTMLCanvasElement | null>(null);
  const sevChartRef = useRef<HTMLCanvasElement | null>(null);
  const noiseChartRef = useRef<HTMLCanvasElement | null>(null);
  const augChartRef = useRef<HTMLCanvasElement | null>(null);
  const overallChartRef = useRef<HTMLCanvasElement | null>(null);

  // Load Chart.js CDN dynamically
  useEffect(() => {
    if ((window as any).Chart) {
      setChartScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.async = true;
    script.onload = () => setChartScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Initialize and configure charts
  useEffect(() => {
    if (!chartScriptLoaded) return;

    const ChartClass = (window as any).Chart;
    if (!ChartClass) return;

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#9CA3AF', font: { size: 10, family: 'Inter, sans-serif' } },
        },
      },
      scales: {
        x: {
          ticks: { color: '#6B7280', font: { family: 'Inter, sans-serif' } },
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
        },
        y: {
          ticks: { color: '#6B7280', font: { family: 'Inter, sans-serif' } },
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
        },
      },
    };

    const activeCharts: any[] = [];

    // 1. Model Comparison Chart (Horizontal Bar)
    if (werChartRef.current) {
      const werChart = new ChartClass(werChartRef.current, {
        type: 'bar',
        data: {
          labels: [
            'Wav2Vec-CTC',
            'HuBERT-CTC',
            'Whisper base',
            'Whisper-small baseline',
            'HuBERT-BART',
            'Whisper-Vicuna (prior best)',
            'Ours (Whisper-LoRA)',
          ],
          datasets: [
            {
              label: 'WER (%)',
              data: [53.0, 50.0, 38.0, 32.15, 30.0, 21.0, 16.12],
              backgroundColor: [
                'rgba(107, 114, 128, 0.2)',
                'rgba(107, 114, 128, 0.2)',
                'rgba(107, 114, 128, 0.2)',
                'rgba(107, 114, 128, 0.2)',
                'rgba(107, 114, 128, 0.2)',
                'rgba(107, 114, 128, 0.2)',
                'rgba(6, 182, 212, 0.4)', // cyan accent
              ],
              borderColor: [
                'rgba(107, 114, 128, 0.4)',
                'rgba(107, 114, 128, 0.4)',
                'rgba(107, 114, 128, 0.4)',
                'rgba(107, 114, 128, 0.4)',
                'rgba(107, 114, 128, 0.4)',
                'rgba(107, 114, 128, 0.4)',
                'var(--color-accent-cyan)',
              ],
              borderWidth: 1.5,
              borderRadius: 4,
            },
          ],
        },
        options: {
          ...chartOptions,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (context: any) => ` WER: ${context.parsed.x}%` } },
          },
          scales: {
            x: {
              ...chartOptions.scales.x,
              title: { display: true, text: 'Word Error Rate (%)', color: '#6B7280', font: { size: 10 } },
              min: 0,
              max: 60,
            },
            y: {
              ticks: { color: '#9CA3AF', font: { size: 9 } },
              grid: { color: 'rgba(255, 255, 255, 0.04)' },
            },
          },
        },
      });
      activeCharts.push(werChart);
    }

    // 2. Parallel Processing Benchmark Chart (Grouped Vertical Bar)
    if (benchChartRef.current) {
      const benchChart = new ChartClass(benchChartRef.current, {
        type: 'bar',
        data: {
          labels: ['500', '1000', '2000', '4652'],
          datasets: [
            {
              label: 'Sequential Loop',
              data: [90, 180, 360, 837],
              backgroundColor: 'rgba(239, 68, 68, 0.25)',
              borderColor: 'var(--color-error)',
              borderWidth: 1.5,
              borderRadius: 3,
            },
            {
              label: 'PySpark (4 cores)',
              data: [25, 48, 94, 210],
              backgroundColor: 'rgba(34, 197, 94, 0.25)',
              borderColor: 'var(--color-success)',
              borderWidth: 1.5,
              borderRadius: 3,
            },
          ],
        },
        options: {
          ...chartOptions,
          scales: {
            x: { ...chartOptions.scales.x, title: { display: true, text: 'Number of Audios', color: '#6B7280' } },
            y: { ...chartOptions.scales.y, title: { display: true, text: 'Processing Duration (seconds)', color: '#6B7280' } },
          },
        },
      });
      activeCharts.push(benchChart);
    }

    // 3. WER by Severity Level Chart (Grouped Vertical Bar)
    if (sevChartRef.current) {
      const sevChart = new ChartClass(sevChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Mild', 'Moderate', 'Severe'],
          datasets: [
            {
              label: 'Baseline',
              data: [26.15, 39.9, 59.41],
              backgroundColor: 'rgba(239, 68, 68, 0.25)',
              borderColor: 'var(--color-error)',
              borderWidth: 1.5,
              borderRadius: 3,
            },
            {
              label: 'Fine-tuned',
              data: [14.08, 22.51, 32.7],
              backgroundColor: 'rgba(34, 197, 94, 0.25)',
              borderColor: 'var(--color-success)',
              borderWidth: 1.5,
              borderRadius: 3,
            },
          ],
        },
        options: {
          ...chartOptions,
          scales: {
            x: { ...chartOptions.scales.x },
            y: { ...chartOptions.scales.y, title: { display: true, text: 'WER (%)', color: '#6B7280' } },
          },
        },
      });
      activeCharts.push(sevChart);
    }

    // 4. WER by Noise Condition Chart (Vertical Bar)
    if (noiseChartRef.current) {
      const noiseChart = new ChartClass(noiseChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Clean', 'Reverb', 'Gaussian', 'Babble'],
          datasets: [
            {
              label: 'Fine-tuned WER (%)',
              data: [18.63, 22.27, 24.38, 27.42],
              backgroundColor: [
                'rgba(34, 197, 94, 0.4)',
                'rgba(59, 130, 246, 0.4)',
                'rgba(245, 158, 11, 0.4)',
                'rgba(239, 68, 68, 0.4)',
              ],
              borderColor: [
                'var(--color-success)',
                'var(--color-accent-blue)',
                'var(--color-warning)',
                'var(--color-error)',
              ],
              borderWidth: 1.5,
              borderRadius: 4,
            },
          ],
        },
        options: {
          ...chartOptions,
          plugins: { legend: { display: false } },
          scales: {
            x: { ...chartOptions.scales.x },
            y: { ...chartOptions.scales.y, title: { display: true, text: 'WER (%)', color: '#6B7280' } },
          },
        },
      });
      activeCharts.push(noiseChart);
    }

    // 5. Augmentation Improvement Chart (Vertical Bar, Narrow Scale)
    if (augChartRef.current) {
      const augChart = new ChartClass(augChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Pitch Shift', 'Gaussian Noise', 'Time Shift', 'Time Stretch'],
          datasets: [
            {
              label: 'WER Improvement (%)',
              data: [45.31, 44.71, 44.62, 44.35],
              backgroundColor: 'rgba(124, 58, 237, 0.25)',
              borderColor: 'var(--color-accent-purple)',
              borderWidth: 1.5,
              borderRadius: 4,
            },
          ],
        },
        options: {
          ...chartOptions,
          plugins: { legend: { display: false } },
          scales: {
            x: { ...chartOptions.scales.x },
            y: {
              ...chartOptions.scales.y,
              title: { display: true, text: 'WER Reduction % over baseline', color: '#6B7280' },
              min: 43,
              max: 46,
            },
          },
        },
      });
      activeCharts.push(augChart);
    }

    // 6. Overall Performance Chart (Vertical Bar Comparison)
    if (overallChartRef.current) {
      const overallChart = new ChartClass(overallChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Baseline WER', 'Fine-tuned WER'],
          datasets: [
            {
              label: 'WER (%)',
              data: [42.12, 23.28],
              backgroundColor: ['rgba(239, 68, 68, 0.3)', 'rgba(34, 197, 94, 0.3)'],
              borderColor: ['var(--color-error)', 'var(--color-success)'],
              borderWidth: 1.5,
              borderRadius: 6,
            },
          ],
        },
        options: {
          ...chartOptions,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (context: any) => ` ${context.parsed.y}%` } },
          },
          scales: {
            x: { ...chartOptions.scales.x },
            y: { ...chartOptions.scales.y, title: { display: true, text: 'WER (%)', color: '#6B7280' }, min: 0, max: 50 },
          },
        },
      });
      activeCharts.push(overallChart);
    }

    return () => {
      activeCharts.forEach((c) => c.destroy());
    };
  }, [chartScriptLoaded]);

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 py-8 space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Metrics Row */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-cyan-400">
          <div className="text-2xl font-bold text-[var(--color-accent-cyan)] font-mono">4,652</div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider mt-1">
            Audio Files Processed
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            Synthetic & TORGO dataset mixes
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-purple-500">
          <div className="text-2xl font-bold text-purple-400 font-mono">1,396.7 MB</div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider mt-1">
            Total Dataset Size
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            8 speaker audio profile splits
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-blue-500">
          <div className="text-2xl font-bold text-blue-400 font-mono">4 Cores</div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider mt-1">
            PySpark Parallelism
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            local[*] config execution
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-red-500">
          <div className="text-2xl font-bold text-red-400 font-mono">42.12%</div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider mt-1">
            Baseline Whisper WER
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            Whisper-small on TORGO baseline
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-green-500 bg-green-500/5">
          <div className="text-2xl font-bold text-green-400 font-mono flex items-center gap-1.5">
            16.12%
            <span className="text-[10px] text-green-500 font-medium bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
              -49.8%
            </span>
          </div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider mt-1">
            Final Fine-Tuned WER
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            Whisper + LoRA fine-tuning result
          </div>
        </div>
      </motion.div>

      {/* Architecture Banner */}
      <motion.div variants={fadeInUp} className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xs font-semibold tracking-widest text-[var(--color-text-tertiary)] uppercase mb-4">
          Big Data Pipeline Architecture
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] rounded-xl p-4 text-center space-y-1.5 relative">
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Synthetic Generation</h4>
            <p className="text-[10px] text-[var(--color-accent-cyan)] font-medium">XTTS-v2 Engine</p>
            <p className="text-[9px] text-[var(--color-text-tertiary)]">16,000 .wav files · GPU cluster</p>
          </div>

          <div className="hidden md:flex justify-center text-cyan-400/40">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="bg-[var(--color-bg-secondary)] border border-cyan-500/30 bg-cyan-500/5 rounded-xl p-4 text-center space-y-1.5 relative shadow-[0_0_15px_rgba(6,182,212,0.05)]">
            <div className="absolute top-2 right-2 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse-glow" />
            </div>
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Parallel Augmentation</h4>
            <p className="text-[10px] text-cyan-400 font-medium">Apache Spark</p>
            <p className="text-[9px] text-[var(--color-text-tertiary)]">4,652 files · 4 techniques</p>
          </div>

          <div className="hidden md:flex justify-center text-cyan-400/40">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="bg-[var(--color-bg-secondary)] border border-purple-500/30 bg-purple-500/5 rounded-xl p-4 text-center space-y-1.5 relative">
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Feature Extraction</h4>
            <p className="text-[10px] text-purple-400 font-medium">PySpark UDF + Librosa</p>
            <p className="text-[9px] text-[var(--color-text-tertiary)]">Log-Mel spectrogram arrays</p>
          </div>
        </div>
      </motion.div>

      {/* Row 1: Spark Logs & DAG */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">PySpark Execution Logs</h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">Live output logs from Kaggle compute node</p>
          </div>

          <div className="bg-[#090C16] border border-[var(--color-border-default)] rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto h-72 scrollbar-thin">
            <div className="text-purple-400 font-semibold mb-2">── Stage 1: SparkContext Init ──</div>
            <div>Spark version : <span className="text-cyan-400">4.0.2</span></div>
            <div>Active cores  : <span className="text-cyan-400">4</span></div>
            
            <div className="text-purple-400 font-semibold mt-4 mb-2">── Stage 2: Parallel Load ──</div>
            <div>Total files read  : <span className="text-green-400">4,652</span></div>
            <div>Directory size    : <span className="text-green-400">1,396.7 MB</span></div>
            <div className="text-slate-500 mt-1">
              +--------------------------+------+-------+---------+<br />
              | speaker                  | gender| files | size_MB |<br />
              +--------------------------+------+-------+---------+<br />
              | synthetic_dataset_female | F    | 2326  | 695.8   |<br />
              | synthetic_dataset_male   | M    | 2326  | 700.9   |<br />
              +--------------------------+------+-------+---------+
            </div>

            <div className="text-purple-400 font-semibold mt-4 mb-2">── Stage 3: UDF Augmentation & MFCCs ──</div>
            <div>Processing UDF tasks across partitioned executors...</div>
            <div>Status: <span className="text-green-400">Success (0 failures, 4,652 datasets mapped)</span></div>
            <div className="text-slate-500 mt-1">
              +----------------+------+-----+----------------+<br />
              | augmentation   | gender| files| avg_duration_s |<br />
              +----------------+------+-----+----------------+<br />
              | gaussian_noise | M    | 1116| 6.19           |<br />
              | pitch_shift    | M    | 1223| 6.26           |<br />
              | time_shift     | M    | 1156| 6.26           |<br />
              | time_stretch   | M    | 1157| 6.36           |<br />
              +----------------+------+-----+----------------+
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Pipeline execution order</h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">Job orchestrations</p>
          </div>

          <div className="flex flex-col items-center py-4 space-y-2">
            <div className="flex items-center gap-3 w-full border border-green-500/20 bg-green-950/10 px-4 py-2.5 rounded-lg text-green-400 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse-glow" />
              <div className="flex-1">
                <div className="font-semibold">generate_synthetic_audio</div>
                <div className="text-[10px] text-green-500/80">XTTS-v2 · 36 hrs · GPU</div>
              </div>
            </div>

            <div className="text-cyan-400/40 font-mono text-[10px]">▼</div>

            <div className="flex items-center gap-3 w-full border border-green-500/20 bg-green-950/10 px-4 py-2.5 rounded-lg text-green-400 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse-glow" />
              <div className="flex-1">
                <div className="font-semibold">spark_augment_and_extract</div>
                <div className="text-[10px] text-green-500/80">PySpark · 4,652 files · 4 cores</div>
              </div>
            </div>

            <div className="text-cyan-400/40 font-mono text-[10px]">▼</div>

            <div className="flex items-center gap-3 w-full border border-green-500/20 bg-green-950/10 px-4 py-2.5 rounded-lg text-green-400 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse-glow" />
              <div className="flex-1">
                <div className="font-semibold">train_whisper_lora</div>
                <div className="text-[10px] text-green-500/80">HuggingFace PEFT · 14+ hrs · dual T4</div>
              </div>
            </div>

            <div className="text-cyan-400/40 font-mono text-[10px]">▼</div>

            <div className="flex items-center gap-3 w-full border border-green-500/20 bg-green-950/10 px-4 py-2.5 rounded-lg text-green-400 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse-glow" />
              <div className="flex-1">
                <div className="font-semibold">spark_wer_analytics</div>
                <div className="text-[10px] text-green-500/80">Spark SQL · Word Error Rate Breakdown</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Row 2: Charts (WER Comparison & Spark Scaling Benchmarks) */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">ASR Performance Comparison (TORGO)</h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">Word Error Rate (WER) benchmark comparisons · Lower is better</p>
          </div>
          <div className="h-64 relative">
            <canvas ref={werChartRef} />
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Big Data Scalability Benchmark</h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">Sequential Loop processing vs. PySpark multi-core processing duration</p>
          </div>
          <div className="h-64 relative">
            <canvas ref={benchChartRef} />
          </div>
        </div>
      </motion.div>

      {/* Row 3: Spark SQL Insights */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Spark SQL: WER by Severity</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">WER improvements grouped by speech severity</p>
          </div>
          <div className="h-48 relative">
            <canvas ref={sevChartRef} />
          </div>
        </div>

        <div className="glass-card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Spark SQL: WER by Noise Condition</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">ASR accuracy under various environment acoustics</p>
          </div>
          <div className="h-48 relative">
            <canvas ref={noiseChartRef} />
          </div>
        </div>

        <div className="glass-card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Spark SQL: Augmentation Boost</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)]">Percentage reduction in error rate relative to baseline</p>
          </div>
          <div className="h-48 relative">
            <canvas ref={augChartRef} />
          </div>
        </div>
      </motion.div>

      {/* Row 4: Overall Analysis & Leaderboard */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Spark SQL — Overall WER Analytics</h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">Final fine-tuned WER comparison versus non-tuned baseline</p>
          </div>
          <div className="h-44 relative">
            <canvas ref={overallChartRef} />
          </div>

          <div className="bg-[#090C16] border border-[var(--color-border-default)] rounded-xl p-3 font-mono text-[10px] text-slate-400 space-y-2">
            <div>
              <span className="text-cyan-400 font-semibold">── General Pipeline Gains ──</span>
              <pre className="text-slate-500 mt-1">
{`+------------------+-------------------+-----------------+
| baseline_WER_pct | finetuned_WER_pct | improvement_pct |
+------------------+-------------------+-----------------+
|            42.12 |             23.28 |           44.74 |
+------------------+-------------------+-----------------+`}
              </pre>
            </div>
            <div>
              <span className="text-cyan-400 font-semibold">── WER Breakdown by Severity ──</span>
              <pre className="text-slate-500 mt-1">
{`+----------+--------------+---------------+
| severity | baseline_pct | finetuned_pct |
+----------+--------------+---------------+
|     mild |        26.15 |         14.08 |
| moderate |         39.9 |         22.51 |
|   severe |        59.41 |         32.70 |
+----------+--------------+---------------+`}
              </pre>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">TORGO Dataset Leaderboard</h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">ASR performance rankings on the standard TORGO test set</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-default)] text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">Model Name</th>
                  <th className="py-2.5 px-3 font-semibold">WER</th>
                  <th className="py-2.5 px-3 font-semibold">Comparison Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-default)]/30">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-medium text-[var(--color-text-primary)]">Wav2Vec-CTC</td>
                  <td className="py-3 px-3 font-mono text-red-400">53.00%</td>
                  <td className="py-3 px-3">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[120px]">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-medium text-[var(--color-text-primary)]">HuBERT-CTC</td>
                  <td className="py-3 px-3 font-mono text-red-400">50.00%</td>
                  <td className="py-3 px-3">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[120px]">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '94%' }} />
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-medium text-[var(--color-text-primary)]">Whisper Base (No tuning)</td>
                  <td className="py-3 px-3 font-mono text-amber-500">38.00%</td>
                  <td className="py-3 px-3">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[120px]">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '72%' }} />
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-medium text-[var(--color-text-primary)]">Whisper-small Baseline</td>
                  <td className="py-3 px-3 font-mono text-amber-500">32.15%</td>
                  <td className="py-3 px-3">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[120px]">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '61%' }} />
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-medium text-[var(--color-text-primary)]">Wav2Vec-BART</td>
                  <td className="py-3 px-3 font-mono text-amber-500">32.00%</td>
                  <td className="py-3 px-3">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[120px]">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-medium text-[var(--color-text-primary)]">HuBERT-BART</td>
                  <td className="py-3 px-3 font-mono text-amber-400">30.00%</td>
                  <td className="py-3 px-3">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[120px]">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '57%' }} />
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-medium text-[var(--color-text-primary)]">Whisper-Vicuna (Prior best)</td>
                  <td className="py-3 px-3 font-mono text-green-500 font-semibold">21.00%</td>
                  <td className="py-3 px-3">
                    <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[120px]">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </td>
                </tr>
                <tr className="bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors border border-cyan-500/20 rounded-lg">
                  <td className="py-3 px-3 font-semibold text-[var(--color-accent-cyan)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse-glow" />
                    Ours — Whisper-small + LoRA
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-400 font-bold">16.12%</td>
                  <td className="py-3 px-3">
                    <div className="w-full bg-cyan-950 rounded-full h-1.5 max-w-[120px] border border-cyan-500/10">
                      <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
