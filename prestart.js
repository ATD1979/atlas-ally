const fs = require('fs');
console.log('PRESTART RUNNING');
const path = 'public/index.html';
if (!fs.existsSync(path)) {
  console.log('index.html not found - skipping blob check');
  process.exit(0);
}
const lines = fs.readFileSync(path, 'utf8').split('\n');
const i = lines.findIndex(l => l.length > 500000);
if (i !== -1) {
  lines.splice(i, 1);
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Blob removed at line ' + (i + 1));
} else {
  console.log('No blob found - index.html is clean');
}
