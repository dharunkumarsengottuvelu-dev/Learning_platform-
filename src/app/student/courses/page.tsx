import { createClient } from '@/lib/supabase/server';
import { BookOpen, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { truncate } from '@/lib/utils';

export const metadata = { title: 'My Courses' };

export default async function StudentCoursesPage() {
  const supabase = await createClient();

  // For now we'll fetch all published courses since enrollment logic isn't fully scaffolded in the UI yet.
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 className="text-h2">My Courses</h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
          Continue learning where you left off.
        </p>
      </div>

      {!courses || courses.length === 0 ? (
        <div className="card empty-state" style={{ padding: '60px 20px' }}>
          <BookOpen size={48} className="empty-state-icon" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '16px 0 8px' }}>No courses found</h3>
          <p style={{ color: 'var(--color-muted)', maxWidth: '400px', margin: '0 auto' }}>
            You haven't been enrolled in any courses yet. Check back later or contact your trainer.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {courses.map((course) => (
            <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                height: '160px',
                background: course.thumbnail_url ? `url(${course.thumbnail_url}) center/cover` : 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {!course.thumbnail_url && <BookOpen size={40} style={{ color: 'var(--color-muted)' }} />}
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>
                  {course.title}
                </h3>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', flex: 1, marginBottom: '24px' }}>
                  {truncate(course.description ?? '', 100)}
                </p>
                <Link href={`/student/courses/${course.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <PlayCircle size={16} /> Continue Learning
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
