import OptimizedImage from '@/components/ui/OptimizedImage';

interface CardImageProps {
  src: string;
  alt: string;
  children?: React.ReactNode;
}

const CardImage = ({ src, alt, children }: CardImageProps) => {
  return (
    <div className="relative h-48 sm:h-56 w-full image-hover">
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        style={{ objectFit: 'cover' }}
        priority={false}
        quality={80}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 group-hover:via-black/30 transition-all duration-300" />
      {children && (
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 transform group-hover:translate-y-[-4px] transition-transform duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

export default CardImage;