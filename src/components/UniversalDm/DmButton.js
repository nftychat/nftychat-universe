import { css } from "@emotion/css";
import { Icon } from "@iconify/react";
import Popover from "@mui/material/Popover";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAccount, useSignMessage } from "wagmi";
import { ReactComponent as Logo } from "../../assets/images/bestagon_circle.svg";

export default function DmButton(props) {
  const { address: wagmiAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [numberOfNotifications, setNumberOfNotifications] = useState(0);
  const mainUrl = "https://nftychat-staging.herokuapp.com";
  const [accessToken, setAccessToken] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  // const displayName = "Poapdispenser.eth";
  // const address = "0x11B002247efc78A149F4e6aDc9F143b47bE9123D"

  useEffect(() => {
    fetch(mainUrl + "/v1/unread_message_count?address=" + props.address, {
      method: "get",
    })
      .then((payload) => {
        return payload.json();
      })
      .then((data) => {
        console.log(data);
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
    <ConnectButton.Custom>
      {({ openConnectModal }) => {
        return (
          <div
            className={css`
              position: relative;
            `}
          >
            {/* Activation button */}
            <button
              className={css`
                align-items: center;
                background-color: white;
                border-radius: 9999px;
                border: none;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1),
                  0 2px 4px -2px rgb(0 0 0 / 0.1);
                color: #467ee5;
                cursor: pointer;
                display: flex;
                font-family: Inter, sans-serif;
                gap: 8px;
                justify-content: center;
                padding: 8px 16px;
                transition: color 200ms, background-color 200ms;
                &:hover {
                  background-color: #f9fafb;
                }
              `}
              type="button"
              onClick={(event) => {
                if (wagmiAddress === props.address) {
                  window.open("https://nftychat.xyz/dms", "_blank");
                } else {
                  if (!wagmiAddress) {
                    openConnectModal();
                  }
                  setPopoverAnchor(event.currentTarget);
                }
              }}
            >
              {/* Icon */}
              <div
                className={css`
                  align-items: center;
                  display: flex;
                  height: 24px;
                  justify-content: center;
                  position: relative;
                  width: 24px;
                `}
              >
                {numberOfNotifications > 0 && (
                  <div
                    className={css`
                      align-items: center;
                      background-color: #fa2449;
                      border-radius: 9999px;
                      color: white;
                      display: flex;
                      font-size: 10px;
                      height: 14px;
                      justify-content: center;
                      position: absolute;
                      right: -4px;
                      top: -4px;
                      width: 14px;
                    `}
                  >
                    {numberOfNotifications}
                  </div>
                )}
                <Icon
                  className={css`
                    height: 100%;
                    width: 100%;
                  `}
                  icon="ant-design:message-outlined"
                />
              </div>

              {/* Text */}
              <span
                className={css`
                  font-size: 16px;
                  font-weight: 400;
                `}
              >
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
              className={css`
                border-radius: 6px;
                margin-top: 8px;
              `}
              onClose={() => setPopoverAnchor(null)}
              open={
                popoverAnchor !== null &&
                ![null, undefined].includes(wagmiAddress)
              }
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
            >
              <div
                className={css`
                  background-color: white;
                  display: flex;
                  flex-direction: column;
                  padding: 16px 16px 8px 16px;
                  width: 384px;
                `}
              >
                <textarea
                  className={css`
                    border-radius: 6px;
                    border: solid #e2e8f0 1px;
                    color: #467ee5;
                    font-family: Inter, sans-serif;
                    font-size: 1rem;
                    margin-bottom: 6px;
                    min-height: 66px;
                    outline: none;
                    padding: 8px;
                    resize: none;
                    transition: color 200ms, background-color 200ms;
                    &:focus {
                      border-color: #cbd5e1;
                    }
                  `}
                  spellCheck={false}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <div
                  className={css`
                    align-items: center;
                    display: flex;
                    justify-content: space-between;
                  `}
                >
                  <div
                    className={css`
                      align-items: center;
                      display: flex;
                      gap: 8px;
                    `}
                  >
                    <Logo />
                    <span
                      className={css`
                        color: #b58fd9;
                        font-family: Inter, sans-serif;
                        font-size: 16px;
                      `}
                    >
                      Sent via nfty chat
                    </span>
                  </div>
                  {/* Send button */}
                  <button
                    className={css`
                      align-items: center;
                      background-color: transparent;
                      border-radius: 9999px;
                      border: none;
                      color: #b58fd9;
                      cursor: pointer;
                      display: flex;
                      height: 32px;
                      justify-content: center;
                      padding: 6px;
                      transition: color 200ms, background-color 200ms;
                      width: 32px;
                      &:hover {
                        background-color: #f9fafb;
                      }
                    `}
                    onClick={sendClick}
                  >
                    <Icon
                      className={css`
                        height: 100%;
                        width: 100%;
                      `}
                      icon="ant-design:send-outlined"
                    />
                  </button>
                </div>
              </div>
            </Popover>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
