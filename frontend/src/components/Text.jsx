import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { XIcon } from "@heroicons/react/solid";
import ChatArea from "./ChatArea";
import dotenv from "dotenv";
dotenv.config(); // Heroicons close icon
const socket = io(`${process.env.SERVER_URL}`);

export default function Text({ data, sender, isOpen, setIsOpen }) {
  const [textArray, setTextArray] = useState([]);
  const [message, setMessage] = useState("");
  const [send, setSend] = useState(false);

  // Effect to fetch previous messages and set up socket communication
  useEffect(() => {
    // Reset the isOpen state when a new user is selected
    setIsOpen(true); // Reset chat box to open when a new user is selected

    // Fetch existing messages on component mount
    const fetchtexts = async () => {
      try {
        console.log(sender, data);
        const response = await axios.get(
          `${process.env.SERVER_URL}/messages/${sender.googleid}/${data.googleid}`
        );
        setTextArray(response.data); // Update state with existing messages
        console.log("API Response:", response.data); // Debug the API response
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchtexts();

    // Emit join event for socket communication
    socket.emit("joinRoom", [sender.googleid, data.googleid].sort().join("-"));

    // Listen for incoming messages from the server
    socket.on("receive_message", (newMessage) => {
      setTextArray((prevTexts) => [...prevTexts, newMessage]); // Add new message to the chat
    });

    // Cleanup socket on component unmount
    return () => {
      socket.off("receive_message");
    };
  }, [sender.googleid, data.googleid]); // Effect depends on the sender and receiver googleid

  const handleMessage = async (e) => {
    e.preventDefault();
    setMessage("");
    const sendpacket = {
      message: message,
      sender_id: sender.googleid,
      receiver_id: data.googleid,
    };
    console.log(sendpacket);
    try {
      // Emit the message to the server via socket
      socket.emit("send_message", sendpacket);

      // Optionally, update the backend for persistence
      const response = await axios.post(
        `${process.env.SERVER_URL}/messages`,
        sendpacket
      );

      // Update UI after sending the message
      setSend(!send);
      setMessage(""); // Reset message field after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false); // Close the messaging box
  };

  // Ensure chat box is rendered for each user
  return (
    <div key={`${sender.googleid}-${data.googleid}`} className="relative">
      {isOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-6 bg-white shadow rounded-lg max-w-2xl w-full mx-4 relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full hover:bg-gray-300 focus:outline-none"
            >
              <XIcon className="w-6 h-6 text-gray-600" />
            </button>

            <h1 className="text-lg font-medium">
              Messaging <span className="text-blue-500">{data.username}</span>
            </h1>
            <ChatArea
              textArray={textArray}
              sender_id={sender.googleid}
              receiver_id={data.googleid}
            />
            <form
              onSubmit={handleMessage}
              className="mt-4 flex flex-col space-y-3 items-end"
            >
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
      {/* You can add a button or link to trigger opening of the chat again */}
    </div>
  );
}
