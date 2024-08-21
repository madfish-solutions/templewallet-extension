const { exec } = require('child_process');

exec('yarn audit --level high', (error, stdout, stderr) => {
  if (error) {
    console.log(stdout);

    if (stdout.includes('High') || stdout.includes('Critical')) {
      const countHigh = stdout.match(/Severity: .* (\d+) High/)?.[1];
      const countCritical = stdout.match(/Severity: .* (\d+) Critical/)?.[1];
      const count = (countHigh ? Number(countHigh) : 0) + (countCritical ? Number(countCritical) : 0);

      throw new Error(`Audit failed with ${count} vulnerabilities`);
    }
  }
});
