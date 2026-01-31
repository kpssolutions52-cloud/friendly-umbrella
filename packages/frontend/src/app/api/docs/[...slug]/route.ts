import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

// Only new QS AI Agent documentation
const docPaths: Record<string, string> = {
  // Main index
  '': 'docs/README.md',
  
  // Non-Technical
  'product-overview': 'docs/PRODUCT_OVERVIEW.md',
  'quick-start': 'docs/QUICK_START.md',
  'multi-company': 'docs/MULTI_COMPANY_ARCHITECTURE.md',
  
  // Technical
  'architecture': 'docs/QS_AI_AGENT_ARCHITECTURE.md',
  'database': 'docs/DATABASE_SCHEMA.md',
  'implementation': 'docs/IMPLEMENTATION_GUIDE.md',
  'code-migration': 'docs/CODE_MIGRATION_GUIDE.md',
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
