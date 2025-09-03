import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUser } from '@/lib/dynamodb';
import { initializeUserEncryption } from '@/lib/encryption-keys';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, name } = body;

    if (!id || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: id, email, name' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUser(id);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Initialize encryption for the new user
    console.log(`🔐 Initializing encryption for new user: ${id}`);
    const encryptionSecret = await initializeUserEncryption(id);
    console.log(`✅ Encryption initialized for user: ${id}`);

    // Create the user
    const user = await createUser({
      id,
      email,
      name,
    });

    // Note: Users now start with empty topics list
    // They can add topics manually via the UI
    console.log(`✅ Created new user: ${name} (${id}) with empty topics list and encryption enabled`);

    return NextResponse.json(
      { 
        message: 'User created successfully with empty topics list and encryption enabled',
        user,
        encryptionStatus: 'initialized'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await getUser(id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
