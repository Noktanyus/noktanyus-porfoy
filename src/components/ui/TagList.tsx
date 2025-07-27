interface TagListProps {
  tags: string[];
  limit?: number;
  className?: string;
  tagClassName?: string;
}

const TagList = ({ tags, limit = 4, className = '', tagClassName = '' }: TagListProps) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, limit);
  const hiddenTagsCount = tags.length - limit;

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