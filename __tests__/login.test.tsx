import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'

const mockPush = globalThis.__mocks__.push as jest.Mock
const mockSignInWithPassword = globalThis.__mocks__.signInWithPassword as jest.Mock

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.alert = jest.fn()
  })

  it('renders the login form', () => {
    render(<LoginPage />)
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('Login with Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('navigates to signup page when Sign Up link is clicked', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText('Sign Up'))
    expect(mockPush).toHaveBeenCalledWith('/signup')
  })

  it('calls signInWithPassword and redirects on successful login', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const loginButton = screen.getByText('Login')

    await userEvent.type(emailInput, 'test@test.com')
    await userEvent.type(passwordInput, 'password123')
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows alert on failed login', async () => {
    const alertMock = jest.fn()
    window.alert = alertMock
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    })

    render(<LoginPage />)
    
    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const loginButton = screen.getByText('Login')

    await userEvent.type(emailInput, 'test@test.com')
    await userEvent.type(passwordInput, 'wrongpass')
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Invalid credentials')
    })
  })

  it('renders the image section', () => {
    const { container } = render(<LoginPage />)
    const imageDiv = container.querySelector('.image')
    expect(imageDiv).toBeInTheDocument()
  })

  it('email input updates value when user types', async () => {
    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement
    await userEvent.type(emailInput, 'user@example.com')
    expect(emailInput.value).toBe('user@example.com')
  })

  it('password input updates value when user types', async () => {
    render(<LoginPage />)
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement
    await userEvent.type(passwordInput, 'mypassword')
    expect(passwordInput.value).toBe('mypassword')
  })

  it('email input has type "email"', () => {
    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText('Email')
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('password input has type "password"', () => {
    render(<LoginPage />)
    const passwordInput = screen.getByPlaceholderText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('login button has class "confirm"', () => {
    render(<LoginPage />)
    const loginButton = screen.getByText('Login')
    expect(loginButton.className).toContain('confirm')
  })

  it('renders "Don\'t have an account?" text', () => {
    render(<LoginPage />)
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
  })
})
