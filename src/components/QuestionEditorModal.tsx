import React, { useState, useEffect, useRef } from 'react';
import { Question, Option } from '../types';
import { formatQuestionText } from '../utils/questionFormatter';
import { Edit3, PlusCircle, CheckCircle2, Save, X, Image as ImageIcon, Upload, Trash2, Table, Link as LinkIcon, FileImage, Eye, Sparkles, Tag, Calculator, Zap, FlaskConical, FileEdit, Type, Underline as UnderlineIcon } from 'lucide-react';
import { MathFormulaModal } from './MathFormulaModal';
import { TableBuilderModal } from './TableBuilderModal';
import { TextCorrectionModal } from './TextCorrectionModal';

interface QuestionEditorModalProps {
  isOpen: boolean;
  editingQuestion: Question | null;
  mapelList?: string[];
  defaultMapel?: string;
  defaultKodeGuru?: string;
  onSave: (questionData: {
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
    id?: number;
    categoryOptions?: string[];
    categoryStatements?: { id: string; statement: string; correctCategory: string; image?: string }[];
  }) => void;
  onClose: () => void;
  showAlert: (msg: string) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  editingQuestion,
  mapelList = [
    'Matematika Tingkat Lanjut',
    'Bahasa Indonesia Tingkat Lanjut',
    'Bahasa Inggris Tingkat Lanjut',
    'Fisika',
    'Kimia',
    'Biologi',
    'Pendidikan Pancasila dan Kewarganegaraan',
    'Ekonomi',
    'Geografi',
    'Sosiologi',
    'Sejarah',
    'Antropologi',
    'Bahasa Prancis',
    'Bahasa Jerman',
    'Bahasa Jepang',
    'Bahasa Mandarin',
    'Bahasa Korea',
    'Bahasa Arab',
    'Matematika',
    'Bahasa Indonesia',
    'Bahasa Inggris',
  ],
  defaultMapel = 'Sosiologi',
  defaultKodeGuru = 'GURU01',
  onSave,
  onClose,
  showAlert,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [explanationImages, setExplanationImages] = useState<string[]>([]);
  const [selectedMapel, setSelectedMapel] = useState<string>(defaultMapel);
  const [kompetensiText, setKompetensiText] = useState<string>('');
  const [subTopikText, setSubTopikText] = useState<string>('');
  const [bentukSoalText, setBentukSoalText] = useState<string>('Pilihan Ganda');
  const [kodeGuruText, setKodeGuruText] = useState<string>(defaultKodeGuru);
  const [poinVal, setPoinVal] = useState<number>(10);
  const [questionImages, setQuestionImages] = useState<string[]>([]);
  const [imagePosition, setImagePosition] = useState<'top' | 'middle' | 'bottom'>('top');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [optionsText, setOptionsText] = useState<string[]>(['', '', '', '', '']);
  const [optionImages, setOptionImages] = useState<string[]>(['', '', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [mcmaCorrectIndices, setMcmaCorrectIndices] = useState<number[]>([0]);
  const [categoryOptionsList, setCategoryOptionsList] = useState<string[]>(['Benar', 'Salah']);
  const [categoryStatementsList, setCategoryStatementsList] = useState<{ id: string; statement: string; correctCategory: string; image?: string }[]>([
    { id: '1', statement: '', correctCategory: 'Benar' },
    { id: '2', statement: '', correctCategory: 'Salah' },
  ]);
  const [statementUrlInputIdx, setStatementUrlInputIdx] = useState<number | null>(null);
  const [statementUrlInputValue, setStatementUrlInputValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Ref for Question Textarea for cursor-accurate insertions
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Table Builder Modal State
  const [isTableBuilderOpen, setIsTableBuilderOpen] = useState<boolean>(false);

  // Simbol Koreksi Format Teks (Proofreading Marks) State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState<boolean>(false);
  const [selectedTextForModal, setSelectedTextForModal] = useState<string>('');

  // Math, Physics & Chemistry Formula Modal State
  const [isMathModalOpen, setIsMathModalOpen] = useState<boolean>(false);
  const [mathTargetField, setMathTargetField] = useState<'question' | 'optA' | 'optB' | 'optC' | 'optD' | 'optE' | 'explanation'>('question');

  const handleOpenCorrectionModal = () => {
    let highlighted = '';
    if (questionTextareaRef.current) {
      const textarea = questionTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (end > start) {
        highlighted = questionText.substring(start, end);
      }
    }
    setSelectedTextForModal(highlighted);
    setIsCorrectionModalOpen(true);
  };

  const handleFormatSelectedText = (
    type: 'italic' | 'bold' | 'boldItalic' | 'allcaps' | 'lowercase' | 'titlecase' | 'proof_italic' | 'proof_bold' | 'proof_allcaps' | 'proof_lowercase' | 'proof_boldItalic'
  ) => {
    if (questionTextareaRef.current) {
      const textarea = questionTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = questionText.substring(start, end);
      const targetText = selected || 'kata';

      let replacement = '';
      if (type === 'italic') replacement = `<i>${targetText}</i>`;
      else if (type === 'bold') replacement = `<b>${targetText}</b>`;
      else if (type === 'boldItalic') replacement = `<b><i>${targetText}</i></b>`;
      else if (type === 'allcaps') replacement = targetText.toUpperCase();
      else if (type === 'lowercase') replacement = targetText.toLowerCase();
      else if (type === 'titlecase') replacement = targetText.replace(/\b\w/g, (c) => c.toUpperCase());
      else if (type === 'proof_italic') replacement = `___${targetText}___`;
      else if (type === 'proof_bold') replacement = `~~~${targetText}~~~`;
      else if (type === 'proof_allcaps') replacement = `☰${targetText.toUpperCase()}☰`;
      else if (type === 'proof_lowercase') replacement = `/${targetText.toLowerCase()}/`;
      else if (type === 'proof_boldItalic') replacement = `~~~___${targetText}___~~~`;

      const before = questionText.substring(0, start);
      const after = questionText.substring(end);
      const newText = before + replacement + after;
      setQuestionText(newText);

      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          const newPos = start + replacement.length;
          textarea.setSelectionRange(newPos, newPos);
        }
      }, 50);

      const labelMap: Record<string, string> = {
        italic: 'Cetak Miring (Italic)',
        bold: 'Cetak Tebal (Bold)',
        boldItalic: 'Cetak Miring & Tebal',
        allcaps: 'Huruf Kapital Semua (All Caps)',
        lowercase: 'Huruf Kecil (Lowercase)',
        titlecase: 'Kapital Awal Kata',
        proof_italic: 'Simbol Koreksi Miring (___)',
        proof_bold: 'Simbol Koreksi Tebal (~~~)',
        proof_allcaps: 'Simbol Koreksi Kapital (☰)',
        proof_lowercase: 'Simbol Koreksi Huruf Kecil (/)',
        proof_boldItalic: 'Simbol Koreksi Tebal-Miring (~~~___)',
      };
      showAlert(`Format "${labelMap[type] || type}" berhasil diterapkan!`);
    } else {
      insertAtCursor(`<i>kata</i>`);
    }
  };

