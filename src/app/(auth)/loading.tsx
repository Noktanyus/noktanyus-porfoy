import Spinner from '@/components/ui/Spinner';

export default function AuthLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-blob-decoration">
      <Spinner />
    </div>
  );
}
