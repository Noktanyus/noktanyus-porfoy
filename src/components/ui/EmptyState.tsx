'use client';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  action?: {
    label: string;
    href: string;
  };
  /** Ek className (ör. margin) */
  className?: string;
}

/**
 * @file EmptyState - Liste veya grid içeriği boş olduğunda gösterilen durum.
 */
export function EmptyState({
  title,
  description,
  icon = '📦',
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`glass-card-premium p-12 text-center ${className}`}
      role="status"
    >
      <div className="text-6xl mb-4 animate-bounce-slow" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <a
          href={action.href}
          className="admin-btn admin-btn-primary inline-block"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}

export default EmptyState;
