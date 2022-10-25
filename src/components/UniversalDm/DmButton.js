import { Icon } from "@iconify/react";
import { Modal } from "@mui/material";
import Popover from "@mui/material/Popover";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import logo from "../../assets/images/bestagonCircle.png";
import { getDisplayName, shortenAddress } from "../../utilities";

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

  // Custom states
  const [numberOfNotifications, setNumberOfNotifications] = useState(0);
  const mainUrl = "https://nftychat-staging.herokuapp.com";
  // const mainUrl = "http://localhost:8080";
  const [messageText, setMessageText] = useState("");
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [displayName, setDisplayName] = useState(props.displayName)
  const [conversations, setConversations] = useState([])
  const [authenticated, setAuthenticated] = useState(false)
  // const displayName = "Poapdispenser.eth";
  // const address = "0x11B002247efc78A149F4e6aDc9F143b47bE9123D"

  // Wallet modal
  // Connectors 0: metamask, 1:WalletConnect, 2: coinbase
  const [walletPopoverOpen, setWalletPopoverOpen] = useState(false);

  // UseEffect to warn user on error
  useEffect(() => {
    if (wagmiError) {
      toast.error("Wallet not detected.");
    }
  }, [wagmiError]);

  //useEffect if displayName not defined
  useEffect(() =>{
    async function resolveDisplayName(){
      if (!displayName || displayName === ""){
        const tempDisplayName = await getDisplayName(props.address);
        setDisplayName(tempDisplayName)
      }
    }
    resolveDisplayName();
  },[displayName, props.address])

  // badge of unread messages
  useEffect(() => {
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
    let tempAccessToken = localStorage.getItem("token_"+ wagmiAddress);
    if (!tempAccessToken) {
      const message_response = await fetch(
        mainUrl + "/v1/siwe_message?address=" + wagmiAddress,
      );
      const data = await message_response.json();
      const siwe_message = data.siwe_message;
      const signature = await signMessageAsync({ message: siwe_message });
      tempAccessToken = await checkSignature(wagmiAddress, signature);
    }
    localStorage.setItem("token_"+ wagmiAddress, tempAccessToken); 
    setAuthenticated(true)
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
         });
         // TODO: Unsure what error is trying to throw
         throw new Error("error");
       }
       return response.json();
     })
     .then((payload) => {
      setConversations(payload.slice(0,3))
     });
  }
  // useEffect to get signature after click
  useEffect(() => {
    if (!!wagmiAddress && !!popoverAnchor){
      getAccessToken()
    }
  },
  [popoverAnchor, wagmiAddress])

  // useEffect to fetch conversations if user is same as props.address
  useEffect(() => {
    if (props.address === wagmiAddress && authenticated) {
      getConversations();
    }
  }, [props.address, wagmiAddress, authenticated]);

  async function sendClick() {
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
        setPopoverAnchor(null);
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
          getAccessToken();
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
        <span className="universal_button__text">
          {(popoverAnchor !== null && authenticated === false) ? 
          "Waiting for Signature" :
          (wagmiAddress === props.address
            ? "Recent Messages"
            : `DM ${displayName ? displayName : shortenAddress(props.address)}`)
          }
        </span>
      </button>

      {/* Message Popover */}
      <Popover
        anchorEl={popoverAnchor}
        anchorOrigin={{
          vertical: props.popoverDirection,
          horizontal: "center",
        }}
        className="universal_button_popover"
        style={props.popoverDirection === "bottom" ? {marginTop: 8} : {marginTop: -8}}
        onClose={() => setPopoverAnchor(null)}
        open={
          popoverAnchor !== null && authenticated 
        }
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
          {(wagmiAddress === props.address) ?
          <>
            {/* Recent Messages */}
            <div className="universal_button_popover__content">
            <span className="message_title"> Recent Messages </span>            


            <a href="https://nftychat.xyz" 
              rel="noopener noreferrer"
              target="_blank"
              styel={{ textDecoration: 'none' }}
            >
              <div className="universal_button_popover__subtitle">
                <span className="universal_button_popover__link_text">
                  View All
                </span>
                <img src={logo} alt="Logo" style={{width:24, height:24}}/>
              </div>
            </a>
            </div>
            <div className="message_separator"></div>
            <div className="universal_button_popover__messages">
            {conversations.map((conversation) => (
              <div className="message__container" key={conversation.conversation_id} 
              onClick={() =>{
                window.open("https://nftychat.xyz/dms/"+conversation.conversation_id, "_blank")
              }}>
               <div className="hover_text"> View on nftychat</div> 
                <div className="message_text__container">
                  <span className="message_title"> {conversation.conversation_name}</span>
                  <span className="message_text">{conversation.latest_message_text}</span>
                </div>
                {conversation.unread_message_count > 0 &&
                <div className="message__badge">
                  {conversation.unread_message_count}
                </div>  }
              </div>
            ))}
            </div>

          </>
          :
          <>
            {/* Send Message */}
            <div className="universal_button_popover__content_top">
              <textarea
                className="universal_button_popover__textarea"
                spellCheck={false}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>
            <div className="universal_button_popover__content_bottom">
              <a href="https://nftychat.xyz" 
                    rel="noopener noreferrer"
                    target="_blank"
                    styel={{ textDecoration: 'none' }}
                  >
                  <div className="universal_button_popover__content_left">
                <img src={logo} alt="Logo" style={{width:24, height:24}}/>
                <span className="universal_button_popover__user_text">
                    Sent via nftychat
                </span>
                </div>
                </a>

              {/* Send button */}
              <button
                className="universal_button_popover__send"
                onClick={sendClick}
              >
                <Icon
                  className="universal_button_popover__send_icon"
                  icon="ant-design:send-outlined"
                />
              </button>
            </div>
          </>
        }
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
