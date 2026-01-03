import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function page() {
  return (
    <>
    <main className="animate-in fade-in duration-100 grid gap-6 grid-cols-2 p-10">
      <section >
        <h3>Informações do usuário</h3>
        <Label>Email</Label>
        <Input/>
      </section>
      <section className='flex flex-col items-center justify-center'>
        
        <Avatar className='bg-muted w-90 h-90'/>
      </section>
    </main>
    </>
  )
}
