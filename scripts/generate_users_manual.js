// Delegator to docs/build_manual_pdf.js for unified manual generation
const path = require('path');
const { execSync } = require('child_process');

console.log('Running unified G-TRAMS Deliverable #7 User Manual generation...');
const buildScript = path.join(__dirname, '..', 'docs', 'build_manual_pdf.js');
execSync(`node "${buildScript}"`, { stdio: 'inherit' });
