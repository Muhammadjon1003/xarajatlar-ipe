import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { compressImage } from '../../utils/imageCompressor';
import { Upload, CheckCircle, FileText, Loader2, X } from 'lucide-react';

interface FileInputProps {
  label?: string;
  onUploadComplete: (url: string) => void;
  existingUrl?: string;
}

export const FileInput: React.FC<FileInputProps> = ({
  label = 'Chek / Kvitansiya Fayli (Rasmi yoki PDF)',
  onUploadComplete,
  existingUrl,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    try {
      // 1. Compress image client-side to minimize storage size
      const compressedBlob = await compressImage(file);

      // 2. Prepare Firebase Storage reference
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `receipts/${timestamp}_${safeName}`);

      // 3. Upload to Firebase Storage
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(percent);
        },
        (error) => {
          console.error('Firebase upload error:', error);
          alert('Fayl yuklashda xatolik yuz berdi: ' + error.message);
          setUploading(false);
        },
        async () => {
          // Upload complete - get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setPreviewUrl(downloadURL);
          setUploading(false);
          onUploadComplete(downloadURL);
        }
      );
    } catch (err: any) {
      console.error('Error compressing/uploading file:', err);
      alert('Fayl tayyorlashda xatolik yuz berdi');
      setUploading(false);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setFileName('');
    onUploadComplete('');
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide">
          {label}
        </label>
      )}

      {previewUrl ? (
        <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            {previewUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) || previewUrl.includes('firebasestorage') ? (
              <img
                src={previewUrl}
                alt="Receipt Preview"
                className="w-10 h-10 object-cover rounded-lg border border-zinc-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-indigo-400">
                <FileText size={20} />
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-semibold text-zinc-200 truncate">
                {fileName || 'Chek Fayli Yuklandi'}
              </p>
              <span className="text-[11px] text-emerald-400 font-medium inline-flex items-center gap-1">
                <CheckCircle size={12} /> Firebase Storage da saqlandi
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-xl cursor-pointer bg-zinc-950/60 hover:bg-zinc-900/60 transition-all">
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            {uploading ? (
              <>
                <Loader2 size={24} className="animate-spin text-indigo-400 mb-2" />
                <p className="text-xs text-zinc-300 font-medium">
                  Fayl siqilib Firebase ga yuklanmoqda... {progress}%
                </p>
                <div className="w-48 h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <Upload size={22} className="text-zinc-400 mb-1.5" />
                <p className="text-xs text-zinc-300 font-semibold">
                  Chek rasmini tanlang yoki bu yerga tashlang
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  (Rasm avtomatik siqilib Firebase Storage da saqlanadi)
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
};
