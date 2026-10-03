import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppConfig, Question, Option, ViewState, StudentInfo, StudentResult, CheatingLog, BroadcastAlert, TeacherUser } from './types';
import { isQuestionAnswerCorrect, getQuestionScoreAndCorrectness } from './utils/questionFormatter';
import { defaultQuestions } from './data/defaultQuestions';
import { defaultStudents } from './data/defaultStudents';
import { encryptResult } from './utils/crypto';
import { LoginView } from './components/LoginView';
import { AdminPanel } from './components/AdminPanel';
import { QuestionEditorModal } from './components/QuestionEditorModal';
import { PreTestView } from './components/PreTestView';
import { TestView } from './components/TestView';
import { ResultView } from './components/ResultView';
import { ReviewView } from './components/ReviewView';
import { WarningModal, ConfirmModal, AlertModal } from './components/Modals';
import {
  requestAppFullscreen,
  exitAppFullscreen,
  isAppFullscreen,
  checkSplitScreenViolation,
  playWarningAlarm,
  clearClipboard,
} from './utils/antiCheating';
import {
  saveConfigToFirebase,
  loadConfigFromFirebase,
  subscribeConfigFromFirebase,
  saveStudentResultToFirebase,
  loadStudentResultsFromFirebase,
  subscribeStudentResultsFromFirebase,
  loadStudentsFromFirebase,
  loadTeachersFromFirebase,
  loadAdminsFromFirebase,
  subscribeTeachersFromFirebase,
  subscribeStudentsFromFirebase,
  subscribeAdminsFromFirebase,
} from './lib/firebase';
import { fetchAppsScriptDatabase } from './utils/googleAppsScriptService';
import { ExamScheduleToken } from './types';
import { safeSaveConfigToLocalStorage, setItemIDB, getItemIDB } from './utils/idbStorage';

const defaultScheduleTokens: ExamScheduleToken[] = [
  {
    id: 'SCHED-01',
    namaSesi: 'Sesi 1 - Paket A (Kelas XII IPS 1 & XII IPS 2)',
    tanggalUjian: new Date().toISOString().split('T')[0],
    jamMulai: '08:00',
    jamSelesai: '09:30',
    durasiMenit: 60,
    kkm: 75,
    mapel: 'Sosiologi',
    kodeGuru: 'GURU01',
    targetKelas: 'XII IPS 1, XII IPS 2',
    paketSoal: 'Paket A (Utama)',
    kodePaket: 'PKT-SOS-A',
    token: 'SOS2026',
    status: 'ACTIVE',
    isPrimaryActive: true,
    keterangan: 'Ujian Utama Sesi Pagi Semester Genap 2026',
  },
  {
    id: 'SCHED-02',
    namaSesi: 'Sesi 2 - Paket B (Kelas XII IPS 3 & XII IPS 4)',
    tanggalUjian: new Date().toISOString().split('T')[0],
    jamMulai: '10:00',
    jamSelesai: '11:30',
    durasiMenit: 60,
    kkm: 75,
    mapel: 'Sosiologi',
    kodeGuru: 'GURU01',
    targetKelas: 'XII IPS 3, XII IPS 4',
    paketSoal: 'Paket B (Acak Variasi)',
    kodePaket: 'PKT-SOS-B',
    token: 'TKA891',
    status: 'STANDBY',
    isPrimaryActive: false,
    keterangan: 'Ujian Sesi Siang Semester Genap 2026',
  },
  {
    id: 'SCHED-03',
    namaSesi: 'Sesi 3 - Paket C (Ujian Susulan & Remedial)',
    tanggalUjian: new Date().toISOString().split('T')[0],
    jamMulai: '13:00',
    jamSelesai: '14:30',
    durasiMenit: 60,
    kkm: 75,
    mapel: 'Sosiologi',
    kodeGuru: 'GURU01',
    targetKelas: 'Semua Kelas (Susulan)',
    paketSoal: 'Paket C (Susulan & Remedial)',
    kodePaket: 'PKT-SOS-C',
    token: 'CBT992',
    status: 'STANDBY',
    isPrimaryActive: false,
    keterangan: 'Sesi Susulan & Remedial Peserta Berhalangan',
  },
];

const STORAGE_KEY = 'cbt_sosiologi_config_v2';
const RESULTS_KEY = 'cbt_sosiologi_student_results_v1';
const ACTIVE_SESSION_KEY = 'cbt_active_student_exam_session_v2';

// Helper to safely store student results to localStorage without exceeding 5MB quota
function safeSaveResultsToLocalStorage(key: string, results: StudentResult[]) {
  try {
    localStorage.setItem(key, JSON.stringify(results));
  } catch (firstErr) {
    // Fallback 1: Strip heavy image Data URLs from questionSnapshots (~90% size reduction)
    try {
      const lightResults = results.map((r) => {
        if (!r.questionSnapshots || !Array.isArray(r.questionSnapshots)) return r;
        const cleanedSnapshots = r.questionSnapshots.map((q) => {
          const { image, images, explanationImage, explanationImages, ...restQ } = q;
          const cleanedOptions = q.options?.map((opt) => {
            const { image: optImg, ...optRest } = opt;
            return optRest;
          });
          return { ...restQ, options: cleanedOptions };
        });
        return { ...r, questionSnapshots: cleanedSnapshots };
      });
      localStorage.setItem(key, JSON.stringify(lightResults));
    } catch (secondErr) {
      // Fallback 2: Keep latest 50 results with light snapshots
      try {
        const recentResults = results.slice(0, 50).map((r) => {
          if (!r.questionSnapshots || !Array.isArray(r.questionSnapshots)) return r;
          const cleanedSnapshots = r.questionSnapshots.map((q) => {
            const { image, images, explanationImage, explanationImages, ...restQ } = q;
            return restQ;
          });
          return { ...r, questionSnapshots: cleanedSnapshots };
        });
        localStorage.setItem(key, JSON.stringify(recentResults));
      } catch (thirdErr) {
        // Fallback 3: Keep latest 30 result summaries without snapshots
        try {
          const minimalResults = results.slice(0, 30).map((r) => {
            const { questionSnapshots, ...minimal } = r;
            return minimal;
          });
          localStorage.setItem(key, JSON.stringify(minimalResults));
        } catch (finalErr) {
          console.warn('LocalStorage quota exceeded for student results. Full data remains saved in Firebase database.');
        }
      }
    }
  }
}

