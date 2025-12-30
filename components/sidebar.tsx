'use client';
import { Users, Home, LogOut, TriangleAlert, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from './ui/button';

export default function Sidebar() {
  const pathname = usePathname();

  const [openModalLogout, setOpenModalLogout] = useState(false);
  const [openModalMenu, setOpenModalMenu] = useState(true);

  const toggleModalLogout = () => {
    setOpenModalLogout(!openModalLogout);
  };

  const options = [
    { id: 1, icon: <Home size={22} />, path: '/main' },
    { id: 2, icon: <Users size={22} />, path: '/main/alunos' },
  ];
  console.log(pathname);
  return (
    <>
      <nav className="bg-foreground text-background w-27 rounded-r-2xl h-screen flex-col items-center py-6 px-4 justify-between none hidden sm:flex">
        <header className="flex flex-col items-center gap-6">
          <img
            src="/logo-dri-branca.png"
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
      <nav className="bg-foreground text-background w-screen items-center py-3 px-4 justify-between flex sm:hidden fixed bottom-0 left-0 right-0 z-10 rounded-t-2xl">
        <ul className="flex gap-4 items-center justify-start w-full">
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
          <Link
                href={'/main/menu'}
                className={` ${
                  pathname === '/main/menu'
                    ? 'bg-primary'
                    : 'bg-secondary-foreground hover:bg-gray-900'
                } transition-duration duration-100 p-4 flex rounded-full cursor-pointer `}
              >
                <Menu size={20} />
              </Link>
        </ul>
      </nav>

      {/* Modal de logout */}
      {openModalLogout && (
        <div
          className="fixed z-10 w-screen h-screen bg-black/40 backdrop-blur-xs flex items-center justify-center"
          onClick={toggleModalLogout}
        >
          <div className="flex flex-col items-center justify-center p-10 bg-card rounded-2xl gap-2">
            <span className="p-2 rounded-lg bg-red-100">
              <TriangleAlert className="text-red-400 " size={35} />
            </span>

            <h1 className="text-2xl font-bold">Tem certeza que deseja sair?</h1>
            <p className="text-sm opacity-40 font-semibold">
              Qualquer progresso não salvo será perdido
            </p>

            <div className="flex flex-col gap-2 mt-6 w-full">
              <Button
                className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-700 flex-1 font-semibold"
                onClick={() => {
                  /* lógica de logout aqui */
                }}
              >
                Sair
              </Button>
              <Button
                className="bg-transparent text-foreground hover:bg-gray-100 border-2 px-4 py-2 rounded-xl flex-1 font-semibold"
                onClick={toggleModalLogout}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
