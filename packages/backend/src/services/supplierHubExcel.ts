/**
 * Excel parse/export for Supplier Intelligence Hub.
 * Handles grouped multi-row supplier records (blank company = continuation).
 */

import * as XLSX from 'xlsx';

export interface ParsedContact {
  contactName?: string;
  phone?: string;
  fax?: string;
  email?: string;
  whatsappNumber?: string;
  designation?: string;
  notes?: string;
  isPrimary?: boolean;
}

export interface ParsedSupplier {
  category?: string;
  companyName: string;
  address?: string;
  trade?: string;
  remark?: string;
  contacts: ParsedContact[];
}

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

/** Map messy header labels to canonical keys */
function detectColumnMap(headers: string[]): Record<string, keyof ParsedSupplier | keyof ParsedContact | 'category' | 'company'> {
  const map: Record<string, string> = {};
  for (const h of headers) {
    const key = h.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!key) continue;
    if (
      /^(category|supplier group|group|division|sector|class|section|type|discipline)/i.test(key) ||
      /\bcategory\b/i.test(key)
    ) {
      map[h] = 'category';
    } else if (/company|organisation|organization|supplier(?:\s+name)?|^supplier$|vendor/i.test(key)) map[h] = 'company';
    else if (/^contact|person|name(?!\s*\()|attn/i.test(key)) map[h] = 'contactName';
    else if (/phone|mobile|tel|hp/i.test(key) && !/fax/i.test(key)) map[h] = 'phone';
    else if (/fax/i.test(key)) map[h] = 'fax';
    else if (/e-?mail|email address/i.test(key)) map[h] = 'email';
    else if (/whatsapp|wa\b/i.test(key)) map[h] = 'whatsappNumber';
    else if (/designation|title|position/i.test(key)) map[h] = 'designation';
    else if (/^address|location/i.test(key)) map[h] = 'address';
    else if (/trade|speciali[sz]ation|product|service/i.test(key)) map[h] = 'trade';
    // Excel headers: Remarks, Remark, Notes, Comments → supplier_hub_entries.remark
    else if (/remarks?|remark\b|\bnotes?\b|comments?/i.test(key)) map[h] = 'remark';
  }
  return map as any;
}

function rowToObject(
  row: unknown[],
  headerRow: string[],
  colMap: Record<string, string>,
  opts?: { implicitCategoryColIndex?: number }
): Record<string, string> {
  const o: Record<string, string> = {};
  const ic = opts?.implicitCategoryColIndex;
  if (ic != null && ic >= 0) {
    const v = cellStr(row[ic]);
    if (v) o.category = v;
  }
  headerRow.forEach((h, i) => {
    if (!h) return;
    const canon = colMap[h];
    if (!canon) return;
    const val = cellStr(row[i]);
    if (val) o[canon] = val;
  });
  return o;
}

function extractContact(o: Record<string, string>): ParsedContact | null {
  const c: ParsedContact = {
    contactName: o.contactName,
    phone: o.phone,
    fax: o.fax,
    email: o.email,
    whatsappNumber: o.whatsappNumber,
    designation: o.designation,
  };
  const has =
    c.contactName ||
    c.phone ||
    c.fax ||
    c.email ||
    c.whatsappNumber ||
    c.designation;
  return has ? c : null;
}

/**
 * Merge flat rows into suppliers + contacts (continuation rows have empty company).
 */
export function normalizeSupplierRows(rows: Record<string, string>[]): ParsedSupplier[] {
  let rollingCategory = '';
  const out: ParsedSupplier[] = [];
  let current: ParsedSupplier | null = null;

  for (const raw of rows) {
    const category = raw.category?.trim() || '';
    if (category) rollingCategory = category;

    const company = raw.company?.trim() || '';
    const hasCompany = company.length > 0;

    const contact = extractContact(raw);
    const hasContactBits = !!contact;

    if (hasCompany) {
      if (current) out.push(current);
      current = {
        category: category || rollingCategory || undefined,
        companyName: company,
        address: raw.address?.trim() || undefined,
        trade: raw.trade?.trim() || undefined,
        remark: raw.remark?.trim() || undefined,
        contacts: [],
      };
      rollingCategory = current.category || rollingCategory;
      if (hasContactBits && contact) current.contacts.push(contact);
    } else if (current) {
      if (raw.address?.trim() && !current.address) current.address = raw.address.trim();
      if (raw.trade?.trim() && !current.trade) current.trade = raw.trade.trim();
      if (raw.remark?.trim()) {
        current.remark = current.remark
          ? `${current.remark} · ${raw.remark.trim()}`
          : raw.remark.trim();
      }
      if (hasContactBits && contact) current.contacts.push(contact);
    }
  }
  if (current) out.push(current);

  // Ensure at least one primary contact if we only had company row with embedded email in wrong column — noop
  for (const s of out) {
    if (s.contacts.length === 0) s.contacts.push({});
  }
  return out;
}

