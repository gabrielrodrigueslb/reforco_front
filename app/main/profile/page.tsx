'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getSession } from '@/lib/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface User {
  id?: string
  name?: string
  email?: string
  avatarUrl?: string
}

function getInitials(name?: string) {
  if (!name) return 'US'
  const parts = name.trim().split(' ')
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (first + last).toUpperCase() || 'US'
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    async function loadSession() {
      try {
        const me = await getSession()
        if (me) {
          setUser(me)
        }
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [])

  const baseUrl = process.env.NEXT_PUBLIC_URLBASE_UPLOAD || 'http://localhost:4457'
  const resolvedAvatar =
    user?.avatarUrl && user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : user?.avatarUrl
        ? `${baseUrl}${user.avatarUrl}`
        : undefined
  const avatarSrc = avatarPreview || resolvedAvatar

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setUploadingAvatar(true)

    try {
      const form = new FormData()
      form.append('avatar', file)
      const { data } = await api.put<User>(`/user/updateUser/${user.id}`, form)
      setUser((prev) => (prev ? { ...prev, ...data } : data))
      toast.success('Foto de perfil atualizada')
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível atualizar a foto')
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
      URL.revokeObjectURL(previewUrl)
    }
  }

  return (
    <main className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-24 -right-32 size-80 rounded-full bg-[radial-gradient(circle,rgba(76,95,209,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-[radial-gradient(circle,rgba(34,53,144,0.1),transparent_60%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-6 p-6 lg:p-10">
        <Card className="border-none bg-linear-to-br from-card via-card to-secondary/60 shadow-[0_28px_70px_-45px_rgba(34,53,144,0.5)]">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <label className="relative group cursor-pointer">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(76,95,209,0.3),transparent_70%)] blur-xl" />
                  <Avatar className="relative size-16 border border-border shadow-md overflow-hidden">
                    {avatarSrc && (
                      <AvatarImage src={avatarSrc} alt={user?.name || 'Usuario'} />
                    )}
                    <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-slate-900/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-medium text-white">
                    {uploadingAvatar ? 'Enviando...' : 'Trocar foto'}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    {user?.name || 'Usuario'}
                  </h1>
                  <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
                </div>
              </div>
              <Button disabled>Editar</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_20px_60px_-50px_rgba(15,23,42,0.45)]">
          <CardHeader>
            <CardTitle>Informacoes basicas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                placeholder="Seu nome completo"
                defaultValue={user?.name || ''}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-none shadow-[0_20px_60px_-50px_rgba(15,23,42,0.45)]">
            <CardHeader>
              <CardTitle>Alterar email</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email atual</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  defaultValue={user?.email || ''}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newEmail">Novo email</Label>
                <Input id="newEmail" type="email" placeholder="novo@email.com" />
              </div>
              <div className="flex justify-end">
                <Button disabled>Atualizar email</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[0_20px_60px_-50px_rgba(15,23,42,0.45)]">
            <CardHeader>
              <CardTitle>Alterar senha</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input id="currentPassword" type="password" placeholder="********" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input id="newPassword" type="password" placeholder="********" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input id="confirmPassword" type="password" placeholder="********" />
              </div>
              <div className="flex justify-end">
                <Button disabled>Atualizar senha</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
