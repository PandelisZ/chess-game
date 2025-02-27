'use client';

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type PhaserType from "phaser";

const Phaser = dynamic(() => import("phaser").then(mod => mod.default), { ssr: false });

export default function Home() {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGame = useRef<PhaserType.Game | null>(null);
  const [currentTurn, setCurrentTurn] = useState<string>('White');
  const [turnTime, setTurnTime] = useState<number>(60);

  useEffect(() => {
    if (phaserGame.current === null && gameRef.current) {
      class ChessScene extends Phaser.Scene {
        private selectedPiece: Phaser.GameObjects.Image | null = null;
        private board: (Phaser.GameObjects.Image | null)[][] = [];
        private turn: string = 'White';
        private timerEvent!: Phaser.Time.TimerEvent;

        constructor() {
          super({ key: "ChessScene" });
        }

        preload(): void {
          this.load.image('board', '/assets/board.png');
          const pieces = ['wp', 'wr', 'wn', 'wb', 'wq', 'wk', 'bp', 'br', 'bn', 'bb', 'bq', 'bk'];
          pieces.forEach(piece => {
            this.load.image(piece, `/assets/${piece}.png`);
          });
        }

        create(): void {
          this.add.image(400, 400, 'board');
          const initialSetup = [
            ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
            ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
            ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
          ];

          for (let y = 0; y < 8; y++) {
            this.board[y] = [];
            for (let x = 0; x < 8; x++) {
              const pieceKey = initialSetup[y][x];
              if (pieceKey) {
                const piece = this.add.image(100 + x * 80, 100 + y * 80, pieceKey).setInteractive();
                piece.setData('type', pieceKey);
                piece.setData('color', pieceKey[0] === 'w' ? 'White' : 'Black');
                piece.setData('position', { x, y });
                this.input.setDraggable(piece);
                this.board[y][x] = piece;
              } else {
                this.board[y][x] = null;
              }
            }
          }

          this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
            if (gameObject.getData('color') !== this.turn) {
              pointer.event.preventDefault();
              return;
            }
            this.selectedPiece = gameObject;
          });

          this.input.on('drag', (_: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
          });

          this.input.on('dragend', (_: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
            const x = Math.floor((gameObject.x - 60) / 80);
            const y = Math.floor((gameObject.y - 60) / 80);

            const oldPos = gameObject.getData('position');

            if (x < 0 || x > 7 || y < 0 || y > 7) {
              gameObject.x = 100 + oldPos.x * 80;
              gameObject.y = 100 + oldPos.y * 80;
              return;
            }

            const targetPiece = this.board[y][x];

            if (targetPiece && targetPiece.getData('color') === this.turn) {
              gameObject.x = 100 + oldPos.x * 80;
              gameObject.y = 100 + oldPos.y * 80;
              return;
            }

            if (targetPiece) {
              targetPiece.destroy();
            }

            this.board[oldPos.y][oldPos.x] = null;
            this.board[y][x] = gameObject;
            gameObject.setData('position', { x, y });
            gameObject.x = 100 + x * 80;
            gameObject.y = 100 + y * 80;

            this.endTurn();
          });

          this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
              setTurnTime(prev => {
                if (prev <= 1) {
                  this.endTurn();
                  return 60;
                }
                return prev - 1;
              });
            },
            loop: true
          });
        }

        endTurn() {
          this.turn = this.turn === 'White' ? 'Black' : 'White';
          setCurrentTurn(this.turn);
          setTurnTime(60);
        }
      }

      const config: PhaserType.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 800,
        parent: gameRef.current,
        scene: [ChessScene],
        backgroundColor: '#ffffff'
      };

      phaserGame.current = new Phaser(config);
    }

    return () => {
      phaserGame.current?.destroy(true);
      phaserGame.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 bg-gray-100">
      <h1 className="text-2xl font-bold">Phaser Chess Game</h1>
      <div className="flex gap-8">
        <div className="text-lg">Current Turn: <strong>{currentTurn}</strong></div>
        <div className="text-lg">Time Remaining: <strong>{turnTime}s</strong></div>
      </div>
      <div ref={gameRef} className="border-2 border-gray-300 shadow-lg"></div>
    </div>
  );
}
