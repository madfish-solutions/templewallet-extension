const { exec } = require('child_process');

exec('yarn audit --level high', (error, stdout, stderr) => {
  if (error) {
    console.log(stdout);

    if (stdout.includes('High') || stdout.includes('Critical')) {
      throw new Error('Audit failed');
    }
  }
});
