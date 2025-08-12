// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ShootingLeaderboard {
    struct Score {
        address player;
        uint256 points;
        uint256 timestamp;
    }

    mapping(address => uint256) public highScores;
    Score[] public topScores;

    // Guarda el puntaje sólo si es el mejor del jugador
    function saveScore(uint256 points) public {
        require(points > 0, "Score must be positive");
        // Solo actualizar si el score es mejor que el anterior de ese jugador
        if(points > highScores[msg.sender]) {
            highScores[msg.sender] = points;
            // Añadimos al array para el historial, se puede usar para el leaderboard topN
            topScores.push(Score(msg.sender, points, block.timestamp));
        }
    }

    // Devuelve los últimos 'limit' scores registrados (orden inverso: más reciente primero)
    function getTopScores(uint256 limit) external view returns (Score[] memory) {
        uint count = topScores.length > limit ? limit : topScores.length;
        Score[] memory tops = new Score[](count);

        for(uint i = 0; i < count; i++) {
            tops[i] = topScores[topScores.length - 1 - i];
        }
        return tops;
    }

    // (Opcional) Devuelve el high-score de un jugador específico
    function getMyHighScore(address player) public view returns (uint256) {
        return highScores[player];
    }
}