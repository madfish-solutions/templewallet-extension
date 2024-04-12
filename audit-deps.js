const { exec } = require('child_process');

const ignoreList = ['protobufjs'];
const vunerablePackageLineRegex = /^[^\s]+\s+Package\s+[^\s]+\s+([^\s]+)\s+[^\s]+$/;

exec('yarn audit --level high', (error, stdout, stderr) => {
  if (error) {
    console.log(stdout);

    if (stdout.includes('High') || stdout.includes('Critical')) {
      const lines = stdout.split('\n');
      const vunerablePackages = new Set(
        lines
          .filter((line) => vunerablePackageLineRegex.test(line))
          .map((line) => vunerablePackageLineRegex.exec(line)[1])
          .filter((packageName) => !ignoreList.includes(packageName))
      );
      if (vunerablePackages.size > 0) {
        throw new Error('Audit failed');
      }
    }
  }
});
