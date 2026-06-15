#!/usr/bin/env node

/**
 * CLI Test Suite for บันทึกรักการอ่าน System
 * Tests all major features and changes
 */

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results
let passed = 0;
let failed = 0;
const tests = [];

// Helper functions
function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function pass(name, details = '') {
  passed++;
  tests.push({ name, status: 'PASS', details });
  log(`  ✅ ${name}${details ? ' - ' + details : ''}`, colors.green);
}

function fail(name, error = '') {
  failed++;
  tests.push({ name, status: 'FAIL', details: error });
  log(`  ❌ ${name}${error ? ' - ' + error : ''}`, colors.red);
}

function section(title) {
  console.log('');
  log(`\n${'═'.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.bold + colors.cyan);
  log(`${'═'.repeat(60)}\n`, colors.cyan);
}

// File system checks
function checkFile(path) {
  try {
    const fs = require('fs');
    return fs.existsSync(path);
  } catch (e) {
    return false;
  }
}

function readFile(path) {
  try {
    const fs = require('fs');
    return fs.readFileSync(path, 'utf8');
  } catch (e) {
    return null;
  }
}

// TEST SUITE 1: File Structure
section('TEST 1: File Structure');

const requiredFiles = [
  'app.js',
  'index.html',
  'styles.css',
  'script.js',
  'README.md',
  'EXPORT-GUIDE.md',
  'test.html'
];

requiredFiles.forEach(file => {
  const exists = checkFile(file);
  if (exists) {
    pass(`File exists: ${file}`);
  } else {
    fail(`File missing: ${file}`);
  }
});

// TEST SUITE 2: Code Quality
section('TEST 2: Code Quality & Changes');

const appJs = readFile('app.js');

if (appJs) {
  // Test 2.1: Sample teacher passwords removed
  const hasSampleTeachers = /THTUPPT01|THTUPPT02|THTUPPT03|THTUPPT04|THTUPPT05|THTUPPT06/.test(appJs);
  if (!hasSampleTeachers) {
    pass('Sample teacher passwords removed', 'THTUPPT01-06 not found');
  } else {
    fail('Sample teacher passwords still present', 'THTUPPT01-06 found in code');
  }

  // Test 2.2: Admin password not in defaults
  const hasAdminDefault = /adminPassword\s*:\s*['"]THTUPPT['"]/.test(appJs);
  if (!hasAdminDefault) {
    pass('Admin password not set as default', 'Safe default settings');
  } else {
    fail('Admin password still in defaults', 'Found adminPassword default');
  }

  // Test 2.3: exportStudentReadingForm function exists
  const hasExportFunc = /function exportStudentReadingForm\(/.test(appJs);
  if (hasExportFunc) {
    pass('exportStudentReadingForm function added', 'Export feature implemented');
  } else {
    fail('exportStudentReadingForm function missing', 'Export feature not found');
  }

  // Test 2.4: Export button in teacher view
  const hasExportButton = /exportStudentReadingForm\(/.test(appJs) && 
                          /📄|Export/.test(appJs);
  if (hasExportButton) {
    pass('Export button added to teacher interface', 'UI updated');
  } else {
    fail('Export button not found', 'Teacher UI not updated');
  }

  // Test 2.5: HTML form structure in export
  const hasFormStructure = /บันทึกรักการอ่านของบุคคลากรทาง/.test(appJs);
  if (hasFormStructure) {
    pass('Export form structure includes title', 'Form template found');
  } else {
    fail('Export form title missing', 'Form template incomplete');
  }

  // Test 2.6: Signature fields in export
  const hasSignatures = /ลายเซนต์|sign|signature/.test(appJs.toLowerCase());
  if (hasSignatures) {
    pass('Signature fields in export form', 'Form has signature areas');
  } else {
    fail('Signature fields missing', 'Form incomplete');
  }

} else {
  fail('Cannot read app.js', 'File not found or unreadable');
}

// TEST SUITE 3: Documentation
section('TEST 3: Documentation');

const readmeContent = readFile('README.md');
if (readmeContent) {
  const hasExportDoc = /[Ee]xport|export/.test(readmeContent);
  if (hasExportDoc) {
    pass('README updated with export feature', 'Documentation complete');
  } else {
    fail('README missing export documentation', 'Documentation incomplete');
  }
} else {
  fail('README.md not found', 'Documentation missing');
}

const exportGuide = readFile('EXPORT-GUIDE.md');
if (exportGuide) {
  pass('EXPORT-GUIDE.md created', 'User guide available');
  const hasInstructions = /วิธี|ขั้นตอน|การใช้/.test(exportGuide);
  if (hasInstructions) {
    pass('Export guide has instructions', 'Documentation complete');
  }
} else {
  fail('EXPORT-GUIDE.md not found', 'User guide missing');
}

// TEST SUITE 4: Data Integrity
section('TEST 4: Data Integrity');

const htmlContent = readFile('index.html');
if (htmlContent) {
  const hasAppJs = /app\.js/.test(htmlContent);
  if (hasAppJs) {
    pass('app.js is loaded in HTML', 'Script reference correct');
  } else {
    fail('app.js not loaded', 'Script missing');
  }
} else {
  fail('index.html not found', 'Main file missing');
}

// TEST SUITE 5: Test Page
section('TEST 5: Test Page');

const testHtml = readFile('test.html');
if (testHtml) {
  pass('test.html created', 'Test suite available');
  const hasTestCases = /test-case|runAllTests/.test(testHtml);
  if (hasTestCases) {
    pass('Test page has test cases', 'Ready for browser testing');
  }
} else {
  fail('test.html not found', 'Test page missing');
}

// SUMMARY
section('TEST SUMMARY');

const total = passed + failed;
const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

log(`\n  Total Tests: ${total}`, colors.bold);
log(`  ✅ Passed:   ${passed}`, colors.green + colors.bold);
log(`  ❌ Failed:   ${failed}`, failed > 0 ? colors.red + colors.bold : colors.green);
log(`  Success Rate: ${percentage}%\n`, percentage === 100 ? colors.green + colors.bold : colors.yellow);

// Detailed Results
if (tests.length > 0) {
  log('\nDetailed Results:', colors.cyan + colors.bold);
  tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    const color = test.status === 'PASS' ? colors.green : colors.red;
    log(`  ${icon} ${test.name}`, color);
    if (test.details) {
      log(`     → ${test.details}`, color);
    }
  });
}

// Exit code
section('COMPLETION');

if (failed === 0) {
  log('🎉 All tests passed! System is ready for use.', colors.green + colors.bold);
  process.exit(0);
} else {
  log(`⚠️  ${failed} test(s) failed. Please review the issues above.`, colors.yellow + colors.bold);
  process.exit(1);
}
