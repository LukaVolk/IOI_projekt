import React, { useRef } from 'react';
import { Upload, FileText, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label: string;
  description: string;
  onFileSelect: (file: File) => void;
  isLoaded: boolean;
  fileName?: string;
  onClear?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  onFileSelect,
  isLoaded,
  fileName,
  onClear,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div
        className={cn(
          "relative flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
          isLoaded 
            ? "border-pollution-good/50 bg-pollution-good/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />
        
        <div className={cn(
          "p-2 rounded-md",
          isLoaded ? "bg-pollution-good/10" : "bg-muted"
        )}>
          {isLoaded ? (
            <Check className="w-4 h-4 text-pollution-good" />
          ) : (
            <Upload className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {isLoaded && fileName ? (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate">{fileName}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{description}</span>
          )}
        </div>
        
        {isLoaded && onClear && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
