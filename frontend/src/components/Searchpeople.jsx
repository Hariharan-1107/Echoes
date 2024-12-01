import { useState } from "react";
import axios from "axios";
import SearchText from "./SearchText";

export default function Searchpeople({ user, friends, setFriends }) {
  const [receiver, setReceiver] = useState("");
  const [receiverdata, setReceiverdata] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(
        `https://echoes-av5f.onrender.com/search/${receiver}`
      );
      if (response.data) {
        if (response.data.username) {
          setReceiverdata(response.data);
          setIsOpen(true);
        } else {
          setReceiverdata(null);
          alert("No user found with this email.");
        }
      }
      setReceiver(""); // Clear the search box after the search
    } catch (err) {
      console.error(err);
      setReceiverdata(null);
      alert("Error while searching. Please try again.");
      setReceiver(""); // Clear the search box in case of error
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-16">
      <form
        onSubmit={handleSearch}
        className="flex items-center space-x-4 mb-6"
      >
        <input
          type="email"
          value={receiver}
          placeholder="Search for a friend by email"
          onChange={(e) => setReceiver(e.target.value)}
          required
          className="w-80 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white font-medium rounded-md shadow hover:bg-blue-600"
        >
          Search
        </button>
      </form>

      {receiverdata && receiverdata.username && (
        <div className="flex justify-center mt-6">
          <SearchText
            data={receiverdata}
            sender={user}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            friends={friends}
            setFriends={setFriends}
          />
        </div>
      )}
    </div>
  );
}
