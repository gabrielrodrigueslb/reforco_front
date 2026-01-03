'use client';
import { logoutRequest } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react'
import { Button } from './ui/button';
import { TriangleAlert } from 'lucide-react';

export default function LogoutModal({ toggleModalLogout }: { toggleModalLogout: () => void }) {
     const router = useRouter();
    
      async function handleLogout() {
        await logoutRequest();
        router.replace('/');
      }
  return (
    <div
          className="fixed z-50 w-screen h-screen bg-black/40 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-150"
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
                  handleLogout();
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
  )
}
