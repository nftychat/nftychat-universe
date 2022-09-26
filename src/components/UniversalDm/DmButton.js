import React from "react";
import { Icon } from "@iconify/react";
import Popover from "@mui/material/Popover";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAccount, useSignMessage } from "wagmi";
import { ReactComponent as Logo } from "../../assets/images/bestagon_circle.svg";

export default function DmButton(props) {
  const { address: wagmiAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [numberOfNotifications, setNumberOfNotifications] = useState(0);
  const mainUrl = "https://nftychat.xyz";
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
        setNumberOfNotifications(data);
      });
  }, [props.address]);


  // useEffect to close popover if user is same as props.address
  useEffect(() => {
    if (props.address === wagmiAddress){
      setPopoverAnchor(null); 
    }
  }, [props.address, wagmiAddress])

  async function sendClick() {
    let tempAccessToken = accessToken;
    if (accessToken === null) {
      const message_response = await fetch(
        mainUrl +
          "/v1/siwe_message?address=" +
          wagmiAddress,
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
          <div className="relative">
            {/* Activation button */}
            <button
              className="flex items-center justify-center gap-2 rounded-full bg-white py-2 px-4 text-[#467EE5] shadow-md transition-colors hover:bg-gray-50"
              type="button"
              onClick={(event) => {
                if (wagmiAddress === props.address){
                  window.open('https://nftychat.xyz/dms', '_blank');
                } else {
                  if (!wagmiAddress) {
                    openConnectModal();
                  }
                  setPopoverAnchor(event.currentTarget);
                }
              }}
            >
              {/* Icon */}
              <div className="relative flex h-6 w-6 items-center justify-center">
                {numberOfNotifications > 0 && (
                  <div className="debug absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#FA2449] text-[10px] text-white">
                    {numberOfNotifications}
                  </div>
                )}
                <Icon
                  className="h-full w-full"
                  icon="ant-design:message-outlined"
                />
              </div>

              {/* Text */}
              <span className="text-base">{wagmiAddress === props.address ? "Check Messages" : `DM ${props.displayName}`}</span>
            </button>

            <Popover
              anchorEl={popoverAnchor}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              className="popover"
              onClose={() => setPopoverAnchor(null)}
              open={popoverAnchor !== null && ![null, undefined].includes(wagmiAddress)}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
            >
              <div className="flex w-96 flex-col bg-white px-4 pt-4 pb-2">
                <textarea
                  className="mb-1.5 min-h-[66px] resize-none rounded-md border border-solid border-gray-200 p-2 text-[#467EE5] outline-none transition-colors focus:border-gray-300"
                  spellCheck={false}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <div className=" flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Logo />
                    <span className="text-[#B58FD9]">Sent via nfty chat</span>
                  </div>
                  {/* Send button */}
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full p-1.5 text-[#B58FD9] transition-colors hover:bg-gray-50"
                    onClick={sendClick}
                  >
                    <Icon
                      className="h-full w-full"
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
