'use client';

import { toast } from 'react-hot-toast';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { useState } from 'react';

interface CopyTextButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyTextButton({
  text,
  label = 'Kopyala',
  className = '',
}: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Panoya kopyalandı');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Kopyalanamadı');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ||
        'inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors'
      }
      aria-label={label}
      title={label}
    >
      {copied ? (
        <FaCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
      ) : (
        <FaCopy className="w-3.5 h-3.5" aria-hidden="true" />
      )}
    </button>
  );
}

export default CopyTextButton;
