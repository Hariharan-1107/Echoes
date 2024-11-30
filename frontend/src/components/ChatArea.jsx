import { useEffect, useRef } from "react";

export default function ChatArea({ textArray, sender_id }) {
  const chatEndRef = useRef(null);

  // Automatically scroll to the bottom when textArray changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [textArray]);

  return (
    <div className="max-h-60 overflow-y-auto bg-gray-50 p-4 rounded-lg shadow mb-4">
      <ul className="space-y-2">
        {textArray.map((text, index) => (
          <li
            key={index}
            className={`p-3 rounded-lg ${
              text.sender_id === sender_id
                ? "bg-blue-100 text-right"
                : "bg-gray-100 text-left"
            }`}
          >
            {text.message}
          </li>
        ))}
        {/* Dummy div to scroll to */}
        <div ref={chatEndRef} />
      </ul>
    </div>
  );
}
