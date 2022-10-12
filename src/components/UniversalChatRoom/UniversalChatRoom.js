import React from "react";
import "./UniversalChatRoom.css";

const sampleMessages = [
  { username: "user1", text: "hi1" },
  { username: "user1", text: "hi2" },
  { username: "user1", text: "hi3" },
  { username: "user1", text: "hi4" },
  { username: "user1", text: "hi1" },
  { username: "user1", text: "hi2" },
  { username: "user1", text: "hi3" },
  { username: "user1", text: "hi4" },
  { username: "user1", text: "hi1" },
  { username: "user1", text: "hi2" },
  { username: "user1", text: "hi3" },
  { username: "user1", text: "hi4" },
  { username: "user1", text: "hi1" },
  { username: "user1", text: "hi2" },
  { username: "user1", text: "hi3" },
  { username: "user1", text: "hi4" },
];

export default function UniversalChatRoom() {
  return (
    <div className="universal_chat_room">
      <div className="universal_chat_room__messages_outer">
        <div className="universal_chat_room__messages_inner">
          {sampleMessages.map((message) => {
            return (
              <div>
                {message.username} - {message.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
