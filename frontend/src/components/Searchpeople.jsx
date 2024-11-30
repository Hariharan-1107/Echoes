import { useState } from "react";
import axios from "axios";
import SearchText from "./SearchText";
import dotenv from "dotenv";
dotenv.config();
export default function Searchpeople({ user, friends, setFriends }) {
  const [receiver, setReceiver] = useState("");
  const [receiverdata, setReceiverdata] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(
        `${process.env.SERVER_URL}/search/${receiver}`
      );
      setReceiverdata(response.data);
      setIsOpen(true);
    } catch (err) {
      console.error(err);
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

      {receiverdata && (
        <div className="flex justify-center">
          {receiverdata.username ? (
            <SearchText
              data={receiverdata}
              sender={user}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              friends={friends}
              setFriends={setFriends}
            />
          ) : (
            <p className="text-red-500 font-medium">
              No user found with this email.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
