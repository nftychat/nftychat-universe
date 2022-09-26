import { createPortal } from "react-dom";
import React from "react";

export default function ModalConnect(props) {
  return createPortal(
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {/* Context */}
      <div className="pointer-events-auto flex w-full max-w-lg flex-col items-center justify-center rounded bg-white p-8">
        <button
          className="rounded border border-solid border-gray-400 bg-white px-3 py-1 font-medium transition-colors hover:bg-gray-50"
          onClick={null}
        >
          Connect
        </button>
      </div>
      {/* Overlay */}
      <div
        className="pointer-events-auto absolute inset-0 -z-10 cursor-pointer bg-black opacity-50"
        onClick={() => {
          props.setModalController((prev) => {
            // 👇️ remove target key from object
            const { modal_connect, ...rest } = prev;

            return rest;
          });
        }}
      ></div>
    </div>,
    document.getElementById("portal")
  );
}
