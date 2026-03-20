/* ---------------------------------------------------------
   INTELLIGENS XLSX IMPORT
   társasház pénztárkönyv import
   bevételek + kiadások
   duplikációvédelemmel
--------------------------------------------------------- */

export async function importHouseCashbookWorkbook(file, state) {

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });

  if (!state.importedFiles) state.importedFiles = [];
  if (!state.transactions) state.transactions = [];

  const fileFingerprint = await fingerprintFile(file);

  if (state.importedFiles.includes(fileFingerprint)) {
    alert("Ez a fájl már korábban importálva lett.");
    return state;
  }

  const seen = new Set(state.transactions.map(t => transactionKey(t)));

  workbook.SheetNames.forEach(sheetName => {

    if (!sheetName.toLowerCase().includes("elszámolás")) return;

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const yearMatch = sheetName.match(/20\d{2}/);
    const sheetYear = yearMatch ? parseInt(yearMatch[0]) : null;

    const header = detectHeader(rows);

    for (let i = header.row + 1; i < rows.length; i++) {

      const r = rows[i];

      const dateRaw = r[header.date];
      const desc = cleanText(r[header.desc]);
      const income = parseAmount(r[header.income]);
      const expense = parseAmount(r[header.expense]);

      if (!dateRaw || !desc) continue;

      if (ignoreRow(desc)) continue;

      let type = null;
      let amount = 0;

      if (income) {
        type = "income";
        amount = income;
      }

      if (expense) {
        type = "expense";
        amount = expense;
      }

      if (!type) continue;

      const date = normalizeDate(dateRaw, sheetYear);

      const transaction = {
        date,
        description: desc,
        type,
        amount,
        sourceSheet: sheetName,
        sourceRow: i
      };

      const key = transactionKey(transaction);

      if (seen.has(key)) continue;

      seen.add(key);
      state.transactions.push(transaction);
    }

  });

  state.importedFiles.push(fileFingerprint);

  rebuildCashbookBalance(state);

  return state;
}


/* ---------------------------------------------------------
   FEJLÉC FELISMERÉS
--------------------------------------------------------- */

function detectHeader(rows) {

  for (let r = 0; r < 10; r++) {

    const row = rows[r].map(v => String(v).toLowerCase());

    const date = row.findIndex(c => c.includes("dátum"));
    const desc = row.findIndex(c =>
      c.includes("megnevez") ||
      c.includes("jogcím") ||
      c.includes("közlem")
    );
    const income = row.findIndex(c => c.includes("bevét"));
    const expense = row.findIndex(c => c.includes("kiadás"));

    if (date >= 0 && (income >= 0 || expense >= 0)) {

      return {
        row: r,
        date,
        desc,
        income,
        expense
      };

    }
  }

  return {
    row: 0,
    date: 1,
    desc: 2,
    income: 3,
    expense: 4
  };
}


/* ---------------------------------------------------------
   SOR SZŰRÉS
--------------------------------------------------------- */

function ignoreRow(text) {

  const t = text.toLowerCase();

  if (t.includes("áthozat")) return true;
  if (t.includes("átvitel")) return true;
  if (t.includes("összesen")) return true;
  if (t.includes("egyenleg")) return true;

  return false;
}


/* ---------------------------------------------------------
   ÖSSZEG FELISMERÉS
--------------------------------------------------------- */

function parseAmount(v) {

  if (!v) return 0;

  if (typeof v === "number") return Math.abs(v);

  const cleaned = String(v)
    .replace(/\s/g, "")
    .replace(",", ".");

  const num = parseFloat(cleaned);

  if (isNaN(num)) return 0;

  return Math.abs(num);
}


/* ---------------------------------------------------------
   DÁTUM NORMALIZÁLÁS
--------------------------------------------------------- */

function normalizeDate(v, year) {

  if (v instanceof Date) return v.toISOString().slice(0,10);

  const s = String(v).trim();

  const m = s.match(/(\d{1,2})\.(\d{1,2})/);

  if (m && year) {

    const month = m[1].padStart(2,"0");
    const day = m[2].padStart(2,"0");

    return `${year}-${month}-${day}`;
  }

  return s;
}


/* ---------------------------------------------------------
   DUPLIKÁCIÓKULCS
--------------------------------------------------------- */

function transactionKey(t) {

  return [
    t.date,
    t.description,
    t.type,
    t.amount
  ].join("|");

}


/* ---------------------------------------------------------
   FILE HASH
--------------------------------------------------------- */

async function fingerprintFile(file) {

  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = Array.from(new Uint8Array(hash));

  return bytes.map(b => b.toString(16).padStart(2,"0")).join("");
}


/* ---------------------------------------------------------
   SZÖVEG TISZTÍTÁS
--------------------------------------------------------- */

function cleanText(v) {

  if (!v) return "";

  return String(v).trim();

}


/* ---------------------------------------------------------
   EGYENLEG ÚJRASZÁMOLÁS
--------------------------------------------------------- */

export function rebuildCashbookBalance(state) {

  let balance = state.openingCash || 0;

  state.transactions.sort((a,b) => a.date.localeCompare(b.date));

  state.transactions.forEach(t => {

    if (t.type === "income") balance += t.amount;
    if (t.type === "expense") balance -= t.amount;

    t.balance = balance;

  });

}