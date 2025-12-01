import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

const docPaths: Record<string, string> = {
  'user-guide/getting-started': 'docs/user-guide/getting-started.md',
  'user-guide/supplier-guide': 'docs/user-guide/supplier-guide.md',
  'user-guide/company-guide': 'docs/user-guide/company-guide.md',
  'user-guide/api-testing': 'docs/user-guide/api-testing.md',
  'technical/architecture': 'docs/technical/architecture.md',
  'technical/api-reference': 'docs/technical/api-reference.md',
  'technical/price-management-flow': 'docs/technical/price-management-flow.md',
  'technical/setup': 'docs/technical/setup.md',
  'technical/deployment': 'docs/technical/deployment.md',
  '': 'docs/README.md',
};

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
    const content = readFileSync(
      join(process.cwd(), '../../', filePath),
      'utf-8'
    );
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

