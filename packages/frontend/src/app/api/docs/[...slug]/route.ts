import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

const docPaths: Record<string, string> = {
  'user-guide/getting-started': 'docs/user-guide/getting-started.md',
  'user-guide/rfq-guide': 'docs/user-guide/rfq-guide.md',
  'user-guide/supplier-guide': 'docs/user-guide/supplier-guide.md',
  'user-guide/company-guide': 'docs/user-guide/company-guide.md',
  'user-guide/api-testing': 'docs/user-guide/api-testing.md',
  'technical/architecture': 'docs/technical/architecture.md',
  'technical/api-reference': 'docs/technical/api-reference.md',
  'technical/rfq-system': 'docs/technical/rfq-system.md',
  'technical/price-management-flow': 'docs/technical/price-management-flow.md',
  'technical/setup': 'docs/technical/setup.md',
  'technical/deployment': 'docs/technical/deployment.md',
  '': 'docs/README.md',
};

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

export async function GET(
  request: Request,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug?.join('/') || '';
  const filePath = docPaths[slug];

  if (!filePath) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const resolvedPath = getDocsPath(filePath);
    const content = readFileSync(resolvedPath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read docs file:', filePath, error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

