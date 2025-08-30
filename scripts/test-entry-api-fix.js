// Test script to verify entry API fix
require('dotenv').config({ path: '.env.local' });

async function testEntryApiFix() {
  console.log('🧪 Testing Entry API Fix...\n');

  const userId = '34d864b8-40c1-709c-5019-07bba93a5ec5';
  const topicId = 'creative-writing-1756423622315';
  const entryId = `${topicId}-${Date.now()}`;
  const fullCompositeId = `${userId}-${entryId}`;

  console.log('📋 Test Data:');
  console.log(`   User ID: ${userId}`);
  console.log(`   Topic ID: ${topicId}`);
  console.log(`   Entry ID: ${entryId}`);
  console.log(`   Full Composite ID: ${fullCompositeId}\n`);

  try {
    // Test 1: Create a new entry
    console.log('1️⃣ Creating a new entry...');
    const createResponse = await fetch('http://localhost:3000/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        topicId: topicId,
        title: 'Test Entry for API Fix',
        content: 'This is a test entry to verify the API fix works correctly.',
      }),
    });

    if (createResponse.ok) {
      const createdEntry = await createResponse.json();
      console.log('   ✅ Entry created successfully');
      console.log(`   Entry ID: ${createdEntry.entry.id}`);
      console.log(`   Title: ${createdEntry.entry.title}`);
    } else {
      console.log('   ❌ Failed to create entry');
      const error = await createResponse.text();
      console.log(`   Error: ${error}`);
      return;
    }

    // Test 2: Get the entry using the API
    console.log('\n2️⃣ Getting the entry...');
    const getResponse = await fetch(`http://localhost:3000/api/entries/${fullCompositeId}?userId=${userId}`, {
      method: 'GET',
    });

    if (getResponse.ok) {
      const entryData = await getResponse.json();
      console.log('   ✅ Entry retrieved successfully');
      console.log(`   Title: ${entryData.entry.title}`);
      console.log(`   Content: ${entryData.entry.content.substring(0, 50)}...`);
    } else {
      console.log('   ❌ Failed to get entry');
      const error = await getResponse.text();
      console.log(`   Error: ${error}`);
    }

    // Test 3: Update the entry
    console.log('\n3️⃣ Updating the entry...');
    const updateResponse = await fetch(`http://localhost:3000/api/entries/${fullCompositeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        title: 'Updated Test Entry',
        content: 'This entry has been updated to test the API fix.',
      }),
    });

    if (updateResponse.ok) {
      const updatedEntry = await updateResponse.json();
      console.log('   ✅ Entry updated successfully');
      console.log(`   New Title: ${updatedEntry.entry.title}`);
      console.log(`   New Content: ${updatedEntry.entry.content.substring(0, 50)}...`);
    } else {
      console.log('   ❌ Failed to update entry');
      const error = await updateResponse.text();
      console.log(`   Error: ${error}`);
    }

    // Test 4: Delete the entry
    console.log('\n4️⃣ Deleting the entry...');
    const deleteResponse = await fetch(`http://localhost:3000/api/entries/${fullCompositeId}?userId=${userId}`, {
      method: 'DELETE',
    });

    if (deleteResponse.ok) {
      const deleteResult = await deleteResponse.json();
      console.log('   ✅ Entry deleted successfully');
      console.log(`   Deleted Entry ID: ${deleteResult.deletedEntryId}`);
    } else {
      console.log('   ❌ Failed to delete entry');
      const error = await deleteResponse.text();
      console.log(`   Error: ${error}`);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testEntryApiFix();