// Helper to identify and strip the 20 legacy default questions
export const isLegacyDefaultQuestion = (q: any): boolean => {
  if (!q) return false;
  const text = String(q.question || '');
  return (
    text.includes('Perkembangan teknologi kecerdasan buatan (AI)') ||
    text.includes('Banyak masyarakat pedesaan kini beralih menggunakan e-commerce') ||
    text.includes('arus informasi dari negara-negara maju mendominasi media massa') ||
    text.includes('Sebuah perusahaan multinasional merelokasi pabriknya') ||
    text.includes('fast fashion menyebabkan siklus pergantian model') ||
    text.includes('Seorang remaja mengalami kebingungan identitas') ||
    text.includes('Sistem kerja jarak jauh (Remote Working/WFH)') ||
    text.includes('Pemerintah membangun jalan tol trans-provinsi') ||
    text.includes('Generasi Z cenderung lebih memilih menjadi konten kreator') ||
    text.includes('Di sebuah daerah tambang, terjadi ledakan ekonomi lokal') ||
    text.includes('Meningkatnya penggunaan transaksi nontunai (cashless)') ||
    text.includes('Perubahan kurikulum pendidikan yang mengintegrasikan computational thinking') ||
    text.includes('Gerakan kembali ke pangan lokal (food sovereignty)') ||
    text.includes('Urbanisasi masif ke kota megapolitan') ||
    text.includes('Di platform media sosial, algoritma kurasi konten menciptakan echo chamber') ||
    text.includes('Munculnya pemukiman kumuh (slum area) di bantaran sungai') ||
    text.includes('Penggunaan platform telemedicine untuk konsultasi dokter') ||
    text.includes('Perubahan pola konsumsi dari belanja luring ke daring') ||
    text.includes('Polarisasi opini di media sosial saat pemilihan umum') ||
    text.includes('Konsep smart city di kota-kota besar') ||
    (Boolean(q.explanation) && String(q.explanation).includes('HOTS') && q.mapel === 'Sosiologi' && typeof q.id === 'number' && q.id <= 20)
  );
};

