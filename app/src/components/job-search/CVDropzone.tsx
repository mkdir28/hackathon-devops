import { useCallback, useState, type DragEvent } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { translations } from '@/lib/i18n';

interface CVDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

function isValidFile(f: File): boolean {
  const validTypes = ['application/pdf', 'text/plain'];
  return validTypes.includes(f.type) || f.name.endsWith('.txt') || f.name.endsWith('.pdf');
}

export default function CVDropzone({ file, onFileChange }: CVDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { lang } = useTheme();
  const t = translations[lang];

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped && isValidFile(dropped)) onFileChange(dropped);
    },
    [onFileChange]
  );

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const selected = target.files?.[0];
      if (selected && isValidFile(selected)) onFileChange(selected);
    };
    input.click();
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20">
        <FileText className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          type="button"
          onClick={() => onFileChange(null)}
          className="p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onClick={handleClick}
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-7 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200',
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/40 hover:bg-muted/40'
      )}
    >
      <div className={cn('p-2.5 transition-colors', isDragOver ? 'text-primary' : 'text-muted-foreground')}>
        <Upload className="w-5 h-5" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">{t.cvDrop}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t.cvHint}</p>
      </div>
    </div>
  );
}
