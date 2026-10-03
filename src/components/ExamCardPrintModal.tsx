import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  FileText,
  Filter,
  CheckSquare,
  Square,
  Users,
  GraduationCap,
  Building2,
  Search,
  CheckCircle2,
  UserCheck,
  Maximize2,
  Sliders,
  Move,
  RotateCw,
  Eye,
  EyeOff,
  RefreshCw,
  Upload,
  Grid,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';
import { StudentUser, TeacherUser, KopSekolahConfig } from '../types';

export interface ExamCardPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentUser[];
  teachers: TeacherUser[];
  kopSekolah?: KopSekolahConfig;
  currentExamToken?: string;
  onSaveKopSekolah?: (updatedKop: KopSekolahConfig) => void;
}

export const ExamCardPrintModal: React.FC<ExamCardPrintModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  kopSekolah,
  currentExamToken = 'CBT2026',
  onSaveKopSekolah
}) => {
  // Navigation Tabs inside Modal
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [settingsView, setSettingsView] = useState<'LIST' | 'SIZE' | 'SIGNATURE'>('LIST');

  // Filters for Data
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedKodeGuru, setSelectedKodeGuru] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Custom Card Header & Exam Title
  const [examTitle, setExamTitle] = useState<string>('KARTU PESERTA UJIAN BERBASIS KOMPUTER (CBT)');
  const [tahunPelajaran, setTahunPelajaran] = useState<string>('2025/2026');

  // Selected Item IDs for Cards
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  // 1. CARD SIZE PRESET & LAYOUT CONFIG
  const [cardPresetSize, setCardPresetSize] = useState<'B8' | 'B7' | 'STANDARD' | 'LARGE' | 'CUSTOM'>(() => {
    return kopSekolah?.cardPresetSize || 'STANDARD';
  });

  const [customCardWidthMm, setCustomCardWidthMm] = useState<number>(kopSekolah?.customCardWidthMm || 120);
  const [customCardHeightMm, setCustomCardHeightMm] = useState<number>(kopSekolah?.customCardHeightMm || 80);
  const [customGridColumns, setCustomGridColumns] = useState<number>(kopSekolah?.customGridColumns || 2);
  const [customFontSizePx, setCustomFontSizePx] = useState<number>(11);
  const [photoBoxType, setPhotoBoxType] = useState<'2x3' | '3x4' | 'NONE'>('2x3');

  // 2. HEADMASTER TTD & STEMPEL PRECISION CONTROLS
  const [showTtd, setShowTtd] = useState<boolean>(kopSekolah?.showTtd !== false);
  const [ttdImg, setTtdImg] = useState<string>(kopSekolah?.ttdKepalaSekolah || '');
  const [ttdOffsetX, setTtdOffsetX] = useState<number>(kopSekolah?.ttdOffsetX ?? 0);
  const [ttdOffsetY, setTtdOffsetY] = useState<number>(kopSekolah?.ttdOffsetY ?? -12);
  const [ttdScale, setTtdScale] = useState<number>(kopSekolah?.ttdScale ?? 45);
  const [ttdRotate, setTtdRotate] = useState<number>(kopSekolah?.ttdRotate ?? 0);

  const [showStempel, setShowStempel] = useState<boolean>(kopSekolah?.showStempel !== false);
  const [stempelImg, setStempelImg] = useState<string>(kopSekolah?.stempelSekolah || '');
  const [stempelOffsetX, setStempelOffsetX] = useState<number>(kopSekolah?.stempelOffsetX ?? -25);
  const [stempelOffsetY, setStempelOffsetY] = useState<number>(kopSekolah?.stempelOffsetY ?? -15);
  const [stempelScale, setStempelScale] = useState<number>(kopSekolah?.stempelScale ?? 65);
  const [stempelOpacity, setStempelOpacity] = useState<number>(kopSekolah?.stempelOpacity ?? 0.8);

  const [showHeadmasterNip, setShowHeadmasterNip] = useState<boolean>(true);

  // Sync props when kopSekolah changes
  useEffect(() => {
    if (kopSekolah) {
      if (kopSekolah.cardPresetSize) setCardPresetSize(kopSekolah.cardPresetSize);
      if (kopSekolah.ttdKepalaSekolah) setTtdImg(kopSekolah.ttdKepalaSekolah);
      if (kopSekolah.stempelSekolah) setStempelImg(kopSekolah.stempelSekolah);
      if (typeof kopSekolah.ttdOffsetX === 'number') setTtdOffsetX(kopSekolah.ttdOffsetX);
      if (typeof kopSekolah.ttdOffsetY === 'number') setTtdOffsetY(kopSekolah.ttdOffsetY);
      if (typeof kopSekolah.ttdScale === 'number') setTtdScale(kopSekolah.ttdScale);
      if (typeof kopSekolah.ttdRotate === 'number') setTtdRotate(kopSekolah.ttdRotate);
      if (typeof kopSekolah.stempelOffsetX === 'number') setStempelOffsetX(kopSekolah.stempelOffsetX);
      if (typeof kopSekolah.stempelOffsetY === 'number') setStempelOffsetY(kopSekolah.stempelOffsetY);
      if (typeof kopSekolah.stempelScale === 'number') setStempelScale(kopSekolah.stempelScale);
      if (typeof kopSekolah.stempelOpacity === 'number') setStempelOpacity(kopSekolah.stempelOpacity);
    }
  }, [kopSekolah]);

  if (!isOpen) return null;

  // Extract unique classes & kodeGurus
  const uniqueClasses = Array.from(new Set(students.map((s) => s.kelas || 'X').filter(Boolean))).sort();
  const availableKodeGurus = Array.from(
    new Set([
      ...students.map((s) => s.kodeGuru).filter(Boolean),
      ...teachers.map((t) => t.kodeGuru).filter(Boolean)
    ])
  ).sort();

  // Filtered Data
  const filteredStudents = students.filter((s) => {
    if (selectedClass !== 'ALL' && s.kelas !== selectedClass) return false;
    if (selectedKodeGuru !== 'ALL' && (s.kodeGuru || 'GURU01') !== selectedKodeGuru) return false;
    if (statusFilter === 'ACTIVE' && s.isActive === false) return false;
    if (statusFilter === 'INACTIVE' && s.isActive !== false) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNis = s.nis?.toLowerCase().includes(q);
      const matchName = s.nama?.toLowerCase().includes(q);
      const matchKelas = s.kelas?.toLowerCase().includes(q);
      if (!matchNis && !matchName && !matchKelas) return false;
    }
    return true;
  });

  const filteredTeachers = teachers.filter((t) => {
    if (selectedKodeGuru !== 'ALL' && (t.kodeGuru || 'GURU01') !== selectedKodeGuru) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNip = t.nip?.toLowerCase().includes(q);
      const matchName = t.nama?.toLowerCase().includes(q);
      const matchMapel = t.mapel?.toLowerCase().includes(q);
      if (!matchNip && !matchName && !matchMapel) return false;
    }
    return true;
  });

  // Toggle selection helpers
  const toggleSelectAllStudents = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedStudentIds.includes(id));
    if (isAllSelected) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...filteredIds])));
    }
  };

  const toggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((item) => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const toggleSelectAllTeachers = () => {
    const filteredIds = filteredTeachers.map((t) => t.id);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedTeacherIds.includes(id));
    if (isAllSelected) {
      setSelectedTeacherIds(selectedTeacherIds.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedTeacherIds(Array.from(new Set([...selectedTeacherIds, ...filteredIds])));
    }
  };

  const toggleSelectTeacher = (id: string) => {
    if (selectedTeacherIds.includes(id)) {
      setSelectedTeacherIds(selectedTeacherIds.filter((item) => item !== id));
    } else {
      setSelectedTeacherIds([...selectedTeacherIds, id]);
    }
  };

  // Upload Handlers for TTD & Stempel
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>, type: 'TTD' | 'STEMPEL') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Format file harus berupa gambar (PNG, JPG, WEBP)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (rawResult) {
        if (type === 'TTD') {
          setTtdImg(rawResult);
        } else {
          setStempelImg(rawResult);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save Config Helper
  const handleSaveKopSettings = () => {
    const updatedKop: KopSekolahConfig = {
      ...(kopSekolah || {}),
      namaSekolah: kopSekolah?.namaSekolah || 'SMA NEGERI 1 INDONESIA',
      ttdKepalaSekolah: ttdImg,
      stempelSekolah: stempelImg,
      ttdOffsetX,
      ttdOffsetY,
      ttdScale,
      ttdRotate,
      stempelOffsetX,
      stempelOffsetY,
      stempelScale,
      stempelOpacity,
      showStempel,
      showTtd,
      cardPresetSize,
      customCardWidthMm,
      customCardHeightMm,
      customGridColumns,
    };

    if (onSaveKopSekolah) {
      onSaveKopSekolah(updatedKop);
    }
  };

  // Get Card Size Specification according to Preset
  const getCardSpecs = () => {
    switch (cardPresetSize) {
      case 'B8':
        return {
          title: 'Standar B8 / ID Card Tag (8.5 x 5.4 cm)',
          badge: '10 Kartu / A4 (Grid 2 Kolom x 5 Baris)',
          cols: 2,
          minHeightPx: 180,
          fontSizePx: 9.5,
          paddingPx: 6,
          photoLabel: 'Foto 2x3',
          desc: 'Ukuran Gantungan ID Card Ringkas'
        };
      case 'B7':
        return {
          title: 'Standar B7 / A7 (10.5 x 7.4 cm)',
          badge: '8 Kartu / A4 (Grid 2 Kolom x 4 Baris)',
          cols: 2,
          minHeightPx: 215,
          fontSizePx: 10.5,
          paddingPx: 8,
          photoLabel: 'Foto 2x3',
          desc: 'Ukuran Kartu Ujian Sedang Standar Sekolah'
        };
      case 'LARGE':
        return {
          title: 'Standar Kartu Besar / A6 (14 x 9.5 cm)',
          badge: '4 Kartu / A4 (Grid 2 Kolom x 2 Baris)',
          cols: 2,
          minHeightPx: 340,
          fontSizePx: 12.5,
          paddingPx: 14,
          photoLabel: 'Pas Foto 3x4',
          desc: 'Teks Ekstra Besar, Pas Foto Terbaca Sangat Jelas'
        };
      case 'CUSTOM':
        return {
          title: 'Custom Size (Manual)',
          badge: `${customGridColumns} Kolom (${customCardWidthMm}x${customCardHeightMm} mm)`,
          cols: customGridColumns,
          minHeightPx: Math.max(120, Math.round(customCardHeightMm * 3.2)),
          fontSizePx: customFontSizePx,
          paddingPx: 10,
          photoLabel: photoBoxType === 'NONE' ? '' : photoBoxType === '3x4' ? 'Foto 3x4' : 'Foto 2x3',
          desc: 'Bebas Atur Lebar, Tinggi, Jumlah Kolom & Font'
        };
      case 'STANDARD':
      default:
        return {
          title: 'Sedang CBT (12 x 8 cm)',
          badge: '6 Kartu / A4 (Grid 2 Kolom x 3 Baris)',
          cols: 2,
          minHeightPx: 250,
          fontSizePx: 11,
          paddingPx: 10,
          photoLabel: 'Foto 2x3',
          desc: 'Rekomendasi Utama Layout Ujian Proporsional'
        };
    }
  };

  // Generate Print Window
  const handlePrintExamCards = () => {
    handleSaveKopSettings();

    const isStudent = activeTab === 'student';
    const itemsToPrint = isStudent
      ? (selectedStudentIds.length > 0 ? students.filter((s) => selectedStudentIds.includes(s.id)) : filteredStudents)
      : (selectedTeacherIds.length > 0 ? teachers.filter((t) => selectedTeacherIds.includes(t.id)) : filteredTeachers);

    if (itemsToPrint.length === 0) {
      alert('Tidak ada data yang dipilih untuk dicetak!');
      return;
    }

    const schoolName = kopSekolah?.namaSekolah || 'SMA NEGERI 1 INDONESIA';
    const dinas = kopSekolah?.dinas || 'DINAS PENDIDIKAN PROVINSI';
    const alamat = kopSekolah?.alamat || 'Jl. Pendidikan No. 1, Kota Edukasi';
    const teleponWeb = kopSekolah?.teleponWeb || 'Telp: (021) 555-0199 | Website: www.sekolah.sch.id';
    const headmasterName = kopSekolah?.namaKepalaSekolah || 'Dr. H. Kepala Sekolah, M.Si';
    const headmasterNip = kopSekolah?.nipKepalaSekolah || '197203101998021001';
    const kotaTanggal = kopSekolah?.kotaTanggal || 'Jakarta, 10 Agustus 2026';

    const cardSpecs = getCardSpecs();

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak! Pastikan popup dibolehkan di browser Anda.');
      return;
    }

    const cardsHtml = itemsToPrint.map((item) => {
      const renderPhotoBox = () => {
        if (photoBoxType === 'NONE' && cardPresetSize === 'CUSTOM') return '';
        const label = cardSpecs.photoLabel || 'Pas Foto<br/>2 x 3';
        return `<div class="photo-box">${label}</div>`;
      };

      const renderSignatureSpace = () => `
        <div class="signature-space">
          ${showStempel && stempelImg ? `
            <img src="${stempelImg}" class="stempel-img" style="
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%) translate(${stempelOffsetX}px, ${stempelOffsetY}px);
              width: ${stempelScale}px;
              height: auto;
              opacity: ${stempelOpacity};
              pointer-events: none;
              z-index: 1;
            " />
          ` : ''}
          ${showTtd && ttdImg ? `
            <img src="${ttdImg}" class="ttd-img" style="
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%) translate(${ttdOffsetX}px, ${ttdOffsetY}px) rotate(${ttdRotate}deg);
              height: ${ttdScale}px;
              width: auto;
              z-index: 2;
            " />
          ` : ''}
        </div>
      `;

      if (isStudent) {
        const student = item as StudentUser;
        return `
          <div class="exam-card">
            <div class="card-header">
              <div class="dinas">${dinas.toUpperCase()}</div>
              <div class="school-name">${schoolName.toUpperCase()}</div>
              <div class="address">${alamat} - ${teleponWeb}</div>
              <div class="card-title-badge">${examTitle} - TP ${tahunPelajaran}</div>
            </div>
            <div class="card-body">
              <table class="card-table">
                <tr>
                  <td class="label">NIS / No. Peserta</td>
                  <td class="colon">:</td>
                  <td class="value font-mono font-bold">${student.nis}</td>
                </tr>
                <tr>
                  <td class="label">Nama Lengkap</td>
                  <td class="colon">:</td>
                  <td class="value font-bold">${student.nama.toUpperCase()}</td>
                </tr>
                <tr>
                  <td class="label">Kelas / Rombel</td>
                  <td class="colon">:</td>
                  <td class="value">${student.kelas}</td>
                </tr>
                <tr>
                  <td class="label">Kode Guru / Sesi</td>
                  <td class="colon">:</td>
                  <td class="value font-mono">${student.kodeGuru || 'GURU01'}</td>
                </tr>
                <tr>
                  <td class="label">Default Token</td>
                  <td class="colon">:</td>
                  <td class="value font-mono font-bold text-indigo">${currentExamToken}</td>
                </tr>
              </table>
            </div>
            <div class="card-footer">
              ${renderPhotoBox()}
              <div class="signature-box">
                <div>${kotaTanggal}</div>
                <div>Kepala Sekolah,</div>
                ${renderSignatureSpace()}
                <div class="sign-name">${headmasterName}</div>
                ${showHeadmasterNip ? `<div class="sign-nip">NIP. ${headmasterNip}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      } else {
        const teacher = item as TeacherUser;
        return `
          <div class="exam-card teacher-card">
            <div class="card-header">
              <div class="dinas">${dinas.toUpperCase()}</div>
              <div class="school-name">${schoolName.toUpperCase()}</div>
              <div class="address">${alamat} - ${teleponWeb}</div>
              <div class="card-title-badge bg-amber">KARTU AKSES GURU PENGAMPU / PROKTOR</div>
            </div>
            <div class="card-body">
              <table class="card-table">
                <tr>
                  <td class="label">Username Akses</td>
                  <td class="colon">:</td>
                  <td class="value font-mono font-bold">${teacher.nip}</td>
                </tr>
                <tr>
                  <td class="label">Nama Guru</td>
                  <td class="colon">:</td>
                  <td class="value font-bold">${teacher.nama.toUpperCase()}</td>
                </tr>
                <tr>
                  <td class="label">Mata Pelajaran</td>
                  <td class="colon">:</td>
                  <td class="value">${teacher.mapel}</td>
                </tr>
                <tr>
                  <td class="label">Kode Guru Unik</td>
                  <td class="colon">:</td>
                  <td class="value font-mono font-bold text-amber">${teacher.kodeGuru || 'GURU01'}</td>
                </tr>
                <tr>
                  <td class="label">Batas Hak Akses</td>
                  <td class="colon">:</td>
                  <td class="value">Manajemen Soal & Token Mandiri</td>
                </tr>
              </table>
            </div>
            <div class="card-footer">
              ${renderPhotoBox()}
              <div class="signature-box">
                <div>${kotaTanggal}</div>
                <div>Kepala Sekolah,</div>
                ${renderSignatureSpace()}
                <div class="sign-name">${headmasterName}</div>
                ${showHeadmasterNip ? `<div class="sign-nip">NIP. ${headmasterNip}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      }
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Kartu Ujian CBT - ${isStudent ? 'Siswa' : 'Guru'}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, sans-serif;
            background: #fff;
            color: #1e293b;
            padding: 4mm;
          }
          .no-print-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #0f172a;
            color: #fff;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          .no-print-bar h3 {
            font-size: 15px;
            font-weight: bold;
          }
          .no-print-bar button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .no-print-bar button:hover {
            background: #1d4ed8;
          }
          .card-grid {
            display: grid;
            grid-template-columns: repeat(${cardSpecs.cols}, 1fr);
            gap: 10px;
            margin-top: 50px;
          }
          @media print {
            .no-print-bar {
              display: none !important;
            }
            .card-grid {
              margin-top: 0;
            }
            .exam-card {
              page-break-inside: avoid;
            }
          }
          .exam-card {
            border: 2px solid #334155;
            border-radius: 8px;
            padding: ${cardSpecs.paddingPx}px;
            background: #ffffff;
            font-size: ${cardSpecs.fontSizePx}px;
            position: relative;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: ${cardSpecs.minHeightPx}px;
          }
          .teacher-card {
            border-color: #d97706;
          }
          .card-header {
            text-align: center;
            border-bottom: 2px double #334155;
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          .dinas {
            font-size: 7.5px;
            font-weight: bold;
            color: #475569;
            letter-spacing: 0.5px;
          }
          .school-name {
            font-size: 11.5px;
            font-weight: 900;
            color: #0f172a;
            margin: 1px 0;
          }
          .address {
            font-size: 7px;
            color: #64748b;
          }
          .card-title-badge {
            background: #1e293b;
            color: #fff;
            font-size: 7.5px;
            font-weight: bold;
            padding: 2.5px 6px;
            border-radius: 4px;
            margin-top: 3px;
            display: inline-block;
            letter-spacing: 0.3px;
          }
          .bg-amber {
            background: #b45309 !important;
          }
          .card-body {
            flex-grow: 1;
            margin-bottom: 4px;
          }
          .card-table {
            width: 100%;
            border-collapse: collapse;
          }
          .card-table td {
            padding: 2px 0;
            vertical-align: top;
          }
          .card-table .label {
            width: 34%;
            color: #475569;
            font-weight: 600;
          }
          .card-table .colon {
            width: 4%;
            text-align: center;
            color: #475569;
          }
          .card-table .value {
            width: 62%;
            color: #0f172a;
          }
          .font-mono {
            font-family: 'Courier New', Courier, monospace;
          }
          .font-bold {
            font-weight: bold;
          }
          .text-indigo {
            color: #4338ca;
          }
          .text-amber {
            color: #b45309;
          }
          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px dashed #cbd5e1;
            padding-top: 4px;
          }
          .photo-box {
            width: 50px;
            height: 65px;
            border: 1px dashed #94a3b8;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
            background: #f8fafc;
          }
          .signature-box {
            text-align: center;
            font-size: 8px;
            color: #334155;
            width: 135px;
          }
          .signature-space {
            position: relative;
            height: 38px;
            margin: 2px 0;
          }
          .sign-name {
            font-weight: bold;
            text-decoration: underline;
          }
          .sign-nip {
            font-size: 7px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <h3>🖨️ Cetak Kartu Ujian CBT (${itemsToPrint.length} Kartu) - Ukuran: ${cardSpecs.title}</h3>
          <div>
            <button onclick="window.print()">Simpan PDF / Cetak Kartu</button>
          </div>
        </div>
        <div class="card-grid">
          ${cardsHtml}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const cardSpecs = getCardSpecs();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <Printer className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-white flex items-center gap-2">
                Cetak Kartu Ujian & Akses Users
              </h2>
              <p className="text-xs text-indigo-200">
                Pilih ukuran kartu standar, atur presisi TTD Kepala Sekolah & Stempel, lalu cetak PDF.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Top Control Bar Tabs */}
        <div className="bg-slate-100 p-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2 shrink-0">
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setSettingsView('LIST')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                settingsView === 'LIST'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" /> 1. Pilih Peserta Ujian
            </button>
            <button
              type="button"
              onClick={() => setSettingsView('SIZE')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                settingsView === 'SIZE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-4 h-4" /> 2. Ukuran Kartu Ujian ({cardPresetSize})
            </button>
            <button
              type="button"
              onClick={() => setSettingsView('SIGNATURE')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                settingsView === 'SIGNATURE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Sliders className="w-4 h-4" /> 3. Presisi TTD & Stempel
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintExamCards}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer text-xs"
          >
            <Printer className="w-4 h-4" /> Cetak Sekarang (
            {activeTab === 'student'
              ? selectedStudentIds.length > 0
                ? `${selectedStudentIds.length} Terpilih`
                : `${filteredStudents.length} Siswa`
              : selectedTeacherIds.length > 0
              ? `${selectedTeacherIds.length} Terpilih`
              : `${filteredTeachers.length} Guru`}
            )
          </button>
        </div>

        {/* Modal Main Content Panel */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* ================= VIEW 1: DATA LIST & FILTERS ================= */}
          {settingsView === 'LIST' && (
            <>
              {/* User Type Switcher */}
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('student')}
                    className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'student'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Kartu Ujian Siswa ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('teacher')}
                    className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'teacher'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" /> Kartu Akses Guru ({teachers.length})
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Ukuran Aktif: <b className="text-indigo-600">{cardSpecs.title}</b>
                </div>
              </div>

              {/* Card Title Customizer */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Judul Kartu Ujian:</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Judul Ujian..."
                    className="w-full bg-white px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tahun Pelajaran (TP):</label>
                  <input
                    type="text"
                    value={tahunPelajaran}
                    onChange={(e) => setTahunPelajaran(e.target.value)}
                    placeholder="2025/2026..."
                    className="w-full bg-white px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Filter Bar */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-gray-700">Filter Data:</span>

                  {activeTab === 'student' && (
                    <>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="bg-slate-50 border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-800 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">Semua Kelas ({uniqueClasses.length})</option>
                        {uniqueClasses.map((k) => (
                          <option key={k} value={k}>
                            Kelas {k}
                          </option>
                        ))}
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-slate-50 border border-gray-300 rounded-lg px-2.5 py-1.5 font-bold text-gray-800 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">Semua Status Ujian</option>
                        <option value="ACTIVE">🟢 Aktif Ujian</option>
                        <option value="INACTIVE">🔴 Nonaktif Ujian</option>
                      </select>
                    </>
                  )}

                  <select
                    value={selectedKodeGuru}
                    onChange={(e) => setSelectedKodeGuru(e.target.value)}
                    className="bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-amber-900 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Kode Guru</option>
                    {availableKodeGurus.map((kg) => (
                      <option key={kg} value={kg}>
                        {kg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeTab === 'student' ? 'Cari NIS / Nama / Kelas...' : 'Cari Username / Nama / Mapel...'}
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Data Table */}
              {activeTab === 'student' ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-3 border-b border-gray-200 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSelectAllStudents}
                        className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-md border border-gray-300"
                      >
                        {filteredStudents.length > 0 &&
                        filteredStudents.every((s) => selectedStudentIds.includes(s.id)) ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                        <span>Centang Semua Terfilter</span>
                      </button>
                      <span className="text-gray-500 font-medium">
                        Menampilkan <b>{filteredStudents.length}</b> siswa
                      </span>
                    </div>

                    {selectedStudentIds.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full text-[11px] border border-indigo-200">
                        {selectedStudentIds.length} Siswa Dicentang
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5 w-10 text-center">Pilih</th>
                          <th className="p-2.5 w-10">No</th>
                          <th className="p-2.5">NIS / No. Peserta</th>
                          <th className="p-2.5">Nama Siswa</th>
                          <th className="p-2.5">Kelas</th>
                          <th className="p-2.5 text-center">Kode Guru</th>
                          <th className="p-2.5 text-center">Status Ujian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-gray-400">
                              Tidak ada siswa ditemukan.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((s, idx) => {
                            const isChecked = selectedStudentIds.includes(s.id);
                            return (
                              <tr
                                key={s.id}
                                onClick={() => toggleSelectStudent(s.id)}
                                className={`hover:bg-slate-50 cursor-pointer transition ${
                                  isChecked ? 'bg-indigo-50/50' : ''
                                }`}
                              >
                                <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSelectStudent(s.id)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                                  />
                                </td>
                                <td className="p-2.5 text-gray-400 font-medium">{idx + 1}</td>
                                <td className="p-2.5 font-mono font-bold text-slate-800">{s.nis}</td>
                                <td className="p-2.5 font-bold text-gray-900">{s.nama}</td>
                                <td className="p-2.5">
                                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold border border-indigo-100">
                                    {s.kelas}
                                  </span>
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-amber-800">
                                  {s.kodeGuru || 'GURU01'}
                                </td>
                                <td className="p-2.5 text-center font-bold">
                                  {s.isActive !== false ? (
                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      🟢 Aktif
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      🔴 Nonaktif
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-3 border-b border-gray-200 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSelectAllTeachers}
                        className="font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-md border border-gray-300"
                      >
                        {filteredTeachers.length > 0 &&
                        filteredTeachers.every((t) => selectedTeacherIds.includes(t.id)) ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                        <span>Centang Semua Terfilter</span>
                      </button>
                      <span className="text-gray-500 font-medium">
                        Menampilkan <b>{filteredTeachers.length}</b> guru
                      </span>
                    </div>

                    {selectedTeacherIds.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full text-[11px] border border-indigo-200">
                        {selectedTeacherIds.length} Guru Dicentang
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5 w-10 text-center">Pilih</th>
                          <th className="p-2.5 w-10">No</th>
                          <th className="p-2.5">Username</th>
                          <th className="p-2.5">Nama Guru</th>
                          <th className="p-2.5">Mata Pelajaran</th>
                          <th className="p-2.5 text-center">Kode Guru</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTeachers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-gray-400">
                              Tidak ada guru ditemukan.
                            </td>
                          </tr>
                        ) : (
                          filteredTeachers.map((t, idx) => {
                            const isChecked = selectedTeacherIds.includes(t.id);
                            return (
                              <tr
                                key={t.id}
                                onClick={() => toggleSelectTeacher(t.id)}
                                className={`hover:bg-slate-50 cursor-pointer transition ${
                                  isChecked ? 'bg-indigo-50/50' : ''
                                }`}
                              >
                                <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSelectTeacher(t.id)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                                  />
                                </td>
                                <td className="p-2.5 text-gray-400 font-medium">{idx + 1}</td>
                                <td className="p-2.5 font-mono font-bold text-slate-800">{t.nip}</td>
                                <td className="p-2.5 font-bold text-gray-900">{t.nama}</td>
                                <td className="p-2.5 font-semibold text-indigo-700">{t.mapel}</td>
                                <td className="p-2.5 text-center font-mono font-bold text-amber-800">
                                  {t.kodeGuru || 'GURU01'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= VIEW 2: PILIHAN UKURAN KARTU STANDAR UJIAN ================= */}
          {settingsView === 'SIZE' && (
            <div className="space-y-5">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                <h3 className="font-extrabold text-indigo-900 text-sm flex items-center gap-2">
                  <Grid className="w-4 h-4 text-indigo-600" /> Pilihan Ukuran Kartu Sesuai Standar Ujian
                </h3>
                <p className="text-xs text-indigo-700 mt-1">
                  Sesuaikan ukuran fisik kartu peserta yang akan dicetak pada kertas A4 (B8 ID Card, B7, Sedang CBT, atau Kartu Besar).
                </p>
              </div>

              {/* Grid Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* 1. B8 ID CARD */}
                <div
                  onClick={() => setCardPresetSize('B8')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    cardPresetSize === 'B8'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-300'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-md">
                        B8 / ID Card
                      </span>
                      {cardPresetSize === 'B8' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">8.5 x 5.4 cm</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      10 Kartu per lembar A4 (2 Kolom x 5 Baris)
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                    💡 <i>Pas di Plastik Gantungan ID Card / Id Tag Siswa</i>
                  </div>
                </div>

                {/* 2. B7 / A7 */}
                <div
                  onClick={() => setCardPresetSize('B7')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    cardPresetSize === 'B7'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-300'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-md">
                        B7 / A7
                      </span>
                      {cardPresetSize === 'B7' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">10.5 x 7.4 cm</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      8 Kartu per lembar A4 (2 Kolom x 4 Baris)
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                    💡 <i>Ukuran Standar Kartu Ujian Sekolah Menengah</i>
                  </div>
                </div>

                {/* 3. STANDARD CBT */}
                <div
                  onClick={() => setCardPresetSize('STANDARD')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    cardPresetSize === 'STANDARD'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-300'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="absolute -top-2.5 right-3 bg-amber-400 text-amber-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    ⭐ REKOMENDASI
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-indigo-900 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-md">
                        Sedang CBT
                      </span>
                      {cardPresetSize === 'STANDARD' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">12 x 8 cm</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      6 Kartu per lembar A4 (2 Kolom x 3 Baris)
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-indigo-900 font-semibold">
                    💡 <i>Format Paling Jelas & Proporsional Dibaca</i>
                  </div>
                </div>

                {/* 4. LARGE / A6 */}
                <div
                  onClick={() => setCardPresetSize('LARGE')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    cardPresetSize === 'LARGE'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-300'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-md">
                        Kartu Besar / A6
                      </span>
                      {cardPresetSize === 'LARGE' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">14 x 9.5 cm</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      4 Kartu per lembar A4 (2 Kolom x 2 Baris)
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                    💡 <i>Teks Ekstra Besar Pas Foto 3x4 / 4x6</i>
                  </div>
                </div>

                {/* 5. CUSTOM */}
                <div
                  onClick={() => setCardPresetSize('CUSTOM')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between sm:col-span-2 md:col-span-2 ${
                    cardPresetSize === 'CUSTOM'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-300'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-purple-900 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-md">
                        🛠️ Custom Mode (Manual)
                      </span>
                      {cardPresetSize === 'CUSTOM' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Atur Dimensi & Grid Sesuai Kebutuhan</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Tentukan sendiri lebar kartu (mm), tinggi kartu (mm), jumlah kolom, serta ukuran font.
                    </p>
                  </div>

                  {cardPresetSize === 'CUSTOM' && (
                    <div className="mt-4 pt-3 border-t border-indigo-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="font-bold text-gray-700 block mb-0.5">Lebar (mm):</label>
                        <input
                          type="number"
                          value={customCardWidthMm}
                          onChange={(e) => setCustomCardWidthMm(Number(e.target.value))}
                          className="w-full bg-white border border-gray-300 px-2 py-1 rounded-md font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-0.5">Tinggi (mm):</label>
                        <input
                          type="number"
                          value={customCardHeightMm}
                          onChange={(e) => setCustomCardHeightMm(Number(e.target.value))}
                          className="w-full bg-white border border-gray-300 px-2 py-1 rounded-md font-bold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-0.5">Jumlah Kolom:</label>
                        <select
                          value={customGridColumns}
                          onChange={(e) => setCustomGridColumns(Number(e.target.value))}
                          className="w-full bg-white border border-gray-300 px-2 py-1 rounded-md font-bold text-slate-800"
                        >
                          <option value={1}>1 Kolom per Baris</option>
                          <option value={2}>2 Kolom per Baris</option>
                          <option value={3}>3 Kolom per Baris</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-0.5">Ukuran Font (px):</label>
                        <input
                          type="number"
                          value={customFontSizePx}
                          onChange={(e) => setCustomFontSizePx(Number(e.target.value))}
                          className="w-full bg-white border border-gray-300 px-2 py-1 rounded-md font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Specs Banner */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                    <Maximize2 className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-indigo-200">UKURAN KARTU DIPILIH</h5>
                    <p className="font-extrabold text-sm text-white">{cardSpecs.title}</p>
                  </div>
                </div>
                <div className="bg-indigo-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg border border-indigo-400/30">
                  {cardSpecs.badge}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: PRESISI TTD KEPALA SEKOLAH & STEMPEL ================= */}
          {settingsView === 'SIGNATURE' && (
            <div className="space-y-5">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-600" /> Penyesuaian Presisi TTD Kepala Sekolah & Stempel
                </h3>
                <p className="text-xs text-amber-800 mt-1">
                  Atur letak posisi horisontal (X), vertikal (Y), ukuran skala, dan rotasi TTD digital serta stempel sekolah dengan presisi milimeter.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT SLIDERS & CONTROLS (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* UPLOAD IMAGES SECTION */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Upload TTD Box */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-slate-800 flex items-center gap-1">
                          ✍️ Gambar TTD Digital
                        </label>
                        {ttdImg && (
                          <button
                            type="button"
                            onClick={() => setTtdImg('')}
                            className="text-[10px] text-red-600 hover:text-red-800 font-bold flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        )}
                      </div>
                      <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white p-2.5 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer min-h-[70px]">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={(e) => handleUploadImage(e, 'TTD')}
                          className="hidden"
                        />
                        <Upload className="w-4 h-4 text-indigo-600 mb-1" />
                        <span className="font-bold text-indigo-700 text-[11px]">
                          {ttdImg ? '✓ TTD Terunggah (Klik untuk Ganti)' : 'Upload TTD Transparan (PNG)'}
                        </span>
                      </label>
                    </div>

                    {/* Upload Stempel Box */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-slate-800 flex items-center gap-1">
                          🏛️ Gambar Stempel Sekolah
                        </label>
                        {stempelImg && (
                          <button
                            type="button"
                            onClick={() => setStempelImg('')}
                            className="text-[10px] text-red-600 hover:text-red-800 font-bold flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        )}
                      </div>
                      <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white p-2.5 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer min-h-[70px]">
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={(e) => handleUploadImage(e, 'STEMPEL')}
                          className="hidden"
                        />
                        <Upload className="w-4 h-4 text-indigo-600 mb-1" />
                        <span className="font-bold text-indigo-700 text-[11px]">
                          {stempelImg ? '✓ Stempel Terunggah (Klik Ganti)' : 'Upload Stempel Sekolah (PNG)'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* TTD PRECISION SLIDERS */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-3 text-xs shadow-2xs">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Move className="w-4 h-4 text-indigo-600" /> Presisi Posisi Tanda Tangan
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setTtdOffsetX(0);
                          setTtdOffsetY(-12);
                          setTtdScale(45);
                          setTtdRotate(0);
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Reset TTD
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>Geser Horisontal (X):</span>
                          <span className="font-mono text-indigo-600">{ttdOffsetX}px</span>
                        </div>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={ttdOffsetX}
                          onChange={(e) => setTtdOffsetX(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>Geser Vertikal (Y):</span>
                          <span className="font-mono text-indigo-600">{ttdOffsetY}px</span>
                        </div>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={ttdOffsetY}
                          onChange={(e) => setTtdOffsetY(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>Ukuran Tinggi TTD:</span>
                          <span className="font-mono text-indigo-600">{ttdScale}px</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="100"
                          value={ttdScale}
                          onChange={(e) => setTtdScale(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>Sudut Rotasi TTD:</span>
                          <span className="font-mono text-indigo-600">{ttdRotate}°</span>
                        </div>
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          value={ttdRotate}
                          onChange={(e) => setTtdRotate(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* STEMPEL PRECISION SLIDERS */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-3 text-xs shadow-2xs">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Move className="w-4 h-4 text-amber-600" /> Presisi Posisi Stempel
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStempelOffsetX(-25);
                          setStempelOffsetY(-15);
                          setStempelScale(65);
                          setStempelOpacity(0.8);
                        }}
                        className="text-[10px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Reset Stempel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>Geser Horisontal (X):</span>
                          <span className="font-mono text-amber-700">{stempelOffsetX}px</span>
                        </div>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={stempelOffsetX}
                          onChange={(e) => setStempelOffsetX(Number(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>Geser Vertikal (Y):</span>
                          <span className="font-mono text-amber-700">{stempelOffsetY}px</span>
                        </div>
                        <input
                          type="range"
                          min="-80"
                          max="80"
                          value={stempelOffsetY}
                          onChange={(e) => setStempelOffsetY(Number(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>Ukuran Stempel:</span>
                          <span className="font-mono text-amber-700">{stempelScale}px</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="120"
                          value={stempelScale}
                          onChange={(e) => setStempelScale(Number(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold text-gray-700 mb-1">
                          <span>Transparansi Stempel:</span>
                          <span className="font-mono text-amber-700">{Math.round(stempelOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.05"
                          value={stempelOpacity}
                          onChange={(e) => setStempelOpacity(Number(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT LIVE PREVIEW CARD (5 Cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="bg-slate-900 text-white p-3 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-extrabold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Live Visual Preview TTD & Stempel
                    </span>
                    <span className="text-[10px] text-slate-400">Real-time Rendering</span>
                  </div>

                  {/* CARD SIMULATION CONTAINER */}
                  <div className="border-2 border-slate-300 rounded-2xl p-4 bg-white shadow-md space-y-3 font-sans text-xs">
                    <div className="text-center border-b border-slate-200 pb-2">
                      <div className="text-[9px] font-bold text-slate-500 uppercase">
                        {kopSekolah?.dinas || 'DINAS PENDIDIKAN PROVINSI'}
                      </div>
                      <div className="font-black text-sm text-slate-900">
                        {kopSekolah?.namaSekolah || 'SMA NEGERI 1 INDONESIA'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {kopSekolah?.alamat || 'Jl. Pendidikan No. 1'}
                      </div>
                    </div>

                    <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 text-center font-bold text-[11px] text-slate-800">
                      KARTU PESERTA UJIAN BERBASIS KOMPUTER
                    </div>

                    {/* CARD FOOTER PREVIEW WITH LIVE SIGNATURE */}
                    <div className="pt-2 flex justify-between items-end border-t border-dashed border-slate-300">
                      <div className="w-12 h-16 border border-dashed border-slate-400 rounded bg-slate-50 flex items-center justify-center text-center text-[9px] text-slate-400 font-bold">
                        Pas Foto<br />2 x 3
                      </div>

                      <div className="w-44 text-center text-[10px] text-slate-800 space-y-0.5 relative">
                        <div>{kopSekolah?.kotaTanggal || 'Jakarta, 10 Agustus 2026'}</div>
                        <div className="font-semibold">Kepala Sekolah,</div>

                        {/* LIVE SIGNATURE RELATIVE CANVAS */}
                        <div className="relative h-14 my-1 w-full flex items-center justify-center overflow-visible">
                          {/* STEMPEL OVERLAY */}
                          {showStempel && (
                            stempelImg ? (
                              <img
                                src={stempelImg}
                                alt="Stempel Sekolah"
                                style={{
                                  position: 'absolute',
                                  left: '50%',
                                  top: '50%',
                                  transform: `translate(-50%, -50%) translate(${stempelOffsetX}px, ${stempelOffsetY}px)`,
                                  width: `${stempelScale}px`,
                                  height: 'auto',
                                  opacity: stempelOpacity,
                                  pointerEvents: 'none',
                                  zIndex: 1,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  position: 'absolute',
                                  left: '50%',
                                  top: '50%',
                                  transform: `translate(-50%, -50%) translate(${stempelOffsetX}px, ${stempelOffsetY}px)`,
                                  width: `${stempelScale}px`,
                                  height: `${stempelScale}px`,
                                  opacity: stempelOpacity,
                                  zIndex: 1,
                                }}
                                className="border-2 border-dashed border-amber-500 rounded-full flex items-center justify-center text-[9px] text-amber-700 font-bold bg-amber-50/50"
                              >
                                [STEMPEL]
                              </div>
                            )
                          )}

                          {/* TTD OVERLAY */}
                          {showTtd && (
                            ttdImg ? (
                              <img
                                src={ttdImg}
                                alt="TTD Kepala Sekolah"
                                style={{
                                  position: 'absolute',
                                  left: '50%',
                                  top: '50%',
                                  transform: `translate(-50%, -50%) translate(${ttdOffsetX}px, ${ttdOffsetY}px) rotate(${ttdRotate}deg)`,
                                  height: `${ttdScale}px`,
                                  width: 'auto',
                                  zIndex: 2,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  position: 'absolute',
                                  left: '50%',
                                  top: '50%',
                                  transform: `translate(-50%, -50%) translate(${ttdOffsetX}px, ${ttdOffsetY}px) rotate(${ttdRotate}deg)`,
                                  height: `${ttdScale}px`,
                                  zIndex: 2,
                                }}
                                className="border border-indigo-400 bg-indigo-50/80 px-2 rounded flex items-center justify-center text-[10px] text-indigo-800 font-extrabold italic"
                              >
                                ~ TTD Digital ~
                              </div>
                            )
                          )}
                        </div>

                        <div className="font-bold underline text-slate-900">
                          {kopSekolah?.namaKepalaSekolah || 'Dr. H. Kepala Sekolah, M.Si'}
                        </div>
                        {showHeadmasterNip && (
                          <div className="text-[9px] text-slate-500 font-mono">
                            NIP. {kopSekolah?.nipKepalaSekolah || '197203101998021001'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-800">Opsi Tampilan Elemen:</div>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={showTtd}
                          onChange={(e) => setShowTtd(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>Tampilkan TTD</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={showStempel}
                          onChange={(e) => setShowStempel(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>Tampilkan Stempel</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={showHeadmasterNip}
                          onChange={(e) => setShowHeadmasterNip(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>Tampilkan NIP KS</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-gray-200 flex justify-between items-center shrink-0">
          <div className="text-xs text-gray-500 hidden sm:block">
            💡 <i>Ukuran Aktif: <b>{cardSpecs.title}</b> ({cardSpecs.badge})</i>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrintExamCards}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak Kartu Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
