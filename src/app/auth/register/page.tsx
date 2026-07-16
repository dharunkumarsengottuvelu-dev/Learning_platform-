import type { Metadata } from 'next';
import { RegisterClient } from '@/features/auth/components/RegisterClient';

export const metadata: Metadata = {
  title: 'Register — Training Compiler',
};

export default function RegisterPage() {
  return <RegisterClient />;
}
