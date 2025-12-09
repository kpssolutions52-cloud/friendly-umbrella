import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

function getDocsPath(relativePath: string): string {
  // Try multiple possible paths for different environments
  const possiblePaths = [
    // First try: docs copied to frontend package during build (Vercel/serverless)
    join(process.cwd(), 'docs', relativePath.replace('docs/', '')),
    // Second try: from frontend package, go up to project root (local dev)
    join(process.cwd(), '../../', relativePath),
    // Third try: alternative path format
    join(process.cwd(), '../..', relativePath),
    // Fourth try: Vercel/serverless at project root
    join(process.cwd(), relativePath),
  ];

  for (const testPath of possiblePaths) {
    try {
      // Check if file exists by trying to read it
      readFileSync(testPath, 'utf-8');
      return testPath;
    } catch {
      // Continue to next path
    }
  }

  // Return the first path as fallback (will fail with proper error message)
  return possiblePaths[0];
}

export async function GET() {
  try {
    const resolvedPath = getDocsPath('docs/README.md');
    const content = readFileSync(resolvedPath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read docs README:', error);
    return NextResponse.json(
      { content: '# Documentation\n\nWelcome to the Construction Pricing Platform documentation.' },
      { status: 200 }
    );
  }
}












