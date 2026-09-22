const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function run() {
  console.log('======================================================');
  console.log('TESTING FORGOT PASSWORD & RESET PASSWORD LIFECYCLE');
  console.log('======================================================\n');

  // Test 1: Non-existent email -> 404
  console.log('[Test 1] Requesting forgot-password for non-existent email...');
  const res1 = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent_test_account@example.com' })
  });
  console.log('  Status: ' + res1.status + ' (Expected: 404)');
  const data1 = await res1.json();
  if (res1.status !== 404) {
    throw new Error('Expected 404, got ' + res1.status);
  }
  console.log('  Passed: ' + data1.message + '\n');

  // Test 2: Existing email -> 200 with resetUrl and emailSent status
  console.log('[Test 2] Requesting forgot-password for registered donor...');
  const res2 = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'donor@smartfoodrescue.com' })
  });
  console.log('  Status: ' + res2.status + ' (Expected: 200)');
  const data2 = await res2.json();
  if (res2.status !== 200) {
    throw new Error('Expected 200, got ' + res2.status);
  }
  if (!data2.resetUrl) {
    throw new Error('Expected resetUrl in response in dev mode');
  }
  console.log('  Passed: resetUrl generated -> ' + data2.resetUrl);
  console.log('  Email delivery attempted: emailSent = ' + data2.emailSent + '\n');

  const url = new URL(data2.resetUrl);
  const token = url.searchParams.get('token');
  if (!token) {
    throw new Error('Token query parameter missing from resetUrl');
  }

  // Test 3: Reset password using the token
  console.log('[Test 3] Submitting new password with the generated token...');
  const testNewPassword = 'Donor@Verified123';
  const res3 = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      newPassword: testNewPassword,
      confirmPassword: testNewPassword
    })
  });
  console.log('  Status: ' + res3.status + ' (Expected: 200)');
  const data3 = await res3.json();
  if (res3.status !== 200) {
    throw new Error('Expected 200, got ' + res3.status + ': ' + JSON.stringify(data3));
  }
  console.log('  Passed: ' + data3.message + '\n');

  // Test 4: Token should now be invalidated (single-use)
  console.log('[Test 4] Attempting to reuse the same token...');
  const res4 = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      newPassword: 'AnotherPassword@123',
      confirmPassword: 'AnotherPassword@123'
    })
  });
  console.log('  Status: ' + res4.status + ' (Expected: 400)');
  if (res4.status !== 400) {
    throw new Error('Expected 400 on reused token, got ' + res4.status);
  }
  console.log('  Passed: Token single-use enforcement verified.\n');

  // Test 5: Verify login with new password
  console.log('[Test 5] Logging in with updated password...');
  const res5 = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'donor@smartfoodrescue.com',
      password: testNewPassword
    })
  });
  const data5 = await res5.json();
  if (!data5.token) {
    throw new Error('Login failed with new password');
  }
  console.log('  Passed: Logged in successfully as ' + data5.user.name + ' (' + data5.user.userType + ')\n');

  // Test 6: Revert back to original password Donor@123
  console.log('[Test 6] Reverting back to seed password (Donor@123)...');
  const resForgot = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'donor@smartfoodrescue.com' })
  });
  const forgotData = await resForgot.json();
  const resetToken = new URL(forgotData.resetUrl).searchParams.get('token');
  const resReset = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: resetToken,
      newPassword: 'Donor@123',
      confirmPassword: 'Donor@123'
    })
  });
  if (resReset.status !== 200) {
    throw new Error('Failed to revert password to default');
  }
  console.log('  Reverted donor password to Donor@123\n');

  console.log('======================================================');
  console.log('ALL FORGOT PASSWORD TESTS COMPLETED SUCCESSFULLY! (100%)');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
