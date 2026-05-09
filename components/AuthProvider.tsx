'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

const publicRoutes = [
  '/login',
  '/register',
];

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();

  const pathname = usePathname();

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const token =
      localStorage.getItem(
        'taskflow_token'
      );

    const isPublicRoute =
      publicRoutes.includes(
        pathname
      );

    // NO TOKEN
    if (!token) {

      if (!isPublicRoute) {
        router.replace('/login');
      }

      setLoading(false);
      return;
    }

    // TOKEN EXISTS
    if (isPublicRoute) {
      router.replace('/');
    }

    setLoading(false);

  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return children;
}