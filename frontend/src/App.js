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
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-blue-500 text-white">
          {/* Welcome Content */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold drop-shadow-lg">
              Welcome to Echoes
            </h1>

            <button className="button google" onClick={handleLogin}>
              <svg
                viewBox="0 0 256 262"
                preserveAspectRatio="xMidYMid"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  fill="#4285F4"
                ></path>
                <path
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  fill="#34A853"
                ></path>
                <path
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  fill="#EB4335"
                ></path>
              </svg>
              Continue with Google
            </button>
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

          {/* Logout Button positioned in top-right */}
          <button
            onClick={handleLogout}
            className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white font-medium rounded-md shadow hover:bg-red-600"
          >
            Logout
          </button>

          {/* Logo Text 'Echoes' positioned at top-center */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-3xl font-semibold text-gray-800">
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
