'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FaWhatsapp } from 'react-icons/fa';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { loginRequest } from '@/lib/auth';
import { X } from 'lucide-react';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [openModal, SetOpenModal] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Preencha todos os campos.');
      setLoading(false);
      return;
    }

    try {
      await loginRequest({ email, password });
      router.push('/main');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro inesperado ao tentar logar.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleModal() {
    SetOpenModal(!openModal);
  }

  return (
    <>
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form className="p-10  md:py-20" onSubmit={handleLogin}>
              <FieldGroup>
                <div className="flex flex-col items-start gap-1 text-center sm:pb-3">
                  <Image
                    src="/logo-dri.png"
                    width={80}
                    height={80}
                    className="w-20 h-20 mb-2 self-center"
                    alt="Logo DRI"
                  />
                  <h1 className="text-2xl font-bold">Login</h1>
                  <p className="text-muted-foreground text-balance">
                    Entre com sua conta para continuar
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Senha</FieldLabel>
                    <button
                    type='button'
                      className="ml-auto text-sm underline-offset-2 hover:underline cursor-pointer"
                      onClick={handleModal}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </Field>
                {/* ERRO */}
                {error && (
                  <div className="bg-red-100 text-red-600 p-2 rounded text-sm text-center">
                    {error}
                  </div>
                )}
              </FieldGroup>
            </form>
            <div className="bg-muted relative hidden md:block">
              <Image
                src="/banner-login.jpg"
                alt="Image"
                fill
                className="absolute inset-0 object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
        <FieldDescription className="px-6 text-center">
          Desenvolvido por{' '}
          <a href="https://lintratech.cloud/" target="l_blank">
            Lintratech
          </a>{' '}
          @ Todos os direitos reservados.
        </FieldDescription>
      </div>
      {openModal && (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black/30 transition-colors">
          <section className="bg-background p-6 rounded-xl flex flex-col items-center justify-center gap-2 mx-6 relative">
            <button className="p-1 cursor-pointer absolute top-5 right-5" onClick={handleModal}>
              <X />
            </button>
            <Image
              src="/astronautaconfuso.png"
              width={160}
              height={160}
              className="w-40 h-auto"
              alt="astronauta confuso"
            />
            <h2 className="text-2xl font-bold text-primary py-2">
              Esqueceu a senha?
            </h2>
            <p className="text-muted-foreground text-balance max-w-150 text-center">
              Para sua segurança, a recuperação de senha é feita pelo nosso
              suporte.
            </p>

            <a
              href="https://api.whatsapp.com/send?phone=5531984056082&text=Ol%C3%A1%21%20%F0%9F%98%8A%20Esqueci%20minha%20senha%20de%20acesso%20ao%20sistema%20do%20Refor%C3%A7o%20Escolar%20Adriana%20Oliveira.%20Poderiam%20me%20ajudar%20a%20recuperar%2C%20por%20favor%3F
"
              target="_blank"
              className="flex gap-2 items-center justify-center p-2 bg-primary hover:bg-sidebar-primary transition-all font-bold rounded-lg text-white cursor-pointer mt-3"
            >
              <FaWhatsapp className="text-xl" /> Entre em contato
            </a>
          </section>
        </div>
      )}
    </>
  );
}
