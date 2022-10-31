import { Toaster } from "react-hot-toast";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { publicProvider } from "wagmi/providers/public";
import DmButton from "./DmButton";
import "./UniversalDm.css";
import { infuraProvider } from "wagmi/providers/infura";

const infuraId = "806586b223e14b3eb1e6e4285bf8240e";

const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygon, chain.optimism, chain.arbitrum],
  [publicProvider(), infuraProvider({ infuraId: infuraId })]
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
        displayName={props.displayName}
        theme={props.theme || "light"}
        popoverDirection={props.popoverDirection || "top"}
      />
    </WagmiConfig>
  );
}
