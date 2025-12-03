import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68ff92f4fc2f1b7aa86a06b2", 
  requiresAuth: true // Ensure authentication is required for all operations
});
