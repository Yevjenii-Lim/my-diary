import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, GetUserCommand, InitiateAuthCommand as RefreshTokenCommand } from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
});

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

export interface AuthResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

// Sign Up
export const signUp = async (email: string, password: string, name: string): Promise<AuthResult> => {
  try {
    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'name',
          Value: name,
        },
      ],
    });

    const result = await client.send(command);
    
    return {
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: result,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Confirm Sign Up
export const confirmSignUp = async (email: string, code: string): Promise<AuthResult> => {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    await client.send(command);
    
    return {
      success: true,
      message: 'Email confirmed successfully. You can now sign in.',
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to confirm sign up';
    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Sign In
export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    if (!CLIENT_ID) {
      console.error('❌ CLIENT_ID is missing');
      return {
        success: false,
        message: 'Cognito configuration error: Client ID is missing',
      };
    }

    const command = new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const result = await client.send(command);
    
    if (result.AuthenticationResult) {
      // Store tokens
      localStorage.setItem('accessToken', result.AuthenticationResult.AccessToken || '');
      localStorage.setItem('refreshToken', result.AuthenticationResult.RefreshToken || '');
      
      return {
        success: true,
        message: 'Signed in successfully',
        data: {
          accessToken: result.AuthenticationResult.AccessToken,
          refreshToken: result.AuthenticationResult.RefreshToken,
        },
      };
    } else {
      return {
        success: false,
        message: 'Authentication failed',
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const errorCode = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    
    console.error('❌ Sign in error:', error);
    console.error('❌ Error details:', {
      name: errorName,
      message: errorMessage,
      code: errorCode,
    });
    
    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Sign Out
export const signOut = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Get Current User
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return null;

    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const result = await client.send(command);
    
    if (result.UserAttributes) {
      const email = result.UserAttributes.find(attr => attr.Name === 'email')?.Value || '';
      const name = result.UserAttributes.find(attr => attr.Name === 'name')?.Value || '';
      const emailVerified = result.UserAttributes.find(attr => attr.Name === 'email_verified')?.Value === 'true';
      const sub = result.UserAttributes.find(attr => attr.Name === 'sub')?.Value || '';
      
      const user = {
        id: sub || result.Username || '',
        email,
        name,
        emailVerified,
      };
      
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Ensure user exists in DynamoDB
export const ensureUserInDatabase = async (cognitoUser: User): Promise<import('@/types/database').User> => {
  try {
    // First, try to get the user from DynamoDB
    const response = await fetch(`/api/users?id=${cognitoUser.id}`);
    
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    
    // If user doesn't exist in DynamoDB, create them
    if (response.status === 404) {
      const createResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: cognitoUser.id,
          email: cognitoUser.email,
          name: cognitoUser.name,
        }),
      });
      
      if (createResponse.ok) {
        const data = await createResponse.json();
        return data.user;
      } else {
        throw new Error('Failed to create user in DynamoDB');
      }
    }
    
    throw new Error('Failed to check user existence');
  } catch (error) {
    console.error('Error ensuring user in database:', error);
    throw error;
  }
};

// Forgot Password
export const forgotPassword = async (email: string): Promise<AuthResult> => {
  try {
    const command = new ForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email,
    });

    await client.send(command);
    
    return {
      success: true,
      message: 'Password reset code sent to your email',
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send password reset code';
    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Confirm Forgot Password
export const confirmForgotPassword = async (email: string, code: string, newPassword: string): Promise<AuthResult> => {
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await client.send(command);
    
    return {
      success: true,
      message: 'Password reset successfully',
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Resend Confirmation Code
export const resendConfirmationCode = async (email: string): Promise<AuthResult> => {
  try {
    const { ResendConfirmationCodeCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    
    const command = new ResendConfirmationCodeCommand({
      ClientId: CLIENT_ID,
      Username: email,
    });

    await client.send(command);
    
    return {
      success: true,
      message: 'Confirmation code resent successfully. Please check your email.',
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to resend confirmation code';
    return {
      success: false,
      message: errorMessage,
    };
  }
};

// Refresh Access Token
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {

      return false;
    }

    

    const command = new RefreshTokenCommand({
      ClientId: CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const result = await client.send(command);
    
    if (result.AuthenticationResult?.AccessToken) {
      localStorage.setItem('accessToken', result.AuthenticationResult.AccessToken);
      
      return true;
    }
    
    
    return false;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    console.error('❌ Error refreshing token:', errorMessage);
    
    // Clear invalid tokens on refresh failure
    if (errorName === 'NotAuthorizedException' || errorName === 'TokenExpiredException') {
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem('accessToken');
  const isAuth = !!accessToken;
  return isAuth;
};

// Check if token needs refresh (called before API requests)
export const ensureValidToken = async (): Promise<boolean> => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return false;

    // Try to get user info to check if token is valid
    const user = await getCurrentUser();
    if (user) {
      return true;
    }

    // If getCurrentUser fails, try to refresh the token
    const refreshed = await refreshAccessToken();
    return refreshed;
  } catch (error) {
    
    // If any error occurs, try to refresh the token
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    return refreshed;
  }
};

// Delete user from Cognito
export const deleteCognitoUser = async (userId: string): Promise<void> => {
  try {
    const { AdminDeleteUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    
    const command = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    });

    await client.send(command);
  } catch (error) {
    console.error('Error deleting user from Cognito:', error);
    throw error;
  }
};
