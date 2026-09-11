import { CouponForm } from '@/components/admin/CouponForm';

export default function AdminNewCouponPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Yeni Kupon</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">İndirim kuponu oluşturun</p>
      <CouponForm />
    </div>
  );
}
