// ============================================
// MOCK AUTHENTICATION DATA & API SERVICES
// ============================================

// Sample pre-seeded user accounts for testing
export const MOCK_USERS = [
  {
    id: 'usr_001',
    name: 'Alex Johnson',
    email: 'alex.dev@collabboard.com',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    role: 'Lead Designer',
    isVerified: true,
    createdAt: '2026-01-15T10:30:00Z'
  },
  {
    id: 'usr_002',
    name: 'Demo User',
    email: 'demo@collabboard.com',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    role: 'Software Engineer',
    isVerified: true,
    createdAt: '2026-02-01T14:20:00Z'
  }
];

// Helper function to simulate backend network delay (default 700ms)
const simulateDelay = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API: User Login
export const mockLogin = async (email, password) => {
  await simulateDelay();

  if (!email || !password) {
    throw new Error('Please fill in both email and password fields.');
  }

  const existingUser = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!existingUser) {
    throw new Error('No account found with this email address.');
  }

  if (existingUser.password !== password) {
    throw new Error('Invalid password. Please try again.');
  }

  return {
    success: true,
    message: 'Login successful! Redirecting to workspace...',
    token: `mock_jwt_token_${Date.now()}_${existingUser.id}`,
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      avatar: existingUser.avatar,
      role: existingUser.role,
      isVerified: existingUser.isVerified
    }
  };
};

// Mock API: User Registration
export const mockRegister = async (fullName, email, password) => {
  await simulateDelay();

  if (!fullName || !email || !password) {
    throw new Error('All fields are required.');
  }

  const emailExists = MOCK_USERS.some(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (emailExists) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name: fullName,
    email: email.toLowerCase(),
    password: password,
    avatar: '',
    role: 'Member',
    isVerified: false,
    createdAt: new Date().toISOString()
  };

  MOCK_USERS.push(newUser);

  return {
    success: true,
    message: 'Account created successfully! Verification code sent to your email.',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      isVerified: false
    }
  };
};

// Mock API: Request Password Reset Link
export const mockForgotPassword = async (email) => {
  await simulateDelay();

  if (!email) {
    throw new Error('Please enter a valid email address.');
  }

  return {
    success: true,
    message: `Password reset instructions sent to ${email}. Please check your inbox or spam folder.`
  };
};

// Mock API: Reset Password
export const mockResetPassword = async (email, newPassword) => {
  await simulateDelay();

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const user = MOCK_USERS.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (user) {
    user.password = newPassword;
  }

  return {
    success: true,
    message: 'Your password has been successfully reset! You can now log in.'
  };
};

// Mock API: Verify 6-Digit Email OTP
export const mockVerifyEmail = async (otpCode) => {
  await simulateDelay();

  if (!otpCode || otpCode.length !== 6) {
    throw new Error('Please enter a complete 6-digit verification code.');
  }

  // Accepts any 6-digit code or test code '123456'
  if (otpCode === '000000') {
    throw new Error('Invalid verification code. Please check your code and try again.');
  }

  return {
    success: true,
    message: 'Email verified successfully! Your account is now fully active.'
  };
};
