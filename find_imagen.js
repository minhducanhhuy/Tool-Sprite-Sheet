import fs from 'fs';
const rawData = fs.readFileSync('available_models.json', 'utf16le');
const regex = /"name":\s*"models\/(imagen-[^"]+)"/g;
let match;
const models = [];
while ((match = regex.exec(rawData)) !== null) {
  models.push(match[1]);
}
console.log(models);
