// Supabase stub for demo mode — all backend operations are disabled
export const supabase = {
  auth: {
    signInWithPassword: async () => ({ error: null }),
    signUp: async () => ({ data: { session: true }, error: null }),
    signOut: async () => {},
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: async () => ({ data: { user: { id: 'demo-user' } } }),
    getSession: async () => ({ data: { session: { access_token: 'demo-token' } } }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
    upsert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    delete: () => ({ eq: () => ({ error: null }) }),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
  }),
  removeChannel: () => {},
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any
