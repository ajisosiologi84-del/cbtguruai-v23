import React, { useState, useRef, useEffect } from 'react';
import katex from 'katex';
import {
  X,
  Check,
  RotateCcw,
  Copy,
  PenTool,
  Calculator,
  Zap,
  FlaskConical,
  BookOpen,
  Sparkles,
  Layers,
  HelpCircle,
  Code,
  Trash2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Type
} from 'lucide-react';

export interface MathFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertFormula: (latexFormula: string, targetField: 'question' | 'optA' | 'optB' | 'optC' | 'optD' | 'optE' | 'explanation') => void;
  initialField?: 'question' | 'optA' | 'optB' | 'optC' | 'optD' | 'optE' | 'explanation';
  showAlert?: (msg: string) => void;
}

export const MathFormulaModal: React.FC<MathFormulaModalProps> = ({
  isOpen,
  onClose,
  onInsertFormula,
  initialField = 'question',
  showAlert,
}) => {
  const [latexInput, setLatexFormulaInput] = useState<string>('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  const [selectedCategory, setSelectedCategory] = useState<'math' | 'physics' | 'chemistry' | 'drawing' | 'presets'>('math');
  const [targetField, setTargetField] = useState<'question' | 'optA' | 'optB' | 'optC' | 'optD' | 'optE' | 'explanation'>(initialField);
  const [fontSizePx, setFontSizePx] = useState<number>(20);
  const [copied, setCopied] = useState<boolean>(false);

  // Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  useEffect(() => {
    setTargetField(initialField);
  }, [initialField, isOpen]);

  if (!isOpen) return null;

  const handleSymbolClick = (snippet: string) => {
    setLatexFormulaInput((prev) => (prev ? `${prev} ${snippet}` : snippet));
  };

  const handleCopyLatex = () => {
    const wrapped = `$${latexInput.trim()}$`;
    navigator.clipboard.writeText(wrapped).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (showAlert) showAlert('Rumus LaTeX berhasil disalin ke clipboard!');
  };

  const handleInsert = () => {
    if (!latexInput.trim()) {
      if (showAlert) showAlert('Harap masukkan rumus atau pilih simbol terlebih dahulu!');
      return;
    }
    const finalFormula = `$${latexInput.trim()}$`;
    onInsertFormula(finalFormula, targetField);
    onClose();
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Render KaTeX HTML safely
  let renderedKaTeXHtml = '';
  let renderError = false;
  try {
    renderedKaTeXHtml = katex.renderToString(latexInput || 'x', {
      displayMode: true,
      throwOnError: false,
    });
  } catch (err) {
    renderError = true;
    renderedKaTeXHtml = `<span class="text-red-600 font-mono text-xs">Sintaks LaTeX kurang tepat</span>`;
  }

  // Symbol Palette Items
  const mathSymbols = [
    { label: 'Pecahan', snippet: '\\frac{a}{b}', icon: 'a/b' },
    { label: 'Akar Kuadrat', snippet: '\\sqrt{x}', icon: '√x' },
    { label: 'Akar Pangkat N', snippet: '\\sqrt[n]{x}', icon: 'ⁿ√x' },
    { label: 'Pangkat / Eksponen', snippet: 'x^2', icon: 'x²' },
    { label: 'Indeks / Subskrip', snippet: 'x_n', icon: 'xₙ' },
    { label: 'Pangkat & Subskrip', snippet: 'x_i^n', icon: 'xᵢⁿ' },
    { label: 'Kurang Lebih', snippet: '\\pm', icon: '±' },
    { label: 'Tidak Sama Dengan', snippet: '\\neq', icon: '≠' },
    { label: 'Kurang Dari Sama Dengan', snippet: '\\le', icon: '≤' },
    { label: 'Lebih Dari Sama Dengan', snippet: '\\ge', icon: '≥' },
    { label: 'Perkalian', snippet: '\\times', icon: '×' },
    { label: 'Pembagian', snippet: '\\div', icon: '÷' },
    { label: 'Tak Hingga', snippet: '\\infty', icon: '∞' },
    { label: 'Integral Tertentu', snippet: '\\int_{a}^{b} x \\, dx', icon: '∫ₐᵇ' },
    { label: 'Notasi Sigma / Jumlah', snippet: '\\sum_{i=1}^{n} x_i', icon: '∑' },
    { label: 'Notasi Limit', snippet: '\\lim_{x \\to 0} f(x)', icon: 'lim' },
    { label: 'Matriks 2x2', snippet: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', icon: '[2x2]' },
    { label: 'Determinan 2x2', snippet: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', icon: '|2x2|' },
    { label: 'Sinus', snippet: '\\sin\\theta', icon: 'sin' },
    { label: 'Kosinus', snippet: '\\cos\\theta', icon: 'cos' },
    { label: 'Tangen', snippet: '\\tan\\theta', icon: 'tan' },
    { label: 'Logaritma', snippet: '\\log_b x', icon: 'log' },
    { label: 'Himpunan Bagian', snippet: '\\subset', icon: '⊂' },
    { label: 'Irisan', snippet: '\\cap', icon: '∩' },
    { label: 'Gabungan', snippet: '\\cup', icon: '∪' },
    { label: 'Maka / Implikasi', snippet: '\\Rightarrow', icon: '⇒' },
    { label: 'Jika & Hanya Jika', snippet: '\\iff', icon: '⇔' },
  ];

  const physicsSymbols = [
    { label: 'Vektor Gaya', snippet: '\\vec{F} = m \\cdot \\vec{a}', icon: 'F⃗=ma' },
    { label: 'Energi Kinetik', snippet: 'E_k = \\frac{1}{2} m v^2', icon: 'Ek' },
    { label: 'Energi Potensial', snippet: 'E_p = m \\cdot g \\cdot h', icon: 'Ep' },
    { label: 'Hukum Ohm', snippet: 'V = I \\cdot R', icon: 'V=IR' },
    { label: 'Hukum Coulomb', snippet: 'F = k \\frac{|q_1 q_2|}{r^2}', icon: 'Fcol' },
    { label: 'Energi Einstein', snippet: 'E = m c^2', icon: 'E=mc²' },
    { label: 'Energi Foton Quantum', snippet: 'E = h \\cdot f', icon: 'E=hf' },
    { label: 'Gelombang / Panjang Gelombang', snippet: '\\lambda = \\frac{v}{f}', icon: 'λ=v/f' },
    { label: 'Vektor Satuan i, j, k', snippet: '\\hat{i} + \\hat{j} + \\hat{k}', icon: 'î+ĵ+k̂' },
    { label: 'Alfa', snippet: '\\alpha', icon: 'α' },
    { label: 'Beta', snippet: '\\beta', icon: 'β' },
    { label: 'Gama', snippet: '\\gamma', icon: 'γ' },
    { label: 'Delta / Perubahan', snippet: '\\Delta', icon: 'Δ' },
    { label: 'Teta / Sudut', snippet: '\\theta', icon: 'θ' },
    { label: 'Lambda', snippet: '\\lambda', icon: 'λ' },
    { label: 'Mu / Mikro', snippet: '\\mu', icon: 'μ' },
    { label: 'Pi', snippet: '\\pi', icon: 'π' },
    { label: 'Rho / Massa Jenis', snippet: '\\rho', icon: 'ρ' },
    { label: 'Omega / Hambatan Ohm', snippet: '\\Omega', icon: 'Ω' },
    { label: 'Satuan Kecepatan', snippet: '\\text{m/s}', icon: 'm/s' },
    { label: 'Satuan Percepatan', snippet: '\\text{m/s}^2', icon: 'm/s²' },
    { label: 'Satuan Newton', snippet: '\\text{N}', icon: 'N' },
    { label: 'Satuan Joule', snippet: '\\text{J}', icon: 'J' },
    { label: 'Satuan Watt', snippet: '\\text{W}', icon: 'W' },
  ];

  const chemistrySymbols = [
    { label: 'Panah Reaksi Searah', snippet: '\\rightarrow', icon: '→' },
    { label: 'Panah Reaksi Kesetimbangan', snippet: '\\rightleftharpoons', icon: '⇌' },
    { label: 'Panah Pemanasan', snippet: '\\xrightarrow{\\Delta}', icon: '→Δ' },
    { label: 'Air (H2O)', snippet: 'H_2O', icon: 'H₂O' },
    { label: 'Karbon Dioksida', snippet: 'CO_2', icon: 'CO₂' },
    { label: 'Asam Sulfat', snippet: 'H_2SO_4', icon: 'H₂SO₄' },
    { label: 'Glukosa', snippet: 'C_6H_{12}O_6', icon: 'C₆H₁₂O₆' },
    { label: 'Garam (NaCl)', snippet: 'NaCl', icon: 'NaCl' },
    { label: 'Gas Oksigen', snippet: 'O_2', icon: 'O₂' },
    { label: 'Gas Nitrogen', snippet: 'N_2', icon: 'N₂' },
    { label: 'Ion Hidrogen', snippet: 'H^+', icon: 'H⁺' },
    { label: 'Ion Hidroksida', snippet: 'OH^-', icon: 'OH⁻' },
    { label: 'Ion Kalsium 2+', snippet: 'Ca^{2+}', icon: 'Ca²⁺' },
    { label: 'Ion Sulfat 2-', snippet: 'SO_4^{2-}', icon: 'SO₄²⁻' },
    { label: 'Fase Padat (s)', snippet: '(\\text{s})', icon: '(s)' },
    { label: 'Fase Cair (l)', snippet: '(\\text{l})', icon: '(l)' },
    { label: 'Fase Gas (g)', snippet: '(\\text{g})', icon: '(g)' },
    { label: 'Fase Larutan (aq)', snippet: '(\\text{aq})', icon: '(aq)' },
    { label: 'Isotop Karbon-14', snippet: '^{14}_{6}\\text{C}', icon: '¹⁴₆C' },
    { label: 'Isotop Uranium-235', snippet: '^{235}_{92}\\text{U}', icon: '²³⁵₉₂U' },
    { label: 'Rumus pH', snippet: '\\text{pH} = -\\log[H^+]', icon: 'pH' },
    { label: 'Tetapan Kesetimbangan Kc', snippet: 'K_c = \\frac{[C]^c [D]^d}{[A]^a [B]^b}', icon: 'Kc' },
  ];

  const presetsList = [
    { name: 'Rumus Kuadratik (ABC)', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', desc: 'Solusi persamaan kuadrat ax² + bx + c = 0' },
    { name: 'Teorema Pythagoras', latex: 'c = \\sqrt{a^2 + b^2}', desc: 'Hubungan sisi segitiga siku-siku' },
    { name: 'Turunan Fungsi Rantai', latex: '\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}', desc: 'Kalkulus Turunan Parsial' },
    { name: 'Integral Tentu Luas Area', latex: 'A = \\int_{a}^{b} f(x) \\, dx', desc: 'Kalkulus Integral Tentu' },
    { name: 'Hukum II Newton', latex: '\\sum \\vec{F} = m \\cdot \\vec{a}', desc: 'Dinamika gerak dan gaya' },
    { name: 'Hukum Ohm & Daya Listrik', latex: 'P = V \\cdot I = I^2 \\cdot R = \\frac{V^2}{R}', desc: 'Listrik Arus Searah (DC)' },
    { name: 'Persamaan Gas Ideal', latex: 'P \\cdot V = n \\cdot R \\cdot T', desc: 'Termodinamika Fisika & Kimia' },
    { name: 'Reaksi Fotosintesis', latex: '6CO_2(\\text{g}) + 6H_2O(\\text{l}) \\xrightarrow{\\text{cahaya}} C_6H_{12}O_6(\\text{s}) + 6O_2(\\text{g})', desc: 'Persamaan Kimia Fotosintesis' },
    { name: 'Reaksi Netralisasi Asam Basa', latex: 'HCl(\\text{aq}) + NaOH(\\text{aq}) \\rightarrow NaCl(\\text{aq}) + H_2O(\\text{l})', desc: 'Stoikiometri Larutan' },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] overflow-hidden flex flex-col">
        {/* Header Style MathType */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/40 border border-indigo-400/40 rounded-2xl text-indigo-300">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                MathType - Editor Rumus MIPA (Matematika, Fisika, & Kimia)
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40 uppercase">
                  KaTeX Live
                </span>
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Pilih simbol visual, ketik kode LaTeX, atau gambar dengan tangan untuk menyisipkan rumus presisi.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Destination & Font Controls Bar */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 uppercase tracking-wider">Sisipkan Rumus Ke:</span>
            <select
              value={targetField}
              onChange={(e) => setTargetField(e.target.value as any)}
              className="bg-white border-2 border-indigo-300 rounded-xl px-3 py-1.5 font-bold text-indigo-950 focus:border-indigo-600 focus:outline-none cursor-pointer"
            >
              <option value="question">📝 Teks Pertanyaan Soal</option>
              <option value="optA">🔴 Opsi Jawaban A</option>
              <option value="optB">🔵 Opsi Jawaban B</option>
              <option value="optC">🟢 Opsi Jawaban C</option>
              <option value="optD">🟡 Opsi Jawaban D</option>
              <option value="optE">🟣 Opsi Jawaban E</option>
              <option value="explanation">💡 Teks Pembahasan Soal</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-700 uppercase">Ukuran Tampilan:</span>
            <button
              type="button"
              onClick={() => setFontSizePx((p) => Math.max(14, p - 2))}
              className="p-1.5 bg-white hover:bg-slate-200 rounded-lg border border-slate-300 cursor-pointer"
              title="Perkecil Ukuran"
            >
              <ZoomOut className="w-4 h-4 text-slate-700" />
            </button>
            <span className="font-mono font-bold text-slate-900 w-10 text-center">{fontSizePx}px</span>
            <button
              type="button"
              onClick={() => setFontSizePx((p) => Math.min(36, p + 2))}
              className="p-1.5 bg-white hover:bg-slate-200 rounded-lg border border-slate-300 cursor-pointer"
              title="Perbesar Ukuran"
            >
              <ZoomIn className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 custom-scrollbar">
          {/* 1. Category Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('math')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                selectedCategory === 'math'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>📐 Matematika</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('physics')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                selectedCategory === 'physics'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>⚡ Fisika</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('chemistry')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                selectedCategory === 'chemistry'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>🧪 Kimia</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('presets')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                selectedCategory === 'presets'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>📚 Bank Rumus Preset</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('drawing')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                selectedCategory === 'drawing'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>✍️ Coretan Tangan</span>
            </button>
          </div>

          {/* 2. Interactive Symbol Palette Grid */}
          {selectedCategory !== 'drawing' && selectedCategory !== 'presets' && (
            <div className="space-y-2">
              <label className="font-extrabold text-slate-800 text-xs uppercase tracking-wider block">
                Klik Simbol / Template Untuk Menyisipkan:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2">
                {(selectedCategory === 'math'
                  ? mathSymbols
                  : selectedCategory === 'physics'
                  ? physicsSymbols
                  : chemistrySymbols
                ).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSymbolClick(item.snippet)}
                    className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 group shadow-2xs"
                    title={`${item.label} (${item.snippet})`}
                  >
                    <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-indigo-700">
                      {item.icon}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium truncate w-full text-center">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Presets Gallery */}
          {selectedCategory === 'presets' && (
            <div className="space-y-2">
              <label className="font-extrabold text-slate-800 text-xs uppercase tracking-wider block">
                Pilih Rumus Siap Pakai (Preset MIPA):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {presetsList.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLatexFormulaInput(p.latex)}
                    className="p-3 bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-400 rounded-2xl transition-all cursor-pointer space-y-1 shadow-xs"
                  >
                    <div className="font-bold text-slate-900 text-xs flex justify-between items-center">
                      <span>{p.name}</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-md">
                        Klik Pakai
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{p.desc}</p>
                    <div className="font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200 text-indigo-900 truncate">
                      {p.latex}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drawing Canvas Board */}
          {selectedCategory === 'drawing' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center">
                <label className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1">
                  <PenTool className="w-4 h-4 text-purple-600" /> Papan Coretan Tangan / Handwriting Canvas
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Coretan
                </button>
              </div>

              <canvas
                ref={canvasRef}
                width={700}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full bg-white border-2 border-dashed border-purple-300 rounded-2xl cursor-crosshair shadow-inner"
              />
              <p className="text-[11px] text-slate-500 font-medium">
                Gunakan tetikus/touchscreen untuk menulis rumus secara manual di atas papan.
              </p>
            </div>
          )}

          {/* 3. Live KaTeX Render Preview Display */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-2xl text-white space-y-2 border border-indigo-800/80 shadow-md">
            <div className="flex justify-between items-center text-xs border-b border-indigo-800/60 pb-2">
              <span className="font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Tampilan Pratinjau Rumus (Live Output):
              </span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-mono">
                Standar Ujian Nasional KaTeX
              </span>
            </div>

            <div
              className="py-4 px-2 min-h-[70px] flex items-center justify-center text-center overflow-x-auto"
              style={{ fontSize: `${fontSizePx}px` }}
              dangerouslySetInnerHTML={{ __html: renderedKaTeXHtml }}
            />
          </div>

          {/* 4. LaTeX Direct Code Textarea */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1">
                <Code className="w-4 h-4 text-blue-600" /> Kode LaTeX Rumus (Bisa Diketik Langsung):
              </label>
              <button
                type="button"
                onClick={handleCopyLatex}
                className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode LaTeX'}</span>
              </button>
            </div>

            <textarea
              value={latexInput}
              onChange={(e) => setLatexFormulaInput(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl p-3 font-mono text-xs text-indigo-950 font-bold focus:bg-white focus:border-indigo-600 focus:outline-none h-20 resize-none"
              placeholder="Ketik kode LaTeX di sini, contoh: \frac{a}{b} atau \sqrt{x^2 + y^2}"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Rumus akan disisipkan dengan pembatas <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-indigo-900">$...$</code>
          </div>

          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none bg-white border border-slate-300 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleInsert}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Sisipkan Rumus Ke {targetField === 'question' ? 'Soal' : targetField.startsWith('opt') ? `Opsi ${targetField.replace('opt', '')}` : 'Pembahasan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
