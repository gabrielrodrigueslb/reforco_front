'use client';

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  CircleUserRound,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { logoutRequest } from '@/lib/auth';
import { withUploadsBase } from '@/lib/uploads';
import { useRouter } from 'next/navigation';
import LogoutModal from './logoutModal';
import { useState } from 'react';
import Link from 'next/link';

export function NavUser({
  user,
}: {
  user: {
    id: string;
    name: string;
    avatarUrl: string;
    role: string;
    email: string;
  };
}) {
  const [openModalLogout, setOpenModalLogout] = useState(false);
  const { isMobile } = useSidebar();
  const avatarSrc = withUploadsBase(user.avatarUrl);

  const toggleModalLogout = () => {
    setOpenModalLogout(!openModalLogout);
  };

  return (
    <>
      <SidebarMenu className="animate-in fade-in duration-50 ">
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex flex-col flex-1 text-left text-sm leading-tigh items-end select-none">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate inline-block text-xs uppercase px-2.5 bg-primary rounded-md text-background font-bold text-[10px] text-center">
                    {user.role}
                  </span>
                </div>

                <Avatar className="h-10 w-10 rounded-full select-none">
                  <AvatarImage
                    className="animate-in fade-in duration-50"
                    src={avatarSrc}
                    alt={user.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    <Image
                      src={'/profile/tedio.png'}
                      className="w-10 H-10 rounded-full"
                      alt="Foto de usuário"
                      width={48}
                      height={48}
                    />
                  </AvatarFallback>
                </Avatar>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              align="start"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-10 w-10 rounded-full">
                    <AvatarImage src={avatarSrc} alt={user.name} />
                    <AvatarFallback className="rounded-lg overflow-hidden">
                      <Image
                        src={'/profile/tedio.png'}
                        className="w-full H-full rounded-full object-center"
                        alt="Foto de usuário"
                        width={48}
                        height={48}
                      />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <Link href="/main/profile">
                <DropdownMenuItem className="cursor-pointer">
                  
                  <CircleUserRound /> Minha conta
                </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer">
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Bell />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className=" hover:bg-red-400 hover:text-white transition-colors duration-150 ease-in-out cursor-pointer"
                onClick={toggleModalLogout}
              >
                <LogOut className="hover:text-white" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <div className="fixed top-0 left-0 z-20">
        {openModalLogout && (
          <LogoutModal toggleModalLogout={toggleModalLogout} />
        )}
      </div>
    </>
  );
}
