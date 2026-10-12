import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CloudUpload,
  CloudDownload,
  Copy,
  Check,
  ShieldCheck,
  Key,
  Info,
  RefreshCw,
  Users,
  GraduationCap,
  Shield,
  FileCode,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StudentUser, TeacherUser, AdminUser, Question } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  backupAllUsersToSupabase,
  restoreUsersFromSupabase,
  generateSupabaseSQLSchema,
  backupQuestionsToSupabase,
  restoreQuestionsFromSupabase,
  fetchSupabaseQuestionStats,
  diagnoseSupabaseBankSoal,
  SupabaseDiagnosticResult,
  RestoredMasterUsers,
} from '../services/supabaseBackup';

export interface SupabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentUser[];
  teachers: TeacherUser[];
  admins: AdminUser[];
  questions?: Question[];
  defaultKodeGuru?: string;
  defaultMapel?: string;
  mapelList?: string[];
  initialTab?: 'questions' | 'sync' | 'config' | 'sql';
  onRestoreUsers: (data: RestoredMasterUsers) => void;
  onRestoreQuestions?: (questions: Question[], mode: 'merge' | 'replace') => void;
  showAlert?: (msg: string) => void;
}

export const SupabaseBackupModal: React.FC<SupabaseBackupModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  admins,
  questions = [],
  defaultKodeGuru = 'GURU01',
  defaultMapel = 'Sosiologi',
  mapelList = [],
  initialTab = 'questions',
  onRestoreUsers,
  onRestoreQuestions,
  showAlert = alert,
}) => {
  const metaEnv = (import.meta as any)?.env || {};
  const [supabaseUrl, setSupabaseUrl] = useState<string>(
    localStorage.getItem('cbt_supabase_url') || metaEnv.VITE_SUPABASE_URL || ''
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(
    localStorage.getItem('cbt_supabase_key') || metaEnv.VITE_SUPABASE_ANON_KEY || ''
  );

  const [activeTab, setActiveTab] = useState<'questions' | 'sync' | 'config' | 'sql'>(initialTab);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Question Sync Filters
  const [questionFilterGuru, setQuestionFilterGuru] = useState<string>('ALL');
  const [questionFilterMapel, setQuestionFilterMapel] = useState<string>('ALL');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');

  // Supabase Question Stats & Diagnostic
  const [cloudStats, setCloudStats] = useState<{
    total: number;
    teachers: string[];
    subjects: string[];
  } | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<SupabaseDiagnosticResult | null>(null);
  const [isCheckingDiagnostic, setIsCheckingDiagnostic] = useState<boolean>(false);

  const handleRunDiagnostic = async () => {
    setIsCheckingDiagnostic(true);
    setStatusMessage({
      type: 'info',
      text: 'Sedang memeriksa koneksi Supabase & tabel bank_soal...',
    });
    const diag = await diagnoseSupabaseBankSoal();
    setDiagnosticData(diag);
    setIsCheckingDiagnostic(false);

    if (!diag.canConnect) {
      setStatusMessage({
        type: 'error',
        text: `Diagnostik: Gagal terhubung ke Supabase. ${diag.errorMessage || ''}`,
      });
    } else if (!diag.tableExists) {
      setStatusMessage({
        type: 'error',
        text: 'Diagnostik: Tabel "bank_soal" belum dibuat di Supabase! Buka tab "Skema SQL Editor".',
      });
    } else if (!diag.rlsOk) {
      setStatusMessage({
        type: 'error',
        text: 'Diagnostik: Row Level Security (RLS) memblokir pembacaan data. Jalankan skrip Policy.',
      });
    } else {
      setCloudStats({
        total: diag.totalQuestions,
        teachers: diag.teachers,
        subjects: diag.subjects,
      });
      setStatusMessage({
        type: 'success',
        text: `Diagnostik Sukses! Tabel bank_soal siap. Tersedia ${diag.totalQuestions} butir soal di cloud.`,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (isSupabaseConfigured()) {
        fetchSupabaseQuestionStats().then((res) => {
          if (res.success) {
            setCloudStats({
              total: res.total,
              teachers: res.teachers,
              subjects: res.subjects,
            });
          }
        });
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isConfigured = Boolean(
    supabaseUrl &&
      supabaseUrl.startsWith('http') &&
      supabaseAnonKey &&
      supabaseAnonKey.length > 20
  );

  const handleSaveConfig = () => {
    localStorage.setItem('cbt_supabase_url', supabaseUrl.trim());
    localStorage.setItem('cbt_supabase_key', supabaseAnonKey.trim());
    setStatusMessage({
      type: 'success',
      text: 'Kredensial Supabase berhasil disimpan di browser lokal!',
    });
    handleRunDiagnostic();
  };

  // --- QUESTION SYNC HANDLERS ---
  const handleBackupQuestionsNow = async () => {
    if (!questions || questions.length === 0) {
      setStatusMessage({ type: 'error', text: 'Tidak ada soal di browser untuk dicadangkan.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({
      type: 'info',
      text: `Sedang mencadangkan ${questions.length} butir soal ke Supabase Cloud (Tabel bank_soal)...`,
    });

    const result = await backupQuestionsToSupabase(questions, defaultKodeGuru, defaultMapel);

    setIsLoading(false);
    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
      fetchSupabaseQuestionStats().then((res) => {
        if (res.success) {
          setCloudStats({
            total: res.total,
            teachers: res.teachers,
            subjects: res.subjects,
          });
        }
      });
      showAlert(result.message);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
      // Run diagnostic in background to identify missing table or RLS issue
      diagnoseSupabaseBankSoal().then((diag) => setDiagnosticData(diag));
      showAlert(result.message);
    }
  };

  const handleRestoreQuestionsNow = async () => {
    if (!onRestoreQuestions) {
      showAlert('Fungsi restore soal belum terpasang.');
      return;
    }

    setIsLoading(true);
    setStatusMessage({
      type: 'info',
      text: 'Sedang mengunduh butir soal dari Supabase Cloud...',
    });

    const result = await restoreQuestionsFromSupabase({
      kodeGuru: questionFilterGuru,
      mapel: questionFilterMapel,
    });

    setIsLoading(false);
    if (result.success && result.data && result.data.length > 0) {
      onRestoreQuestions(result.data, restoreMode);
      setStatusMessage({
        type: 'success',
        text: `Sukses! ${result.data.length} butir soal berhasil dimuat dari Supabase (${
          restoreMode === 'merge' ? 'Digabungkan' : 'Digantikan'
        }).`,
      });
      showAlert(
        `Sukses! ${result.data.length} butir soal dari Supabase berhasil disinkronkan ke browser Anda.`
      );
    } else {
      const fullError =
        result.message +
        (result.diagnosticHelp ? `\n\n💡 Solusi / Petunjuk: ${result.diagnosticHelp}` : '');
      setStatusMessage({
        type: 'error',
        text: `${result.message} ${result.diagnosticHelp ? `[${result.diagnosticHelp}]` : ''}`,
      });
      // Automatically run diagnostic so UI displays the exact status and fix
      diagnoseSupabaseBankSoal().then((diag) => setDiagnosticData(diag));
      showAlert(fullError);
    }
  };

  // --- USER SYNC HANDLERS ---
  const handleBackupUsersNow = async () => {
    setIsLoading(true);
    setStatusMessage({
      type: 'info',
      text: 'Sedang mencadangkan data master user ke Supabase Cloud...',
    });

    const result = await backupAllUsersToSupabase({
      students,
      teachers,
      admins,
    });

    setIsLoading(false);
    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleRestoreUsersNow = async () => {
    if (
      !confirm('Apakah Anda yakin ingin menyinkronkan & menimpa data user lokal dari Supabase Cloud?')
    ) {
      return;
    }

    setIsLoading(true);
    setStatusMessage({
      type: 'info',
      text: 'Sedang mengunduh data master user dari Supabase Cloud...',
    });

    const result = await restoreUsersFromSupabase();

    setIsLoading(false);
    if (result.success && result.data) {
      onRestoreUsers(result.data);
      setStatusMessage({ type: 'success', text: result.message });
      showAlert(result.message);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleCopySql = () => {
    const sql = generateSupabaseSQLSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-150">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 px-6 py-4 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                Penyimpanan Supabase Cloud CBT
                {isConfigured ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Terhubung
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Belum Dikonfigurasi
                  </span>
                )}
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Sinkronisasi Bank Soal & Master User Antar-Browser Laptop Guru
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL TAB SWITCHER */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex gap-2 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Bank Soal Cloud ({questions.length})
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Master User ({students.length + teachers.length})
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Key className="w-4 h-4" /> Kredensial API
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" /> Skema SQL Editor
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STATUS BANNER */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-bold flex items-center gap-3 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-red-50 text-red-900 border-red-200'
                  : 'bg-sky-50 text-sky-900 border-sky-200'
              }`}
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: BANK SOAL CLOUD */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              {/* Info Box */}
              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-200 text-sky-950 text-xs space-y-1.5">
                <p className="font-bold flex items-center gap-2 text-sky-900">
                  <Sparkles className="w-4 h-4 text-sky-600" /> Sinkronisasi Bank Soal Antar-Browser Guru
                </p>
                <p className="text-sky-800 leading-relaxed">
                  Dengan Supabase, bank soal tidak lagi terkurung di satu browser laptop saja. Guru
                  dapat mencadangkan soal ke database Supabase, lalu guru lain atau laptop lain dapat
                  menarik soal tersebut secara instan!
                </p>
              </div>

              {/* CURRENT QUESTIONS SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">
                      Bank Soal di Browser Ini
                    </span>
                    <strong className="text-xl text-slate-900 font-black">
                      {questions.length} Butir Soal
                    </strong>
                    <span className="text-[10px] text-slate-400 block">
                      Mapel: {defaultMapel} | Guru: {defaultKodeGuru}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold block">
                      Bank Soal di Supabase Cloud
                    </span>
                    <strong className="text-xl text-slate-900 font-black">
                      {cloudStats ? `${cloudStats.total} Butir Soal` : 'Terhubung'}
                    </strong>
                    <span className="text-[10px] text-emerald-700 font-medium block">
                      {cloudStats
                        ? `${cloudStats.teachers.length} Guru | ${cloudStats.subjects.length} Mapel`
                        : 'Siap Sinkron'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION PANELS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. UPLOAD TO SUPABASE */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                      <CloudUpload className="w-5 h-5 text-emerald-600" />
                      <span>Cadangkan Soal Lokal ke Supabase</span>
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Kirim <b>{questions.length} soal</b> yang ada di browser Anda ke tabel{' '}
                      <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-mono">
                        bank_soal
                      </code>{' '}
                      di Supabase agar tersimpan aman di cloud.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackupQuestionsNow}
                    disabled={isLoading || !isConfigured || questions.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black py-3 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4" />
                    )}
                    <span>Upload {questions.length} Soal ke Supabase</span>
                  </button>
                </div>

                {/* 2. PULL FROM SUPABASE */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                        <CloudDownload className="w-5 h-5 text-blue-600" />
                        <span>Tarik Soal dari Supabase Cloud</span>
                      </h4>
                      <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                        Unduh bank soal dari Supabase Cloud ke browser Anda untuk digunakan dalam ujian CBT.
                      </p>
                    </div>

                    {/* Filter Options */}
                    <div className="space-y-2 bg-white/70 p-3 rounded-xl border border-blue-100 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-bold text-slate-700">Filter Guru:</label>
                        <select
                          value={questionFilterGuru}
                          onChange={(e) => setQuestionFilterGuru(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg p-1 text-xs font-semibold"
                        >
                          <option value="ALL">Semua Guru (Bank Soal Sekolah)</option>
                          <option value={defaultKodeGuru}>Hanya Guru Ini ({defaultKodeGuru})</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.kodeGuru || t.nip}>
                              {t.nama} ({t.kodeGuru})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-bold text-slate-700">Filter Mapel:</label>
                        <select
                          value={questionFilterMapel}
                          onChange={(e) => setQuestionFilterMapel(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg p-1 text-xs font-semibold"
                        >
                          <option value="ALL">Semua Mata Pelajaran</option>
                          {defaultMapel && (
                            <option value={defaultMapel}>Hanya Mapel Ini ({defaultMapel})</option>
                          )}
                          {(mapelList || []).filter((m) => m !== defaultMapel).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-bold text-slate-700">Mode Sinkron:</label>
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="restoreMode"
                              checked={restoreMode === 'merge'}
                              onChange={() => setRestoreMode('merge')}
                              className="text-blue-600"
                            />
                            <span className="text-[11px] font-bold text-slate-700">Gabungkan</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="restoreMode"
                              checked={restoreMode === 'replace'}
                              onChange={() => setRestoreMode('replace')}
                              className="text-red-600"
                            />
                            <span className="text-[11px] font-bold text-red-700">Gantikan</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestoreQuestionsNow}
                    disabled={isLoading || !isConfigured}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black py-3 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudDownload className="w-4 h-4" />
                    )}
                    <span>Tarik Soal dari Supabase ke Browser</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRunDiagnostic}
                    disabled={isCheckingDiagnostic || !isConfigured}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-3 rounded-xl text-[11px] border border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    {isCheckingDiagnostic ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{isCheckingDiagnostic ? 'Sedang Mendiagnosa...' : '🔍 Cek Status Database & Diagnostik Soal'}</span>
                  </button>
                </div>
              </div>

              {/* DIAGNOSTIC REPORT CARD */}
              {diagnosticData && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    !diagnosticData.canConnect || !diagnosticData.tableExists || !diagnosticData.rlsOk
                      ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                      : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 border-b border-black/10">
                    <span className="font-extrabold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Hasil Diagnostik Database Supabase Cloud:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        diagnosticData.tableExists && diagnosticData.rlsOk
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {diagnosticData.tableExists && diagnosticData.rlsOk ? 'Siap Digunakan' : 'Perlu Tindakan'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1 text-[11px]">
                    <div className="bg-white/80 p-2 rounded-xl border border-black/5">
                      <span className="text-slate-500 block">Koneksi API:</span>
                      <strong className={diagnosticData.canConnect ? 'text-emerald-700' : 'text-red-700'}>
                        {diagnosticData.canConnect ? '✅ Terhubung' : '❌ Gagal Terhubung'}
                      </strong>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-black/5">
                      <span className="text-slate-500 block">Tabel bank_soal:</span>
                      <strong className={diagnosticData.tableExists ? 'text-emerald-700' : 'text-red-700 font-extrabold'}>
                        {diagnosticData.tableExists ? '✅ Ada di Database' : '❌ Belum Dibuat'}
                      </strong>
                    </div>

                    <div className="bg-white/80 p-2 rounded-xl border border-black/5">
                      <span className="text-slate-500 block">Soal di Cloud:</span>
                      <strong className="text-slate-900">
                        {diagnosticData.totalQuestions} Butir Soal
                      </strong>
                    </div>
                  </div>

                  {diagnosticData.errorMessage && (
                    <div className="p-2 bg-red-100/90 text-red-900 rounded-xl font-medium text-[11px]">
                      ⚠️ <b>Kendala:</b> {diagnosticData.errorMessage}
                    </div>
                  )}

                  {diagnosticData.solution && (
                    <div className="p-2.5 bg-white/90 text-slate-800 rounded-xl font-medium text-[11px] flex items-start justify-between gap-2 border border-black/5">
                      <div>
                        💡 <b>Solusi:</b> {diagnosticData.solution}
                      </div>
                      {!diagnosticData.tableExists && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('sql')}
                          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-xs"
                        >
                          Buka Tab SQL ➔
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MASTER USER SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* CURRENT LOCAL DATA SUMMARY */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
                  Ringkasan Data Master Lokal Saat Ini
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block">
                        Siswa Terdaftar
                      </span>
                      <strong className="text-lg text-slate-900 font-black">
                        {students.length} Siswa
                      </strong>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block">Guru Terdaftar</span>
                      <strong className="text-lg text-slate-900 font-black">
                        {teachers.length} Guru
                      </strong>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block">
                        Admin Terdaftar
                      </span>
                      <strong className="text-lg text-slate-900 font-black">
                        {admins.length} Admin
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PUSH BACKUP BUTTON */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                      <CloudUpload className="w-5 h-5 text-emerald-600" /> Upload / Backup ke Supabase
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Kirim dan perbarui data master user lokal ke database cloud Supabase.
                    </p>
                  </div>
                  <button
                    onClick={handleBackupUsersNow}
                    disabled={isLoading || !isConfigured}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4" />
                    )}
                    <span>Cadangkan Master User Sekarang</span>
                  </button>
                </div>

                {/* PULL RESTORE BUTTON */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-blue-950 text-sm flex items-center gap-2">
                      <CloudDownload className="w-5 h-5 text-blue-600" /> Tarik / Sinkronkan dari
                      Supabase
                    </h4>
                    <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                      Unduh data master user dari Supabase Cloud untuk menimpa data master lokal.
                    </p>
                  </div>
                  <button
                    onClick={handleRestoreUsersNow}
                    disabled={isLoading || !isConfigured}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudDownload className="w-4 h-4" />
                    )}
                    <span>Tarik Data Master User</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PENGATURAN KREDENSIAL */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ditemukan di Dashboard Supabase &gt; Project Settings &gt; API &gt; Project URL
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Supabase Anon Public Key (API Key)
                  </label>
                  <textarea
                    rows={3}
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kunci publik &apos;anon public&apos; aman digunakan di aplikasi web client-side.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Kredensial Supabase</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SKEMA SQL EDITOR */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span>Skrip SQL Schema Supabase (Termasuk Tabel bank_soal)</span>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-slate-800 px-3 py-1 rounded-lg transition cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Disalin!' : 'Salin Semua SQL'}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto text-[11px] leading-relaxed p-2 max-h-80">
                  {generateSupabaseSQLSchema()}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
