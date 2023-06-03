const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const semver = require('semver')

const packageJsonPath = path.join(__dirname, '../package.json')
const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8')
const packageJson = JSON.parse(packageJsonData)

let version = packageJson.version
const releaseType = process.env.RELEASE_TYPE || 'beta'
const semverType = process.env.SEMVER_TYPE

function bumpVersion(version) {
  if (process.env.DRY_RUN) {
    console.log(`npm version ${version}`)
  } else {
    try {
      execSync(`npm version ${version}`, { stdio: 'inherit' })
    } catch (error) {
      console.error('Failed to execute npm version:', error)
      process.exit(1)
    }
  }
}

if (releaseType === 'beta') {
  if (semver.prerelease(version)) {
    version = semver.inc(version, 'prerelease')
  } else {
    version = semver.inc(version, 'prepatch', 'beta')
  }
} else if (releaseType === 'stable') {
  if (!semverType) {
    console.error('Missing semver type. Expected "patch", "minor" or "major".')
    process.exit(1)
  }
  version = semver.inc(version, semverType)
} else {
  console.error('Invalid release type. Expected "beta" or "stable".')
  process.exit(1)
}

bumpVersion(version)
