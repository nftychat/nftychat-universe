import React from "react";
import { Popover } from "@mui/material";
import { useAccount } from "wagmi";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function DmButtonPopover(props) {
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const { address: wagmiAddress } = useAccount();

  return (
    <>
      {props.AddOnType === "div" ? (
        <>{props.children}</>
      ) : (
        <>
          {/* Activation button */}
          <button
            className="universal_button__button"
            type="button"
            onClick={(event) => {
              setPopoverAnchor(event.currentTarget);
            }}
          >
            {/* Icon */}
            <div className="universal_button__icon_container">
              {props.numberOfNotifications > 0 && (
                <div className="universal_button__badge">
                  {props.numberOfNotifications}
                </div>
              )}
              <Icon
                className="universal_button__icon"
                icon="ant-design:message-outlined"
              />
            </div>

            {/* Text */}
            {wagmiAddress === props.address ? (
              <span className="universal_button__text">Recent Messages</span>
            ) : (
              <span className="universal_button__text">
                {props.displayText}
              </span>
            )}
          </button>

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
            open={popoverAnchor !== null}
            transformOrigin={{
              vertical: props.popoverDirection === "bottom" ? "top" : "bottom",
              horizontal: "center",
            }}
          >
            {props.children}
          </Popover>
        </>
      )}
    </>
  );
}
