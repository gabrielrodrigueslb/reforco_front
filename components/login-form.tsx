'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { loginRequest } from '@/lib/auth';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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


  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <FieldGroup>
              <div className="flex flex-col items-start gap-1 text-center sm:pb-3">
                <img src="/logo-dri.png" className='w-20 h-20 mb-2 self-center' alt="" />
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
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Esqueceu a senha?
                  </a>
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
              src="/login-banner.png"
              alt="Image"
              fill
              className="absolute inset-0 object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Desenvolvido por  <a href="https://lintratech.cloud/" target='l_blank'>Lintratech</a> @ Todos os direitos reservados.
      </FieldDescription>
    </div>
  );
}
