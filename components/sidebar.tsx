'use client';
import {
  Users,
  Home,
  LogOut,
  TriangleAlert,
  Menu,
  NotebookText,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutModal from './logoutModal';

export default function Sidebar() {
  const pathname = usePathname();

  const [openModalLogout, setOpenModalLogout] = useState(false);

  const toggleModalLogout = () => {
    setOpenModalLogout(!openModalLogout);
  };


  const options = [
    { id: 1, icon: <Home size={22} />, path: '/main' },
    { id: 2, icon: <Users size={22} />, path: '/main/alunos' },
    { id: 3, icon: <NotebookText size={22} />, path: '/main/chamada' },
  ];
  return (
    <>
      <nav className="bg-foreground text-background w-27 rounded-r-2xl h-screen flex-col items-center py-6 px-4 justify-between none hidden sm:flex">
        <header className="flex flex-col items-center gap-6">
          <Image
            src="/logo-dri-branca.png"
            width={60} // Adjust width as needed
            height={60} // Adjust height as needed
            className="w-15 h-15"
            alt="logo dri"
          />

          <ul className="flex flex-col gap-2 mt-4">
            {options.map((option) => (
              <li key={option.id}>
                <Link
                  href={option.path}
                  className={` ${
                    pathname === option.path
                      ? 'bg-primary'
                      : 'bg-secondary-foreground hover:bg-gray-900'
                  } transition-duration duration-100 p-4 flex rounded-full cursor-pointer `}
                >
                  {option.icon}
                </Link>
              </li>
            ))}
          </ul>
        </header>
        <footer>
          <button
            className={` bg-secondary-foreground hover:bg-red-400
               transition-duration duration-100 p-4 flex rounded-full cursor-pointer `}
            onClick={toggleModalLogout}
          >
            <LogOut size={20} />
          </button>
        </footer>
      </nav>

      {/* NAVBAR MOBILE */}
      <nav className="bg-foreground text-background w-screen max-w-screen items-center py-3 px-4 justify-between flex sm:hidden fixed bottom-0 left-0 right-0 z-10 rounded-t-2xl">
        <ul className="flex gap-4 items-center justify-between w-full">
          {options.map((option) => (
            <li key={option.id}>
              <Link
                href={option.path}
                className={` ${
                  pathname === option.path ? 'bg-primary' : 'hover:bg-gray-900'
                } transition-duration duration-100 p-4 flex rounded-full cursor-pointer `}
              >
                {option.icon}
              </Link>
            </li>
          ))}
          <Link
            href={'/main/menu'}
            className={` ${
              pathname === '/main/menu' ? 'bg-primary' : ' hover:bg-gray-900'
            } transition-duration duration-100 p-4 flex rounded-full cursor-pointer `}
          >
            <Menu size={20} />
          </Link>
        </ul>
      </nav>

      {/* Modal de logout */}
      {openModalLogout && (
        <LogoutModal toggleModalLogout={toggleModalLogout}/>
      )}
    </>
  );
}
