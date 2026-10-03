import React, { useState } from 'react';
import {
  Download,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  UploadCloud,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Bell,
  ArrowRight,
  FileCheck,
  X,
  AlertCircle,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { DownloadAnimationModal } from './DownloadAnimationModal';

interface ResultViewProps {
  score: number;
  correctCount: number;
  incorrectCount: number;
  kkm: number;
  studentName: string;
  noPeserta: string;
  driveUploadUrl?: string;
  onDownloadEncryptedResult: () => void;
  onViewDiscussion?: () => void;
  onRestart: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  studentName,
  noPeserta,
  driveUploadUrl,
  onDownloadEncryptedResult,
  onRestart,
}) => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showMandatoryReminder, setShowMandatoryReminder] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const cleanName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
  const resultFileName = `HASIL_CBT_${noPeserta}_${cleanName}.cbt`;

  const handleStartDownload = () => {
    setIsDownloadModalOpen(true);
  };

  const handleDownloadCompleted = () => {
    setHasDownloaded(true);
    onDownloadEncryptedResult();
  };

  const handleAttemptExit = () => {
    if (!hasDownloaded) {
      setShowExitConfirm(true);
    } else {
      onRestart();
    }
  };

  const formattedDriveUrl = driveUploadUrl
    ? driveUploadUrl.startsWith('http')
      ? driveUploadUrl
      : `https://${driveUploadUrl}`
    : '';

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 fixed inset-0 z-40 overflow-y-auto p-3 sm:p-6">
      {/* Top Floating Alert Banner */}
      <div className="w-full max-w-xl mx-auto mb-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-amber-300 flex items-center justify-between gap-3 animate-pulse shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-white animate-bounce" />
          </div>
          <div className="text-left min-w-0">
            <p className="font-black text-xs sm:text-sm uppercase tracking-wider truncate flex items-center gap-1.5">
              <span>🚨 WAJIB UNDUH &amp; UPLOAD JAWABAN</span>
            </p>
            <p className="text-[11px] text-amber-100 font-medium truncate">
              {hasDownloaded
                ? '✅ File .cbt berhasil diunduh. Segera upload ke Google Drive!'
                : 'Jangan keluar sebelum mengunduh file (.cbt) & upload ke Drive!'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowMandatoryReminder(true)}
          className="bg-white text-orange-700 hover:bg-orange-50 active:scale-95 font-black text-xs px-3 py-1.5 rounded-xl shadow-md shrink-0 cursor-pointer transition-all"
        >
          Lihat Petunjuk
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in p-6 sm:p-8 text-center relative border border-gray-100 my-auto space-y-5">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-emerald-50 rounded-br-full -z-10 opacity-70"></div>
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-sky-50 rounded-tl-full -z-10 opacity-70"></div>

        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1 rounded-full text-xs font-bold mb-2 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Mode Offline &amp; Jawaban Terenkripsi Aman
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Ujian Telah Selesai!</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Terima kasih <span className="font-bold text-slate-800">{studentName}</span> ({noPeserta})
          </p>
        </div>

        {/* 2-Step Workflow Indicator */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> 2 Tahap Wajib Sebelum Meninggalkan Ruangan:
            </span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              Penting
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Step 1 Pill */}
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                hasDownloaded
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                  : 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold animate-pulse'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  hasDownloaded ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}
              >
                {hasDownloaded ? '✓' : '1'}
              </span>
              <div className="min-w-0">
                <p className="leading-tight truncate">1. Unduh .cbt</p>
                <p className="text-[9px] font-normal opacity-80">{hasDownloaded ? 'Sudah Diunduh' : 'Wajib Sekarang'}</p>
              </div>
            </div>

            {/* Step 2 Pill */}
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                hasDownloaded
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold animate-pulse'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  hasDownloaded ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600'
                }`}
              >
                2
              </span>
              <div className="min-w-0">
                <p className="leading-tight truncate">2. Upload Drive</p>
                <p className="text-[9px] font-normal opacity-80">{hasDownloaded ? 'Langkah Berikutnya' : 'Setelah Unduh'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Encrypted Download Banner */}
        <div
          className={`p-5 rounded-2xl shadow-md text-left space-y-3 relative overflow-hidden transition-all ${
            hasDownloaded
              ? 'bg-slate-900 border-2 border-emerald-500 text-white'
              : 'bg-slate-900 border-2 border-amber-400 text-white ring-4 ring-amber-400/40 shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
              <Download className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>LANGKAH 1: UNDUH FILE JAWABAN (.CBT)</span>
            </p>
            {hasDownloaded ? (
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> TERSIMPAN
              </span>
            ) : (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md animate-pulse">
                WAJIB
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            File <b>{resultFileName}</b> berisi seluruh jawaban ujian Anda dalam format terenkripsi digital.
          </p>

          <button
            type="button"
            onClick={handleStartDownload}
            className={`w-full font-black py-3.5 px-5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95 group ${
              hasDownloaded
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/30'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:opacity-95 text-slate-950 font-black shadow-orange-500/40 animate-pulse'
            }`}
          >
            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform shrink-0" />
            <span>{hasDownloaded ? 'Unduh Ulang File Jawaban (.cbt)' : 'UNDUH FILE JAWABAN SEKARANG (.CBT)'}</span>
            <Sparkles className="w-3.5 h-3.5 text-white shrink-0" />
          </button>
        </div>

        {/* Step 2: Upload Hasil Jawaban Google Drive Banner */}
        {formattedDriveUrl ? (
          <div
            className={`p-5 rounded-2xl shadow-md text-left space-y-3 border transition-all ${
              hasDownloaded
                ? 'bg-gradient-to-br from-indigo-900 to-slate-900 border-2 border-indigo-400 text-white ring-4 ring-indigo-500/40 shadow-xl'
                : 'bg-slate-900 border border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-indigo-300">
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                <span>LANGKAH 2: UPLOAD HASIL KE GOOGLE DRIVE</span>
              </p>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            </div>

            <p className="text-xs text-indigo-100 leading-relaxed">
              Setelah file <b>.cbt</b> terunduh, klik tombol di bawah untuk membuka folder Google Drive Pengawas dan unggah file jawaban Anda.
            </p>

            <a
              href={formattedDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full font-black py-3 px-5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs active:scale-95 cursor-pointer block text-center ${
                hasDownloaded
                  ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-600/50 animate-bounce'
                  : 'bg-indigo-700 hover:bg-indigo-600 text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" /> Buka Google Drive &amp; Upload File Jawaban (.cbt) ↗
            </a>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left space-y-1.5">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-slate-500" /> Upload Link Google Drive
            </p>
            <p className="text-[11px] text-slate-500">
              Link upload Google Drive belum dikonfigurasi. Serahkan file <b>.cbt</b> yang telah Anda unduh langsung ke Guru atau Pengawas Ruangan.
            </p>
          </div>
        )}

        {/* Exit Action */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleAttemptExit}
            className={`w-full min-h-[48px] font-extrabold py-3.5 px-5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer active:scale-98 ${
              hasDownloaded
                ? 'bg-slate-900 hover:bg-black text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <LogOut className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Keluar dari Aplikasi (Selesai)</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 pt-1">
          <span>create: </span>
          <a
            href="https://lynk.id/ajisosiologi"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-bold text-blue-600"
          >
            @ajisosiologi
          </a>{' '}
          - Offline Secure Assessment System
        </p>
      </div>

      {/* POPUP MODAL 1: ANIMATED MANDATORY DOWNLOAD REMINDER */}
      {showMandatoryReminder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-400 space-y-5 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Background glowing aura */}
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-300/30 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-orange-400/30 rounded-full blur-2xl"></div>

            {/* Floating Close Button */}
            <button
              type="button"
              onClick={() => setShowMandatoryReminder(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tutup Peringatan"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Bouncing Animated Icon */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping"></div>
              <div className="relative w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-amber-500/40 border-2 border-white animate-bounce">
                <Download className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                🚨 PERINGATAN WAJIB SETELAH UJIAN
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                JANGAN KELUAR DAHULU! <br />
                <span className="text-orange-600">WAJIB UNDUH HASIL JAWABAN</span>
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium max-w-sm mx-auto">
                Hasil ujian Anda belum lengkap sebelum Anda mengunduh berkas jawaban <b>.cbt</b> dan mengunggahnya ke Google Drive Guru Pengawas.
              </p>
            </div>

            {/* Two Step Visual Cards */}
            <div className="space-y-2 text-left">
              {/* Step 1 Card */}
              <div
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                  hasDownloaded
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-400 text-slate-900 ring-2 ring-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      hasDownloaded ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-bounce'
                    }`}
                  >
                    {hasDownloaded ? '✓' : '1'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs">Langkah 1: Unduh Berkas (.cbt)</h4>
                    <p className="text-[11px] text-slate-600">
                      {hasDownloaded
                        ? '✅ Berkas jawaban Anda sudah berhasil diunduh!'
                        : 'Simpan file rekaman jawaban resmi ke perangkat Anda.'}
                    </p>
                  </div>
                </div>

                {!hasDownloaded && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDownloadModalOpen(true);
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-black text-[11px] px-3 py-2 rounded-xl shadow-md shrink-0 active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </button>
                )}
              </div>

              {/* Step 2 Card */}
              <div
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  hasDownloaded
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      hasDownloaded ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs">Langkah 2: Upload ke Google Drive</h4>
                    <p className="text-[11px] text-slate-600">
                      {formattedDriveUrl
                        ? 'Kirimkan berkas .cbt ke Google Drive yang disediakan Guru.'
                        : 'Kirimkan berkas .cbt ke Pengawas Ruangan Ujian.'}
                    </p>
                  </div>
                </div>

                {formattedDriveUrl && (
                  <a
                    href={formattedDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-[11px] font-black px-3 py-2 rounded-xl shadow-md shrink-0 active:scale-95 cursor-pointer flex items-center gap-1 ${
                      hasDownloaded
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-slate-200 text-slate-500 pointer-events-none'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Drive</span>
                  </a>
                )}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="space-y-2 pt-2">
              {!hasDownloaded ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDownloadModalOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 hover:opacity-95 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 cursor-pointer animate-pulse"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  <span>SAYA MENGERTI, UNDUH JAWABAN SAYA (.CBT)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMandatoryReminder(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>LANJUTKAN KE HALAMAN HASIL (SUDAH UNDUH)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowMandatoryReminder(false)}
                className="text-slate-400 hover:text-slate-600 text-[11px] font-bold py-1 cursor-pointer block mx-auto"
              >
                Tutup Peringatan Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: EXIT CONFIRMATION WARNING (If student tries to exit without downloading) */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-4 border-red-500 space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-red-300">
              <AlertTriangle className="w-9 h-9 animate-bounce text-red-600" />
            </div>

            <div className="space-y-1.5">
              <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ⚠️ PERINGATAN KERAS!
              </span>
              <h3 className="text-xl font-black text-slate-900 leading-tight">
                Anda BELUM Mengunduh Berkas Jawaban!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Jika Anda keluar sekarang, Anda <b>tidak dapat mengunduh berkas jawaban (.cbt) lagi</b> dan nilai Anda tidak dapat diunggah ke Google Drive Guru.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  setIsDownloadModalOpen(true);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-2xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Jawaban Saya Dahulu (.cbt)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onRestart();
                }}
                className="w-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Tetap Keluar Tanpa Menyimpan File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Animation Modal */}
      <DownloadAnimationModal
        isOpen={isDownloadModalOpen}
        title="Mengunduh Hasil Jawaban (.cbt)"
        subtitle="Memproses stempel digital & enkripsi hasil ujian..."
        fileName={resultFileName}
        fileType="cbt"
        onComplete={handleDownloadCompleted}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};
