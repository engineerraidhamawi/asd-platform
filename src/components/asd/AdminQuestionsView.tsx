'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Database, Download } from 'lucide-react';

interface QuestionCount {
  mchat: number;
  srs: number;
  rbsr: number;
}

export function AdminQuestionsView() {
  const { user } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; counts?: QuestionCount } | null>(null);
  const [currentCounts, setCurrentCounts] = useState<QuestionCount | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const loadCounts = () => {
    fetch('/api/questions')
      .then(r => r.json())
      .then((grouped: Record<string, { ar: string; en: string }[]>) => {
        setCurrentCounts({
          mchat: grouped.mchat?.length || 0,
          srs: grouped.srs?.length || 0,
          rbsr: grouped.rbsr?.length || 0,
        });
      })
      .catch(() => {});
  };

  useEffect(() => { loadCounts(); }, []);

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setResult({ success: false, message: 'Please select an Excel file (.xlsx)' });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/questions/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: `Uploaded ${data.total} questions successfully (M-CHAT: ${data.counts.mchat}, SRS-2: ${data.counts.srs}, RBS-R: ${data.counts.rbsr})`,
          counts: data.counts,
        });
        loadCounts();
      } else {
        setResult({ success: false, message: data.error || 'Upload failed' });
      }
    } catch {
      setResult({ success: false, message: 'An error occurred during upload' });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDownloadTemplate = () => {
    const headers = ['M-CHAT (Arabic)', 'M-CHAT (English)', 'SRS-2 (Arabic)', 'SRS-2 (English)', 'RBS-R (Arabic)', 'RBS-R (English)'];
    const csvContent = headers.join(',') + '\nExample AR,Example EN,Example AR,Example EN,Example AR,Example EN\n';
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalQuestions = currentCounts ? currentCounts.mchat + currentCounts.srs + currentCounts.rbsr : 0;

  return (
    <div className='space-y-6' dir={dir}>
      <div>
        <h1 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
          <Database className='w-5 h-5 text-emerald-600' />
          {t('questionsManagement')}
        </h1>
        <p className='text-sm text-gray-500 mt-1'>
          Manage questions for all three questionnaires via Excel
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
        <Card>
          <CardContent className='p-4 text-center'>
            <p className='text-2xl font-bold text-emerald-600'>{currentCounts?.mchat || 0}</p>
            <p className='text-xs text-gray-500 mt-1'>M-CHAT-R/F</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <p className='text-2xl font-bold text-blue-600'>{currentCounts?.srs || 0}</p>
            <p className='text-xs text-gray-500 mt-1'>SRS-2</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <p className='text-2xl font-bold text-amber-600'>{currentCounts?.rbsr || 0}</p>
            <p className='text-xs text-gray-500 mt-1'>RBS-R</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className='p-6'>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className='w-10 h-10 text-gray-400 mx-auto mb-3' />
            <p className='text-sm font-medium text-gray-700'>
              Drag and drop Excel file here or
            </p>
            <label className='inline-block mt-2'>
              <span
                className='text-sm text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium underline'
                onClick={() => fileInputRef.current?.click()}
              >
                browse files
              </span>
              <input
                ref={fileInputRef}
                type='file'
                accept='.xlsx,.xls'
                className='hidden'
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            <p className='text-xs text-gray-400 mt-3'>.xlsx, .xls</p>
          </div>

          {uploading && (
            <div className='flex items-center justify-center gap-2 mt-4 text-sm text-emerald-600'>
              <div className='w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin' />
              Uploading file...
            </div>
          )}

          {result && (
            <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
              result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {result.success
                ? <CheckCircle2 className='w-4 h-4 mt-0.5 flex-shrink-0' />
                : <AlertCircle className='w-4 h-4 mt-0.5 flex-shrink-0' />
              }
              <span>{result.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className='p-5 space-y-3'>
          <h3 className='font-bold text-gray-900 text-sm flex items-center gap-2'>
            <FileSpreadsheet className='w-4 h-4 text-gray-500' />
            Required File Format
          </h3>
          <div className='overflow-x-auto'>
            <table className='w-full text-xs border border-gray-200 rounded-lg overflow-hidden'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='p-2 border-b border-gray-200 text-gray-600 font-medium'>Col 1</th>
                  <th className='p-2 border-b border-gray-200 text-gray-600 font-medium'>Col 2</th>
                  <th className='p-2 border-b border-gray-200 text-gray-600 font-medium'>Col 3</th>
                  <th className='p-2 border-b border-gray-200 text-gray-600 font-medium'>Col 4</th>
                  <th className='p-2 border-b border-gray-200 text-gray-600 font-medium'>Col 5</th>
                  <th className='p-2 border-b border-gray-200 text-gray-600 font-medium'>Col 6</th>
                </tr>
              </thead>
              <tbody>
                <tr className='bg-emerald-50/50'>
                  <td className='p-2 border-b border-gray-100 font-medium'>M-CHAT AR</td>
                  <td className='p-2 border-b border-gray-100 font-medium'>M-CHAT EN</td>
                  <td className='p-2 border-b border-gray-100 font-medium'>SRS-2 AR</td>
                  <td className='p-2 border-b border-gray-100 font-medium'>SRS-2 EN</td>
                  <td className='p-2 border-b border-gray-100 font-medium'>RBS-R AR</td>
                  <td className='p-2 border-b border-gray-100 font-medium'>RBS-R EN</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className='text-xs text-gray-500'>
            Row 1: Column headers (ignored). Following rows: questions for each part. Uploading replaces all existing questions.
          </p>
        </CardContent>
      </Card>

      <div className='flex justify-center'>
        <Button variant='outline' onClick={handleDownloadTemplate} className='gap-2 text-sm'>
          <Download className='w-4 h-4' />
          Download CSV Template
        </Button>
      </div>

      {totalQuestions > 0 && (
        <p className='text-center text-xs text-gray-400'>
          Total questions currently in database: {totalQuestions}
        </p>
      )}
    </div>
  );
}
