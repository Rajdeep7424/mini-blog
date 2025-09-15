import { useState, useCallback, useEffect } from 'react';
import styles from './TicTacToe.module.css';

function TicTacToe() {
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [gameBoard, setGameBoard] = useState(Array(9).fill(''));
  const [gameActive, setGameActive] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, T: 0 });
  const [winningCombo, setWinningCombo] = useState([]);
  const [statusMessage, setStatusMessage] = useState("Player X's turn");

  const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  // Stable win check function
  const checkWin = useCallback((board) => {
    for (const condition of winningConditions) {
      const [a, b, c] = condition;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return condition;
      }
    }
    return null;
  }, []);

  // Stable draw check function
  const checkDraw = useCallback((board) => {
    return board.every(cell => cell !== '') && !checkWin(board);
  }, [checkWin]);

  // Handle game state after board updates
  useEffect(() => {
    const winCombo = checkWin(gameBoard);
    const isDraw = checkDraw(gameBoard);

    if (winCombo) {
      setGameActive(false);
      setScores(prev => ({
        ...prev,
        [currentPlayer]: prev[currentPlayer] + 1
      }));
      setWinningCombo(winCombo);
      setStatusMessage(`Player ${currentPlayer} wins!`);
    } else if (isDraw) {
      setGameActive(false);
      setScores(prev => ({ ...prev, T: prev.T + 1 }));
      setWinningCombo([]);
      setStatusMessage('Game ended in a draw!');
    }
  }, [gameBoard, checkWin, checkDraw, currentPlayer]);

  const handleCellClick = useCallback((index) => {
    if (gameBoard[index] !== '' || !gameActive) return;

    const newBoard = [...gameBoard];
    newBoard[index] = currentPlayer;
    setGameBoard(newBoard);

    // Switch player immediately after a valid move
    setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
    setStatusMessage(`Player ${currentPlayer === 'X' ? 'O' : 'X'}'s turn`);
  }, [gameBoard, gameActive, currentPlayer]);

  const restartGame = useCallback(() => {
    setGameBoard(Array(9).fill(''));
    setGameActive(true);
    setCurrentPlayer('X');
    setWinningCombo([]);
    setStatusMessage("Player X's turn");
  }, []);

  const resetScores = useCallback(() => {
    setScores({ X: 0, O: 0, T: 0 });
    restartGame();
  }, [restartGame]);

  const getCellClassName = useCallback((index) => {
    const cellValue = gameBoard[index];
    let className = styles.cell;
    
    if (cellValue === 'X') className += ` ${styles.cellX}`;
    if (cellValue === 'O') className += ` ${styles.cellO}`;
    if (winningCombo.includes(index)) className += ` ${styles.cellWin}`;
    
    return className;
  }, [gameBoard, winningCombo]);

  return (
    <div className={styles.ticTacToe}>
      <div className={styles.scoreBoard}>
        <div className={styles.score}>
          <span>Player X: </span>
          <span>{scores.X}</span>
        </div>
        <div className={styles.score}>
          <span>Ties: </span>
          <span>{scores.T}</span>
        </div>
        <div className={styles.score}>
          <span>Player O: </span>
          <span>{scores.O}</span>
        </div>
      </div>

      <div className={styles.status}>
        {statusMessage}
      </div>

      <div className={styles.gameBoard}>
        {gameBoard.map((cell, index) => (
          <button
            key={index}
            className={getCellClassName(index)}
            onClick={() => handleCellClick(index)}
            disabled={!gameActive || cell !== ''}
            type="button"
          >
            {cell}
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <button 
          className={styles.button} 
          onClick={restartGame}
          type="button"
        >
          Restart Game
        </button>
        <button 
          className={styles.buttonReset} 
          onClick={resetScores}
          type="button"
        >
          Reset Scores
        </button>
      </div>
    </div>
  );
}

export default TicTacToe;