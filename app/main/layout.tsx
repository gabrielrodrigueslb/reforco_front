import Sidebar from '@/components/sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
