/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Copy, 
  Info,
  Undo2,
  Eraser,
  MousePointer2,
  Pencil,
  RotateCcw,
  Maximize2,
  Minimize2,
  Zap,
  Layout,
  ClipboardList,
  Trash2,
  Users,
  FileText,
  LineChart as LineChartIcon,
  Plus,
  X
} from "lucide-react";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
// @ts-ignore
import html2pdf from 'html2pdf.js';

// --- Types ---

interface DataRow {
  v: string;
  i: string;
}

// --- Components ---

const Formula = ({ children }: { children: React.ReactNode }) => (
  <div className="my-4 p-4 bg-slate-50 border-l-4 border-blue-500 font-mono text-lg text-center italic">
    {children}
  </div>
);

const Warning = ({ children }: { children: React.ReactNode }) => (
  <div className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
    <AlertTriangle className="text-amber-600 shrink-0" size={24} />
    <div className="text-amber-900 text-sm">{children}</div>
  </div>
);

const Figure1 = () => (
  <div className="my-6 flex flex-col items-center">
    <div className="relative w-64 h-48 border-l-2 border-b-2 border-slate-400">
      {/* Axes labels */}
      <span className="absolute -top-6 left-0 text-xs font-bold italic">i (A)</span>
      <span className="absolute -right-10 bottom-0 text-xs font-bold italic">V (V)</span>
      
      {/* Grid lines (simplified) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[1px] bg-slate-200"></div>
        <div className="h-full w-[1px] bg-slate-200 absolute"></div>
      </div>

      {/* Linear plot */}
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <line x1="0" y1="100%" x2="100%" y2="0" stroke="currentColor" strokeWidth="2" strokeDasharray="4" className="text-blue-600" />
      </svg>
    </div>
    <p className="mt-4 text-xs text-slate-500 italic text-center">
      Figura 1 - Esquematização da relação entre corrente e voltagem de um resistor ôhmico.
    </p>
  </div>
);

const Figure2 = () => (
  <div className="my-6 flex flex-col items-center">
    <div className="w-64 h-40 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-4">
      <svg viewBox="0 0 200 120" className="w-full h-full">
        {/* Source */}
        <line x1="40" y1="40" x2="40" y2="80" stroke="black" strokeWidth="2" />
        <line x1="30" y1="50" x2="50" y2="50" stroke="black" strokeWidth="2" />
        <line x1="20" y1="60" x2="60" y2="60" stroke="black" strokeWidth="4" />
        <line x1="30" y1="70" x2="50" y2="70" stroke="black" strokeWidth="2" />
        
        {/* Wires */}
        <path d="M 40 40 L 40 20 L 160 20 L 160 40" fill="none" stroke="black" strokeWidth="2" />
        <path d="M 40 80 L 40 100 L 160 100 L 160 80" fill="none" stroke="black" strokeWidth="2" />
        
        {/* Resistor */}
        <rect x="150" y="40" width="20" height="40" fill="white" stroke="black" strokeWidth="2" />
        <text x="175" y="65" fontSize="14" fontWeight="bold">R</text>
      </svg>
    </div>
    <p className="mt-4 text-xs text-slate-500 italic text-center">
      Figura 2 - Circuito em série simples.
    </p>
  </div>
);

