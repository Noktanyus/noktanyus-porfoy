/**
 * /admin kökü — dashboard'a yönlendir.
 */

import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  redirect('/admin/dashboard');
}
