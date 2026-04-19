import { LoginForm } from '@/components/login-form';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken');

  if (token) {
    redirect('/main');
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 animate-in fade-in duration-100">
      <div className="fixed flex-1 w-screen h-full  bg-black/50 z-20  flex items-center justify-center">
        <div
          className="bg-white p-6 opacity-100 rounded-lg shadow-lg text-center z-30 max-w-md mx-auto animate-in fade-in duration-500 flex flex-col gap-4
        "
        >
          <h1 className='text-2xl font-bold'>Acesso Suspenso por Pendência Financeira</h1>
          <p>
            Identificamos uma pendência no pagamento do seu plano e, por esse
            motivo, o acesso ao sistema foi temporariamente suspenso.
            <br />
            <br />
            Para evitar a desativação definitiva, solicitamos que a
            regularização seja realizada o quanto antes. Caso não haja retorno
            ou regularização no prazo de até{' '}
            <span className="font-bold">15 dias</span> a partir de <span className="font-bold">20/04/2026</span>, o sistema poderá ser
            retirado do ar permanentemente por falta de pagamento, podendo
            resultar na perda dos dados armazenados.
            <br />
            <br />
            Entre em contato para regularizar sua situação e restabelecer o
            acesso.
          </p>
          <a href='https://api.whatsapp.com/send?phone=5531984056082&text=Ol%C3%A1%21%20%F0%9F%98%8A%20Preciso%20regularizar%20o%20pagamento%20do%20sistema.%20Podem%20me%20ajudar%3F' target='_blank' className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors">
            Entrar em Contato
          </a>
        </div>
      </div>
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
}
