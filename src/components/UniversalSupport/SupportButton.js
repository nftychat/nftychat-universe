import { Icon } from "@iconify/react";
import { Modal } from "@mui/material";
import { Popover } from "@mui/material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { getDisplayName } from "../../utilities.js";
import bestagonSupportImg from "../../assets/images/bestagonSupport.png";
import { useRef } from "react";
import { isHotkey } from "is-hotkey";

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
  //const mainUrl = "http://localhost:8080";
  const [inputText, setInputText] = useState("");
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [userName, setUserName] = useState("");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
  const bottomRef = useRef(null);
  

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
      if (!!wagmiAddress) {
        const tempUserName = await getDisplayName(wagmiAddress);
        setUserName(tempUserName);
      }
    }
    resolveUserName();
  }, [userName, wagmiAddress]);

  // Function to scroll down
  function scrollDown() {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView()
    };
  }
  // UseEffect for scrolling
  useEffect(() => {
    scrollDown() 
  }, [JSON.stringify(messages), popoverAnchor, bottomRef])

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
    setSignedWallet(wagmiAddress)
    return tempAccessToken;
  }

  // gets conversation data
  async function getConversationData(tempAccessToken) {
    if (conversation !== null && signedWallet === wagmiAddress) {
      return conversation;
    } else {
      return fetch(mainUrl + "/v1/conversations", {
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
          const tempConvo = payload.find((convo) =>
            convo.members.some((member) => member.address.toLowerCase() === props.address.toLowerCase())
          );
          setConversation(tempConvo);
          if (tempConvo !== undefined){
            setNumberOfNotifications(tempConvo.unread_message_count)
          }
          return tempConvo;
        });
    }
  }

  async function getMessages() {
    const tempAccessToken = await getAccessToken();
    if ([undefined, null, ""].includes(tempAccessToken)){
      return
    }
    const tempConvo = await getConversationData(tempAccessToken);
    if (tempConvo === undefined) {
      setMessages([]);
      return;
    }
    fetch(
      mainUrl + "/v1/messages?conversation_id=" + tempConvo.conversation_id,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + tempAccessToken,
        },
      }
    )
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
        // set messages
        setMessages(payload);
      });
  }

  // useEffect to get signature after click
  useEffect(() => {
    if (!!wagmiAddress && !!popoverAnchor && wagmiAddress !== signedWallet) {
      setAuthenticated(false)
      setConversation(null)
      getAccessToken();
    }
  }, [popoverAnchor, wagmiAddress, signedWallet]);

  // useEffect to continually fetch messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (authenticated) {
        getMessages()
      }
    }, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [props.address, wagmiAddress, authenticated]);

  async function sendMessage() {
    if (inputText === "") return;
    const tempAccessToken = await getAccessToken();
    const payload = { address: props.address, message_text: inputText };
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
            localStorage.removeItem("token_" + wagmiAddress);
          });
          // TODO: Unsure what error is trying to throw
          throw new Error("error");
        }
        return response.json();
      })
      .then(() => {
        setMessages((messages) => [...messages, {message_id:Math.random(), member: {address: wagmiAddress, display_name:userName}, text: inputText }] )
        setInputText("");
      });
  }

  function handleKeyDown(e) {
    if (
      isHotkey("return", e) &&
      !isHotkey("shift+return", e) &&
      !isHotkey("meta+return", e)
    ) {
      e.preventDefault();
      sendMessage();
      return false;
    }
  }

  return (
    <div
      className={
        props.theme === "dark"
          ? "universal_support universal_support___dark"
          : "universal_support"
      }
    >
      {/* Activation button */}
      <button
        className="universal_support__button"
        type="button"
        onClick={(event) => {
          setPopoverAnchor(event.currentTarget);
          setTimeout(scrollDown, 100)
        }}
      >
        {/* Icon */}
        <div className="universal_button__icon_container">
          {numberOfNotifications > 0 && (
            <div className="universal_support__badge">
              {numberOfNotifications}
            </div>
          )}
          <img src={bestagonSupportImg} alt="supportIcon" className="universal_support__icon" />
        </div>
      </button>

      {/* Chat Popover */}
      <Popover
        anchorEl={popoverAnchor}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        className={
          props.theme === "dark"
            ? "universal_support__popover universal_support__popover_dark"
            : "universal_support__popover"
        }
        style={{ marginTop: -16 }}
        onClose={() => setPopoverAnchor(null)}
        open={popoverAnchor !== null}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <div className={"universal_support__popover_contents"}>
          <div className="universal_support__title">
            <span className="universal_support__title_text">
              {props.chatTitle}
            </span>
            <Icon
              icon="fluent:arrow-minimize-20-regular"
              className="universal_support__title_icon"
              onClick={() => setPopoverAnchor(null)}
            />
          </div>
          <div className="universal_support__seperator"></div>
          <div className="universal_support__chat">
            <div className="universal_support__chat__welcome_message">
              {props.welcomeMessage}
            </div>
            <div className="universal_support__chat__buffer"></div>
            {authenticated && (
              <div className="universal_support__chat__message_container">
                {messages.map((message) => {
                  return (<div key={message.message_id} className="universal_support__chat__message">
                    <span className={message.member.address === props.address ? "universal_support__chat__username" : "universal_support__chat__username_purple"}>{message.member.display_name} </span>
                    {message.text}
                    </div>)
                })}
                <div className="universal_support__chat__bottom_ref" ref={bottomRef}></div>
              </div>
            )}
          </div>
          {!authenticated ? (
            <button
              className="universal_support__connect_button"
              onClick={() => {
              if(!wagmiAddress){
                if(props.connectWalletFunction){
                  props.connectWalletFunction()
                }else{
                  setWalletPopoverOpen(true)
                }
              } else{
                getAccessToken()
              }

              }
              }
            >
              Connect to chat
            </button>
          ) : (
            <>
              <textarea
                onKeyDown={handleKeyDown}
                className="universal_support__text_input"
                spellCheck={false}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />

              <div className="universal_support__bottom_content">
                <span className="universal_support__user_text">
                  Connected: {userName}
                </span>

                {/* Send button */}
                <button className="universal_support__send" onClick={sendMessage}>
                  <Icon
                    className="universal_support__send_icon"
                    icon="fluent:send-24-filled"
                  />
                </button>
              </div>
            </>
          )}
          <div className="universal_support__bottom_border">
            <a
              href="https://nftychat.xyz"
              rel="noopener noreferrer"
              target="_blank"
              className="universal_support__bottom_border__text"
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
