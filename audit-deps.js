const { exec } = require('child_process');

exec('yarn audit --level high', (error, stdout, stderr) => {
  if (error) {
    console.log(stdout);

    if (stdout.includes('High') || stdout.includes('Critical')) {
      const countHighString = stdout.match(/Severity: .* (\d+) High/)?.[1];
      const countCriticalString = stdout.match(/Severity: .* (\d+) Critical/)?.[1];

      const countHigh = countHighString ? Number(countHighString) : 0;
      const countCritical = countCriticalString ? Number(countCriticalString) : 0;
      const count = countHigh + countCritical;

      // TODO: Remove this after eslint will be updated to v10
      if (stdout.includes('minimatch') && countCritical === 0) return;

      throw new Error(`Audit failed with ${count} vulnerabilities`);
    }
  }
});
