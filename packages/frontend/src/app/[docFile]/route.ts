import { NextResponse } from 'next/server';

// Redirect direct markdown file requests to proper docs routes
const docFileRedirects: Record<string, string> = {
  'PRODUCT_OVERVIEW.md': '/docs/product-overview',
  'QUICK_START.md': '/docs/quick-start',
  'MULTI_COMPANY_ARCHITECTURE.md': '/docs/multi-company',
  'QS_AI_AGENT_ARCHITECTURE.md': '/docs/architecture',
  'DATABASE_SCHEMA.md': '/docs/database',
  'IMPLEMENTATION_GUIDE.md': '/docs/implementation',
  'CODE_MIGRATION_GUIDE.md': '/docs/code-migration',
  'README.md': '/docs',
};

export async function GET(
  request: Request,
  { params }: { params: { docFile: string } }
) {
  const docFile = params.docFile;
  
  // Only handle known markdown files
  if (!docFile.endsWith('.md') && !docFileRedirects[docFile]) {
    // Not a markdown file we handle, return 404
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  const redirectPath = docFileRedirects[docFile];
  
  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, request.url), 301);
  }
  
  // If not a known doc file, redirect to main docs
  return NextResponse.redirect(new URL('/docs', request.url), 301);
}