export function parseSupplierExcelBuffer(buffer: Buffer): {
  rows: Record<string, string>[];
  headers: string[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    warnings.push('Workbook has no sheets');
    return { rows: [], headers: [], warnings };
  }
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
  if (!matrix.length) {
    warnings.push('First sheet is empty');
    return { rows: [], headers: [], warnings };
  }

  // Find header row: first row with >= 2 known column tokens
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(matrix.length, 30); i++) {
    const row = matrix[i].map((c) => cellStr(c).toLowerCase());
    const joined = row.join(' ');
    const score = ['company', 'supplier', 'contact', 'email', 'phone', 'category'].filter((k) =>
      joined.includes(k)
    ).length;
    if (score >= 2) {
      headerRowIdx = i;
      break;
    }
  }

  const headerCells = matrix[headerRowIdx].map((c) => cellStr(c));
  const headers = headerCells.filter((h) => h.length > 0);
  if (headers.length < 2) {
    warnings.push('Could not detect header row; using first row as headers');
  }

  const colMap = detectColumnMap(headerCells);
  if (!Object.values(colMap).includes('company')) {
    warnings.push('No "Company" column detected — check header spelling');
  }

  /**
   * Supplier lists often put a section title in column A with a **blank** header cell
   * (e.g. "Structural Steel & Metal Steel" only on the first row of a block; A is empty for
   * following rows). `rowToObject` skips unlabeled columns, so we map column 0 → category
   * when there is no Category header but Company is in a later column.
   *
   * Also: column A is often "S/No" with category in B (blank header) and company in C.
   */
  let implicitCategoryColIndex: number | undefined;
  if (!Object.values(colMap).includes('category')) {
    const companyHeader = Object.keys(colMap).find((h) => colMap[h] === 'company');
    const companyIdx = companyHeader ? headerCells.indexOf(companyHeader) : -1;
    const h0 = cellStr(headerCells[0]);
    const serialHeader = /^(no\.?|s\/?n|s\/?no\.?|#|seq|index|item)$/i.test(h0);
    if (companyIdx > 0 && !h0) {
      implicitCategoryColIndex = 0;
    } else if (companyIdx > 1 && serialHeader && !cellStr(headerCells[companyIdx - 1])) {
      implicitCategoryColIndex = companyIdx - 1;
    }
  }

  const dataRows: Record<string, string>[] = [];
  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const rowArr = matrix[r] as unknown[];
    const obj = rowToObject(rowArr, headerCells, colMap, {
      implicitCategoryColIndex,
    });
    const hasAny = Object.keys(obj).length > 0;
    if (!hasAny) continue;
    dataRows.push(obj);
  }

  if (dataRows.length === 0) warnings.push('No data rows found below header');

  return { rows: dataRows, headers: headerCells, warnings };
}

export function buildExportWorkbook(
  rows: Array<{
    category?: string | null;
    companyName: string;
    contactName?: string;
    phone?: string;
    fax?: string;
    email?: string;
    whatsappNumber?: string;
    address?: string | null;
    trade?: string | null;
    remark?: string | null;
    status: string;
    updatedAt: Date;
  }>
): Buffer {
  const data = rows.map((r) => ({
    Category: r.category ?? '',
    Company: r.companyName,
    'Contact Name': r.contactName ?? '',
    Phone: r.phone ?? '',
    Fax: r.fax ?? '',
    Email: r.email ?? '',
    WhatsApp: r.whatsappNumber ?? '',
    Address: r.address ?? '',
    Trade: r.trade ?? '',
    Remark: r.remark ?? '',
    Status: r.status,
    'Updated At': r.updatedAt.toISOString(),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer);
}
