import React, { useRef, useEffect, useReducer } from "react";
import { ethers } from "ethers";
import PlayButton from "./PlayButton";
import Leaderboard from "./Leaderboard";


// ---- CONFIGURACIÓN DE SPRITES Y ASSETS ----
const goodImages = [
  "/assets/good1.png", "/assets/good2.png"
];
const badImages = [
  "/assets/bad1.png", "/assets/bad2.png"
];
const backgroundImg = "/assets/background.png";
const musicFile = "/assets/circus.mp3";

// ---- SMART CONTRACT ----
const CONTRACT_ADDRESS = "0x91489A58326b88aE2d553a9A6a89306d3e4Afc47";
const ABI = [ {
			"inputs": [
				{
					"internalType": "address",
					"name": "player",
					"type": "address"
				}
			],
			"name": "getMyHighScore",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "limit",
					"type": "uint256"
				}
			],
			"name": "getTopScores",
			"outputs": [
				{
					"components": [
						{
							"internalType": "address",
							"name": "player",
							"type": "address"
						},
						{
							"internalType": "uint256",
							"name": "points",
							"type": "uint256"
						},
						{
							"internalType": "uint256",
							"name": "timestamp",
							"type": "uint256"
						}
					],
					"internalType": "struct ShootingLeaderboard.Score[]",
					"name": "",
					"type": "tuple[]"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "",
					"type": "address"
				}
			],
			"name": "highScores",
			"outputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "points",
					"type": "uint256"
				}
			],
			"name": "saveScore",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "uint256",
					"name": "",
					"type": "uint256"
				}
			],
			"name": "topScores",
			"outputs": [
				{
					"internalType": "address",
					"name": "player",
					"type": "address"
				},
				{
					"internalType": "uint256",
					"name": "points",
					"type": "uint256"
				},
				{
					"internalType": "uint256",
					"name": "timestamp",
					"type": "uint256"
				}
			],
			"stateMutability": "view",
			"type": "function"
		}
 ];

// ---- POSICIONES ----
const ROWS = [
  { y: 680, scale: 1.5, slots: [230, 440, 640, 840, 1040] },
  { y: 480, scale: 1.25, slots: [350, 500, 650, 800, 950] },
  { y: 280, scale: 1.1, slots: [400, 530, 650, 770, 890] },
];

const LEVELS = [
  { name: "Fácil",     objLife: 2500, spawnGap: 3500 },
  { name: "Normal",    objLife: 2000, spawnGap: 3000 },
  { name: "Difícil",   objLife: 1500, spawnGap: 2500 },
];

const TARGET_BASE_SIZE = 90;
const GAME_DURATION = 30;

