import axios from "axios";
import { useEffect, useState } from "react";

import Searchpeople from "./components/Searchpeople"; // Assuming you have this component
import Friends from "./components/Friends.jsx";
import dotenv from "dotenv";

dotenv.config();
function App() {
  const [login, setLogin] = useState(false);
  const [user, setUser] = useState({});
  const [friends, setFriends] = useState([]);
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await axios.get(
          `${process.env.SERVER_URL}/api/login-status`,
          { withCredentials: true }
        );
        if (response.data.loggedIn) {
          setLogin(true);
          setUser(response.data.user);
        } else {
          setLogin(false);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkLogin();
  }, []);

  const handleLogin = () => {
    window.location.href = `${process.env.SERVER_URL}/auth/google`;
  };

  const handleLogout = async () => {
    const response = await axios.get(`${process.env.SERVER_URL}/auth/logout`);
    if (response.data.success) {
      setLogin(false);
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
          <div className=" flex justify-center item-center h-screen w-full max-w-5xl mx-auto mt-16">
            <Friends user={user} friends={friends} setFriends={setFriends} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
