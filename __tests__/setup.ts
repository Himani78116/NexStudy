import '@testing-library/jest-dom'

// Suppress React act() warnings in test output (benign warning for async state updates)
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn((...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return
    originalConsoleError.call(console, ...args)
  })
})

afterAll(() => {
  console.error = originalConsoleError
})

declare global {
  // eslint-disable-next-line no-var
  var __mocks__: {
    router: any;
    supabase: any;
    push: jest.Mock;
    replace: jest.Mock;
    signOut: jest.Mock;
    getUser: jest.Mock;
    signInWithPassword: jest.Mock;
    signUp: jest.Mock;
    getSession: jest.Mock;
    from: jest.Mock;
    select: jest.Mock;
    eq: jest.Mock;
    in: jest.Mock;
    order: jest.Mock;
    single: jest.Mock;
  };
}

const mockPush = jest.fn()
const mockReplace = jest.fn()

const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
}

const mockSignOut = jest.fn()
const mockGetUser = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockSignUp = jest.fn()
const mockGetSession = jest.fn()

// Chain methods — each returns mockSupabase for chaining
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockIn = jest.fn()
const mockOrder = jest.fn()
const mockInsert = jest.fn()
const mockDelete = jest.fn()
const mockUpdate = jest.fn()
const mockSingle = jest.fn()
const mockFrom = jest.fn()

const mockSupabase: any = {
  auth: {
    signOut: mockSignOut,
    getUser: mockGetUser,
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    getSession: mockGetSession,
  },
  from: mockFrom,
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  order: mockOrder,
  insert: mockInsert,
  delete: mockDelete,
  update: mockUpdate,
  single: mockSingle,
}

// Make mockSupabase thenable so `await supabase.from().select().eq()` resolves properly
// This handles cases where eq/in/order are terminal (no .single() at the end)
mockSupabase.then = (resolve: any) => resolve({ data: null, error: null })

// from() returns mockSupabase for chaining
mockFrom.mockReturnValue(mockSupabase)

// All intermediate chain methods return mockSupabase
mockSelect.mockReturnValue(mockSupabase)
mockEq.mockReturnValue(mockSupabase)
mockIn.mockReturnValue(mockSupabase)
mockOrder.mockReturnValue(mockSupabase)
mockInsert.mockReturnValue(mockSupabase)
mockDelete.mockReturnValue(mockSupabase)
mockUpdate.mockReturnValue(mockSupabase)

// single() is terminal — returns a Promise
mockSingle.mockResolvedValue({ data: null, error: null })

globalThis.__mocks__ = {
  router: mockRouter,
  supabase: mockSupabase,
  push: mockPush,
  replace: mockReplace,
  signOut: mockSignOut,
  getUser: mockGetUser,
  signInWithPassword: mockSignInWithPassword,
  signUp: mockSignUp,
  getSession: mockGetSession,
  from: mockFrom,
  select: mockSelect,
  eq: mockEq,
  in: mockIn,
  order: mockOrder,
  single: mockSingle,
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/supabaseClient', () => ({
  supabase: mockSupabase,
}))

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

beforeEach(() => {
  jest.clearAllMocks()
  // Re-apply default behaviors after clearAllMocks (clearAllMocks only clears tracking data,
  // but mockReturnValue/mockResolvedValue are implementations, NOT cleared by clearAllMocks.
  // This is a safety net in case of resetAllMocks.)
  mockFrom.mockReturnValue(mockSupabase)
  mockSelect.mockReturnValue(mockSupabase)
  mockEq.mockReturnValue(mockSupabase)
  mockIn.mockReturnValue(mockSupabase)
  mockOrder.mockReturnValue(mockSupabase)
  mockInsert.mockReturnValue(mockSupabase)
  mockDelete.mockReturnValue(mockSupabase)
  mockUpdate.mockReturnValue(mockSupabase)
  mockSingle.mockResolvedValue({ data: null, error: null })
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  mockSignOut.mockResolvedValue({ error: null })
  mockSignInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
  mockSignUp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
})
