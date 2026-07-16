import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BookOpen, CheckCircle, PlayCircle, FileText, Lock } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('courses').select('title').eq('id', id).single();
  return { title: data?.title ?? 'Course Player' };
}

export default async function CoursePlayerPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('*, modules(*)')
    .eq('id', id)
    .single();

  if (!course) {
    notFound();
  }

  // Sort modules if there's an order_index
  const modules = course.modules?.sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)) || [];

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', minHeight: 'calc(100vh - 120px)' }}>
      {/* Sidebar / Syllabus */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.3 }}>{course.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <div style={{ flex: 1, height: '6px', background: 'var(--color-surface)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '0%', height: '100%', background: 'var(--color-primary)' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted)' }}>0%</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {modules.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
              No modules published yet.
            </div>
          ) : (
            modules.map((mod: any, index: number) => (
              <div key={mod.id} style={{ padding: '12px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }} className="nav-item">
                <div style={{ color: 'var(--color-muted)', marginTop: '2px' }}>
                  {index === 0 ? <PlayCircle size={18} style={{ color: 'var(--color-primary)' }} /> : <Lock size={18} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: index === 0 ? 'var(--color-foreground)' : 'var(--color-muted)' }}>
                    {mod.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>Video • 10 min</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          flex: 1, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-muted)', position: 'relative'
        }}>
          {modules.length > 0 ? (
            <div style={{ textAlign: 'center' }}>
              <PlayCircle size={64} style={{ opacity: 0.5, marginBottom: '16px', display: 'inline-block' }} />
              <p>Video Player Placeholder</p>
            </div>
          ) : (
             <div style={{ textAlign: 'center' }}>
               <BookOpen size={64} style={{ opacity: 0.5, marginBottom: '16px', display: 'inline-block' }} />
               <p>Course content will appear here</p>
             </div>
          )}
        </div>
        
        {modules.length > 0 && (
          <div style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>{modules[0].title}</h2>
            <div style={{ color: 'var(--color-muted)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: modules[0].content ?? 'No content provided for this module.' }} />
            
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
              <button className="btn btn-secondary" disabled>Previous</button>
              <button className="btn btn-primary">Mark as Complete <CheckCircle size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
