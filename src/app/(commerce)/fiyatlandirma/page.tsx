/**
 * /fiyatlandirma → /magaza/abonelikler (kalıcı yönlendirme).
 */

import { redirect } from 'next/navigation';

export default function FiyatlandirmaRedirect() {
  redirect('/magaza/abonelikler');
}
