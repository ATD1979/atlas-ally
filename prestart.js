const fs = require('fs');
console.log('PRESTART RUNNING');
const lines = fs.readFileSync('public/index.html', 'utf8').split('\n');
const i = lines.findIndex(l => l.length > 500000);
if (i !== -1) {
  lines.splice(i, 1);
  fs.writeFileSync('public/index.html', lines.join('\n'));
  console.log('Blob removed at line ' + (i + 1));
} else {
  console.log('No blob found - index.html is clean');
}
