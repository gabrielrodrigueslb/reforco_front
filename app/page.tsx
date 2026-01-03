import { LoginForm } from "@/components/login-form"
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
   const cookieStore = await cookies();
  const token = cookieStore.get('authToken');

  if (token) {
    redirect('/main');
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 animate-in fade-in duration-100">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  )
}