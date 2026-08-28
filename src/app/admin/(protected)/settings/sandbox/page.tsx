/**
 * @file Sandbox settings page (server component)
 * @description Reads sandbox mode state on the server and delegates the
 *              interactive controls (reset button + status indicator) to
 *              the client component below.
 */

import { isSandboxMode } from '@/lib/sandbox';
import { SandboxControls } from '@/components/admin/SandboxControls';

export const dynamic = 'force-dynamic';

export default function AdminSandboxPage() {
  const sandbox = isSandboxMode();
  return <SandboxControls isSandbox={sandbox} />;
}