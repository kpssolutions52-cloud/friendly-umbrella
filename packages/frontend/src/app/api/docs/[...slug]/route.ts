import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

// Redirects for old documentation paths
const redirects: Record<string, string> = {
  'user-guide/getting-started': 'quick-start',
  'user-guide/rfq-guide': 'product-overview',
  'user-guide/supplier-guide': 'product-overview',
  'user-guide/company-guide': 'multi-company',
  'user-guide/api-testing': 'implementation',
  'technical/architecture': 'architecture',
  'technical/api-reference': 'architecture',
  'technical/rfq-system': 'architecture',
  'technical/price-management-flow': 'database',
  'technical/setup': 'implementation',
  'technical/deployment': 'implementation',
};

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
  // Extract filename from path (e.g., 'docs/PRODUCT_OVERVIEW.md' -> 'PRODUCT_OVERVIEW.md')
  const filename = relativePath.replace('docs/', '').replace(/^.*\//, '');
  
  // Try multiple possible paths for different environments
  const possiblePaths = [
    // First try: docs copied to frontend package during build (Vercel/serverless)
    // This is where copy-docs.js puts them
    join(process.cwd(), 'docs', filename),
    // Second try: from frontend package, go up to project root (local dev)
    join(process.cwd(), '../../', relativePath),
    // Third try: alternative path format
    join(process.cwd(), '../..', relativePath),
    // Fourth try: Vercel/serverless at project root
    join(process.cwd(), relativePath),
    // Fifth try: absolute path from project root (if cwd is packages/frontend)
    join(process.cwd(), '..', '..', relativePath),
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
  
  // Check for redirects first
  if (redirects[slug]) {
    const url = new URL(request.url);
    url.pathname = `/docs/${redirects[slug]}`;
    return NextResponse.redirect(url, 301);
  }
  
  const filePath = docPaths[slug];

  if (!filePath) {
    // For unknown paths, return main docs content instead of redirect
    // (to avoid redirect loops and provide better UX)
    try {
      const resolvedPath = getDocsPath('docs/README.md');
      const content = readFileSync(resolvedPath, 'utf-8');
      return NextResponse.json({ content });
    } catch (error) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  try {
    const resolvedPath = getDocsPath(filePath);
    const content = readFileSync(resolvedPath, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Failed to read docs file:', filePath, error);
    // Return main docs on error
    try {
      const resolvedPath = getDocsPath('docs/README.md');
      const content = readFileSync(resolvedPath, 'utf-8');
      return NextResponse.json({ content });
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }
}
