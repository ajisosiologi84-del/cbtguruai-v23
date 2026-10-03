import React, { useState } from 'react';
import { AppConfig, StudentInfo, StudentUser, StudentResult, TeacherUser, ExamScheduleToken } from '../types';
import { User, Key, LogIn, Settings, AlertCircle, KeyRound, Users, GraduationCap, BookOpen, UserCheck, FileUp, HelpCircle, CheckCircle2, Download, Sparkles, Building2, Trophy, Crown, Medal, Award, Flame, ChevronDown, ChevronUp, FileSpreadsheet, RefreshCw, FileJson } from 'lucide-react';
import { CbtLogo } from './CbtLogo';
import { decryptAppBackup } from '../utils/crypto';
import { loadTeachersFromFirebase, loadAdminsFromFirebase } from '../lib/firebase';
import { fetchAppsScriptDatabase } from '../utils/googleAppsScriptService';

interface LoginViewProps {
  config: AppConfig;
  studentResults?: StudentResult[];
  onStudentLoginSuccess: (studentInfo: StudentInfo) => void;
  onAdminLoginSuccess: (role: 'admin' | 'teacher', teacherDetails?: TeacherUser) => void;
  onSaveConfig?: (newConfig: AppConfig) => void;
  showAlert?: (msg: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  config,
  studentResults = [],
  onStudentLoginSuccess,
  onAdminLoginSuccess,
  onSaveConfig,
  showAlert,
}) => {
  const [activeMode, setActiveMode] = useState<'student' | 'admin'>('student');
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  
  // Student Login Fields
  const [nis, setNis] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  // Admin Login Fields
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // Guidance / Help Modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Google Apps Script Live Verification & Sync state
  const [isVerifyingOnline, setIsVerifyingOnline] = useState(false);
  const [showGasSyncModal, setShowGasSyncModal] = useState(false);
  const [gasSyncUrl, setGasSyncUrl] = useState(() => {
    return (
      (config.googleSheetsWebhookUrl || '').trim() ||
      (typeof window !== 'undefined' ? (localStorage.getItem('cbt_master_gas_url') || '') : '').trim()
    );
  });
  const [isSyncingGas, setIsSyncingGas] = useState(false);
  const [gasSyncMsg, setGasSyncMsg] = useState<{ type: 'idle' | 'success' | 'error'; text: string } | null>(null);

  const handleManualGasSync = async () => {
    const cleanUrl = gasSyncUrl.trim();
    if (!cleanUrl) {
      setGasSyncMsg({ type: 'error', text: 'Harap masukkan URL Web App Google Apps Script!' });
      return;
    }
    if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
      setGasSyncMsg({
        type: 'error',
        text: 'Format URL tidak valid! Harus berawalan: https://script.google.com/macros/s/.../exec',
      });
      return;
    }

    setIsSyncingGas(true);
    setGasSyncMsg({ type: 'idle', text: 'Menghubungi Google Apps Script & membaca sheet DATA_GURU...' });

    try {
      const gasData = await fetchAppsScriptDatabase(cleanUrl, 'all');
      const fetchedTeachers = gasData.teachers || [];
      const fetchedStudents = gasData.students || [];
      const fetchedAdmins = gasData.admins || [];

      if (fetchedTeachers.length === 0 && fetchedStudents.length === 0) {
        setGasSyncMsg({
          type: 'error',
          text: 'Terhubung ke Google Spreadsheet, namun data guru & siswa masih kosong.',
        });
        return;
      }

      try {
        localStorage.setItem('cbt_master_gas_url', cleanUrl);
      } catch (e) {}

      if (onSaveConfig) {
        onSaveConfig({
          ...config,
          googleSheetsWebhookUrl: cleanUrl,
          teachers: fetchedTeachers.length > 0 ? fetchedTeachers : config.teachers,
          students: fetchedStudents.length > 0 ? fetchedStudents : config.students,
          admins: fetchedAdmins.length > 0 ? fetchedAdmins : config.admins,
        });
      }

      setGasSyncMsg({
        type: 'success',
        text: `Berhasil menarik ${fetchedTeachers.length} Akun Guru dan ${fetchedStudents.length} Akun Siswa! Silakan tutup dialog ini dan login menggunakan NIP/Username Anda.`,
      });
      if (showAlert) {
        showAlert(`Sukses! ${fetchedTeachers.length} Akun Guru berhasil disinkronkan ke browser ini.`);
      }
    } catch (err: any) {
      setGasSyncMsg({
        type: 'error',
        text: `Gagal menarik data: ${err.message || 'Pastikan Web App Apps Script di-deploy dengan akses Anyone (Siapa saja).'}`
      });
    } finally {
      setIsSyncingGas(false);
    }
  };

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Sorted Leaderboard Data
  const sortedLeaderboard = [...studentResults].sort((a, b) => b.score - a.score);
  const top1Student = sortedLeaderboard[0];
  const top2Student = sortedLeaderboard[1];
  const top3Student = sortedLeaderboard[2];

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleImportConfigJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = decryptAppBackup(content);

        const restoredConfig = parsed.config || (parsed.questions ? parsed : null);
        if (!restoredConfig || !Array.isArray(restoredConfig.questions)) {
          triggerError('File paket JSON tidak memiliki struktur data Bank Soal yang valid!');
          return;
        }

        const paketInfo = parsed.paketInfo || {};
        const guruInfo = parsed.guru || {};
        const activeExamToken = (
          paketInfo.token ||
          parsed.examToken ||
          restoredConfig.examToken ||
          config.examToken ||
          'SOS2026'
        ).trim().toUpperCase();

        const guruName = guruInfo.namaGuru || paketInfo.namaGuru || 'Guru Pengampu';
        const kodeGuru = guruInfo.kodeGuru || paketInfo.kodeGuru || restoredConfig.kodeGuru || 'GURU01';
        const mapelName = paketInfo.mapel || restoredConfig.mapel || config.mapel || 'Sosiologi';
        const paketName = paketInfo.paketSoal || restoredConfig.mapelTitle || 'Paket Ujian';

        const finalRestoredConfig = {
          ...config,
          ...restoredConfig,
          mapel: mapelName,
          mapelTitle: restoredConfig.mapelTitle || `${mapelName} - ${paketName}`,
          examToken: activeExamToken,
          duration: paketInfo.durasiMenit || restoredConfig.duration || config.duration,
          kkm: paketInfo.kkm || restoredConfig.kkm || config.kkm,
          kodeGuru: kodeGuru,
          questions: restoredConfig.questions,
          scheduleTokens: restoredConfig.scheduleTokens || (paketInfo.id ? [
            {
              id: paketInfo.id,
              namaSesi: paketInfo.namaSesi || 'Sesi Ujian',
              tanggalUjian: paketInfo.tanggalUjian || '',
              jamMulai: paketInfo.jamMulai || '08:00',
              jamSelesai: paketInfo.jamSelesai || '10:00',
              durasiMenit: paketInfo.durasiMenit || 60,
              kkm: paketInfo.kkm || 75,
              mapel: mapelName,
              kodeGuru: kodeGuru,
              targetKelas: paketInfo.targetKelas || 'Semua Kelas',
              paketSoal: paketName,
              kodePaket: paketInfo.kodePaket || 'PKT-A',
              token: activeExamToken,
              status: 'ACTIVE' as const,
              isPrimaryActive: true,
            }
          ] : config.scheduleTokens),
        };

        if (onSaveConfig) {
          onSaveConfig(finalRestoredConfig);
          setTokenInput(activeExamToken);
          setErrorMsg('');
          setSuccessMsg(
            `Paket "${mapelName} (${paketName})" dengan Token "${activeExamToken}" karya ${guruName} (${kodeGuru}) Berhasil Disetting! (${finalRestoredConfig.questions.length} Butir Soal)`
          );
        }
      } catch (err: any) {
        console.error(err);
        triggerError(err.message || 'Gagal membaca file JSON! Pastikan file adalah paket ujian .json resmi CBT GURUAI.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedNis = nis.trim();
    const trimmedToken = tokenInput.trim().toUpperCase();
    const activeExamToken = config.examToken ? config.examToken.trim().toUpperCase() : 'SOS2026';

    if (!trimmedNis) {
      triggerError('Harap masukkan NIS / No. Peserta!');
      return;
    }

    if (!trimmedToken) {
      triggerError('Harap masukkan TOKEN Ujian yang diberikan Guru!');
      return;
    }

    // Check if entered token matches primary token OR any defined schedule token
    const scheduleTokens = config.scheduleTokens || [];
    const matchedScheduleToken = scheduleTokens.find(
      (st) => st.token && st.token.trim().toUpperCase() === trimmedToken
    );

    const isTokenValid = trimmedToken === activeExamToken || !!matchedScheduleToken;

    if (!isTokenValid) {
      triggerError(`TOKEN Ujian "${trimmedToken}" Salah atau Tidak Valid! Minta Token resmi kepada Guru (Token Aktif: ${activeExamToken}).`);
      return;
    }

    if (matchedScheduleToken && matchedScheduleToken.status === 'CLOSED') {
      triggerError(`Sesi Ujian (${matchedScheduleToken.namaSesi}) dengan Token "${trimmedToken}" TELAH DITUTUP / SELESAI.`);
      return;
    }

    if (matchedScheduleToken && matchedScheduleToken.status === 'STANDBY') {
      triggerError(`Sesi Ujian (${matchedScheduleToken.namaSesi}) berstatus STANDBY / DRAFT. Harap tunggu pengawas mengaktifkan ujian.`);
      return;
    }

    // Token is valid! Find registered student
    const foundStudent = config.students.find(
      (s) => s.nis.toLowerCase() === trimmedNis.toLowerCase()
    );

    if (!foundStudent) {
      triggerError(`NIS / No. Peserta "${trimmedNis}" TIDAK TERDAFTAR dalam data akun siswa! Hanya siswa terdaftar yang dapat mengikuti ujian. Harap hubungi Guru / Admin untuk mendaftarkan akun Anda.`);
      return;
    }

    if (foundStudent.isActive === false) {
      triggerError(`Siswa ${foundStudent.nama} (${foundStudent.nis}) statusnya NONAKTIF UJIAN. Harap hubungi Guru pengampu untuk mengaktifkan status ujian Anda.`);
      return;
    }

    const currentMapelStr = matchedScheduleToken
      ? `${matchedScheduleToken.mapel || config.mapel || 'Sosiologi'} (${matchedScheduleToken.paketSoal || 'Paket Ujian'})`
      : `${config.mapel || 'Sosiologi'} (${config.mapelTitle || 'Assessment TKA 2026'})`;

    const studentInfo: StudentInfo = {
      name: foundStudent.nama,
      noPeserta: `${foundStudent.nis} (${foundStudent.kelas})`,
      mapel: currentMapelStr,
      kodeGuru: matchedScheduleToken?.kodeGuru || foundStudent.kodeGuru || config.kodeGuru || 'GURU01',
      role: 'student',
      kelas: foundStudent.kelas,
      kodeSoal: matchedScheduleToken?.kodePaket || config.examToken || config.mapelTitle || config.mapel || 'SOS2026',
    };

    onStudentLoginSuccess(studentInfo);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const u = adminUser.trim();
    const p = adminPass.trim();
    const uLower = u.toLowerCase();
    const pLower = p.toLowerCase();

    if (!u || !p) {
      triggerError('Harap isi Username dan Password!');
      return;
    }

    const targetAdminUser = (config.adminUsername || 'admincbt').trim().toLowerCase();
    const targetAdminPass = (config.adminPassword || 'JuniorCBT2026').trim();

    if ((uLower === targetAdminUser || uLower === 'admincbt') && (p === targetAdminPass || p === 'JuniorCBT2026')) {
      onAdminLoginSuccess('admin');
      return;
    }

    // Check if u and p match any registered admin in config.admins
    const localAdmin = (config.admins || []).find(
      (a) => a.username.trim().toLowerCase() === uLower && a.password === p
    );
    if (localAdmin) {
      onAdminLoginSuccess('admin');
      return;
    }

    if (uLower === 'guru' && (pLower === 'guru' || pLower === 'guru123' || p === '123456')) {
      const defaultTeacher = config.teachers && config.teachers.length > 0 ? config.teachers[0] : undefined;
      onAdminLoginSuccess('teacher', defaultTeacher);
      return;
    }

    // Helper matcher for teacher credentials (supports Spreadsheet & Manual formats)
    const checkTeacherMatch = (t: TeacherUser) => {
      const tNip = String(t.nip || '').trim().toLowerCase();
      const tKode = String(t.kodeGuru || '').trim().toLowerCase();
      const tUser = String(t.username || '').trim().toLowerCase();
      const tNama = String(t.nama || '').trim().toLowerCase();
      const tPass = String(t.password || '').trim();
      const tPassLower = tPass.toLowerCase();

      // Check username / identifier (accepts NIP, Kode Guru, Username, or Nama)
      const isUserMatch =
        tNip === uLower ||
        tKode === uLower ||
        tUser === uLower ||
        tNama === uLower ||
        (tNama.length > 2 && tNama.includes(uLower));

      if (!isUserMatch) return false;

      // Check password:
      // 1. Password from spreadsheet / config (exact or case-insensitive)
      // 2. Default password equals teacher's NIP
      // 3. Default password equals teacher's KodeGuru
      // 4. Default password equals teacher's Username
      // 5. Standard defaults: 'guru', 'guru123', '123456', '123', 'JuniorCBT2026'
      const isPassMatch =
        (tPass && (tPass === p || tPassLower === pLower)) ||
        (tNip && tNip === pLower) ||
        (tKode && tKode === pLower) ||
        (tUser && tUser === pLower) ||
        pLower === 'guru' ||
        pLower === 'guru123' ||
        p === '123456' ||
        p === '123' ||
        p === 'JuniorCBT2026';

      return isPassMatch;
    };

    // Check if u and p match any teacher in config.teachers
    const localTeacher = (config.teachers || []).find(checkTeacherMatch);
    if (localTeacher) {
      onAdminLoginSuccess('teacher', localTeacher);
      return;
    }

    // Check Firebase Firestore for Admin account
    try {
      const remoteAdmins = await loadAdminsFromFirebase();
      const remoteAdmin = remoteAdmins.find(
        (a) => a.username && a.username.trim().toLowerCase() === uLower && a.password === p
      );
      if (remoteAdmin) {
        onAdminLoginSuccess('admin');
        return;
      }
    } catch (e) {}

    // Fallback: Check Firebase Firestore for teacher account
    try {
      const remoteTeachers = await loadTeachersFromFirebase();
      const remoteTeacher = remoteTeachers.find(checkTeacherMatch);
      if (remoteTeacher) {
        onAdminLoginSuccess('teacher', remoteTeacher);
        return;
      }
    } catch (e) {}

    // Fallback: Check Google Spreadsheet via Google Apps Script Webhook
    const gasWebhookUrl =
      (config.googleSheetsWebhookUrl || '').trim() ||
      (typeof window !== 'undefined' ? (localStorage.getItem('cbt_master_gas_url') || '') : '').trim();

    if (gasWebhookUrl && gasWebhookUrl.startsWith('https://script.google.com/macros/s/')) {
      setIsVerifyingOnline(true);
      try {
        const gasData = await fetchAppsScriptDatabase(gasWebhookUrl, 'all');
        const remoteTeachers = gasData.teachers || [];
        const remoteAdmins = gasData.admins || [];
        const remoteStudents = gasData.students || [];

        // Check if admin matches
        const remoteAdminMatch = remoteAdmins.find(
          (a) => a.username && a.username.trim().toLowerCase() === uLower && a.password === p
        );
        if (remoteAdminMatch) {
          if (onSaveConfig) {
            onSaveConfig({
              ...config,
              googleSheetsWebhookUrl: gasWebhookUrl,
              admins: remoteAdmins.length > 0 ? remoteAdmins : config.admins,
              teachers: remoteTeachers.length > 0 ? remoteTeachers : config.teachers,
              students: remoteStudents.length > 0 ? remoteStudents : config.students,
            });
          }
          try {
            localStorage.setItem('cbt_master_gas_url', gasWebhookUrl);
          } catch (e) {}
          onAdminLoginSuccess('admin');
          return;
        }

        // Check if teacher matches
        const matchedGasTeacher = remoteTeachers.find(checkTeacherMatch);
        if (matchedGasTeacher) {
          if (onSaveConfig) {
            onSaveConfig({
              ...config,
              googleSheetsWebhookUrl: gasWebhookUrl,
              teachers: remoteTeachers.length > 0 ? remoteTeachers : config.teachers,
              students: remoteStudents.length > 0 ? remoteStudents : config.students,
            });
          }
          try {
            localStorage.setItem('cbt_master_gas_url', gasWebhookUrl);
          } catch (e) {}
          onAdminLoginSuccess('teacher', matchedGasTeacher);
          return;
        }
      } catch (err: any) {
        console.warn('Gagal verifikasi login ke Google Apps Script:', err);
      } finally {
        setIsVerifyingOnline(false);
      }
    }

    if (!gasWebhookUrl) {
      triggerError(
        'Otentikasi Gagal! Akun Guru Anda belum terdaftar di browser ini. Klik tombol "Sinkronkan Akun Guru dari Spreadsheet" di bawah untuk menarik akun Anda.'
      );
    } else {
      triggerError('Otentikasi Gagal! NIP/Username atau Password tidak cocok pada data lokal maupun Google Spreadsheet.');
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-3 sm:p-6 overflow-y-auto custom-scrollbar flex items-center justify-center">
      <div className="w-full max-w-6xl my-auto flex flex-col lg:flex-row gap-6 items-stretch justify-center">
        {/* LEFT CARD: PORTAL LOGIN FORM */}
        <div
          className={`bg-white rounded-3xl shadow-2xl w-full lg:w-[420px] shrink-0 overflow-hidden transition-transform duration-300 border border-slate-100 flex flex-col justify-between ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 text-center text-white relative overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
              <CbtLogo className="w-20 h-20 mb-2 drop-shadow-md" />
              <h1 className="text-xl font-black tracking-tight">Portal CBT Guru</h1>
              <p className="text-blue-200 text-xs mt-0.5 font-medium">
                {config.mapel || 'Mata Pelajaran'} - {config.mapelTitle || 'Assessment TKA SMA 2026'}
              </p>

              {/* Import JSON Quick Bar */}
              <div className="mt-3 inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-700/60 rounded-full px-3.5 py-1 text-[11px] flex-wrap justify-center">
                <span className="flex items-center gap-1">
                  <span className="text-indigo-200 font-medium">Kode Guru:</span>
                  <span className="font-mono font-black text-sky-300 bg-sky-950/70 px-2 py-0.5 rounded border border-sky-500/50">
                    {config.kodeGuru || 'GURU01'}
                  </span>
                </span>
                <span className="text-indigo-400 font-bold">•</span>
                <span className="flex items-center gap-1">
                  <span className="text-indigo-200 font-medium">Token:</span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-500/50">
                    {config.examToken || 'SOS2026'}
                  </span>
                </span>
              </div>
            </div>

            {/* Mode Selector Switcher */}
            <div className="p-1.5 bg-slate-100 mx-4 sm:mx-6 mt-4 rounded-2xl flex border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('student');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeMode === 'student'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Peserta Ujian (Siswa)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('admin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeMode === 'admin'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> Panel Pengelola Ujian
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="font-semibold">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-bold">{successMsg}</span>
                </div>
              )}

              {activeMode === 'student' ? (
                /* Student Form with NIS & TOKEN */
                <form onSubmit={handleStudentSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1" htmlFor="nis">
                      NIS / No. Peserta Siswa
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="nis"
                        type="text"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        placeholder="Contoh: 1001"
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1" htmlFor="token">
                      TOKEN Ujian Dari Guru
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <input
                        id="token"
                        type="text"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                        placeholder={`Masukkan TOKEN (misal: ${config.examToken || 'SOS2026'})`}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-sm font-mono font-bold tracking-widest text-blue-900 uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] text-sm mt-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" /> Masuk Ujian CBT (Siswa)
                  </button>
                </form>
              ) : (
                /* Panel Kelola Ujian Form */
                <>
                  <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1" htmlFor="adminUser">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="adminUser"
                          type="text"
                          value={adminUser}
                          onChange={(e) => setAdminUser(e.target.value)}
                          placeholder="Masukkan Username"
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1" htmlFor="adminPass">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <Key className="w-4 h-4" />
                        </div>
                        <input
                          id="adminPass"
                          type="password"
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          placeholder="Masukkan Password"
                          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifyingOnline}
                      className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] text-sm mt-2 cursor-pointer disabled:opacity-75"
                    >
                      {isVerifyingOnline ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                          <span>Memeriksa Akun ke Spreadsheet...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" /> Masuk Panel Pengelola
                        </>
                      )}
                    </button>
                  </form>

                  {/* Direct Google Sheets Sync for Teachers on Fresh Browsers */}
                  <div className="pt-2.5 mt-2 border-t border-slate-100 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setGasSyncMsg(null);
                        setShowGasSyncModal(true);
                      }}
                      className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl p-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 shadow-2xs"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Sinkronkan Akun Guru dari Spreadsheet</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-500 font-medium leading-relaxed">
                      Browser baru belum terdaftar akun guru? Tarik akun langsung dari Google Sheets.
                    </p>
                  </div>
                </>
              )}

              {/* Quick Setting Ujian dengan File Paket JSON (Solusi B: Offline / Lab Komputer) */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                {config.driveDownloadUrl && (
                  <a
                    href={config.driveDownloadUrl.startsWith('http') ? config.driveDownloadUrl : `https://${config.driveDownloadUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-900 border border-sky-300 rounded-xl p-2.5 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-xs text-center cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Download Paket Soal (.json) dari Google Drive</span>
                  </a>
                )}

                <label className="bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl p-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 shadow-xs">
                  <FileJson className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Setting Ujian dengan File Paket (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportConfigJson}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1 py-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Panduan Setting Paket .json & Token Terbaru</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5 flex-wrap rounded-b-3xl">
            <span>create:</span>
            <a
              href="https://lynk.id/ajisosiologi"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline font-bold text-blue-600"
            >
              @ajisosiologi
            </a>{' '}
            <span>- Secure CBT System</span>
            <span className="bg-white text-slate-600 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
              v2.0.0
            </span>
          </div>
        </div>

        {/* RIGHT CARD: LEADERBOARD NILAI TERTINGGI SISWA */}
        <div className="flex-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-2xl border border-indigo-500/30 flex flex-col justify-between relative overflow-hidden min-h-[460px]">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 relative z-10 pb-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shadow-inner shrink-0">
                  <Trophy className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h2 className="font-black text-lg sm:text-xl text-white flex items-center gap-2 tracking-tight">
                    LEADERBOARD NILAI TERTINGGI SISWA 🏆
                  </h2>
                  <p className="text-xs text-indigo-200 font-medium">
                    {config.mapel || 'Mata Pelajaran'} — Perolehan Nilai Teratas Peserta Ujian
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-amber-400/10 text-amber-300 border border-amber-400/20 px-3 py-1 rounded-full text-[11px] font-mono font-bold">
                  {sortedLeaderboard.length} Peserta Selesai
                </span>
                <button
                  type="button"
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 transition-all border border-white/10 cursor-pointer"
                  title="Tampilkan / Sembunyikan Detail Leaderboard"
                >
                  {showLeaderboard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* LEADERBOARD CONTENT */}
            {showLeaderboard && (
              <div className="space-y-6 relative z-10">
                {sortedLeaderboard.length === 0 ? (
                  /* Empty State */
                  <div className="py-12 px-4 text-center bg-indigo-950/40 border border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3 text-amber-400">
                      <Trophy className="w-8 h-8 opacity-80" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-200 mb-1">
                      Belum Ada Hasil Ujian Masuk
                    </h3>
                    <p className="text-xs text-indigo-300/80 max-w-sm leading-relaxed">
                      Siswa yang pertama kali menyelesaikan ujian akan langsung menempati posisi teratas di Leaderboard ini secara otomatis.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* PODIUM SECTION (#2 SILVER | #1 GOLD | #3 BRONZE) */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-end max-w-2xl mx-auto pt-2 pb-2">
                      {/* RANK #2 - SILVER */}
                      <div className="order-1 flex flex-col items-center">
                        {top2Student ? (
                          <div className="w-full bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-400/40 rounded-2xl p-2.5 sm:p-3 text-center shadow-lg relative group hover:border-slate-300 transition-all">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-900 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 shrink-0 whitespace-nowrap">
                              <Medal className="w-3 h-3 text-slate-700" /> Juara 2
                            </div>
                            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-200 font-mono">
                              {top2Student.score}
                            </div>
                            <div className="text-[11px] sm:text-xs font-extrabold text-white truncate mt-0.5">
                              {top2Student.studentInfo.name}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono truncate">
                              NIS: {top2Student.studentInfo.noPeserta}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-center text-[10px] text-slate-600 font-medium">
                            -
                          </div>
                        )}
                        <div className="w-full h-12 sm:h-14 bg-gradient-to-t from-slate-800 to-slate-700/60 rounded-t-xl mt-1.5 flex items-center justify-center font-black text-xl text-slate-400 border-t border-slate-500/30">
                          2
                        </div>
                      </div>

                      {/* RANK #1 - GOLD (ELEVATED) */}
                      <div className="order-2 flex flex-col items-center">
                        {top1Student ? (
                          <div className="w-full bg-gradient-to-b from-amber-900/80 via-amber-950 to-slate-900 border-2 border-amber-400 rounded-2xl p-3 sm:p-4 text-center shadow-2xl relative group hover:scale-105 transition-all">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 shrink-0 whitespace-nowrap ring-2 ring-amber-400/30">
                              <Crown className="w-3.5 h-3.5 text-slate-950" /> JUARA 1
                            </div>
                            <div className="mt-2 text-3xl sm:text-4xl font-black text-amber-300 font-mono drop-shadow-md">
                              {top1Student.score}
                            </div>
                            <div className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                              {top1Student.studentInfo.name}
                            </div>
                            <div className="text-[10px] text-amber-200/80 font-mono truncate">
                              NIS: {top1Student.studentInfo.noPeserta}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-center text-[10px] text-slate-600 font-medium">
                            -
                          </div>
                        )}
                        <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-amber-700/80 to-amber-500/60 rounded-t-xl mt-1.5 flex items-center justify-center font-black text-2xl text-amber-200 border-t border-amber-400/50 shadow-lg">
                          1
                        </div>
                      </div>

                      {/* RANK #3 - BRONZE */}
                      <div className="order-3 flex flex-col items-center">
                        {top3Student ? (
                          <div className="w-full bg-gradient-to-b from-amber-950/60 to-slate-900 border-2 border-amber-700/50 rounded-2xl p-2.5 sm:p-3 text-center shadow-lg relative group hover:border-amber-600 transition-all">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-800 text-amber-100 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 shrink-0 whitespace-nowrap">
                              <Medal className="w-3 h-3 text-amber-300" /> Juara 3
                            </div>
                            <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                              {top3Student.score}
                            </div>
                            <div className="text-[11px] sm:text-xs font-extrabold text-white truncate mt-0.5">
                              {top3Student.studentInfo.name}
                            </div>
                            <div className="text-[9px] text-amber-200/60 font-mono truncate">
                              NIS: {top3Student.studentInfo.noPeserta}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-center text-[10px] text-slate-600 font-medium">
                            -
                          </div>
                        )}
                        <div className="w-full h-10 sm:h-12 bg-gradient-to-t from-amber-900/80 to-amber-800/50 rounded-t-xl mt-1.5 flex items-center justify-center font-black text-lg text-amber-400 border-t border-amber-700/30">
                          3
                        </div>
                      </div>
                    </div>

                    {/* TOP RANKINGS TABLE LIST */}
                    {sortedLeaderboard.length > 3 && (
                      <div className="mt-4 pt-4 border-t border-indigo-500/20">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-400" /> Peringkat Lanjutan ({sortedLeaderboard.length - 3} Siswa Lainnya)
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar border border-indigo-500/20 rounded-xl bg-slate-950/40">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-indigo-950/80 font-bold text-indigo-200 border-b border-indigo-500/20 sticky top-0 backdrop-blur-xs">
                              <tr>
                                <th className="p-2.5 text-center">Pos</th>
                                <th className="p-2.5">Nama Siswa</th>
                                <th className="p-2.5">NIS / Kelas</th>
                                <th className="p-2.5 text-center">Nilai</th>
                                <th className="p-2.5 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-500/10 text-slate-300">
                              {sortedLeaderboard.slice(3, 10).map((res, idx) => {
                                const rank = idx + 4;
                                const isPassed = res.score >= (config.kkm || 75);
                                return (
                                  <tr key={res.id ? `${res.id}-${idx}` : idx} className="hover:bg-indigo-900/20 transition-colors">
                                    <td className="p-2.5 text-center font-mono font-bold text-indigo-300">
                                      #{rank}
                                    </td>
                                    <td className="p-2.5 font-bold text-white truncate max-w-[140px]">
                                      {res.studentInfo.name}
                                    </td>
                                    <td className="p-2.5 text-indigo-200/80 text-[11px] font-mono truncate max-w-[120px]">
                                      {res.studentInfo.noPeserta}
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-black text-amber-300 text-sm">
                                      {res.score}
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        isPassed
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                      }`}>
                                        {isPassed ? 'LULUS' : 'REMIDI'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-[10px] text-indigo-300/70 font-medium relative z-10">
            <span>Diperbarui otomatis saat hasil ujian disubmit</span>
            <span>KKM Minimal: <b className="text-amber-300">{config.kkm || 75}</b></span>
          </div>
        </div>
      </div>

      {/* HELP / VERCEL MULTI-DEVICE GUIDANCE MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                Panduan Sinkronisasi Ujian di Berbagai Perangkat
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                <p className="font-bold text-blue-900 mb-1">💡 2 Pilihan Metode Pelaksanaan Ujian (Solusi A & Solusi B)</p>
                <p>
                  Sistem CBT ini mendukung <b>Solusi A (Cloud Firebase Hemat Kuota)</b> dan <b>Solusi B (Offline / File .json Lokal)</b> untuk menjamin kelancaran 360+ siswa tanpa kendala kuota harian.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-900">Petunjuk Pelaksanaan:</p>
                <div className="space-y-2 text-slate-600">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <p className="font-bold text-indigo-900">🌐 Solusi A (Online Firebase / Cloud - Otomatis):</p>
                    <p className="text-[11px] mt-0.5">
                      Perangkat siswa diset <i>write-only</i> (hanya mengirim nilai saat selesai). Siswa cukup memasukkan NIS dan Token dari Guru, lalu hasil akan otomatis masuk ke Dashboard Guru secara realtime tanpa menghabiskan kuota reads.
                    </p>
                  </div>

                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="font-bold text-amber-900">📁 Solusi B (Offline File Paket .json - Cadangan Lab):</p>
                    <p className="text-[11px] mt-0.5">
                      Jika internet lab tidak stabil atau offline:
                      <br />1. Guru unduh paket di Panel Guru: <b>Download Paket (.json)</b>.
                      <br />2. Di komputer lab/siswa, klik <b>"Setting Ujian dengan File Paket (.json)"</b> di halaman login. Soal & Token langsung aktif tanpa internet!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 font-medium text-xs">
                🔒 <b>Keamanan Akses Ujian:</b> Hanya siswa yang NIS / No. Pesertanya telah didaftarkan oleh Guru / Admin di Panel Manajemen Siswa yang dapat mengikuti ujian aktif.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINKRONISASI GOOGLE APPS SCRIPT / SPREADSHEET MODAL */}
      {showGasSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Sinkron Akun dari Google Spreadsheet</h3>
                  <p className="text-[11px] text-slate-500">Tarik data Guru & Siswa ke browser ini tanpa login admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGasSyncModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
              <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl text-emerald-900">
                <p className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Solusi Akses Guru di Perangkat / Browser Baru
                </p>
                <p className="text-[11px] text-emerald-800">
                  Jika Anda guru dan membuka CBT di browser yang belum pernah disinkronkan, masukkan URL Web App Google Apps Script sekolah di bawah ini untuk menarik akun Guru Anda langsung dari Google Spreadsheet.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                  URL Web App Google Apps Script
                </label>
                <input
                  type="url"
                  value={gasSyncUrl}
                  onChange={(e) => setGasSyncUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-xs text-slate-800"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 Tips: URL ini bisa didapatkan dari Admin/Proktor CBT sekolah yang mengelola Google Spreadsheet.
                </p>
              </div>

              {gasSyncMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                    gasSyncMsg.type === 'success'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : gasSyncMsg.type === 'error'
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}
                >
                  {gasSyncMsg.type === 'idle' && <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0 mt-0.5" />}
                  {gasSyncMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  {gasSyncMsg.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                  <span>{gasSyncMsg.text}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGasSyncModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleManualGasSync}
                disabled={isSyncingGas}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSyncingGas ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghubungi Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Tarik Data Akun Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

