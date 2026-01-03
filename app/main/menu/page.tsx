'use client';
import LogoutModal from '@/components/logoutModal';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Menu() {
  const [openModalLogout, setOpenModalLogout] = useState(false);

  const toggleModalLogout = () => {
    setOpenModalLogout(!openModalLogout);
  };

  return (
    <>
      <main className="py-7 animate-in fade-in duration-100">
        <Button
          variant="outline"
          className={` hover:bg-red-400 w-full border-2 font-semibold
               transition-duration duration-100 p-4 flex rounded-full cursor-pointer `}
          onClick={toggleModalLogout}
        >
          <LogOut /> Sair
        </Button>
      </main>
      {/* Modal de logout */}
      {openModalLogout && <LogoutModal toggleModalLogout={toggleModalLogout} />}
    </>
  );
}
