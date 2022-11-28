import { Icon } from "@iconify/react";
import { Modal } from "@mui/material";
import Popover from "@mui/material/Popover";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import {
  getDisplayName,
  shortenAddress,
  formatDmMessage,
} from "../../utilities";
import InboxButton from "./InboxButton";
import bestagonSuccessImg from "../../assets/images/bestagonSuccess.png";

export default function DmButton(props) {
  // Wamgi hooks
  const { address: wagmiAddress } = useAccount();
  const {
    connect,
    connectors,
    error: wagmiError,
    isLoading,
    pendingConnector,
  } = useConnect();
  const { signMessageAsync } = useSignMessage();

  // make sure signature requested once
  const [signedWallet, setSignedWallet] = useState("No wallet signed"); 

  // Custom states
  const [numberOfNotifications, setNumberOfNotifications] = useState(0);
  const mainUrl = "https://nftychat-staging.herokuapp.com";
  // const mainUrl = "http://localhost:8080";
  const [messageText, setMessageText] = useState("");
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [displayName, setDisplayName] = useState(props.displayName);
  const [displayText, setDisplayText] = useState(props.displayText);
  const [userName, setUserName] = useState("");
  const [conversations, setConversations] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
  // const displayName = "Poapdispenser.eth";
  // const address = "0x11B002247efc78A149F4e6aDc9F143b47bE9123D"
  const [showRecentMessages, setShowRecentMessages] = useState(false)
  const [inboxNotEmpty, setInboxNotEmpty] = useState(false)
  const [messageSentScreen, setMessageSentScreen] = useState(false)

  // Wallet modal
  // Connectors 0: metamask, 1:WalletConnect, 2: coinbase
  const [walletPopoverOpen, setWalletPopoverOpen] = useState(false);

  // UseEffect to warn user on error
  useEffect(() => {
    if (wagmiError) {
      toast.error("Wallet not detected.");
    }
  }, [wagmiError]);

  //useEffect to resolve username
  useEffect(() => {
    async function resolveUserName() {
      if (!userName || userName === "" || userName === undefined) {
        const tempUserName = await getDisplayName(wagmiAddress);
        setUserName(tempUserName);
      }
    }
    resolveUserName();
    console.log("wagmiAddress - " + wagmiAddress)
    console.log("userName - " + userName)
  }, [userName, wagmiAddress]);

  //useEffect if displayName not defined
  useEffect(() => {
    async function resolveDisplayName() {
      if (!displayName || displayName === "") {
        const tempDisplayName = await getDisplayName(props.address);
        setDisplayName(tempDisplayName);
      }
    }
    resolveDisplayName();
  }, [displayName, props.address]);

  // useEffect if displayText not defined
  useEffect(() => {
    if ([undefined, null].includes(props.displayText)) {
      setDisplayText(
        `DM ${displayName ? displayName : shortenAddress(props.address)}`
      );
    }
  }, [displayName, props.displayText, props.address]);

  // badge of unread messages
  useEffect(() => {
    if(["", undefined, null].includes(props.address)) return;
    fetch(mainUrl + "/v1/unread_message_count?address=" + props.address, {
      method: "get",
    })
      .then((payload) => {
        return payload.json();
      })
      .then((data) => {
        setNumberOfNotifications(data);
      });
  }, [props.address]);

  useEffect(() => {
    if(["", undefined, null].includes(wagmiAddress)) return;
    fetch(mainUrl + "/v1/unread_message_count?address=" + wagmiAddress, {
      method: "get",
    })
      .then((payload) => {
        return payload.json();
      })
      .then((data) => {
        if (data > 0 ){
          setInboxNotEmpty(true);
        } else{
          setInboxNotEmpty(false); 
        }
      });
  }, [wagmiAddress])

  // Checks validity of signature
  async function checkSignature(tempAddress = wagmiAddress, signature = "0x") {
    const signatureUrl = `${mainUrl}/v1/authenticate?address=${tempAddress}&signature=${signature}&source=${window.location.hostname}`;
    const loginResponse = await fetch(signatureUrl);
    if (!loginResponse.ok) {
      loginResponse.json().then((data) => {
        toast.error(data["detail"]);
      });
      throw new Error(loginResponse.status);
    }
    //Set local storage with login vars
    const loginData = await loginResponse.json();
    // If multisig wallet
    if (loginData["status"] === "pending") {
      toast.error("Multisig not enabled");
      return;
    }
    return loginData["token"];
  }

  // calls check signature and saves access token
  async function getAccessToken() {
    if (!wagmiAddress) return null;
    let tempAccessToken = localStorage.getItem("token_" + wagmiAddress);
    if (!tempAccessToken) {
      const message_response = await fetch(
        mainUrl + "/v1/siwe_message?address=" + wagmiAddress
      );
      const data = await message_response.json();
      const siwe_message = data.siwe_message;
      const signature = await signMessageAsync({ message: siwe_message });
      tempAccessToken = await checkSignature(wagmiAddress, signature);
    }
    localStorage.setItem("token_" + wagmiAddress, tempAccessToken);
    setAuthenticated(true);
    return tempAccessToken;
  }

  async function getConversations() {
    const tempAccessToken = await getAccessToken();
    fetch(mainUrl + "/v1/conversations", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + tempAccessToken,
      },
    })
      .then((response) => {
        if (!response.ok) {
          response.json().then((data) => {
            toast.error(data["detail"]);
            console.log(data["detail"]);
            // force reauth
            setAuthenticated(false);
            localStorage.removeItem("token_" + wagmiAddress);
          });
          // TODO: Unsure what error is trying to throw
          throw new Error("error");
        }
        return response.json();
      })
      .then((payload) => {
        setConversations(payload.slice(0, 3));
      });
  }
  // useEffect to get signature after click
  useEffect(() => {
    if (!!wagmiAddress && !!popoverAnchor && wagmiAddress !== signedWallet) {
      getAccessToken();
      setSignedWallet(wagmiAddress)
    }
  }, [popoverAnchor, wagmiAddress, signedWallet]);

  // useEffect to fetch conversations if user has authenticated
  useEffect(() => {
    if (authenticated) {
      getConversations();
    }
  }, [props.address, wagmiAddress, authenticated]);

  async function sendClick() {
    if (messageText === "") return;
    const tempAccessToken = await getAccessToken();
    const payload = { address: props.address, message_text: messageText };
    fetch(mainUrl + "/v1/send_message", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer " + tempAccessToken,
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          response.json().then((data) => {
            toast.error(data["detail"]);
            console.log(data["detail"]);
            // force reauth
            setAuthenticated(false);
            localStorage.removeItem("token_" + wagmiAddress);
          });
          // TODO: Unsure what error is trying to throw
          throw new Error("error");
        }
        return response.json();
      })
      .then(() => {
        toast.success("Message sent!");
        setNumberOfNotifications((num) => num + 1);
        setMessageText("");
        setMessageSentScreen(true);
      });
  }

  return (
    <div
      className={
        props.theme === "dark"
          ? "universal_button universal_button___dark"
          : "universal_button"
      }
    >
      {/* Activation button */}
      <button
        className="universal_button__button"
        type="button"
        onClick={(event) => {
          setWalletPopoverOpen(true);
          setPopoverAnchor(event.currentTarget);
        }}
      >
        {/* Icon */}
        <div className="universal_button__icon_container">
          {numberOfNotifications > 0 && (
            <div className="universal_button__badge">
              {numberOfNotifications}
            </div>
          )}
          <Icon
            className="universal_button__icon"
            icon="ant-design:message-outlined"
          />
        </div>

        {/* Text */}
        {popoverAnchor !== null && authenticated === false ? (
          <span className="universal_button__text">Waiting for Signature</span>
        ) : wagmiAddress === props.address ? (
          <span className="universal_button__text">Recent Messages</span>
        ) : displayText !== "" ? (
          <span className="universal_button__text">{displayText}</span>
        ) : (
          ""
        )}
      </button>

      {/* Message Popover */}
      <Popover
        anchorEl={popoverAnchor}
        anchorOrigin={{
          vertical: props.popoverDirection,
          horizontal: "center",
        }}
        className="universal_button_popover"
        style={
          props.popoverDirection === "bottom"
            ? { marginTop: 8 }
            : { marginTop: -8 }
        }
        onClose={() => setPopoverAnchor(null)}
        open={popoverAnchor !== null && authenticated}
        transformOrigin={{
          vertical: props.popoverDirection === "bottom" ? "top" : "bottom",
          horizontal: "center",
        }}
      >
        <div
          className={
            props.theme === "dark"
              ? "universal_button_popover__container universal_button_popover__container___dark"
              : "universal_button_popover__container"
          }
        >
          {(wagmiAddress === props.address || showRecentMessages) && (!messageSentScreen) && (
            <>
              {/* Recent Messages */}
              <div className="universal_dm__content universal_dm__top">
                <span className="universal_dm__title"> Recent Messages </span>
                <InboxButton showRecentMessages={showRecentMessages} setShowRecentMessages={setShowRecentMessages} inboxNotEmpty={inboxNotEmpty} />
              </div>
              <div className="universal_dm__content">
                <div className="message_separator"></div>
              </div>
              <div className="universal_dm__messages">
                {conversations.map((conversation) => (
                  <div
                    className="message__container"
                    key={conversation.conversation_id}
                    onClick={() => {
                      window.open(
                        "https://nftychat.xyz/dms/" +
                          conversation.conversation_id,
                        "_blank"
                      );
                    }}
                  >
                    <div className="hover_text"> View on nftychat.xyz</div>
                    <div className="message_text__container">
                      <span className="message_title">
                        {" "}
                        {conversation.conversation_name}
                      </span>
                      <span className="message_text">
                        {formatDmMessage(conversation.latest_message_text)}
                      </span>
                    </div>
                    {conversation.unread_message_count > 0 && (
                      <div className="message__badge">
                        {conversation.unread_message_count}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="universal_dm__content universal_dm__bottom_2">
                <span className="universal_dm__user_text">
                  Connected: {userName}
                </span>
                <a
                  href="https://nftychat.xyz"
                  rel="noopener noreferrer"
                  target="_blank"
                  className="universal_dm__nfty_link"
                >
                  {" "}
                  View all
                  <Icon
                    className="universal_dm__link_arrow"
                    icon="bi:arrow-right"
                  />
                </a>
              </div>
            </>
          )}
          {((wagmiAddress !== props.address && !showRecentMessages)) && (!messageSentScreen) && (
            <>
              {/* Send Message */}
              <div className="universal_dm__content universal_dm__top">
                <span className="universal_dm__title"> Message {displayName} </span>
                {/* Inbox button */}
                <InboxButton showRecentMessages={showRecentMessages} setShowRecentMessages={setShowRecentMessages} />
              </div>
              <div className="universal_dm__content">
                <div className="message_separator"></div>
              </div>

              <div className="universal_dm__content">
                <textarea
                  className="universal_dm__textarea"
                  spellCheck={false}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
              </div>
              <div className="universal_dm__content universal_dm__bottom_1">
                <span className="universal_dm__user_text">
                  Connected: {userName}
                </span>

                {/* Send button */}
                <button className="universal_dm__send" onClick={sendClick}>
                  <Icon
                    className="universal_dm__send_icon"
                    icon="fluent:send-24-filled"
                  />
                </button>
              </div>
            </>
          )}
          {(messageSentScreen) && (
            <>
              {/* MessageSent */}
              <div className="universal_dm__message_sent">
              <img className="universal_dm__message_sent__image" src={bestagonSuccessImg} alt="successIcon"/> 
              <div className="universal_dm__message_sent__text">
               <span className="universal_dm__message_sent__title">Message sent to {displayName}</span> 
                <span className="universal_dm__message_sent__subtitle">Send another message or view recent messages</span> 
              </div>
              <div className="universal_dm__message_sent__button_group">
                <button className="universal_dm__message_sent__button"
                onClick={() => {
                  setMessageSentScreen(false);
                  setShowRecentMessages(false);
                }}>
                <Icon
                  className="universal_dm__message_sent__button_icon"
                  icon="ant-design:message-outlined"
                />
                 Send Message
                </button> 
                <button className="universal_dm__message_sent__button"
                onClick={() => {
                  setMessageSentScreen(false);
                  setShowRecentMessages(true);
                }}>
                <Icon
                  className="universal_dm__message_sent__button_icon"
                  icon="bi:inbox"
                />
                 View Messages
                </button> 
              </div>
              </div>
            </>
          )}
          <div className="universal_dm__bottom_border">
          <a
            href="https://nftychat.xyz"
            rel="noopener noreferrer"
            target="_blank"
            className="universal_dm__bottom_border__text"
          >
          ⚡️ by nftychat
          </a>
            </div>
        </div>
      </Popover>

      {/* Wallet Popover */}
      <Modal
        aria-labelledby="wallet_popover"
        className="wallet_popover"
        onClose={() => setWalletPopoverOpen(false)}
        open={!wagmiAddress && walletPopoverOpen}
      >
        <div
          className={
            props.theme === "dark"
              ? "wallet_popover__modal wallet_popover__modal___dark"
              : "wallet_popover__modal"
          }
        >
          {connectors.map((connector) => (
            <button
              className="wallet_popover__button"
              disabled={!connector.ready}
              key={connector.id}
              onClick={() => connect({ connector })}
            >
              {connector.name}
              {isLoading &&
                connector.id === pendingConnector?.id &&
                " (connecting)"}
            </button>
          ))}
        </div>
      </Modal>
      {/* </Popover> */}
    </div>
  );
}
