interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

const CardBody = ({ children, className = '' }: CardBodyProps) => {
  return (
    <div className={`p-4 sm:p-6 flex-grow ${className}`}>
      {children}
    </div>
  );
};

export default CardBody;