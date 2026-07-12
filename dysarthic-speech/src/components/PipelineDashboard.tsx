import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Play,
  Pause,
  Terminal,
  Cpu,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { fadeInUp, staggerContainer } from '../animations/variants';

const INITIAL_LOGS = [
  "[INFO] SparkContext: Created SparkContext with AppID: app-20260712-asr",
  "[INFO] Executor: Cores allocated to executor: 4 (local[*])",
  "[INFO] BlockManagerMaster: Registered BlockManager BlockManagerId(driver, port 8080)",
  "[INFO] SparkSession: Loading dataset schemas for TORGO and XTTS-v2...",
  "[INFO] MemoryStore: Block broadcast_0 stored as values in memory",
  "[INFO] DirectKafkaInputDStream: Slide window time: 2000 ms",
  "[INFO] DirectKafkaInputDStream: Spark Streaming consumer initialized successfully",
  "[INFO] SparkUDF: Registered Librosa Log-Mel Spectrogram extractor UDF",
  "[INFO] StreamingContext: Batch 1 started. Processing stream chunk...",
  "[INFO] SparkUDF: Extracted Log-Mel features for 4 files in 2100ms",
  "[INFO] SparkUDF: Executing Whisper-LoRA model prediction inference...",
  "[INFO] SparkSQL: Saved WER stats to parquet partition severity=mild",
  "[INFO] StreamingContext: Batch 1 completed. Processing duration: 3200ms",
];

const POOL_OF_LOGS = [
  "[INFO] StreamingContext: Batch started. Fetching offsets from Kafka...",
  "[INFO] SparkUDF: Extracted Log-Mel features for 4 files in 1.9s",
  "[INFO] SparkUDF: Inference model Whisper-LoRA execution success (0 warnings)",
  "[INFO] SparkSQL: Query executed 'SELECT AVG(wer) FROM torgo_stats WHERE severity = \"severe\"'",
  "[INFO] SparkSQL: Saved WER stats to parquet partition severity=moderate",
  "[INFO] StreamingContext: Batch completed. Mapped 4 streams in 2.9s",
  "[INFO] DirectKafkaInputDStream: Offsets updated successfully in ZooKeeper",
  "[INFO] BlockManager: Removing RDD 12 from memory/disk to free JVM heap space",
  "[INFO] SparkContext: Executor heartbeat received from local-127.0.0.1",
  "[INFO] SparkSQL: Batch update complete for analytics dashboard backend",
];

