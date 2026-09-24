const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const servicesDir = path.join(__dirname, '..', '..', 'services');
const addonsFilePath = path.join(__dirname, '..', '..', 'addons.json');

const repo = process.env.GITHUB_REPOSITORY || 'Shebyyy/AnymeX-Addon-Services';
const branch = process.env.GITHUB_REF_NAME || 'main';

function bumpPatch(version) {
  if (!version || typeof version !== 'string') return '1.0.0';
  const parts = version.split('.').map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  return parts.join('.');
}

function stripVersion(obj) {
  const copy = { ...obj };
  delete copy.version;
  return JSON.stringify(copy);
}

function getPreviousServiceManifest(relPath) {
  try {
    const status = execSync(`git status --porcelain -- "${relPath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    let commitToCompare = 'HEAD';
    if (!status) {
      const prevHash = execSync(`git log -n 1 --skip=1 --pretty=format:%H -- "${relPath}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();
      if (!prevHash) return null;
      commitToCompare = prevHash;
    }

    const raw = execSync(`git show ${commitToCompare}:"${relPath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

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

    const previous = getPreviousServiceManifest(`services/${file}`);
    if (previous && previous.version) {
      const contentChanged = stripVersion(previous) !== stripVersion(content);
      const versionUnchanged = previous.version === content.version;

      if (contentChanged && versionUnchanged) {
        const oldVer = content.version;
        content.version = bumpPatch(oldVer);
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
        console.log(`Auto-bumped ${file}: v${oldVer} -> v${content.version} (changes detected without version bump)`);
      }
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
