import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { NotificationsClient } from './NotificationsClient';

export const metadata: Metadata = { title: 'Notifications — Admin' };

export default async function NotificationsPage() {
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, message, link, is_read, created_at, users!user_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);

  return <NotificationsClient notifications={(notifications as any) ?? []} />;
}
