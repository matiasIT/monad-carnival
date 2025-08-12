import React from "react";

// Cambia esta ruta por la de tu imagen real:
const portada = "/assets/bienvenida.png";

export default function ConnectWallet({ onConnect }) {
  return (
    <div style={{
      minHeight: "88vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f6f8fa"
    }}>
      {/* IMAGEN DE BIENVENIDA */}
      <img
        src={portada}
        alt="Bienvenida"
        style={{
          width: "min(500px, 90vw)",
          maxWidth: "100vw",
          border: "none",
          background: "none",
          marginBottom: -25,
          marginTop: -40,
        }}
      />
      {/* BOTÓN CHECK-IN */}
      <button
      onClick={onConnect}
      style={{
      background: "none",
      border: "none",
      outline: "none",
      padding: 0,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
      }}
      >
    <img
      src="/assets/start.png"
      alt="Check-in"
      style={{
        height: 150, // o el tamaño que quieras
        width: 250,  // opcional
        display: "block"
      }}
    />
      </button>
    </div>
  );
}