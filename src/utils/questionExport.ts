import { Question, KopSekolahConfig } from '../types';
import { resolveCategoryStatements, getCorrectAnswerDisplay } from './questionFormatter';

export interface QuestionExportOptions {
  docType: 'SOAL_ONLY' | 'SOAL_WITH_KEY' | 'KEY_ONLY';
  title: string; // e.g. "PENILAIAN AKHIR SEMESTER (PAS)"
  tahunPelajaran: string; // e.g. "2025/2026"
  mapel: string; // e.g. "Sosiologi"
  kelas: string; // e.g. "X / Ganjil"
  alokasiWaktu: string; // e.g. "90 Menit"
  hariTanggal: string; // e.g. "Senin, 10 Agustus 2026"
  pageSize: 'A4' | 'F4';
  fontFamily: 'Times New Roman' | 'Calibri' | 'Arial';
  fontSize: '10pt' | '11pt' | '12pt';
  showKop: boolean;
  showPetunjukUmum: boolean;
  showIdentitasSiswa: boolean;
  showSignature: boolean;
  showPembahasan: boolean;
  kopSekolah?: KopSekolahConfig;
}

export const defaultExportOptions: QuestionExportOptions = {
  docType: 'SOAL_ONLY',
  title: 'ASESMEN SUMATIF / PENILAIAN AKHIR SEMESTER',
  tahunPelajaran: '2025/2026',
  mapel: 'Sosiologi',
  kelas: 'X / Ganjil',
  alokasiWaktu: '90 Menit',
  hariTanggal: 'Senin, 10 Agustus 2026',
  pageSize: 'A4',
  fontFamily: 'Times New Roman',
  fontSize: '11pt',
  showKop: true,
  showPetunjukUmum: true,
  showIdentitasSiswa: true,
  showSignature: true,
  showPembahasan: true,
};

/**
 * Clean and normalize HTML or plain text questions for print/export
 */
export function cleanQuestionText(text: string): string {
  if (!text) return '';
  // If text doesn't contain HTML tags, replace newlines with <br/>
  if (!/<[a-z][\s\S]*>/i.test(text)) {
    return text.replace(/\n/g, '<br/>');
  }
  return text;
}

/**
 * Question Classification Helpers to guarantee zero missing questions
 */
export function isCategoryQuestion(q: Question): boolean {
  if (!q) return false;
  const bentuk = (q.bentukSoal || '').toLowerCase();
  return (
    bentuk.includes('kategori') ||
    bentuk.includes('benar') ||
    bentuk.includes('sesuai') ||
    (Array.isArray(q.categoryStatements) && q.categoryStatements.length > 0)
  );
}

export function isMcmaQuestion(q: Question): boolean {
  if (!q || isCategoryQuestion(q)) return false;
  const bentuk = (q.bentukSoal || '').toLowerCase();
  return (
    bentuk.includes('mcma') ||
    bentuk.includes('mcm') ||
    bentuk.includes('kompleks') ||
    !!(q as any).isMultipleChoice ||
    (Array.isArray(q.options) && q.options.filter((o) => o && o.isCorrect).length > 1)
  );
}

export function isMenjodohkanQuestion(q: Question): boolean {
  if (!q) return false;
  const bentuk = (q.bentukSoal || '').toLowerCase();
  return bentuk.includes('jodoh');
}

export function isIsianQuestion(q: Question): boolean {
  if (!q) return false;
  const bentuk = (q.bentukSoal || '').toLowerCase();
  return bentuk.includes('isian') || bentuk.includes('singkat');
}

export function isUraianQuestion(q: Question): boolean {
  if (!q) return false;
  const bentuk = (q.bentukSoal || '').toLowerCase();
  return bentuk.includes('uraian') || bentuk.includes('essay') || bentuk.includes('esai');
}

export function isPgQuestion(q: Question): boolean {
  return (
    !isCategoryQuestion(q) &&
    !isMcmaQuestion(q) &&
    !isMenjodohkanQuestion(q) &&
    !isIsianQuestion(q) &&
    !isUraianQuestion(q)
  );
}

