import React, { useState } from 'react';
import {
  Key,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  Copy,
  Check,
  RefreshCw,
  Download,
  Printer,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileJson,
  Layers,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  Search,
  Filter,
  Users,
  User,
  BookOpen,
  ArrowRight,
  Radio,
  ExternalLink,
  GraduationCap,
  Award,
  Sliders,
  Eye,
  X,
} from 'lucide-react';
import { AppConfig, ExamScheduleToken, Question } from '../types';
import { exportOfflineAppHtml } from '../utils/offlineExport';
import { openQuestionPrintWindow, exportQuestionsToWord } from '../utils/questionExport';

interface ExamTokenSchedulePanelProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  showAlert?: (msg: string) => void;
}

export const ExamTokenSchedulePanel: React.FC<ExamTokenSchedulePanelProps> = ({
  config,
  onSaveConfig,
  showAlert,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'STANDBY' | 'CLOSED'>('ALL');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<ExamScheduleToken | null>(null);

  // Modal State for Berita Acara & Attendance Print
  const [showBeritaAcaraModal, setShowBeritaAcaraModal] = useState(false);
  const [selectedSesiId, setSelectedSesiId] = useState<string>('ALL');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('ALL');
  const [ruangUjianInput, setRuangUjianInput] = useState<string>('Ruang 01 (Lab Komputer A)');
  const [pengawas1Input, setPengawas1Input] = useState<string>('Drs. Supriyadi, M.Pd');
  const [pengawas2Input, setPengawas2Input] = useState<string>('Siti Nurhaliza, S.Pd');
  const [catatanKejadian, setCatatanKejadian] = useState<string>('Pelaksanaan ujian berlangsung dengan tertib, aman, dan lancar. Seluruh sistem CBT berjalan optimal.');
  const [includeDaftarHadir, setIncludeDaftarHadir] = useState<boolean>(true);
  const [includeKartuToken, setIncludeKartuToken] = useState<boolean>(true);
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [targetRowsPerClass, setTargetRowsPerClass] = useState<number>(36);
  const [selectedPaperSize, setSelectedPaperSize] = useState<'a4' | 'f4' | 'letter' | 'legal'>('a4');
  const [showDigitalSignatures, setShowDigitalSignatures] = useState<boolean>(true);

  // Form State
  const [formNamaSesi, setFormNamaSesi] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formJamMulai, setFormJamMulai] = useState('08:00');
  const [formJamSelesai, setFormJamSelesai] = useState('09:30');
  const [formDurasi, setFormDurasi] = useState<number>(60);
  const [formKkm, setFormKkm] = useState<number>(75);
  const [formMapel, setFormMapel] = useState('Sosiologi');
  const [formKodeGuru, setFormKodeGuru] = useState('GURU01');
  const [formTargetKelas, setFormTargetKelas] = useState('');
  const [formPaketSoal, setFormPaketSoal] = useState('Paket A (Utama)');
  const [formKodePaket, setFormKodePaket] = useState('PKT-SOS-A');
  const [formToken, setFormToken] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'STANDBY' | 'CLOSED'>('ACTIVE');
  const [formKeterangan, setFormKeterangan] = useState('');

  // Print Slip Modal
  const [printTokenModalData, setPrintTokenModalData] = useState<ExamScheduleToken | null>(null);

  const scheduleList: ExamScheduleToken[] = config.scheduleTokens || [];

  // Teachers List Resolution
  const teachersList = config.teachers && config.teachers.length > 0 ? config.teachers : [
    { id: 't1', nip: '198501152010011002', nama: 'Drs. Aji Sosiologi, M.Pd', mapel: 'Sosiologi', kodeGuru: 'GURU01' },
    { id: 't2', nip: '198803122012022001', nama: 'Dra. Rini Wulandari, M.Si', mapel: 'Geografi', kodeGuru: 'GURU02' },
    { id: 't3', nip: '199005202015031003', nama: 'Budi Santoso, S.Pd', mapel: 'Ekonomi', kodeGuru: 'GURU03' },
  ];

  // Helper: Get Teacher metadata for specific package schedule
  const getTeacherForPackage = (item: ExamScheduleToken) => {
    const effectiveKg = (item.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();
    const found = teachersList.find(
      (t) => (t.kodeGuru || t.nip).toUpperCase() === effectiveKg
    );
    return {
      kodeGuru: effectiveKg,
      nama: found?.nama || config.kopSekolah?.namaGuru || 'Guru Pengampu',
      nip: found?.nip || config.kopSekolah?.nipGuru || '-',
      mapel: found?.mapel || item.mapel || config.mapel || 'Sosiologi',
    };
  };

  // Helper: Generate Random 6-char Alphanumeric Token
  const generateRandomTokenStr = (prefix = ''): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    const length = prefix ? 6 - prefix.length : 6;
    for (let i = 0; i < Math.max(3, length); i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return (prefix + res).toUpperCase();
  };

  // Helper: Copy Token to Clipboard
  const handleCopy = (tokenId: string, tokenStr: string) => {
    navigator.clipboard.writeText(tokenStr);
    setCopiedTokenId(tokenId);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  // Helper: Filter Questions for a specific package
  const getQuestionsForPackage = (item: ExamScheduleToken): Question[] => {
    const allQuestions = config.questions || [];
    const itemKodeGuru = (item.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();

    // Prioritize questions mapped to this specific teacher if multi-guru exists
    const teacherQuestions = allQuestions.filter(
      (q) => !q.kodeGuru || q.kodeGuru.toUpperCase() === itemKodeGuru
    );
    const baseQuestions = teacherQuestions.length > 0 ? teacherQuestions : allQuestions;
    let activeQuestions = baseQuestions.filter((q) => q.isActive !== false);
    if (activeQuestions.length === 0 && baseQuestions.length > 0) {
      activeQuestions = baseQuestions;
    }
    if (activeQuestions.length === 0 && allQuestions.length > 0) {
      activeQuestions = allQuestions;
    }

    if (item.soalIds && item.soalIds.length > 0) {
      const selected = activeQuestions.filter((q) => item.soalIds?.includes(q.id));
      if (selected.length > 0) return selected;
    }

    if (item.kodePaket.includes('-B') || item.paketSoal.toLowerCase().includes('paket b')) {
      // Paket B: Soal Index Ganjil
      const ganjil = activeQuestions.filter((_, idx) => idx % 2 === 1);
      return ganjil.length > 0 ? ganjil : activeQuestions;
    }

    if (item.kodePaket.includes('-C') || item.paketSoal.toLowerCase().includes('paket c')) {
      // Paket C: Soal Index Genap
      const genap = activeQuestions.filter((_, idx) => idx % 2 === 0);
      return genap.length > 0 ? genap : activeQuestions;
    }

    return activeQuestions;
  };

  // 1. Download Standalone HTML CBT Offline for specific package & token
  const handleDownloadOfflineCbt = (item: ExamScheduleToken) => {
    const packageQuestions = getQuestionsForPackage(item);
    if (packageQuestions.length === 0) {
      alert('Paket ini belum memiliki butir soal yang aktif!');
      return;
    }

    const teacher = getTeacherForPackage(item);
    const packageConfig: AppConfig = {
      ...config,
      mapel: item.mapel || teacher.mapel || config.mapel || 'Sosiologi',
      mapelTitle: `${item.mapel || teacher.mapel || 'Sosiologi'} - ${item.paketSoal} (${item.namaSesi})`,
      examToken: item.token,
      duration: item.durasiMenit || config.duration || 60,
      kkm: item.kkm || config.kkm || 75,
      kodeGuru: teacher.kodeGuru,
      questions: packageQuestions,
    };

    exportOfflineAppHtml(packageConfig);
    if (showAlert) {
      showAlert(`Aplikasi CBT Offline untuk ${item.paketSoal} (Token: ${item.token}) Berhasil Didownload!`);
    }
  };

  // 2. Download / Print PDF Naskah Soal for specific package
  const handleDownloadPdf = (item: ExamScheduleToken) => {
    const packageQuestions = getQuestionsForPackage(item);
    if (packageQuestions.length === 0) {
      alert('Paket ini belum memiliki butir soal!');
      return;
    }

    openQuestionPrintWindow(packageQuestions, {
      docType: 'SOAL_ONLY',
      title: `ASESMEN CBT - ${item.paketSoal.toUpperCase()}`,
      tahunPelajaran: '2025/2026',
      mapel: `${item.mapel || config.mapel || 'Sosiologi'} [${item.kodePaket}]`,
      kelas: item.targetKelas || 'Semua Kelas',
      alokasiWaktu: `${item.durasiMenit} Menit`,
      hariTanggal: item.tanggalUjian || new Date().toLocaleDateString('id-ID'),
      pageSize: 'A4',
      fontFamily: 'Times New Roman',
      fontSize: '11pt',
      showKop: true,
      showPetunjukUmum: true,
      showIdentitasSiswa: true,
      showSignature: true,
      showPembahasan: false,
      kopSekolah: config.kopSekolah,
    });
  };

  // 3. Download DOCX Word Naskah Soal for specific package
  const handleDownloadWord = (item: ExamScheduleToken) => {
    const packageQuestions = getQuestionsForPackage(item);
    if (packageQuestions.length === 0) {
      alert('Paket ini belum memiliki butir soal!');
      return;
    }

    exportQuestionsToWord(packageQuestions, {
      docType: 'SOAL_ONLY',
      title: `ASESMEN CBT - ${item.paketSoal.toUpperCase()}`,
      tahunPelajaran: '2025/2026',
      mapel: `${item.mapel || config.mapel || 'Sosiologi'} [${item.kodePaket}]`,
      kelas: item.targetKelas || 'Semua Kelas',
      alokasiWaktu: `${item.durasiMenit} Menit`,
      hariTanggal: item.tanggalUjian || new Date().toLocaleDateString('id-ID'),
      pageSize: 'A4',
      fontFamily: 'Times New Roman',
      fontSize: '11pt',
      showKop: true,
      showPetunjukUmum: true,
      showIdentitasSiswa: true,
      showSignature: true,
      showPembahasan: false,
      kopSekolah: config.kopSekolah,
    });
  };

  // 4. Download File Paket Ujian (.json) - Metode Utama Pengaturan & Sinkronisasi Ujian
  const handleDownloadJsonPackage = (item: ExamScheduleToken, customToken?: string) => {
    const packageQuestions = getQuestionsForPackage(item);
    if (packageQuestions.length === 0) {
      alert('Paket ini belum memiliki butir soal yang aktif!');
      return;
    }

    const currentToken = (customToken || item.token || 'SOS2026').trim().toUpperCase();
    const teacher = getTeacherForPackage(item);
    const mapelName = item.mapel || teacher.mapel || config.mapel || 'Sosiologi';

    const cleanKodePaket = (item.kodePaket || 'PKT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanMapel = mapelName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanKg = teacher.kodeGuru.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanToken = currentToken.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Standalone ready-to-run package config
    const packageConfig: AppConfig = {
      ...config,
      mapel: mapelName,
      mapelTitle: `${mapelName} - ${item.paketSoal} (${item.namaSesi})`,
      examToken: currentToken,
      duration: item.durasiMenit || config.duration || 60,
      kkm: item.kkm || config.kkm || 75,
      kodeGuru: teacher.kodeGuru,
      questions: packageQuestions,
      scheduleTokens: [
        {
          ...item,
          token: currentToken,
          isPrimaryActive: true,
          status: 'ACTIVE',
        },
      ],
    };

    const exportData = {
      cbtPackageType: 'CBT_EXAM_PACKAGE_JSON',
      version: '2.2',
      exportedAt: new Date().toISOString(),
      generator: 'CBT GURUAI 2026 - National Exam Standard',
      // Metadata identifying the teacher & latest randomized token
      guru: {
        kodeGuru: teacher.kodeGuru,
        namaGuru: teacher.nama,
        nipGuru: teacher.nip,
        mapel: mapelName,
      },
      paketInfo: {
        id: item.id,
        namaSesi: item.namaSesi,
        kodePaket: item.kodePaket,
        paketSoal: item.paketSoal,
        mapel: mapelName,
        targetKelas: item.targetKelas,
        durasiMenit: item.durasiMenit,
        kkm: item.kkm,
        token: currentToken, // latest randomized token
        tokenCreatedAt: item.tokenCreatedAt || new Date().toISOString(),
        kodeGuru: teacher.kodeGuru,
        namaGuru: teacher.nama,
        status: item.status,
        totalSoal: packageQuestions.length,
        keterangan: item.keterangan || '',
      },
      // Root compatibility keys for instant restoration in login & admin
      examToken: currentToken,
      mapel: mapelName,
      mapelTitle: `${mapelName} - ${item.paketSoal} (${item.namaSesi}) [TOKEN: ${currentToken}]`,
      duration: item.durasiMenit || config.duration || 60,
      kkm: item.kkm || config.kkm || 75,
      kodeGuru: teacher.kodeGuru,
      questions: packageQuestions,
      students: config.students || [],
      config: packageConfig,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Distinguishable filename: Paket_[KodePaket]_[Mapel]_[KodeGuru]_TOKEN_[Token].json
    a.download = `Paket_${cleanKodePaket}_${cleanMapel}_${cleanKg}_TOKEN_${cleanToken}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (showAlert) {
      showAlert(
        `File Paket Ujian (.json) untuk "${item.paketSoal}" dengan Token "${currentToken}" buatan ${teacher.nama} (${teacher.kodeGuru}) Berhasil Diunduh!`
      );
    }
  };

  // 5. Set As Primary Login Token
  const handleSetPrimaryToken = (item: ExamScheduleToken) => {
    const updatedList = scheduleList.map((s) => ({
      ...s,
      isPrimaryActive: s.id === item.id,
      status: s.id === item.id ? ('ACTIVE' as const) : s.status,
    }));

    const newConfig: AppConfig = {
      ...config,
      examToken: item.token,
      duration: item.durasiMenit || config.duration,
      kkm: item.kkm || config.kkm,
      scheduleTokens: updatedList,
    };

    onSaveConfig(newConfig);
    if (showAlert) {
      showAlert(`Token "${item.token}" (${item.namaSesi}) Telah Diaktifkan Sebagai Token Utama Login Siswa!`);
    }
  };

  // 6. Regenerate Single Token
  const handleRegenerateSingleToken = (item: ExamScheduleToken, autoDownloadJson = false) => {
    const newToken = generateRandomTokenStr();
    const tokenTime = new Date().toISOString();
    const updatedItem: ExamScheduleToken = {
      ...item,
      token: newToken,
      tokenCreatedAt: tokenTime,
    };
    const updatedList = scheduleList.map((s) =>
      s.id === item.id ? updatedItem : s
    );

    const isCurrentPrimary = item.isPrimaryActive || config.examToken === item.token;
    const newConfig: AppConfig = {
      ...config,
      examToken: isCurrentPrimary ? newToken : config.examToken,
      scheduleTokens: updatedList,
    };

    onSaveConfig(newConfig);

    if (autoDownloadJson) {
      handleDownloadJsonPackage(updatedItem, newToken);
    } else if (showAlert) {
      showAlert(
        `Token untuk "${item.namaSesi}" berhasil diacak menjadi: "${newToken}"! Anda dapat langsung mengunduh Paket .json dengan token terbaru.`
      );
    }
  };

  // 7. Regenerate All Tokens
  const handleRegenerateAllTokens = () => {
    if (!window.confirm('Yakin ingin men-generate ulang Token acak baru untuk SEMUA jadwal sesi ujian?')) {
      return;
    }

    let firstActiveToken = config.examToken;
    const updatedList = scheduleList.map((s, idx) => {
      const newToken = generateRandomTokenStr();
      if (s.isPrimaryActive || idx === 0) {
        firstActiveToken = newToken;
      }
      return {
        ...s,
        token: newToken,
        tokenCreatedAt: new Date().toISOString(),
      };
    });

    const newConfig: AppConfig = {
      ...config,
      examToken: firstActiveToken,
      scheduleTokens: updatedList,
    };

    onSaveConfig(newConfig);
    if (showAlert) {
      showAlert(`Seluruh Token Sesi Ujian Berhasil Di-generate Ulang Secara Acak! Token Utama Login kini: "${firstActiveToken}".`);
    }
  };

  // 8. Delete Schedule
  const handleDeleteSchedule = (id: string) => {
    if (!window.confirm('Hapus jadwal & pengaturan token sesi ini?')) return;

    const updatedList = scheduleList.filter((s) => s.id !== id);
    const newConfig: AppConfig = {
      ...config,
      scheduleTokens: updatedList,
    };

    onSaveConfig(newConfig);
  };

  // 9. Open Modal For Add New
  const handleOpenAddModal = () => {
    setEditingToken(null);
    const nextIndex = scheduleList.length + 1;
    const today = new Date().toISOString().split('T')[0];

    setFormNamaSesi(`Sesi ${nextIndex} - Paket ${String.fromCharCode(64 + nextIndex)}`);
    setFormTanggal(today);
    setFormJamMulai('08:00');
    setFormJamSelesai('09:30');
    setFormDurasi(config.duration || 60);
    setFormKkm(config.kkm || 75);
    setFormMapel(config.mapel || 'Sosiologi');
    setFormKodeGuru(config.kodeGuru || 'GURU01');
    setFormTargetKelas(nextIndex === 1 ? 'XII IPS 1, XII IPS 2' : nextIndex === 2 ? 'XII IPS 3, XII IPS 4' : 'Semua Kelas');
    setFormPaketSoal(`Paket ${String.fromCharCode(64 + nextIndex)} (${nextIndex === 1 ? 'Utama' : nextIndex === 2 ? 'Acak Variasi' : 'Susulan'})`);
    setFormKodePaket(`PKT-SOS-${String.fromCharCode(64 + nextIndex)}`);
    setFormToken(generateRandomTokenStr());
    setFormStatus('ACTIVE');
    setFormKeterangan(`Jadwal Pelaksanaan Ujian Sesi ${nextIndex}`);

    setIsModalOpen(true);
  };

  // 10. Open Modal For Edit
  const handleOpenEditModal = (item: ExamScheduleToken) => {
    setEditingToken(item);
    setFormNamaSesi(item.namaSesi);
    setFormTanggal(item.tanggalUjian || new Date().toISOString().split('T')[0]);
    setFormJamMulai(item.jamMulai || '08:00');
    setFormJamSelesai(item.jamSelesai || '09:30');
    setFormDurasi(item.durasiMenit || 60);
    setFormKkm(item.kkm || 75);
    setFormMapel(item.mapel || config.mapel || 'Sosiologi');
    setFormKodeGuru(item.kodeGuru || config.kodeGuru || 'GURU01');
    setFormTargetKelas(item.targetKelas || '');
    setFormPaketSoal(item.paketSoal || 'Paket A (Utama)');
    setFormKodePaket(item.kodePaket || 'PKT-SOS-A');
    setFormToken(item.token || generateRandomTokenStr());
    setFormStatus(item.status === 'EXPIRED' ? 'CLOSED' : item.status);
    setFormKeterangan(item.keterangan || '');

    setIsModalOpen(true);
  };

  // 11. Save Modal Form
  const handleSaveModalForm = (e: React.FormEvent, shouldDownloadJson = false) => {
    e.preventDefault();

    const cleanToken = formToken.trim().toUpperCase() || generateRandomTokenStr();

    if (editingToken) {
      // Update
      const isTokenChanged = editingToken.token !== cleanToken;
      const updatedItem: ExamScheduleToken = {
        ...editingToken,
        namaSesi: formNamaSesi.trim(),
        tanggalUjian: formTanggal,
        jamMulai: formJamMulai,
        jamSelesai: formJamSelesai,
        durasiMenit: Number(formDurasi) || 60,
        kkm: Number(formKkm) || 75,
        mapel: formMapel.trim(),
        kodeGuru: formKodeGuru.trim(),
        targetKelas: formTargetKelas.trim(),
        paketSoal: formPaketSoal.trim(),
        kodePaket: formKodePaket.trim(),
        token: cleanToken,
        tokenCreatedAt: isTokenChanged ? new Date().toISOString() : (editingToken.tokenCreatedAt || new Date().toISOString()),
        status: formStatus,
        keterangan: formKeterangan.trim(),
      };

      const updatedList = scheduleList.map((s) =>
        s.id === editingToken.id ? updatedItem : s
      );

      const isPrimary = editingToken.isPrimaryActive;
      const newConfig: AppConfig = {
        ...config,
        examToken: isPrimary ? cleanToken : config.examToken,
        scheduleTokens: updatedList,
      };

      onSaveConfig(newConfig);

      if (shouldDownloadJson) {
        handleDownloadJsonPackage(updatedItem, cleanToken);
      } else if (showAlert) {
        showAlert(`Jadwal & Token "${formNamaSesi}" (Token: ${cleanToken}) Berhasil Disimpan!`);
      }
    } else {
      // Add New
      const newId = `SCHED-${Date.now().toString().slice(-4)}`;
      const isFirst = scheduleList.length === 0;

      const newItem: ExamScheduleToken = {
        id: newId,
        namaSesi: formNamaSesi.trim(),
        tanggalUjian: formTanggal,
        jamMulai: formJamMulai,
        jamSelesai: formJamSelesai,
        durasiMenit: Number(formDurasi) || 60,
        kkm: Number(formKkm) || 75,
        mapel: formMapel.trim(),
        kodeGuru: formKodeGuru.trim(),
        targetKelas: formTargetKelas.trim(),
        paketSoal: formPaketSoal.trim(),
        kodePaket: formKodePaket.trim(),
        token: cleanToken,
        status: formStatus,
        isPrimaryActive: isFirst,
        tokenCreatedAt: new Date().toISOString(),
        keterangan: formKeterangan.trim(),
      };

      const updatedList = [...scheduleList, newItem];
      const newConfig: AppConfig = {
        ...config,
        examToken: isFirst ? cleanToken : config.examToken,
        scheduleTokens: updatedList,
      };

      onSaveConfig(newConfig);

      if (shouldDownloadJson) {
        handleDownloadJsonPackage(newItem, cleanToken);
      } else if (showAlert) {
        showAlert(`Sesi Baru "${formNamaSesi}" dengan Token "${cleanToken}" Berhasil Ditambahkan!`);
      }
    }

    setIsModalOpen(false);
  };

  // Filtered List
  const filteredList = scheduleList.filter((item) => {
    const matchesSearch =
      item.namaSesi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetKelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.paketSoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kodePaket.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      item.status === statusFilter ||
      (statusFilter === 'CLOSED' && item.status === 'EXPIRED');

    return matchesSearch && matchesStatus;
  });

  // Active Primary Token
  const activePrimarySchedule =
    scheduleList.find((s) => s.isPrimaryActive) ||
    scheduleList.find((s) => s.token === config.examToken) ||
    scheduleList[0];

  const currentActiveToken = activePrimarySchedule ? activePrimarySchedule.token : config.examToken || 'SOS2026';

  // Print Full Berita Acara & Active Student Data per Class/Room
  const handlePrintFullBeritaAcara = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const kop = config.kopSekolah || {
      namaSekolah: 'SMA NEGERI CONTOH JAKARTA',
      dinas: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
      alamat: 'Jl. Pendidikan Raya No. 45, Jakarta Pusat',
      teleponWeb: 'Telp: (021) 7890123 | Website: www.smancontoh.sch.id',
      kotaTanggal: `Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      namaGuru: config.teachers?.[0]?.nama || 'Guru Mata Pelajaran',
      nipGuru: config.teachers?.[0]?.nip || '-',
      jabatanGuru: 'Guru Pengampu / Proktor CBT',
      namaKepalaSekolah: 'Dr. H. Ahmad Sanusi, M.Si',
      nipKepalaSekolah: '197203101998021001',
    };

    const allStudentsList = config.students || [];

    // Filter students based on selected class or session
    const targetSchedules =
      selectedSesiId === 'ALL'
        ? scheduleList
        : scheduleList.filter((s) => s.id === selectedSesiId);

    const activeStudentsList = allStudentsList.filter((s) => {
      if (selectedKelasFilter !== 'ALL' && s.kelas !== selectedKelasFilter) return false;
      if (studentStatusFilter === 'ACTIVE' && s.isActive === false) return false;
      if (studentStatusFilter === 'INACTIVE' && s.isActive !== false) return false;
      return true;
    });

    const activeStudentsOnly = allStudentsList.filter((s) => {
      if (selectedKelasFilter !== 'ALL' && s.kelas !== selectedKelasFilter) return false;
      return s.isActive !== false;
    });

    const inactiveStudents = allStudentsList.filter((s) => {
      if (selectedKelasFilter !== 'ALL' && s.kelas !== selectedKelasFilter) return false;
      return s.isActive === false;
    });

    // Create padded rows for attendance signature list (e.g. 36 per class standard)
    const fullStudentRows: Array<{ nis: string; nama: string; kelas: string; isBlank?: boolean }> =
      activeStudentsList.map((st) => ({
        nis: st.nis,
        nama: st.nama,
        kelas: st.kelas,
        isBlank: false,
      }));

    if (targetRowsPerClass > 0 && fullStudentRows.length < targetRowsPerClass) {
      const paddingNeeded = targetRowsPerClass - fullStudentRows.length;
      for (let i = 0; i < paddingNeeded; i++) {
        fullStudentRows.push({
          nis: '...................',
          nama: '..........................................................',
          kelas: selectedKelasFilter === 'ALL' ? '-' : selectedKelasFilter,
          isBlank: true,
        });
      }
    }

    const logoHtml = kop.logoSekolah
      ? `<img src="${kop.logoSekolah}" style="max-height: 65px; width: auto;" alt="Logo" />`
      : '';
    const logoPemdaHtml = kop.logoPemda
      ? `<img src="${kop.logoPemda}" style="max-height: 65px; width: auto;" alt="Logo Pemda" />`
      : '';

    const paperSizeCss =
      selectedPaperSize === 'f4'
        ? '@page { size: 210mm 330mm portrait; margin: 10mm 12mm; }'
        : selectedPaperSize === 'legal'
        ? '@page { size: legal portrait; margin: 10mm 12mm; }'
        : selectedPaperSize === 'letter'
        ? '@page { size: letter portrait; margin: 10mm 12mm; }'
        : '@page { size: A4 portrait; margin: 10mm 12mm; }';

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>BERITA ACARA PELAKSANAAN UJIAN CBT & DAFTAR HADIR SISWA</title>
  <style>
    ${paperSizeCss}
    body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; font-size: 12px; line-height: 1.35; background: #fff; }
    
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; border-bottom: 3px double #000; padding-bottom: 6px; }
    .header-table td { border: none !important; padding: 2px 4px; vertical-align: middle; }
    .kop-title h2 { margin: 0; font-size: 13px; font-weight: bold; text-transform: uppercase; }
    .kop-title h1 { margin: 2px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
    .kop-title p { margin: 1px 0; font-size: 10px; font-style: italic; }

    .doc-title { text-align: center; font-weight: bold; font-size: 14px; margin: 12px 0 4px 0; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px; }
    .doc-subtitle { text-align: center; font-size: 11px; margin-bottom: 12px; font-weight: bold; }

    .meta-box { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .meta-box td { border: none !important; padding: 3px 6px; font-size: 11px; vertical-align: top; }

    table.data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    table.data-table th, table.data-table td { border: 1px solid #000; padding: 4px 6px; font-size: 10px; }
    table.data-table th { background-color: #f0f0f0; text-align: center; font-weight: bold; text-transform: uppercase; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }

    .note-box { border: 1px solid #000; padding: 8px; font-size: 11px; min-height: 40px; margin-top: 6px; background: #fafafa; }

    .ttd-4-col { width: 100%; margin-top: 20px; border-collapse: collapse; }
    .ttd-4-col td { border: none !important; text-align: center; vertical-align: top; font-size: 11px; width: 25%; padding: 4px; position: relative; }
    .ttd-space { height: 50px; }

    .page-break { page-break-before: always; margin-top: 15px; }

    td.paraf-col { height: 26px; vertical-align: middle; padding-left: 6px; font-size: 10px; font-family: monospace; }

    .token-card { width: 48%; border: 1px dashed #333; padding: 10px; box-sizing: border-box; border-radius: 6px; margin-bottom: 10px; display: inline-block; vertical-align: top; }
    .token-card-header { font-weight: bold; font-size: 11px; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 4px; }
    .token-card-code { font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 6px 0; border: 1px solid #000; padding: 4px; background: #fdfdfd; }
  </style>
</head>
<body>

  <!-- ================= HALAMAN 1: BERITA ACARA ================= -->
  <table class="header-table">
    <tr>
      <td style="width: 14%; text-align: left;">${logoPemdaHtml}</td>
      <td style="width: 72%; text-align: center;" class="kop-title">
        <h2>${kop.dinas || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}</h2>
        <h1>${kop.namaSekolah || 'SMA NEGERI CONTOH'}</h1>
        <p>${kop.alamat || ''}</p>
        <p>${kop.teleponWeb || ''}</p>
      </td>
      <td style="width: 14%; text-align: right;">${logoHtml}</td>
    </tr>
  </table>

  <div class="doc-title">BERITA ACARA PELAKSANAAN UJIAN BERBASIS KOMPUTER (CBT)</div>
  <div class="doc-subtitle">MATA PELAJARAN: ${config.mapel || 'SOSIOLOGI'} — TAHUN AJARAN 2025/2026</div>

  <p style="text-align: justify; margin-bottom: 8px;">
    Pada hari ini <b>${new Date().toLocaleDateString('id-ID', { weekday: 'long' })}</b>, tanggal <b>${kop.kotaTanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b>, telah dilaksanakan Ujian Berbasis Komputer (CBT) untuk Peserta Didik dengan rincian data sebagai berikut:
  </p>

  <table class="meta-box">
    <tr>
      <td style="width: 18%;"><b>Mata Pelajaran</b></td>
      <td style="width: 2%;">:</td>
      <td style="width: 30%;">${config.mapel || 'Sosiologi'}</td>
      <td style="width: 18%;"><b>Ruang Ujian</b></td>
      <td style="width: 2%;">:</td>
      <td style="width: 30%;"><b>${ruangUjianInput}</b></td>
    </tr>
    <tr>
      <td><b>Target Kelas</b></td>
      <td>:</td>
      <td>${selectedKelasFilter === 'ALL' ? 'Semua Kelas Aktif' : selectedKelasFilter}</td>
      <td><b>Pengawas Ruang 1</b></td>
      <td>:</td>
      <td>${pengawas1Input}</td>
    </tr>
    <tr>
      <td><b>Waktu Ujian</b></td>
      <td>:</td>
      <td>${targetSchedules[0]?.jamMulai || '08:00'} - ${targetSchedules[0]?.jamSelesai || '09:30'} WIB (${targetSchedules[0]?.durasiMenit || config.duration} Menit)</td>
      <td><b>Pengawas Ruang 2</b></td>
      <td>:</td>
      <td>${pengawas2Input}</td>
    </tr>
    <tr>
      <td><b>Token Ujian</b></td>
      <td>:</td>
      <td><b style="font-family: monospace; font-size: 13px; letter-spacing: 1.5px;">${currentActiveToken}</b></td>
      <td><b>Proktor CBT</b></td>
      <td>:</td>
      <td>${kop.namaGuru}</td>
    </tr>
  </table>

  <!-- REKAPITULASI KEHADIRAN SISWA -->
  <div style="font-weight: bold; margin-top: 10px; margin-bottom: 4px; font-size: 11px;">
    I. REKAPITULASI PESERTA UJIAN PER KELAS / RUANG:
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 25%;">Target Kelas / Ruang</th>
        <th style="width: 20%;">Total Terdaftar</th>
        <th style="width: 20%;">Siswa Aktif (Hadir)</th>
        <th style="width: 20%;">Siswa Non-Aktif (Absen)</th>
        <th style="width: 10%;">Persentase</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center">1</td>
        <td><b>${selectedKelasFilter === 'ALL' ? 'Seluruh Kelas Aktif' : selectedKelasFilter}</b> (${ruangUjianInput})</td>
        <td class="text-center font-bold">${allStudentsList.length} Siswa</td>
        <td class="text-center font-bold" style="color: #15803d;">${activeStudentsOnly.length} Siswa</td>
        <td class="text-center font-bold" style="color: #b91c1c;">${inactiveStudents.length} Siswa</td>
        <td class="text-center font-bold">${allStudentsList.length > 0 ? Math.round((activeStudentsOnly.length / allStudentsList.length) * 100) : 100}%</td>
      </tr>
    </tbody>
  </table>

  <!-- RINCIAN DAFTAR SISWA NON-AKTIF / ABSEN (JIKA ADA) -->
  ${
    inactiveStudents.length > 0
      ? `
  <div style="font-weight: bold; margin-top: 8px; margin-bottom: 4px; color: #991b1b; font-size: 11px;">
    * Rincian Peserta Ujian yang Tidak Aktif / Tidak Hadir (${inactiveStudents.length} Siswa):
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 8%;">No</th>
        <th style="width: 22%;">NIS / No. Peserta</th>
        <th style="width: 45%;">Nama Siswa</th>
        <th style="width: 25%;">Kelas</th>
      </tr>
    </thead>
    <tbody>
      ${inactiveStudents
        .map(
          (st, i) => `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td class="text-center font-bold">${st.nis}</td>
          <td>${st.nama}</td>
          <td class="text-center">${st.kelas}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  `
      : '<p style="font-size: 11px; font-style: italic; color: #166534; margin: 4px 0;">* Seluruh peserta terdaftar dalam status AKTIF dan mengikuti ujian.</p>'
  }

  <!-- CATATAN KEJADIAN KHUSUS -->
  <div style="font-weight: bold; margin-top: 10px; margin-bottom: 4px; font-size: 11px;">
    II. CATATAN & KEJADIAN KHUSUS SELAMA UJIAN:
  </div>
  <div class="note-box">
    ${catatanKejadian || 'Ujian berjalan tertib, lancar, dan tanpa hambatan teknis.'}
  </div>

  <p style="margin-top: 10px;">Demikian Berita Acara Pelaksanaan Ujian ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p>

  <!-- TANDA TANGAN 4 PIHAK -->
  <table class="ttd-4-col">
    <tr>
      <td>
        Pengawas Ruang 1,<br>
        <div class="ttd-space"></div>
        <b><u>${pengawas1Input}</u></b><br>
        NIP. -
      </td>
      <td>
        Pengawas Ruang 2,<br>
        <div class="ttd-space"></div>
        <b><u>${pengawas2Input}</u></b><br>
        NIP. -
      </td>
      <td>
        Proktor CBT,<br>
        <div class="ttd-space"></div>
        <b><u>${kop.namaGuru}</u></b><br>
        NIP. ${kop.nipGuru}
      </td>
      <td style="position: relative;">
        Mengetahui,<br>
        Kepala Sekolah<br>
        <div style="height: 52px; position: relative; margin: 4px 0;">
          ${
            showDigitalSignatures && kop.ttdKepalaSekolah
              ? `<img src="${kop.ttdKepalaSekolah}" style="max-height: 48px; position: absolute; left: 50%; transform: translateX(-50%); top: 2px; z-index: 2;" alt="TTD Kepsek" />`
              : ''
          }
          ${
            showDigitalSignatures && kop.stempelSekolah
              ? `<img src="${kop.stempelSekolah}" style="max-height: 52px; position: absolute; left: 15%; top: -4px; opacity: ${kop.stempelOpacity || 0.85}; z-index: 1;" alt="Stempel" />`
              : ''
          }
        </div>
        <b><u>${kop.namaKepalaSekolah}</u></b><br>
        NIP. ${kop.nipKepalaSekolah}
      </td>
    </tr>
  </table>

  <!-- ================= HALAMAN 2: LAMPIRAN DAFTAR HADIR SISWA AKTIF ================= -->
  ${
    includeDaftarHadir
      ? `
  <div class="page-break"></div>

  <table class="header-table">
    <tr>
      <td style="width: 14%; text-align: left;">${logoPemdaHtml}</td>
      <td style="width: 72%; text-align: center;" class="kop-title">
        <h2>${kop.dinas || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}</h2>
        <h1>${kop.namaSekolah || 'SMA NEGERI CONTOH'}</h1>
        <p>${kop.alamat || ''}</p>
        <p>${kop.teleponWeb || ''}</p>
      </td>
      <td style="width: 14%; text-align: right;">${logoHtml}</td>
    </tr>
  </table>

  <div class="doc-title">DAFTAR HADIR PESERTA UJIAN (CBT)</div>
  <div class="doc-subtitle">MATA PELAJARAN: ${config.mapel || 'SOSIOLOGI'} | KELAS: ${selectedKelasFilter === 'ALL' ? 'SEMUA KELAS' : selectedKelasFilter} | RUANG: ${ruangUjianInput}</div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 16%;">NIS / No. Peserta</th>
        <th style="width: 33%;">Nama Lengkap Siswa</th>
        <th style="width: 12%;">Kelas</th>
        <th colspan="2" style="width: 34%;">Tanda Tangan</th>
      </tr>
    </thead>
    <tbody>
      ${fullStudentRows
        .map((st, idx) => {
          const rowNum = idx + 1;
          const isOdd = rowNum % 2 !== 0;
          return `
        <tr>
          <td class="text-center">${rowNum}</td>
          <td class="text-center font-bold" style="font-family: monospace;">${st.nis}</td>
          <td><b>${st.nama}</b></td>
          <td class="text-center">${st.kelas}</td>
          <td class="paraf-col">
            ${isOdd ? `<span style="font-weight: bold; margin-right: 4px;">${rowNum}.</span> ................................` : ''}
          </td>
          <td class="paraf-col">
            ${!isOdd ? `<span style="font-weight: bold; margin-right: 4px;">${rowNum}.</span> ................................` : ''}
          </td>
        </tr>
      `;
        })
        .join('')}
    </tbody>
  </table>

  <table class="ttd-4-col" style="margin-top: 15px;">
    <tr>
      <td></td>
      <td>
        Pengawas Ruang Ujian,<br>
        <div class="ttd-space"></div>
        <b><u>${pengawas1Input}</u></b>
      </td>
      <td>
        Proktor CBT,<br>
        <div class="ttd-space"></div>
        <b><u>${kop.namaGuru}</u></b>
      </td>
      <td style="position: relative;">
        Mengetahui,<br>
        Kepala Sekolah<br>
        <div style="height: 52px; position: relative; margin: 4px 0;">
          ${
            showDigitalSignatures && kop.ttdKepalaSekolah
              ? `<img src="${kop.ttdKepalaSekolah}" style="max-height: 48px; position: absolute; left: 50%; transform: translateX(-50%); top: 2px; z-index: 2;" alt="TTD Kepsek" />`
              : ''
          }
          ${
            showDigitalSignatures && kop.stempelSekolah
              ? `<img src="${kop.stempelSekolah}" style="max-height: 52px; position: absolute; left: 15%; top: -4px; opacity: ${kop.stempelOpacity || 0.85}; z-index: 1;" alt="Stempel" />`
              : ''
          }
        </div>
        <b><u>${kop.namaKepalaSekolah}</u></b>
      </td>
    </tr>
  </table>
  `
      : ''
  }

  <!-- ================= HALAMAN 3: SLIP KARTU TOKEN (OPSIONAL) ================= -->
  ${
    includeKartuToken
      ? `
  <div class="page-break"></div>
  <div class="doc-title" style="margin-bottom: 12px;">LAMPIRAN SLIP TOKEN UJIAN PER SESI</div>
  <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between;">
    ${scheduleList
      .map(
        (s) => `
      <div class="token-card">
        <div class="token-card-header">${kop.namaSekolah} — SLIP TOKEN CBT</div>
        <div style="font-size: 11px;">
          <div><b>Sesi:</b> ${s.namaSesi}</div>
          <div><b>Mapel:</b> ${s.mapel} (${s.paketSoal})</div>
          <div><b>Target Kelas:</b> ${s.targetKelas}</div>
          <div><b>Waktu:</b> ${s.jamMulai} - ${s.jamSelesai} WIB (${s.durasiMenit} Menit)</div>
        </div>
        <div class="token-card-code">${s.token}</div>
        <div style="font-size: 9px; text-align: center; color: #666;">
          *Token rahasia peserta sesi aktif. Diinput saat login portal CBT.
        </div>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold border border-white/20 text-amber-100 uppercase tracking-wider">
              <Key className="w-3.5 h-3.5" /> Sistem Manajemen Token & Jadwal Ujian
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Pengaturan Token & Paket Soal CBT
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Token di-generate otomatis berdasarkan jadwal ujian & paket soal. Setiap paket soal dapat di-download dalam bentuk aplikasi CBT offline mandiri, berkas PDF, maupun DOCX secara terstruktur.
            </p>
          </div>

          {/* Quick Counter Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl font-black text-amber-300">{scheduleList.length}</div>
              <div className="text-[10px] font-bold text-amber-100 uppercase tracking-wider">Sesi Jadwal</div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="text-2xl font-black text-emerald-300">
                {scheduleList.filter((s) => s.status === 'ACTIVE').length}
              </div>
              <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Token Aktif</div>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center col-span-2 sm:col-span-1">
              <div className="text-2xl font-black text-sky-300">
                {config.questions?.filter((q) => q.isActive !== false).length || 0}
              </div>
              <div className="text-[10px] font-bold text-sky-100 uppercase tracking-wider">Soal Siap</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Step-by-Step Exam Preparation Guide (Langkah-Langkah Persiapan Ujian) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                Langkah-Langkah Persiapan Pelaksanaan Ujian CBT
              </h3>
              <p className="text-[11px] text-slate-500">
                Ikuti 4 alur sistematis berikut agar pembagian paket dan token ujian tertata rapi.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 uppercase tracking-wider hidden sm:inline-block">
            SOP Standar Nasional
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Step 1 */}
          <div className="bg-slate-50 hover:bg-blue-50/50 p-4 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  1
                </span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-800">Setting Jadwal & Sesi</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Tentukan tanggal, jam mulai & selesai, durasi, KKM, serta target kelas peserta.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-blue-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Pengaturan Waktu Akurat
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 hover:bg-indigo-50/50 p-4 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  2
                </span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-800">Pemisahan Paket Soal</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Bagi soal ke Paket A (Utama), Paket B (Variasi), atau Paket C (Susulan).
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-indigo-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Anti-Kecurangan Antar-Sesi
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 hover:bg-amber-50/50 p-4 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  3
                </span>
                <Key className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-800">Generate Token Otomatis</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Sistem mengunci setiap jadwal dengan kode Token unik 6-karakter acak.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-amber-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Autentikasi Sesi Ujian
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-50 hover:bg-emerald-50/50 p-4 rounded-2xl border border-slate-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  4
                </span>
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="font-bold text-xs text-slate-800">Setting Ujian Paket (.json)</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Gunakan file paket .json dengan token acak terbaru untuk menyetting ujian di komputer proktor & lab.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Siap Ujian dengan Token Terbaru
            </div>
          </div>
        </div>
      </div>

      {/* 3. Display Big Hero Primary Token Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
              TOKEN LOGIN SISWA SAAT INI (AKTIF UTAMA)
            </span>
          </div>
          <div className="text-4xl sm:text-6xl font-black font-mono tracking-widest text-amber-400 select-all py-1">
            {currentActiveToken}
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Siswa yang login dengan token ini akan mengerjakan <b>{activePrimarySchedule?.namaSesi || 'Sesi Utama'}</b> ({activePrimarySchedule?.paketSoal || 'Paket A'}).
            {activePrimarySchedule && (
              <span className="block text-emerald-400 font-semibold mt-1">
                Guru: {getTeacherForPackage(activePrimarySchedule).nama} ({getTeacherForPackage(activePrimarySchedule).kodeGuru})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            onClick={() => handleCopy('primary', currentActiveToken)}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer shadow-md"
          >
            {copiedTokenId === 'primary' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Token Berhasil Disalin!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Salin Token
              </>
            )}
          </button>

          {activePrimarySchedule && (
            <button
              onClick={() => handleRegenerateSingleToken(activePrimarySchedule)}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer active:scale-95"
              title="Acak Token Baru untuk Sesi Utama ini"
            >
              <RefreshCw className="w-4 h-4" /> Acak Token Baru
            </button>
          )}

          {activePrimarySchedule && (
            <button
              onClick={() => handleDownloadJsonPackage(activePrimarySchedule)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer active:scale-95"
              title="Download File Paket Ujian (.json) dengan Token Terbaru untuk Setting Ujian di Komputer Lab / Siswa"
            >
              <FileJson className="w-4 h-4 text-emerald-100" />
              <span>Download Paket Ujian (.json)</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Action Toolbar & Filter Controls */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Sesi, Kelas, Paket Soal, atau Token..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'ACTIVE', 'STANDBY', 'CLOSED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'ALL'
                  ? 'Semua'
                  : st === 'ACTIVE'
                  ? '🟢 Aktif'
                  : st === 'STANDBY'
                  ? '🟡 Standby'
                  : '🔴 Closed'}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Jadwal & Token Baru
          </button>

          <button
            onClick={handleRegenerateAllTokens}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
            title="Acak semua token untuk seluruh jadwal"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Acak Semua Token
          </button>

          <button
            onClick={() => setShowBeritaAcaraModal(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-2 rounded-xl text-xs transition shadow-md border border-blue-500 cursor-pointer active:scale-95"
            title="Pengaturan & Cetak Berita Acara Pelaksanaan Ujian (Lengkap Data Siswa Aktif per Kelas/Ruang)"
          >
            <Printer className="w-4 h-4 text-white" /> Cetak Berita Acara (A4)
          </button>
        </div>
      </div>

      {/* 5. Systematic Table of Token & Schedule Settings */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" /> Tabel Sistem Token & Paket Soal Ujian CBT
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap baris jadwal memiliki Token unik dan tautan langsung untuk mengunduh paket soal mandiri.
            </p>
          </div>
          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Menampilkan {filteredList.length} dari {scheduleList.length} Sesi
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200">
              <Key className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">Belum Ada Data Jadwal & Token Ujian</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Klik tombol "Tambah Jadwal & Token Baru" di atas untuk membuat sesi jadwal dan meng-generate token ujian pertama Anda.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Buat Jadwal & Token Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3.5 px-4">No / ID Sesi</th>
                  <th className="py-3.5 px-4">Nama Sesi & Target Kelas</th>
                  <th className="py-3.5 px-4">Paket Soal & Kode</th>
                  <th className="py-3.5 px-4">Waktu & Durasi</th>
                  <th className="py-3.5 px-4 text-center">Token Ujian (Auto)</th>
                  <th className="py-3.5 px-4 text-center">Status Sesi</th>
                  <th className="py-3.5 px-4 text-right">Download & Aksi Paket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredList.map((item, idx) => {
                  const isPrimary = item.isPrimaryActive || item.token === config.examToken;
                  const packageQuestions = getQuestionsForPackage(item);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/40 transition-colors ${
                        isPrimary ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* 1. No / ID Sesi */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-mono font-bold text-[11px] text-slate-500 block">
                              {item.id}
                            </span>
                            {isPrimary && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-300 uppercase tracking-tighter">
                                ★ Login Utama
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Nama Sesi & Target Kelas */}
                      <td className="py-4 px-4 align-middle">
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {item.namaSesi}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="font-medium">Kelas: <b>{item.targetKelas || 'Semua Kelas'}</b></span>
                          </div>
                          {/* Teacher Identification */}
                          {(() => {
                            const teacher = getTeacherForPackage(item);
                            return (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md mt-1 w-fit">
                                <User className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span>Guru: <b>{teacher.nama}</b> ({teacher.kodeGuru})</span>
                              </div>
                            );
                          })()}
                          {item.keterangan && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-xs">
                              {item.keterangan}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Paket Soal & Kode */}
                      <td className="py-4 px-4 align-middle">
                        <div>
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-900 text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-200">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" /> {item.paketSoal}
                          </span>
                          <div className="font-mono text-[10px] text-slate-500 font-bold mt-1">
                            Kode: {item.kodePaket} • Mapel: {item.mapel || config.mapel}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            ✓ {packageQuestions.length} Butir Soal Terkoneksi
                          </div>
                        </div>
                      </td>

                      {/* 4. Waktu & Durasi */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {item.tanggalUjian || 'Setiap Hari'}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-orange-500" />
                            {item.jamMulai} - {item.jamSelesai} ({item.durasiMenit} Menit)
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            KKM: <b className="text-slate-800">{item.kkm}</b>
                          </div>
                        </div>
                      </td>

                      {/* 5. Token Ujian (Auto-Generated) */}
                      <td className="py-4 px-4 align-middle text-center">
                        <div className="inline-flex flex-col items-center gap-1.5 bg-slate-900 text-white p-2.5 rounded-2xl shadow-sm border border-slate-800 min-w-[130px]">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            TOKEN SESI
                          </span>
                          <span className="font-mono font-black text-base text-amber-400 tracking-widest select-all">
                            {item.token}
                          </span>
                          {item.tokenCreatedAt && (
                            <span className="text-[8px] text-slate-500">
                              Diacak: {new Date(item.tokenCreatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          <div className="flex items-center gap-1 pt-1 border-t border-slate-800 w-full justify-center">
                            <button
                              onClick={() => handleCopy(item.id, item.token)}
                              className="p-1 text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="Salin Token"
                            >
                              {copiedTokenId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRegenerateSingleToken(item)}
                              className="p-1 text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="Acak / Generate Ulang Token Ini"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 6. Status Sesi */}
                      <td className="py-4 px-4 align-middle text-center">
                        <div className="space-y-1.5 inline-block text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                              item.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : item.status === 'STANDBY'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.status === 'ACTIVE'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : item.status === 'STANDBY'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                            ></span>
                            {item.status}
                          </span>

                          {!isPrimary && item.status !== 'CLOSED' && (
                            <div>
                              <button
                                onClick={() => handleSetPrimaryToken(item)}
                                className="text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100/70 hover:bg-amber-200 px-2 py-0.5 rounded transition cursor-pointer block w-full"
                                title="Jadikan sesi ini sebagai token aktif di halaman login peserta"
                              >
                                Set ke Login
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 7. Download Paket (.json) & Aksi */}
                      <td className="py-4 px-4 align-middle text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Main Action: Download Paket .json */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDownloadJsonPackage(item)}
                              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-[11px] transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title={`Download File Paket Ujian (.json) dengan Token "${item.token}" buatan ${getTeacherForPackage(item).nama} (${getTeacherForPackage(item).kodeGuru}) untuk Setting Ujian Siswa/Lab`}
                            >
                              <FileJson className="w-3.5 h-3.5 text-white" />
                              <span>Download Paket (.json)</span>
                            </button>

                            <button
                              onClick={() => handleDownloadPdf(item)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold p-1.5 rounded-xl text-xs transition border border-blue-200 cursor-pointer"
                              title="Cetak Naskah Soal Standar Ujian PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDownloadWord(item)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold p-1.5 rounded-xl text-xs transition border border-indigo-200 cursor-pointer"
                              title="Download Naskah Soal MS Word (.docx)"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDownloadOfflineCbt(item)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-bold p-1.5 rounded-xl text-xs transition border border-slate-200 cursor-pointer"
                              title="Download Standalone Offline CBT (.html) - Opsional Alternatif"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Action Row */}
                          <div className="flex items-center gap-1 pt-0.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>

                            <button
                              onClick={() => handleDeleteSchedule(item.id)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Info & Best Practice Guide Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
          <Info className="w-4.5 h-4.5 text-amber-600 shrink-0" />
          Petunjuk Distribusi & Setting Ujian Menggunakan Paket .JSON:
        </div>
        <ul className="list-disc list-inside space-y-1.5 text-amber-800 text-[11px] leading-relaxed pl-1">
          <li>
            <b>Gunakan File Paket (.json) untuk Setting Ujian:</b> Setiap kali menyetting ujian di komputer proktor/lab atau membagikan soal ke peserta, gunakan tombol <code>Download Paket (.json)</code>. File paket .json ini secara otomatis memuat butir soal aktif serta Token terbaru hasil pengacakan.
          </li>
          <li>
            <b>Identifikasi Pembuat Paket:</b> File paket .json mencantumkan identitas Guru Pengampu dan Token spesifik (misal: <code>Paket_PKT-SOS-A_Sosiologi_GURU01_TOKEN_K9X8P2.json</code>), sehingga memudahkan admin dan pengawas membedakan paket soal antar guru dan antar sesi.
          </li>
          <li>
            <b>Distribusi Tepat Waktu:</b> Bagikan Token kepada siswa sesaat sebelum jam ujian dimulai (atau tayangkan di layar proyektor) agar siswa tidak dapat membuka soal sebelum waktunya.
          </li>
          <li>
            <b>Paket Berbeda Antar Sesi:</b> Gunakan Paket A untuk Sesi 1 dan Paket B/C untuk Sesi berikutnya agar peserta sesi siang tidak mendapatkan soal yang sama dari peserta sesi pagi.
          </li>
          <li>
            <b>Download CBT Offline (.html) Opsional:</b> Tombol icon download HTML tetap tersedia sebagai alternatif jika ingin menjalankan ujian CBT tanpa web server sama sekali.
          </li>
        </ul>
      </div>

      {/* 7. Modal Add / Edit Schedule & Token */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    {editingToken ? 'Edit Jadwal & Token Ujian' : 'Tambah Jadwal & Generate Token Baru'}
                  </h3>
                  <p className="text-xs text-amber-100">
                    Atur parameter waktu, paket soal, dan kode token unik untuk sesi ini.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-amber-100 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveModalForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Sesi */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Nama Sesi Ujian *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNamaSesi}
                    onChange={(e) => setFormNamaSesi(e.target.value)}
                    placeholder="Misal: Sesi 1 - Utama (Kelas XII IPS 1 & 2)"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Target Kelas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Target Kelas Peserta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTargetKelas}
                    onChange={(e) => setFormTargetKelas(e.target.value)}
                    placeholder="Misal: XII IPS 1, XII IPS 2"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Guru Pengampu (Pembuat Paket) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Guru Pengampu (Pembuat Paket) *
                  </label>
                  <select
                    value={formKodeGuru}
                    onChange={(e) => setFormKodeGuru(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none bg-white"
                  >
                    {teachersList.map((t) => (
                      <option key={t.id} value={t.kodeGuru || t.nip}>
                        {t.nama} ({t.kodeGuru || t.nip}) - {t.mapel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={formMapel}
                    onChange={(e) => setFormMapel(e.target.value)}
                    placeholder="Sosiologi"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Paket Soal */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Pilihan Paket Soal *
                  </label>
                  <select
                    value={formPaketSoal}
                    onChange={(e) => {
                      setFormPaketSoal(e.target.value);
                      if (e.target.value.includes('Paket A')) setFormKodePaket('PKT-SOS-A');
                      else if (e.target.value.includes('Paket B')) setFormKodePaket('PKT-SOS-B');
                      else if (e.target.value.includes('Paket C')) setFormKodePaket('PKT-SOS-C');
                    }}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none bg-white"
                  >
                    <option value="Paket A (Utama)">Paket A (Utama - Semua Soal)</option>
                    <option value="Paket B (Acak Variasi)">Paket B (Acak Variasi / Ganjil)</option>
                    <option value="Paket C (Susulan)">Paket C (Susulan / Genap)</option>
                  </select>
                </div>

                {/* Kode Paket */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Kode Paket Soal
                  </label>
                  <input
                    type="text"
                    value={formKodePaket}
                    onChange={(e) => setFormKodePaket(e.target.value.toUpperCase())}
                    placeholder="PKT-SOS-A"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:border-amber-500 focus:outline-none uppercase"
                  />
                </div>

                {/* Tanggal Ujian */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Durasi & KKM */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      Durasi (Mnt)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={formDurasi}
                      onChange={(e) => setFormDurasi(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      KKM Nilai
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formKkm}
                      onChange={(e) => setFormKkm(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Jam Mulai & Jam Selesai */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      value={formJamMulai}
                      onChange={(e) => setFormJamMulai(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      Jam Selesai
                    </label>
                    <input
                      type="time"
                      value={formJamSelesai}
                      onChange={(e) => setFormJamSelesai(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status Sesi */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Status Sesi Ujian
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:border-amber-500 focus:outline-none bg-white"
                  >
                    <option value="ACTIVE">🟢 ACTIVE (Buka Ujian)</option>
                    <option value="STANDBY">🟡 STANDBY (Persiapan / Kunci)</option>
                    <option value="CLOSED">🔴 CLOSED (Tutup / Selesai)</option>
                  </select>
                </div>

                {/* Token Ujian Generate Box */}
                <div className="sm:col-span-2 bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
                  <label className="block font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                    KODE TOKEN UJIAN (6 KARAKTER UNIK)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={formToken}
                      onChange={(e) => setFormToken(e.target.value.toUpperCase())}
                      placeholder="SOS2026"
                      className="flex-1 border-2 border-amber-500/50 bg-slate-800 text-amber-300 rounded-xl p-3 text-lg font-mono font-black uppercase tracking-widest focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormToken(generateRandomTokenStr())}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Acak Token
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Token ini akan diinput siswa di portal login untuk membuka paket soal sesi ini.
                  </p>
                </div>

                {/* Keterangan */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                    Catatan / Keterangan Sesi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    placeholder="Misal: Ujian Utama Lab Komputer 1 & 2"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveModalForm(e, true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-black transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Simpan pengaturan dan langsung download file paket .json dengan token terbaru"
                >
                  <FileJson className="w-4 h-4 text-emerald-100" />
                  <span>Simpan & Download Paket (.json)</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 rounded-xl font-black transition shadow-md cursor-pointer"
                >
                  {editingToken ? 'Simpan Jadwal Saja' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: CETAK BERITA ACARA & DAFTAR HADIR SISWA AKTIF PER KELAS / RUANG */}
      {showBeritaAcaraModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
                  <Printer className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    Cetak Berita Acara & Presensi Siswa Aktif
                  </h3>
                  <p className="text-xs text-blue-200 font-medium">
                    Lengkapi data ruang, pengawas, dan daftar siswa aktif per kelas untuk dokumen resmi A4
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBeritaAcaraModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* Grid Form Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* 1. Filter Sesi Ujian */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Pilih Sesi Ujian
                  </label>
                  <select
                    value={selectedSesiId}
                    onChange={(e) => setSelectedSesiId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ALL">Semua Sesi ({scheduleList.length} Sesi)</option>
                    {scheduleList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.namaSesi} ({s.targetKelas}) - Token: {s.token}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Filter Kelas Siswa */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Filter Kelas Siswa
                  </label>
                  <select
                    value={selectedKelasFilter}
                    onChange={(e) => setSelectedKelasFilter(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ALL">Semua Kelas ({config.students?.length || 0} Siswa)</option>
                    {Array.from(
                      new Set((config.students || []).map((s) => s.kelas || 'Umum').filter(Boolean))
                    )
                      .sort()
                      .map((cls) => (
                        <option key={cls} value={cls}>
                          Kelas: {cls}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 3. Nomor / Nama Ruang Ujian */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Nomor / Nama Ruang Ujian
                  </label>
                  <input
                    type="text"
                    value={ruangUjianInput}
                    onChange={(e) => setRuangUjianInput(e.target.value)}
                    placeholder="Contoh: Ruang 01 (Lab Komputer A)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* 4. Filter Status Siswa */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Filter Status Kehadiran Siswa
                  </label>
                  <select
                    value={studentStatusFilter}
                    onChange={(e) =>
                      setStudentStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ACTIVE">Hanya Siswa Aktif (Hadir Ujian)</option>
                    <option value="ALL">Semua Siswa (Aktif & Non-Aktif)</option>
                    <option value="INACTIVE">Hanya Siswa Non-Aktif (Tidak Hadir)</option>
                  </select>
                </div>

                {/* 5. Nama Pengawas Ruang 1 */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Nama Pengawas Ruang 1
                  </label>
                  <input
                    type="text"
                    value={pengawas1Input}
                    onChange={(e) => setPengawas1Input(e.target.value)}
                    placeholder="Nama Pengawas 1 & Gelar"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* 6. Nama Pengawas Ruang 2 */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Nama Pengawas Ruang 2
                  </label>
                  <input
                    type="text"
                    value={pengawas2Input}
                    onChange={(e) => setPengawas2Input(e.target.value)}
                    placeholder="Nama Pengawas 2 & Gelar"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* 7. Catatan Kejadian Khusus */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Catatan Kejadian Khusus Selama Ujian
                  </label>
                  <textarea
                    rows={2}
                    value={catatanKejadian}
                    onChange={(e) => setCatatanKejadian(e.target.value)}
                    placeholder="Misal: Ujian berjalan tertib, aman, dan lancar. 1 siswa izin sakit."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* 8. Target Jumlah Baris Presensi Per Kelas */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Target Baris Presensi Per Kelas
                  </label>
                  <select
                    value={targetRowsPerClass}
                    onChange={(e) => setTargetRowsPerClass(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={36}>36 Baris (Standar Ujian / Kelas)</option>
                    <option value={30}>30 Baris</option>
                    <option value={40}>40 Baris</option>
                    <option value={0}>Sesuai Jumlah Siswa Aktif</option>
                  </select>
                </div>

                {/* 9. Ukuran Kertas Dokumen */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Ukuran Kertas Cetak
                  </label>
                  <select
                    value={selectedPaperSize}
                    onChange={(e) =>
                      setSelectedPaperSize(e.target.value as 'a4' | 'f4' | 'letter' | 'legal')
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="a4">A4 (210 x 297 mm)</option>
                    <option value="f4">F4 / Folio (210 x 330 mm)</option>
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>

                {/* 10. Checkboxes Lampiran & TTD / Stempel Digital */}
                <div className="md:col-span-2 flex flex-wrap gap-4 pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDaftarHadir}
                      onChange={(e) => setIncludeDaftarHadir(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Sertakan Lampiran Presensi / Daftar Hadir Siswa (Lengkap Paraf)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDigitalSignatures}
                      onChange={(e) => setShowDigitalSignatures(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Tampilkan TTD Digital Kepala Sekolah & Stempel Digital Resmi</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeKartuToken}
                      onChange={(e) => setIncludeKartuToken(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Sertakan Slip Kartu Token Ujian Per Sesi</span>
                  </label>
                </div>
              </div>

              {/* Statistical Badges */}
              {(() => {
                const totalList = config.students || [];
                const filteredByClass = totalList.filter(
                  (s) => selectedKelasFilter === 'ALL' || s.kelas === selectedKelasFilter
                );
                const activeCount = filteredByClass.filter((s) => s.isActive !== false).length;
                const inactiveCount = filteredByClass.filter((s) => s.isActive === false).length;

                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
                      <div className="text-xl font-black text-blue-800">{filteredByClass.length}</div>
                      <div className="text-[10px] font-bold text-blue-600 uppercase">Siswa Terdaftar</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                      <div className="text-xl font-black text-emerald-800">{activeCount}</div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase">Siswa Aktif (Hadir)</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                      <div className="text-xl font-black text-red-800">{inactiveCount}</div>
                      <div className="text-[10px] font-bold text-red-600 uppercase">Siswa Non-Aktif (Absen)</div>
                    </div>
                  </div>
                );
              })()}

              {/* Table Pratinjau Siswa Aktif */}
              <div>
                <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Pratinjau Rincian Siswa yang Dicetak:</span>
                  <span className="text-[11px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                    {
                      (config.students || []).filter((s) => {
                        if (selectedKelasFilter !== 'ALL' && s.kelas !== selectedKelasFilter)
                          return false;
                        if (studentStatusFilter === 'ACTIVE' && s.isActive === false) return false;
                        if (studentStatusFilter === 'INACTIVE' && s.isActive !== false) return false;
                        return true;
                      }).length
                    }{' '}
                    Siswa Terpilih
                  </span>
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 sticky top-0 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 text-center w-10">No</th>
                        <th className="p-2.5">NIS / No. Peserta</th>
                        <th className="p-2.5">Nama Siswa</th>
                        <th className="p-2.5">Kelas</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {(config.students || [])
                        .filter((s) => {
                          if (selectedKelasFilter !== 'ALL' && s.kelas !== selectedKelasFilter)
                            return false;
                          if (studentStatusFilter === 'ACTIVE' && s.isActive === false) return false;
                          if (studentStatusFilter === 'INACTIVE' && s.isActive !== false) return false;
                          return true;
                        })
                        .map((st, i) => (
                          <tr key={st.id || i} className="hover:bg-slate-50">
                            <td className="p-2 text-center font-bold text-slate-500">{i + 1}</td>
                            <td className="p-2 font-mono font-bold">{st.nis}</td>
                            <td className="p-2 font-bold text-slate-800">{st.nama}</td>
                            <td className="p-2">{st.kelas}</td>
                            <td className="p-2 text-center">
                              {st.isActive !== false ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                  AKTIF
                                </span>
                              ) : (
                                <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                  NON-AKTIF
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowBeritaAcaraModal(false)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBeritaAcaraModal(false);
                  handlePrintFullBeritaAcara();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-black text-xs transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Cetak Berita Acara & Presensi (A4)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
