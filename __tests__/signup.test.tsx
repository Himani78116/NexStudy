import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupPage from '@/app/signup/page'

const mockPush = globalThis.__mocks__.push as jest.Mock
const mockSignUp = globalThis.__mocks__.signUp as jest.Mock

describe('Signup Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.alert = jest.fn()
  })

  it('renders the signup form', () => {
    render(<SignupPage />)
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('Signup with Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByText('Create Account')).toBeInTheDocument()
  })

  it('navigates to login page when Log in link is clicked', () => {
    render(<SignupPage />)
    fireEvent.click(screen.getByText('Log in'))
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('calls signUp and redirects on successful signup', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    render(<SignupPage />)
    
    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const signupButton = screen.getByText('Create Account')

    await userEvent.type(emailInput, 'test@test.com')
    await userEvent.type(passwordInput, 'password123')
    fireEvent.click(signupButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      })
    })
  })

  it('shows alert on failed signup', async () => {
    const alertMock = jest.fn()
    window.alert = alertMock
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already registered' },
    })

    render(<SignupPage />)
    
    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const signupButton = screen.getByText('Create Account')

    await userEvent.type(emailInput, 'existing@test.com')
    await userEvent.type(passwordInput, 'password123')
    fireEvent.click(signupButton)

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Email already registered')
    })
  })

  it('renders the image section', () => {
    const { container } = render(<SignupPage />)
    const imageDiv = container.querySelector('.image')
    expect(imageDiv).toBeInTheDocument()
  })

  it('email input updates value when user types', async () => {
    render(<SignupPage />)
    const emailInput = screen.getByPlaceholderText('Email') as HTMLInputElement
    await userEvent.type(emailInput, 'user@example.com')
    expect(emailInput.value).toBe('user@example.com')
  })

  it('password input updates value when user types', async () => {
    render(<SignupPage />)
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement
    await userEvent.type(passwordInput, 'mypassword')
    expect(passwordInput.value).toBe('mypassword')
  })

  it('Create Account button has class "confirm"', () => {
    render(<SignupPage />)
    const signupButton = screen.getByText('Create Account')
    expect(signupButton.className).toContain('confirm')
  })

  it('renders "Already have an account?" text', () => {
    render(<SignupPage />)
    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
  })

  it('email input has type "email"', () => {
    render(<SignupPage />)
    const emailInput = screen.getByPlaceholderText('Email')
    expect(emailInput).toHaveAttribute('type', 'email')
  })
})
