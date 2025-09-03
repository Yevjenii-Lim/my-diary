// Test script to verify the encryption fix
require('dotenv').config({ path: '.env.local' });

const { encryptDiaryEntry, decryptDiaryEntry } = require('../src/lib/encryption.ts');

function testEncryptionFix() {
  console.log('🔐 Testing Encryption Fix...\n');

  try {
    const testUserId = 'test-user-123';
    const testUserSecret = 'test-secret-456';
    const testTitle = 'My Test Entry';
    const testContent = 'This is a test diary entry to verify encryption is working.';

    console.log('📝 Test Data:');
    console.log('   User ID:', testUserId);
    console.log('   Title:', testTitle);
    console.log('   Content:', testContent.substring(0, 50) + '...\n');

    // Step 1: Encrypt the entry
    console.log('🔒 Step 1: Encrypting Entry...');
    const { encryptedContent, encryptedTitle } = encryptDiaryEntry(
      testContent,
      testTitle,
      testUserId,
      testUserSecret
    );
    
    console.log('✅ Entry encrypted successfully');
    console.log('   Encrypted title length:', encryptedTitle.encrypted.length);
    console.log('   Encrypted content length:', encryptedContent.encrypted.length);
    console.log('   Title salt:', encryptedTitle.salt.substring(0, 16) + '...');
    console.log('   Content salt:', encryptedContent.salt.substring(0, 16) + '...\n');

    // Step 2: Decrypt the entry
    console.log('🔓 Step 2: Decrypting Entry...');
    const decrypted = decryptDiaryEntry(
      encryptedContent,
      encryptedTitle,
      testUserId,
      testUserSecret
    );
    
    console.log('✅ Entry decrypted successfully');
    console.log('   Decrypted title:', decrypted.title);
    console.log('   Decrypted content:', decrypted.content.substring(0, 50) + '...\n');

    // Step 3: Verify data integrity
    console.log('✅ Step 3: Verifying Data Integrity...');
    
    if (decrypted.title === testTitle && decrypted.content === testContent) {
      console.log('✅ Data integrity verified - encryption/decryption working perfectly!');
    } else {
      console.log('❌ Data integrity check failed');
      console.log('   Expected title:', testTitle);
      console.log('   Got title:', decrypted.title);
      console.log('   Expected content:', testContent);
      console.log('   Got content:', decrypted.content);
      return;
    }

    // Step 4: Test consistency (same input should produce same salt)
    console.log('\n🔄 Step 4: Testing Salt Consistency...');
    
    const { encryptedContent: encryptedContent2, encryptedTitle: encryptedTitle2 } = encryptDiaryEntry(
      testContent,
      testTitle,
      testUserId,
      testUserSecret
    );
    
    if (encryptedTitle.salt === encryptedTitle2.salt && encryptedContent.salt === encryptedContent2.salt) {
      console.log('✅ Salt consistency verified - same user gets same salt');
    } else {
      console.log('❌ Salt consistency failed');
      console.log('   First title salt:', encryptedTitle.salt.substring(0, 16) + '...');
      console.log('   Second title salt:', encryptedTitle2.salt.substring(0, 16) + '...');
      return;
    }

    console.log('\n🎉 ENCRYPTION FIX TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ Encryption is working correctly');
    console.log('✅ Decryption is working correctly');
    console.log('✅ Salt consistency is maintained');
    console.log('✅ Data integrity is preserved');
    console.log('\n🚀 The 500 error should now be resolved!');

  } catch (error) {
    console.error('❌ Encryption fix test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEncryptionFix();

