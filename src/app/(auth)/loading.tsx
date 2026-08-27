import Spinner from '@/components/ui/Spinner';

export default function AuthLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-blob-decoration">
      <Spinner />
    </main>
  );
}
