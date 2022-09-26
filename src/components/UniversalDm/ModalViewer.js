import React from "react";
import { useState } from "react";
import ModalConnect from "./ModalConnect";

export default function ModalViewer() {
  const [modalController, setModalController] = useState({
    example_modal: null,
  });

  function handleModalConnect() {
    setModalController((prev) => ({ ...prev, modal_connect: null }));
  }

  return (
    <>
      <button
        className="mt-8 rounded border border-solid border-gray-400 bg-white px-3 py-1 font-medium transition-colors hover:bg-gray-50"
        onClick={handleModalConnect}
      >
        Toggle connect modal
      </button>

      {"modal_connect" in modalController && (
        <ModalConnect setModalController={setModalController} />
      )}
    </>
  );
}
