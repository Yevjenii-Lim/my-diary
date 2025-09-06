import { NextRequest, NextResponse } from 'next/server';
import { deleteUser, deleteUserTopics } from '@/lib/dynamodb';
import { deleteUserEntries } from '@/lib/dynamodb-encrypted';
import { deleteCognitoUser } from '@/lib/cognito';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    console.log(`🗑️ API: Deleting user and all data for userId: ${userId}`);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Step 1: Delete all user entries from DynamoDB
    console.log('📝 Step 1: Deleting user entries...');
    await deleteUserEntries(userId);

    // Step 2: Delete all user topics from DynamoDB
    console.log('📚 Step 2: Deleting user topics...');
    await deleteUserTopics(userId);

    // Step 3: Delete user from DynamoDB
    console.log('👤 Step 3: Deleting user from DynamoDB...');
    await deleteUser(userId);

    // Step 4: Delete user from Cognito (only for Cognito users, not Google OAuth users)
    if (!userId.startsWith('google_')) {
      console.log('🔐 Step 4: Deleting user from Cognito...');
      await deleteCognitoUser(userId);
    } else {
      console.log('🔐 Step 4: Skipping Cognito deletion for Google OAuth user...');
    }

    console.log(`✅ API: Successfully deleted user ${userId} and all associated data`);
    
    return NextResponse.json({ 
      message: 'User and all associated data deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('❌ API: Error deleting user:', error);
    return NextResponse.json({ 
      error: 'Failed to delete user' 
    }, { status: 500 });
  }
}


