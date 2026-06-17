// generate-static-pages.js
// Generates static page files for each loan type, state, and city using slugified URLs.

const fs = require('fs');
const path = require('path');
const tsNode = require('ts-node');
tsNode.register({ transpileOnly: true });

const { maharashtraCities } = require('../src/lib/maharashtraCities');
const { slugify } = require('../src/lib/slugify');

const loanTypes = ['personal-loan', 'home-loan', 'lap-loan'];
const state = 'maharashtra';
const baseDir = path.join(__dirname, '..', 'src', 'app');

// Updated ensureDir with error handling
function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    console.error(`Failed to ensure directory ${dir}:`, e);
  }
}

// Clean up any folder whose name does not match the slugified version, ignore permission errors
function cleanMismatched() {
  const appDir = path.join(__dirname, '..', 'src', 'app');
  loanTypes.forEach(loan => {
    const statePath = path.join(appDir, loan, state);
    if (!fs.existsSync(statePath)) return;
    const cities = fs.readdirSync(statePath);
    cities.forEach(city => {
      const expected = slugify(city);
      if (city !== expected) {
        const fullPath = path.join(statePath, city);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`Removed mismatched folder ${fullPath}`);
        } catch (e) {
          console.error(`Failed to remove ${fullPath}:`, e);
        }
      }
    });
  });
}

function createPageFile(loan, city) {
  const citySlug = slugify(city);
  const dir = path.join(baseDir, loan, state, citySlug);
  ensureDir(dir);
  const filePath = path.join(dir, 'page.tsx');
  const content = `import LoanPageTemplate from '@/components/LoanPageTemplate';

export const metadata = {
  title: '${loan.replace('-', ' ')} in ${city}, ${state}',
  description: 'Information and application for ${loan.replace('-', ' ')} in ${city}, ${state}.'
};

export default function Page() {
  return <LoanPageTemplate loan="${loan}" state="${state}" city="${city}" />;
}
`;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Generated ${filePath}`);
}

// Clean up any folder whose name does not match the slugified version
function cleanMismatched() {
  const appDir = path.join(__dirname, '..', 'src', 'app');
  loanTypes.forEach(loan => {
    const statePath = path.join(appDir, loan, state);
    if (!fs.existsSync(statePath)) return;
    const cities = fs.readdirSync(statePath);
    cities.forEach(city => {
      const expected = slugify(city);
      if (city !== expected) {
        const fullPath = path.join(statePath, city);
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`Removed mismatched folder ${fullPath}`);
        } catch (e) {
          console.error(`Failed to remove ${fullPath}:`, e);
        }
      }
    });
  });
}

// Run cleanup then generate pages
cleanMismatched();


loanTypes.forEach((loan) => {
  maharashtraCities.forEach((city) => {
    createPageFile(loan, city);
  });
});

console.log('Static page generation completed.');
