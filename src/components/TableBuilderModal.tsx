import React, { useState } from 'react';
import { Table, Plus, Trash2, Check, X, LayoutGrid, Palette, Sparkles, FileText, ArrowRight } from 'lucide-react';

interface TableBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (tableHtml: string) => void;
  showAlert: (msg: string) => void;
}

export const TableBuilderModal: React.FC<TableBuilderModalProps> = ({
  isOpen,
  onClose,
  onInsertTable,
  showAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [headerTheme, setHeaderTheme] = useState<'slate' | 'indigo' | 'sky' | 'emerald' | 'amber'>('indigo');
  
  // Custom Table Grid State
  const [numRows, setNumRows] = useState<number>(3);
  const [numCols, setNumCols] = useState<number>(3);
  const [hasHeader, setHasHeader] = useState<boolean>(true);
  
  // Cell contents
  const [headers, setHeaders] = useState<string[]>(['No', 'Faktor / Kategori', 'Keterangan']);
  const [gridData, setGridData] = useState<string[][]>([
    ['1', 'Faktor Internal', 'Penemuan baru, konflik sosial'],
    ['2', 'Faktor Eksternal', 'Pengaruh budaya asing, bencana alam'],
  ]);

  if (!isOpen) return null;

  // Handle preset selection
  const handleSelectPreset = (presetType: string) => {
    if (presetType === 'standard3') {
      setHeaders(['No', 'Kategori / Indikator', 'Keterangan']);
      setGridData([
        ['1', 'Variabel Bebas', 'Jumlah konsumsi air / hari'],
        ['2', 'Variabel Terikat', 'Laju pertumbuhan tanaman'],
      ]);
      setNumRows(3);
      setNumCols(3);
      setHasHeader(true);
    } else if (presetType === 'dataNumbers') {
      setHeaders(['No', 'Nama Sampel / Bahan', 'Konsentrasi (M)', 'Hasil Pengamatan']);
      setGridData([
        ['1', 'Larutan A', '0,1 M', 'Warna Biru Tua (Basa)'],
        ['2', 'Larutan B', '0,5 M', 'Warna Merah Muda (Asam)'],
        ['3', 'Larutan C', '1,0 M', 'Tidak Berwarna (Netral)'],
      ]);
      setNumRows(4);
      setNumCols(4);
      setHasHeader(true);
    } else if (presetType === 'comparison2') {
      setHeaders(['Aspek Perbandingan', 'Karakteristik Utama']);
      setGridData([
        ['Kelompok Primer', 'Hubungan erat, tatap muka, bersifat informal'],
        ['Kelompok Sekunder', 'Hubungan formal, keanggotaan berdasarkan tujuan'],
      ]);
      setNumRows(3);
      setNumCols(2);
      setHasHeader(true);
    } else if (presetType === 'statements') {
      setHeaders(['No', 'Pernyataan / Indikator Soal', 'Status']);
      setGridData([
        ['1', 'Globalisasi mempercepat pertukaran informasi antar negara.', 'Benar'],
        ['2', 'Urbanisasi selalu membawa dampak positif bagi lingkungan kota.', 'Salah'],
      ]);
      setNumRows(3);
      setNumCols(3);
      setHasHeader(true);
    }
    setActiveTab('custom');
  };

  const handleRowsChange = (newRowCount: number) => {
    const clamped = Math.max(1, Math.min(12, newRowCount));
    setNumRows(clamped);
    const dataRowTarget = hasHeader ? clamped - 1 : clamped;

    setGridData((prev) => {
      const updated = [...prev];
      while (updated.length < dataRowTarget) {
        const newRow = new Array(numCols).fill('');
        newRow[0] = String(updated.length + 1);
        updated.push(newRow);
      }
      while (updated.length > dataRowTarget && updated.length > 0) {
        updated.pop();
      }
      return updated;
    });
  };

  const handleColsChange = (newColCount: number) => {
    const clamped = Math.max(1, Math.min(6, newColCount));
    setNumCols(clamped);

    setHeaders((prev) => {
      const updated = [...prev];
      while (updated.length < clamped) {
        updated.push(`Kolom ${updated.length + 1}`);
      }
      while (updated.length > clamped) {
        updated.pop();
      }
      return updated;
    });

    setGridData((prev) => {
      return prev.map((row) => {
        const updated = [...row];
        while (updated.length < clamped) {
          updated.push('');
        }
        while (updated.length > clamped) {
          updated.pop();
        }
        return updated;
      });
    });
  };

  const handleHeaderCellChange = (colIdx: number, val: string) => {
    setHeaders((prev) => {
      const updated = [...prev];
      updated[colIdx] = val;
      return updated;
    });
  };

  const handleDataCellChange = (rowIdx: number, colIdx: number, val: string) => {
    setGridData((prev) => {
      const updated = prev.map((r) => [...r]);
      if (updated[rowIdx]) {
        updated[rowIdx][colIdx] = val;
      }
      return updated;
    });
  };

  // Build full clean HTML table
  const generateTableHtml = () => {
    let headerBgClass = 'bg-slate-100 text-slate-800';
    let headerBorderClass = 'border-slate-300';

    if (headerTheme === 'indigo') {
      headerBgClass = 'bg-indigo-600 text-white';
      headerBorderClass = 'border-indigo-500';
    } else if (headerTheme === 'sky') {
      headerBgClass = 'bg-sky-600 text-white';
      headerBorderClass = 'border-sky-500';
    } else if (headerTheme === 'emerald') {
      headerBgClass = 'bg-emerald-700 text-white';
      headerBorderClass = 'border-emerald-600';
    } else if (headerTheme === 'amber') {
      headerBgClass = 'bg-amber-600 text-white';
      headerBorderClass = 'border-amber-500';
    }

    let html = `<table class="w-full border-collapse border border-slate-300 my-3 text-xs sm:text-sm bg-white rounded-lg overflow-hidden shadow-2xs">\n`;

    if (hasHeader && headers.length > 0) {
      html += `  <thead>\n    <tr class="${headerBgClass} font-bold">\n`;
      headers.forEach((h, i) => {
        const align = i === 0 && (h.toLowerCase().includes('no') || h === '#') ? 'text-center' : 'text-left';
        html += `      <th class="border ${headerBorderClass} p-2.5 ${align}">${h || `Kolom ${i + 1}`}</th>\n`;
      });
      html += `    </tr>\n  </thead>\n`;
    }

    html += `  <tbody>\n`;
    gridData.forEach((row, rIdx) => {
      const bgRowClass = rIdx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white';
      html += `    <tr class="${bgRowClass}">\n`;
      row.forEach((cell, cIdx) => {
        const align = cIdx === 0 && (headers[0]?.toLowerCase().includes('no') || cell.length <= 3) ? 'text-center' : 'text-left';
        html += `      <td class="border border-slate-300 p-2.5 ${align}">${cell.trim() || '&nbsp;'}</td>\n`;
      });
      html += `    </tr>\n`;
    });

    html += `  </tbody>\n</table>`;
    return html;
  };

  const handleConfirmInsert = () => {
    const tableHtml = generateTableHtml();
    onInsertTable(tableHtml);
    showAlert('Tabel berhasil disisipkan tanpa mengubah teks yang ada!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-700 via-indigo-700 to-purple-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <Table className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>Pembuat & Generator Tabel Soal</span>
                <span className="text-[10px] uppercase font-black tracking-wider bg-sky-400/30 text-sky-100 px-2 py-0.5 rounded-full border border-sky-300/30">
                  Aman Teks
                </span>
              </h3>
              <p className="text-xs text-sky-100/90 font-medium">
                Buat tabel rapi untuk soal MIPA, IPS, & Bahasa tanpa merusak teks yang sudah dirangkai.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100/80 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between shrink-0 gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Template Siap Pakai</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-sky-600" />
              <span>Editor Grid Tabel ({numRows}x{numCols})</span>
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Warna:</span>
            <button
              type="button"
              onClick={() => setHeaderTheme('indigo')}
              className={`w-5 h-5 rounded-full bg-indigo-600 border-2 ${headerTheme === 'indigo' ? 'border-slate-800 scale-110' : 'border-transparent'}`}
              title="Indigo Theme"
            />
            <button
              type="button"
              onClick={() => setHeaderTheme('sky')}
              className={`w-5 h-5 rounded-full bg-sky-600 border-2 ${headerTheme === 'sky' ? 'border-slate-800 scale-110' : 'border-transparent'}`}
              title="Sky Blue Theme"
            />
            <button
              type="button"
              onClick={() => setHeaderTheme('emerald')}
              className={`w-5 h-5 rounded-full bg-emerald-600 border-2 ${headerTheme === 'emerald' ? 'border-slate-800 scale-110' : 'border-transparent'}`}
              title="Emerald Green Theme"
            />
            <button
              type="button"
              onClick={() => setHeaderTheme('amber')}
              className={`w-5 h-5 rounded-full bg-amber-600 border-2 ${headerTheme === 'amber' ? 'border-slate-800 scale-110' : 'border-transparent'}`}
              title="Amber Orange Theme"
            />
            <button
              type="button"
              onClick={() => setHeaderTheme('slate')}
              className={`w-5 h-5 rounded-full bg-slate-700 border-2 ${headerTheme === 'slate' ? 'border-slate-800 scale-110' : 'border-transparent'}`}
              title="Slate Gray Theme"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 grow">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Preset 1 */}
              <div
                onClick={() => handleSelectPreset('standard3')}
                className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-800 group-hover:text-indigo-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>1. Tabel Standar (3 Kolom)</span>
                    </span>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                      IPS / Sosiologi / Sejarah
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Tabel klasifikasi indikator, faktor pendukung, atau kategori perubahan sosial.
                  </p>
                  <div className="bg-white rounded-lg p-2 border border-slate-200 text-[11px] font-mono text-slate-600">
                    <div className="grid grid-cols-3 font-bold bg-indigo-50 p-1 rounded border-b border-slate-200">
                      <span>No</span>
                      <span>Kategori</span>
                      <span>Keterangan</span>
                    </div>
                    <div className="grid grid-cols-3 p-1">
                      <span>1</span>
                      <span>Internal</span>
                      <span>Penemuan baru</span>
                    </div>
                  </div>
                </div>
                <button className="mt-3 text-xs font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 pt-2">
                  <span>Gunakan & Edit Template Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preset 2 */}
              <div
                onClick={() => handleSelectPreset('dataNumbers')}
                className="bg-gradient-to-br from-slate-50 to-sky-50/30 p-4 rounded-2xl border-2 border-slate-200 hover:border-sky-500 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-800 group-hover:text-sky-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span>2. Tabel Data & Percobaan (4 Kolom)</span>
                    </span>
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                      Fisika / Kimia / Biologi
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Cocok untuk data praktikum, sampel larutan, hasil pengukuran, atau percobaan MIPA.
                  </p>
                  <div className="bg-white rounded-lg p-2 border border-slate-200 text-[11px] font-mono text-slate-600">
                    <div className="grid grid-cols-4 font-bold bg-sky-50 p-1 rounded border-b border-slate-200">
                      <span>No</span>
                      <span>Sampel</span>
                      <span>Kons.</span>
                      <span>Pengamatan</span>
                    </div>
                    <div className="grid grid-cols-4 p-1">
                      <span>1</span>
                      <span>Larutan A</span>
                      <span>0,1 M</span>
                      <span>Biru Tua</span>
                    </div>
                  </div>
                </div>
                <button className="mt-3 text-xs font-bold text-sky-600 group-hover:text-sky-800 flex items-center gap-1 pt-2">
                  <span>Gunakan & Edit Template Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preset 3 */}
              <div
                onClick={() => handleSelectPreset('comparison2')}
                className="bg-gradient-to-br from-slate-50 to-emerald-50/30 p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-800 group-hover:text-emerald-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>3. Tabel Perbandingan (2 Kolom)</span>
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      Ekonomi / B. Indo / B. Inggris
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Tabel matriks perbandingan 2 kolom tanpa nomor baris.
                  </p>
                  <div className="bg-white rounded-lg p-2 border border-slate-200 text-[11px] font-mono text-slate-600">
                    <div className="grid grid-cols-2 font-bold bg-emerald-50 p-1 rounded border-b border-slate-200">
                      <span>Aspek Perbandingan</span>
                      <span>Karakteristik Utama</span>
                    </div>
                    <div className="grid grid-cols-2 p-1">
                      <span>Kelompok Primer</span>
                      <span>Hubungan tatap muka</span>
                    </div>
                  </div>
                </div>
                <button className="mt-3 text-xs font-bold text-emerald-600 group-hover:text-emerald-800 flex items-center gap-1 pt-2">
                  <span>Gunakan & Edit Template Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preset 4 */}
              <div
                onClick={() => handleSelectPreset('statements')}
                className="bg-gradient-to-br from-slate-50 to-amber-50/30 p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-500 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-800 group-hover:text-amber-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>4. Tabel Pernyataan & Kategori</span>
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                      PG Kompleks / Benar-Salah
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Menyajikan daftar pernyataan dengan kolom status atau centang.
                  </p>
                  <div className="bg-white rounded-lg p-2 border border-slate-200 text-[11px] font-mono text-slate-600">
                    <div className="grid grid-cols-3 font-bold bg-amber-50 p-1 rounded border-b border-slate-200">
                      <span>No</span>
                      <span>Pernyataan</span>
                      <span>Status</span>
                    </div>
                    <div className="grid grid-cols-3 p-1">
                      <span>1</span>
                      <span>Globalisasi mempercepat...</span>
                      <span>Benar</span>
                    </div>
                  </div>
                </div>
                <button className="mt-3 text-xs font-bold text-amber-600 group-hover:text-amber-800 flex items-center gap-1 pt-2">
                  <span>Gunakan & Edit Template Ini</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Controls */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Jumlah Kolom (1 - 6):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleColsChange(numCols - 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-black text-sm text-indigo-700 px-2">{numCols} Kolom</span>
                    <button
                      type="button"
                      onClick={() => handleColsChange(numCols + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">
                    Total Baris Data (1 - 12):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRowsChange(numRows - 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-black text-sm text-indigo-700 px-2">{numRows} Baris</span>
                    <button
                      type="button"
                      onClick={() => handleRowsChange(numRows + 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => setHasHeader(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Gunakan Baris Judul (Header)</span>
                  </label>
                </div>
              </div>

              {/* Editable Grid Table Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Edit Isi Sel Tabel Langsung:
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Ketik langsung di dalam kolom untuk mengisi data soal
                  </span>
                </div>

                <div className="overflow-x-auto border-2 border-slate-300 rounded-2xl shadow-xs bg-white">
                  <table className="w-full text-xs border-collapse">
                    {hasHeader && (
                      <thead>
                        <tr className="bg-indigo-600 text-white font-bold">
                          {headers.map((h, cIdx) => (
                            <th key={cIdx} className="border border-indigo-500 p-2">
                              <input
                                type="text"
                                value={h}
                                onChange={(e) => handleHeaderCellChange(cIdx, e.target.value)}
                                placeholder={`Header ${cIdx + 1}`}
                                className="w-full bg-indigo-700 text-white font-bold p-1 rounded focus:outline-none focus:ring-2 focus:ring-white text-xs text-center"
                              />
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {gridData.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="border border-slate-300 p-1.5">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleDataCellChange(rIdx, cIdx, e.target.value)}
                                placeholder="..."
                                className="w-full bg-transparent p-1 text-slate-800 font-medium focus:bg-amber-50 rounded focus:outline-none text-xs"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl text-xs text-sky-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Jaminan Keamanan Teks:</strong> Menyisipkan tabel dari sini tidak akan menghapus atau mengubah teks soal yang sudah disusun sebelumnya.
                </p>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Tabel akan disisipkan dengan format HTML responsif yang kompatibel di HP dan Laptop.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmInsert}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 font-extrabold text-white text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Sisipkan Tabel ke Soal</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
