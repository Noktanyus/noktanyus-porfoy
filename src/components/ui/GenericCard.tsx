import Link from 'next/link';
import { ReactNode } from 'react';

interface GenericCardProps {
  href: string;
  children: ReactNode;
  className?: string;
}

const GenericCard = ({ href, children, className = '' }: GenericCardProps) => {
  return (
    <article 
      className={`h-full relative card-professional stagger-item group ${className}`}
    >
      <div className="flex flex-col h-full">
        {children}
      </div>
      <Link href={href} className="absolute inset-0" aria-label="Daha fazla bilgi al">
        <span className="sr-only">Devamını oku</span>
      </Link>
    </article>
  );
};

export default GenericCard;