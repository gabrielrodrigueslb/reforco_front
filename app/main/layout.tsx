import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MainShell from '@/components/main-shell';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken');

  if (!token) {
    redirect('/');
  }

  return <MainShell>{children}</MainShell>;
}
