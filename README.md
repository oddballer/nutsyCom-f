# NutsyCom Frontend

A React-based frontend for the NutsyCom chat application with a 90s Windows desktop theme.

## Features

- **90s Windows Desktop UI**: Authentic Windows 95/98 style interface
- **User Authentication**: Login/register system with JWT tokens
- **Real-time Chat**: WebSocket-based messaging with Socket.IO
- **Draggable Windows**: Resizable and movable application windows
- **Taskbar**: Windows-style taskbar with Start menu and user info
- **Persistent Sessions**: Automatic login with token storage

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   # Backend URL
   VITE_BACKEND_URL=http://localhost:4000
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Authentication

The app requires users to register or login before accessing the chat. Features include:

- **Registration**: Create new accounts with username, email, and password
- **Login**: Authenticate with existing credentials
- **Session Management**: Automatic token storage and validation
- **Logout**: Secure logout with session cleanup

## Components

### Core Components
- `Desktop`: Main desktop container with background and icons
- `WindowApp`: Draggable/resizable window wrapper
- `Taskbar`: Windows-style taskbar with Start menu and user info
- `Icon`: Desktop icons for applications

### Authentication
- `AuthContext`: React context for authentication state management
- `LoginWindow`: Login/register form with 90s styling

### Applications
- `ChatApp`: Real-time chat application with user authentication

## Usage

1. **Login/Register**: The app will show a login window on first load
2. **Desktop**: After authentication, you'll see the Windows desktop
3. **Chat**: Double-click the chat icon to open the chat application
4. **Taskbar**: Use the taskbar to manage windows and access user menu
5. **Logout**: Click the user button in the taskbar to logout

## Development

The app uses:
- **React 19** with hooks and context
- **React95** for authentic 90s Windows styling
- **Socket.IO Client** for real-time communication
- **React-RND** for draggable/resizable windows
- **Vite** for fast development and building

## Backend Integration

The frontend connects to the NutsyCom backend for:
- User authentication (JWT tokens)
- Real-time chat messaging
- User session management
- Chat room access control
