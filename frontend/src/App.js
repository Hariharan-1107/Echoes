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
    <div className="min-h-screen">
      {!login ? (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800">
          {/* Welcome Content */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold drop-shadow-lg text-gray-700">
              Welcome to Echoes
            </h1>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
              <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold text-gray-800">
                  Welcome to Echoes
                </h1>
                <button
                  onClick={handleLogin}
                  className="flex items-center justify-center px-6 py-3 bg-navy text-white font-medium rounded-lg shadow-lg hover:bg-blue-900"
                >
                  <img
                    src="https://www.gstatic.com/images/branding/product/1x/gsa_android_512dp.png"
                    alt="Google"
                    className="w-5 h-5 mr-2"
                  />
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
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

          {/* Navbar */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 shadow-md">
            <div className="relative flex justify-between items-center max-w-5xl mx-auto px-4 py-2">
              <div className="text-2xl font-semibold text-gray-700">Echoes</div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white font-medium rounded-md shadow hover:bg-red-600"
              >
                Logout
              </button>
            </div>
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
