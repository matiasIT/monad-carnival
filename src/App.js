import React, { useState, useRef } from "react";
import ConnectWallet from "./components/ConnectWallet.js";
import Game from "./components/Game.js";
import Navbar from "./components/Navbar.js";
import { ethers } from "ethers";

export default function App() {
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState("");
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [paused, setPaused] = useState(false);
  const [readyForGame, setReadyForGame] = useState(false);

  // Función propia para conectar que será pasada al Navbar y a ConnectWallet
  const handleConnect = async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: "0x279F",
          chainName: "Monad Testnet",
          nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
          rpcUrls: ["https://testnet-rpc.monad.xyz"],
          blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
        }]
      });
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setProvider(provider);
      setAddress(address);
    } catch (err) {
      alert("Error conectando wallet: " + err.message);
    }
  } else {
    alert("Instala Metamask para jugar (desktop o móvil)");
  }
};

  const handleDisconnect = () => {
    setProvider(null);
    setAddress("");
  };

  return (
    <div style={{paddingTop:56, minHeight:"100vh", background:"#f6f8fa"}}>
      <Navbar
        wallet={address}
        onConnect={handleConnect} // Cambia para tu setup
        onDisconnect={handleDisconnect}
        musicVolume={musicVolume}
        setMusicVolume={setMusicVolume}
        paused={paused}
        onPause={() => setPaused(true)}
        onResume={() => setPaused(false)}
      />
      {/* Cambia render condicional para mostrar ConnectWallet sólo si no hay provider ni address */}
      {(!provider || !address) ? (
  // Si NO hay wallet, muestra la portada (conecta desde Navbar)
  <ConnectWallet onConnect={() => {}} /> 
) : !readyForGame ? (
  // Si hay wallet pero no hizo check-in, muestra sólo portada (sin botón wallet, solo Check-in)
  <ConnectWallet onConnect={() => setReadyForGame(true)} /> 
) : (
  // Si hay wallet Y dio check-in, muestra el juego
  <Game
    provider={provider}
    address={address}
    musicVolume={musicVolume}
    paused={paused}
    setPaused={setPaused}
  />
)}
    </div>
  );
}