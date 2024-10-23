const { exec } = require('child_process');

exec('yarn audit --level high', (error, stdout, stderr) => {
  if (error) {
    console.log(stdout);

    const tooSevereVunerabilitiesCount = [/(\d+) High/, /(\d+) Critical/]
      .map(regex => {
        const match = regex.exec(stdout);

        return match ? parseInt(match[1]) : 0;
      })
      .reduce((a, b) => a + b, 0);
    const tooSevereTypesVunerabilitiesCount = Array
      .from(stdout.matchAll(/Dependency of\s+(\x1B\[90m)?│(\x1B\[39m)?\s+@types/g))
      .length;

    if (tooSevereVunerabilitiesCount - tooSevereTypesVunerabilitiesCount > 0) {
      throw new Error('Audit failed');
    }
  }
});
