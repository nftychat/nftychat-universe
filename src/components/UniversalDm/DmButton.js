import { Icon } from "@iconify/react";
import Popover from "@mui/material/Popover";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { ReactComponent as Logo } from "../../assets/images/bestagon_circle.svg";

export default function DmButton(props) {
  // Wamgi hooks
  const { address: wagmiAddress } = useAccount();
  const { connect, connectors, error: wagmiError } = useConnect();
  const { signMessageAsync } = useSignMessage();

  // Custom states
  const [numberOfNotifications, setNumberOfNotifications] = useState(0);
  const mainUrl = "https://nftychat-staging.herokuapp.com";
  const [accessToken, setAccessToken] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  // const displayName = "Poapdispenser.eth";
  // const address = "0x11B002247efc78A149F4e6aDc9F143b47bE9123D"

  // UseEffect to warn user on error
  useEffect(() => {
    if (wagmiError) {
      toast.error("Wallet not detected.");
    }
  }, [wagmiError]);

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

  // useEffect to close popover if user is same as props.address
  useEffect(() => {
    if (props.address === wagmiAddress) {
      setPopoverAnchor(null);
    }
  }, [props.address, wagmiAddress]);

  async function sendClick() {
    let tempAccessToken = accessToken;
    if (accessToken === null) {
      const message_response = await fetch(
        mainUrl + "/v1/siwe_message?address=" + wagmiAddress,
        {
          method: "post",
        }
      );
      const data = await message_response.json();
      const login_message = data.login_message;
      const signature = await signMessageAsync({ message: login_message });
      tempAccessToken = await checkSignature(wagmiAddress, signature);
    }

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
    setAccessToken(loginData["token"]);
    return loginData["token"];
  }

  return (
    <div className="universal_button">
      {/* Activation button */}
      <button
        className="universal_button__button"
        type="button"
        onClick={(event) => {
          if (wagmiAddress === props.address) {
            window.open("https://nftychat.xyz/dms", "_blank");
          } else {
            if (!wagmiAddress) {
              try {
                const connector = connectors[0];
                connect({ connector });
              } catch (error) {
                console.log(error);
              }
            }
            setPopoverAnchor(event.currentTarget);
          }
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
          {wagmiAddress === props.address
            ? "Check Messages"
            : `DM ${props.displayName}`}
        </span>
      </button>

      <Popover
        anchorEl={popoverAnchor}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        className="universal_button_popover"
        onClose={() => setPopoverAnchor(null)}
        open={
          popoverAnchor !== null && ![null, undefined].includes(wagmiAddress)
        }
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <div className="universal_button_popover__container">
          <textarea
            className="universal_button_popover__textarea"
            spellCheck={false}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <div className="universal_button_popover__content">
            <div className="universal_button_popover__content_left">
              <Logo />
              <span className="universal_button_popover__user_text">
                Sent via nfty chat
              </span>
            </div>
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
        </div>
      </Popover>
    </div>
  );
}
