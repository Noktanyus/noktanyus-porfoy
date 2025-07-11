/**
 * @file Merkezi Markdown Düzenleyici Bileşeni
 * @description Bu bileşen, `react-markdown-editor-lite` kütüphanesini sarmalayarak
 *              projeye özel, merkezi bir Markdown düzenleyici sağlar. Önizleme
 *              işlemleri için merkezi `markdown-processor` modülünü kullanır,
 *              böylece önizleme ile canlı site arasında tam bir tutarlılık sağlanır.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Editor from 'react-markdown-editor-lite';
import { processMarkdown } from '@/lib/markdown-processor'; // Merkezi remark işlemcisini içe aktar

// react-markdown-editor-lite için temel CSS
import 'react-markdown-editor-lite/lib/index.css';
// Kod sözdizimi vurgulaması için highlight.js tema dosyası
// Projenizin genel stil dosyalarında (örn: globals.css) da içe aktarılabilir.
import 'highlight.js/styles/github.css';

// Bileşenin alacağı propların tip tanımı
interface EditorProps {
  value: string;
  onChange: (text: string) => void;
}

const CustomEditor: React.FC<EditorProps> = ({ value, onChange }) => {
  // Değişiklikleri yöneten fonksiyon
  const handleEditorChange = ({ text }: { text: string }) => {
    onChange(text);
  };

  // renderHTML prop'u asenkron bir fonksiyon beklediği için,
  // processMarkdown'u bu şekilde sarmalıyoruz.
  const renderHTML = (text: string): Promise<string> => {
    return processMarkdown(text);
  };

  return (
    <div className="markdown-editor-container">
      <Editor
        value={value}
        style={{ height: '600px' }}
        onChange={handleEditorChange}
        // Önizleme için HTML'i render ederken merkezi remark işlemcisini kullan
        renderHTML={renderHTML}
      />
    </div>
  );
};

export default CustomEditor;