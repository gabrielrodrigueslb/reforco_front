'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { User, Lock, Camera, Save, Loader2, ShieldCheck, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import PageTitle from '@/components/page-title'

import { getSession } from '@/lib/auth'

interface UserData {
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

function validateStrongPassword(value: string) {
  const rules = [
    { ok: value.length >= 8, message: 'mínimo 8 caracteres' },
    { ok: /[a-z]/.test(value), message: 'uma letra minúscula' },
    { ok: /[A-Z]/.test(value), message: 'uma letra maiúscula' },
    { ok: /[0-9]/.test(value), message: 'um número' },
    { ok: /[^A-Za-z0-9]/.test(value), message: 'um caractere especial' },
  ]
  const errors = rules.filter((r) => !r.ok).map((r) => r.message)
  return { valid: errors.length === 0, errors }
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4457/api'
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || ''

  const resolvedAvatar =
    user?.avatarUrl && user.avatarUrl.startsWith('http')
      ? user.avatarUrl
      : user?.avatarUrl
        ? `${baseUrl}${user.avatarUrl}`
        : undefined

  const avatarSrc = avatarPreview || resolvedAvatar

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx. 10MB).')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setUploadingAvatar(true)

    try {
      const form = new FormData()
      form.append('avatar', file)

      const res = await fetch(`${apiUrl}/user/updateUser/${user.id}`, {
        method: 'PUT',
        body: form,
        credentials: 'include',
        headers: {
          'x-api-key': apiKey,
        },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Não foi possível atualizar a foto')
      }

      const data = (await res.json()) as UserData
      setUser((prev) => (prev ? { ...prev, ...data } : data))
      toast.success('Foto de perfil atualizada')
    } catch (error: any) {
      console.error(error)
      const message = error?.message || 'Não foi possível atualizar a foto'
      toast.error(message)
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
      URL.revokeObjectURL(previewUrl)
    }
  }

  const handlePasswordUpdate = async () => {
    if (!user?.id) return

    if (!passwordForm.current) {
      toast.error('Informe a senha atual')
      return
    }
    if (!passwordForm.next) {
      toast.error('Informe a nova senha')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('A confirmação não confere')
      return
    }

    const strong = validateStrongPassword(passwordForm.next)
    if (!strong.valid) {
      toast.error(`Senha fraca: ${strong.errors.join(', ')}`)
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch(`${apiUrl}/user/updateUser/${user.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          current_password: passwordForm.current,
          currentPassword: passwordForm.current,
          password: passwordForm.next,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Não foi possível atualizar a senha')
      }

      toast.success('Senha atualizada com sucesso')
      setPasswordForm({ current: '', next: '', confirm: '' })
    } catch (error: any) {
      console.error(error)
      const message = error?.message || 'Não foi possível atualizar a senha'
      toast.error(message)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Alterações salvas com sucesso!')
    }, 1000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <PageTitle
          title="Meu Perfil"
          className="text-2xl lg:text-3xl font-bold text-slate-800"
        />
        <p className="text-slate-500">
          Gerencie suas informações pessoais e configurações de segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer mb-4">
              <div className="absolute -inset-0.5 rounded-full bg-linear-to-br from-(--brand-gradient-from) to-(--brand-gradient-to) opacity-70 blur-sm group-hover:opacity-100 transition duration-200" />

              <Avatar className="relative w-32 h-32 border-4 border-white shadow-sm">
                {avatarSrc && <AvatarImage src={avatarSrc} className="object-cover" />}
                <AvatarFallback className="text-2xl font-bold bg-slate-50 text-slate-400">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer">
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            </div>

            <h2 className="text-xl font-bold text-slate-800">{user?.name || 'Usuário'}</h2>
            <p className="text-sm text-slate-500 mb-4">{user?.email}</p>

            <div className="w-full pt-4 border-t border-slate-50 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-3 h-3" />
              Conta Segura
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Informações básicas</h3>
                <p className="text-xs text-slate-500">Seus dados de identificação na plataforma</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-slate-600">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="name"
                    defaultValue={user?.name}
                    className="pl-9 h-11 rounded-xl bg-slate-50/50 focus:bg-white transition-colors"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Segurança</h3>
                <p className="text-xs text-slate-500">Gerencie sua senha de acesso</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Alterar Senha
                </h4>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current-pass" className="text-xs text-slate-500">
                      Senha Atual
                    </Label>
                    <Input
                      id="current-pass"
                      type="password"
                      className="h-10 rounded-xl"
                      placeholder="********"
                      value={passwordForm.current}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, current: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-pass" className="text-xs text-slate-500">
                      Nova Senha
                    </Label>
                    <Input
                      id="new-pass"
                      type="password"
                      className="h-10 rounded-xl"
                      placeholder="********"
                      value={passwordForm.next}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, next: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-pass" className="text-xs text-slate-500">
                      Confirmar Nova Senha
                    </Label>
                    <Input
                      id="confirm-pass"
                      type="password"
                      className="h-10 rounded-xl"
                      placeholder="********"
                      value={passwordForm.confirm}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-slate-200 text-slate-600 hover:text-slate-800"
                  onClick={handlePasswordUpdate}
                  disabled={savingPassword || loading}
                >
                  {savingPassword ? 'Atualizando...' : 'Atualizar Segurança'}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
