import { useState, useEffect } from "react";
import axios from "axios";
import Text from "./Text";
import { TrashIcon } from "@heroicons/react/solid"; // Import trash icon
export default function Friends({ user, friends, setFriends }) {
  const [showchat, setShowchat] = useState(false);
  const [receiver, setReceiver] = useState(null);
  const [isOpen, setIsOpen] = useState(true); // State to control visibility of the chat box

  // Fetch friends from the server
  useEffect(() => {
    const fetchFriends = async () => {
      const response = await axios.get(
        `${process.env.SERVER_URL}/friends/${user.googleid}`
      );
      setFriends(response.data);
    };
    fetchFriends();
  }, [user.googleid, friends]);

  // Handle opening chat window
  const handleChat = (fr) => {
    setShowchat(true);
    setIsOpen(true);
    setReceiver(fr);
  };

  // Handle removing a friend
  const handleRemoveFriend = async (friendId) => {
    try {
      // Remove the friend from the backend
      const response = await axios.delete(
        `${process.env.SERVER_URL}/friends/${user.googleid}/${friendId}`
      );
      console.log(response.data);
      // Remove the friend from the state
      setFriends(friends.filter((friend) => friend.googleid !== friendId));
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full max-w-sm">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-md">
        {friends.length ? (
          <div>
            <h2 className="text-xl font-medium text-center mb-4">Friends</h2>
            <ul className="space-y-2">
              {friends.map((fr, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {/* Friend Name */}
                  <div
                    onClick={() => handleChat(fr)}
                    className="flex-1 cursor-pointer"
                  >
                    <span className="font-medium">{fr.username}</span>
                  </div>

                  {/* Trash Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the chat on clicking the trash icon
                      handleRemoveFriend(fr.googleid); // Remove friend
                    }}
                    className="text-red-500 hover:text-red-600 focus:outline-none"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
            {showchat && (
              <div className="mt-6">
                <Text
                  data={receiver}
                  sender={user}
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                />
              </div>
            )}
          </div>
        ) : (
          <h2 className="text-xl font-medium text-center mb-4">
            You Have No Friends Yet
          </h2>
        )}
      </div>
    </div>
  );
}
