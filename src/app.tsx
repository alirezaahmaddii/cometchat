// src/app.tsx
import React from 'react';
import { AuthProvider } from '@/models/AuthProvider';

export async function getInitialState(): Promise<{ name: string }> {
  return { name: '@umijs/max' };
}

export function rootContainer(container: React.ReactNode) {
  return <AuthProvider>{container}</AuthProvider>;
}
