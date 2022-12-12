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
// import bestagonSuccessImg from "../../assets/images/bestagonSuccess.png";

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
  const [userName, setUserName] = useState("");
  const [messages, setMessages] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);

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


  // badge of unread messages
  // TODO
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

  async function getMessages() {
    const tempAccessToken = await getAccessToken();
    fetch(mainUrl + "/v1/messages?", {
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
        // set messages
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

      {/* Chat Popover */}
      <Popover
        anchorEl={popoverAnchor}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        className="chat_popover"
        style={
          {marginTop: -8 }
        }
        onClose={() => setPopoverAnchor(null)}
        open={popoverAnchor !== null}
        transformOrigin={{
          vertical: "bottom",
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
