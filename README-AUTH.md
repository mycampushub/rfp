# Authentication Setup and Testing

## Overview
The RFP Platform includes a complete authentication system with user registration, login, and role-based access control.

## Features

### 1. User Registration (`/auth/signup`)
- **Multi-step registration process**:
  - Step 1: Personal Information (name, email, password)
  - Step 2: Company & Agreement (company name, phone, terms acceptance)
- **Real-time validation**:
  - Password strength indicator
  - Email format validation
  - Phone number validation
  - Required field checking
- **Security features**:
  - Password hashing with bcrypt
  - Password complexity requirements
  - Terms and privacy policy acceptance

### 2. User Login (`/auth/signin`)
- **Credentials-based authentication**:
  - Email, password, and tenant ID
  - Session management with NextAuth.js
  - JWT-based sessions
- **User experience**:
  - Success messages for new registrations
  - Error handling for invalid credentials
  - Loading states during authentication

### 3. Navigation Links
- **Homepage buttons**:
  - "Get Started" → `/auth/signup`
  - "Sign In" → `/auth/signin`
  - "Start Your Free Trial" → `/auth/signup`
- **Authentication flow**:
  - Successful signup redirects to signin with success message
  - Successful signin redirects to dashboard

## API Endpoints

### Registration API
- **Endpoint**: `POST /api/auth/register`
- **Purpose**: Create new user accounts
- **Validation**: Zod schema with comprehensive validation
- **Features**:
  - Duplicate email checking
  - Automatic tenant creation
  - Default role assignment
  - Password hashing

### Authentication API
- **Endpoint**: `POST /api/auth/[...nextauth]`
- **Purpose**: Handle user authentication
- **Provider**: Credentials provider
- **Features**:
  - Tenant-aware authentication
  - Session management
  - Role-based access control

## Testing the Authentication Flow

### 1. Testing User Registration
1. Navigate to `/auth/signup`
2. Fill out Step 1 (Personal Information):
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@test.com
   - Password: Test123! (meets complexity requirements)
   - Confirm Password: Test123!
3. Click "Next Step"
4. Fill out Step 2 (Company & Agreement):
   - Company Name: Test Company
   - Phone Number: +1234567890
   - Accept terms and privacy policy
5. Click "Create Account"
6. Should redirect to signin with success message

### 2. Testing User Login
1. Navigate to `/auth/signin`
2. Enter credentials:
   - Tenant ID: (will be created during registration)
   - Email: john.doe@test.com
   - Password: Test123!
3. Click "Sign In"
4. Should redirect to `/dashboard`

### 3. Testing Navigation
1. **Homepage** (`/`):
   - "Get Started" button should go to `/auth/signup`
   - "Sign In" button should go to `/auth/signin`
   - "Start Your Free Trial" button should go to `/auth/signup`

2. **Signup Page** (`/auth/signup`):
   - "Sign in here" link should go to `/auth/signin`

3. **Signin Page** (`/auth/signin`):
   - "Sign up here" link should go to `/auth/signup`

## Database Schema

### Users Table
- Stores user information with tenant association
- Includes role assignments and activity status

### Tenants Table
- Multi-tenant architecture support
- Stores tenant settings and configuration

### Roles Table
- Role-based access control
- Custom permission sets

## Security Features

### Password Security
- bcrypt hashing with salt rounds (12)
- Minimum 8 characters
- Requires uppercase, lowercase, and numbers
- Real-time strength indicator

### Session Security
- JWT-based sessions
- Secure cookie handling
- Automatic session expiration

### Data Validation
- Zod schema validation on all inputs
- Server-side validation
- Client-side validation with immediate feedback

## Error Handling

### Registration Errors
- Duplicate email detection
- Validation error display
- Network error handling
- User-friendly error messages

### Authentication Errors
- Invalid credential handling
- Tenant validation
- Session management errors
- Clear error feedback

## Future Enhancements

### Planned Features
- Email verification system
- Two-factor authentication (2FA)
- Social login providers (Google, Microsoft)
- Password reset functionality
- User profile management
- Audit logging for authentication events

### Security Improvements
- Rate limiting on authentication attempts
- IP-based restrictions
- Device fingerprinting
- Advanced session management
- Compliance with security standards

## Troubleshooting

### Common Issues

**Registration fails with validation error**
- Check all required fields are filled
- Ensure password meets complexity requirements
- Verify email format is correct
- Check phone number format

**Login fails with invalid credentials**
- Verify tenant ID is correct
- Check email and password are correct
- Ensure user account is active
- Check if user exists in database

**Navigation links not working**
- Verify Next.js routing is properly configured
- Check for client-side navigation issues
- Ensure links are properly wrapped in `Link` components

### Debug Steps
1. Check browser console for errors
2. Verify network requests in browser dev tools
3. Check server logs for authentication errors
4. Verify database connectivity
5. Check environment variables and configuration

## Support

For authentication-related issues:
1. Check the browser console for specific error messages
2. Verify the user's email and tenant information
3. Ensure all required fields are properly filled
4. Contact system administrator for database issues

The authentication system is designed to be secure, user-friendly, and extensible for future enhancements.