// src/components/Navbar.js
import React, { useState } from "react";

export default function Navbar({
  wallet,
  onConnect,
  onDisconnect,
  musicVolume,
  setMusicVolume,
  paused,
  onPause,
  onResume
}) {
  const [copied, setCopied] = useState(false);

  // Copiar dirección
  const handleCopy = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      height: 56,
      background: "rgba(34,37,53,0.92)",
      backdropFilter: "blur(6px)",
      zIndex: 1000,
      borderBottom: "2px solid #252939"
    }}>
      {/* IZQUIERDA: CONTROLES JUEGO */}
      <div style={{display:"flex", alignItems:"center", marginLeft: "16px", gap:16}}>
        <button
          onClick={paused ? onResume : onPause}
          style={{
            fontSize: 21,
            border: "none",
            background: paused ? "#c0dbdb" : "#ebffe6",
            color: "#222",
            padding: "5px 12px",
            borderRadius: 7,
            marginRight: 8,
            cursor: "pointer"
          }}
        >
          {paused ? "▶️ Reanudar" : "⏸️ Pausa"}
        </button>
        <div style={{display:"flex", alignItems:"center"}}>
          <span style={{fontSize: 18, marginRight:4}}>🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={musicVolume}
            onChange={e => setMusicVolume(Number(e.target.value))}
            style={{ width: 80, verticalAlign: "middle" }}
          />
        </div>
      </div>

      {/* DERECHA: CONTROLES WALLET */}
      <div style={{display:"flex", alignItems:"center", marginRight:"19px", gap:"8px"}}>
        {!wallet ? (
          <button
            onClick={onConnect}
            style={{
              fontSize: 20,
              padding: "8px 22px", borderRadius: 8,
              border: "1.5px solid #ffaa52",
              background: "linear-gradient(90deg,#ffcc81,#ffe6c2 100%)",
              color: "#765100",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >Conectar Wallet</button>
        ) : (
          <>
            <span
              style={{
                fontSize:18,
                background:"#eaf9ff", color:"#225", borderRadius:6,
                padding:"3px 10px", marginRight:0, cursor:"pointer"
              }}
              onClick={handleCopy}
              title={wallet}
            >🦊 {wallet.slice(0,8)}...{wallet.slice(-4)}</span>
            <button
              onClick={onDisconnect}
              style={{
                marginLeft:7, fontSize:16, background:"none",
                border:"1px solid #fe9797", color:"#a4443e",
                borderRadius:5, padding:"2px 12px", cursor:"pointer"
              }}
            >Desconectar</button>
            {copied && <span style={{fontSize:15, color:"#0a6", marginLeft:5}}>¡Copiado!</span>}
          </>
        )}
      </div>
    </div>
  );
}