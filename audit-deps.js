const { exec } = require('child_process');

exec('yarn npm audit --recursive --severity high', (error, stdout) => {
  if (error) {
    console.log(stdout);

    const countHigh = (stdout.match(/Severity:\s*high/g) || []).length;
    const countCritical = (stdout.match(/Severity:\s*critical/g) || []).length;
    const count = (countHigh ? Number(countHigh) : 0) + (countCritical ? Number(countCritical) : 0);

    throw new Error(`Audit failed with ${count} vulnerabilities`);
  }
});
