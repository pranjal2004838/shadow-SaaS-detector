import * as fs from 'fs';
import * as path from 'path';
import { DetectedApp } from './simulator';

interface SaaSEntry {
  id: number;
  name: string;
  category: string;
  typical_price: number;
  risk_level: string;
  data_permissions: string[];
  keywords: string[];
}

interface ExpenseRow {
  Date: string;
  Employee: string;
  Department: string;
  Amount: string;
  Description: string;
  Category: string;
}

interface BrowserEntry {
  url: string;
  title: string;
  timestamp: string;
}

const DB_PATH = path.join(__dirname, '..', 'data', 'saas_database.json');

function loadSaaSDB(): SaaSEntry[] {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function parseCSV(csvContent: string): ExpenseRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] !== undefined ? values[i] : '';
      });
      return row as unknown as ExpenseRow;
    })
    .filter((row) => row.Description && row.Description.trim() !== ''); // Only keep rows with Description
}

export function detectShadowSaaS(
  expensesCSV: string,
  browserHistoryJSON: string
): DetectedApp[] {
  const saasDB = loadSaaSDB();
  const expenses = parseCSV(expensesCSV);

  let browserHistory: BrowserEntry[] = [];
  try {
    const parsed = JSON.parse(browserHistoryJSON);
    browserHistory = parsed.browser_history || parsed;
  } catch {
    browserHistory = [];
  }

  const detectedMap = new Map<number, DetectedApp>();

  // Match expenses against SaaS database
  for (const expense of expenses) {
    // Skip rows with missing Description
    if (!expense.Description || expense.Description.trim() === '') continue;
    
    const desc = expense.Description.toLowerCase();
    for (const saas of saasDB) {
      const matched = saas.keywords.some((kw) => desc.includes(kw.toLowerCase()));
      if (matched) {
        const existing = detectedMap.get(saas.id);
        if (!existing) {
          detectedMap.set(saas.id, {
            id: saas.id,
            name: saas.name,
            category: saas.category,
            typical_price: parseFloat(expense.Amount) || saas.typical_price,
            risk_level: saas.risk_level,
            employee: expense.Employee,
            department: expense.Department,
            evidence: [`Expense: ${expense.Description} ($${expense.Amount}) on ${expense.Date}`],
            data_permissions: saas.data_permissions,
          });
        } else {
          existing.evidence = existing.evidence || [];
          existing.evidence.push(
            `Expense: ${expense.Description} ($${expense.Amount}) on ${expense.Date}`
          );
        }
      }
    }
  }

  // Match browser history against SaaS database
  for (const entry of browserHistory) {
    const url = entry.url.toLowerCase();
    const title = entry.title.toLowerCase();
    for (const saas of saasDB) {
      const matched = saas.keywords.some(
        (kw) => url.includes(kw.toLowerCase()) || title.includes(kw.toLowerCase())
      );
      if (matched) {
        const existing = detectedMap.get(saas.id);
        if (!existing) {
          detectedMap.set(saas.id, {
            id: saas.id,
            name: saas.name,
            category: saas.category,
            typical_price: saas.typical_price,
            risk_level: saas.risk_level,
            evidence: [`Browser: ${entry.title} (${entry.url}) at ${entry.timestamp}`],
            data_permissions: saas.data_permissions,
          });
        } else {
          existing.evidence = existing.evidence || [];
          const evidenceStr = `Browser: ${entry.title} (${entry.url}) at ${entry.timestamp}`;
          if (!existing.evidence.includes(evidenceStr)) {
            existing.evidence.push(evidenceStr);
          }
        }
      }
    }
  }

  return Array.from(detectedMap.values());
}
