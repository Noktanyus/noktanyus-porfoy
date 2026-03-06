interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter = ({ children, className = '' }: CardFooterProps) => {
  return (
    <div className={`p-4 sm:p-6 mt-auto border-t border-white/40 dark:border-white/10 ${className}`}>
      {children}
    </div>
  );
};

export default CardFooter;