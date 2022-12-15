import { Toaster } from "react-hot-toast";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import DmButton from "./DmButton.js";
import "./UniversalDm.css";
import { infuraProvider } from "wagmi/providers/infura";
import { alchemyProvider } from 'wagmi/providers/alchemy'

const infuraId = "806586b223e14b3eb1e6e4285bf8240e";
const alchemyKey = "zlvaztiS9mtCfBps34F7pqBQdOWzv3_l";

const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygon, chain.optimism, chain.arbitrum],
  [alchemyProvider({apiKey: alchemyKey}), infuraProvider({ infuraId: infuraId })]
);

const defaultWagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "nftychat",
      },
    }),
  ],
  provider,
});

export default function UniversalDm(props) {
  return (
    <WagmiConfig client={defaultWagmiClient}>
      <Toaster />
      <DmButton
        address={props.address}
        displayText={props.displayText}
        displayName={props.displayName}
        theme={props.theme || "light"}
        popoverDirection={props.popoverDirection || "top"}
        connectWalletFunction={props.connectWalletFunction}
      />
    </WagmiConfig>
  );
}
