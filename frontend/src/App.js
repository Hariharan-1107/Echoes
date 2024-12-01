import axios from "axios";
import { useEffect, useState } from "react";
import Searchpeople from "./components/Searchpeople"; // Assuming you have this component
import Friends from "./components/Friends.jsx";

axios.defaults.withCredentials = true;

function App() {
  const [login, setLogin] = useState(false);
  const [user, setUser] = useState({});
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    // Check if user data is stored in localStorage
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLogin(true);
    } else {
      // Check if user data is passed in the URL query parameters
      const params = new URLSearchParams(window.location.search);
      const userData = params.get("userData");

      if (userData) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(userData));
          localStorage.setItem("user", JSON.stringify(parsedUser)); // Save user data to localStorage
          setUser(parsedUser);
          setLogin(true);

          // Clean up the URL
          const newUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (error) {
          console.error("Failed to parse user data:", error);
        }
      }
    }
  }, []);

  const handleLogin = () => {
    window.location.href = `https://echoes-av5f.onrender.com/auth/google`;
  };

  const handleLogout = async () => {
    try {
      const response = await axios.get(
        `https://echoes-av5f.onrender.com/auth/logout`
      );
      if (response.data.success) {
        setLogin(false);
        setUser({});
        localStorage.removeItem("user"); // Clear user data from localStorage
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {!login ? (
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold">Welcome to the Chat App</h1>
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg shadow hover:bg-blue-600"
          >
            Continue with Google
          </button>
        </div>
      ) : (
        <div>
          {/* Top Center Search Bar */}
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-full max-w-md">
            <Searchpeople
              user={user}
              friends={friends}
              setFriends={setFriends}
            />
          </div>

          {/* Logout Button positioned in top-right */}
          <button
            onClick={handleLogout}
            className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white font-medium rounded-md shadow hover:bg-red-600"
          >
            Logout
          </button>

          {/* Logo Text 'Echoes' positioned at top-center */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-3xl font-semibold">
            Echoes
          </div>

          {/* Chat Component */}
          <div className="flex justify-center items-center h-screen w-full max-w-5xl mx-auto mt-16">
            <Friends user={user} friends={friends} setFriends={setFriends} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