export default function PipelineDashboard() {
  const [chartScriptLoaded, setChartScriptLoaded] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // Dynamic stats
  const [processedCount, setProcessedCount] = useState(16543);
  const [datasetSize, setDatasetSize] = useState(3200.0);
  const [cpuLoads, setCpuLoads] = useState([45, 62, 28, 12]);
  const [ramUsage, setRamUsage] = useState(78.4);
  const [activeStage, setActiveStage] = useState(1); // 0: XTTS, 1: Spark, 2: Whisper, 3: SQL
  
  // Logs
  const [logs, setLogs] = useState<string[]>(INITIAL_LOGS);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

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
                'rgba(107, 114, 128, 0.15)',
                'rgba(107, 114, 128, 0.15)',
                'rgba(107, 114, 128, 0.15)',
                'rgba(107, 114, 128, 0.15)',
                'rgba(107, 114, 128, 0.15)',
                'rgba(107, 114, 128, 0.15)',
                'rgba(6, 182, 212, 0.4)', // cyan accent
              ],
              borderColor: [
                'rgba(107, 114, 128, 0.3)',
                'rgba(107, 114, 128, 0.3)',
                'rgba(107, 114, 128, 0.3)',
                'rgba(107, 114, 128, 0.3)',
                'rgba(107, 114, 128, 0.3)',
                'rgba(107, 114, 128, 0.3)',
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

  // Handle Dynamic Fluctuating Resources & Logs
  useEffect(() => {
    if (!isLive) return;

    const timer = setInterval(() => {
      // 1. Increment files count
      setProcessedCount((prev) => {
        const added = Math.floor(Math.random() * 4) + 1; // +1 to +4 files
        const next = prev + added;
        // Dynamically compute size based on files count (roughly 0.3MB per audio file)
        setDatasetSize(parseFloat((next * 0.3002).toFixed(1)));
        return next;
      });

      // 2. Fluctuate CPU Loads
      setCpuLoads(() =>
        Array.from({ length: 4 }).map(() => Math.floor(Math.random() * 75) + 15)
      );

      // 3. Fluctuate RAM
      setRamUsage((prev) => {
        const shift = parseFloat((Math.random() * 1.6 - 0.8).toFixed(1));
        return Math.max(70, Math.min(92, parseFloat((prev + shift).toFixed(1))));
      });

      // 4. Append new dynamic Spark Log
      setLogs((prev) => {
        const nextLog = POOL_OF_LOGS[Math.floor(Math.random() * POOL_OF_LOGS.length)];
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
        const formattedLog = `[${timestamp}] ${nextLog.replace(/^\[INFO\] /, '')}`;
        return [...prev.slice(-30), formattedLog]; // Keep last 30 logs to avoid DOM overload
      });

      // 5. Shift Pipeline Active Stage randomly for visual dynamism
      setActiveStage((prev) => {
        const next = prev + 1;
        return next > 3 ? 1 : next;
      });

    }, 2000);

    return () => clearInterval(timer);
  }, [isLive]);

  // Auto-scroll logs terminal to bottom
  useEffect(() => {
    // Disabled forced scrollIntoView to allow manual page scrolling
    // if (consoleEndRef.current) {
    //  consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    // }
  }, [logs]);

  const handleResetLogs = () => {
    setLogs(INITIAL_LOGS);
    setProcessedCount(16543);
    setDatasetSize(3200.0);
    setRamUsage(78.4);
    setCpuLoads([45, 62, 28, 12]);
    setActiveStage(1);
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 py-8 space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Control Banner for Live Settings */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]/50 gap-4">
        <div>
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-green-500' : 'bg-slate-500'}`}></span>
            </span>
            Apache Spark Pipeline Analytics
          </h2>
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
            Historical analytics for audio records processed through XTTS generation, Spark parallel feature extraction UDFs, and WER aggregation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border tracking-wide transition-all cursor-pointer ${
              isLive
                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLive ? 'Pause Real-time Sync' : 'Sync Real-time'}
          </button>
          <button
            onClick={handleResetLogs}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800/80 transition-all cursor-pointer"
            title="Reset simulation data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Log
          </button>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-cyan-400">
          <div className="text-2xl font-bold text-[var(--color-accent-cyan)] font-mono transition-all duration-500">
            {processedCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider mt-1">
            Audio Files Processed
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            Real-time ingested stream
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-purple-500">
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {datasetSize.toLocaleString()} MB
          </div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider mt-1">
            Total Dataset Size
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            Dynamic database accumulation
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-blue-500">
          <div className="text-2xl font-bold text-blue-400 font-mono">4 Cores</div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider mt-1">
            PySpark Parallelism
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            local[*] cluster execution
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-red-500">
          <div className="text-2xl font-bold text-red-400 font-mono">42.12%</div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-semibold tracking-wider mt-1">
            Baseline Whisper WER
          </div>
          <div className="text-[10px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
            Untuned model on TORGO set
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
            Whisper + LoRA best result
          </div>
        </div>
      </motion.div>

      {/* Architecture Flow Banner */}
      <motion.div variants={fadeInUp} className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <h3 className="text-xs font-semibold tracking-widest text-[var(--color-text-tertiary)] uppercase mb-4">
          Data Pipeline Stages & Current Executor Routing
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
          <div className={`border rounded-xl p-4 text-center space-y-1.5 transition-all duration-500 ${
            activeStage === 0 
              ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.03]'
              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-default)]'
          }`}>
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Synthetic Generation</h4>
            <p className="text-[10px] text-[var(--color-accent-cyan)] font-medium">XTTS-v2 Engine</p>
            <p className="text-[9px] text-[var(--color-text-tertiary)]">16k .wavs · GPU</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className={`w-5 h-5 ${activeStage === 0 && 'text-cyan-400 animate-pulse'}`} />
          </div>

          <div className={`border rounded-xl p-4 text-center space-y-1.5 transition-all duration-500 ${
            activeStage === 1 
              ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.03]'
              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-default)]'
          }`}>
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Parallel Augment</h4>
            <p className="text-[10px] text-cyan-400 font-medium">Apache Spark</p>
            <p className="text-[9px] text-[var(--color-text-tertiary)]">4,652 files · 4 cores</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className={`w-5 h-5 ${activeStage === 1 && 'text-cyan-400 animate-pulse'}`} />
          </div>

          <div className={`border rounded-xl p-4 text-center space-y-1.5 transition-all duration-500 ${
            activeStage === 2 
              ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(124,58,237,0.15)] scale-[1.03]'
              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-default)]'
          }`}>
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">Feature Extract</h4>
            <p className="text-[10px] text-purple-400 font-medium">PySpark + Librosa</p>
            <p className="text-[9px] text-[var(--color-text-tertiary)]">Log-Mel arrays UDF</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className={`w-5 h-5 ${activeStage === 2 && 'text-purple-400 animate-pulse'}`} />
          </div>

          <div className={`border rounded-xl p-4 text-center space-y-1.5 transition-all duration-500 ${
            activeStage === 3 
              ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(124,58,237,0.15)] scale-[1.03]'
              : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-default)]'
          }`}>
            <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">LoRA Fine-Tuning</h4>
            <p className="text-[10px] text-purple-400 font-medium">HuggingFace PEFT</p>
            <p className="text-[9px] text-[var(--color-text-tertiary)]">14+ hrs · dual T4 GPU</p>
          </div>
        </div>
      </motion.div>

      {/* Row 1: Spark Logs & DAG */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Logs Block */}
        <div className="glass-card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                PySpark Execution Logs (Historical)
              </h3>
              <p className="text-xs text-[var(--color-text-tertiary)]">Batch execution transaction logs</p>
            </div>
            {isLive && (
              <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-widest animate-pulse">
                Syncing
              </span>
            )}
          </div>

          <div className="bg-[#090C16] border border-[var(--color-border-default)] rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto h-72 scrollbar-thin flex flex-col justify-start">
            <div className="space-y-1">
              {logs.map((log, index) => {
                let colorClass = "text-slate-300";
                if (log.includes("completed") || log.includes("Success")) {
                  colorClass = "text-green-400";
                } else if (log.includes("Batch") || log.includes("Stage")) {
                  colorClass = "text-purple-400 font-medium";
                } else if (log.includes("Cores") || log.includes("Spark version")) {
                  colorClass = "text-cyan-400";
                } else if (log.includes("DirectKafkaInputDStream")) {
                  colorClass = "text-yellow-400/80";
                }
                return (
                  <div key={index} className={colorClass}>
                    {log}
                  </div>
                );
              })}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>

        {/* Live Spark Resource Monitor */}
        <div className="glass-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Executor Resource Monitor
            </h3>
            <p className="text-xs text-[var(--color-text-tertiary)]">CPU & RAM allocation loads</p>
          </div>

          <div className="space-y-4 py-2">
            {/* CPU cores */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  CPU Cores Load
                </span>
                <span className="font-mono text-cyan-400">
                  {Math.round(cpuLoads.reduce((a, b) => a + b, 0) / 4)}% Avg
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {cpuLoads.map((load, idx) => (
                  <div key={idx} className="bg-slate-900 border border-[var(--color-border-default)] rounded-lg p-2 text-center space-y-1">
                    <span className="text-[9px] text-slate-500 font-semibold font-mono">C{idx+1}</span>
                    <div className="w-full bg-slate-800 rounded-full h-12 relative overflow-hidden flex flex-col justify-end">
                      <motion.div
                        className="bg-gradient-to-t from-cyan-600 to-cyan-400 w-full"
                        animate={{ height: `${load}%` }}
                        transition={{ type: 'spring', stiffness: 80 }}
                      />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-cyan-400">{load}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RAM */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-300 font-semibold">
                <span>JVM Heap RAM Allocation</span>
                <span className="font-mono text-purple-400">{ramUsage}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-[var(--color-border-default)]">
                <motion.div
                  className="bg-gradient-to-r from-purple-600 to-purple-400 h-full"
                  animate={{ width: `${ramUsage}%` }}
                  transition={{ type: 'spring', stiffness: 50 }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>Total Heap: 8 GB</span>
                <span>Active: {(8 * (ramUsage/100)).toFixed(2)} GB</span>
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
            <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono">WER improvements grouped by severity</p>
          </div>
          <div className="h-48 relative">
            <canvas ref={sevChartRef} />
          </div>
        </div>

        <div className="glass-card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Spark SQL: WER by Noise Condition</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono">ASR accuracy under various acoustics</p>
          </div>
          <div className="h-48 relative">
            <canvas ref={noiseChartRef} />
          </div>
        </div>

        <div className="glass-card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[var(--color-text-primary)]">Spark SQL: Augmentation Boost</h3>
            <p className="text-[10px] text-[var(--color-text-tertiary)] font-mono">Error reduction percentage vs baseline</p>
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
