import { render, screen, fireEvent } from '@testing-library/react'
import Navbar from '@/components/navbar'

const mockPush = globalThis.__mocks__.push as jest.Mock

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the logo', () => {
    render(<Navbar />)
    expect(screen.getByText('NexStudy')).toBeInTheDocument()
  })

  it('renders Log in and Sign Up buttons', () => {
    render(<Navbar />)
    expect(screen.getByText('Log in')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('navigates to login page when Log in is clicked', () => {
    render(<Navbar />)
    fireEvent.click(screen.getByText('Log in'))
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('navigates to signup page when Sign Up is clicked', () => {
    render(<Navbar />)
    fireEvent.click(screen.getByText('Sign Up'))
    expect(mockPush).toHaveBeenCalledWith('/signup')
  })

  it('buttons have correct class name and IDs', () => {
    render(<Navbar />)
    const logInBtn = screen.getByText('Log in')
    const signUpBtn = screen.getByText('Sign Up')
    expect(logInBtn.className).toContain('navbtn')
    expect(signUpBtn.className).toContain('navbtn')
  })

  it('navbar container has class "navbar"', () => {
    const { container } = render(<Navbar />)
    expect(container.firstElementChild?.className).toContain('navbar')
  })

  it('renders buttons inside the rightside container', () => {
    const { container } = render(<Navbar />)
    const rightside = container.querySelector('.rightside')
    expect(rightside).toBeInTheDocument()
    expect(rightside?.textContent).toContain('Log in')
    expect(rightside?.textContent).toContain('Sign Up')
  })
})
