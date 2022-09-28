import { MetaMaskConnector } from 'wagmi/connectors/metaMask'

import { Toaster } from "react-hot-toast";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import DmButton from "./DmButton";

const { chains, provider } = configureChains(
  [chain.mainnet, chain.polygon, chain.optimism, chain.arbitrum],
  [publicProvider()]
);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [new MetaMaskConnector({ chains })],
  provider,
});

export default function UniversalDm(props) {
  return (
    <WagmiConfig client={wagmiClient}>
      <Toaster />
      <DmButton
        address={props.address}
        displayName={props.displayName}
      />
    </WagmiConfig>
  );
}
