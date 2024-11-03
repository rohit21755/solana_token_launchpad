import './App.css'
import { TokenLaunchpad } from './components/TokenLaunchpad'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
function App() {
  const endpoint = 'https://api.devnet.solana.com'
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} >
        <WalletModalProvider>
          <div style={{
            padding: 4,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <WalletMultiButton/>
            <WalletDisconnectButton/>
          </div>
          <TokenLaunchpad/>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
    // <TokenLaunchpad></TokenLaunchpad>
  )
}

export default App
