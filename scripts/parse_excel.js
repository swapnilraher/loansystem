const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelPath = path.join(__dirname, '..', 'data', 'banker_list.xlsx');
try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log("Total rows in Excel:", data.length);
  console.log("First 3 rows:");
  console.log(JSON.stringify(data.slice(0, 3), null, 2));

  const states = Array.from(new Set(data.map(r => String(r.State || r.state || '').trim()))).filter(Boolean);
  console.log("Unique States count:", states.length);
  console.log("Sample States:", states.slice(0, 10));

  const products = Array.from(new Set(data.map(r => String(r.Product || r.product || '').trim()))).filter(Boolean);
  console.log("Unique Products count:", products.length);
  console.log("Sample Products:", products.slice(0, 10));
} catch (e) {
  console.error("Error reading excel file:", e);
}
