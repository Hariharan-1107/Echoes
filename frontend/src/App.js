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
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLogin(true);
    } else {
      const params = new URLSearchParams(window.location.search);
      const userData = params.get("userData");

      if (userData) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(userData));
          localStorage.setItem("user", JSON.stringify(parsedUser));
          setUser(parsedUser);
          setLogin(true);

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
        localStorage.removeItem("user");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-500 text-gray-800">
      {!login ? (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-6 text-white">
          <h1 className="text-5xl font-bold drop-shadow-lg">
            Welcome to Echoes
          </h1>
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg"
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
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-3xl font-semibold text-white">
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