// ---- REDUCER & STATE ----
const initialState = {
  playing: false,
  timer: GAME_DURATION,
  targets: [],
  score: 0,
  canPlay: false,
  leaderboard: [],
  showLeaderboard: false,
  level: 0,
  hasStarted: false,
  toast: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case "RESET_GAME":
      return {
        ...state,
        score: 0,
        timer: GAME_DURATION,
        targets: [],
        playing: true,
        hasStarted: true,
        showLeaderboard: false,
        level: 0, 
      };
    case "SET_CANPLAY":
      return { ...state, canPlay: action.payload, hasStarted: false };
    case "SET_HASSTARTED":
      return { ...state, hasStarted: action.payload };
    case "SET_PLAYING":
      return { ...state, playing: action.payload };
    case "SET_TIMER":
      return { ...state, timer: action.payload };
    case "SET_TARGETS":
      return { ...state, targets: action.payload };
    case "SET_SCORE":
      return { ...state, score: action.payload };
    case "INCREMENT_SCORE":
      return { ...state, score: state.score + action.payload };
    case "DECREMENT_SCORE":
      return { ...state, score: state.score - action.payload };
    case "SET_LEVEL":
      return { ...state, level: action.payload };
    case "SHOW_LEADERBOARD":
      return { ...state, showLeaderboard: true };
    case "HIDE_LEADERBOARD":
      return { ...state, showLeaderboard: false };
    case "SET_LEADERBOARD":
      return { ...state, leaderboard: action.payload };
    case "SHOW_TOAST":
      return { ...state, toast: action.payload };
    case "HIDE_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}

// ---- CREACIÓN DE TARGETS ----
function randomTarget(rowIdx, x, y, scale, maxLifetime) {
  const kind = Math.random() > 0.5 ? "good" : "bad";
  const imagesArr = kind === "good" ? goodImages : badImages;
  const imgFile = imagesArr[Math.floor(Math.random() * imagesArr.length)];
  return {
    x,
    y,
    kind,
    img: imgFile,
    appearedAt: Date.now(),
    size: TARGET_BASE_SIZE * scale,
    scale,
    visible: true,
    lift: 0,
    down: false,
    maxLifetime,
    rowIdx,
    slotId: x,
    id: Math.random().toString(36).substr(2, 9) + Date.now(),
  };
}

export default function Game({ provider, address, musicVolume = 0.3, paused = false, setPaused }) {
  const canvasRef = useRef(null);
  const musicRef = useRef(null);
  const shootSoundRef = useRef(null);
  const [shots, setShots] = React.useState([]);
  const targetsRef = useRef([]);
  const lastFrameTimeRef = useRef(performance.now());
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Contrato
  const contract = React.useMemo(() =>
    provider ? new ethers.Contract(CONTRACT_ADDRESS, ABI, provider.getSigner()) : null,
    [provider]
  );

  // ---- ANIMACIÓN Y DRAW ----
  useEffect(() => {
    if (!state.playing || !state.canPlay) return;
    let frame;
    const imgCache = {};
    [...goodImages, ...badImages].forEach(src => {
      const img = new window.Image();
      img.src = src;
      imgCache[src] = img;
    });
    const bg = new window.Image();
    bg.src = backgroundImg;

    // Sincroniza ref al inicio si hace falta
    if (
      targetsRef.current.length !== state.targets.length ||
      !targetsRef.current.every((t, i) => t.id === state.targets[i]?.id)
    ) {
      targetsRef.current = state.targets.map(tg => ({ ...tg }));
    }

    function draw() {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, 1403, 1024);
      if (bg.complete && bg.naturalWidth !== 0) {
        ctx.drawImage(bg, 0, 0, 1403, 1024);
      }
        // CALCULA DELTA TIME, SIEMPRE AQUÍ
      const now = performance.now();
      const delta = Math.min(48, now - lastFrameTimeRef.current); // max lag
      lastFrameTimeRef.current = now;
      const LIFT_UP_PER_MS = [0.0016, 0.0022, 0.0033];   // o tu ajuste por level
      const LIFT_DOWN_PER_MS = [0.002, 0.003, 0.005];
      const upSpeed = LIFT_UP_PER_MS[state.level] * delta;
      const downSpeed = LIFT_DOWN_PER_MS[state.level] * delta;

      let shouldDispatch = false;
      let changedTargets = false;

      targetsRef.current = targetsRef.current.map(tgt => {
        let mod = false;
        let newTgt = { ...tgt };

        if (!tgt.down && Date.now() - tgt.appearedAt >= tgt.maxLifetime) {
          newTgt.down = true;
          mod = true;
        }
        if (!newTgt.down && newTgt.lift < 1) {
          newTgt.lift = Math.min(1, newTgt.lift + upSpeed);
          mod = true;
        }
        if (newTgt.down && newTgt.lift > 0) {
          newTgt.lift = Math.max(0, newTgt.lift - downSpeed);
          mod = true;
        }
        if (newTgt.down && newTgt.lift <= 0.01 && newTgt.visible) {
          newTgt.visible = false;
          shouldDispatch = true;
        }
        if (mod) changedTargets = true;
        return newTgt;
      });

      // Si algún target se volvió invisible (caído) o hubo cambios, notifico al React state
      if (shouldDispatch || changedTargets) {
        dispatch({ type: "SET_TARGETS", payload: [...targetsRef.current] });
      }

      // Renderizar los visibles
      // Renderizar los visibles (ANIMACIÓN RANURA con máscara y ranura línea)
targetsRef.current.forEach(tgt => {
  if (!tgt.visible) return;

  const img = imgCache[tgt.img];
  const x = tgt.x;
  const yRanura = tgt.y;
  const w = tgt.size, h = tgt.size;

  // Movimiento vertical desde ranura
  const raise = h * (1 - tgt.lift);

  // --- 1. DIBUJA OBJETIVO SOLO EN LA PARTE ARRIBA DE LA RANURA (MÁSCARA RECTANGULAR) ---
  ctx.save();
ctx.beginPath();
ctx.rect(x, yRanura, w, h);
ctx.clip();

let pivotX = x + w / 2;
let pivotY = yRanura + raise + h;

if (tgt.down && tgt.isShot) {
  // Efecto puerta hiper-perspectiva y rebote fuerte
  let t = 1 - tgt.lift;

  // Make bounce last 10% of fall (t from 0.9 to 1)
  let localT = t;
  let scaleY = Math.cos(localT * Math.PI / 2); // flat at t=1
  let scaleX = 1;

  // Rebote visible fuerte justo al final
  if (t > 0.93) {
    // Oscillation factor, higher for more visible bounce
    const bounceT = (t - 0.93) / 0.07;
    // Rebote fuerte usando seno, con rápido damping
    scaleY = Math.abs(Math.cos(Math.PI / 2 + 2.8 * bounceT));
    scaleX = 1 + 0.45 * (1 - scaleY); // se ensancha en el rebote
    scaleY = Math.max(scaleY, 0.12);
  } else {
    // Estira horizontalmente mucho a medida que cae
    scaleX = 1 + 0.35 * Math.pow(Math.sin(localT * Math.PI / 2), 1.65);
    // Suaviza el squash
    scaleY = Math.max(scaleY, 0.14);
  }

  ctx.translate(pivotX, pivotY);
  ctx.scale(scaleX, scaleY);

  // Dibuja desde abajo en el centro; la imagen se “acuesta”
  if (img && img.complete && img.naturalWidth !== 0) {
    ctx.drawImage(img, -w / 2, -h, w, h);
  } else {
    ctx.beginPath();
    ctx.ellipse(0, -h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = tgt.kind === "good" ? "green" : "red";
    ctx.fill();
  }
} else {
  ctx.translate(pivotX, pivotY - h);
  if (img && img.complete && img.naturalWidth !== 0) {
    ctx.drawImage(img, -w / 2, 0, w, h);
  } else {
    ctx.beginPath();
    ctx.ellipse(0, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = tgt.kind === "good" ? "green" : "red";
    ctx.fill();
  }
}
ctx.restore();
  });
      setShots(shots => shots.filter(shot => Date.now() - shot.t < 180));
      frame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frame);
  }, [state.playing, state.canPlay, state.targets]);

  // ---- RONDA DE OBJETIVOS ----
  useEffect(() => {
  if (!state.playing) return;
  let interval;

  function ronda() {
    // SOLO los visibles sobreviven
    const sobrevivientes = state.targets.filter(tgt => tgt.visible);

    let nuevos = [];
    for (let row = 0; row < ROWS.length; row++) {
      // SÓLO slots libres del array de sobrevivientes
      const ocupados = sobrevivientes
        .filter(tg => tg.rowIdx === row)
        .map(tg => tg.slotId);

      const libres = ROWS[row].slots.filter(x => !ocupados.includes(x));

      // Cantidad totalmente random, puede ser 0
      const numTargets = Math.floor(Math.random() * (libres.length + 1));
      if (numTargets > 0) {
        // Slots randomizados para la nueva oleada
        const slotsRnd = libres
          .sort(() => Math.random() - 0.5)
          .slice(0, numTargets);
        nuevos = nuevos.concat(
          slotsRnd.map(xPos =>
            randomTarget(
              row,
              xPos,
              ROWS[row].y,
              ROWS[row].scale,
              LEVELS[state.level].objLife
            )
          )
        );
      }
    }

    // 🔑 Nueva oleada: solo sobrevivientes + nuevos
    dispatch({ type: "SET_TARGETS", payload: [...sobrevivientes, ...nuevos] });
  }
  ronda();
  interval = setInterval(ronda, LEVELS[state.level].spawnGap);
  return () => clearInterval(interval);
}, [state.playing, state.level]);

  // ---- TIMER DEL JUEGO ----
  useEffect(() => {
    if (!state.playing) return;
    if (state.timer === 0) {
      dispatch({ type: "SET_PLAYING", payload: false });
      if (musicRef.current) musicRef.current.pause();
    }
    const t = setInterval(() => {
      dispatch({ type: "SET_TIMER", payload: state.timer - 1 });
    }, 1000);
    return () => clearInterval(t);
  }, [state.timer, state.playing]);

  // ---- DISPARO ----
  const handleShoot = e => {
    if (!state.playing) return;
    if (shootSoundRef.current) {
      shootSoundRef.current.currentTime = 0;
      shootSoundRef.current.play();
    }
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // ¡¡Nuevo: calcula coordenadas internas del canvas real!!
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    let impact = false;
    let scoreChange = 0;

    targetsRef.current = targetsRef.current.map(target => {
      if (!target.visible || target.lift < 0.7) return target;
      const easedLift = Math.sin((target.lift * Math.PI) / 2);
      const ty = target.y - 100 * (1 - easedLift);
      const centerX = target.x + target.size / 2;
      const centerY = ty + target.size / 2;
      const dist = Math.sqrt((mouseX - centerX) ** 2 + (mouseY - centerY) ** 2);
      if (dist < target.size / 2) {
        if (target.down) return target;
          impact = true;
    // --- MARCA que fue shot y la animación empezó ---
          if (target.kind === "bad") scoreChange += 1;
          else scoreChange -= 2;
          return { ...target, down: true, isShot: true, shotAt: Date.now() };
        }
      return target;
    });

    if (impact) {
      if (scoreChange > 0) dispatch({ type: "INCREMENT_SCORE", payload: scoreChange });
      else dispatch({ type: "DECREMENT_SCORE", payload: Math.abs(scoreChange) });
      dispatch({ type: "SET_TARGETS", payload: [...targetsRef.current] });
    }
  };

  // ---- MÚSICA ----
  useEffect(() => {
  if (musicRef.current) {
    musicRef.current.volume = musicVolume;
    if (paused) {
      musicRef.current.pause();
    } else if (state.playing && state.canPlay) {
      musicRef.current.play();
    }
  }
  }, [state.playing, state.canPlay, musicVolume, paused]);

  // ---- TRANSACCIÓN DE ENTRADA ----
  const playTransaction = async () => {
    if (!provider || !address) return;
    const signer = provider.getSigner();
    try {
      const tx = await signer.sendTransaction({
        to: address,
        value: ethers.utils.parseEther("0"),
      });
      await tx.wait();
      dispatch({ type: "SET_CANPLAY", payload: true });
      dispatch({ type: "SET_HASSTARTED", payload: false });
    } catch (e) {
      if (e.code === "ACTION_REJECTED") return;
      dispatch({ type: "SHOW_TOAST", payload: "Transaction failed!" });
      setTimeout(() => dispatch({ type: "HIDE_TOAST" }), 2200);
      dispatch({ type: "SET_CANPLAY", payload: false });
    }
  };

  // ---- GUARDAR SCORE ----
  const saveOnchain = async () => {
  if (state.score < 0) {
    dispatch({ type: "SHOW_TOAST", payload: "You can not save negative score. Good luck next time!" });
    setTimeout(() => dispatch({ type: "HIDE_TOAST" }), 2500);
    return;
  }
  if (!contract) return;
  try {
    // Espera la transacción
    const tx = await contract.saveScore(state.score);
    await tx.wait();
    // Si TODO ok, muestra success
    await fetchLeaderboard();
    dispatch({ type: "SHOW_TOAST", payload: "Score saved! 🚀" });
    setTimeout(() => dispatch({ type: "HIDE_TOAST" }), 2200);
  } catch (e) {
    // SOLO sale cartel de éxito si NO falló!
    dispatch({ type: "SHOW_TOAST", payload: "Score saving failed, try again!" });
    setTimeout(() => dispatch({ type: "HIDE_TOAST" }), 2500);
    }
  };

  // ---- LEADERBOARD ----
  const fetchLeaderboard = async () => {
  if (!contract) return;
  try {
    const arr = await contract.getTopScores(100);
    // Filtrar para solo el score más alto por wallet:
    const maxByWallet = {};
    arr.forEach(item => {
      const player = item.player;
      const points = Number(item.points);
      if (!maxByWallet[player] || points > maxByWallet[player].points) {
        maxByWallet[player] = { player, points, timestamp: Number(item.timestamp) };
      }
    });
    const leaderboard = Object.values(maxByWallet)
      .sort((a, b) => b.points - a.points)
      .slice(0, 100);
    dispatch({ type: "SET_LEADERBOARD", payload: leaderboard });
    } catch (e) {
    alert("Error obteniendo leaderboard: " + e.message);
    }
  };

  useEffect(() => {
    if (contract) fetchLeaderboard();
  }, [contract]);

  // ---- REINICIAR PARTIDA ----
  const handlePlay = () => {
    targetsRef.current = [];
    dispatch({ type: "SET_TARGETS", payload: [] }); // Esto borra los objetivos de la UI
    dispatch({ type: "RESET_GAME" });
    if (musicRef.current) {
      musicRef.current.currentTime = 0;
      musicRef.current.play();
    }
  };

  // ---- SUBIR NIVEL ---
  const handleNextLevel = () => {
    dispatch({ type: "SET_LEVEL", payload: Math.min(LEVELS.length - 1, state.level + 1) });
    dispatch({ type: "SET_TIMER", payload: GAME_DURATION });
    dispatch({ type: "SET_TARGETS", payload: [] });
    dispatch({ type: "SET_PLAYING", payload: true });
    if (musicRef.current) {
      musicRef.current.currentTime = 0;
      musicRef.current.play();
    }
  };

  // ---- RENDER ----
  return (
  <div style={{ position: 'relative', width: '100%', margin: 'auto', minHeight: '250px' }}>
    <audio ref={shootSoundRef} src="/assets/shoot.mp3" preload="auto"/>
    <audio src={musicFile} ref={musicRef} loop={true} volume={0.3} />

    {!state.canPlay ? (
      <div style={{ marginTop: 100, textAlign: 'center' }}>
      <button
        onClick={playTransaction}
        style={{
          background: "none",
          border: "none",
          outline: "none",
          cursor: "pointer"
        }}>
        <img
          src="/assets/check-in.png"
          alt="Jugar"
          style={{
            width: 500,
            height: 300,
            display: "block"
        }}
        />
      </button>
      </div>
      ) : !state.hasStarted ? (
        <div style={{ marginTop: 100, textAlign: 'center' }}>
          <button
        onClick={handlePlay}
        style={{
          background: "none",
          border: "none",
          outline: "none",
          cursor: "pointer"
        }}>
        <img
          src="/assets/play.png"
          alt="Jugar"
          style={{
            width: 500,
            height: 300,
            display: "block"
        }}
        />
          </button>
        </div>
      ) : !state.playing ? (
  <div
  style={{
    marginTop: 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 420,
    background: "rgba(255,255,255,0.94)",
    border: "6px solid #dbbbfa",
    borderRadius: 36,
    boxShadow: "0 10px 38px #bdd8f386, 0 2px 8px #f6bbfc65",
    maxWidth: 560,
    margin: "60px auto 0",
    fontFamily: "'Luckiest Guy', 'Comic Sans MS', cursive, sans-serif",
    position: "relative",
    padding: "36px 38px 28px 38px" // <--- ESPACIADO ADICIONAL INTERNO
  }}
>
  {/* PUNTUACION Y NIVEL EN FILA */}
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 42, color: "#ad74e5", letterSpacing: 2, marginBottom: 10, textShadow: "0 3px 8px #dec8ff"
  }}>
      <span role="img" aria-label="star" style={{marginRight:10}}>🌟</span>
      Puntuación Final: <span style={{ color: "#4d49af", marginLeft: 8, marginRight: 8 }}>{state.score}</span>
      <span style={{ borderLeft:"2px solid #cec6ee", margin: "0 14px", height: 36, display:'inline-block', opacity:0.7 }}></span>
      <span style={{ color: "#6743b3", fontSize: 24 }}>{LEVELS[state.level].name}</span>
  </div>
  {/* FACIL CHICO */}
  <div style={{
      color:"#6743b3", marginBottom: 6, fontWeight: 400, minHeight: 23,
      fontSize: 20, letterSpacing:1.1
  }}>{LEVELS[state.level].name}</div>
  <div style={{
      fontSize: 22,
      marginTop: 2,
      marginBottom: 40,
      color: "#aa86be",
      textShadow: "0 1px 3px #fff9"
    }}>
      ¡Gran trabajo! ¿Qué quieres hacer?
  </div>

  <div style={{
      display: "flex",
      gap: 24,
      marginBottom: 35,
      justifyContent:'center',
      width:"100%"
  }}>
    <button className="carnival-btn" onClick={handlePlay}>Jugar de nuevo</button>
    <button className="carnival-btn" onClick={saveOnchain}>Guardar Score</button>
    <button className="carnival-btn" onClick={() => dispatch({ type: 'SHOW_LEADERBOARD' })}>Leaderboard</button>
  </div>

  <div style={{ margin: "18px 0", textAlign:'center' }}>
    <button
      className="carnival-btn-secondary"
      style={{
        opacity: state.level === LEVELS.length - 1 ? 0.6 : 1,
        pointerEvents: state.level === LEVELS.length - 1 ? 'none' : 'auto'
      }}
      onClick={handleNextLevel}
      disabled={state.level === LEVELS.length - 1}
    >
      Siguiente Nivel
    </button>
    <div style={{ fontSize: 20, marginTop: 16, color: "#937d97", fontWeight: 'bold' }}>
      Nivel actual: <span style={{ color: "#6743b3" }}>{LEVELS[state.level].name}</span>
    </div>
  </div>
    {state.showLeaderboard && (
    <Leaderboard
      leaderboard={state.leaderboard}
      onClose={() => dispatch({ type: 'HIDE_LEADERBOARD' })}
    />
    )}
  </div>
  ) : (
      // 🎯 === AQUÍ ESTÁ EL CANVAS RESPONSIVE ===
      <div
        style={{
        textAlign: "center",
        position: "relative",
        width: "100%",
        maxWidth: "900px",
        aspectRatio: "1403 / 1024",
        margin: "0 auto"
      }}
>
    {/* CANVAS */}
    <canvas
    ref={canvasRef}
    width={1403}
    height={1024}
    onClick={handleShoot}
    style={{
    width: "100%",
    height: "auto",
    border: "4px solid #222",
    boxShadow: "0 0 12px #2226",
    display: "block",
    background: "black",
    cursor: state.playing 
      ? 'url("/assets/crosshair.png") 32 32, crosshair' // Cambia "32 32" por la mitad de tu imagen
      : 'pointer'
  }}
  />

  {/* UI OVERLAY */}
  <div
    style={{
      position: "absolute",
      top: "10%",
      right: "2%",
      background: "rgba(18,18,25,0.82)",
      borderRadius: "16px",
      padding: "10px 18px",
      color: "white",
      fontSize: "min(4vw, 22px)",
      fontWeight: "bold",
      letterSpacing: 1.1,
      boxShadow: "0 2px 10px #2226",
      zIndex: 7,
      pointerEvents: "none"
    }}
  >
    <span>🕑 {state.timer}s</span> <span style={{ margin: "0 20px" }}>|</span>
    <span>🎯 {state.score}</span> <span style={{ margin: "0 20px" }}>|</span>
    <span>{LEVELS[state.level].name}</span>
    </div>
  </div>
    )}
    {state.toast && (
    <div style={{
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(36,48,68,0.98)",
    color: "#fff",
    borderRadius: 12,
    padding: "20px 38px",
    fontWeight: 700,
    fontSize: 18,
    boxShadow: "0 8px 22px #000b",
    zIndex: 13000,
    border: "2.2px solid #40b4b4",
    letterSpacing: "0.12em",
    minWidth: 240,
    textAlign: "center"
    }}>
    {state.toast}
    </div>
  )}
    </div>
  );
}