export default function App() {
  // App Configuration State
  const [config, setConfig] = useState<AppConfig>(() => {
    const masterGasUrl = typeof window !== 'undefined' ? (localStorage.getItem('cbt_master_gas_url') || '') : '';
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const queryGasUrl = urlParams?.get('gas') || urlParams?.get('webhook') || '';
    const initialGasUrl = queryGasUrl || masterGasUrl || '';

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.questions)) {
          // Permanently strip any persistent legacy default questions
          const cleanedQuestions = parsed.questions.filter((q: Question) => !isLegacyDefaultQuestion(q));
          return {
            ...parsed,
            questions: cleanedQuestions,
            googleSheetsWebhookUrl: parsed.googleSheetsWebhookUrl || initialGasUrl || undefined,
            kodeGuru: parsed.kodeGuru || 'GURU01',
            examToken: parsed.examToken || 'SOS2026',
            scheduleTokens: Array.isArray(parsed.scheduleTokens) && parsed.scheduleTokens.length > 0 ? parsed.scheduleTokens : defaultScheduleTokens,
            students: Array.isArray(parsed.students) ? parsed.students : defaultStudents,
            maxQuestionsToDisplay: typeof parsed.maxQuestionsToDisplay === 'number' ? parsed.maxQuestionsToDisplay : 0,
            maxAttempts: typeof parsed.maxAttempts === 'number' && parsed.maxAttempts > 0 ? parsed.maxAttempts : 1,
            randomizeQuestions: parsed.randomizeQuestions !== false,
            randomizeOptions: parsed.randomizeOptions !== false,
            adminUsername: parsed.adminUsername || 'admincbt',
            adminPassword: parsed.adminPassword || 'JuniorCBT2026',
          };
        }
      }
    } catch (e) {
      console.error('Failed to load local storage config:', e);
    }
    return {
      duration: 60,
      kkm: 75,
      questions: [],
      examToken: 'SOS2026',
      kodeGuru: 'GURU01',
      googleSheetsWebhookUrl: initialGasUrl || undefined,
      scheduleTokens: defaultScheduleTokens,
      students: defaultStudents,
      teachers: [
        { id: 't1', nip: '198501152010011002', nama: 'Drs. Aji Sosiologi, M.Pd', mapel: 'Sosiologi', kodeGuru: 'GURU01' },
        { id: 't2', nip: '198803202012022005', nama: 'Siti Rahmawati, S.Pd', mapel: 'Sosiologi', kodeGuru: 'GURU02' },
      ],
      admins: [
        { id: 'adm1', username: 'admincbt', password: 'JuniorCBT2026', nama: 'Administrator Utama', role: 'superadmin', createdAt: new Date().toISOString() }
      ],
      maxQuestionsToDisplay: 0,
      maxAttempts: 1,
      randomizeQuestions: true,
      randomizeOptions: true,
      adminUsername: 'admincbt',
      adminPassword: 'JuniorCBT2026',
    };
  });

  // Student Results Rekap State (for Teacher Admin Panel)
  const [studentResults, setStudentResults] = useState<StudentResult[]>(() => {
    try {
      const saved = localStorage.getItem(RESULTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seenIds = new Set<string>();
          return parsed.map((r, idx) => {
            let uniqueId = r.id;
            if (!uniqueId || seenIds.has(uniqueId)) {
              uniqueId = `RES-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
            }
            seenIds.add(uniqueId);
            return { ...r, id: uniqueId };
          });
        }
      }
    } catch (e) {
      console.error('Failed to load student results:', e);
    }
    return [];
  });

  // Save config to LocalStorage, IndexedDB & Firebase on updates
  const saveConfig = useCallback((newConfig: AppConfig) => {
    const activeToken = newConfig.examToken?.trim() || 'SOS2026';
    const updatedConfig = {
      ...newConfig,
      examToken: activeToken,
      updatedAt: new Date().toISOString(),
    };
    setConfig(updatedConfig);

    // 1. Independent Firebase sync (not blocked by local storage limitations)
    saveConfigToFirebase(updatedConfig).catch((fbErr) => {
      console.warn('[Firebase] Remote sync notice:', fbErr);
    });

    // 2. High-capacity IndexedDB storage for offline persistence with full base64 images
    setItemIDB(STORAGE_KEY, updatedConfig).catch(() => {});

    // 3. Safe LocalStorage save with progressive quota fallbacks
    safeSaveConfigToLocalStorage(STORAGE_KEY, updatedConfig);
  }, []);

  const saveStudentResults = useCallback((results: StudentResult[]) => {
    const seenIds = new Set<string>();
    const sanitizedResults = results.map((r, idx) => {
      let uniqueId = r.id;
      if (!uniqueId || seenIds.has(uniqueId)) {
        uniqueId = `RES-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
      }
      seenIds.add(uniqueId);
      return { ...r, id: uniqueId };
    });
    setStudentResults(sanitizedResults);
    safeSaveResultsToLocalStorage(RESULTS_KEY, sanitizedResults);
  }, []);

  // View State & Admin Role
  const [viewState, setViewState] = useState<ViewState>('login');
  const [adminRole, setAdminRole] = useState<'admin' | 'teacher'>('admin');
  const [loggedInTeacher, setLoggedInTeacher] = useState<TeacherUser | null>(null);

  // Helper to merge remote config without losing locally updated token
  const mergeRemoteConfigWithLocalToken = (remoteConfig: AppConfig): AppConfig => {
    let activeToken = remoteConfig.examToken;
    try {
      const localSaved = localStorage.getItem(STORAGE_KEY);
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (parsed && parsed.examToken) {
          const localTime = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 1;
          const remoteTime = remoteConfig.updatedAt ? new Date(remoteConfig.updatedAt).getTime() : 0;

          // Preserve local token if local config is newer or equal, or if remote token is missing or default
          if (localTime >= remoteTime || !remoteConfig.examToken || remoteConfig.examToken === 'SOS2026') {
            activeToken = parsed.examToken;
          }
        }
      }
    } catch (e) {}
    return {
      ...remoteConfig,
      examToken: activeToken || remoteConfig.examToken || 'SOS2026',
    };
  };

  // One-time initial fetch from Firebase & IndexedDB on App Mount
  useEffect(() => {
    // Restore full question data from IndexedDB if available (contains full high-res images)
    getItemIDB<AppConfig>(STORAGE_KEY).then((idbConfig) => {
      if (idbConfig && Array.isArray(idbConfig.questions) && idbConfig.questions.length > 0) {
        setConfig((prev) => {
          const hasImages = idbConfig.questions.some(q => 
            q.image || q.images?.length || q.options?.some(o => o.image) || q.categoryStatements?.some(cs => cs.image)
          );
          if (hasImages && (!prev.questions || prev.questions.length <= idbConfig.questions.length)) {
            return {
              ...prev,
              ...idbConfig,
              questions: idbConfig.questions,
            };
          }
          return prev;
        });
      }
    }).catch(() => {});

    loadConfigFromFirebase().then((remoteConfig) => {
      if (remoteConfig && Array.isArray(remoteConfig.questions)) {
        const cleanedQuestions = remoteConfig.questions.filter((q) => !isLegacyDefaultQuestion(q));
        const merged = mergeRemoteConfigWithLocalToken({
          ...remoteConfig,
          questions: cleanedQuestions,
        });
        setConfig((prev) => {
          const newConfig = {
            ...merged,
            questions: cleanedQuestions.length > 0 ? cleanedQuestions : prev.questions,
            teachers: (merged.teachers && merged.teachers.length > 0) ? merged.teachers : prev.teachers,
            students: (merged.students && merged.students.length > 0) ? merged.students : prev.students,
            scheduleTokens: (merged.scheduleTokens && merged.scheduleTokens.length > 0) ? merged.scheduleTokens : prev.scheduleTokens,
          };
          safeSaveConfigToLocalStorage(STORAGE_KEY, newConfig);
          setItemIDB(STORAGE_KEY, newConfig).catch(() => {});
          return newConfig;
        });
      }
    }).catch(() => {});

    loadTeachersFromFirebase().then((remoteTeachers) => {
      if (remoteTeachers && remoteTeachers.length > 0) {
        setConfig((prev) => {
          const updated = { ...prev, teachers: remoteTeachers };
          safeSaveConfigToLocalStorage(STORAGE_KEY, updated);
          setItemIDB(STORAGE_KEY, updated).catch(() => {});
          return updated;
        });
      }
    }).catch(() => {});

    loadStudentsFromFirebase().then((remoteStudents) => {
      if (remoteStudents && remoteStudents.length > 0) {
        setConfig((prev) => {
          const updated = { ...prev, students: remoteStudents };
          safeSaveConfigToLocalStorage(STORAGE_KEY, updated);
          setItemIDB(STORAGE_KEY, updated).catch(() => {});
          return updated;
        });
      }
    }).catch(() => {});

    loadAdminsFromFirebase().then((remoteAdmins) => {
      if (remoteAdmins && remoteAdmins.length > 0) {
        setConfig((prev) => {
          const updated = { ...prev, admins: remoteAdmins };
          safeSaveConfigToLocalStorage(STORAGE_KEY, updated);
          setItemIDB(STORAGE_KEY, updated).catch(() => {});
          return updated;
        });
      }
    }).catch(() => {});
  }, []);

  // Firebase Realtime Synchronization (HANYA aktif untuk Guru/Admin saat memantau ujian)
  useEffect(() => {
    if (viewState !== 'admin') {
      return;
    }

    // Refresh student results for Admin/Teacher dashboard
    loadStudentResultsFromFirebase().then((remoteResults) => {
      if (Array.isArray(remoteResults) && remoteResults.length > 0) {
        setStudentResults(remoteResults);
        safeSaveResultsToLocalStorage(RESULTS_KEY, remoteResults);
      }
    }).catch(() => {});

    // Realtime subscribers (HANYA AKTIF SAAT viewState === 'admin')
    const unsubConfig = subscribeConfigFromFirebase((remoteConfig) => {
      if (remoteConfig && Array.isArray(remoteConfig.questions)) {
        const cleanedQuestions = remoteConfig.questions.filter((q) => !isLegacyDefaultQuestion(q));
        const merged = mergeRemoteConfigWithLocalToken({
          ...remoteConfig,
          questions: cleanedQuestions,
        });
        setConfig((prev) => ({
          ...merged,
          questions: cleanedQuestions,
          students: (merged.students && merged.students.length > 0) ? merged.students : prev.students,
          teachers: (merged.teachers && merged.teachers.length > 0) ? merged.teachers : prev.teachers,
        }));
        const updatedConfig = { ...merged, questions: cleanedQuestions };
        safeSaveConfigToLocalStorage(STORAGE_KEY, updatedConfig);
        setItemIDB(STORAGE_KEY, updatedConfig).catch(() => {});
      }
    });

    const unsubTeachers = subscribeTeachersFromFirebase((remoteTeachers) => {
      if (Array.isArray(remoteTeachers) && remoteTeachers.length > 0) {
        setConfig((prev) => {
          const updated = { ...prev, teachers: remoteTeachers };
          safeSaveConfigToLocalStorage(STORAGE_KEY, updated);
          setItemIDB(STORAGE_KEY, updated).catch(() => {});
          return updated;
        });
      }
    });

    const unsubStudents = subscribeStudentsFromFirebase((remoteStudents) => {
      if (Array.isArray(remoteStudents) && remoteStudents.length > 0) {
        setConfig((prev) => {
          const updated = { ...prev, students: remoteStudents };
          safeSaveConfigToLocalStorage(STORAGE_KEY, updated);
          setItemIDB(STORAGE_KEY, updated).catch(() => {});
          return updated;
        });
      }
    });

    const unsubAdmins = subscribeAdminsFromFirebase((remoteAdmins) => {
      if (Array.isArray(remoteAdmins) && remoteAdmins.length > 0) {
        setConfig((prev) => {
          const updated = { ...prev, admins: remoteAdmins };
          safeSaveConfigToLocalStorage(STORAGE_KEY, updated);
          setItemIDB(STORAGE_KEY, updated).catch(() => {});
          return updated;
        });
      }
    });

    const unsubResults = subscribeStudentResultsFromFirebase((remoteResults) => {
      if (Array.isArray(remoteResults)) {
        setStudentResults(remoteResults);
        safeSaveResultsToLocalStorage(RESULTS_KEY, remoteResults);
      }
    });

    return () => {
      unsubConfig();
      unsubTeachers();
      unsubStudents();
      unsubAdmins();
      unsubResults();
    };
  }, [viewState]);

  // Google Apps Script Auto-Sync Effect for Fresh Browsers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const queryGas = (urlParams.get('gas') || urlParams.get('webhook') || '').trim();
    const masterGas = (localStorage.getItem('cbt_master_gas_url') || '').trim();
    const targetGas = queryGas || config.googleSheetsWebhookUrl || masterGas;

    if (queryGas) {
      try {
        localStorage.setItem('cbt_master_gas_url', queryGas);
      } catch (e) {}
    }

    if (targetGas && targetGas.startsWith('https://script.google.com/macros/s/')) {
      // If queryGas was provided, or if local teachers count is minimal (<= 2), fetch from Spreadsheet
      const shouldSync = Boolean(queryGas) || (config.teachers && config.teachers.length <= 2);
      if (shouldSync) {
        fetchAppsScriptDatabase(targetGas, 'all')
          .then((gasData) => {
            if (gasData.teachers && gasData.teachers.length > 0) {
              setConfig((prev) => {
                const updated: AppConfig = {
                  ...prev,
                  googleSheetsWebhookUrl: targetGas,
                  teachers: gasData.teachers && gasData.teachers.length > 0 ? gasData.teachers : prev.teachers,
                  students: gasData.students && gasData.students.length > 0 ? gasData.students : prev.students,
                  admins: gasData.admins && gasData.admins.length > 0 ? gasData.admins : prev.admins,
                };
                safeSaveConfigToLocalStorage(STORAGE_KEY, updated);
                setItemIDB(STORAGE_KEY, updated).catch(() => {});
                return updated;
              });

              if (queryGas) {
                showAlert(`Tautan Google Spreadsheet Terdeteksi! Berhasil memuat ${gasData.teachers.length} Akun Guru ke perangkat ini.`);
              }
            }
          })
          .catch((err) => {
            console.warn('Gagal background auto-sync dari Google Apps Script:', err);
          });
      }
    }
  }, []);

  // Student Session State
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    name: 'Ahmad Fauzi',
    noPeserta: '1001 (XII IPS 1)',
    mapel: 'Sosiologi (Assessment TKA 2026)',
  });

  // Active Test Session State
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [raguList, setRaguList] = useState<boolean[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
  const [warnings, setWarnings] = useState<number>(0);
  const currentTeacherConfig = studentInfo.kodeGuru ? config.teacherConfigs?.[studentInfo.kodeGuru] : undefined;
  const currentExamSchedule = currentTeacherConfig?.examSchedule ?? config.examSchedule;
  const rawMax = currentExamSchedule?.maxCheatingAllowed ?? config.examSchedule?.maxCheatingAllowed;
  const parsedMax = Number(rawMax);
  const maxWarnings = !isNaN(parsedMax) && parsedMax > 0 ? Math.round(parsedMax) : 3;

  const [cheatingLogs, setCheatingLogs] = useState<CheatingLog[]>([]);

  // Refs to prevent race conditions and duplicate trigger cascades
  const isWarningModalOpenRef = useRef(false);
  const lastViolationTimeRef = useRef(0);
  const warningsRef = useRef(0);
  const isAutoSubmittingRef = useRef(false);
  const maxWarningsRef = useRef(maxWarnings);

  useEffect(() => {
    warningsRef.current = warnings;
  }, [warnings]);

  useEffect(() => {
    maxWarningsRef.current = maxWarnings;
  }, [maxWarnings]);
  const [ipAddress, setIpAddress] = useState<string>('180.252.12.11');
  const [deviceInfo, setDeviceInfo] = useState<string>('Browser Client (Desktop)');

  // Auto detect IP and Device Info
  useEffect(() => {
    try {
      const ua = navigator.userAgent;
      let platform = 'PC / Desktop';
      if (/Android/i.test(ua)) platform = 'Android Mobile';
      else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iOS Mobile';
      else if (/Mac/i.test(ua)) platform = 'MacOS';
      else if (/Linux/i.test(ua)) platform = 'Linux';
      
      const res = `${window.screen.width}x${window.screen.height}`;
      setDeviceInfo(`${platform} (${res})`);

      fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => {
          if (data?.ip) setIpAddress(data.ip);
        })
        .catch(() => setIpAddress('180.252.12.11 (Local)'));
    } catch (e) {}
  }, []);

  // Active Exam Session Recovery & Autosave Helpers
  const getSavedActiveSession = useCallback(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.activeQuestions) && parsed.activeQuestions.length > 0) {
        let remaining = parsed.timeRemaining;
        if (parsed.endTimeTimestamp) {
          remaining = Math.max(0, Math.floor((parsed.endTimeTimestamp - Date.now()) / 1000));
        }
        return {
          ...parsed,
          timeRemaining: remaining,
        };
      }
    } catch (e) {
      console.error('Failed to load active exam session:', e);
    }
    return null;
  }, []);

  const clearActiveExamSession = useCallback(() => {
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch (e) {}
  }, []);

  // Autosave active exam session continuously in test view
  useEffect(() => {
    if (viewState !== 'test' || activeQuestions.length === 0) return;

    try {
      const sessionData = {
        studentInfo,
        activeQuestions,
        currentIndex,
        userAnswers,
        raguList,
        timeRemaining,
        endTimeTimestamp: Date.now() + (timeRemaining * 1000),
        warnings,
        cheatingLogs,
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionData));
      } catch (err) {
        // Fallback for autosave: strip question image data URLs to fit quota
        const lightQuestions = activeQuestions.map((q) => {
          const { image, images, explanationImage, explanationImages, ...restQ } = q;
          return restQ;
        });
        const lightSession = { ...sessionData, activeQuestions: lightQuestions };
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(lightSession));
      }
    } catch (e) {
      console.warn('Autosave exam session failed:', e);
    }
  }, [viewState, activeQuestions, currentIndex, userAnswers, raguList, timeRemaining, warnings, cheatingLogs, studentInfo]);

  // Modals & Popups State
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [activeBroadcastAlert, setActiveBroadcastAlert] = useState<BroadcastAlert | null>(null);
  const lastBroadcastAlertIdRef = useRef<string | null>(null);

  // Admin Question Modal State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Score Results
  const [finalScore, setFinalScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [lastStudentResult, setLastStudentResult] = useState<StudentResult | null>(null);

  // Helper Alert / Confirm
  const showAlert = (msg: string) => {
    setAlertMsg(msg);
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger = false
  ) => {
    setConfirmData({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmData((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      isDanger,
    });
  };

  // Fisher-Yates Shuffle
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Start CBT Test Initialization
  const handleStartTest = async () => {
    const maxAttempts = config.maxAttempts || 1;
    const studentAttemptsCount = studentResults.filter(
      (r) => r.studentInfo.noPeserta.toLowerCase() === studentInfo.noPeserta.toLowerCase() ||
             r.studentInfo.name.toLowerCase() === studentInfo.name.toLowerCase()
    ).length;

    if (studentAttemptsCount >= maxAttempts) {
      showConfirm(
        'Batas Maksimal Ujian Tercapai',
        `Anda telah menyelesaikan ujian ini sebanyak ${studentAttemptsCount} kali (Batas maksimal: ${maxAttempts}x). Anda tidak dapat mengerjakan ujian ini lagi. Ingin kembali ke menu portal?`,
        () => {
          setViewState('login');
        },
        false
      );
      return;
    }

    // Check for existing saved session for autosave restoration
    const savedSession = getSavedActiveSession();
    if (
      savedSession &&
      savedSession.timeRemaining > 0 &&
      (savedSession.studentInfo?.noPeserta?.toLowerCase() === studentInfo.noPeserta?.toLowerCase() ||
       savedSession.studentInfo?.name?.toLowerCase() === studentInfo.name?.toLowerCase())
    ) {
      setActiveQuestions(savedSession.activeQuestions);
      setUserAnswers(savedSession.userAnswers);
      setRaguList(savedSession.raguList || new Array(savedSession.activeQuestions.length).fill(false));
      setCurrentIndex(savedSession.currentIndex || 0);
      setTimeRemaining(savedSession.timeRemaining);
      setWarnings(savedSession.warnings || 0);
      setCheatingLogs(savedSession.cheatingLogs || []);
      setViewState('test');
      return;
    }

    // If config.questions is empty on student device, try on-demand fetch from Firebase & IndexedDB
    let currentQuestions = [...(config.questions || [])];
    if (currentQuestions.length === 0) {
      try {
        const remoteConfig = await loadConfigFromFirebase();
        if (remoteConfig && Array.isArray(remoteConfig.questions) && remoteConfig.questions.length > 0) {
          const cleaned = remoteConfig.questions.filter((q) => !isLegacyDefaultQuestion(q));
          if (cleaned.length > 0) {
            currentQuestions = cleaned;
            setConfig((prev) => ({ ...prev, questions: cleaned }));
            safeSaveConfigToLocalStorage(STORAGE_KEY, { ...config, questions: cleaned });
            setItemIDB(STORAGE_KEY, { ...config, questions: cleaned }).catch(() => {});
          }
        }
      } catch (e) {}
    }

    if (currentQuestions.length === 0) {
      try {
        const idbConfig = await getItemIDB<AppConfig>(STORAGE_KEY);
        if (idbConfig && Array.isArray(idbConfig.questions) && idbConfig.questions.length > 0) {
          currentQuestions = idbConfig.questions;
          setConfig((prev) => ({ ...prev, questions: idbConfig.questions }));
        }
      } catch (e) {}
    }

    // Identify matching package schedule token
    const matchedToken = config.scheduleTokens?.find((s) => 
      (studentInfo.kodeSoal && s.kodePaket && s.kodePaket.toUpperCase() === studentInfo.kodeSoal.toUpperCase()) ||
      (s.token && s.token.toUpperCase() === config.examToken?.toUpperCase()) ||
      (studentInfo.mapel && s.mapel && studentInfo.mapel.toLowerCase().includes(s.paketSoal?.toLowerCase() || ''))
    );

    // Filter active questions scoped to the student's assigned teacher/subject
    let activePool = currentQuestions.filter((q) => {
      if (q.isActive === false) return false;
      if (studentInfo.kodeGuru && q.kodeGuru) {
        if (q.kodeGuru.toUpperCase() !== studentInfo.kodeGuru.toUpperCase()) {
          return false;
        }
      }
      return true;
    });

    // If matching package schedule specifies explicit question IDs or package variations
    if (matchedToken?.soalIds && matchedToken.soalIds.length > 0) {
      const packageScoped = activePool.filter((q) => matchedToken.soalIds?.includes(q.id));
      if (packageScoped.length > 0) {
        activePool = packageScoped;
      }
    } else if (matchedToken?.kodePaket?.includes('-B') || matchedToken?.paketSoal?.toLowerCase().includes('paket b')) {
      const ganjil = activePool.filter((_, idx) => idx % 2 === 1);
      if (ganjil.length > 0) activePool = ganjil;
    } else if (matchedToken?.kodePaket?.includes('-C') || matchedToken?.paketSoal?.toLowerCase().includes('paket c')) {
      const genap = activePool.filter((_, idx) => idx % 2 === 0);
      if (genap.length > 0) activePool = genap;
    }

    // Fallback 1: Jika filter kodeGuru menghasilkan 0 soal, gunakan seluruh soal aktif yang ada di Bank Soal
    if (activePool.length === 0) {
      activePool = currentQuestions.filter((q) => q.isActive !== false);
    }

    // Fallback 2: Jika status isActive belum diset, gunakan seluruh bank soal yang ada
    if (activePool.length === 0 && currentQuestions.length > 0) {
      activePool = [...currentQuestions];
    }

    // Fallback 3: Jika bank soal kosong di perangkat, gunakan defaultQuestions sebagai cadangan
    if (activePool.length === 0 && defaultQuestions && defaultQuestions.length > 0) {
      activePool = defaultQuestions.filter((q) => q.isActive !== false);
    }

    if (activePool.length === 0) {
      showAlert('Tidak ada soal yang aktif di Bank Soal! Silakan hubungi Guru Pengawas atau aktifkan soal di Panel Guru.');
      return;
    }

    // Attempt Fullscreen
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {
        console.warn('Fullscreen request fell through, proceeding with CBT.');
      });
    }

    // Teacher Config Override for assigned teacher
    const teacherConfig = studentInfo.kodeGuru ? config.teacherConfigs?.[studentInfo.kodeGuru] : undefined;
    const effectiveDuration = teacherConfig?.duration ?? config.duration;
    const effectiveRandomizeQuestions = teacherConfig?.randomizeQuestions ?? config.randomizeQuestions;
    const effectiveRandomizeOptions = teacherConfig?.randomizeOptions ?? config.randomizeOptions;
    const effectiveMaxQuestionsToDisplay = teacherConfig?.maxQuestionsToDisplay ?? config.maxQuestionsToDisplay;
    const effectiveExamSchedule = teacherConfig?.examSchedule ?? config.examSchedule;

    // 1. Prepare active questions pool
    let pool = [...activePool];

    // 2. Randomize questions order if enabled (default true)
    if (effectiveRandomizeQuestions !== false) {
      pool = shuffleArray<Question>(pool);
    }

    // 3. Limit total questions displayed if maxQuestionsToDisplay > 0
    const maxQ = Number(effectiveMaxQuestionsToDisplay || 0);
    if (maxQ > 0 && maxQ < pool.length) {
      pool = pool.slice(0, maxQ);
    }

    // 4. Randomize options for each question if enabled (default true)
    const preparedQuestions: Question[] = pool.map((q: Question) => {
      let opts = [...q.options];
      if (effectiveRandomizeOptions !== false) {
        opts = shuffleArray<Option>(opts);
      }
      const labels = ['A', 'B', 'C', 'D', 'E'];
      const mappedOpts: Option[] = opts.map((opt: Option, i: number) => ({
        id: labels[i],
        text: opt.text,
        isCorrect: opt.isCorrect,
        image: opt.image,
      }));
      return {
        ...q,
        options: mappedOpts,
      };
    });

    setActiveQuestions(preparedQuestions);
    setUserAnswers(new Array(preparedQuestions.length).fill(null));
    setRaguList(new Array(preparedQuestions.length).fill(false));
    setCurrentIndex(0);
    setTimeRemaining(effectiveDuration * 60);
    setWarnings(0);
    setCheatingLogs([]);
    setViewState('test');
  };

  // Timer Countdown Effect & Schedule End Time Check (Point 1 - Opsi C)
  useEffect(() => {
    if (viewState !== 'test') return;

    const teacherConfig = studentInfo.kodeGuru ? config.teacherConfigs?.[studentInfo.kodeGuru] : undefined;
    const effectiveExamSchedule = teacherConfig?.examSchedule ?? config.examSchedule;

    const timer = setInterval(() => {
      // Check if schedule end time is reached
      if (effectiveExamSchedule?.endTime) {
        const endTimeMs = new Date(effectiveExamSchedule.endTime).getTime();
        if (!isNaN(endTimeMs) && Date.now() >= endTimeMs) {
          clearInterval(timer);
          triggerAutoSubmit('⏰ Jam Jadwal Selesai Ujian telah berakhir (Sesuai Batas Waktu Ujian). Seluruh jawaban Anda otomatis dikirim.');
          return;
        }
      }

      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerAutoSubmit('⏰ Waktu Pengerjaan Ujian telah habis! Seluruh jawaban Anda otomatis tersimpan.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [viewState, config.examSchedule?.endTime]);

  // Real-time Exam Session Control (Point 1 - Opsi A) & Broadcast Warning Listener (Point 2)
  useEffect(() => {
    if (viewState !== 'test') return;

    // 1. Force Stop Check: Check if sessionStatus is CLOSED or FORCE_STOPPED by Proktor
    const teacherConfig = studentInfo.kodeGuru ? config.teacherConfigs?.[studentInfo.kodeGuru] : undefined;
    const effectiveExamSchedule = teacherConfig?.examSchedule ?? config.examSchedule;
    const status = effectiveExamSchedule?.sessionStatus;
    if (status === 'CLOSED' || status === 'FORCE_STOPPED') {
      triggerAutoSubmit('🚨 UJIAN TELAH DIHENTIKAN OLEH PROKTOR / ADMIN! Seluruh jawaban Anda telah tersimpan secara otomatis.');
      return;
    }

    // 2. Individual Student Deactivation Check
    if (studentInfo?.noPeserta && Array.isArray(config.students)) {
      const studentRec = config.students.find(
        (s) => s.nis.toLowerCase() === studentInfo.noPeserta.toLowerCase() || s.id === studentInfo.noPeserta
      );
      if (studentRec && studentRec.isActive === false) {
        triggerAutoSubmit('🚨 Akses Ujian Anda telah dinonaktifkan/diberhentikan oleh Pengawas Ujian.');
        return;
      }
    }

    // 3. Broadcast Proktor Alert Message Listener (Point 2)
    if (config.broadcastAlert && config.broadcastAlert.id !== lastBroadcastAlertIdRef.current) {
      const alertData = config.broadcastAlert;
      const targetNis = alertData.targetStudentNis?.trim();

      const isApplicable =
        !targetNis ||
        targetNis === 'ALL' ||
        targetNis.toLowerCase() === studentInfo.noPeserta.toLowerCase();

      if (isApplicable) {
        lastBroadcastAlertIdRef.current = alertData.id;
        playWarningSound();
        setActiveBroadcastAlert(alertData);
      }
    }
  }, [config, viewState, studentInfo.noPeserta]);

  // Security & Anti-Cheat Handlers (Mobile & Desktop Compatible)
  const playWarningSound = useCallback(() => {
    playWarningAlarm(config.customWarningAudioUrl, config.enableWarningAudio !== false);
  }, [config.enableWarningAudio, config.customWarningAudioUrl]);

  const handleTriggerWarning = useCallback(
    (customMsg?: string) => {
      if (viewState !== 'test' || isAutoSubmittingRef.current) return;

      const now = Date.now();
      // Debounce & Lock: ignore duplicate trigger cascades during open modal or within 2.5s cooldown
      if (isWarningModalOpenRef.current || now - lastViolationTimeRef.current < 2500) {
        return;
      }
      lastViolationTimeRef.current = now;

      clearClipboard();
      playWarningSound();

      const logMsg = customMsg || 'Sistem mendeteksi Anda meninggalkan layar ujian, mengecilkan jendela, atau membagi layar.';

      setCheatingLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString('id-ID'),
          type: logMsg,
          details: logMsg,
        },
      ]);

      const currentCount = warningsRef.current;
      const nextWarnings = currentCount + 1;
      setWarnings(nextWarnings);
      warningsRef.current = nextWarnings;

      const limit = maxWarningsRef.current;

      // Only finish the exam when maximum violations provided are reached or exceeded
      if (nextWarnings >= limit) {
        isWarningModalOpenRef.current = false;
        setIsWarningModalOpen(false);
        triggerAutoSubmit(
          `Anda telah mencapai batas maksimal peringatan keamanan (${limit} dari ${limit} kali). Sesuai ketentuan, ujian Anda telah selesai dan seluruh jawaban tersimpan secara otomatis.`
        );
      } else {
        // Do NOT finish the exam! Show warning modal and allow continuing
        isWarningModalOpenRef.current = true;
        setWarningMsg(logMsg);
        setIsWarningModalOpen(true);
      }
    },
    [viewState, playWarningSound]
  );

  const triggerAutoSubmit = (msg: string) => {
    if (isAutoSubmittingRef.current) return;
    isAutoSubmittingRef.current = true;
    isWarningModalOpenRef.current = false;
    setIsWarningModalOpen(false);
    showAlert(msg);
    exitAppFullscreen().catch(() => {});
    setTimeout(() => {
      setAlertMsg(null);
      processSubmission();
      isAutoSubmittingRef.current = false;
    }, 2500);
  };

  useEffect(() => {
    if (viewState !== 'test') return;

    let splitScreenDebounceTimer: any = null;

    // 1. Detect Minimize / Tab Switching / Backgrounding
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        handleTriggerWarning('🚨 Sistem mendeteksi Anda mengecilkan aplikasi (Minimize) atau berpindah tab/layar!');
      }
    };

    // 2. Detect Loss of Window Focus
    const handleBlur = () => {
      setTimeout(() => {
        if (!document.hasFocus() && viewState === 'test') {
          handleTriggerWarning('🚨 Jendela Ujian kehilangan fokus (Membuka aplikasi lain atau klik di luar layar)!');
        }
      }, 250);
    };

    // 3. Detect Fullscreen Exit
    const handleFullscreenChange = () => {
      if (!isAppFullscreen() && viewState === 'test') {
        handleTriggerWarning('🚨 Anda keluar dari Mode Layar Penuh (Fullscreen)! Ujian mewajibkan tampilan layar penuh.');
      }
    };

    // 4. Detect Split-Screen / Window Resizing to Split Ratio
    const handleResize = () => {
      if (splitScreenDebounceTimer) clearTimeout(splitScreenDebounceTimer);
      splitScreenDebounceTimer = setTimeout(() => {
        if (viewState !== 'test') return;
        const splitCheck = checkSplitScreenViolation();
        if (splitCheck.isSplit) {
          handleTriggerWarning(`🚫 Terdeteksi Split Screen / Layar Terbelah: ${splitCheck.reason}`);
        }
      }, 400);
    };

    // 5. Intercept Dangerous Shortcuts (DevTools, Screenshots, Copy/Paste, App Switching)
    const handleKeydown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c', 's'].includes(key)) ||
        (e.ctrlKey && ['u', 'c', 'v', 'x', 'a', 'p', 's', 'w', 't', 'n'].includes(key)) ||
        (e.metaKey && ['c', 'v', 'x', 'a', 'p', 's', 'w', 't', 'n'].includes(key)) ||
        (e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(key)) ||
        e.key === 'PrintScreen' ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
        clearClipboard();
        playWarningSound();
        handleTriggerWarning('🚨 Pintasan Keyboard Terlarang (Shortcut / Screenshot / DevTools) Diblokir!');
      }
    };

    // 6. Block Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      clearClipboard();
    };

    // 7. Detect Page Hide / Navigation Away
    const handlePageHide = () => {
      if (viewState === 'test') {
        handleTriggerWarning('🚨 Terdeteksi upaya menutup atau menyembunyikan halaman ujian!');
      }
    };

    // Periodic Check for Split Screen & Fullscreen Enforcement (Every 2 seconds)
    const intervalChecker = setInterval(() => {
      if (viewState !== 'test') return;
      const splitCheck = checkSplitScreenViolation();
      if (splitCheck.isSplit && !isWarningModalOpenRef.current) {
        handleTriggerWarning(`🚫 Split Screen Aktif: ${splitCheck.reason}`);
      }
    }, 2000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeydown, { capture: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      if (splitScreenDebounceTimer) clearTimeout(splitScreenDebounceTimer);
      clearInterval(intervalChecker);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeydown, { capture: true });
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [viewState, handleTriggerWarning, playWarningSound]);

  // Handle Question Answer Selection
  const handleAnswerOption = (optId: string) => {
    setUserAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = optId;
      return updated;
    });
  };

  const handleToggleRagu = (isRagu: boolean) => {
    setRaguList((prev) => {
      const updated = [...prev];
      updated[currentIndex] = isRagu;
      return updated;
    });
  };

  const handleScreenRecordDetected = (reason: string) => {
    handleTriggerWarning(`🚨 Percobaan Tangkapan Layar / Perekaman Layar Terdeteksi (${reason})`);
  };

  // Submit Exam & Save Encrypted Student Result
  const handleFinishExamRequest = () => {
    processSubmission();
  };

  const processSubmission = (autoDownload = false, customReason = '') => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    let totalEarnedPoints = 0;
    let totalMaxPoints = 0;
    let correctRatioSum = 0;

    activeQuestions.forEach((q, idx) => {
      const qPoin = typeof q.poin === 'number' && q.poin > 0 ? q.poin : 10;
      totalMaxPoints += qPoin;

      const userAns = userAnswers[idx];
      const evalRes = getQuestionScoreAndCorrectness(q, userAns);

      totalEarnedPoints += evalRes.earnedPoints;
      correctRatioSum += evalRes.correctRatio;
    });

    const total = activeQuestions.length;
    const score =
      totalMaxPoints > 0
        ? Math.min(100, Math.round((totalEarnedPoints / totalMaxPoints) * 100))
        : total > 0
        ? Math.round((correctRatioSum / total) * 100)
        : 0;
    const correct = Math.round(correctRatioSum);
    const incorrect = Math.max(0, total - correct);
    const isPassed = score >= config.kkm;
    const timeSpent = (config.duration * 60) - timeRemaining;
    const durationMins = Math.max(1, Math.round(timeSpent / 60));

    let updatedLogs = [...cheatingLogs];
    if (customReason) {
      updatedLogs.push({
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type: `AUTO-SUBMIT (Perekaman Layar): ${customReason}`,
        details: customReason,
      });
    }

    const resultObj: StudentResult = {
      id: `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentInfo,
      score,
      correctCount: correct,
      incorrectCount: incorrect,
      totalQuestions: total,
      kkm: config.kkm,
      isPassed,
      answers: userAnswers,
      warnings: warnings + (customReason ? 1 : 0),
      submittedAt: new Date().toLocaleString('id-ID'),
      durationSpentMinutes: durationMins,
      timeSpentSeconds: timeSpent,
      questionSnapshots: activeQuestions,
      cheatingLogs: updatedLogs,
      ipAddress,
      deviceInfo,
    };

    setFinalScore(score);
    setCorrectCount(correct);
    setIncorrectCount(incorrect);
    setLastStudentResult(resultObj);

    // Save to local & Firebase student results rekap list
    const updatedResults = [resultObj, ...studentResults.filter((r) => r.studentInfo.noPeserta !== studentInfo.noPeserta)];
    saveStudentResults(updatedResults);
    saveStudentResultToFirebase(resultObj).catch(() => {});

    // Clear autosave session upon successful exam finish
    clearActiveExamSession();

    setViewState('result');

    if (autoDownload) {
      setTimeout(() => {
        try {
          const encryptedData = encryptResult(resultObj);
          const blob = new Blob([encryptedData], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const cleanName = studentInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
          link.href = url;
          link.download = `HASIL_CBT_${studentInfo.noPeserta}_${cleanName}.cbt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error(e);
        }
      }, 300);
    }
  };

  // Download Encrypted .cbt File
  const handleDownloadEncryptedResult = () => {
    if (!lastStudentResult) {
      showAlert('Gagal mengunduh! Hasil ujian tidak ditemukan.');
      return;
    }

    try {
      const encryptedData = encryptResult(lastStudentResult);
      const blob = new Blob([encryptedData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanName = studentInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
      link.href = url;
      link.download = `HASIL_CBT_${studentInfo.noPeserta}_${cleanName}.cbt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showAlert('File jawaban terenkripsi (.cbt) berhasil diunduh! Silakan kirimkan file ini ke Guru.');
    } catch (e) {
      console.error(e);
      showAlert('Gagal mengenkripsi hasil jawaban.');
    }
  };

  // Question Editor Handlers (Admin)
  const handleSaveQuestion = (qData: {
    question: string;
    options: Option[];
    explanation: string;
    explanationImage?: string;
    explanationImages?: string[];
    image?: string;
    images?: string[];
    imagePosition?: 'top' | 'middle' | 'bottom';
    mapel?: string;
    kompetensi?: string;
    subTopik?: string;
    bentukSoal?: string;
    kodeGuru?: string;
    poin?: number;
    categoryOptions?: string[];
    categoryStatements?: any[];
    id?: number;
  }) => {
    let updatedQuestions = [...config.questions];
    const activeKodeGuru = loggedInTeacher?.kodeGuru || config.kodeGuru || 'GURU01';

    if (qData.id) {
      // Edit existing
      const idx = updatedQuestions.findIndex((q) => q.id === qData.id);
      if (idx !== -1) {
        updatedQuestions[idx] = {
          ...updatedQuestions[idx],
          question: qData.question,
          options: qData.options,
          explanation: qData.explanation,
          explanationImage: qData.explanationImage,
          explanationImages: qData.explanationImages,
          image: qData.image,
          images: qData.images,
          imagePosition: qData.imagePosition,
          mapel: qData.mapel || updatedQuestions[idx].mapel || config.mapel || 'Sosiologi',
          kompetensi: qData.kompetensi || qData.subTopik,
          subTopik: qData.subTopik || qData.kompetensi,
          bentukSoal: qData.bentukSoal || updatedQuestions[idx].bentukSoal || 'Pilihan Ganda',
          kodeGuru: qData.kodeGuru || updatedQuestions[idx].kodeGuru || activeKodeGuru,
          categoryOptions: qData.categoryOptions,
          categoryStatements: qData.categoryStatements,
          poin: typeof qData.poin === 'number' && qData.poin > 0 ? qData.poin : updatedQuestions[idx].poin || 10,
        };
      }
    } else {
      // Create new
      const maxId = updatedQuestions.reduce((max, q) => Math.max(max, q.id), 0);
      updatedQuestions.push({
        id: maxId + 1,
        question: qData.question,
        options: qData.options,
        explanation: qData.explanation,
        explanationImage: qData.explanationImage,
        explanationImages: qData.explanationImages,
        image: qData.image,
        images: qData.images,
        imagePosition: qData.imagePosition,
        mapel: qData.mapel || config.mapel || 'Sosiologi',
        kompetensi: qData.kompetensi || qData.subTopik,
        subTopik: qData.subTopik || qData.kompetensi,
        bentukSoal: qData.bentukSoal || 'Pilihan Ganda',
        kodeGuru: qData.kodeGuru || activeKodeGuru,
        categoryOptions: qData.categoryOptions,
        categoryStatements: qData.categoryStatements,
        poin: typeof qData.poin === 'number' && qData.poin > 0 ? qData.poin : 10,
        isActive: true,
      });
    }

    saveConfig({ ...config, questions: updatedQuestions });
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
    showAlert('Soal berhasil disimpan!');
  };

  const handleDeleteQuestion = (qId: number) => {
    const updated = config.questions.filter((q) => q.id !== qId);
    saveConfig({ ...config, questions: updated });
    showAlert('Soal berhasil dihapus.');
  };

  const handleResetDefaultQuestions = () => {
    saveConfig({ ...config, questions: [] });
    showAlert('Bank soal berhasil dikosongkan.');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-gray-800 select-none">
      {/* View Switcher */}
      {viewState === 'login' && (
        <LoginView
          config={config}
          studentResults={studentResults}
          onSaveConfig={saveConfig}
          showAlert={showAlert}
          onStudentLoginSuccess={(info) => {
            setStudentInfo(info);
            setViewState('pre-test');
          }}
          onAdminLoginSuccess={(role, teacherDetails) => {
            setAdminRole(role);
            setLoggedInTeacher(teacherDetails || null);
            setViewState('admin');
          }}
        />
      )}

      {viewState === 'admin' && (
        <AdminPanel
          config={config}
          studentResults={studentResults}
          adminRole={adminRole}
          loggedInTeacher={loggedInTeacher}
          onSaveConfig={saveConfig}
          onSaveStudentResults={saveStudentResults}
          onOpenQuestionModal={(q) => {
            setEditingQuestion(q);
            setIsQuestionModalOpen(true);
          }}
          onDeleteQuestion={handleDeleteQuestion}
          onResetDefaultQuestions={handleResetDefaultQuestions}
          onLogout={() => {
            setLoggedInTeacher(null);
            setViewState('login');
          }}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      )}

      {viewState === 'pre-test' && (() => {
        const savedActiveSession = getSavedActiveSession();
        const hasSavedSession = Boolean(
          savedActiveSession &&
          savedActiveSession.timeRemaining > 0 &&
          (savedActiveSession.studentInfo?.noPeserta?.toLowerCase() === studentInfo.noPeserta?.toLowerCase() ||
           savedActiveSession.studentInfo?.name?.toLowerCase() === studentInfo.name?.toLowerCase())
        );

        return (
          <PreTestView
            config={config}
            studentInfo={studentInfo}
            studentAttemptsCount={studentResults.filter(
              (r) => r.studentInfo.noPeserta.toLowerCase() === studentInfo.noPeserta.toLowerCase() ||
                     r.studentInfo.name.toLowerCase() === studentInfo.name.toLowerCase()
            ).length}
            maxAttempts={config.maxAttempts || 1}
            hasSavedSession={hasSavedSession}
            onStartTest={handleStartTest}
            onBackToPortal={() => setViewState('login')}
          />
        );
      })()}

      {viewState === 'test' && (
        <TestView
          questions={activeQuestions}
          currentIndex={currentIndex}
          answers={userAnswers}
          raguList={raguList}
          timeRemaining={timeRemaining}
          mapel={config.mapel}
          mapelTitle={config.mapelTitle}
          subTitle={config.subTitle}
          studentName={studentInfo.name}
          noPeserta={studentInfo.noPeserta}
          warnings={warnings}
          maxWarnings={maxWarnings}
          broadcastAlert={activeBroadcastAlert}
          onDismissBroadcastAlert={() => setActiveBroadcastAlert(null)}
          onAnswer={handleAnswerOption}
          onToggleRagu={handleToggleRagu}
          onSelectQuestion={(idx) => setCurrentIndex(idx)}
          onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
          onFinish={handleFinishExamRequest}
          onScreenRecordDetected={handleScreenRecordDetected}
          onBackToPortal={() => setViewState('login')}
        />
      )}

      {viewState === 'result' && (
        <ResultView
          score={finalScore}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          kkm={config.kkm}
          studentName={studentInfo.name}
          noPeserta={studentInfo.noPeserta}
          driveUploadUrl={config.driveUploadUrl}
          onDownloadEncryptedResult={handleDownloadEncryptedResult}
          onViewDiscussion={() => setViewState('review')}
          onRestart={() => setViewState('login')}
        />
      )}

      {viewState === 'review' && (
        <ReviewView
          questions={activeQuestions}
          answers={userAnswers}
          onExit={() => setViewState('login')}
        />
      )}

      {/* Global Modals */}
      <WarningModal
        isOpen={isWarningModalOpen}
        warningCount={warnings}
        maxWarnings={maxWarnings}
        customMsg={warningMsg}
        onUnderstand={() => {
          isWarningModalOpenRef.current = false;
          setIsWarningModalOpen(false);
          // Grace period of 2 seconds so re-focusing and entering fullscreen does not immediately re-trigger a violation
          lastViolationTimeRef.current = Date.now() + 2000;
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }}
      />

      <ConfirmModal
        isOpen={confirmData.isOpen}
        title={confirmData.title}
        message={confirmData.message}
        isDanger={confirmData.isDanger}
        onConfirm={confirmData.onConfirm}
        onCancel={() => setConfirmData((prev) => ({ ...prev, isOpen: false }))}
      />

      <AlertModal
        isOpen={alertMsg !== null}
        message={alertMsg || ''}
        onClose={() => {
          setAlertMsg(null);
          if (isAutoSubmittingRef.current) {
            processSubmission();
            isAutoSubmittingRef.current = false;
          }
        }}
      />

      <QuestionEditorModal
        isOpen={isQuestionModalOpen}
        editingQuestion={editingQuestion}
        mapelList={config.mapelList}
        defaultMapel={loggedInTeacher?.mapel || config.mapel}
        defaultKodeGuru={loggedInTeacher?.kodeGuru || config.kodeGuru || 'GURU01'}
        onSave={handleSaveQuestion}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        showAlert={showAlert}
      />
    </div>
  );
}
