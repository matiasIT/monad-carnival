import React from "react";

export default function PlayButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer"
    }}>
      {/* Puedes poner una imagen propia */}
      <img src="/assets/playbtn.png" alt="Jugar" style={{height: 80}} />
    </button>
  );
}