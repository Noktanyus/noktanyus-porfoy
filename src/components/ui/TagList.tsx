interface TagListProps {
  tags: any; // Veritabanından string veya string[] gelebilir
  limit?: number;
  className?: string;
  tagClassName?: string;
}

const TagList = ({ tags, limit = 4, className = '', tagClassName = '' }: TagListProps) => {
  // tags bir string (JSON) ise parse etmeye çalış, değilse dizi olarak devam et
  let normalizedTags: string[] = [];
  
  if (Array.isArray(tags)) {
    normalizedTags = tags.filter((t): t is string => typeof t === 'string' && t.trim() !== '');
  } else if (typeof tags === 'string' && tags.trim() !== '') {
    try {
      if (tags.startsWith('[') || tags.startsWith('{')) {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
          normalizedTags = parsed.filter(t => typeof t === 'string');
        } else {
          normalizedTags = [String(tags)];
        }
      } else {
        normalizedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    } catch {
      normalizedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  if (!normalizedTags || normalizedTags.length === 0) {
    return null;
  }

  const visibleTags = normalizedTags.slice(0, limit);
  const hiddenTagsCount = normalizedTags.length - limit;

  return (
    <div className={`flex flex-wrap gap-2 mb-4 ${className}`}>
      {visibleTags.map((tag: string, index: number) => (
        <span
          key={index}
          className={`px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs sm:text-sm rounded-full text-gray-600 dark:text-gray-300 whitespace-nowrap ${tagClassName}`}
        >
          {tag}
        </span>
      ))}
      {hiddenTagsCount > 0 && (
        <span className={`px-3 py-1 bg-gray-200 dark:bg-gray-800 text-xs sm:text-sm rounded-full text-gray-500 dark:text-gray-400 ${tagClassName}`}>
          +{hiddenTagsCount}
        </span>
      )}
    </div>
  );
};

export default TagList;