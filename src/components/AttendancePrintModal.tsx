import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileCheck,
  Filter,
  CheckSquare,
  Square,
  Users,
  Building2,
  Search,
  CheckCircle2,
  UserCheck,
  FileText,
  Sliders,
  Settings,
  Image as ImageIcon
} from 'lucide-react';
import { StudentUser, TeacherUser, KopSekolahConfig, ExamScheduleConfig } from '../types';

export interface AttendancePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentUser[];
  teachers?: TeacherUser[];
  kopSekolah?: KopSekolahConfig;
  examSchedule?: ExamScheduleConfig;
  onSaveKopSekolah?: (updatedKop: KopSekolahConfig) => void;
}

export const AttendancePrintModal: React.FC<AttendancePrintModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers = [],
  kopSekolah,
  examSchedule,
  onSaveKopSekolah
}) => {
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [ruangUjianInput, setRuangUjianInput] = useState<string>('Ruang 01');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  
  // Print & Layout Settings
  const [mapelInput, setMapelInput] = useState<string>(examSchedule?.mapel || 'MATA PELAJARAN UJIAN');
  const [tahunPelajaran, setTahunPelajaran] = useState<string>('2025/2026');
  const [targetRowsPerClass, setTargetRowsPerClass] = useState<number>(36);
  const [selectedPaperSize, setSelectedPaperSize] = useState<'a4' | 'f4' | 'letter' | 'legal'>('a4');
  const [showDigitalSignatures, setShowDigitalSignatures] = useState<boolean>(true);
  const [includeBeritaAcara, setIncludeBeritaAcara] = useState<boolean>(true);

  // Filter available classes
  const availableClasses = useMemo(() => {
    const setClasses = new Set<string>();
    students.forEach((s) => {
      if (s.kelas && s.kelas.trim()) {
        setClasses.add(s.kelas.trim());
      }
    });
    return Array.from(setClasses).sort();
  }, [students]);

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClass === 'ALL' || s.kelas === selectedClass;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' ? s.isActive !== false : s.isActive === false);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.nama.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        (s.kelas && s.kelas.toLowerCase().includes(q));
      return matchClass && matchStatus && matchSearch;
    });
  }, [students, selectedClass, statusFilter, searchQuery]);

  if (!isOpen) return null;

  // Handler for printing
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Mohon izinkan popup di browser Anda.');
      return;
    }

    const kop = kopSekolah || {};
    const logoPemdaHtml = kop.logoPemda
      ? `<img src="${kop.logoPemda}" style="max-height: 65px; width: auto;" alt="Logo Pemda" />`
      : '';
    const logoHtml = kop.logoSekolah
      ? `<img src="${kop.logoSekolah}" style="max-height: 65px; width: auto;" alt="Logo Sekolah" />`
      : '';

    // Prepare student rows (padded up to targetRowsPerClass e.g. 36)
    const displayList: Array<{ nis: string; nama: string; kelas: string; isBlank?: boolean }> =
      filteredStudents.map((st) => ({
        nis: st.nis,
        nama: st.nama,
        kelas: st.kelas,
        isBlank: false,
      }));

    if (targetRowsPerClass > 0 && displayList.length < targetRowsPerClass) {
      const paddingNeeded = targetRowsPerClass - displayList.length;
      for (let i = 0; i < paddingNeeded; i++) {
        displayList.push({
          nis: '...................',
          nama: '..........................................................',
          kelas: selectedClass === 'ALL' ? '-' : selectedClass,
          isBlank: true,
        });
      }
    }

    const paperCss =
      selectedPaperSize === 'f4'
        ? '@page { size: 210mm 330mm portrait; margin: 10mm 12mm; }'
        : selectedPaperSize === 'legal'
        ? '@page { size: legal portrait; margin: 10mm 12mm; }'
        : selectedPaperSize === 'letter'
        ? '@page { size: letter portrait; margin: 10mm 12mm; }'
        : '@page { size: A4 portrait; margin: 10mm 12mm; }';

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>DAFTAR HADIR PESERTA UJIAN CBT & BERITA ACARA</title>
  <style>
    ${paperCss}
    body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; font-size: 11px; line-height: 1.35; background: #fff; }
    
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; border-bottom: 3px double #000; padding-bottom: 6px; }
    .kop-title { text-align: center; }
    .kop-title h2 { margin: 0; font-size: 13px; font-weight: bold; text-transform: uppercase; }
    .kop-title h1 { margin: 2px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }
    .kop-title p { margin: 1px 0; font-size: 10px; font-style: italic; }

    .doc-title { text-align: center; font-weight: bold; font-size: 14px; margin: 10px 0 3px 0; text-decoration: underline; text-transform: uppercase; letter-spacing: 0.5px; }
    .doc-subtitle { text-align: center; font-size: 11px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; }

    .meta-box { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .meta-box td { border: none !important; padding: 3px 6px; font-size: 11px; vertical-align: top; }

    table.data-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    table.data-table th, table.data-table td { border: 1px solid #000; padding: 4px 6px; font-size: 10px; }
    table.data-table th { background-color: #f2f2f2; text-align: center; font-weight: bold; text-transform: uppercase; }
    
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }

    .note-box { border: 1px solid #000; padding: 8px; font-size: 10px; min-height: 40px; margin-top: 6px; background: #fafafa; }

    .ttd-4-col { width: 100%; margin-top: 15px; border-collapse: collapse; }
    .ttd-4-col td { border: none !important; text-align: center; vertical-align: top; font-size: 10.5px; width: 25%; padding: 4px; position: relative; }
    .ttd-space { height: 48px; }

    .page-break { page-break-before: always; margin-top: 15px; }

    td.paraf-col { height: 26px; vertical-align: middle; padding-left: 6px; font-size: 10px; font-family: monospace; }
  </style>
</head>
<body>

  ${
    includeBeritaAcara
      ? `
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

  <div class="doc-title">BERITA ACARA PELAKSANAAN UJIAN CBT</div>
  <div class="doc-subtitle">MATA PELAJARAN: ${mapelInput} — TAHUN AJARAN ${tahunPelajaran}</div>

  <p style="text-align: justify; margin-bottom: 8px;">
    Pada hari ini <b>${new Date().toLocaleDateString('id-ID', { weekday: 'long' })}</b>, tanggal <b>${kop.kotaTanggal || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b>, telah dilaksanakan Ujian Berbasis Komputer (CBT) untuk Peserta Didik dengan rincian data sebagai berikut:
  </p>

  <table class="meta-box">
    <tr>
      <td style="width: 18%;"><b>Mata Pelajaran</b></td>
      <td style="width: 2%;">:</td>
      <td style="width: 30%;">${mapelInput}</td>
      <td style="width: 18%;"><b>Ruang Ujian</b></td>
      <td style="width: 2%;">:</td>
      <td style="width: 30%;">${ruangUjianInput}</td>
    </tr>
    <tr>
      <td><b>Kelas / Rombel</b></td>
      <td>:</td>
      <td>${selectedClass === 'ALL' ? 'SEMUA KELAS' : selectedClass}</td>
      <td><b>Jumlah Peserta</b></td>
      <td>:</td>
      <td>${filteredStudents.length} Siswa Terdaftar</td>
    </tr>
    <tr>
      <td><b>Waktu Ujian</b></td>
      <td>:</td>
      <td>07.30 - 09.30 WIB</td>
      <td><b>Lokasi Tempat</b></td>
      <td>:</td>
      <td>${kop.namaSekolah || 'Sekolah'}</td>
    </tr>
  </table>

  <div style="font-weight: bold; margin-top: 8px; margin-bottom: 4px; font-size: 11px;">
    I. REKAPITULASI PESERTA UJIAN PER KELAS:
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 8%;">No</th>
        <th>Kelas / Rombel</th>
        <th style="width: 25%;">Jumlah Siswa Hadir</th>
        <th style="width: 25%;">Jumlah Tidak Hadir</th>
        <th style="width: 25%;">Total Siswa</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center">1</td>
        <td class="font-bold">${selectedClass === 'ALL' ? 'Gabungan Kelas' : selectedClass}</td>
        <td class="text-center font-bold" style="color: #166534;">${filteredStudents.length} Siswa</td>
        <td class="text-center font-bold" style="color: #991b1b;">0 Siswa</td>
        <td class="text-center font-bold">${filteredStudents.length} Siswa</td>
      </tr>
    </tbody>
  </table>

  <div style="font-weight: bold; margin-top: 10px; margin-bottom: 4px; font-size: 11px;">
    II. CATATAN & KEJADIAN KHUSUS SELAMA UJIAN:
  </div>
  <div class="note-box">
    <i>Ujian berlangsung aman, tertib, dan lancar tanpa kendala teknis yang berarti. Seluruh perangkat CBT berfungsi normal.</i>
  </div>

  <p style="margin-top: 10px;">Demikian Berita Acara Pelaksanaan Ujian ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p>

  <table class="ttd-4-col">
    <tr>
      <td>
        Pengawas Ruang 1<br><br>
        <div class="ttd-space"></div>
        <b><u>.......................................</u></b><br>
        NIP. ...................................
      </td>
      <td>
        Pengawas Ruang 2<br><br>
        <div class="ttd-space"></div>
        <b><u>.......................................</u></b><br>
        NIP. ...................................
      </td>
      <td>
        Proktor CBT<br><br>
        <div class="ttd-space"></div>
        <b><u>${kop.namaGuru || '.......................................'}</u></b><br>
        NIP. ${kop.nipGuru || '...................................'}
      </td>
      <td style="position: relative;">
        Mengetahui,<br>
        Kepala Sekolah<br>
        <div style="height: 50px; position: relative; margin: 4px 0;">
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
        <b><u>${kop.namaKepalaSekolah || '.......................................'}</u></b><br>
        NIP. ${kop.nipKepalaSekolah || '...................................'}
      </td>
    </tr>
  </table>

  <div class="page-break"></div>
  `
      : ''
  }

  <!-- ================= HALAMAN DAFTAR HADIR SISWA ================= -->
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

  <div class="doc-title">DAFTAR HADIR PESERTA UJIAN CBT</div>
  <div class="doc-subtitle">MATA PELAJARAN: ${mapelInput} | KELAS: ${selectedClass === 'ALL' ? 'SEMUA KELAS' : selectedClass} | RUANG: ${ruangUjianInput}</div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 5%;">No</th>
        <th style="width: 17%;">NIS / No. Peserta</th>
        <th style="width: 32%;">Nama Lengkap Siswa</th>
        <th style="width: 12%;">Kelas</th>
        <th colspan="2" style="width: 34%;">Tanda Tangan</th>
      </tr>
    </thead>
    <tbody>
      ${displayList
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
      <td>
        Pengawas Ruang 1<br><br>
        <div class="ttd-space"></div>
        <b><u>.......................................</u></b>
      </td>
      <td>
        Pengawas Ruang 2<br><br>
        <div class="ttd-space"></div>
        <b><u>.......................................</u></b>
      </td>
      <td>
        Proktor CBT<br><br>
        <div class="ttd-space"></div>
        <b><u>${kop.namaGuru || '.......................................'}</u></b>
      </td>
      <td style="position: relative;">
        Mengetahui,<br>
        Kepala Sekolah<br>
        <div style="height: 50px; position: relative; margin: 4px 0;">
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
        <b><u>${kop.namaKepalaSekolah || '.......................................'}</u></b>
      </td>
    </tr>
  </table>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-150">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 px-6 py-4 text-white flex items-center justify-between border-b border-indigo-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-white flex items-center gap-2">
                Cetak Daftar Hadir & Berita Acara Ujian
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Format resmi presensi 36 siswa per halaman dengan tanda tangan staggered (ganjil/genap)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-indigo-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* FILTER & CONFIG CONTROLS PANEL */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" /> Filter Data Siswa & Setting Cetak
              </span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                Data Terpilih: <b>{filteredStudents.length} Siswa</b>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              {/* 1. Filter Kelas */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Pilih Kelas / Rombel
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      Kelas {cls} ({students.filter((s) => s.kelas === cls).length} Siswa)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Filter Status Siswa */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Status Keaktifan
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ACTIVE">Hanya Siswa Aktif Ujian</option>
                  <option value="ALL">Semua Siswa (Aktif & Nonaktif)</option>
                  <option value="INACTIVE">Hanya Siswa Non-Aktif</option>
                </select>
              </div>

              {/* 3. Input Ruang Ujian */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nama Ruang / Sesi Ujian
                </label>
                <input
                  type="text"
                  value={ruangUjianInput}
                  onChange={(e) => setRuangUjianInput(e.target.value)}
                  placeholder="Misal: Ruang 01 / Sesi 1"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* 4. Mata Pelajaran */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mata Pelajaran Ujian
                </label>
                <input
                  type="text"
                  value={mapelInput}
                  onChange={(e) => setMapelInput(e.target.value)}
                  placeholder="Nama Mata Pelajaran"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* 5. Target Baris Presensi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Target Baris per Kelas
                </label>
                <select
                  value={targetRowsPerClass}
                  onChange={(e) => setTargetRowsPerClass(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={36}>36 Baris (Standar CBT Nasional)</option>
                  <option value={30}>30 Baris</option>
                  <option value={40}>40 Baris</option>
                  <option value={0}>Sesuai Jumlah Siswa Saja</option>
                </select>
              </div>

              {/* 6. Ukuran Kertas */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Ukuran Kertas Cetak
                </label>
                <select
                  value={selectedPaperSize}
                  onChange={(e) => setSelectedPaperSize(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="a4">A4 (210 x 297 mm)</option>
                  <option value="f4">F4 / Folio (210 x 330 mm)</option>
                  <option value="letter">Letter</option>
                  <option value="legal">Legal</option>
                </select>
              </div>

              {/* 7. Cari Nama / NIS */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Cari Nama / NIS Siswa
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama atau NIS..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* OPTIONS CHECKBOXES */}
            <div className="flex flex-wrap items-center gap-5 pt-3 border-t border-slate-200/80 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeBeritaAcara}
                  onChange={(e) => setIncludeBeritaAcara(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <span>Cetak Lembar Berita Acara Ujian (Halaman 1)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDigitalSignatures}
                  onChange={(e) => setShowDigitalSignatures(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <span>Sertakan TTD Digital & Stempel Resmi Kepala Sekolah</span>
              </label>
            </div>

          </div>

          {/* TABLE PREVIEW HEADER */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Preview Tabel Daftar Hadir Siswa ({filteredStudents.length} Siswa)
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                Format TTD: 1 Kolom Header Tanda Tangan
              </span>
            </div>

            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase sticky top-0 border-b border-slate-200 shadow-xs">
                  <tr>
                    <th className="p-3 text-center w-12">No</th>
                    <th className="p-3 w-32">NIS / No. Peserta</th>
                    <th className="p-3">Nama Lengkap Siswa</th>
                    <th className="p-3 text-center w-24">Kelas</th>
                    <th colSpan={2} className="p-3 text-center">Tanda Tangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((st, idx) => {
                      const rowNum = idx + 1;
                      const isOdd = rowNum % 2 !== 0;
                      return (
                        <tr key={st.id || st.nis || idx} className="hover:bg-indigo-50/40 transition">
                          <td className="p-3 text-center font-bold text-slate-500">{rowNum}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">{st.nis}</td>
                          <td className="p-3 font-bold text-slate-900">{st.nama}</td>
                          <td className="p-3 text-center font-semibold">{st.kelas}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-400">
                            {isOdd ? <span className="font-bold text-slate-800">{rowNum}. .................</span> : ''}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-slate-400">
                            {!isOdd ? <span className="font-bold text-slate-800">{rowNum}. .................</span> : ''}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        Tidak ada siswa yang sesuai dengan filter kelas atau pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Kop Surat: <b>{kopSekolah?.namaSekolah || 'Sekolah'}</b> ({selectedPaperSize.toUpperCase()})</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Batal
            </button>

            <button
              onClick={handlePrint}
              disabled={filteredStudents.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" /> Cetak Sekarang
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
