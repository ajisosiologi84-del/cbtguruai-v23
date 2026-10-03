import React, { useState, useMemo } from 'react';
import { Question } from '../types';
import { Zap, X, Check, Calculator, Award } from 'lucide-react';

interface SetBobotPoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  filteredQuestions: Question[];
  selectedQuestionIds: (string | number)[];
  onApplyBobot: (targetIds: (string | number)[], poinPerSoal: number) => void;
  initialQuestion?: Question | null;
}

export const SetBobotPoinModal: React.FC<SetBobotPoinModalProps> = ({
  isOpen,
  onClose,
  questions,
  filteredQuestions,
  selectedQuestionIds,
  onApplyBobot,
  initialQuestion,
}) => {
  if (!isOpen) return null;

  // Target scope: 'selected' | 'filtered' | 'all' | 'single'
  const defaultScope = initialQuestion
    ? 'single'
    : selectedQuestionIds.length > 0
    ? 'selected'
    : 'all';

  const [scope, setScope] = useState<'selected' | 'filtered' | 'all' | 'single'>(defaultScope);
  const [poinInput, setPoinInput] = useState<string>(() => {
    if (initialQuestion && typeof initialQuestion.poin === 'number' && initialQuestion.poin > 0) {
      return String(initialQuestion.poin);
    }
    return '10';
  });

  const parsedPoin = useMemo(() => {
    const num = parseFloat(poinInput);
    return isNaN(num) || num <= 0 ? 0 : num;
  }, [poinInput]);

  const targetQuestions = useMemo(() => {
    if (scope === 'single' && initialQuestion) {
      return [initialQuestion];
    }
    if (scope === 'selected' && selectedQuestionIds.length > 0) {
      return questions.filter((q) => selectedQuestionIds.includes(q.id));
    }
    if (scope === 'filtered') {
      return filteredQuestions;
    }
    return questions;
  }, [scope, initialQuestion, selectedQuestionIds, filteredQuestions, questions]);

  const targetCount = targetQuestions.length;
  const projectedTotal = Math.round(targetCount * parsedPoin * 100) / 100;

  // Auto divide evenly to reach 100 points
  const handleDivideTo100 = () => {
    if (targetCount <= 0) return;
    const autoPoin = Math.round((100 / targetCount) * 100) / 100;
    setPoinInput(String(autoPoin));
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedPoin <= 0) {
      alert('Masukkan bobot poin yang valid (> 0)!');
      return;
    }
    if (targetCount <= 0) {
      alert('Tidak ada soal yang menjadi target perubahan!');
      return;
    }

    const ids = targetQuestions.map((q) => q.id);
    onApplyBobot(ids, parsedPoin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Atur Bobot Poin Soal</h3>
              <p className="text-amber-100 text-xs">Kustomisasi skor dan pembobotan nilai ujian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleApply} className="p-5 space-y-4 text-xs text-slate-700">
          {/* Target Selection */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider block">
              1. Pilih Target Soal:
            </label>
            <div className="space-y-1.5">
              {initialQuestion && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-300 bg-amber-50/70 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="targetScope"
                    value="single"
                    checked={scope === 'single'}
                    onChange={() => setScope('single')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Hanya Soal Ini Saja (1 Soal)</span>
                </label>
              )}

              {selectedQuestionIds.length > 0 && (
                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border font-bold cursor-pointer transition-colors ${
                    scope === 'selected'
                      ? 'border-amber-400 bg-amber-50/80 text-amber-950'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetScope"
                    value="selected"
                    checked={scope === 'selected'}
                    onChange={() => setScope('selected')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Soal yang Dicentang ({selectedQuestionIds.length} Soal)</span>
                </label>
              )}

              {filteredQuestions.length < questions.length && filteredQuestions.length > 0 && (
                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border font-bold cursor-pointer transition-colors ${
                    scope === 'filtered'
                      ? 'border-amber-400 bg-amber-50/80 text-amber-950'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetScope"
                    value="filtered"
                    checked={scope === 'filtered'}
                    onChange={() => setScope('filtered')}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Soal Hasil Filter / Yang Sedang Tampil ({filteredQuestions.length} Soal)</span>
                </label>
              )}

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border font-bold cursor-pointer transition-colors ${
                  scope === 'all'
                    ? 'border-amber-400 bg-amber-50/80 text-amber-950'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="targetScope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <span>Seluruh Butir Soal di Bank Soal ({questions.length} Soal)</span>
              </label>
            </div>
          </div>

          {/* Bobot Input */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
                2. Tentukan Bobot Poin Per Soal:
              </label>
              {targetCount > 0 && (
                <button
                  type="button"
                  onClick={handleDivideTo100}
                  className="text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                  title={`Hitung otomatis agar ${targetCount} soal total bernilai 100`}
                >
                  <Calculator className="w-3 h-3" />
                  <span>Bagi Rata ke 100</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  value={poinInput}
                  onChange={(e) => setPoinInput(e.target.value)}
                  placeholder="Contoh: 2, 2.5, 5, 10"
                  className="w-full pl-3 pr-14 py-2.5 border-2 border-amber-300 focus:border-amber-500 rounded-xl font-extrabold text-base text-slate-900 bg-white focus:outline-none"
                  autoFocus
                />
                <span className="absolute right-3 top-3 font-extrabold text-slate-400 text-xs">
                  Poin / Soal
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-500 font-bold mr-1">Preset:</span>
              {[2, 2.5, 4, 5, 10, 20, 25].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPoinInput(String(val))}
                  className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                    Number(poinInput) === val
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Kalkulasi Ringkasan */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Simulasi Total Nilai
              </div>
              <div className="text-xs text-slate-700 font-medium">
                {targetCount} Soal × {parsedPoin} Poin
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-sm ${
                  projectedTotal === 100
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{projectedTotal} Poin</span>
              </span>
              {projectedTotal === 100 && (
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  ✓ Pas Maksimal 100
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={parsedPoin <= 0 || targetCount <= 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Terapkan Bobot Poin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
