import fs from 'fs';
const rawData = fs.readFileSync('available_models.json', 'utf16le');
const models = rawData.match(/models\/[^\" ]*image[^\" ]*/g);
if (models) {
  console.log([...new Set(models)].join('\n'));
} else {
  console.log("No image models found");
}
