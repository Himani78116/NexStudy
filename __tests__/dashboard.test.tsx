import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

const mockPush = globalThis.__mocks__.push as jest.Mock
const mockReplace = globalThis.__mocks__.replace as jest.Mock
const mockGetUser = globalThis.__mocks__.getUser as jest.Mock
const mockSignOut = globalThis.__mocks__.signOut as jest.Mock
const mockFrom = globalThis.__mocks__.from as jest.Mock
const mockSelect = globalThis.__mocks__.select as jest.Mock
const mockEq = globalThis.__mocks__.eq as jest.Mock
const mockSingle = globalThis.__mocks__.single as jest.Mock
const mockOrder = globalThis.__mocks__.order as jest.Mock
const mockIn = globalThis.__mocks__.in as jest.Mock

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.alert = jest.fn()
  })

  it('shows loading state initially', () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } }, error: null })
    render(<DashboardPage />)
    expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument()
  })

  it('redirects to login when no user is found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('redirects to setup when profile has no branch_id', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } }, error: null })
    mockSingle.mockResolvedValue({
      data: { id: 'user-1', email: 'test@test.com', branch_id: null, semester_id: null, role: 'student' },
      error: null,
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/setup')
    })
  })

  it('displays admin portal heading for admin users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@test.com' } }, error: null })
    mockSingle.mockResolvedValue({
      data: { id: 'admin-1', email: 'admin@test.com', branch_id: 'branch-1', semester_id: 'sem-1', role: 'admin' },
      error: null,
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Admin Portal')).toBeInTheDocument()
    })
  })

  it('displays admin welcome email and Manage Content button', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@test.com' } }, error: null })
    mockSingle.mockResolvedValue({
      data: { id: 'admin-1', email: 'admin@test.com', branch_id: 'branch-1', semester_id: 'sem-1', role: 'admin' },
      error: null,
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/admin@test\.com/)).toBeInTheDocument()
      expect(screen.getByText('Manage Content →')).toBeInTheDocument()
    })
  })

  it('displays student dashboard heading and info for student users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'student@test.com' } }, error: null })
    mockSingle.mockResolvedValue({
      data: { id: 'user-1', email: 'student@test.com', branch_id: 'branch-1', semester_id: 'sem-1', role: 'student' },
      error: null,
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('My Dashboard')).toBeInTheDocument()
    })
  })

  it('logs out successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'student@test.com' } }, error: null })
    mockSingle.mockResolvedValue({
      data: { id: 'user-1', email: 'student@test.com', branch_id: 'branch-1', semester_id: 'sem-1', role: 'student' },
      error: null,
    })
    mockSignOut.mockResolvedValue({ error: null })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('My Dashboard')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Logout'))

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  it('shows empty state message when no courses for student', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'student@test.com' } }, error: null })
    mockSingle.mockResolvedValue({
      data: { id: 'user-1', email: 'student@test.com', branch_id: 'branch-1', semester_id: 'sem-1', role: 'student' },
      error: null,
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('No courses found for this semester.')).toBeInTheDocument()
    })
  })

  it('admin Manage Content button navigates to /admin/branches', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@test.com' } }, error: null })
    mockSingle.mockResolvedValue({
      data: { id: 'admin-1', email: 'admin@test.com', branch_id: 'branch-1', semester_id: 'sem-1', role: 'admin' },
      error: null,
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Manage Content →')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Manage Content →'))

    expect(mockPush).toHaveBeenCalledWith('/admin/branches')
  })
})
