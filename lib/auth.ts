interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface loginRequestParams {
  email: string;
  password: string;
}

export async function loginRequest({
  email,
  password,
}: loginRequestParams): Promise<LoginResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 🔥 OBRIGATÓRIO
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao logar');
  }

  return res.json();
}

export async function getSession() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
    { method: 'GET',
      credentials: 'include',
    }
  );

   if (!res.ok) return null;

  return res.json();
}

export async function logoutRequest() {
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}


