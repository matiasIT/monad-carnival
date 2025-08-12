import React from "react";

export default function Leaderboard({ leaderboard, onClose }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(22, 24, 36, 0.93)",
      color: "#fff",
      padding: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "auto",
      backdropFilter: "blur(1.7px)"
    }}>
      <div style={{
        background: "rgba(250,251,253,0.97)",
        borderRadius: 18,
        minWidth: 330,
        maxWidth: 440,
        minHeight: 390,
        boxShadow: "0 8px 35px #1119",
        margin: 18,
        padding: 42,
        textAlign: "center",
        position: "relative"
      }}>
        <button onClick={onClose}
          style={{
            position: "absolute",
            right: 21, top: 13,
            background: "#fce2ea", color: "#C21835",
            border: "none", borderRadius: 8,
            fontWeight: 700, padding: "6px 13px",
            fontSize: 15, cursor: "pointer"
          }}
        >Cerrar</button>
        <div style={{
          fontWeight: 700, fontSize: 27,
          color: "#23253c", marginBottom:18,
          letterSpacing:1.2, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <span style={{fontSize:29,marginRight:9}}>👑</span>
          Top 100 - Leaderboard
        </div>
        <ol style={{
          listStyle: "none", padding: 0, margin: 0, textAlign: 'left'
        }}>
          {leaderboard.map((entry, i) => {
            // TOP 3
            let bg, border, clr, medal, numElem, textGlow, scoreGlow;
            if (i === 0) {
              // 🥇 oro
              bg = "linear-gradient(90deg,#fffde7 65%,#fff9c6 99%)";
              border = "2.2px solid #fbed86";
              clr = "#b89a16";
              medal = "🥇";
              numElem = <span style={{fontSize: 23, marginRight: 8}}>{medal}</span>;
              textGlow = "0 0 7px #fbed9a";
              scoreGlow = "0 0 8px #fffac0";
            } else if (i === 1) {
              // 🥈 plata: fondo muy claro con borde brillante y más glow
              bg = "linear-gradient(90deg,#eef4f9 70%,#dbecfd 100%)";
              border = "2.2px solid #c9d5e4";
              clr = "#7d8892";
              medal = "🥈";
              numElem = <span style={{fontSize: 23, marginRight: 8}}>{medal}</span>;
              textGlow = "0 0 9px #e4ebf7";
              scoreGlow = "0 0 8px #d2e3fa";
            } else if (i === 2) {
              // 🥉 bronce: fondo más intenso, borde anaranjado y glow
              bg = "linear-gradient(90deg,#f7e1cd 72%,#ffd2a7 100%)";
              border = "2.2px solid #d89b5b";
              clr = "#b87b3b";
              medal = "🥉";
              numElem = <span style={{fontSize: 23, marginRight: 8}}>{medal}</span>;
              textGlow = "0 0 8px #ffe4b0";
              scoreGlow = "0 0 7px #ffcf8a";
            } else {
              bg = i % 2 ? "#f6f7fb" : "transparent";
              border = "none";
              clr = "#23253c";
              medal = "";
              numElem = <span style={{
                display: "inline-block", minWidth: 27,
                textAlign: "right", fontWeight: 700,
                color: "#7a7d89", fontSize: 18,
                marginRight: 9
              }}>{i+1}.</span>;
              textGlow = "none";
              scoreGlow = "none";
            }
            return (
              <li key={i} style={{
                background: bg,
                border: border,
                color: clr,
                borderRadius: 11,
                fontWeight: 800,
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                padding: "12px 20px",
                margin: "0 0 10px 0",
                boxShadow: i < 3 ? "0 0 18px 0 rgba(250,220,75, 0.10)" : "none",
                transition: "box-shadow 0.3s"
              }}>
                {/* Solo el número/medalla según corresponda */}
                {numElem}
                <span style={{ 
                  fontFamily: "monospace", fontSize: 15, fontWeight:700, 
                  textShadow: textGlow 
                }}>
                  {entry.player.slice(0, 8)}...{entry.player.slice(-4)}
                </span>
                <span style={{
                  marginLeft: "auto",
                  minWidth: 48,
                  fontSize: 18,
                  fontWeight: 900,
                  color: clr,
                  textShadow: scoreGlow
                }}>{entry.points}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}