/**
 * Generate official Indonesian National Standard Exam HTML Document
 */
export function generateQuestionDocumentHtml(
  questions: Question[],
  options: QuestionExportOptions
): string {
  const {
    docType,
    title,
    tahunPelajaran,
    mapel,
    kelas,
    alokasiWaktu,
    hariTanggal,
    pageSize,
    fontFamily,
    fontSize,
    showKop,
    showPetunjukUmum,
    showIdentitasSiswa,
    showSignature,
    showPembahasan,
    kopSekolah,
  } = options;

  const schoolName = kopSekolah?.namaSekolah || 'SMA NEGERI 1 INDONESIA';
  const dinas = kopSekolah?.dinas || 'DINAS PENDIDIKAN PROVINSI';
  const alamat = kopSekolah?.alamat || 'Jl. Pendidikan No. 1, Kota Edukasi';
  const teleponWeb = kopSekolah?.teleponWeb || 'Telp: (021) 555-0199 | Website: www.sekolah.sch.id';
  const guruName = kopSekolah?.namaGuru || 'Drs. Guru Pengampu, M.Pd';
  const guruNip = kopSekolah?.nipGuru || '198501152010011002';
  const headmasterName = kopSekolah?.namaKepalaSekolah || 'Dr. H. Kepala Sekolah, M.Si';
  const headmasterNip = kopSekolah?.nipKepalaSekolah || '197203101998021001';
  const kotaTanggal = kopSekolah?.kotaTanggal || 'Jakarta, 10 Agustus 2026';

  // Robust Question Type Grouping - Ensures 100% of questions are included
  const pgQuestions = questions.filter(isPgQuestion);
  const pgkQuestions = questions.filter((q) => isMcmaQuestion(q) || isCategoryQuestion(q));
  const menjodohkanQuestions = questions.filter(isMenjodohkanQuestion);
  const isianQuestions = questions.filter(isIsianQuestion);
  const uraianQuestions = questions.filter(isUraianQuestion);

  // Ordered array matching document sections exactly so Question #s in Kunci Jawaban match Naskah Soal
  const orderedQuestions = [
    ...pgQuestions,
    ...pgkQuestions,
    ...menjodohkanQuestions,
    ...isianQuestions,
    ...uraianQuestions,
  ];

  // Page dimensions - Standard Indonesian Exam Paper Margins
  const pageCss = pageSize === 'F4' 
    ? '@page { size: 215mm 330mm; margin: 12mm 15mm 12mm 15mm; }' 
    : '@page { size: A4; margin: 12mm 15mm 12mm 15mm; }';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${mapel}</title>
  <style>
    ${pageCss}
    
    * {
      box-sizing: border-box;
    }

    body {
      font-family: '${fontFamily}', serif, sans-serif;
      font-size: ${fontSize};
      line-height: 1.35;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }

    .container {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      padding: 0 10px;
    }

    /* KOP NASKAH UJIAN */
    .kop-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 2px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .kop-logo {
      height: 56px;
      max-width: 65px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .kop-text-box {
      flex: 1;
      text-align: center;
      line-height: 1.15;
    }

    .kop-dinas {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }

    .kop-sekolah {
      font-size: 13.5pt;
      font-weight: 900;
      text-transform: uppercase;
      margin: 2px 0 1px 0;
      letter-spacing: 0.5px;
    }

    .kop-alamat {
      font-size: 8pt;
      margin: 0;
      line-height: 1.2;
      color: #222;
    }

    .kop-divider {
      border: 0;
      border-top: 1px solid #000;
      border-bottom: 2.5px solid #000;
      height: 3px;
      margin: 3px 0 6px 0;
    }

    /* JUDUL UJIAN */
    .exam-title-box {
      text-align: center;
      margin-bottom: 6px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .exam-title {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0;
      text-decoration: underline;
      letter-spacing: 0.3px;
    }

    .exam-subtitle {
      font-size: 9.5pt;
      font-weight: bold;
      margin-top: 1px;
    }

    /* TABEL IDENTITAS & MATERI */
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .meta-table td {
      padding: 1.5px 4px;
      vertical-align: top;
    }

    .meta-table .border-box {
      border: 1px solid #000;
    }

    /* PETUNJUK UMUM (COMPACT & 2-COLUMN) */
    .petunjuk-box {
      border: 1px solid #000;
      padding: 4px 8px;
      margin-bottom: 8px;
      font-size: 8.5pt;
      background-color: #fafafa;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .petunjuk-title {
      font-weight: bold;
      margin-bottom: 2px;
      text-transform: uppercase;
      font-size: 8.5pt;
    }

    .petunjuk-grid {
      display: flex;
      gap: 12px;
    }

    .petunjuk-list {
      margin: 0;
      padding-left: 14px;
      flex: 1;
    }

    .petunjuk-list li {
      margin-bottom: 1px;
      line-height: 1.25;
    }

    /* SEKSI SOAL */
    .section-header {
      font-weight: bold;
      font-size: 10pt;
      margin: 8px 0 2px 0;
      padding-bottom: 2px;
      border-bottom: 1.5px solid #000;
      text-transform: uppercase;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    .section-instruction {
      font-size: 8.5pt;
      font-style: italic;
      margin-bottom: 6px;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    /* ITEM SOAL */
    .question-item {
      margin-bottom: 8px;
      page-break-inside: auto;
      break-inside: auto;
    }

    .question-table {
      width: 100%;
      border-collapse: collapse;
    }

    .question-num {
      width: 24px;
      vertical-align: top;
      font-weight: bold;
      text-align: right;
      padding-right: 6px;
    }

    .question-body {
      vertical-align: top;
    }

    .question-stem {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .question-text {
      margin-bottom: 4px;
      text-align: justify;
      line-height: 1.35;
    }

    .question-text p {
      margin: 0 0 3px 0;
    }

    .question-text table {
      width: auto;
      max-width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
      font-size: 9pt;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .question-text th, .question-text td {
      border: 1px solid #000;
      padding: 2.5px 5px;
      vertical-align: top;
    }

    .question-text th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: center;
    }

    .question-image {
      margin: 4px 0;
      text-align: left;
    }

    .question-image img {
      max-width: 320px;
      max-height: 200px;
      border: 1px solid #ccc;
      padding: 2px;
      border-radius: 4px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* OPTIONS */
    .options-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2px;
    }

    .option-row {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .option-letter {
      width: 44px;
      min-width: 44px;
      white-space: nowrap;
      word-break: keep-all;
      vertical-align: top;
      font-weight: bold;
      padding-right: 6px;
    }

    .option-text {
      vertical-align: top;
      padding-bottom: 2px;
      text-align: justify;
      line-height: 1.3;
    }

    /* KUNCI JAWABAN & PEMBAHASAN */
    .page-break {
      page-break-before: always;
    }

    .key-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 9.5pt;
    }

    .key-table th, .key-table td {
      border: 1px solid #000;
      padding: 4px 6px;
      text-align: left;
    }

    .key-table th {
      background-color: #e5e7eb;
      text-align: center;
      font-weight: bold;
    }

    .key-badge {
      display: inline-block;
      font-weight: bold;
      padding: 1px 5px;
      background: #000;
      color: #fff;
      border-radius: 3px;
    }

    /* TANDA TANGAN */
    .signature-table {
      width: 100%;
      margin-top: 24px;
      page-break-inside: avoid;
      font-size: 10pt;
    }

    .signature-table td {
      vertical-align: top;
      text-align: center;
      width: 50%;
    }

    .signature-space {
      height: 55px;
    }

    @media print {
      body {
        background: #fff !important;
        color: #000 !important;
        font-size: ${fontSize};
      }
      .no-print {
        display: none !important;
      }
      .container {
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        box-shadow: none !important;
      }
      .kop-header, .exam-title-box, .meta-table, .petunjuk-box {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .section-header, .section-instruction {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .question-item {
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      .question-stem {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .option-row {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .question-text table {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
      .signature-table {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      img {
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Print Bar for Preview -->
  <div class="no-print" style="position: fixed; top: 0; left: 0; right: 0; background: #0f172a; color: #fff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 99999; font-family: system-ui, -apple-system, sans-serif;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-weight: bold; font-size: 14px;">📄 Pratinjau Dokumen Naskah Soal Standar Nasional</span>
      <span style="background: #1e293b; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; color: #38bdf8;">${questions.length} Soal</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer;">
        🖨️ Cetak / Simpan PDF
      </button>
      <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; font-size: 13px; cursor: pointer;">
        ❌ Tutup
      </button>
    </div>
  </div>

  <div class="container" style="margin-top: 52px;">

    ${
      showKop
        ? `
    <!-- KOP SEKOLAH -->
    <div class="kop-header">
      ${kopSekolah?.logoPemda ? `<img src="${kopSekolah.logoPemda}" class="kop-logo" alt="Logo Pemda" />` : '<div style="width:72px;"></div>'}
      <div class="kop-text-box">
        <div class="kop-dinas">${dinas}</div>
        <div class="kop-sekolah">${schoolName}</div>
        <div class="kop-alamat">${alamat}</div>
        <div class="kop-alamat">${teleponWeb}</div>
      </div>
      ${kopSekolah?.logoSekolah ? `<img src="${kopSekolah.logoSekolah}" class="kop-logo" alt="Logo Sekolah" />` : '<div style="width:72px;"></div>'}
    </div>
    <div class="kop-divider"></div>
    `
        : ''
    }

    <!-- JUDUL NASKAH UJIAN -->
    <div class="exam-title-box">
      <div class="exam-title">${title}</div>
      <div class="exam-subtitle">TAHUN PELAJARAN ${tahunPelajaran}</div>
    </div>

    <!-- TABEL IDENTITAS & PARAMETER UJIAN -->
    <table class="meta-table">
      <tr>
        <td style="width: 50%; padding-right: 12px;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 110px; font-weight: bold;">Mata Pelajaran</td>
              <td style="width: 10px;">:</td>
              <td style="font-weight: bold;">${mapel}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Kelas / Semester</td>
              <td>:</td>
              <td>${kelas}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Hari / Tanggal</td>
              <td>:</td>
              <td>${hariTanggal}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Alokasi Waktu</td>
              <td>:</td>
              <td>${alokasiWaktu}</td>
            </tr>
          </table>
        </td>
        ${
          showIdentitasSiswa
            ? `
        <td style="width: 50%; padding-left: 12px;">
          <table style="width: 100%; border: 1px solid #000; padding: 4px;">
            <tr>
              <td style="width: 100px; font-weight: bold;">Nama Siswa</td>
              <td style="width: 10px;">:</td>
              <td style="border-bottom: 1px dotted #000;">&nbsp;</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">NIS / NISN</td>
              <td>:</td>
              <td style="border-bottom: 1px dotted #000;">&nbsp;</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">No. Peserta</td>
              <td>:</td>
              <td style="border-bottom: 1px dotted #000;">&nbsp;</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Tanda Tangan</td>
              <td>:</td>
              <td style="border-bottom: 1px dotted #000;">..........................</td>
            </tr>
          </table>
        </td>
        `
            : ''
        }
      </tr>
    </table>

    ${
      showPetunjukUmum
        ? `
    <!-- PETUNJUK UMUM (COMPACT & 2-COLUMN) -->
    <div class="petunjuk-box">
      <div class="petunjuk-title">PETUNJUK UMUM:</div>
      <div class="petunjuk-grid">
        <ol class="petunjuk-list">
          <li>Isikan identitas ke Lembar Jawaban dengan teliti dan benar.</li>
          <li>Periksa dan bacalah naskah soal sebelum menjawabnya.</li>
          <li>Laporkan kepada pengawas jika lembar soal kurang jelas atau rusak.</li>
        </ol>
        <ol class="petunjuk-list" start="4">
          <li>Dahulukan menjawab soal-soal yang Anda anggap mudah.</li>
          <li>Periksalah seluruh pekerjaan Anda kembali sebelum diserahkan.</li>
        </ol>
      </div>
    </div>
    `
        : ''
    }

    ${
      docType !== 'KEY_ONLY'
        ? `
    <!-- NASKAH SOAL -->
    ${
      pgQuestions.length > 0
        ? `
      <div class="section-header">I. SOAL PILIHAN GANDA</div>
      <div class="section-instruction">Petunjuk: Pilihlah salah satu jawaban yang paling tepat dengan memberikan tanda silang (X) atau memilih huruf A, B, C, D, atau E.</div>
      
      ${pgQuestions
        .map((q, index) => renderSingleQuestionHtml(q, index + 1, docType === 'SOAL_WITH_KEY'))
        .join('')}
    `
        : ''
    }

    ${
      pgkQuestions.length > 0
        ? `
      <div class="section-header">${pgQuestions.length > 0 ? 'II' : 'I'}. SOAL PILIHAN GANDA KOMPLEKS (MCM & KATEGORI)</div>
      <div class="section-instruction">Petunjuk: Pilihlah lebih dari satu jawaban yang benar (MCM) atau pilihlah kategori sesuai/tidak sesuai (benar/salah) untuk setiap pernyataan.</div>
      
      ${pgkQuestions
        .map((q, index) =>
          renderSingleQuestionHtml(q, pgQuestions.length + index + 1, docType === 'SOAL_WITH_KEY')
        )
        .join('')}
    `
        : ''
    }

    ${
      menjodohkanQuestions.length > 0
        ? `
      <div class="section-header">${pgQuestions.length > 0 && pgkQuestions.length > 0 ? 'III' : (pgQuestions.length > 0 || pgkQuestions.length > 0) ? 'II' : 'I'}. SOAL MENJODOHKAN</div>
      <div class="section-instruction">Petunjuk: Jodohkanlah pernyataan di kolom kiri dengan pasangan jawaban yang tepat di kolom kanan.</div>
      
      ${menjodohkanQuestions
        .map((q, index) =>
          renderSingleQuestionHtml(
            q,
            pgQuestions.length + pgkQuestions.length + index + 1,
            docType === 'SOAL_WITH_KEY'
          )
        )
        .join('')}
    `
        : ''
    }

    ${
      isianQuestions.length > 0
        ? `
      <div class="section-header">SOAL ISIAN SINGKAT</div>
      <div class="section-instruction">Petunjuk: Isilah titik-titik di bawah ini dengan jawaban yang singkat dan tepat.</div>
      
      ${isianQuestions
        .map((q, index) =>
          renderSingleQuestionHtml(
            q,
            pgQuestions.length + pgkQuestions.length + menjodohkanQuestions.length + index + 1,
            docType === 'SOAL_WITH_KEY'
          )
        )
        .join('')}
    `
        : ''
    }

    ${
      uraianQuestions.length > 0
        ? `
      <div class="section-header">SOAL URAIAN / ESSAY</div>
      <div class="section-instruction">Petunjuk: Jawablah pertanyaan-pertanyaan berikut dengan jelas, lengkap, dan sistematis.</div>
      
      ${uraianQuestions
        .map((q, index) =>
          renderSingleQuestionHtml(
            q,
            pgQuestions.length +
              pgkQuestions.length +
              menjodohkanQuestions.length +
              isianQuestions.length +
              index +
              1,
            docType === 'SOAL_WITH_KEY'
          )
        )
        .join('')}
    `
        : ''
    }
    `
        : ''
    }

    ${
      (docType === 'SOAL_WITH_KEY' || docType === 'KEY_ONLY')
        ? `
    <!-- KUNCI JAWABAN & TABEL MATRIKS -->
    <div class="${docType === 'SOAL_WITH_KEY' ? 'page-break' : ''}">
      <div style="text-align: center; margin-bottom: 16px;">
        <h3 style="text-transform: uppercase; margin: 0; font-size: 13pt; text-decoration: underline;">
          KUNCI JAWABAN & PEDOMAN PENSKORAN
        </h3>
        <div style="font-size: 10.5pt; font-weight: bold; margin-top: 2px;">
          MATA PELAJARAN: ${mapel} (${tahunPelajaran})
        </div>
      </div>

      <table class="key-table">
        <thead>
          <tr>
            <th style="width: 40px;">No</th>
            <th style="width: 150px;">Bentuk Soal</th>
            <th style="width: 220px;">Kunci Jawaban</th>
            <th>Kompetensi / Sub-materi</th>
          </tr>
        </thead>
        <tbody>
          ${orderedQuestions
            .map((q, idx) => {
              const keyDisplay = getCorrectAnswerDisplay(q);

              return `
              <tr>
                <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                <td>${q.bentukSoal || 'Pilihan Ganda'}</td>
                <td style="text-align: center;">
                  <span class="key-badge">${keyDisplay || '-'}</span>
                </td>
                <td>${q.kompetensi || q.subTopik || 'Umum'}</td>
              </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>

      ${
        showPembahasan
          ? `
      <div style="margin-top: 24px;">
        <h4 style="margin-bottom: 8px; text-transform: uppercase; font-size: 11pt; border-bottom: 1px solid #000; padding-bottom: 4px;">
          PEMBAHASAN SOAL & PEDOMAN PENILAIAN
        </h4>
        ${orderedQuestions
          .map((q, idx) => {
            if (!q.explanation && (!q.explanationImages || q.explanationImages.length === 0)) return '';
            const keyDisplay = getCorrectAnswerDisplay(q);

            return `
            <div style="margin-bottom: 12px; font-size: 10pt; page-break-inside: avoid;">
              <div style="font-weight: bold;">Soal #${idx + 1} (${q.bentukSoal || 'Pilihan Ganda'})</div>
              <div style="color: #15803d; font-weight: bold; margin: 2px 0;">Kunci: ${keyDisplay}</div>
              ${q.explanation ? `<div style="text-align: justify; font-style: italic;"><b>Pembahasan:</b> ${cleanQuestionText(q.explanation)}</div>` : ''}
            </div>
            `;
          })
          .join('')}
      </div>
      `
          : ''
      }
    </div>
    `
        : ''
    }

    ${
      showSignature
        ? `
    <!-- LEMBAR PENGESAHAN / TANDA TANGAN -->
    <table class="signature-table">
      <tr>
        <td style="width: 50%;">
          <div>Mengetahui,</div>
          <div style="font-weight: bold;">Kepala ${schoolName}</div>
          <div class="signature-space" style="position: relative; height: 75px; display: flex; align-items: center; justify-content: center; margin: 4px 0;">
            ${
              kopSekolah?.showTtd && kopSekolah?.ttdKepalaSekolah
                ? `<img src="${kopSekolah.ttdKepalaSekolah}" style="max-height: 70px; width: auto; object-fit: contain; z-index: 2;" alt="TTD Kepala Sekolah" />`
                : ''
            }
            ${
              kopSekolah?.showStempel && kopSekolah?.stempelSekolah
                ? `<img src="${kopSekolah.stempelSekolah}" style="max-height: 70px; width: auto; object-fit: contain; position: absolute; opacity: ${kopSekolah.stempelOpacity || 0.85}; z-index: 1;" alt="Stempel" />`
                : ''
            }
          </div>
          <div style="font-weight: bold; text-decoration: underline;">${headmasterName}</div>
          <div>NIP. ${headmasterNip}</div>
        </td>
        <td style="width: 50%;">
          <div>${kotaTanggal}</div>
          <div style="font-weight: bold;">Guru Mata Pelajaran</div>
          <div class="signature-space" style="height: 75px;"></div>
          <div style="font-weight: bold; text-decoration: underline;">${guruName}</div>
          <div>NIP. ${guruNip}</div>
        </td>
      </tr>
    </table>
    `
        : ''
    }

  </div>
</body>
</html>`;
}

/**
 * Helper to render an individual question item in standard national layout
 */
function renderSingleQuestionHtml(q: Question, num: number, showKeyInline: boolean): string {
  const qText = cleanQuestionText(q.question);
  const options = q.options || [];
  const imgPos = q.imagePosition || 'top';

  const qImgs = q.images && Array.isArray(q.images) && q.images.length > 0
    ? q.images.filter(Boolean)
    : (q.image && q.image.trim() ? [q.image.trim()] : []);

  const imgBlockHtml = qImgs.length > 0
    ? `
    <div class="question-image-block" style="margin-top:6px;margin-bottom:10px;display:flex;flex-wrap:wrap;gap:10px;">
      ${qImgs.map((src, i) => `<img src="${src}" alt="Gambar Soal ${num}-${i+1}" style="max-height:250px;max-width:100%;object-fit:contain;border-radius:6px;border:1px solid #cbd5e1;padding:2px;background:#fff;" />`).join('')}
    </div>
    `
    : '';

  // Render question body based on imagePosition
  let bodyContentHtml = '';
  if (imgPos === 'bottom') {
    bodyContentHtml = `<div class="question-text">${qText}</div>${imgBlockHtml}`;
  } else if (imgPos === 'middle') {
    const parts = qText.split(/(<\/p>|<br\s*\/?>|\n\n)/i).filter(Boolean);
    if (parts.length > 2) {
      const mid = Math.floor(parts.length / 2);
      bodyContentHtml = `
        <div class="question-text">${parts.slice(0, mid).join('')}</div>
        ${imgBlockHtml}
        <div class="question-text">${parts.slice(mid).join('')}</div>
      `;
    } else {
      bodyContentHtml = `${imgBlockHtml}<div class="question-text">${qText}</div>`;
    }
  } else {
    // top
    bodyContentHtml = `${imgBlockHtml}<div class="question-text">${qText}</div>`;
  }

  // Category Statements table if present or if Category question type
  let categoryTableHtml = '';
  if (isCategoryQuestion(q)) {
    let statements = resolveCategoryStatements(q);
    if (statements.length === 0 && options.length > 0) {
      statements = options.map((o, idx) => ({
        id: String(idx + 1),
        statement: cleanQuestionText(o.text),
        correctCategory: o.isCorrect ? 'Benar' : 'Salah',
      }));
    }

    if (statements.length > 0) {
      const sampleCat = statements[0]?.correctCategory || 'Sesuai';
      const isBenarSalah = ['benar', 'salah'].includes(sampleCat.toLowerCase());
      const primaryCat = q.categoryOptions?.[0] || (isBenarSalah ? 'Benar' : 'Sesuai');
      const secondaryCat = q.categoryOptions?.[1] || (isBenarSalah ? 'Salah' : 'Tidak Sesuai');

      categoryTableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-size: 9.5pt;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left;">
            <th style="border: 1px solid #000; padding: 4px 8px; width: 30px; text-align: center; vertical-align: top;">No</th>
            <th style="border: 1px solid #000; padding: 4px 8px; vertical-align: top;">Pernyataan</th>
            <th style="border: 1px solid #000; padding: 4px 8px; width: 180px; text-align: center; vertical-align: top; white-space: nowrap;">${
              showKeyInline ? 'Kunci Jawaban' : `Pilihan (${primaryCat} / ${secondaryCat})`
            }</th>
          </tr>
        </thead>
        <tbody>
          ${statements
            .map(
              (st, sIdx) => `
            <tr>
              <td style="border: 1px solid #000; padding: 4px 8px; text-align: center; font-weight: bold; vertical-align: top;">${sIdx + 1}</td>
              <td style="border: 1px solid #000; padding: 4px 8px; vertical-align: top;">
                <div>${cleanQuestionText(st.statement)}</div>
                ${st.image ? `<div style="margin-top: 4px;"><img src="${st.image}" style="max-height: 140px; max-width: 100%; object-fit: contain; border-radius: 4px;" alt="Lampiran Pernyataan" /></div>` : ''}
              </td>
              <td style="border: 1px solid #000; padding: 4px 8px; text-align: center; font-weight: bold; vertical-align: top; white-space: nowrap;">
                ${
                  showKeyInline
                    ? `<span style="color: #15803d; background: #dcfce7; padding: 2px 6px; border-radius: 4px; display: inline-block;">✓ ${st.correctCategory}</span>`
                    : `<span style="font-family: monospace; white-space: nowrap;">[ &nbsp; ] ${primaryCat} &nbsp;&nbsp;&nbsp; [ &nbsp; ] ${secondaryCat}</span>`
                }
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      `;
    }
  }

  // Standard Options table (for Single Choice or MCMA)
  let optionsTableHtml = '';
  if (options.length > 0 && !categoryTableHtml) {
    const isMcma = isMcmaQuestion(q);
    optionsTableHtml = `
    <table class="options-table">
      ${options
        .map((opt) => {
          const isKey = showKeyInline && opt.isCorrect;
          const boxStr = isKey ? '[✓]' : '[&nbsp;&nbsp;]';
          const boxPrefix = isMcma ? `<span style="font-family: 'Courier New', Courier, monospace; font-weight: bold; font-size: 10.5pt; white-space: nowrap; word-break: keep-all;">${boxStr}</span>&nbsp;` : '';
          return `
        <tr class="option-row">
          <td class="option-letter" style="width: 44px; min-width: 44px; white-space: nowrap; word-break: keep-all; vertical-align: top; font-weight: bold; padding-right: 6px; ${isKey ? 'color: #16a34a;' : ''}">
            <span style="white-space: nowrap; word-break: keep-all;">${boxPrefix}<b>${opt.id}.</b></span>
          </td>
          <td class="option-text" style="${isKey ? 'color: #15803d; font-weight: bold;' : ''}">
            ${cleanQuestionText(opt.text)} ${isKey ? '✓ (Kunci)' : ''}
            ${opt.image ? `<div style="margin-top:4px;"><img src="${opt.image}" style="max-height:160px;max-width:100%;object-fit:contain;border-radius:6px;border:1px solid #cbd5e1;padding:2px;" /></div>` : ''}
          </td>
        </tr>
        `;
        })
        .join('')}
    </table>
    `;
  }

  // Explanation section
  let explanationHtml = '';
  if (showKeyInline) {
    const expImgs = q.explanationImages && Array.isArray(q.explanationImages) && q.explanationImages.length > 0
      ? q.explanationImages.filter(Boolean)
      : (q.explanationImage && q.explanationImage.trim() ? [q.explanationImage.trim()] : []);

    if (q.explanation || expImgs.length > 0) {
      explanationHtml = `
      <div style="margin-top: 8px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 9.5pt; color: #166534;">
        ${q.explanation ? `<div><b>Pembahasan:</b> ${cleanQuestionText(q.explanation)}</div>` : ''}
        ${expImgs.length > 0 ? `
          <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 8px;">
            ${expImgs.map((src) => `<img src="${src}" style="max-height: 180px; max-width: 100%; object-fit: contain; border-radius: 4px; border: 1px solid #86efac; background: #fff;" />`).join('')}
          </div>
        ` : ''}
      </div>
      `;
    }
  }

  return `
  <div class="question-item">
    <table class="question-table">
      <tr>
        <td class="question-num">${num}.</td>
        <td class="question-body">
          <div class="question-stem">
            ${bodyContentHtml}
            ${categoryTableHtml}
          </div>
          ${optionsTableHtml}
          ${explanationHtml}
        </td>
      </tr>
    </table>
  </div>
  `;
}

/**
 * Opens a print window with standard national exam formatting (PDF Save/Print)
 */
export function openQuestionPrintWindow(questions: Question[], options: QuestionExportOptions) {
  const html = generateQuestionDocumentHtml(questions, options);
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  } else {
    alert('Pop-up terblokir di browser Anda! Mohon izinkan pop-up untuk mencetak / menyimpan PDF.');
  }
}

/**
 * Export questions directly as Word Document (.doc / .docx compatible file)
 */
export function exportQuestionsToWord(questions: Question[], options: QuestionExportOptions) {
  const htmlContent = generateQuestionDocumentHtml(questions, options);

  // Wrap inside Word MS Office HTML XML schema for perfect Word layout rendering
  const wordDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${options.title} - ${options.mapel}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: ${options.pageSize === 'F4' ? '215mm 330mm' : '210mm 297mm'};
            margin: 20mm;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordDocumentHtml], {
    type: 'application/msword',
  });

  const cleanMapel = (options.mapel || 'Soal').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanTitle = (options.title || 'Ujian').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Naskah_Soal_${cleanMapel}_${cleanTitle}.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

