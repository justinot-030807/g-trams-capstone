// Delegator to docs/build_manual_pdf.js
const path = require('path');
const { execSync } = require('child_process');

console.log('Running unified G-TRAMS Deliverable #7 User Manual generation...');
const buildScript = path.join(__dirname, 'build_manual_pdf.js');
execSync(`node "${buildScript}"`, { stdio: 'inherit' });
