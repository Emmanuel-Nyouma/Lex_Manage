'use client';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import api from '@/lib/api';
import DashboardView from '@/components/dashboard/DashboardView';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const { data: tenant } = useQuery({
    queryKey: ['my-tenant'],
    queryFn: () => api.get('/tenants/me').then(r => r.data),
    enabled: !!isAuthenticated,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.get('/cases').then(r => r.data),
    enabled: !!isAuthenticated,
  });

  if (!isAuthenticated) return null;

  return (
    <main className="flex-1 p-6">
      <DashboardView currentUser={user} tenant={tenant} cases={cases} />
    </main>
  );
}
