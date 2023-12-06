const { exec } = require('child_process');

(() => {
  exec('yarn audit --level high', (error, stdout, stderr) => {
    if (error) {
      console.log(stdout);

      for (const line of stdout.split('\n')) {
        if (line.includes('High') || line.includes('Critical')) {
          throw new Error('Audit failed');
        }
      }
    }
  });
})();
