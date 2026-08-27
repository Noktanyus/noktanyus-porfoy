import { Metadata } from 'next';
import { CheckoutForm } from '@/components/commerce/CheckoutForm';

export const metadata: Metadata = {
  title: 'Ödeme',
};

export default function CheckoutPage() {
  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        <h1 className="text-responsive-display font-bold mb-8 text-center text-gray-900 dark:text-white">
          Ödeme
        </h1>
        <CheckoutForm />
      </div>
    </div>
  );
}
