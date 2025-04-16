"use client";
import React, { useState } from "react";
import { Chess, Square, Move } from "chess.js";
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const pieceUnicode: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
};
function ChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [promotion, setPromotion] = useState<{from: Square, to: Square} | null>(null);
  function handleSquareClick(file: string, rank: number) {
    const square: Square = (file + rank) as Square;
    if (promotion) return; // Don't let board interaction during promotion choice
    // If nothing selected: try to select a piece of the player's color.
    if (!selected) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelected(square);
        const possible = game.moves({ square, verbose: true }) as Move[];
        setMoves(possible);
      }
      return;
    }
    // If already selected, and clicking a piece of same color, change selection
    const clickedPiece = game.get(square);
    if (clickedPiece && clickedPiece.color === game.turn() && selected !== square) {
      setSelected(square);
      const possible = game.moves({ square, verbose: true }) as Move[];
      setMoves(possible);
      return;
    }
    // Are we trying to move the selected piece to this square?
    const move = moves.find(m => m.to === square);
    if (move) {
      // Promotion required?
      if (move.flags.includes('p')) {
        // Open promotion dialog (let user pick type)
        setPromotion({ from: move.from, to: move.to });
        return;
      }
      // Else, just make the move
      doMove(move.from, move.to, move.promotion);
      setSelected(null);
      setMoves([]);
      return;
    }
    // Deselect if clicking elsewhere (invalid)
    setSelected(null);
    setMoves([]);
  }
  function doMove(from: Square, to: Square, promotionType?: string) {
    const newGame = new Chess(game.fen());
    const moveObj = { from, to } as any;
    if (promotionType) {
      moveObj.promotion = promotionType;
    }
    // Try move:
    if (newGame.move(moveObj)) {
      setGame(newGame);
      setPromotion(null);
      setSelected(null);
      setMoves([]);
    }
  }
  function renderPromotionDialog() {
    if (!promotion) return null;
    const color = game.turn();
    const options = color === "w"
      ? [{p:"q",u:"♕"},{p:"r",u:"♖"},{p:"b",u:"♗"},{p:"n",u:"♘"}]
      : [{p:"q",u:"♛"},{p:"r",u:"♜"},{p:"b",u:"♝"},{p:"n",u:"♞"}];
    return (
      <div style={{
        position:"absolute", left:0, top:0, width:"100%", height:"100%",
        background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:10
      }} >
        <div style={{background:"#fff", padding:20, borderRadius:8, boxShadow:"0 2px 8px #0008"}}>
          <div>Choose promotion piece:</div>
          <div style={{display:"flex", fontSize:36, gap:18, marginTop:10}}>
            {options.map(opt =>
              <button key={opt.p}
                style={{border:"none", fontSize:"2rem", background:"transparent", cursor:"pointer"}}
                onClick={() => {
                  doMove(promotion.from, promotion.to, opt.p);
                  setPromotion(null);
                  setSelected(null);
                  setMoves([]);
                }}
              >{opt.u}</button>
            )}
          </div>
        </div>
      </div>
    );
  }
  function getStatus() {
    if (game.isCheckmate()) {
      return `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins.`;
    }
    if (game.isStalemate()) {
      return "Stalemate! Draw.";
    }
    if (game.isCheck()) {
      return "Check!";
    }
    if (game.isDraw()) {
      return "Draw!";
    }
    return `${game.turn() === "w" ? "White" : "Black"} to move.`;
  }
  function handleRestart() {
    setGame(new Chess());
    setSelected(null);
    setMoves([]);
    setPromotion(null);
  }
  // For move highlight:
  function isLegalDest(square: Square) {
    return !!moves.find(m => m.to === square);
  }
  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", minHeight: "100vh", paddingTop: 48}}>
      <div style={{fontSize: "1.5rem", fontWeight:"bold", marginBottom:12}}>Interactive Chess</div>
      <div style={{
        border: "4px solid #333", borderRadius: 8, position:"relative",
        boxShadow: "2px 2px 14px #0004", background:"#ddd"
      }}>
        {renderPromotionDialog()}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(8, 48px)", gridTemplateRows:"repeat(8, 48px)"
        }}>
          {ranks.map(rank =>
            files.map(file => {
              const square = (file + rank) as Square;
              const piece = game.get(square);
              const selectedSq = selected === square;
              const legalDestination = isLegalDest(square);
              const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 1;
              return (
                <div
                  key={square}
                  onClick={()=>handleSquareClick(file, rank)}
                  style={{
                    width:48, height:48, userSelect:"none", cursor: (!promotion && (legalDestination || (piece && piece.color === game.turn()))) ? "pointer":"default",
                    background: selectedSq
                      ? "#fd6"
                      : legalDestination
                        ? "#48e"
                        : isLight
                          ? "#f1f1f1"
                          : "#5e8",
                    border: "1px solid #555",
                    fontSize:32, fontWeight:"bold", textAlign:"center", lineHeight:"48px"
                  }}
                >
                  {piece ? pieceUnicode[(piece.color === "w" ? piece.type.toUpperCase() : piece.type)] : ""}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div style={{marginTop:16, fontSize:"1.1rem"}}>{getStatus()}</div>
      <button onClick={handleRestart} style={{marginTop:12, padding:"6px 18px", fontSize:"1rem", background:"#1971c2", color:"#fff", border:"none", borderRadius:4, cursor:"pointer"}}>
        Restart
      </button>
      <div style={{marginTop:24, fontSize:"0.9rem", color:"#555"}}>
        Tip: Click a piece to select, then click a destination square to move.
      </div>
    </div>
  );
}
export default ChessGame;