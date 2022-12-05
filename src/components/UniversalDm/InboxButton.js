import React from "react";
import { Icon } from "@iconify/react";

export default function InboxButton({
  getConversations,
  showRecentMessages,
  setShowRecentMessages,
  inboxNotEmpty,
}) {
  return (
    <>
      <button
        className={`universal_dm__inbox ${showRecentMessages ? "universal_dm__inbox__selected" : ""}`}
        onClick={() => {
          getConversations()
          setShowRecentMessages(!showRecentMessages)
        }}
      >
        <Icon className="universal_dm__inbox_icon" icon="bi:inbox" />
        {inboxNotEmpty && <div className="universal_dm__inbox_badge"></div>}
      </button>
    </>
  );
}