  const insertAtCursor = (textToInsert: string) => {
    if (questionTextareaRef.current) {
      const textarea = questionTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = questionText;

      const before = currentVal.substring(0, start);
      const after = currentVal.substring(end);

      // Smart newline separation for block elements like tables
      const isBlockHtml = textToInsert.trim().startsWith('<table') || textToInsert.trim().startsWith('<div');
      const prefix = isBlockHtml && before && !before.endsWith('\n') ? '\n\n' : (before && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '');
      const suffix = isBlockHtml && after && !after.startsWith('\n') ? '\n\n' : '';

      const newText = before + prefix + textToInsert + suffix + after;
      setQuestionText(newText);

      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          const newCursorPos = start + prefix.length + textToInsert.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 50);
    } else {
      setQuestionText((prev) => (prev ? `${prev}\n\n${textToInsert}` : textToInsert));
    }
  };

  const handleOpenMathModal = (field: 'question' | 'optA' | 'optB' | 'optC' | 'optD' | 'optE' | 'explanation') => {
    setMathTargetField(field);
    setIsMathModalOpen(true);
  };

  const handleInsertFormulaFromModal = (
    formula: string,
    field: 'question' | 'optA' | 'optB' | 'optC' | 'optD' | 'optE' | 'explanation'
  ) => {
    if (field === 'question') {
      insertAtCursor(formula);
    } else if (field === 'explanation') {
      setExplanationText((prev) => (prev ? `${prev} ${formula}` : formula));
    } else if (field.startsWith('opt')) {
      const optIdx = ['optA', 'optB', 'optC', 'optD', 'optE'].indexOf(field);
      if (optIdx >= 0) {
        setOptionsText((prev) => {
          const updated = [...prev];
          updated[optIdx] = updated[optIdx] ? `${updated[optIdx]} ${formula}` : formula;
          return updated;
        });
      }
    }
  };

  const labels = ['A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    setActiveTab('editor');
    if (editingQuestion) {
      setQuestionText(editingQuestion.question);
      setExplanationText(editingQuestion.explanation || '');
      
      let expImgs: string[] = [];
      if (editingQuestion.explanationImages && Array.isArray(editingQuestion.explanationImages) && editingQuestion.explanationImages.length > 0) {
        expImgs = editingQuestion.explanationImages.filter((img) => typeof img === 'string' && img.trim() !== '');
      } else if (editingQuestion.explanationImage && editingQuestion.explanationImage.trim()) {
        expImgs = [editingQuestion.explanationImage.trim()];
      }
      setExplanationImages(expImgs);

      setSelectedMapel(editingQuestion.mapel || defaultMapel);
      const komp = editingQuestion.kompetensi || editingQuestion.subTopik || '';
      setKompetensiText(komp);
      setSubTopikText(komp);
      
      const bentuk = editingQuestion.bentukSoal || 'Pilihan Ganda';
      setBentukSoalText(bentuk);
      setKodeGuruText(editingQuestion.kodeGuru || defaultKodeGuru || 'GURU01');
      setPoinVal(typeof editingQuestion.poin === 'number' && editingQuestion.poin > 0 ? editingQuestion.poin : 10);
      
      let imgs: string[] = [];
      if (editingQuestion.images && Array.isArray(editingQuestion.images) && editingQuestion.images.length > 0) {
        imgs = editingQuestion.images.filter((img) => typeof img === 'string' && img.trim() !== '');
      } else if (editingQuestion.image && editingQuestion.image.trim()) {
        imgs = [editingQuestion.image.trim()];
      }
      setQuestionImages(imgs);
      setImagePosition(editingQuestion.imagePosition || 'top');
      setImageUrlInput('');

      const optTexts = labels.map((label, idx) => {
        const found = editingQuestion.options?.find(o => o.id === label) || editingQuestion.options?.[idx];
        return found ? found.text : '';
      });
      setOptionsText(optTexts);

      const optImgs = labels.map((label, idx) => {
        const found = editingQuestion.options?.find(o => o.id === label) || editingQuestion.options?.[idx];
        return found?.image || '';
      });
      setOptionImages(optImgs);

      const correctIndices = (editingQuestion.options || [])
        .map((o, idx) => (o.isCorrect ? idx : -1))
        .filter((idx) => idx >= 0);
      
      setCorrectIndex(correctIndices.length > 0 ? correctIndices[0] : 0);
      setMcmaCorrectIndices(correctIndices.length > 0 ? correctIndices : [0]);

      if (editingQuestion.categoryOptions && editingQuestion.categoryOptions.length > 0) {
        setCategoryOptionsList(editingQuestion.categoryOptions);
      } else {
        setCategoryOptionsList(['Benar', 'Salah']);
      }

      if (editingQuestion.categoryStatements && editingQuestion.categoryStatements.length > 0) {
        setCategoryStatementsList(
          editingQuestion.categoryStatements.map((st, idx) => ({
            id: st.id || String(idx + 1),
            statement: st.statement,
            correctCategory: st.correctCategory,
            image: st.image || undefined,
          }))
        );
      } else {
        setCategoryStatementsList([
          { id: '1', statement: '', correctCategory: 'Benar' },
          { id: '2', statement: '', correctCategory: 'Salah' },
        ]);
      }
      setStatementUrlInputIdx(null);
      setStatementUrlInputValue('');
    } else {
      setQuestionText('');
      setExplanationText('');
      setExplanationImages([]);
      setSelectedMapel(defaultMapel);
      setKompetensiText('');
      setSubTopikText('');
      setBentukSoalText('Pilihan Ganda');
      setKodeGuruText(defaultKodeGuru || 'GURU01');
      setPoinVal(10);
      setQuestionImages([]);
      setImagePosition('top');
      setImageUrlInput('');
      setOptionsText(['', '', '', '', '']);
      setOptionImages(['', '', '', '', '']);
      setCorrectIndex(0);
      setMcmaCorrectIndices([0]);
      setCategoryOptionsList(['Benar', 'Salah']);
      setCategoryStatementsList([
        { id: '1', statement: '', correctCategory: 'Benar' },
        { id: '2', statement: '', correctCategory: 'Salah' },
      ]);
    }
  }, [editingQuestion, isOpen, defaultMapel, defaultKodeGuru]);

  if (!isOpen) return null;

  const handleToggleMcmaIndex = (idx: number) => {
    setMcmaCorrectIndices((prev) => {
      if (prev.includes(idx)) {
        if (prev.length <= 1) return prev; // At least 1 must be correct
        return prev.filter((i) => i !== idx);
      } else {
        return [...prev, idx].sort((a, b) => a - b);
      }
    });
  };

  const handleAddCategoryStatement = () => {
    setCategoryStatementsList((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        statement: '',
        correctCategory: categoryOptionsList[0] || 'Benar',
      },
    ]);
  };

  const handleRemoveCategoryStatement = (index: number) => {
    if (categoryStatementsList.length <= 1) {
      showAlert('Minimal harus ada 1 pernyataan!');
      return;
    }
    setCategoryStatementsList((prev) => prev.filter((_, i) => i !== index));
    if (statementUrlInputIdx === index) {
      setStatementUrlInputIdx(null);
      setStatementUrlInputValue('');
    }
  };

  const handleCategoryStatementImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('Format file harus berupa gambar (JPG, PNG, GIF, WEBP)!');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showAlert('Ukuran file gambar pernyataan terlalu besar (Maksimal 8 MB)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (rawResult) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.72);
            setCategoryStatementsList((prev) => {
              const updated = [...prev];
              updated[index] = { ...updated[index], image: compressed };
              return updated;
            });
          } else {
            setCategoryStatementsList((prev) => {
              const updated = [...prev];
              updated[index] = { ...updated[index], image: rawResult };
              return updated;
            });
          }
          showAlert(`Gambar untuk Pernyataan #${index + 1} berhasil diunggah!`);
        };
        img.onerror = () => {
          setCategoryStatementsList((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], image: rawResult };
            return updated;
          });
          showAlert(`Gambar untuk Pernyataan #${index + 1} berhasil diunggah!`);
        };
        img.src = rawResult;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveCategoryStatementImage = (index: number) => {
    setCategoryStatementsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], image: undefined };
      return updated;
    });
    showAlert(`Gambar untuk Pernyataan #${index + 1} dihapus.`);
  };

  const handleApplyCategoryStatementUrl = (index: number) => {
    const trimmed = statementUrlInputValue.trim();
    if (!trimmed) {
      showAlert('Masukkan link/URL gambar yang valid!');
      return;
    }
    setCategoryStatementsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], image: trimmed };
      return updated;
    });
    setStatementUrlInputIdx(null);
    setStatementUrlInputValue('');
    showAlert(`URL Gambar untuk Pernyataan #${index + 1} berhasil disimpan!`);
  };

  const handleToggleStatementUrlInput = (index: number) => {
    if (statementUrlInputIdx === index) {
      setStatementUrlInputIdx(null);
      setStatementUrlInputValue('');
    } else {
      setStatementUrlInputIdx(index);
      setStatementUrlInputValue(categoryStatementsList[index]?.image || '');
    }
  };

  const handleMultipleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        showAlert(`File ${file.name} bukan format gambar!`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        showAlert(`Ukuran gambar ${file.name} terlalu besar (> 8 MB)!`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    let processedCount = 0;
    const newCompressedList: string[] = [];

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        if (rawResult) {
          const img = new Image();
          img.onload = () => {
            const maxDim = 750;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.75);
              newCompressedList.push(compressed);
            } else {
              newCompressedList.push(rawResult);
            }
            processedCount++;
            if (processedCount === validFiles.length) {
              setQuestionImages((prev) => [...prev, ...newCompressedList]);
              showAlert(`${validFiles.length} gambar/tabel berhasil diunggah!`);
            }
          };
          img.onerror = () => {
            newCompressedList.push(rawResult);
            processedCount++;
            if (processedCount === validFiles.length) {
              setQuestionImages((prev) => [...prev, ...newCompressedList]);
              showAlert(`${validFiles.length} gambar/tabel berhasil diunggah!`);
            }
          };
          img.src = rawResult;
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveQuestionImage = (index: number) => {
    setQuestionImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExplanationImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        showAlert(`File ${file.name} bukan format gambar!`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        showAlert(`Ukuran gambar ${file.name} terlalu besar (> 8 MB)!`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    let processedCount = 0;
    const newCompressedList: string[] = [];

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        if (rawResult) {
          const img = new Image();
          img.onload = () => {
            const maxDim = 750;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.75);
              newCompressedList.push(compressed);
            } else {
              newCompressedList.push(rawResult);
            }
            processedCount++;
            if (processedCount === validFiles.length) {
              setExplanationImages((prev) => [...prev, ...newCompressedList]);
              showAlert(`${validFiles.length} gambar pembahasan berhasil diunggah!`);
            }
          };
          img.onerror = () => {
            newCompressedList.push(rawResult);
            processedCount++;
            if (processedCount === validFiles.length) {
              setExplanationImages((prev) => [...prev, ...newCompressedList]);
              showAlert(`${validFiles.length} gambar pembahasan berhasil diunggah!`);
            }
          };
          img.src = rawResult;
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveExplanationImage = (index: number) => {
    setExplanationImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveQuestionImage = (index: number, direction: 'left' | 'right') => {
    setQuestionImages((prev) => {
      const list = [...prev];
      const targetIdx = direction === 'left' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIdx];
      list[targetIdx] = temp;
      return list;
    });
  };

  const handleApplyQuestionImageUrl = () => {
    if (!imageUrlInput.trim()) {
      showAlert('Masukkan URL gambar yang valid!');
      return;
    }
    setQuestionImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
    setShowUrlInput(false);
    showAlert('URL gambar ditambahkan!');
  };

  const handleInsertTableTemplate = () => {
    const tableHtml = `
<table class="w-full border-collapse border border-slate-300 my-3 text-xs sm:text-sm">
  <thead>
    <tr class="bg-slate-100 font-bold text-slate-800">
      <th class="border border-slate-300 p-2 text-center">No</th>
      <th class="border border-slate-300 p-2 text-left">Faktor / Kategori</th>
      <th class="border border-slate-300 p-2 text-left">Keterangan</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-slate-300 p-2 text-center">1</td>
      <td class="border border-slate-300 p-2">Faktor Internal</td>
      <td class="border border-slate-300 p-2">Penemuan baru, konflik sosial</td>
    </tr>
    <tr>
      <td class="border border-slate-300 p-2 text-center">2</td>
      <td class="border border-slate-300 p-2">Faktor Eksternal</td>
      <td class="border border-slate-300 p-2">Pengaruh budaya asing, bencana alam</td>
    </tr>
  </tbody>
</table>
`.trim();

    setQuestionText((prev) => prev ? `${prev}\n\n${tableHtml}` : tableHtml);
    showAlert('Format Tabel HTML berhasil disisipkan ke dalam teks pertanyaan!');
  };

  const handleOptionImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('Format file harus berupa gambar (JPG, PNG, GIF, WEBP)!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert('Ukuran file gambar opsi terlalu besar (Maksimal 5 MB)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (rawResult) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.72);
            setOptionImages((prev) => {
              const updated = [...prev];
              updated[index] = compressed;
              return updated;
            });
          } else {
            setOptionImages((prev) => {
              const updated = [...prev];
              updated[index] = rawResult;
              return updated;
            });
          }
          showAlert(`Gambar untuk Pilihan ${labels[index]} berhasil diunggah!`);
        };
        img.onerror = () => {
          setOptionImages((prev) => {
            const updated = [...prev];
            updated[index] = rawResult;
            return updated;
          });
          showAlert(`Gambar untuk Pilihan ${labels[index]} berhasil diunggah!`);
        };
        img.src = rawResult;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveOptionImage = (index: number) => {
    setOptionImages((prev) => {
      const updated = [...prev];
      updated[index] = '';
      return updated;
    });
  };

  const handleSave = () => {
    const trimmedQuestion = questionText.trim();
    if (!trimmedQuestion) {
      showAlert('Teks pertanyaan tidak boleh kosong!');
      return;
    }

    const bentukLower = bentukSoalText.toLowerCase();

    // 1. Handling Pilihan Ganda Kompleks Kategori
    if (bentukLower.includes('kategori')) {
      if (categoryStatementsList.length === 0) {
        showAlert('Tambahkan minimal 1 pernyataan untuk soal Kategori!');
        return;
      }
      for (let i = 0; i < categoryStatementsList.length; i++) {
        if (!categoryStatementsList[i].statement.trim()) {
          showAlert(`Pernyataan #${i + 1} tidak boleh kosong!`);
          return;
        }
      }

      onSave({
        id: editingQuestion?.id,
        question: formatQuestionText(trimmedQuestion),
        options: [],
        explanation: explanationText.trim() || 'Tidak ada pembahasan.',
        explanationImage: explanationImages.length > 0 ? explanationImages[0] : undefined,
        explanationImages: explanationImages.length > 0 ? explanationImages : undefined,
        image: questionImages.length > 0 ? questionImages[0] : undefined,
        images: questionImages.length > 0 ? questionImages : undefined,
        imagePosition: questionImages.length > 0 ? imagePosition : undefined,
        mapel: selectedMapel,
        kompetensi: kompetensiText.trim() || subTopikText.trim() || undefined,
        subTopik: subTopikText.trim() || kompetensiText.trim() || undefined,
        bentukSoal: 'Pilihan Ganda Kompleks Kategori',
        kodeGuru: kodeGuruText.trim().toUpperCase() || defaultKodeGuru || 'GURU01',
        poin: poinVal,
        categoryOptions: categoryOptionsList,
        categoryStatements: categoryStatementsList.map((st, idx) => ({
          id: String(idx + 1),
          statement: st.statement.trim(),
          correctCategory: st.correctCategory,
          image: st.image && st.image.trim() ? st.image.trim() : undefined,
        })),
      });
      return;
    }

    // 2. Handling PG Sederhana and MCMA
    for (let i = 0; i < 5; i++) {
      if (!optionsText[i].trim()) {
        showAlert(`Pilihan ${labels[i]} tidak boleh kosong!`);
        return;
      }
    }

    let isMcma = bentukLower.includes('mcma') || (bentukLower.includes('kompleks') && !bentukLower.includes('kategori'));
    
    if (isMcma && mcmaCorrectIndices.length === 0) {
      showAlert('Pilih minimal 1 kunci jawaban benar untuk soal MCMA!');
      return;
    }

    const options: Option[] = labels.map((label, i) => ({
      id: label,
      text: optionsText[i].trim(),
      isCorrect: isMcma ? mcmaCorrectIndices.includes(i) : i === correctIndex,
      image: optionImages[i]?.trim() || undefined,
    }));

    onSave({
      id: editingQuestion?.id,
      question: formatQuestionText(trimmedQuestion),
      options,
      explanation: explanationText.trim() || 'Tidak ada pembahasan.',
      explanationImage: explanationImages.length > 0 ? explanationImages[0] : undefined,
      explanationImages: explanationImages.length > 0 ? explanationImages : undefined,
      image: questionImages.length > 0 ? questionImages[0] : undefined,
      images: questionImages.length > 0 ? questionImages : undefined,
      imagePosition: questionImages.length > 0 ? imagePosition : undefined,
      mapel: selectedMapel,
      kompetensi: kompetensiText.trim() || subTopikText.trim() || undefined,
      subTopik: subTopikText.trim() || kompetensiText.trim() || undefined,
      bentukSoal: isMcma ? 'Pilihan Ganda Kompleks MCMA' : 'Pilihan Ganda',
      kodeGuru: kodeGuruText.trim().toUpperCase() || defaultKodeGuru || 'GURU01',
      poin: poinVal,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 text-white p-4 sm:p-5 font-bold text-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <span className="flex items-center gap-2">
            {editingQuestion ? <Edit3 className="w-5 h-5 text-sky-400" /> : <PlusCircle className="w-5 h-5 text-sky-400" />}
            {editingQuestion ? 'Edit Soal' : 'Tambah Soal Baru'}
          </span>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Form Input
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview Live
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {activeTab === 'editor' ? (
          <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
            {/* BANNER ANIMASI HIGHLIGHT FITUR BARU */}
            <div className="bg-gradient-to-r from-amber-500 via-sky-600 to-purple-600 p-0.5 rounded-2xl shadow-sm animate-pulse">
              <div className="bg-amber-50/90 p-3.5 rounded-[14px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border border-amber-200">
                <div className="flex items-center gap-2.5">
                  <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 animate-bounce">
                    <Sparkles className="w-3.5 h-3.5" /> FITUR BARU!
                  </span>
                  <p className="font-extrabold text-slate-900 leading-snug">
                    1️⃣ Posisi Gambar Soal (Atas / Tengah / Bawah) &nbsp;•&nbsp; 2️⃣ Gambar per Opsi Jawaban (A, B, C, D, E)
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-300 shrink-0">
                  ✨ LOKASI BERBAHAN BADGE "BARU"
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {/* 1. Mata Pelajaran */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMapel}
                  onChange={(e) => setSelectedMapel(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 focus:border-sky-500 focus:outline-none text-xs font-bold bg-white cursor-pointer"
                >
                  {mapelList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Kompetensi / Sub Topik */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Kompetensi / KD</span>
                </label>
                <input
                  type="text"
                  value={kompetensiText}
                  onChange={(e) => {
                    setKompetensiText(e.target.value);
                    setSubTopikText(e.target.value);
                  }}
                  placeholder="e.g. 3.1 Perubahan Sosial"
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 focus:border-sky-500 focus:outline-none text-xs font-semibold bg-white"
                />
              </div>

              {/* 3. Bentuk Soal */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Bentuk Soal <span className="text-red-500">*</span>
                </label>
                <select
                  value={bentukSoalText}
                  onChange={(e) => setBentukSoalText(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 focus:border-purple-500 focus:outline-none text-xs font-bold bg-white cursor-pointer"
                >
                  <option value="Pilihan Ganda">Pilihan Ganda (PG Sederhana)</option>
                  <option value="Pilihan Ganda Kompleks MCMA">Pilihan Ganda Kompleks MCMA (Ganda / Pilih Banyak)</option>
                  <option value="Pilihan Ganda Kompleks Kategori">Pilihan Ganda Kompleks Kategori (Benar/Salah / Ya/Tidak)</option>
                  <option value="Menjodohkan">Menjodohkan</option>
                  <option value="Isian Singkat">Isian Singkat</option>
                  <option value="Uraian">Uraian / Essay</option>
                </select>
              </div>

              {/* 4. Kode Guru */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Kode Guru</span>
                </label>
                <input
                  type="text"
                  value={kodeGuruText}
                  onChange={(e) => setKodeGuruText(e.target.value.toUpperCase())}
                  placeholder="Contoh: GURU01"
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none text-xs font-bold bg-white uppercase tracking-wider"
                />
              </div>

              {/* 5. Bobot Poin Soal */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>Bobot Poin</span>
                  <span className="text-emerald-600 font-extrabold text-[11px]">(Maks Skor 100)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={poinVal}
                  onChange={(e) => setPoinVal(Math.max(1, Number(e.target.value) || 1))}
                  placeholder="10"
                  className="w-full border-2 border-emerald-300 focus:border-emerald-500 rounded-xl p-2.5 font-bold text-xs bg-emerald-50/30 text-emerald-950 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <label className="block font-bold text-gray-800 text-sm">
                  Teks Pertanyaan <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenCorrectionModal}
                    className="text-xs font-black text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 hover:from-amber-500 hover:to-orange-500 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-amber-400/80"
                    title="Buka Panduan & Generator Simbol Koreksi Format Teks (Italic, Bold, Caps, lc, Bold-Italic)"
                  >
                    <FileEdit className="w-4 h-4 text-amber-900" />
                    <span>✍️ Simbol Koreksi Format</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenMathModal('question')}
                    className="text-xs font-black text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    title="Buka Editor Rumus Matematika, Fisika, & Kimia (MathType Style)"
                  >
                    <Calculator className="w-4 h-4 text-amber-300" />
                    <span>📐 Editor Rumus MIPA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTableBuilderOpen(true)}
                    className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
                    title="Buka pembuat tabel interaktif (Generator Tabel)"
                  >
                    <Table className="w-3.5 h-3.5 text-sky-600" /> Sisipkan Tabel
                  </button>
                </div>
              </div>

              {/* Text Formatting & Proofreading Marks Ribbon */}
              <div className="bg-gradient-to-r from-amber-50/90 via-slate-50 to-orange-50/60 p-2 rounded-2xl border border-amber-200/90 mb-2 space-y-1.5 shadow-2xs">
                {/* 1. Baris Simbol Koreksi Naskah (Proofreader's Marks) */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
                  <span className="font-extrabold text-[10px] text-amber-900 uppercase tracking-wider shrink-0 pl-1 flex items-center gap-1">
                    <FileEdit className="w-3.5 h-3.5 text-amber-700" />
                    <span>Tanda Koreksi:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('proof_italic')}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-lg text-amber-950 flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs text-[11px]"
                    title="Cetak Miring (Italic): Diberi garis bawah tunggal ( ___ ) pada kata atau kalimat"
                  >
                    <span className="underline decoration-1 italic font-serif font-bold">___ Miring</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('proof_bold')}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-lg text-amber-950 flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs text-[11px]"
                    title="Cetak Tebal (Bold): Diberi garis bawah gelombang ( ~~~ ) pada kata atau kalimat"
                  >
                    <span className="underline decoration-wavy font-bold font-serif">~~~ Tebal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('proof_allcaps')}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-lg text-amber-950 flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs text-[11px]"
                    title="Huruf Kapital Semua (All Caps): Diberi tiga garis bawah lurus ( ☰ )"
                  >
                    <span className="underline decoration-double font-bold uppercase tracking-wider font-mono">☰ KAPITAL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('proof_lowercase')}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-lg text-amber-950 flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs text-[11px]"
                    title="Huruf Kecil (Lowercase): Diberi garis miring ( / ) mencoret kata yang diubah menjadi huruf kecil"
                  >
                    <span className="line-through decoration-red-500 font-medium">/kecil/</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('proof_boldItalic')}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-lg text-amber-950 flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs text-[11px]"
                    title="Cetak Miring dan Tebal (Bold-Italic): Diberi gabungan garis bawah lurus dan garis bawah gelombang ( ~~~___kata___~~~ )"
                  >
                    <span className="underline decoration-wavy italic font-bold font-serif">~~~___ Tebal-Miring</span>
                  </button>
                </div>

                {/* 2. Baris Format Langsung + Cepat MIPA */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1 border-t border-amber-200/60">
                  <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider shrink-0 pl-1">Format:</span>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('bold')}
                    className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-300 rounded font-black text-slate-900 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs text-xs"
                    title="Jadikan Tebal (<b>)"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('italic')}
                    className="w-6 h-6 bg-white hover:bg-slate-100 border border-slate-300 rounded italic font-serif font-bold text-slate-900 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs text-xs"
                    title="Jadikan Miring (<i>)"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('boldItalic')}
                    className="px-1.5 h-6 bg-white hover:bg-slate-100 border border-slate-300 rounded italic font-serif font-black text-slate-900 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs text-xs"
                    title="Jadikan Tebal & Miring (<b><i>)"
                  >
                    BI
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('allcaps')}
                    className="px-1.5 h-6 bg-white hover:bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[11px] text-slate-900 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                    title="Ubah Huruf Menjadi KAPITAL SEMUA"
                  >
                    AA
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('lowercase')}
                    className="px-1.5 h-6 bg-white hover:bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[11px] text-slate-900 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                    title="Ubah Huruf Menjadi kecil semua"
                  >
                    aa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatSelectedText('titlecase')}
                    className="px-1.5 h-6 bg-white hover:bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[11px] text-slate-900 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                    title="Ubah Huruf Menjadi Huruf Besar di Awal Kata"
                  >
                    Aa
                  </button>

                  <span className="w-px h-4 bg-slate-300 shrink-0 mx-1" />
                  <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider shrink-0">MIPA:</span>
                  <button type="button" onClick={() => insertAtCursor('$x^2$')} className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-300 rounded font-mono font-bold text-indigo-900 cursor-pointer shrink-0" title="Pangkat / Eksponen">x²</button>
                  <button type="button" onClick={() => insertAtCursor('$x_n$')} className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-300 rounded font-mono font-bold text-indigo-900 cursor-pointer shrink-0" title="Subskrip">xₙ</button>
                  <button type="button" onClick={() => insertAtCursor('$\\frac{a}{b}$')} className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-300 rounded font-mono font-bold text-indigo-900 cursor-pointer shrink-0" title="Pecahan">a/b</button>
                  <button type="button" onClick={() => insertAtCursor('$\\sqrt{x}$')} className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-300 rounded font-mono font-bold text-indigo-900 cursor-pointer shrink-0" title="Akar">√x</button>
                  <button type="button" onClick={() => insertAtCursor('$\\pm$')} className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-300 rounded font-mono font-bold text-indigo-900 cursor-pointer shrink-0" title="Kurang Lebih">±</button>
                  <button type="button" onClick={() => insertAtCursor('$\\rightarrow$')} className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-300 rounded font-mono font-bold text-indigo-900 cursor-pointer shrink-0" title="Panah Reaksi">→</button>
                  <button type="button" onClick={() => insertAtCursor('$\\rightleftharpoons$')} className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-300 rounded font-mono font-bold text-indigo-900 cursor-pointer shrink-0" title="Kesetimbangan Kimia">⇌</button>
                  <button type="button" onClick={() => insertAtCursor('H_2O')} className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-300 rounded font-mono font-bold text-indigo-900 cursor-pointer shrink-0" title="Kimia H2O">H₂O</button>
                </div>
              </div>

              <textarea
                ref={questionTextareaRef}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-3 h-32 focus:border-blue-500 focus:outline-none resize-y text-sm transition-colors font-sans"
                placeholder="Masukkan teks pertanyaan lengkap (dukungan rumus MIPA, tabel HTML & LaTeX)..."
              />
            </div>

            {/* MENU TAMBAH GAMBAR / TABEL (BISA MULTIPLE GAMBAR) */}
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-sky-200/80 space-y-3 relative shadow-xs">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <label className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-600" /> Lampiran Gambar / Tabel / Diagram Soal
                  <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-2xs">
                    ✨ BISA MULTIPLE GAMBAR ({questionImages.length})
                  </span>
                </label>
                {questionImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuestionImages([])}
                    className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-red-200 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Gambar
                  </button>
                )}
              </div>

              {questionImages.length > 0 ? (
                <div className="space-y-4">
                  {/* Grid Gambar Soal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {questionImages.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className="relative bg-white p-2.5 rounded-xl border-2 border-sky-200 flex flex-col items-center justify-between group shadow-xs"
                      >
                        <div className="w-full flex justify-between items-center mb-1 text-[11px] font-bold text-slate-500">
                          <span className="bg-sky-100 text-sky-900 px-2 py-0.5 rounded-md font-mono text-[10px]">
                            Gambar #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveQuestionImage(idx, 'left')}
                                className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-slate-700 font-bold text-xs"
                                title="Geser Kiri"
                              >
                                ←
                              </button>
                            )}
                            {idx < questionImages.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveQuestionImage(idx, 'right')}
                                className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-slate-700 font-bold text-xs"
                                title="Geser Kanan"
                              >
                                →
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionImage(idx)}
                              className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                              title="Hapus Gambar Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <img
                          src={imgSrc}
                          alt={`Lampiran Soal #${idx + 1}`}
                          className="max-h-36 w-auto object-contain rounded-lg border border-slate-100 bg-slate-50 p-1"
                        />
                      </div>
                    ))}

                    {/* Tombol Tambah Gambar Lagi */}
                    <label className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-white hover:bg-sky-50/50 transition-all rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[120px] text-sky-700 font-bold text-xs gap-1.5 shadow-2xs">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                        multiple
                        onChange={handleMultipleImagesUpload}
                        className="hidden"
                      />
                      <PlusCircle className="w-6 h-6 text-sky-600" />
                      <span>+ Tambah Gambar Lain</span>
                      <span className="text-[10px] text-slate-400 font-normal">Pilih 1 atau beberapa file</span>
                    </label>
                  </div>

                  {/* PILIHAN POSISI GAMBAR SOAL */}
                  <div className="w-full pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">Posisi Letak Gambar Soal:</span>
                      <span className="bg-sky-100 text-sky-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-sky-300">
                        ✨ Berlaku untuk semua {questionImages.length} gambar
                      </span>
                    </div>
                    <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-300 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setImagePosition('top')}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                          imagePosition === 'top'
                            ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                            : 'text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Di Atas Teks
                      </button>
                      <button
                        type="button"
                        onClick={() => setImagePosition('middle')}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                          imagePosition === 'middle'
                            ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                            : 'text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Di Tengah Teks
                      </button>
                      <button
                        type="button"
                        onClick={() => setImagePosition('bottom')}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                          imagePosition === 'bottom'
                            ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                            : 'text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Di Bawah Teks
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-white hover:bg-sky-50/50 transition-all rounded-xl p-4 text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                      multiple
                      onChange={handleMultipleImagesUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-600">
                      <div className="p-2.5 bg-sky-100 text-sky-600 rounded-full">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-xs text-slate-800">
                        Klik atau Drag & Drop Gambar / Tabel di sini (Bisa pilih sekaligus banyak)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Mendukung format <b>JPG, PNG, WEBP, GIF</b> (Maksimal 8 MB per file)
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> {showUrlInput ? 'Sembunyikan Input URL' : 'Atau tambah via URL Link Gambar'}
                    </button>
                  </div>

                  {showUrlInput && (
                    <div className="flex gap-2 pt-1 animate-fade-in">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/gambar-soal.png"
                        className="flex-1 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyQuestionImageUrl}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Tambah Gambar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* EDITOR JAWABAN SESUAI BENTUK SOAL */}
            {bentukSoalText.toLowerCase().includes('kategori') ? (
              /* EDITOR SOAL KATEGORI (BENAR / SALAH) */
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <label className="block font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-600" /> Pengaturan Kategori & Pernyataan
                    </label>
                    <p className="text-xs text-indigo-700 font-medium mt-0.5">
                      Siswa akan memilih satu opsi kategori untuk setiap pernyataan di bawah ini.
                    </p>
                  </div>

                  {/* Preset Kategori */}
                  <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-indigo-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setCategoryOptionsList(['Benar', 'Salah'])}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        categoryOptionsList.join(',') === 'Benar,Salah'
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      Benar / Salah
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryOptionsList(['Ya', 'Tidak'])}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        categoryOptionsList.join(',') === 'Ya,Tidak'
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      Ya / Tidak
                    </button>
                  </div>
                </div>

                {/* List Pernyataan & Kunci Jawaban */}
                <div className="space-y-3">
                  {categoryStatementsList.map((st, idx) => (
                    <div key={st.id || idx} className="bg-white p-3.5 rounded-2xl border-2 border-indigo-100 shadow-2xs space-y-2.5">
                      <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                        <span className="font-extrabold text-xs text-indigo-800 bg-indigo-100 px-2.5 py-1.5 rounded-xl shrink-0">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={st.statement}
                          onChange={(e) => {
                            const updated = [...categoryStatementsList];
                            updated[idx].statement = e.target.value;
                            setCategoryStatementsList(updated);
                          }}
                          placeholder={`Tuliskan teks pernyataan #${idx + 1}...`}
                          className="flex-1 border-2 border-slate-200 rounded-xl p-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none bg-white w-full"
                        />
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
                          <span className="text-[11px] font-bold text-slate-500">Kunci:</span>
                          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {categoryOptionsList.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  const updated = [...categoryStatementsList];
                                  updated[idx].correctCategory = opt;
                                  setCategoryStatementsList(updated);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  st.correctCategory === opt
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>

                          {/* Tombol Sisipkan Gambar Pernyataan */}
                          <label className="relative cursor-pointer inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white text-xs font-black px-2.5 py-1.5 rounded-xl transition-all shadow-xs active:scale-95">
                            <FileImage className="w-3.5 h-3.5 text-amber-300" />
                            <span>Gambar</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleCategoryStatementImageUpload(idx, e)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </label>

                          {/* Tombol URL Gambar */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatementUrlInput(idx)}
                            className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                              statementUrlInputIdx === idx
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                            }`}
                            title="Input Link URL Gambar"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">URL</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveCategoryStatement(idx)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Pernyataan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Input URL Gambar jika aktif */}
                      {statementUrlInputIdx === idx && (
                        <div className="flex gap-2 p-2 bg-indigo-50/70 border border-indigo-200 rounded-xl items-center animate-fade-in">
                          <LinkIcon className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />
                          <input
                            type="url"
                            value={statementUrlInputValue}
                            onChange={(e) => setStatementUrlInputValue(e.target.value)}
                            placeholder="https://contoh.com/gambar-pernyataan.jpg"
                            className="flex-1 bg-white border border-indigo-300 rounded-lg p-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCategoryStatementUrl(idx)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                          >
                            Terapkan
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatementUrlInputIdx(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                          >
                            Batal
                          </button>
                        </div>
                      )}

                      {/* Preview Gambar Pernyataan jika ada */}
                      {st.image && (
                        <div className="ml-1 sm:ml-8 flex items-center gap-3 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200">
                          <img
                            src={st.image}
                            alt={`Gambar Pernyataan #${idx + 1}`}
                            className="h-16 w-auto max-w-[140px] object-contain rounded-lg border border-indigo-200 bg-white p-0.5 shadow-2xs"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 truncate">
                              <FileImage className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              Gambar Pernyataan #{idx + 1}
                            </p>
                            <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                              Tersimpan dan akan tampil pada tabel soal siswa
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategoryStatementImage(idx)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Hapus Gambar Pernyataan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddCategoryStatement}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" /> Tambah Pernyataan Baru
                </button>
              </div>
            ) : bentukSoalText.toLowerCase().includes('mcma') || bentukSoalText.toLowerCase().includes('kompleks') ? (
              /* EDITOR MCMA (MULTIPLE CHOICE MULTIPLE ANSWER) */
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block font-extrabold text-purple-950 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" /> Pilihan Jawaban MCMA (Pilihan Ganda Kompleks)
                  </label>
                  <span className="bg-purple-200 text-purple-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                    Centang Semua Jawaban Benar
                  </span>
                </div>
                <p className="text-xs text-purple-700 font-medium">
                  Siswa dapat memilih lebih dari satu jawaban benar. Anda juga dapat melampirkan gambar untuk setiap opsi jawaban.
                </p>

                <div className="space-y-3">
                  {labels.map((label, idx) => {
                    const isChecked = mcmaCorrectIndices.includes(idx);
                    const optImg = optionImages[idx];
                    return (
                      <div key={label} className="bg-white p-3 rounded-2xl border-2 border-purple-100 shadow-2xs space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="mt-2.5 flex items-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleMcmaIndex(idx)}
                              className="w-5 h-5 cursor-pointer text-purple-600 rounded-md focus:ring-purple-500"
                            />
                          </div>
                          <div className="flex-1 relative">
                            <div className="absolute left-3 top-2.5 font-bold text-gray-400 text-sm">
                              {label}.
                            </div>
                            <input
                              type="text"
                              value={optionsText[idx]}
                              onChange={(e) => {
                                const newOpts = [...optionsText];
                                newOpts[idx] = e.target.value;
                                setOptionsText(newOpts);
                              }}
                              className={`w-full border-2 rounded-xl py-2 pl-9 pr-3 focus:outline-none text-sm bg-white ${
                                isChecked ? 'border-purple-400 font-bold bg-purple-50/30' : 'border-gray-200'
                              }`}
                              placeholder={`Masukkan teks pilihan ${label}`}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 self-start mt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenMathModal(`opt${label}` as any)}
                              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 text-xs font-bold px-2.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                              title={`Sisipkan Rumus MIPA ke Opsi ${label}`}
                            >
                              <Calculator className="w-3.5 h-3.5 text-indigo-700" />
                              <span>Rumus</span>
                            </button>
                            <label className="relative cursor-pointer inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black px-3 py-2 rounded-xl transition-all shadow-xs active:scale-95 animate-pulse">
                              <FileImage className="w-4 h-4 text-amber-300" />
                              <span>Gambar Opsi</span>
                              <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">✨ BARU</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleOptionImageUpload(idx, e)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Preview Gambar Opsi jika ada */}
                        {optImg && (
                          <div className="ml-8 flex items-center gap-3 bg-purple-50/50 p-2 rounded-xl border border-purple-200">
                            <img
                              src={optImg}
                              alt={`Gambar Opsi ${label}`}
                              className="h-16 w-auto object-contain rounded-lg border border-purple-200 bg-white"
                            />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-purple-900">Gambar Opsi {label}</p>
                              <p className="text-[10px] text-purple-600 font-medium">Tersimpan dalam opsi jawaban</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionImage(idx)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Gambar Opsi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* EDITOR PG SEDERHANA */
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block font-bold text-gray-800 text-sm flex items-center gap-2">
                  Pilihan Jawaban (Tandai <CheckCircle2 className="w-4 h-4 text-emerald-500" /> pada jawaban yang benar)
                </label>

                <div className="space-y-3">
                  {labels.map((label, idx) => {
                    const optImg = optionImages[idx];
                    return (
                      <div key={label} className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="mt-2.5 flex items-center">
                            <input
                              type="radio"
                              name="q-edit-correct"
                              checked={correctIndex === idx}
                              onChange={() => setCorrectIndex(idx)}
                              className="w-5 h-5 cursor-pointer text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex-1 relative">
                            <div className="absolute left-3 top-2.5 font-bold text-gray-400 text-sm">
                              {label}.
                            </div>
                            <input
                              type="text"
                              value={optionsText[idx]}
                              onChange={(e) => {
                                const newOpts = [...optionsText];
                                newOpts[idx] = e.target.value;
                                setOptionsText(newOpts);
                              }}
                              className="w-full border-2 border-gray-200 rounded-lg py-2 pl-9 pr-3 focus:border-blue-500 focus:outline-none text-sm bg-white"
                              placeholder={`Masukkan teks pilihan ${label}`}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 self-start mt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenMathModal(`opt${label}` as any)}
                              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 text-xs font-bold px-2.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                              title={`Sisipkan Rumus MIPA ke Opsi ${label}`}
                            >
                              <Calculator className="w-3.5 h-3.5 text-indigo-700" />
                              <span>Rumus</span>
                            </button>
                            <label className="relative cursor-pointer inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-black px-3 py-2 rounded-xl transition-all shadow-xs active:scale-95 animate-pulse">
                              <FileImage className="w-4 h-4 text-amber-300" />
                              <span>Gambar Opsi</span>
                              <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">✨ BARU</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleOptionImageUpload(idx, e)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Preview Gambar Opsi jika ada */}
                        {optImg && (
                          <div className="ml-8 flex items-center gap-3 bg-sky-50/50 p-2 rounded-xl border border-sky-200">
                            <img
                              src={optImg}
                              alt={`Gambar Opsi ${label}`}
                              className="h-16 w-auto object-contain rounded-lg border border-sky-200 bg-white"
                            />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-sky-900">Gambar Opsi {label}</p>
                              <p className="text-[10px] text-sky-600 font-medium">Tersimpan dalam opsi jawaban</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionImage(idx)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Gambar Opsi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="block font-bold text-gray-800 text-sm">
                  Pembahasan Ilmiah (Analisis HOTS)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenMathModal('explanation')}
                    className="text-xs font-extrabold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    title="Sisipkan Rumus MIPA ke Pembahasan"
                  >
                    <Calculator className="w-3.5 h-3.5 text-indigo-700" />
                    <span>📐 Rumus MIPA</span>
                  </button>
                  <label className="relative cursor-pointer inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-black px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 active:scale-95">
                    <FileImage className="w-4 h-4 text-amber-200" />
                    <span>Gambar Pembahasan</span>
                    <span className="bg-amber-300 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">✨ BARU</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleExplanationImagesUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
              <textarea
                value={explanationText}
                onChange={(e) => setExplanationText(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-3 h-24 focus:border-blue-500 focus:outline-none resize-none text-sm transition-colors"
                placeholder="Masukkan penjelasan mengapa jawaban tersebut benar (dukungan rumus MIPA & LaTeX)..."
              />
              {/* Preview Gambar Pembahasan */}
              {explanationImages.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Lampiran Gambar Pembahasan ({explanationImages.length}):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {explanationImages.map((img, idx) => (
                      <div key={idx} className="relative group bg-white border border-amber-200 rounded-xl p-1.5 flex flex-col items-center justify-center">
                        <img src={img} alt={`Gambar Pembahasan ${idx + 1}`} className="max-h-24 w-auto object-contain rounded-lg" />
                        <button
                          type="button"
                          onClick={() => handleRemoveExplanationImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-90 hover:opacity-100 transition cursor-pointer shadow-xs"
                          title="Hapus Gambar Pembahasan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAB PREVIEW LIVE */
          <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar bg-slate-100/60">
            <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl text-xs text-sky-900 font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Berikut adalah simulasi tampilan soal yang akan dilihat siswa saat ujian:</span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-sky-100 text-sky-800 text-xs font-extrabold px-3 py-1 rounded-lg border border-sky-200">
                Mata Pelajaran: {selectedMapel}
              </span>
              <span className="bg-purple-100 text-purple-900 text-xs font-extrabold px-3 py-1 rounded-lg border border-purple-200">
                Bentuk Soal: {bentukSoalText}
              </span>
              {(kompetensiText.trim() || subTopikText.trim()) && (
                <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-lg border border-amber-300 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-600" /> Kompetensi: {kompetensiText.trim() || subTopikText.trim()}
                </span>
              )}
              {kodeGuruText.trim() && (
                <span className="bg-slate-100 text-slate-800 font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg border border-slate-300">
                  Guru: {kodeGuruText.trim()}
                </span>
              )}
            </div>

            {/* Teks Pertanyaan & Lampiran Gambar berdasarkan Posisi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Pertanyaan
              </p>

              {(() => {
                const renderImgBlock = () => (
                  <div className={`my-3 grid gap-3 ${questionImages.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {questionImages.map((src, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-center">
                        <img
                          src={src}
                          alt={`Lampiran Soal #${i + 1} (${imagePosition})`}
                          className="max-h-72 w-auto object-contain rounded-lg border border-slate-200"
                        />
                      </div>
                    ))}
                  </div>
                );

                const formattedText = formatQuestionText(questionText) || '<i class="text-slate-400">(Teks pertanyaan belum diisi)</i>';

                if (questionImages.length === 0) {
                  return (
                    <div
                      className="text-base text-slate-900 font-semibold leading-relaxed overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: formattedText }}
                    />
                  );
                }

                if (imagePosition === 'top') {
                  return (
                    <div className="space-y-3">
                      {renderImgBlock()}
                      <div
                        className="text-base text-slate-900 font-semibold leading-relaxed overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: formattedText }}
                      />
                    </div>
                  );
                }

                if (imagePosition === 'middle') {
                  const parts = formattedText.split(/(<\/p>|<br\s*\/?>|\n\n)/i).filter(Boolean);
                  if (parts.length > 2) {
                    const midIndex = Math.floor(parts.length / 2);
                    const firstHalf = parts.slice(0, midIndex).join('');
                    const secondHalf = parts.slice(midIndex).join('');
                    return (
                      <div className="space-y-3">
                        <div
                          className="text-base text-slate-900 font-semibold leading-relaxed overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: firstHalf }}
                        />
                        {renderImgBlock()}
                        <div
                          className="text-base text-slate-900 font-semibold leading-relaxed overflow-x-auto"
                          dangerouslySetInnerHTML={{ __html: secondHalf }}
                        />
                      </div>
                    );
                  }
                }

                return (
                  <div className="space-y-3">
                    <div
                      className="text-base text-slate-900 font-semibold leading-relaxed overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: formattedText }}
                    />
                    {renderImgBlock()}
                  </div>
                );
              })()}
            </div>

            {/* Pilihan Jawaban Preview */}
            <div className="space-y-2.5">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Simulasi Jawaban Siswa
              </p>

              {bentukSoalText.toLowerCase().includes('kategori') ? (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-indigo-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="p-3 border-b border-indigo-800 w-12 text-center">No</th>
                        <th className="p-3 border-b border-indigo-800">Pernyataan</th>
                        <th className="p-3 border-b border-indigo-800 text-center">Kunci Jawaban Kategori</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {categoryStatementsList.map((st, idx) => (
                        <tr key={st.id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-400 align-top">{idx + 1}</td>
                          <td className="p-3 text-slate-900 align-top space-y-1.5">
                            <div>{st.statement || '(Pernyataan belum diisi)'}</div>
                            {st.image && (
                              <div className="pt-1">
                                <img
                                  src={st.image}
                                  alt={`Gambar Pernyataan #${idx + 1}`}
                                  className="max-h-24 w-auto object-contain rounded-lg border border-slate-200 bg-white p-1 shadow-2xs"
                                />
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center align-top">
                            <span className="inline-block bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-lg border border-emerald-300">
                              ✓ {st.correctCategory}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                labels.map((label, idx) => {
                  const isMcma = bentukSoalText.toLowerCase().includes('mcma') || (bentukSoalText.toLowerCase().includes('kompleks') && !bentukSoalText.toLowerCase().includes('kategori'));
                  const isCorrect = isMcma ? mcmaCorrectIndices.includes(idx) : idx === correctIndex;
                  const text = optionsText[idx] || `(Pilihan ${label} belum diisi)`;
                  const optImg = optionImages[idx];
                  return (
                    <div
                      key={label}
                      className={`p-3.5 rounded-2xl border flex flex-col gap-2 transition-all ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {label}
                        </span>
                        <div className="flex-1 pt-1 text-sm">{text}</div>
                        {isCorrect && (
                          <span className="bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> KUNCI JAWABAN
                          </span>
                        )}
                      </div>
                      {/* Display Option Image in Preview */}
                      {optImg && (
                        <div className="ml-10 mt-1">
                          <img
                            src={optImg}
                            alt={`Opsi ${label}`}
                            className="max-h-48 w-auto object-contain rounded-lg border border-slate-200 bg-white p-1"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pembahasan */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
              <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Pembahasan Soal
              </p>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                {explanationText || 'Tidak ada pembahasan.'}
              </p>
              {explanationImages.length > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-200/80 space-y-2">
                  <p className="text-[11px] font-bold text-amber-800">Lampiran Gambar Pembahasan:</p>
                  <div className={`grid gap-2 ${explanationImages.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {explanationImages.map((img, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-xl border border-amber-200 flex justify-center">
                        <img src={img} alt={`Pembahasan ${idx + 1}`} className="max-h-56 w-auto object-contain rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 text-sm active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Simpan Soal
          </button>
        </div>
      </div>

      {/* MathType Scientific Formula Editor Modal */}
      <MathFormulaModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
        onInsertFormula={handleInsertFormulaFromModal}
        initialField={mathTargetField}
        showAlert={showAlert}
      />

      {/* Table Builder Generator Modal */}
      <TableBuilderModal
        isOpen={isTableBuilderOpen}
        onClose={() => setIsTableBuilderOpen(false)}
        onInsertTable={(tblHtml) => insertAtCursor(tblHtml)}
        showAlert={showAlert}
      />

      {/* Simbol Koreksi Format Teks Modal */}
      <TextCorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        selectedText={selectedTextForModal}
        onApplyFormat={(mode, content) => {
          if (mode === 'insert' || mode === 'wrap') {
            insertAtCursor(content);
          }
        }}
        showAlert={showAlert}
      />
    </div>
  );
};

