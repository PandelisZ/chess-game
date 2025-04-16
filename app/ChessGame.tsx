"use client";
import React, { useState } from "react";
import { Chess, Square } from "chess.js";
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const pieceUnicode: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
};
function ChessGame() {
  // Use chess.js under the hood for logic
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const [promotion, setPromotion] = useState<{from: Square, to: Square} | null>(null);
  const board = game.board();
  function handleSquareClick(file: string, rank: number) {
    const square: Square = (file + rank) as Square;
    // Handle promotion dialog
    if (promotion) {
      doMove(promotion.from, promotion.to, square as any);
      setPromotion(null);
      setSelected(null);
      return;
    }
    // Selecting a piece to move
    if (!selected) {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelected(square);
        const possible = game.moves({ square, verbose: true });
        setMoves(possible.map((m) => m.to));
      }
      return;
    }
    // Trying to move selected piece to clicked square
    if (selected === square) {
      // Deselect
      setSelected(null);
      setMoves([]);
      return;
    }
    // If this move is not legal, ignore
    if (!moves.includes(square)) return;
    // Promotion required
    const piece = game.get(selected);
    if (
        piece && piece.type === "p"
        && ((piece.color === "w" && square[1] === "8") || (piece.color === "b" && square[1] === "1"))
    ) {
      // Open promotion selection
      setPromotion({ from: selected, to: square });
      return;
    }
    doMove(selected, square);
    setSelected(null);
    setMoves([]);
  }
  function doMove(from: Square, to: Square, promotionPiece?: string) {
    const move = {
      from,
      to,
      promotion: promotionPiece || "q"
    };
    const newGame = new Chess(game.fen());
    const result = newGame.move(move);
    if (result) {
      setGame(newGame);
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
        background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center"
      }} >
        <div style={{background:"#fff", padding:20, borderRadius:8, boxShadow:"0 2px 8px #0008"}}>
          <div>Choose promotion piece:</div>
          <div style={{display:"flex", fontSize:36, gap:18, marginTop:10}}>
            {options.map(opt =>
              <button key={opt.p}
                style={{border:"none", fontSize:"2rem", background:"transparent", cursor:"pointer"}}
                onClick={()=>doMove(promotion.from, promotion.to, opt.p as any)}
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
  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", minHeight: "100vh", paddingTop: 48}}>
      <div style={{fontSize: "1.5rem", fontWeight:"bold", marginBottom:12}}>Interactive Chess</div>
      <div style={{
        border: "4px solid #333", borderRadius: 8, position:"relative",
        boxShadow: "2px 2px 14px #0004", background:"#ddd"
      }}>
        <div style={{position:"absolute", zIndex:2, width:"100%", height:"100%"}}>
          {renderPromotionDialog()}
        </div>
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(8, 48px)", gridTemplateRows:"repeat(8, 48px)"
        }}>
          {ranks.map(rank =>
            files.map(file => {
              const square = (file + rank) as Square;
              const piece = game.get(square);
              const selectedSq = selected === square;
              const legalDestination = moves.includes(square);
              const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 1;
              return (
                <div
                  key={square}
                  onClick={()=>handleSquareClick(file, rank)}
                  style={{
                    width:48, height:48, userSelect:"none", cursor: piece && game.turn() === piece.color && !promotion ? "pointer":"default",
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
                  {piece ? pieceUnicode[piece.type.toUpperCase() === piece.type ? piece.type : piece.type.toLowerCase() === piece.type ? piece.type : piece.type] || pieceUnicode[piece.color === "w" ? piece.type.toUpperCase() : piece.type] : ""}
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