import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Image as ImageIcon, Video, Calendar as CalendarIcon, Loader2, Upload, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { MediaType, DateMemory } from '../types';
import { cn } from '../lib/utils';
import { compressImage } from '../lib/imageCompressor';
import { resolveProxyUrl } from '../lib/proxyUrl';

interface MemoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    title: string; 
    date: string; 
    mediaUrls: string[]; 
    mediaType: MediaType;
    musicUrl?: string;
    author: 'duPO' | 'xurry';
    songTitle?: string;
    note?: string;
  }) => Promise<void>;
  editingMemory?: DateMemory | null;
}

export default function MemoryForm({ isOpen, onClose, onSubmit, editingMemory }: MemoryFormProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [author, setAuthor] = useState<'duPO' | 'xurry'>('xurry');
  const [songTitle, setSongTitle] = useState('');
  const [note, setNote] = useState('');
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicUrl, setMusicUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  React.useEffect(() => {
    if (editingMemory) {
      setTitle(editingMemory.title);
      setDate(editingMemory.date);
      setMediaUrls(editingMemory.mediaUrls || [(editingMemory as any).mediaUrl].filter(Boolean) || []);
      setMediaType(editingMemory.mediaType);
      setAuthor(editingMemory.author || 'xurry');
      setSongTitle(editingMemory.songTitle || '');
      setNote(editingMemory.note || '');
      setMusicUrl(editingMemory.musicUrl || '');
      setMusicFile(null);
      setFileError('');
      setUploadProgress(0);
    } else {
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setMediaUrls([]);
      setMediaType('image');
      setAuthor('xurry'); 
      setSongTitle('');
      setNote('');
      setMusicUrl('');
      setMusicFile(null);
      setFileError('');
      setUploadProgress(0);
    }
  }, [editingMemory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = mediaUrls.filter(url => url.trim() !== '');
    if (!title || validUrls.length === 0) return;
    if (fileError) return;

    setLoading(true);
    try {
      let finalMusicUrl = musicUrl;

      if (musicFile) {
        if (musicFile.size > 20 * 1024 * 1024) { // 20MB limit for R2
          setFileError('File nhạc quá lớn (tối đa 20MB).');
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', musicFile);
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload audio failed');
        const { url } = await response.json();
        finalMusicUrl = url;
      }

      await onSubmit({ title, date, mediaUrls: validUrls, mediaType, author, songTitle, note, musicUrl: finalMusicUrl });
      onClose();
    } catch (error) {
      console.error('Error uploading file or saving memory:', error);
      alert('Có lỗi xảy ra khi lưu kỉ niệm hoặc xử lý file. Bạn có thể cần kiểm tra Storage Firebase Rules.');
    } finally {
      setLoading(false);
    }
  };

  const addMediaUrl = () => setMediaUrls([...mediaUrls, '']);
  const updateMediaUrl = (index: number, value: string) => {
    const newUrls = [...mediaUrls];
    newUrls[index] = value;
    setMediaUrls(newUrls);
  };
  const removeMediaUrl = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setMediaUrls(prev => {
      const newUrls = [...prev];
      const draggedUrl = newUrls[draggedIndex];
      newUrls.splice(draggedIndex, 1);
      newUrls.splice(index, 0, draggedUrl);
      return newUrls;
    });
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setLoading(true);
    setFileError('');
    try {
      const base64Images = await Promise.all(
        files.map(file => compressImage(file, 800))
      );
      
      const uploadedUrls = await Promise.all(base64Images.map(async (base64) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/upload-base64`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64 })
        });
        if (!response.ok) throw new Error('Upload to R2 failed');
        const { url } = await response.json();
        return url;
      }));

      setMediaUrls(prev => {
        const filtered = prev.filter(url => url.trim() !== '');
        return [...filtered, ...uploadedUrls];
      });
    } catch (error) {
      console.error(error);
      setFileError('Lỗi tải ảnh, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setFileError('Video quá lớn, tối đa 50MB.');
      return;
    }

    setLoading(true);
    setFileError('');
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${import.meta.env.VITE_API_URL || ''}/api/upload`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        setUploadProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setMediaUrls(urls => {
          const withoutEmpty = urls.filter(u => u.trim() !== '');
          return [...withoutEmpty, data.url];
        });
      } else {
        setFileError('Lỗi tải lên video.');
      }
      setLoading(false);
      setUploadProgress(0);
    };

    xhr.onerror = () => {
      console.error('Error uploading video');
      setFileError('Lỗi tải video, vui lòng thử lại.');
      setLoading(false);
      setUploadProgress(0);
    };

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-bento-bg border-l border-bento-border z-[101] p-8 overflow-y-auto"
            id="memory-form-container"
          >
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-serif italic text-bento-text mb-2">
                  {editingMemory ? 'Chỉnh sửa' : 'Kỉ niệm mới'}
                </h2>
                <p className="text-xs text-bento-muted tracking-widest uppercase font-bold">Lưu giữ khoảnh khắc</p>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-bento-card border border-bento-border rounded-2xl text-bento-muted hover:text-bento-text transition-all shadow-sm"
                id="close-form"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Tiêu đề buổi hẹn
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dinner at the harbor..."
                  className="w-full bg-bento-card border border-bento-border rounded-2xl px-5 py-4 text-bento-text focus:outline-none focus:border-bento-accent transition-all placeholder:text-bento-muted shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Ngày tháng
                </label>
                <div className="relative">
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-bento-card border border-bento-border rounded-2xl px-5 py-4 text-bento-text focus:outline-none focus:border-bento-accent transition-all shadow-sm"
                  />
                  <CalendarIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-bento-muted pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Loại phương tiện chính
                </label>
                <div className="flex gap-2">
                  {(['image', 'video'] as MediaType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        if (mediaType !== type) {
                          setMediaType(type);
                          if (type === 'video') {
                            setMediaUrls(urls => {
                              const withoutBase64 = urls.filter(u => !u.startsWith('data:image'));
                              return withoutBase64.length ? withoutBase64 : [''];
                            });
                          }
                        }
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all uppercase text-[10px] tracking-widest font-bold shadow-sm",
                        mediaType === type
                          ? "bg-bento-accent text-bento-text border-bento-accent"
                          : "bg-bento-card text-bento-muted border-bento-border hover:border-bento-accent"
                      )}
                    >
                      {type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1 block">
                  {mediaType === 'image' ? 'Tải ảnh lên (Khuyến nghị)' : 'Tải video lên'}
                </label>
                
                {mediaType === 'image' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {mediaUrls.map((url, index) => url.trim() !== '' ? (
                        <div 
                          key={url + index} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnter={(e) => handleDragEnter(e, index)}
                          onDragOver={handleDragOver}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "relative aspect-square rounded-xl overflow-hidden group border cursor-move transition-all duration-200",
                            draggedIndex === index ? "opacity-50 scale-95 border-bento-accent z-10" : "border-bento-border hover:border-bento-accent/50"
                          )}
                        >
                          <img src={resolveProxyUrl(url)} alt={`Preview ${index}`} className="w-full h-full object-cover pointer-events-none" />
                          <button
                            type="button"
                            onClick={() => removeMediaUrl(index)}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full transition-all shadow-md hover:scale-105 active:scale-95 z-20"
                            title="Xoá ảnh này"
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : null)}
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1 py-4 border-2 border-dashed border-bento-border rounded-2xl text-bento-muted hover:border-bento-accent hover:text-bento-text transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer bg-bento-card">
                        <Upload className="w-4 h-4" />
                        Tải ảnh từ máy
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload} 
                        />
                      </label>
                      {mediaUrls.filter(u => u.trim() !== '').length > 0 && (
                        <button
                          type="button"
                          onClick={() => setMediaUrls([])}
                          className="px-4 py-4 border border-rose-500/30 hover:border-rose-500/60 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-bento-card"
                          title="Xoá tất cả ảnh"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xoá hết
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {mediaUrls.map((url, index) => url.trim() !== '' ? (
                        <div 
                          key={url + index} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnter={(e) => handleDragEnter(e, index)}
                          onDragOver={handleDragOver}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "relative aspect-video rounded-xl overflow-hidden group border cursor-move transition-all duration-200",
                            draggedIndex === index ? "opacity-50 scale-95 border-bento-accent z-10" : "border-bento-border hover:border-bento-accent/50"
                          )}
                        >
                          <video src={resolveProxyUrl(url)} className="w-full h-full object-cover pointer-events-none" />
                          <button
                            type="button"
                            onClick={() => removeMediaUrl(index)}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full transition-all shadow-md hover:scale-105 active:scale-95 z-20"
                            title="Xoá video này"
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : null)}
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full bg-bento-card border border-bento-border rounded-full h-2 mb-4 overflow-hidden">
                        <div className="bg-bento-accent h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <label className="flex-1 py-4 border-2 border-dashed border-bento-border rounded-2xl text-bento-muted hover:border-bento-accent hover:text-bento-text transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer bg-bento-card">
                        <Upload className="w-4 h-4" />
                        Tải video từ máy
                        <input 
                          type="file" 
                          accept="video/*" 
                          className="hidden" 
                          onChange={handleVideoUpload} 
                        />
                      </label>
                      {mediaUrls.filter(u => u.trim() !== '').length > 0 && (
                        <button
                          type="button"
                          onClick={() => setMediaUrls([])}
                          className="px-4 py-4 border border-rose-500/30 hover:border-rose-500/60 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-bento-card"
                          title="Xoá tất cả video"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xoá hết
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Ai là người thêm?
                </label>
                <div className="flex gap-2">
                  {(['duPO', 'xurry'] as const).map((person) => (
                    <button
                      key={person}
                      type="button"
                      onClick={() => setAuthor(person)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all uppercase text-[10px] tracking-widest font-bold shadow-sm",
                        author === person
                          ? "bg-bento-accent text-bento-text border-bento-accent"
                          : "bg-bento-card text-bento-muted border-bento-border hover:border-bento-accent"
                      )}
                    >
                      {person}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Nhạc buổi hẹn (Tên bài hát)
                </label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="Ví dụ: Perfect - Ed Sheeran..."
                  className="w-full bg-bento-card border border-bento-border rounded-2xl px-5 py-4 text-bento-text focus:outline-none focus:border-bento-accent transition-all placeholder:text-bento-muted shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Tải tệp âm nhạc (.mp3, .m4a)
                </label>
                <div className="space-y-2">
                  {fileError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider">
                      {fileError}
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 20 * 1024 * 1024) {
                          setFileError('File quá lớn (tối đa 20MB).');
                          setMusicFile(null);
                        } else {
                          setFileError('');
                          setMusicFile(file);
                        }
                      }}
                      className="w-full bg-bento-card border border-bento-border rounded-2xl px-5 py-4 text-bento-text focus:outline-none focus:border-bento-accent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-bento-accent file:text-bento-bg hover:file:brightness-110 file:cursor-pointer"
                    />
                    {musicUrl && !musicFile && (
                      <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-bento-accent/5 border border-bento-accent/10 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-bento-accent animate-pulse" />
                        <span className="text-[10px] text-bento-accent font-bold uppercase tracking-widest">Đã có file nhạc cũ</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-bento-muted font-bold px-1">
                  Lời muốn nói (Ghi chú/Cảm nhận)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập cảm nhận của bạn về buổi hẹn này..."
                  rows={3}
                  className="w-full bg-bento-card border border-bento-border rounded-2xl px-5 py-4 text-bento-text focus:outline-none focus:border-bento-accent transition-all placeholder:text-bento-muted shadow-sm resize-none"
                />
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-bento-accent text-bento-bg font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl"
                id="submit-memory"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {editingMemory ? 'Cập nhật kỉ niệm' : 'Lưu kỉ niệm'}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
