
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/sidebar';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken');

  if (!token) {
    redirect('/login');
  }

  return (
    <>
      {/* HEADER FIXO */}
      <main className=" flex-col-reverse sm:flex-row flex">
        <Sidebar />
        <section className='h-screen w-screen overflow-hidden p-4'>{children}</section>
      </main>
    </>
  );
}
