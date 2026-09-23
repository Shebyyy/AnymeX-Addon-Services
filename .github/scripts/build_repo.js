const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '..', '..', 'services');
const addonsFilePath = path.join(__dirname, '..', '..', 'addons.json');

const repo = process.env.GITHUB_REPOSITORY || 'Shebyyy/AnymeX-Addon-Services';
const branch = process.env.GITHUB_REF_NAME || 'main';

const files = fs.readdirSync(servicesDir).sort();
const addons = [];

for (const file of files) {
  if (!file.endsWith('.json')) continue;
  if (file.toLowerCase().includes('example')) {
    console.log(`Skipping example file: ${file}`);
    continue;
  }

  const filePath = path.join(servicesDir, file);
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!content.id || !content.name || !content.version) {
      console.warn(`Warning: ${file} is missing id, name, or version. Skipping.`);
      continue;
    }

    const item = {
      id: content.id,
      name: content.name,
      version: content.version,
      author: content.author || 'Sheby',
      description: content.description || '',
      icon: content.icon || '',
      color: content.color || '#FD6585',
      capabilities: content.capabilities || [],
      auth_type: (content.auth && content.auth.type) || content.auth_type || 'none',
      manifest_url: `https://raw.githubusercontent.com/${repo}/${branch}/services/${file}`
    };

    if (content.author_avatar) {
      item.author_avatar = content.author_avatar;
    }

    addons.push(item);
    console.log(`Indexed addon: ${content.name} (v${content.version}) by ${item.author}`);
  } catch (err) {
    console.error(`Error parsing ${file}:`, err.message);
    process.exit(1);
  }
}

let existing = {};
if (fs.existsSync(addonsFilePath)) {
  try {
    existing = JSON.parse(fs.readFileSync(addonsFilePath, 'utf8'));
  } catch (e) {
    console.warn('Could not parse existing addons.json, using defaults.');
  }
}

const updated = {
  name: existing.name || 'AnymeX Official Addon Services',
  version: existing.version || 1,
  description: existing.description || 'Community tracking and metadata services repository for AnymeX',
  addons: addons
};

fs.writeFileSync(addonsFilePath, JSON.stringify(updated, null, 2) + '\n');
console.log(`Successfully generated addons.json with ${addons.length} addons.`);
