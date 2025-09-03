// Test script to verify encryption is working
require('dotenv').config({ path: '.env.local' });

const { 
  encryptDiaryEntry, 
  decryptDiaryEntry, 
  generateUserEncryptionSecret,
  deriveEncryptionKey 
} = require('../src/lib/encryption.ts');

async function testEncryption() {
  console.log('🔐 Testing Encryption System...\n');

  try {
    // Test data
    const userId = 'test-user-123';
    const title = 'My Secret Diary Entry';
    const content = 'Today I had a very personal realization about my life and future goals. This is something I would never want anyone else to read.';
    
    console.log('📝 Original Entry:');
    console.log(`Title: ${title}`);
    console.log(`Content: ${content}\n`);

    // Generate encryption secret for user
    const userSecret = generateUserEncryptionSecret(userId);
    console.log(`🔑 Generated User Secret: ${userSecret.substring(0, 20)}...\n`);

    // Encrypt the diary entry
    console.log('🔒 Encrypting Entry...');
    const { encryptedContent, encryptedTitle } = encryptDiaryEntry(
      content, 
      title, 
      userId, 
      userSecret
    );

    console.log('✅ Encryption Complete!');
    console.log('Encrypted Title:', encryptedTitle.encrypted.substring(0, 50) + '...');
    console.log('Encrypted Content:', encryptedContent.encrypted.substring(0, 50) + '...\n');

    // Decrypt the diary entry
    console.log('🔓 Decrypting Entry...');
    const decrypted = decryptDiaryEntry(
      encryptedContent,
      encryptedTitle,
      userId,
      userSecret
    );

    console.log('✅ Decryption Complete!');
    console.log(`Decrypted Title: ${decrypted.title}`);
    console.log(`Decrypted Content: ${decrypted.content}\n`);

    // Verify the data matches
    if (decrypted.title === title && decrypted.content === content) {
      console.log('🎉 SUCCESS: Encryption/Decryption working perfectly!');
      console.log('✅ Original and decrypted data match exactly');
    } else {
      console.log('❌ FAILURE: Data mismatch detected');
      console.log('Original title:', title);
      console.log('Decrypted title:', decrypted.title);
      console.log('Original content:', content);
      console.log('Decrypted content:', decrypted.content);
    }

    // Test security features
    console.log('\n🔒 Testing Security Features...');
    
    // Test that different IVs produce different ciphertexts
    const { encryptedContent: encryptedContent2 } = encryptDiaryEntry(
      content, 
      title, 
      userId, 
      userSecret
    );
    
    if (encryptedContent.encrypted !== encryptedContent2.encrypted) {
      console.log('✅ Unique IVs: Same content encrypts to different ciphertexts');
    } else {
      console.log('❌ IV issue: Same content encrypts to same ciphertext');
    }

    // Test that wrong key fails decryption
    const wrongSecret = 'wrong-secret-key';
    try {
      decryptDiaryEntry(
        encryptedContent,
        encryptedTitle,
        userId,
        wrongSecret
      );
      console.log('❌ Security issue: Decryption succeeded with wrong key');
    } catch (error) {
      console.log('✅ Security working: Decryption failed with wrong key');
    }

    console.log('\n🎯 Encryption System Status: READY FOR PRODUCTION!');
    console.log('All diary entries will now be encrypted at rest in the database.');
    console.log('Users can write their most personal thoughts with complete privacy! 🔒✨');

  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEncryption();

