'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Evolution Lab - Root Page
 * Redirects to the menu screen.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/menu');
  }, [router]);

  return null;
}
