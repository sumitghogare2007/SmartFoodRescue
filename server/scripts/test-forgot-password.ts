import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import User from '../src/models/User';
import { maskEmail } from '../src/services/emailService';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SmartFoodRescue';

async function testForgotPasswordLifecycle() {
  console.log('====================================================');
  console.log('TESTING FORGOT PASSWORD & RESET PASSWORD LIFECYCLE');
  console.log('====================================================');

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected successfully');

  const testEmail = 'pwdtest_user@smartfoodrescue.org';
  const initialPassword = 'InitialPassword123!';
  const newPassword = 'BrandNewPassword456!';

  // Clean up any existing test user
  await User.deleteOne({ email: testEmail });

  // Create test user
  const user = new User({
    name: 'Password Test User',
    email: testEmail,
    phone: '9876543210',
    passwordHash: initialPassword,
    userType: 'DONOR'
  });
  await user.save();
  console.log(`[Setup] Created test user with email: ${maskEmail(testEmail)}`);

  // Verify initial login password works
  const initialMatch = await user.comparePassword(initialPassword);
  console.log(`[Check 1] Initial password compare valid: ${initialMatch}`);
  if (!initialMatch) throw new Error('Initial password comparison failed');

  // TEST CASE 1: Non-existent email request
  const nonExistentEmail = 'nobody_exists_xyz@smartfoodrescue.org';
  const nonExistentUser = await User.findOne({ email: nonExistentEmail });
  console.log(`[Check 2] Non-existent email lookup returns null: ${nonExistentUser === null}`);
  if (nonExistentUser !== null) throw new Error('Expected non-existent user to be null');

  // TEST CASE 2: Existing email token generation
  const foundUser = await User.findOne({ email: testEmail });
  if (!foundUser) throw new Error('Test user not found');

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  foundUser.passwordResetTokenHash = tokenHash;
  foundUser.passwordResetExpires = expiresAt;
  await foundUser.save();

  console.log(`[Check 3] Token hash stored in DB: ${tokenHash.slice(0, 10)}... (Length: ${tokenHash.length})`);
  console.log(`[Check 4] Token expires at: ${expiresAt.toISOString()} (in ~30m)`);
  if (tokenHash.length !== 64) throw new Error('Token hash must be a 64-character SHA-256 string');

  // Verify raw token is NOT in database
  const rawTokenCheck = await User.findOne({ passwordResetTokenHash: rawToken });
  console.log(`[Check 5] Raw token is NOT stored in DB: ${rawTokenCheck === null}`);
  if (rawTokenCheck !== null) throw new Error('Security violation: Raw token must never be stored in DB');

  // TEST CASE 3: Reset password with INVALID token
  const wrongToken = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
  const wrongTokenHash = crypto.createHash('sha256').update(wrongToken).digest('hex');
  const invalidUserMatch = await User.findOne({
    passwordResetTokenHash: wrongTokenHash,
    passwordResetExpires: { $gt: new Date() }
  });
  console.log(`[Check 6] Invalid token lookup rejected: ${invalidUserMatch === null}`);
  if (invalidUserMatch !== null) throw new Error('Invalid token should not match any user');

  // TEST CASE 4: Reset password with EXPIRED token
  foundUser.passwordResetExpires = new Date(Date.now() - 1000); // 1 sec in past
  await foundUser.save();
  const expiredUserMatch = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() }
  });
  console.log(`[Check 7] Expired token lookup rejected: ${expiredUserMatch === null}`);
  if (expiredUserMatch !== null) throw new Error('Expired token should not match');

  // Restore valid expiry for successful reset test
  foundUser.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await foundUser.save();

  // TEST CASE 5: Successful Password Reset
  const validUser = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() }
  });
  if (!validUser) throw new Error('Valid user lookup failed');

  // Update password and clear reset fields with null
  validUser.passwordHash = newPassword;
  validUser.passwordResetTokenHash = null;
  validUser.passwordResetExpires = null;
  await validUser.save();

  console.log('[Check 8] Password reset updated in DB');

  // Reload user from DB and verify
  const updatedUser = await User.findById(validUser._id);
  if (!updatedUser) throw new Error('Failed to reload updated user');

  console.log(`[Check 9] passwordResetTokenHash is null: ${updatedUser.passwordResetTokenHash === null}`);
  console.log(`[Check 10] passwordResetExpires is null: ${updatedUser.passwordResetExpires === null}`);
  if (updatedUser.passwordResetTokenHash !== null || updatedUser.passwordResetExpires !== null) {
    throw new Error('Reset fields were not cleared with null');
  }

  const oldPasswordWorks = await updatedUser.comparePassword(initialPassword);
  console.log(`[Check 11] Old password no longer works: ${!oldPasswordWorks}`);
  if (oldPasswordWorks) throw new Error('Old password should no longer work');

  const newPasswordWorks = await updatedUser.comparePassword(newPassword);
  console.log(`[Check 12] New password successfully works: ${newPasswordWorks}`);
  if (!newPasswordWorks) throw new Error('New password does not work with comparePassword');

  // TEST CASE 6: Token Reuse Prevention
  const reusedMatch = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() }
  });
  console.log(`[Check 13] Token cannot be reused (one-time use): ${reusedMatch === null}`);
  if (reusedMatch !== null) throw new Error('Token reuse vulnerability detected');

  // Clean up test user
  await User.deleteOne({ email: testEmail });
  console.log('[Cleanup] Test user removed successfully');

  await mongoose.disconnect();
  console.log('====================================================');
  console.log('ALL FORGOT / RESET PASSWORD CHECKS PASSED PERFECTLY!');
  console.log('====================================================');
}

testForgotPasswordLifecycle().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
