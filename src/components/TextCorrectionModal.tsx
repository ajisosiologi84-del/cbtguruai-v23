import React, { useState } from 'react';
import { X, Check, FileEdit, Sparkles, BookOpen, ArrowRight, Type, Underline } from 'lucide-react';

interface TextCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFormat: (mode: 'insert' | 'wrap', content: string) => void;
  selectedText?: string;
  showAlert: (msg: string) => void;
}

interface CorrectionItem {
  id: string;
  name: string;
  symbol: string;
  marginNote: string;
  ruleDescription: string;
  sampleInput: string;
  markupSyntax: string;
  htmlVisual: string;
  type: 'italic' | 'bold' | 'allcaps' | 'lowercase' | 'boldItalic';
}

export const TextCorrectionModal: React.FC<TextCorrectionModalProps> = ({
  isOpen,
  onClose,
  onApplyFormat,
  selectedText = '',
  showAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'interactive'>('guide');
  const [activeItem, setActiveItem] = useState<string>('italic');
  const [customWord, setCustomWord] = useState<string>(selectedText || 'kebudayaan');
  const [outputStyle, setOutputStyle] = useState<'proofread' | 'directHtml'>('proofread');

  if (!isOpen) return null;

  const correctionList: CorrectionItem[] = [
    {
      id: 'italic',
      name: 'Cetak Miring (Italic)',
      symbol: '___ (Garis Bawah Tunggal)',
      marginNote: 'italic / ital',
      ruleDescription: 'Diberi garis bawah tunggal ( ___ ) pada kata atau kalimat yang ingin dimiringkan.',
      sampleInput: 'kebudayaan',
      markupSyntax: '___kebudayaan___',
      htmlVisual: '<span class="italic underline decoration-1 decoration-amber-600 font-serif font-medium">kebudayaan</span>',
      type: 'italic',
    },
    {
      id: 'bold',
      name: 'Cetak Tebal (Bold)',
      symbol: '~~~ (Garis Bawah Gelombang)',
      marginNote: 'bold / bf',
      ruleDescription: 'Diberi garis bawah gelombang ( ~~~ ) pada kata yang dimaksud.',
      sampleInput: 'penting',
      markupSyntax: '~~~penting~~~',
      htmlVisual: '<span class="font-bold underline decoration-wavy decoration-amber-600 font-serif">penting</span>',
      type: 'bold',
    },
    {
      id: 'allcaps',
      name: 'Huruf Kapital Semua (All Caps)',
      symbol: '☰ (Tiga Garis Bawah Lurus)',
      marginNote: 'caps / all caps',
      ruleDescription: 'Diberi tiga garis bawah lurus ( ☰ ) di bawah kata yang harus diubah menjadi huruf besar semua.',
      sampleInput: 'unesco',
      markupSyntax: '☰UNESCO☰',
      htmlVisual: '<span class="uppercase font-bold underline decoration-double decoration-amber-600 tracking-wide font-serif">UNESCO</span>',
      type: 'allcaps',
    },
    {
      id: 'lowercase',
      name: 'Huruf Kecil (Lowercase)',
      symbol: '/ (Garis Miring Coret)',
      marginNote: 'lc (lowercase)',
      ruleDescription: 'Diberi tanda garis miring ( / ) mencoret kata yang ingin diubah menjadi huruf kecil.',
      sampleInput: 'Masyarakat',
      markupSyntax: '/masyarakat/',
      htmlVisual: '<span class="line-through decoration-red-500 font-medium text-slate-700">Masyarakat</span>',
      type: 'lowercase',
    },
    {
      id: 'boldItalic',
      name: 'Cetak Miring dan Tebal (Bold-Italic)',
      symbol: '~~~___ (Gabungan Garis Lurus & Gelombang)',
      marginNote: 'bold-ital / bf-ital',
      ruleDescription: 'Diberi gabungan garis bawah lurus dan garis bawah gelombang pada kata atau kalimat yang harus dicetak tebal sekaligus miring.',
      sampleInput: 'solusi utama',
      markupSyntax: '~~~___solusi utama___~~~',
      htmlVisual: '<span class="font-bold italic underline decoration-wavy decoration-amber-600 font-serif">solusi utama</span>',
      type: 'boldItalic',
    },
  ];

  const currentItem = correctionList.find((c) => c.id === activeItem) || correctionList[0];

  const handleInsertSelected = () => {
    const word = customWord.trim() || currentItem.sampleInput;
    let result = '';

    if (outputStyle === 'proofread') {
      if (currentItem.type === 'italic') {
        result = `___${word}___`;
      } else if (currentItem.type === 'bold') {
        result = `~~~${word}~~~`;
      } else if (currentItem.type === 'allcaps') {
        result = `☰${word.toUpperCase()}☰`;
      } else if (currentItem.type === 'lowercase') {
        result = `/${word.toLowerCase()}/`;
      } else if (currentItem.type === 'boldItalic') {
        result = `~~~___${word}___~~~`;
      }
    } else {
      // Direct HTML Format
      if (currentItem.type === 'italic') {
        result = `<i>${word}</i>`;
      } else if (currentItem.type === 'bold') {
        result = `<b>${word}</b>`;
      } else if (currentItem.type === 'allcaps') {
        result = `<span class="uppercase">${word.toUpperCase()}</span>`;
      } else if (currentItem.type === 'lowercase') {
        result = `<span class="lowercase">${word.toLowerCase()}</span>`;
      } else if (currentItem.type === 'boldItalic') {
        result = `<b><i>${word}</i></b>`;
      }
    }

    onApplyFormat('insert', result);
    showAlert(`Simbol koreksi "${currentItem.name}" berhasil disisipkan!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-700 to-amber-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <FileEdit className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>Simbol Koreksi Format Teks (Proofreading Marks)</span>
                <span className="text-[10px] uppercase font-black tracking-wider bg-amber-400/30 text-amber-100 px-2 py-0.5 rounded-full border border-amber-300/30">
                  Standar Penyuntingan
                </span>
              </h3>
              <p className="text-xs text-amber-100/90 font-medium">
                Panduan dan alat penyisipan simbol koreksi naskah untuk soal Bahasa Indonesia, literasi, & format teks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0 gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-white text-amber-800 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Daftar 5 Simbol Koreksi Format</span>
            </button>
            <button
              onClick={() => setActiveTab('interactive')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'interactive'
                  ? 'bg-white text-amber-800 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Generator & Sisipkan ke Soal</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="hidden sm:inline">Format Keluaran:</span>
            <div className="bg-white p-0.5 rounded-lg border border-slate-200 flex items-center">
              <button
                type="button"
                onClick={() => setOutputStyle('proofread')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  outputStyle === 'proofread' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Notasi Koreksi (___ / ~~~)
              </button>
              <button
                type="button"
                onClick={() => setOutputStyle('directHtml')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                  outputStyle === 'directHtml' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                HTML Langsung (&lt;i&gt;, &lt;b&gt;)
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 grow">
          {activeTab === 'guide' ? (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Standar Tanda Koreksi Naskah (Proofreader's Marks):</strong> Dalam penyuntingan naskah dan penyusunan soal Bahasa Indonesia/Literasi Teks, simbol-simbol di bawah ini digunakan editor untuk menandai perbaikan tipografi kata atau kalimat tanpa perlu menghapus teks asli.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {correctionList.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveItem(item.id);
                      setActiveTab('interactive');
                    }}
                    className="p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-500 bg-white hover:bg-amber-50/20 transition-all cursor-pointer shadow-xs group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-800 group-hover:text-amber-900">
                          {item.name}
                        </h4>
                        <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          Simbol: {item.symbol}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-8">
                        {item.ruleDescription}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3 sm:border-l sm:border-slate-200 sm:pl-4 justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Tampilan Pratinjau:</span>
                        <div
                          className="text-xs font-serif mt-0.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200"
                          dangerouslySetInnerHTML={{ __html: item.htmlVisual }}
                        />
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-amber-600 group-hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                      >
                        <span>Gunakan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Type Selector */}
              <div>
                <label className="block font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider">
                  Pilih Jenis Simbol Koreksi:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {correctionList.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveItem(item.id)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        activeItem === item.id
                          ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{item.name}</span>
                        {activeItem === item.id && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 font-medium">{item.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Input and Rule Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="block font-extrabold text-slate-800 mb-1.5 text-xs">
                    Kata atau Kalimat yang Diberi Tanda Koreksi:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customWord}
                      onChange={(e) => setCustomWord(e.target.value)}
                      placeholder="Masukkan kata/kalimat..."
                      className="w-full bg-white border-2 border-slate-300 focus:border-amber-500 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomWord(selectedText || currentItem.sampleInput)}
                      className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs shrink-0 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-amber-900">Aturan Simbol:</p>
                  <p className="text-slate-600 leading-relaxed">{currentItem.ruleDescription}</p>
                </div>
              </div>

              {/* Live Preview Display */}
              <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 rounded-2xl border-2 border-amber-200 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Pratinjau Hasil yang Akan Disisipkan:
                </span>

                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Teks Sintaks dalam Soal:</span>
                    <p className="font-mono text-xs sm:text-sm font-bold text-indigo-900 bg-slate-100 p-2 rounded-lg mt-1 select-all">
                      {outputStyle === 'proofread'
                        ? currentItem.type === 'italic'
                          ? `___${customWord || 'kata'}___`
                          : currentItem.type === 'bold'
                          ? `~~~${customWord || 'kata'}~~~`
                          : currentItem.type === 'allcaps'
                          ? `☰${(customWord || 'kata').toUpperCase()}☰`
                          : currentItem.type === 'lowercase'
                          ? `/${(customWord || 'kata').toLowerCase()}/`
                          : `~~~___${customWord || 'kata'}___~~~`
                        : currentItem.type === 'italic'
                        ? `<i>${customWord || 'kata'}</i>`
                        : currentItem.type === 'bold'
                        ? `<b>${customWord || 'kata'}</b>`
                        : currentItem.type === 'allcaps'
                        ? `<span class="uppercase">${(customWord || 'kata').toUpperCase()}</span>`
                        : currentItem.type === 'lowercase'
                        ? `<span class="lowercase">${(customWord || 'kata').toLowerCase()}</span>`
                        : `<b><i>${customWord || 'kata'}</i></b>`}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Visual di Mata Siswa:</span>
                    <div className="text-sm sm:text-base font-serif text-slate-900 p-2 mt-1">
                      {currentItem.type === 'italic' && (
                        <span>
                          Siswa membaca: <span className="italic underline decoration-1 decoration-amber-600 font-serif font-medium">{customWord || 'kata'}</span>
                        </span>
                      )}
                      {currentItem.type === 'bold' && (
                        <span>
                          Siswa membaca: <span className="font-bold underline decoration-wavy decoration-amber-600 font-serif">{customWord || 'kata'}</span>
                        </span>
                      )}
                      {currentItem.type === 'allcaps' && (
                        <span>
                          Siswa membaca: <span className="uppercase font-bold underline decoration-double decoration-amber-600 tracking-wide font-serif">{(customWord || 'kata').toUpperCase()}</span>
                        </span>
                      )}
                      {currentItem.type === 'lowercase' && (
                        <span>
                          Siswa membaca: <span className="line-through decoration-red-500 font-medium text-slate-700">{customWord || 'kata'}</span>
                        </span>
                      )}
                      {currentItem.type === 'boldItalic' && (
                        <span>
                          Siswa membaca: <span className="font-bold italic underline decoration-wavy decoration-amber-600 font-serif">{customWord || 'kata'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Simbol koreksi ini kompatibel dengan seluruh pratinjau soal, cetak kartu, dan ekspor ujian.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleInsertSelected}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 font-extrabold text-white text-xs shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Sisipkan Simbol Koreksi ke Soal</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
