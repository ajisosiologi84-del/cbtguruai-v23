import React, { useState } from 'react';
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
  FileCode
} from 'lucide-react';
import { StudentUser, TeacherUser, AdminUser } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  backupAllUsersToSupabase,
  restoreUsersFromSupabase,
  generateSupabaseSQLSchema,
  RestoredMasterUsers
} from '../services/supabaseBackup';

export interface SupabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentUser[];
  teachers: TeacherUser[];
  admins: AdminUser[];
  onRestoreUsers: (data: RestoredMasterUsers) => void;
  showAlert?: (msg: string) => void;
}

export const SupabaseBackupModal: React.FC<SupabaseBackupModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  admins,
  onRestoreUsers,
  showAlert = alert
}) => {
  const metaEnv = (import.meta as any)?.env || {};
  const [supabaseUrl, setSupabaseUrl] = useState<string>(
    localStorage.getItem('cbt_supabase_url') || metaEnv.VITE_SUPABASE_URL || ''
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(
    localStorage.getItem('cbt_supabase_key') || metaEnv.VITE_SUPABASE_ANON_KEY || ''
  );

  const [activeTab, setActiveTab] = useState<'sync' | 'config' | 'sql'>('sync');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

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
      text: 'Kredensial Supabase berhasil disimpan di penyimpanan browser lokal!',
    });
  };

  const handleBackupNow = async () => {
    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Sedang mencadangkan data master user ke Supabase Cloud...' });

    // Save active config to localStorage in case
    localStorage.setItem('cbt_supabase_url', supabaseUrl.trim());
    localStorage.setItem('cbt_supabase_key', supabaseAnonKey.trim());

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

  const handleRestoreNow = async () => {
    if (!confirm('Apakah Anda yakin ingin menyinkronkan & menimpa data user lokal dari Supabase Cloud?')) {
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Sedang mengunduh data master user dari Supabase Cloud...' });

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
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 px-6 py-4 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                Backup Cloud Master Data User (Supabase)
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Penyimpanan cadangan terpusat untuk Data Siswa, Guru, dan Admin
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
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CloudUpload className="w-4 h-4" /> Backup & Restore
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Key className="w-4 h-4" /> Pengaturan Kredensial
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" /> Skema SQL Supabase
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

          {/* TAB 1: BACKUP & RESTORE */}
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
                      <span className="text-[11px] text-slate-500 font-bold block">Siswa Terdaftar</span>
                      <strong className="text-lg text-slate-900 font-black">{students.length} Siswa</strong>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block">Guru Terdaftar</span>
                      <strong className="text-lg text-slate-900 font-black">{teachers.length} Guru</strong>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block">Admin Terdaftar</span>
                      <strong className="text-lg text-slate-900 font-black">{admins.length} Admin</strong>
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
                      Kirim dan simpan salinan seluruh data siswa, guru, dan admin dari aplikasi ini ke Supabase Cloud.
                    </p>
                  </div>
                  <button
                    onClick={handleBackupNow}
                    disabled={isLoading || !isConfigured}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudUpload className="w-4 h-4" />
                    )}
                    <span>Backup Cloud Sekarang</span>
                  </button>
                </div>

                {/* PULL RESTORE BUTTON */}
                <div className="bg-gradient-to-br from-sky-50 to-indigo-50 p-5 rounded-2xl border border-sky-200 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sky-950 text-sm flex items-center gap-2">
                      <CloudDownload className="w-5 h-5 text-sky-600" /> Restore / Sync dari Supabase
                    </h4>
                    <p className="text-xs text-sky-800 mt-1 leading-relaxed">
                      Unduh dan muat ulang data master user dari Supabase Cloud jika Anda berpindah perangkat/browser.
                    </p>
                  </div>
                  <button
                    onClick={handleRestoreNow}
                    disabled={isLoading || !isConfigured}
                    className="mt-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CloudDownload className="w-4 h-4" />
                    )}
                    <span>Restore Data User</span>
                  </button>
                </div>

              </div>

              {/* ARCHITECTURE NOTICE */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-amber-950">Catatan Arsitektur Ujian Offline:</strong>
                  Pencadangan ini bersifat <b>Master Data User</b>. Saat ujian berlangsung, HP/Laptop siswa bekerja <b>100% offline</b> tanpa terhubung ke Supabase. Siswa mengunduh berkas jawaban <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950">.cbt</code> setelah selesai dan mengunggahnya ke Google Drive Sekolah.
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Key className="w-4 h-4 text-emerald-600" /> Form Kredensial Supabase Project
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL (<code className="text-emerald-700">VITE_SUPABASE_URL</code>)
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon API Key (<code className="text-emerald-700">VITE_SUPABASE_ANON_KEY</code>)
                  </label>
                  <textarea
                    rows={3}
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveConfig}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" /> Simpan Kredensial Lokal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-600" /> SQL DDL Script (Dashboard Supabase)
                </span>
                <button
                  onClick={handleCopySql}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy SQL
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-[350px] border border-slate-800 leading-relaxed">
                <pre>{generateSupabaseSQLSchema()}</pre>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>
              Status Supabase: <b>{isConfigured ? 'Terkoneksi' : 'Belum Dikonfigurasi'}</b>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
