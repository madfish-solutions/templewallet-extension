const { exec } = require('child_process');

const ignoredAdvisories = new Map([
  [
    'GHSA-mh99-v99m-4gvg',
    'Only legacy brace-expansion v1/v2 instances used by build tooling remain; v5 is pinned to the patched release.'
  ]
]);

const formatAdvisory = advisory => {
  const details = Object.entries(advisory.children).map(([name, value]) => {
    const formattedValue = Array.isArray(value) ? value.join(', ') : value;

    return `  ${name}: ${formattedValue}`;
  });

  return [advisory.value, ...details].join('\n');
};

exec('yarn npm audit --recursive --severity high --json', (error, stdout, stderr) => {
  const advisories = stdout
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));

  const vulnerabilities = advisories.filter(advisory => {
    const advisoryId = advisory.children.URL.split('/').pop();
    const ignoreReason = ignoredAdvisories.get(advisoryId);

    if (!ignoreReason) {
      return true;
    }

    const versions = advisory.children['Tree Versions'];
    const onlyLegacyVersions = versions.every(version => /^[12]\./.test(version));

    if (!onlyLegacyVersions) {
      return true;
    }

    console.warn(`Ignoring ${advisoryId}: ${ignoreReason}`);
    return false;
  });

  if (vulnerabilities.length > 0) {
    console.error(vulnerabilities.map(formatAdvisory).join('\n\n'));
    throw new Error(`Audit failed with ${vulnerabilities.length} vulnerabilities`);
  }

  if (error && !stdout.trim()) {
    console.error(stderr);
    throw error;
  }
});
