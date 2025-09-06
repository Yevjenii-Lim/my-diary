# Email Confirmation Flow Guide

## 📧 **Overview**

After users sign up for a new account, they receive a confirmation email with a 6-digit code. This guide explains the complete confirmation flow and how to use it.

## 🔄 **Complete Signup Flow**

### **Step 1: User Signs Up**
1. User goes to `/auth/signup`
2. Fills in name, email, and password
3. Clicks "Create account"
4. Cognito sends confirmation email with 6-digit code

### **Step 2: Email Confirmation**
1. User receives email with subject: "Your verification code"
2. Email contains a 6-digit confirmation code
3. User clicks link in email OR goes to `/auth/confirm`

### **Step 3: Enter Confirmation Code**
1. User goes to `/auth/confirm`
2. Enters their email address (auto-filled if coming from signup)
3. Enters the 6-digit code from email
4. Clicks "Confirm Account"

### **Step 4: Account Activated**
1. Account is confirmed and activated
2. User is redirected to `/auth/signin`
3. User can now sign in with their credentials

## 🎯 **Confirmation Page Features**

### **URL**: `/auth/confirm`

### **Features**:
- ✅ **Email Auto-fill**: Email is pre-filled if coming from signup page
- ✅ **Code Input**: Specialized input for 6-digit confirmation codes
- ✅ **Resend Code**: Option to resend confirmation code
- ✅ **Error Handling**: Clear error messages for invalid codes
- ✅ **Success Feedback**: Confirmation of successful activation
- ✅ **Auto-redirect**: Redirects to sign-in page after confirmation

### **Form Fields**:
1. **Email Address**: User's email (required)
2. **Confirmation Code**: 6-digit code from email (required)

### **Buttons**:
- **Confirm Account**: Submits the confirmation code
- **Resend Code**: Sends a new confirmation code
- **Sign in**: Link to sign-in page for already confirmed users

## 🔧 **Technical Implementation**

### **Cognito Integration**:
```typescript
// Confirm signup
const result = await confirmSignUp(email, code);

// Resend confirmation code
const result = await resendConfirmationCode(email);
```

### **URL Parameters**:
- `/auth/confirm?email=user@example.com` - Pre-fills email field

### **Error Handling**:
- Invalid confirmation code
- Expired confirmation code
- Email not found
- Network errors

## 📱 **User Experience**

### **Signup Success**:
1. User sees success message: "User registered successfully. Please check your email for verification."
2. After 2 seconds, automatically redirected to confirmation page
3. Email field is pre-filled

### **Confirmation Success**:
1. User sees success message: "Email confirmed successfully. You can now sign in."
2. After 3 seconds, automatically redirected to sign-in page

### **Error Scenarios**:
- **Invalid Code**: "Invalid confirmation code. Please check your email and try again."
- **Expired Code**: "Confirmation code has expired. Please request a new one."
- **Email Not Found**: "Email address not found. Please check your email address."

## 🛠️ **Testing the Flow**

### **Test Account Creation**:
1. Go to `http://localhost:3000/auth/signup`
2. Create a new account with a real email address
3. Check your email for confirmation code
4. Go to `http://localhost:3000/auth/confirm`
5. Enter the confirmation code
6. Verify you can sign in

### **Test Error Handling**:
1. Try entering wrong confirmation code
2. Try confirming with wrong email
3. Test resend functionality

## 📧 **Email Configuration**

### **Cognito Email Settings**:
- **From Address**: AWS Cognito default
- **Subject**: "Your verification code"
- **Content**: Includes 6-digit code and instructions

### **Customization Options**:
- Custom email templates in Cognito Console
- Custom domain for sending emails
- Custom email content and styling

## 🔒 **Security Features**

### **Code Security**:
- ✅ 6-digit numeric codes
- ✅ Time-limited expiration
- ✅ One-time use only
- ✅ Rate limiting on resend

### **Account Protection**:
- ✅ Email verification required
- ✅ Cannot sign in without confirmation
- ✅ Secure token-based confirmation

## 🚀 **Production Considerations**

### **Email Delivery**:
- Monitor email delivery rates
- Set up email bounce handling
- Configure SPF/DKIM records

### **User Experience**:
- Clear instructions in confirmation emails
- Mobile-friendly confirmation page
- Accessibility compliance

### **Monitoring**:
- Track confirmation success rates
- Monitor failed confirmations
- Alert on unusual patterns

## 🎉 **Benefits**

### **For Users**:
- ✅ Secure account creation
- ✅ Clear confirmation process
- ✅ Easy to use interface
- ✅ Multiple ways to access confirmation

### **For App**:
- ✅ Verified email addresses
- ✅ Reduced fake accounts
- ✅ Better user data quality
- ✅ Compliance with email verification best practices

---

**Your diary app now has a complete, secure email confirmation flow that ensures all users have verified email addresses!** 📧✅




