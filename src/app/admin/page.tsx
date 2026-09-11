/**
 * /admin kökü — oturum yoksa /giris, admin ise dashboard.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminIndexPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === 'admin') {
    redirect('/admin/dashboard');
  }
  redirect('/giris?callbackUrl=%2Fadmin%2Fdashboard');
}
