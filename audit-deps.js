const { exec } = require('child_process');

/** TODO: Discard ASAP */
const advisoryException = 'https://www.npmjs.com/advisories/1100223';

exec('yarn audit --level high', (error, stdout, stderr) => {
  if (error) {
    console.log(stdout);

    const unescapedStdout = stdout.replace(/\x1B\[\d+m/g, '');
    const vunerabilitiesTablesBodies = Array.from(unescapedStdout.matchAll(/┌.+┐\n([^└]+)\n└/g)).map(match => match[1]);
    const vunerabilitiesTraits = vunerabilitiesTablesBodies.map(body => {
      console.log(JSON.stringify(body));
      const tableRows = body
        .split(/\n*├─+┼─+┤\n*/g)
        .filter(row => row)
        .map(row => {
          const cellsParts = row
            .split('\n')
            .map(line => line.split('│').map(cellPart => cellPart.trim()).slice(1, -1));
          return cellsParts.slice(1).reduce(
            (acc, lineCellsParts) => {
              lineCellsParts.forEach((cellPart, index) => {
                if (cellPart) {
                  acc[index] = (acc[index] || '') + ' ' + cellPart;
                }
              });

              return acc;
            },
            cellsParts[0]
          )
        });

      return {
        advisory: tableRows.find(entry => entry[1].includes('https://www.npmjs.com/advisories'))?.[1],
        patchAvailable: tableRows.every(entry => !entry[1].includes('No patch available'))
      };
    });

    if (vunerabilitiesTraits.some(({ advisory, patchAvailable }) => advisory !== advisoryException && patchAvailable)) {
      throw new Error(`Audit failed with ${vunerabilitiesTablesBodies.length} vulnerabilities`);
    }
  }
});