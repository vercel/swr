const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const semver = require('semver');

const packageJsonPath = path.join(__dirname, '../package.json');
const { version } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const { RELEASE_TYPE = 'beta', SEMVER_TYPE, DRY_RUN } = process.env;

const bumpVersion = (version) => {
  const cmd = `npm version ${version}`;
  if (DRY_RUN) {
    console.log(cmd);
  } else {
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to execute npm version:', error);
      process.exit(1);
    }
  }
};

const updateVersion = () => {
  if (RELEASE_TYPE === 'beta') {
    return semver.inc(version, semver.prerelease(version) ? 'prerelease' : `pre${SEMVER_TYPE}`, 'beta');
  } else if (RELEASE_TYPE === 'stable') {
    if (!SEMVER_TYPE) {
      console.error('Missing semver type. Expected "patch", "minor", or "major".');
      process.exit(1);
    }
    return semver.inc(version, SEMVER_TYPE);
  } else {
    console.error('Invalid release type. Expected "beta" or "stable".');
    process.exit(1);
  }
};

bumpVersion(updateVersion());