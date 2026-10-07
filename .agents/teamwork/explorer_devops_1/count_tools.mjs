import fs from 'fs';
const content = fs.readFileSync('website/src/lib/toolsData.ts', 'utf-8');
const zendevToolsMatch = content.match(/export const ZENDEV_TOOLS: ToolItem\[\] = \[([\s\S]*?)\];/);
if (zendevToolsMatch) {
  const toolIds = [...zendevToolsMatch[1].matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  console.log('Actual ZENDEV_TOOLS array count:', toolIds.length);
  console.log('Tool IDs:', toolIds);
} else {
  console.log('Could not find ZENDEV_TOOLS array');
}
