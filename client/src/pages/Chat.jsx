import { supabase } from "../supabaseClient";
import { useState, useEffect } from "react";
import MessageArea from "./MessageArea";

export default function Chat({ session: initialSession }) {
  const [session, setSession] = useState(initialSession);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch('http://localhost:4000/users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUsers();
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    setSession(null);
    window.location.reload(false);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSidebarOpen(false); // Close sidebar on mobile when user is selected
  };

  if (!session?.user) return <p>Loading...</p>;

  return (
    <div className="chat-container">
      {/* Burger Menu Button (Mobile Only) */}
      <button 
        className={`burger-menu ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Left Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>Chat App</h1>
        </div>

        <div className="user-profile">
          <div className="user-avatar">
            {session.user.user_metadata.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <p className="user-name">{session.user.user_metadata.name}</p>
            <p className="user-email">{session.user.email}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="users-section">
          <h2 className="users-title">Conversations</h2>
          <ul className="users-list">
            
            {users
            .filter(user => user.id !== session.user.id)
            .map((user) => (
              <li 
                key={user.id} 
                className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
              >
                <button 
                  className="user-btn" 
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="user-item-avatar">
                    {user.user_metadata.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="user-item-name">
                    {user.user_metadata.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="chat-area">
        <MessageArea selectedUser={selectedUser} session={session} />
      </div>
    </div>
  );
}