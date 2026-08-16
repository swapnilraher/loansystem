const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const excelPath = path.join(__dirname, '..', 'data', 'banker_list.xlsx');
const jsonOutputPath = path.join(__dirname, '..', 'data', 'banker_list.json');

try {
  console.log("Loading excel file...");
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`Successfully parsed ${data.length} rows from Excel.`);

  // Map to minimized key structure:
  // s: State
  // c: City
  // p: Product
  // l: Lender Name
  // n: Banker Name
  // o: Banker Contact No (stringified)
  const minifiedData = data.map((row, index) => {
    const state = String(row['State'] || '').trim();
    const city = String(row['City'] || '').trim();
    const product = String(row['Product'] || '').trim();
    const lender = String(row['Lender Name'] || '').trim();
    const banker = String(row['Banker Name'] || '').trim();
    const contact = String(row['Banker Contact No'] || '').trim();

    return {
      s: state,
      c: city,
      p: product,
      l: lender,
      n: banker,
      o: contact
    };
  });

  fs.writeFileSync(jsonOutputPath, JSON.stringify(minifiedData, null, 2), 'utf-8');
  const stats = fs.statSync(jsonOutputPath);
  console.log(`Saved minified JSON to ${jsonOutputPath}. File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

} catch (e) {
  console.error("Error converting excel to JSON:", e);
}
