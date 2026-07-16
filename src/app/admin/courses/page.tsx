import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CoursesClient } from './CoursesClient';

export const metadata: Metadata = { title: 'Courses — Admin' };

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id, title, description, status, created_at, thumbnail_url,
      users!created_by(full_name)
    `)
    .order('created_at', { ascending: false });

  return <CoursesClient courses={(courses as any) ?? []} />;
}
