import fs from 'fs';
const rawData = fs.readFileSync('available_models.json', 'utf16le');
// Find the first '{' and last '}' to strip any garbage
const start = rawData.indexOf('{');
const end = rawData.lastIndexOf('}');
const cleanJson = rawData.substring(start, end + 1);
const data = JSON.parse(cleanJson);
console.log(data.models.map(m => m.name).filter(n => n.includes('imagen')));
