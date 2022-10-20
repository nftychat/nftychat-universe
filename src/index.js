import React from "react";
import ReactDOM from "react-dom/client";
import {UniversalDm} from "./components/index.js";

// Params
// sampleAddress is the user we're messaging 
// const sampleAddress = '0x11B002247efc78A149F4e6aDc9F143b47bE9123D'
const sampleAddress = '0xB56c077D106b45D27D86D6F1d820acD3cD2Bed3e'
// optional param
// const sampleDisplayName = 'Poapdispenser.eth'

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <div style={{padding: 300}}>
    <UniversalDm
      address={sampleAddress}
      theme='light'
      popoverDirection='bottom'
    />
    </div>
  </React.StrictMode>
);