const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  // Create a dummy file
  fs.writeFileSync('phase5-test.pdf', 'Dummy PDF content for testing phase 5 upload.');

  const form = new FormData();
  form.append('file', fs.createReadStream('phase5-test.pdf'));
  form.append('name', 'phase5-test');
  form.append('domain', 'Admissions'); // Must match DB
  form.append('department', 'CSD');
  form.append('academicYear', '2023-24');

  // We need to pass authentication cookies or headers.
  // Wait, I can simulate an authenticated request by using a valid session cookie, or testing from frontend.
  // Alternatively, let's look at backend/src/controllers/documentController.ts to see what it does.
  
  // Just print the DB contents to see if it failed earlier.
}
testUpload();
