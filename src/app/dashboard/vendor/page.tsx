/**
 * /dashboard/vendor
 *
 * Vendor (satıcı) dashboard sayfası:
 * - Vendor profili yoksa → onboarding formu göster
 * - Profil varsa → istatistikler + son yorumlar + ürün listesi
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { vendorService } from '@/modules/marketplace';
import { prisma } from '@/lib/prisma';
import { VendorDashboard } from '@/components/dashboard/VendorDashboard';
import { VendorOnboardingForm } from '@/components/dashboard/VendorOnboardingForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Vendor Dashboard | Mağaza' };

export default async function VendorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  const userId = (session.user as { id: string }).id;

  const profile = await vendorService.getMyProfile(userId);

  if (!profile) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Satıcı Ol</h1>
          <p className="text-sm text-muted-foreground">
            Mağazada ürün yayınlamak, satış yapmak ve gelir elde etmek için bir satıcı profili oluşturun.
          </p>
        </div>
        <VendorOnboardingForm />
      </div>
    );
  }

  // Profildeki son 20 review + ürün listesi
  const [reviews, products] = await Promise.all([
    prisma.productReview.findMany({
      where: { vendorId: profile.id },
      include: {
        reviewer: { select: { id: true, name: true, image: true } },
        product: { select: { id: true, slug: true, title: true, thumbnail: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.digitalProduct.findMany({
      where: { vendorId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return <VendorDashboard profile={profile} reviews={reviews} products={products} />;
}