const InteractiveLabGraph = ({ 
  title, 
  data, 
  color, 
  maxI, 
  elements, 
  setElements, 
  history, 
  setHistory,
  isReadOnly = false
}: { 
  title: string, 
  data: DataRow[], 
  color: string, 
  maxI: number,
  elements: any[],
  setElements: (elements: any[]) => void,
  history: any[],
  setHistory: (history: any[]) => void,
  isReadOnly?: boolean
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'point' | 'line' | 'eraser'>('point');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number, y: number } | null>(null);

  const PADDING = 40;
  const WIDTH = 600;
  const HEIGHT = 400;
  const MAX_V = 12;
  const MAX_I = maxI;

  useEffect(() => {
    draw();
  }, [elements, currentPos, tool]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // --- Graph Paper (Papel Milimetrado) ---
    const drawGrid = (step: number, color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      
      // Vertical lines
      for (let x = PADDING; x <= WIDTH - PADDING; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, PADDING);
        ctx.lineTo(x, HEIGHT - PADDING);
        ctx.stroke();
      }
      // Horizontal lines
      for (let y = PADDING; y <= HEIGHT - PADDING; y += step) {
        ctx.beginPath();
        ctx.moveTo(PADDING, y);
        ctx.lineTo(WIDTH - PADDING, y);
        ctx.stroke();
      }
    };

    // Minor grid (1mm equivalent)
    const gridStepX = (WIDTH - 2 * PADDING) / (MAX_V * 10);
    const gridStepY = (HEIGHT - 2 * PADDING) / 50; // 5 main intervals * 10
    
    drawGrid(gridStepX, '#f1f5f9', 0.5);
    drawGrid(gridStepX * 5, '#e2e8f0', 0.8);
    drawGrid(gridStepX * 10, '#cbd5e1', 1);

    // Labels V
    for (let v = 0; v <= MAX_V; v++) {
      const x = PADDING + (v / MAX_V) * (WIDTH - 2 * PADDING);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(v.toString(), x, HEIGHT - PADDING + 20);
    }

    // Labels I
    for (let i = 0; i <= 5; i++) {
      const val = (i / 5) * MAX_I;
      const y = HEIGHT - PADDING - (i / 5) * (HEIGHT - 2 * PADDING);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(4), PADDING - 8, y + 4);
    }

    // Draw Axes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING);
    ctx.lineTo(PADDING, HEIGHT - PADDING);
    ctx.lineTo(WIDTH - PADDING, HEIGHT - PADDING);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('V (V)', WIDTH / 2, HEIGHT - 5);
    ctx.save();
    ctx.translate(10, HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('I (A)', 0, 0);
    ctx.restore();

    // Draw Elements
    elements.forEach(el => {
      if (el.type === 'point') {
        ctx.fillStyle = el.color || color;
        ctx.beginPath();
        ctx.arc(el.x, el.y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.type === 'line') {
        ctx.strokeStyle = el.color || color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
      }
    });

    // Draw current drawing line
    if (isDrawing && tool === 'line' && startPos && currentPos) {
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.width || !canvas.height) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Scale coordinates to match internal canvas resolution
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isReadOnly) return;
    const pos = getMousePos(e);
    if (tool === 'eraser') {
      const newElements = elements.filter(el => {
        if (el.type === 'point') {
          const dist = Math.sqrt((el.x - pos.x) ** 2 + (el.y - pos.y) ** 2);
          return dist > 10;
        } else if (el.type === 'line') {
          // Simple distance to line segment check
          const d = distToSegment(pos, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 });
          return d > 10;
        }
        return true;
      });
      if (newElements.length !== elements.length) {
        saveToHistory();
        setElements(newElements);
      }
      return;
    }

    if (tool === 'point') {
      saveToHistory();
      setElements([...elements, { type: 'point', x: pos.x, y: pos.y, color: '#2563eb' }]);
    } else if (tool === 'line') {
      setIsDrawing(true);
      setStartPos(pos);
      setCurrentPos(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isReadOnly || !isDrawing) return;
    const pos = getMousePos(e);
    setCurrentPos(pos);
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (isReadOnly) return;
    if (isDrawing && tool === 'line' && startPos) {
      const pos = getMousePos(e);
      saveToHistory();
      setElements([...elements, { type: 'line', x1: startPos.x, y1: startPos.y, x2: pos.x, y2: pos.y, color: '#2563eb' }]);
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  const saveToHistory = () => {
    setHistory([...history, JSON.parse(JSON.stringify(elements))]);
  };

  const undo = () => {
    if (isReadOnly || history.length === 0) return;
    const prev = history[history.length - 1];
    setElements(prev);
    setHistory(history.slice(0, -1));
  };

  const clear = () => {
    if (isReadOnly) return;
    saveToHistory();
    setElements([]);
  };

  const distToSegment = (p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2);
  };

  return (
    <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 ${isReadOnly ? 'p-0 border-none shadow-none' : ''}`}>
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h4>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setTool('point')}
              className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${tool === 'point' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Pencil size={16} /> Ponto
            </button>
            <button 
              onClick={() => setTool('line')}
              className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${tool === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Maximize2 size={16} /> Reta
            </button>
            <button 
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${tool === 'eraser' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Eraser size={16} /> Borracha
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={undo}
              disabled={history.length === 0}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-all"
              title="Desfazer"
            >
              <Undo2 size={18} />
            </button>
            <button 
              onClick={clear}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all"
              title="Limpar Tudo"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden cursor-crosshair touch-none">
        <canvas 
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="w-full h-auto block"
        />
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <div className="text-xs text-blue-800 leading-relaxed">
          <p className="font-bold mb-1">Instruções de Plotagem:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Use a ferramenta <strong>Ponto</strong> para marcar as coordenadas medidas.</li>
            <li>Use a ferramenta <strong>Reta</strong> para traçar a linha de melhor ajuste (clique e arraste).</li>
            <li>A <strong>Borracha</strong> remove elementos ao clicar sobre eles.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const DataTable = ({ title, data, onChange }: { title: string, data: DataRow[], onChange: (idx: number, field: keyof DataRow, val: string) => void }) => {
  const handleCopy = () => {
    const text = data.map((row, i) => `${i + 1}\t${row.v}\t${row.i}`).join("\n");
    navigator.clipboard.writeText(`Medida\tV (V)\tI (A)\n${text}`);
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Medida,V (V),I (A)\n"
      + data.map((row, i) => `${i + 1},${row.v},${row.i}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}_dados.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden my-6">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <div className="flex gap-2">
          <button 
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
            title="Copiar dados"
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={handleExport}
            className="p-1.5 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
            title="Exportar CSV"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-4 py-2 border-b border-slate-100">Medida</th>
              <th className="px-4 py-2 border-b border-slate-100">V (V)</th>
              <th className="px-4 py-2 border-b border-slate-100">I (A)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2 text-slate-400 font-mono">{idx + 1}</td>
                <td className="px-2 py-1">
                  <input 
                    type="text" 
                    value={row.v}
                    onChange={(e) => onChange(idx, "v", e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 font-mono text-slate-700"
                    placeholder=""
                  />
                </td>
                <td className="px-2 py-1">
                  <input 
                    type="text" 
                    value={row.i}
                    onChange={(e) => onChange(idx, "i", e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 font-mono text-slate-700"
                    placeholder=""
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'cover' | 'content'>('cover');
  const [isApproved, setIsApproved] = useState(false);
  const [data560, setData560] = useState<DataRow[]>(Array(12).fill(null).map(() => ({ v: "", i: "" })));
  const [data10k, setData10k] = useState<DataRow[]>(Array(12).fill(null).map(() => ({ v: "", i: "" })));
  const [graphElements560, setGraphElements560] = useState<any[]>([]);
  const [graphHistory560, setGraphHistory560] = useState<any[]>([]);
  const [graphElements10k, setGraphElements10k] = useState<any[]>([]);
  const [graphHistory10k, setGraphHistory10k] = useState<any[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([""]);
  const [experimentInfo, setExperimentInfo] = useState({
    university: "Universidade Federal do Rio Grande do Norte",
    center: "Centro de Ciências Exatas e da Terra",
    department: "DFTE/UFRN",
    experiment: "Experimento 3 – Elementos Ôhmicos",
    date: new Date().toLocaleDateString('pt-BR'),
    teacher: "",
    classGroup: ""
  });
  const [cleanup, setCleanup] = useState({
    desmonte: false,
    pilha: false,
    limpeza: false,
    cadeiras: false
  });

  const [calculationResults, setCalculationResults] = useState({
    r560: { slope: "", calculatedR: "", measuredR: "", error: "", power: "" },
    r10k: { slope: "", calculatedR: "", measuredR: "", error: "", power: "" }
  });
  const [answers, setAnswers] = useState<string[]>(["", ""]);

  const reportRef = useRef<HTMLDivElement>(null);

  const addMember = () => setGroupMembers([...groupMembers, ""]);
  const removeMember = (index: number) => setGroupMembers(groupMembers.filter((_, i) => i !== index));
  const updateMember = (index: number, val: string) => {
    const newMembers = [...groupMembers];
    newMembers[index] = val;
    setGroupMembers(newMembers);
  };

  const formatComma = (val: any) => {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'number') {
      return val.toLocaleString('pt-BR');
    }
    return val.toString().replace('.', ',');
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    const reportElement = document.getElementById('printable-report');
    if (!reportElement) {
      alert("Erro: Relatório não encontrado.");
      return;
    }

    setIsGenerating(true);
    let tempContainer: HTMLDivElement | null = null;

    try {
      // Create a temporary container for rendering to avoid flickering the main UI
      tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-10000px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.backgroundColor = 'white';
      document.body.appendChild(tempContainer);

      // Clone the report
      const clone = reportElement.cloneNode(true) as HTMLElement;
      clone.classList.remove('hidden', 'print:block');
      clone.style.display = 'block';
      tempContainer.appendChild(clone);

      // Handle canvases: replace them with images in the clone
      const originalCanvases = reportElement.querySelectorAll('canvas');
      const clonedCanvases = clone.querySelectorAll('canvas');
      
      originalCanvases.forEach((canvas, idx) => {
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.style.width = '100%';
        img.style.maxWidth = '600px';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        
        const clonedCanvas = clonedCanvases[idx];
        if (clonedCanvas && clonedCanvas.parentNode) {
          clonedCanvas.parentNode.replaceChild(img, clonedCanvas);
        }
      });

      // Wait a bit for images/fonts to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      const opt = {
        margin: 10,
        filename: `Relatorio_${experimentInfo.experiment.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 3, 
          useCORS: true, 
          letterRendering: true,
          logging: false
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] as any }
      };

      // Generate PDF using html2pdf.js
      await html2pdf().set(opt).from(clone).save();
      
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Houve um erro ao gerar o PDF. Por favor, tente novamente.");
    } finally {
      if (tempContainer && tempContainer.parentNode) {
        document.body.removeChild(tempContainer);
      }
      setIsGenerating(false);
    }
  };

  const updateData560 = (idx: number, field: keyof DataRow, val: string) => {
    const newData = [...data560];
    newData[idx] = { ...newData[idx], [field]: val };
    setData560(newData);
  };

  const updateData10k = (idx: number, field: keyof DataRow, val: string) => {
    const newData = [...data10k];
    newData[idx] = { ...newData[idx], [field]: val };
    setData10k(newData);
  };

  if (view === 'cover') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white p-12 rounded-3xl shadow-2xl border border-slate-200 text-center"
        >
          <div className="mb-12">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
              Universidade Federal do Rio Grande do Norte
            </h2>
            <p className="text-sm text-slate-500 font-medium">{experimentInfo.center}</p>
            <p className="text-sm text-slate-500 font-medium">{experimentInfo.department}</p>
            <div className="h-px bg-slate-200 w-24 mx-auto my-8" />
            <div className="bg-blue-600 p-4 rounded-3xl text-white inline-flex items-center justify-center mb-6 shadow-xl shadow-blue-100">
              <Zap size={48} strokeWidth={3} />
            </div>
            <h3 className="text-4xl font-black text-black mt-4 leading-tight">{experimentInfo.experiment}</h3>
          </div>

          <div className="space-y-4 mb-8 text-left max-w-lg mx-auto">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professor(a)</label>
              <input 
                type="text" 
                value={experimentInfo.teacher}
                onChange={(e) => setExperimentInfo(prev => ({ ...prev, teacher: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-base focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turma</label>
              <input 
                type="text" 
                value={experimentInfo.classGroup}
                onChange={(e) => setExperimentInfo(prev => ({ ...prev, classGroup: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-4 mb-12 text-left max-w-md mx-auto">
            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              <Users size={14} /> Componentes do Grupo
            </h4>
            {groupMembers.map((member, idx) => (
              <div key={idx} className="flex gap-2">
                <input 
                  type="text" 
                  value={member}
                  onChange={(e) => updateMember(idx, e.target.value)}
                  placeholder={`Nome do Aluno ${idx + 1}`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {groupMembers.length > 1 && (
                  <button onClick={() => removeMember(idx)} className="p-3 text-slate-400 hover:text-red-500"><X size={18} /></button>
                )}
              </div>
            ))}
            <button 
              onClick={addMember}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Plus size={16} /> Adicionar Membro
            </button>
          </div>

          <button 
            onClick={() => setView('content')}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            Iniciar Experimento
            <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 no-print">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <button onClick={() => setView('cover')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <ChevronLeft size={20} />
          </button>
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Zap size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-black">Elementos Ôhmicos</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">DFTE/UFRN</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
          <span className="text-[10px] font-bold text-black uppercase">Experimento 3</span>
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-3xl mx-auto px-4 py-8 pb-32 space-y-16 no-print">
        {/* 1. CAPA (Hidden in main view, used for PDF) */}
        <div className="hidden">
          <section id="capa" className="scroll-mt-20">
            <div className="text-center mb-12">
              <h2 className="text-lg font-bold text-slate-700 uppercase tracking-widest">{experimentInfo.university}</h2>
              <p className="text-sm text-slate-500 font-medium">{experimentInfo.center}</p>
              <p className="text-sm text-slate-500 font-medium">{experimentInfo.department}</p>
              <div className="h-px bg-slate-200 w-24 mx-auto my-6" />
              <div className="bg-blue-600 p-3 rounded-2xl text-white inline-flex items-center justify-center mb-4 shadow-lg shadow-blue-100">
                <Zap size={32} strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-black text-black mt-4">{experimentInfo.experiment}</h3>
            </div>
          </section>
        </div>

        {/* 2. APRESENTAÇÃO */}
        <section id="apresentacao" className="scroll-mt-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-100">
              <Zap size={24} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black text-black">{experimentInfo.experiment}</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">
                <Layout size={16} /> Objetivos
              </h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex gap-3">
                  <span className="text-blue-500 font-bold">1.1</span>
                  <span>Construir as curvas características de I vs V.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-500 font-bold">1.2</span>
                  <span>Classificação de componentes ôhmicos.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-500 font-bold">1.3</span>
                  <span>Verificação dos resultados com a teoria usando as leis básicas.</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">
                <ClipboardList size={16} /> Material Utilizado
              </h3>
              <ul className="grid grid-cols-1 gap-2 text-slate-700">
                <li className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  Fonte de alimentação DC variável (PHYWE)
                </li>
                <li className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  Multímetro Digital (MINIPA)
                </li>
                <li className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  Dois resistores: 560 Ω e 10 kΩ
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. TEORIA */}
        <section id="teoria" className="scroll-mt-20">
          <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider border-b-2 border-blue-100 pb-2">Teoria</h2>
          <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed space-y-4">
            <p>
              Em 1826, George Simon Ohm descobriu que, para um determinado condutor, a corrente <span className="italic font-bold">I</span> no condutor e a diferença de potencial <span className="italic font-bold">V</span> entre suas extremidades são diretamente proporcionais:
            </p>
            
            <Formula>V = R · I</Formula>

            <p>
              onde <span className="italic font-bold">R</span> é a constante de proporcionalidade determinada pelas propriedades físicas e elétricas do condutor, chamada de "resistência", medida em ohms (Ω).
            </p>
            <p>
              A relação linear acima é conhecida como Lei de Ohm. Qualquer dispositivo que exiba esse comportamento elétrico é considerado ôhmico.
            </p>
            <p>
              Quando a diferença de potencial entre um dispositivo ôhmico é invertida na polaridade, a corrente inverte a direção, mas a resistência <span className="italic font-bold">R</span> permanece constante.
            </p>
            <p>
              O gráfico de corrente em função da voltagem (curva I vs V) forma uma linha reta para um resistor simples. A inclinação da linha é o inverso da resistência, 1/R, denominado condutância.
            </p>
          </div>
          
          <Figure1 />

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Referências Bibliográficas
            </h3>
            <ul className="space-y-2 text-xs text-slate-500 italic">
              <li>1) Fundamentos de Física 3, 10ª ed. – Halliday, Resnick e Walker.</li>
              <li>2) Física para Cientistas e Engenheiros, vol. 2, 6ª ed. – Tipler e Mosca.</li>
            </ul>
          </div>
        </section>

        {/* 4. CUIDADOS E MONTAGEM */}
        <section id="montagem" className="scroll-mt-20">
          <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider border-b-2 border-blue-100 pb-2">Cuidados e Montagem</h2>
          
          <Warning>
            <p className="font-bold mb-1 uppercase tracking-tight">⚠️ CUIDADOS IMPORTANTES:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Para medição de tensão elétrica: o multímetro deve estar sempre em <span className="font-bold underline">PARALELO</span> com o resistor, nunca em série.</li>
              <li>Para medição de corrente: o multímetro deve estar sempre em <span className="font-bold underline">SÉRIE</span> com o resistor, nunca em paralelo.</li>
              <li>O circuito só poderá ser ligado após ser <span className="font-bold">APROVADO</span> pelo(a) professor(a).</li>
            </ul>
          </Warning>

          <div className="bg-white p-6 rounded-xl border border-slate-200 my-8">
            <h4 className="font-bold text-slate-800 mb-3">Instrução de Montagem:</h4>
            <p className="text-sm text-slate-600 mb-4">
              Monte o circuito em série simples conforme a Figura 2, utilizando a fonte DC, o resistor de 560 Ω e dois multímetros simultaneamente: um como amperímetro e outro para medir a voltagem sobre o resistor.
            </p>
            <p className="text-sm font-medium text-blue-600">
              Lembre-se de verificar o valor da resistência com o multímetro antes de ligar o circuito.
            </p>
          </div>

          <Figure2 />

          <label 
            htmlFor="approval" 
            className={`mt-8 p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-5 ${
              isApproved 
                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
              isApproved
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-slate-300 bg-white'
            }`}>
              <input 
                type="checkbox" 
                id="approval"
                checked={isApproved}
                onChange={(e) => setIsApproved(e.target.checked)}
                className="sr-only"
              />
              {isApproved && <CheckCircle2 size={18} strokeWidth={3} />}
            </div>
            <span className={`text-base font-bold transition-colors ${
              isApproved ? 'text-blue-900' : 'text-slate-600'
            }`}>
              Circuito montado e aprovado pelo(a) professor(a).
            </span>
          </label>
        </section>

        {/* 5. COLETA DE DADOS */}
        <section id="coleta" className="scroll-mt-20">
          <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider border-b-2 border-blue-100 pb-2">Coleta de Dados</h2>
          
          <div className="space-y-12">
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4">Resistor de 560 Ω</h3>
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 text-sm text-slate-700 mb-6">
                <h4 className="font-bold text-blue-600 uppercase tracking-wider mb-2">Procedimento:</h4>
                <ol className="list-decimal ml-4 space-y-2">
                  <li>Ajuste a voltagem de saída da fonte para 1 V.</li>
                  <li>Certifique-se de que a corrente máxima da fonte esteja ajustada para 1 A.</li>
                  <li>Meça a corrente (I) e a voltagem (V) sobre o resistor.</li>
                  <li>Aumente a voltagem da fonte de 1 em 1 volt até 12 V, registrando I e V para cada ponto.</li>
                </ol>
              </div>
              <DataTable 
                title="Ficha de Dados: Resistor 560 Ω" 
                data={data560} 
                onChange={updateData560} 
              />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4">Resistor de 10 kΩ</h3>
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 text-sm text-slate-700 mb-6">
                <h4 className="font-bold text-blue-600 uppercase tracking-wider mb-2">Procedimento:</h4>
                <p>Troque o resistor de 560 Ω pelo resistor de 10 kΩ e repita o mesmo procedimento:</p>
                <ol className="list-decimal ml-4 space-y-2">
                  <li>Ajuste a voltagem da fonte para 1 V.</li>
                  <li>Meça a corrente (I) e a voltagem (V) sobre o resistor.</li>
                  <li>Aumente a voltagem de 1 em 1 volt até 12 V, registrando I e V para cada ponto.</li>
                </ol>
              </div>
              <DataTable 
                title="Ficha de Dados: Resistor 10 kΩ" 
                data={data10k} 
                onChange={updateData10k} 
              />
            </div>
          </div>
        </section>

        {/* 6. GRÁFICO E ANÁLISE */}
        <section id="analise" className="scroll-mt-20">
          <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider border-b-2 border-blue-100 pb-2">Gráfico e Análise</h2>
          
          <div className="space-y-12">
            <div className="space-y-8">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">
                <LineChartIcon size={16} /> Plotagem Manual de Pontos
              </h4>
              
              <InteractiveLabGraph 
                title="Gráfico I vs V - Resistor 560 Ω" 
                data={data560} 
                color="#2563eb" 
                maxI={0.025} 
                elements={graphElements560}
                setElements={setGraphElements560}
                history={graphHistory560}
                setHistory={setGraphHistory560}
              />
              <InteractiveLabGraph 
                title="Gráfico I vs V - Resistor 10 kΩ" 
                data={data10k} 
                color="#10b981" 
                maxI={0.002} 
                elements={graphElements10k}
                setElements={setGraphElements10k}
                history={graphHistory10k}
                setHistory={setGraphHistory10k}
              />
            </div>

            <div className="space-y-6 text-slate-700">
              <p className="text-lg font-medium">Com os dados coletados para cada resistor, preencha a tabela abaixo:</p>

              <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200 mt-10">
                <h4 className="font-black uppercase tracking-widest text-xs opacity-80 mb-3">Lembrete Importante</h4>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm opacity-90 mb-2 uppercase tracking-wider font-bold">Resistência:</p>
                    <p className="leading-relaxed">
                      A inclinação da reta I vs V é igual a 1/R (condutância). Portanto:
                    </p>
                    <div className="mt-2 text-2xl font-mono text-center bg-slate-100 text-blue-900 p-4 rounded-xl shadow-inner">
                      R = ΔV / ΔI
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-sm opacity-90 mb-2 uppercase tracking-wider font-bold">Cálculo de Erro:</p>
                    <p className="leading-relaxed mb-2">
                      Para comparar o valor experimental com o valor medido:
                    </p>
                    <div className="text-xl font-mono text-center bg-slate-100 text-blue-900 p-4 rounded-xl shadow-inner">
                      Erro (%) = <span className="text-2xl">|</span> (R<sub>medido</sub> - R<sub>calc</sub>) / R<sub>medido</sub> <span className="text-2xl">|</span> × 100%
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/20">
                    <p className="text-sm opacity-90 mb-2 uppercase tracking-wider font-bold">Potência Dissipada:</p>
                    <p className="leading-relaxed mb-2">
                      A potência elétrica dissipada por um resistor é dada por:
                    </p>
                    <div className="text-2xl font-mono text-center bg-slate-100 text-blue-900 p-4 rounded-xl shadow-inner">
                      P = V · I
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de Resultados dos Cálculos */}
              <div className="mt-12 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">Resultados dos Cálculos</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-4 py-3 border border-slate-200">Resistor</th>
                        <th className="px-4 py-3 border border-slate-200">Inclinação (A/V)</th>
                        <th className="px-4 py-3 border border-slate-200">R Calculado (Ω)</th>
                        <th className="px-4 py-3 border border-slate-200">R Medido (Ω)</th>
                        <th className="px-4 py-3 border border-slate-200">Erro (%)</th>
                        <th className="px-4 py-3 border border-slate-200">Potência Dissipada (W)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-3 border border-slate-200 font-bold">560 Ω</td>
                        <td className="px-4 py-3 border border-slate-200">
                          <input 
                            type="text" 
                            value={calculationResults.r560.slope}
                            onChange={(e) => setCalculationResults(prev => ({ ...prev, r560: { ...prev.r560, slope: e.target.value } }))}
                            className="w-full bg-transparent border-none focus:ring-0 p-0" 
                            placeholder="..." 
                          />
                        </td>
                        <td className="px-4 py-3 border border-slate-200">
                          <input 
                            type="text" 
                            value={calculationResults.r560.calculatedR}
                            onChange={(e) => setCalculationResults(prev => ({ ...prev, r560: { ...prev.r560, calculatedR: e.target.value } }))}
                            className="w-full bg-transparent border-none focus:ring-0 p-0" 
                            placeholder="..." 
                          />
                        </td>
                        <td className="px-4 py-3 border border-slate-200">
                          <input 
                            type="text" 
                            value={calculationResults.r560.measuredR}
                            onChange={(e) => setCalculationResults(prev => ({ ...prev, r560: { ...prev.r560, measuredR: e.target.value } }))}
                            className="w-full bg-transparent border-none focus:ring-0 p-0" 
                            placeholder="..." 
                          />
                        </td>
                        <td className="px-4 py-3 border border-slate-200">
                          <input 
                            type="text" 
                            value={calculationResults.r560.error}
                            onChange={(e) => setCalculationResults(prev => ({ ...prev, r560: { ...prev.r560, error: e.target.value } }))}
                            className="w-full bg-transparent border-none focus:ring-0 p-0" 
                            placeholder="..." 
                          />
                        </td>
                        <td className="px-4 py-3 border border-slate-200">
                          <input 
                            type="text" 
                            value={calculationResults.r560.power}
                            onChange={(e) => setCalculationResults(prev => ({ ...prev, r560: { ...prev.r560, power: e.target.value } }))}
                            className="w-full bg-transparent border-none focus:ring-0 p-0" 
                            placeholder="..." 
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 border border-slate-200 font-bold">10 kΩ</td>
                        <td className="px-4 py-3 border border-slate-200">
                          <input 
                            type="text" 
                            value={calculationResults.r10k.slope}
                            onChange={(e) => setCalculationResults(prev => ({ ...prev, r10k: { ...prev.r10k, slope: e.target.value } }))}
                            className="w-full bg-transparent border-none focus:ring-0 p-0" 
                            placeholder="..." 
                          />
                        </td>
                        <td className="px-4 py-3 border border-slate-200">
                          <input 
                            type="text" 
                            value={calculationResults.r10k.calculatedR}
                            onChange={(e) => setCalculationResults(prev => ({ ...prev, r10k: { ...prev.r10k, calculatedR: e.target.value } }))}
                            className="w-full bg-transparent border-none focus:ring-0 p-0" 
                            placeholder="..." 
                          />
                        </td>
                        <td className="px-4 py-3 border border-slate-200">
                          <input 
                            type="text" 
                            value={calculationResults.r10k.measuredR}
                            onChange={(e) => setCalculationResults(prev => ({ ...prev, r10k: { ...prev.r10k, measuredR: e.target.value } }))}
                            className="w-full bg-transparent border-none focus:ring-0 p-0" 
                            placeholder="..." 
                          />
                        </td>
                        <td className="px-4 py-3 border border-slate-200">
                          <input 
                            type="text" 
                            value={calculationResults.r10k.error}
                            onChange={(e) => setCalculationResults(prev => ({ ...prev, r10k: { ...prev.r10k, error: e.target.value } }))}
                            className="w-full bg-transparent border-none focus:ring-0 p-0" 
                            placeholder="..." 
                          />
                        </td>
                        <td className="px-4 py-3 border border-slate-200">
                          <input 
                            type="text" 
                            value={calculationResults.r10k.power}
                            onChange={(e) => setCalculationResults(prev => ({ ...prev, r10k: { ...prev.r10k, power: e.target.value } }))}
                            className="w-full bg-transparent border-none focus:ring-0 p-0" 
                            placeholder="..." 
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. PERGUNTAS */}
        <section id="perguntas" className="scroll-mt-20">
          <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-wider border-b-2 border-blue-100 pb-2">Perguntas</h2>
          
          <div className="space-y-8">
            {[
              {
                q: "Pergunta 1",
                text: "Com base nos gráficos obtidos, a relação entre a tensão (V) e a corrente (I) é linear para ambos os resistores? O que isso indica sobre a natureza desses componentes em relação à Lei de Ohm?"
              },
              {
                q: "Pergunta 2",
                text: "Compare os valores de resistência medidos com o multímetro com os valores nominais (560 Ω e 10 kΩ) e com os valores calculados a partir da inclinação da reta. Quais são as possíveis fontes de erro experimental que podem ter influenciado essas diferenças?"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-blue-600 font-black text-xs uppercase tracking-widest mb-3">{item.q}</h4>
                <p className="text-slate-800 font-medium mb-4">{item.text}</p>
                <textarea 
                  value={answers[idx]}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[idx] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-slate-700 text-sm"
                  placeholder="Escreva sua resposta aqui..."
                />
              </div>
            ))}
          </div>
        </section>

        {/* 8. ENCERRAMENTO */}
        <section id="encerramento" className="scroll-mt-20 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full">
              <CheckCircle2 size={64} />
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Conclusão do Experimento</h2>
          <p className="text-slate-500 mb-12">Certifique-se de que todos os dados foram coletados e o relatório foi gerado.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-left shadow-xl shadow-slate-200/50">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Trash2 size={20} className="text-red-500" /> Checklist de Encerramento
              </h3>
              <div className="space-y-4">
                {[
                  { id: 'desmonte', label: "Desmonte todos os circuitos e conexões." },
                  { id: 'pilha', label: "Coloque os fios em uma pilha organizada." },
                  { id: 'limpeza', label: "Limpe a bancada." },
                  { id: 'cadeiras', label: "Coloque as cadeiras embaixo das bancadas do laboratório." }
                ].map((item) => (
                  <label 
                    key={item.id} 
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                      cleanup[item.id as keyof typeof cleanup] 
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                      cleanup[item.id as keyof typeof cleanup]
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={cleanup[item.id as keyof typeof cleanup]}
                        onChange={(e) => setCleanup(prev => ({ ...prev, [item.id]: e.target.checked }))}
                        className="sr-only"
                      />
                      {cleanup[item.id as keyof typeof cleanup] && <CheckCircle2 size={14} strokeWidth={3} />}
                    </div>
                    <span className={`text-sm font-semibold transition-colors ${
                      cleanup[item.id as keyof typeof cleanup] ? 'text-emerald-900' : 'text-slate-600'
                    }`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleGeneratePDF}
                  disabled={isGenerating}
                  className={`w-full flex items-center justify-center gap-3 py-8 rounded-3xl font-black text-xl shadow-2xl transition-all active:scale-95 group ${
                    isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black text-white'
                  }`}
                >
                  {isGenerating ? (
                    <>Processando PDF...</>
                  ) : (
                    <>
                      <FileText size={32} className="group-hover:scale-110 transition-transform" /> 
                      BAIXAR RELATÓRIO PDF
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed px-4 text-center">
                O arquivo será gerado e o download iniciará automaticamente.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Report for Printing/Viewing */}
      <div id="printable-report" className="hidden print:block bg-white text-black font-serif w-full max-w-[210mm] mx-auto">
        <div className="p-12 space-y-12">
          {/* 1. CAPA */}
          <div className="text-center flex flex-col justify-between py-12 px-10 border-[10px] border-double border-slate-200">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold uppercase tracking-widest">{experimentInfo.university}</h1>
              <h2 className="text-xl font-medium">{experimentInfo.center}</h2>
              <h2 className="text-xl font-medium">{experimentInfo.department}</h2>
            </div>
            
            <div className="flex flex-col items-center gap-8 my-12">
              <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-white">
                <Zap size={48} />
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">Relatório Experimental</p>
                <h3 className="text-4xl font-black uppercase tracking-tight leading-none">{experimentInfo.experiment}</h3>
              </div>
            </div>
            
            <div className="text-left max-w-xl mx-auto space-y-8">
              <div className="space-y-4">
                <p className="font-bold uppercase tracking-widest text-xs text-slate-400 border-b pb-2">Equipe de Trabalho</p>
                <ul className="space-y-3">
                  {groupMembers.map((m, i) => (
                    <li key={i} className="text-xl font-medium flex items-center gap-3">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      {m || "________________________________________"}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-12 pt-6 border-t border-slate-100">
                <div>
                  <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-2">Orientador(a)</p>
                  <p className="text-lg font-bold text-slate-800">{experimentInfo.teacher || "____________________"}</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-2">Turma / Período</p>
                  <p className="text-lg font-bold text-slate-800">{experimentInfo.classGroup || "____________________"}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12">
              <p className="text-lg font-bold tracking-widest uppercase">Natal - RN</p>
              <p className="text-slate-500 font-medium">{experimentInfo.date}</p>
            </div>
          </div>

          {/* CONTEÚDO */}
          <div className="space-y-12 text-justify leading-relaxed">
            <section>
              <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">Resumo</h2>
              <p className="italic text-slate-700">
                Este relatório apresenta os resultados obtidos no experimento de caracterização de elementos ôhmicos. Através da montagem de circuitos em série e medições sistemáticas de corrente e tensão, foram construídas as curvas características para dois resistores de valores nominais distintos (560 Ω e 10 kΩ). A análise dos dados permitiu verificar a linearidade da relação V = RI, confirmando a natureza ôhmica dos componentes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">1. Objetivos</h2>
              <ul className="list-disc ml-10 space-y-2">
                <li>Construir as curvas características de corrente (I) vs voltagem (V).</li>
                <li>Verificar a validade da Lei de Ohm.</li>
                <li>Determinar experimentalmente os valores de resistência.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">2. Fundamentação Teórica</h2>
              <p>A Lei de Ohm estabelece a proporcionalidade entre tensão e corrente:</p>
              <div className="text-center my-8 text-2xl font-mono p-6 bg-slate-50 border border-slate-200">V = R · I</div>
            </section>
          </div>

          {/* DADOS */}
          <div className="space-y-12 text-justify leading-relaxed">
            <section>
              <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">3. Dados Coletados</h2>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold mb-4 text-center">Resistor 560 Ω</h3>
                  <table className="w-full border-collapse border border-black text-center">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-black p-2">V (V)</th>
                        <th className="border border-black p-2">I (A)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data560.map((d, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2">{d.v || "---"}</td>
                          <td className="border border-black p-2">{d.i || "---"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="font-bold mb-4 text-center">Resistor 10 kΩ</h3>
                  <table className="w-full border-collapse border border-black text-center">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="border border-black p-2">V (V)</th>
                        <th className="border border-black p-2">I (A)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data10k.map((d, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2">{d.v || "---"}</td>
                          <td className="border border-black p-2">{d.i || "---"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>

          {/* GRÁFICOS */}
          <div className="space-y-12 text-justify leading-relaxed">
            <section>
              <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">4. Gráficos</h2>
              <div className="space-y-12">
                <div className="flex flex-col items-center">
                  <div className="border border-slate-200 p-4">
                    <InteractiveLabGraph 
                      title="Gráfico 1: I vs V (560 Ω)" 
                      data={data560} 
                      color="#2563eb" 
                      maxI={0.025}
                      elements={graphElements560}
                      setElements={() => {}}
                      history={[]}
                      setHistory={() => {}}
                      isReadOnly={true}
                    />
                  </div>
                  <p className="mt-2 italic text-sm">Gráfico 1 - Curva característica (560 Ω).</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="border border-slate-200 p-4">
                    <InteractiveLabGraph 
                      title="Gráfico 2: I vs V (10 kΩ)" 
                      data={data10k} 
                      color="#10b981" 
                      maxI={0.002}
                      elements={graphElements10k}
                      setElements={() => {}}
                      history={[]}
                      setHistory={() => {}}
                      isReadOnly={true}
                    />
                  </div>
                  <p className="mt-2 italic text-sm">Gráfico 2 - Curva característica (10 kΩ).</p>
                </div>
              </div>
            </section>
          </div>

          {/* RESULTADOS */}
          <div className="space-y-12 text-justify leading-relaxed">
            <section>
              <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">5. Resultados e Discussão</h2>
              <table className="w-full border-collapse border border-black text-center mb-12">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-2">Resistor</th>
                    <th className="border border-black p-2">R Calc (Ω)</th>
                    <th className="border border-black p-2">Erro (%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold">560 Ω</td>
                    <td className="border border-black p-2">{calculationResults.r560.calculatedR || "---"}</td>
                    <td className="border border-black p-2">{calculationResults.r560.error || "---"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold">10 kΩ</td>
                    <td className="border border-black p-2">{calculationResults.r10k.calculatedR || "---"}</td>
                    <td className="border border-black p-2">{calculationResults.r10k.error || "---"}</td>
                  </tr>
                </tbody>
              </table>

              <div className="space-y-8">
                {answers.map((ans, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="font-bold">Discussão {idx + 1}:</p>
                    <div className="p-4 bg-slate-50 border border-slate-200 min-h-[100px]">
                      {ans || "Sem resposta."}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-20 pt-10 border-t border-black text-center">
              <p className="italic text-sm">Fim do Relatório Experimental</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Report for Image Capture (html2canvas fallback) */}
      <div data-report-container style={{ position: 'fixed', left: '-10000px', top: '0', zIndex: -100, visibility: 'hidden' }}>
        <div ref={reportRef} className="p-10 bg-white text-black font-serif w-[210mm] min-h-screen">
          {/* 1. CAPA */}
          <div data-pdf-section data-pdf-section-id="0" className="text-center mb-20 min-h-[260mm] flex flex-col justify-between py-12 px-10 border-[10px] border-double border-slate-100">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold uppercase tracking-widest">{experimentInfo.university}</h1>
              <h2 className="text-xl font-medium">{experimentInfo.center}</h2>
              <h2 className="text-xl font-medium">{experimentInfo.department}</h2>
            </div>
            
            <div className="flex flex-col items-center gap-8 my-12">
              <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-2xl">
                <Zap size={48} />
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">Relatório Experimental</p>
                <h3 className="text-4xl font-black uppercase tracking-tight leading-none max-w-2xl mx-auto">{experimentInfo.experiment}</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-12 text-left max-w-xl mx-auto">
              <div className="space-y-4">
                <p className="font-bold uppercase tracking-widest text-xs text-slate-400 border-b pb-2">Equipe de Trabalho</p>
                <ul className="space-y-3">
                  {groupMembers.map((m, i) => (
                    <li key={i} className="text-xl font-medium flex items-center gap-3">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      {m || "________________________________________"}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-12 pt-6 border-t border-slate-100">
                <div>
                  <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-2">Orientador(a)</p>
                  <p className="text-lg font-bold text-slate-800">{experimentInfo.teacher || "____________________"}</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-2">Turma / Período</p>
                  <p className="text-lg font-bold text-slate-800">{experimentInfo.classGroup || "____________________"}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12">
              <p className="text-lg font-bold tracking-widest uppercase">Natal - RN</p>
              <p className="text-slate-500 font-medium">{experimentInfo.date}</p>
            </div>
          </div>

          {/* RESUMO */}
          <div data-pdf-section data-pdf-section-id="1" className="mb-16 px-10">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">Resumo</h2>
            <p className="text-justify leading-relaxed italic text-slate-700">
              Este relatório apresenta os resultados obtidos no experimento de caracterização de elementos ôhmicos. Através da montagem de circuitos em série e medições sistemáticas de corrente e tensão, foram construídas as curvas características para dois resistores de valores nominais distintos (560 Ω e 10 kΩ). A análise dos dados permitiu verificar a linearidade da relação V = RI, confirmando a natureza ôhmica dos componentes e possibilitando o cálculo experimental das resistências através da inclinação das retas ajustadas. Os resultados foram comparados com os valores medidos via multímetro, discutindo-se as incertezas e erros inerentes ao processo experimental.
            </p>
            <p className="mt-4 font-bold text-sm">Palavras-chave: Lei de Ohm, Resistores, Curva Característica, Linearidade, Medidas Elétricas.</p>
          </div>
          
          {/* 2. OBJETIVOS */}
          <div data-pdf-section data-pdf-section-id="2" className="mb-16 px-10">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">1. Objetivos</h2>
            <ul className="list-disc ml-10 space-y-4 text-justify">
              <li><strong>Caracterização Elétrica:</strong> Construir as curvas características de corrente (I) vs voltagem (V) para diferentes resistores comerciais.</li>
              <li><strong>Verificação da Lei de Ohm:</strong> Classificar componentes elétricos como ôhmicos ou não-ôhmicos com base na linearidade de suas respostas.</li>
              <li><strong>Análise Quantitativa:</strong> Determinar experimentalmente os valores de resistência através da análise de regressão linear (inclinação da reta) e comparar com valores nominais e medidos.</li>
            </ul>
          </div>

          {/* 3. MATERIAL UTILIZADO */}
          <div data-pdf-section data-pdf-section-id="3" className="mb-16 px-10">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">2. Material Utilizado</h2>
            <div className="grid grid-cols-2 gap-8">
              <ul className="list-disc ml-10 space-y-2">
                <li>Fonte de alimentação DC variável (0-12V).</li>
                <li>Multímetro Digital (Amperímetro/Voltímetro).</li>
                <li>Resistor de carvão (560 Ω).</li>
              </ul>
              <ul className="list-disc ml-10 space-y-2">
                <li>Resistor de carvão (10 kΩ).</li>
                <li>Protoboard (Matriz de contatos).</li>
                <li>Cabos de conexão tipo banana/jacaré.</li>
              </ul>
            </div>
          </div>

          {/* 4. FUNDAMENTAÇÃO TEÓRICA */}
          <div data-pdf-section data-pdf-section-id="4" className="mb-16 px-10">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">3. Fundamentação Teórica</h2>
            <p className="mb-6 text-justify leading-relaxed">
              A Lei de Ohm, formulada por Georg Simon Ohm em 1827, é um dos pilares da eletrodinâmica. Ela estabelece que, para certos materiais (condutores ôhmicos), a diferença de potencial (V) aplicada é diretamente proporcional à intensidade da corrente elétrica (I) que circula pelo condutor:
            </p>
            <div className="formula-block">V = R · I</div>
            <p className="leading-relaxed text-justify">
              Onde <strong>R</strong> representa a resistência elétrica, medida em Ohms (Ω). Graficamente, a relação entre I e V para um condutor ôhmico é uma linha reta que passa pela origem. A inclinação desta reta (ΔI/ΔV) é numericamente igual à condutância (G = 1/R). Portanto, quanto maior a inclinação, menor a resistência do componente.
            </p>
          </div>

          {/* 5. PROCEDIMENTO EXPERIMENTAL */}
          <div data-pdf-section data-pdf-section-id="5" className="mb-16 px-10">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">4. Procedimento Experimental</h2>
            <div className="space-y-6">
              <p className="text-justify">O procedimento seguiu uma metodologia rigorosa de coleta de dados ponto a ponto:</p>
              <ol className="list-decimal ml-10 space-y-4 text-justify">
                <li><strong>Montagem:</strong> Conexão do resistor em série com a fonte e o amperímetro. O voltímetro foi conectado em paralelo ao resistor para medir a queda de tensão real.</li>
                <li><strong>Calibração:</strong> Verificação da voltagem zero e ajuste da corrente de proteção da fonte.</li>
                <li><strong>Varredura:</strong> Incremento da tensão de 1,0V em 1,0V, partindo de 1,0V até atingir o limite de 12,0V.</li>
                <li><strong>Registro:</strong> Anotação simultânea dos valores de V e I para cada passo, garantindo a estabilidade térmica do componente.</li>
              </ol>
              <div className="flex justify-center gap-12 my-10">
                <Figure1 />
                <Figure2 />
              </div>
            </div>
          </div>

          {/* 6. DADOS COLETADOS */}
          <div data-pdf-section data-pdf-section-id="6" className="mb-16 px-10">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-6 uppercase tracking-widest">5. Dados Coletados</h2>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <h3 className="font-bold mb-4 text-center">Tabela 1: Resistor 560 Ω</h3>
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr>
                      <th className="w-16">Ponto</th>
                      <th>Tensão (V)</th>
                      <th>Corrente (A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data560.map((d, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{d.v || "---"}</td>
                        <td>{d.i || "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="font-bold mb-4 text-center">Tabela 2: Resistor 10 kΩ</h3>
                <table className="w-full border-collapse border border-black">
                  <thead>
                    <tr>
                      <th className="w-16">Ponto</th>
                      <th>Tensão (V)</th>
                      <th>Corrente (A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data10k.map((d, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{d.v || "---"}</td>
                        <td>{d.i || "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 7. GRÁFICOS */}
          <div data-pdf-section data-pdf-section-id="7" className="mb-16 px-10">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-10 uppercase tracking-widest">6. Gráficos e Análise Visual</h2>
            <div className="space-y-20">
              <div className="flex flex-col items-center">
                <div className="border-2 border-slate-100 p-6 bg-white shadow-sm">
                  <InteractiveLabGraph 
                    title="Gráfico 1: I vs V (560 Ω)" 
                    data={data560} 
                    color="#2563eb" 
                    maxI={0.025}
                    elements={graphElements560}
                    setElements={() => {}}
                    history={[]}
                    setHistory={() => {}}
                    isReadOnly={true}
                  />
                </div>
                <p className="mt-4 text-sm italic font-bold">Gráfico 1 - Curva característica do resistor de 560 Ω.</p>
              </div>
            </div>
          </div>

          <div data-pdf-section data-pdf-section-id="8" className="mb-16 px-10">
            <div className="flex flex-col items-center">
              <div className="border-2 border-slate-100 p-6 bg-white shadow-sm">
                <InteractiveLabGraph 
                  title="Gráfico 2: I vs V (10 kΩ)" 
                  data={data10k} 
                  color="#10b981" 
                  maxI={0.002}
                  elements={graphElements10k}
                  setElements={() => {}}
                  history={[]}
                  setHistory={() => {}}
                  isReadOnly={true}
                />
              </div>
              <p className="mt-4 text-sm italic font-bold">Gráfico 2 - Curva característica do resistor de 10 kΩ.</p>
            </div>
          </div>

          {/* 8. RESULTADOS E CÁLCULOS */}
          <div data-pdf-section data-pdf-section-id="9" className="mb-16 px-10">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-8 uppercase tracking-widest">7. Resultados e Cálculos</h2>
            
            <p className="mb-6 text-justify">Abaixo estão consolidados os valores extraídos dos gráficos e as comparações com os valores de referência:</p>
            
            <table className="w-full border-collapse border border-black mb-12">
              <thead>
                <tr>
                  <th>Resistor</th>
                  <th>Inclinação (A/V)</th>
                  <th>R Calc (Ω)</th>
                  <th>R Med (Ω)</th>
                  <th>Erro (%)</th>
                  <th>Potência (W)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold">560 Ω</td>
                  <td>{calculationResults.r560.slope || "---"}</td>
                  <td>{calculationResults.r560.calculatedR || "---"}</td>
                  <td>{calculationResults.r560.measuredR || "---"}</td>
                  <td>{calculationResults.r560.error || "---"}</td>
                  <td>{calculationResults.r560.power || "---"}</td>
                </tr>
                <tr>
                  <td className="font-bold">10 kΩ</td>
                  <td>{calculationResults.r10k.slope || "---"}</td>
                  <td>{calculationResults.r10k.calculatedR || "---"}</td>
                  <td>{calculationResults.r10k.measuredR || "---"}</td>
                  <td>{calculationResults.r10k.error || "---"}</td>
                  <td>{calculationResults.r10k.power || "---"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 9. DISCUSSÃO E CONCLUSÃO */}
          <div data-pdf-section data-pdf-section-id="10" className="mb-16 px-10">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-8 uppercase tracking-widest">8. Discussão das Perguntas</h2>
            <div className="space-y-12">
              {[
                {
                  q: "Discussão 1",
                  text: "Com base nos gráficos obtidos, a relação entre a tensão (V) e a corrente (I) é linear para ambos os resistores? O que isso indica sobre a natureza desses componentes em relação à Lei de Ohm?"
                },
                {
                  q: "Discussão 2",
                  text: "Compare os valores de resistência medidos com o multímetro com os valores nominais (560 Ω e 10 kΩ) e com os valores calculados a partir da inclinação da reta. Quais são as possíveis fontes de erro experimental que podem ter influenciado essas diferenças?"
                }
              ].map((item, idx) => (
                <div key={idx} className="space-y-4">
                  <p className="font-bold text-slate-800">8.{idx + 1}. {item.text}</p>
                  <div className="p-6 bg-slate-50 border-l-4 border-slate-300 text-justify leading-relaxed text-slate-800 min-h-[100px]">
                    {answers[idx] || "Nenhuma resposta fornecida."}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 10. ENCERRAMENTO */}
          <div data-pdf-section data-pdf-section-id="11" className="mt-24 pt-12 border-t-2 border-black text-center">
            <p className="text-sm font-bold uppercase tracking-[0.5em]">Fim do Relatório Experimental</p>
            <p className="text-xs text-slate-400 mt-2">Documento gerado eletronicamente via LabReport Pro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
