'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, ChevronLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Question {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  time_limit_ms: number;
  memory_limit_mb: number;
}

interface TestCase {
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

interface Props {
  question: Question;
  testCases: TestCase[];
}

const LANGUAGES = [
  { id: 71, name: 'Python', monacoId: 'python', defaultCode: 'def solve():\n    # Write your code here\n    pass\n\nif __name__ == "__main__":\n    solve()' },
  { id: 62, name: 'Java', monacoId: 'java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}' },
  { id: 63, name: 'JavaScript', monacoId: 'javascript', defaultCode: 'function solve() {\n    // Write your code here\n}\n\nsolve();' },
  { id: 54, name: 'C++', monacoId: 'cpp', defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}' }
];

export function CodingIDE({ question, testCases }: Props) {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(language.defaultCode);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGES.find(l => l.id.toString() === e.target.value);
    if (lang) {
      setLanguage(lang);
      setCode(lang.defaultCode);
    }
  };

  const handleRun = async (submit: boolean = false) => {
    try {
      if (submit) setIsSubmitting(true);
      else setIsRunning(true);
      setResults(null);

      // We still determine casesToRun so we can zip them with the results later
      const casesToRun = submit ? testCases : testCases.filter(t => !t.is_hidden);

      if (casesToRun.length === 0) {
        toast.info("No public test cases to run.");
        return;
      }

      // Step 1: Submit to backend
      const response = await fetch('/api/compiler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          source_code: code,
          language: language.name.toLowerCase(),
          is_submit: submit
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to communicate with compiler service');
      }

      const data = await response.json();
      const submissionId = data.submissionId;
      const judge0Token = data.judge0Token;
      
      if (!submissionId) {
        throw new Error('No submission ID returned');
      }

      // Step 2: Poll for results
      let currentStatus = data.status;
      let finalResults = null;
      let attempts = 0;
      
      while (['pending', 'running'].includes(currentStatus) && attempts < 30) {
        await new Promise(r => setTimeout(r, 1000));
        attempts++;
        
        const pollRes = await fetch(`/api/compiler?submissionId=${submissionId}${judge0Token ? `&tokens=${judge0Token}` : ''}`);
        if (pollRes.ok) {
          const pollData = await pollRes.json();
          currentStatus = pollData.status;
          
          if (!['pending', 'running'].includes(currentStatus)) {
            finalResults = pollData.test_case_results;
            break;
          }
        }
      }

      if (!finalResults) {
        throw new Error('Timeout waiting for compiler results');
      }
      
      // Step 3: Merge results with expected outputs for display
      const mergedResults = casesToRun.map((tc, index) => {
        const res = finalResults[index] || {};
        
        // Outputs are already decoded strings in our new backend, or we decode if needed
        const stdout = res.stdout ? atob(res.stdout).trim() : null;
        const stderr = res.stderr ? atob(res.stderr).trim() : null;
        const compile_output = res.compile_output ? atob(res.compile_output).trim() : null;
        const expected = tc.expected_output.trim();

        return {
          ...tc,
          status_id: res.status_id,
          status_description: res.status_description,
          stdout,
          stderr,
          compile_output,
          time: (res.time_ms / 1000).toFixed(3),
          memory: res.memory_mb * 1000,
          passed: res.passed,
          error: stderr || compile_output
        };
      });

      setResults(mergedResults);
      
      if (submit) {
        const allPassed = mergedResults.every(r => r.passed);
        if (allPassed) {
          toast.success('Congratulations! All test cases passed.');
          // In a real app, call a server action here to save the submission to the database.
        } else {
          toast.error('Some test cases failed. Keep trying!');
        }
      }

    } catch (err: any) {
      toast.error(err.message || 'An error occurred while running your code.');
    } finally {
      setIsRunning(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--color-background)', position: 'fixed', top: 0, left: 0, zIndex: 100 }}>
      {/* Left Pane: Description & Results */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', height: '100%' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/student/assessments" className="btn btn-ghost btn-icon" style={{ marginLeft: '-8px' }}>
            <ChevronLeft size={20} />
          </Link>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{question.title}</h1>
          <span className={`badge badge-${question.difficulty === 'hard' ? 'danger' : question.difficulty === 'medium' ? 'warning' : 'success'}`} style={{ marginLeft: 'auto' }}>
            {question.difficulty.toUpperCase()}
          </span>
        </div>

        {/* Content Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 16px' }}>
          <button style={{ padding: '12px 16px', borderBottom: '2px solid var(--color-primary)', fontWeight: 500 }}>Description</button>
        </div>

        {/* Description */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div className="prose" dangerouslySetInnerHTML={{ __html: question.description ?? 'No description provided.' }} />
          
          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
            <div><strong>Time Limit:</strong> {question.time_limit_ms / 1000}s</div>
            <div><strong>Memory Limit:</strong> {question.memory_limit_mb}MB</div>
          </div>
        </div>

        {/* Results Pane */}
        {results && (
          <div style={{ height: '35%', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '0.875rem' }}>
              Execution Results
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {results.map((res, idx) => (
                <div key={idx} style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', border: `1px solid ${res.passed ? 'var(--color-success)' : 'var(--color-danger)'}`, background: 'var(--color-background)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: res.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {res.passed ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      Test Case {idx + 1} {res.is_hidden && '(Hidden)'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{res.time}s • {res.memory}KB</span>
                  </div>
                  
                  {res.error ? (
                    <pre style={{ padding: '12px', background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', borderRadius: '4px', fontSize: '0.8125rem', overflowX: 'auto', color: 'var(--color-danger)' }}>
                      {res.error}
                    </pre>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
                      <div>
                        <div style={{ color: 'var(--color-muted)', marginBottom: '4px' }}>Input:</div>
                        <pre style={{ padding: '8px', background: 'var(--color-surface)', borderRadius: '4px', overflowX: 'auto' }}>{res.input}</pre>
                      </div>
                      <div>
                        <div style={{ color: 'var(--color-muted)', marginBottom: '4px' }}>Output / Expected:</div>
                        <pre style={{ padding: '8px', background: 'var(--color-surface)', borderRadius: '4px', overflowX: 'auto' }}>
                          <span style={{ color: res.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>{res.stdout || '(no output)'}</span>
                          <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />
                          {res.expected_output}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Pane: Code Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Editor Toolbar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)' }}>
          <select 
            className="form-input" 
            style={{ width: '150px', height: '32px', padding: '0 12px' }}
            value={language.id}
            onChange={handleLanguageChange}
          >
            {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => handleRun(false)}
              disabled={isRunning || isSubmitting}
            >
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Run Code
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => handleRun(true)}
              disabled={isRunning || isSubmitting}
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div style={{ flex: 1, padding: '16px 0', background: '#1e1e1e' }}>
          <Editor
            height="100%"
            language={language.monacoId}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              padding: { top: 16 },
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}
