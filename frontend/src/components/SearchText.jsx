import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { XIcon } from "@heroicons/react/solid"; // For the close button
import ChatArea from "./ChatArea";
import dotenv from "dotenv";
dotenv.config();
const socket = io(`${process.env.SERVER_URL}`);

export default function Text({
  data,
  sender,
  isOpen,
  setIsOpen,
  friends,
  setFriends,
}) {
  const [textArray, setTextArray] = useState([]);
  const [message, setMessage] = useState("");
  // State to control visibility of the chat box

  useEffect(() => {
    const fetchtexts = async () => {
      try {
        const response = await axios.get(
          `${process.env.SERVER_URL}/messages/${sender.googleid}/${data.googleid}`
        );
        setTextArray(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchtexts();

    socket.emit("joinRoom", [sender.googleid, data.googleid].sort().join("-"));

    socket.on("receive_message", (newMessage) => {
      setTextArray((prevTexts) => [...prevTexts, newMessage]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [sender.googleid, data.googleid]);

  const handleMessage = async (e) => {
    e.preventDefault();
    const sendpacket = {
      message,
      sender_id: sender.googleid,
      receiver_id: data.googleid,
    };

    try {
      socket.emit("send_message", sendpacket);
      await axios.post(`${process.env.SERVER_URL}/messages`, sendpacket);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false); // Close the chat box
  };

  const handlenewFriend = () => {
    if (friends.some((friend) => friend.googleid === data.googleid)) {
      console.log("already present");
    } else {
      console.log("adding friend...");
      setFriends([...friends, data]);
    }
  };

  return (
    isOpen && (
      <div className="relative flex flex-col max-w-md mx-auto p-4 bg-white rounded-lg shadow-lg">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full hover:bg-gray-300 focus:outline-none"
        >
          <XIcon className="w-6 h-6 text-gray-600" />
        </button>

        <h1 className="text-lg font-medium mb-2">
          Messaging <span className="text-blue-500">{data.username}</span>
        </h1>
        <ChatArea textArray={textArray} sender_id={sender.googleid} />
        <form onSubmit={handleMessage} className="mt-4 flex flex-col space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
          />

          <div className="flex justify-between">
            <button
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={handlenewFriend}
            >
              Add to Friends
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    )
  );
}
