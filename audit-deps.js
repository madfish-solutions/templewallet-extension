const { exec } = require('child_process');

/** TODO: Discard ASAP */
const exception = 'https://www.npmjs.com/advisories/1098582';

exec('yarn audit --level high', (error, stdout, stderr) => {
  if (error) {
    console.log(stdout);

    if (stdout.includes('High') || stdout.includes('Critical')) {
      const countHigh = stdout.match(/Severity: .* (\d+) High/)?.[1];
      const countCritical = stdout.match(/Severity: .* (\d+) Critical/)?.[1];
      const count = (countHigh ? Number(countHigh) : 0) + (countCritical ? Number(countCritical) : 0);

      if (
        exception
        && countSubstrings(stdout, exception) === count
        && countSubstrings(stdout, 'No patch available') === count
      ) return;

      throw new Error(`Audit failed with ${count} vulnerabilities`);
    }
  }
});

function countSubstrings(str, substr) {
  const match = str.match( new RegExp(substr, 'g') );

  return match?.length ?? 0;
}
