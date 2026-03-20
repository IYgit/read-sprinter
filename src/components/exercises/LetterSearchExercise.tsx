import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Trophy, RotateCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveExerciseResult } from '@/lib/exerciseStats';
import { calcLetterSearchScore } from '@/lib/scoring';
import ExerciseStatsChart from '@/components/ExerciseStatsChart';

const UKRAINIAN_LETTERS = 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя';

function pickRandomLetters(count: number): string[] {
    const shuffled = UKRAINIAN_LETTERS.split('').sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

interface GridCell {
    letter: string;
    isTarget: boolean;
    found: boolean;
}

function generateGrid(rows: number, cols: number, targetLetters: string[]): GridCell[][] {
    const totalCells = rows * cols;
    // Place ~3 of each target letter randomly
    const targetPlacements: { letter: string; index: number }[] = [];
    const usedIndices = new Set<number>();

    for (const letter of targetLetters) {
        const count = 2 + Math.floor(Math.random() * 3); // 2-4 of each
        for (let i = 0; i < count; i++) {
            let idx: number;
            do {
                idx = Math.floor(Math.random() * totalCells);
            } while (usedIndices.has(idx));
            usedIndices.add(idx);
            targetPlacements.push({ letter, index: idx });
        }
    }

    const grid: GridCell[][] = [];
    let cellIndex = 0;
    for (let r = 0; r < rows; r++) {
        const row: GridCell[] = [];
        for (let c = 0; c < cols; c++) {
            const placement = targetPlacements.find(p => p.index === cellIndex);
            if (placement) {
                row.push({ letter: placement.letter, isTarget: true, found: false });
            } else {
                // Random non-target letter
                let letter: string;
                do {
                    letter = UKRAINIAN_LETTERS[Math.floor(Math.random() * UKRAINIAN_LETTERS.length)];
                } while (targetLetters.includes(letter));
                row.push({ letter, isTarget: false, found: false });
            }
            cellIndex++;
        }
        grid.push(row);
    }
    return grid;
}

const GRID_SIZE_OPTIONS = [
    { label: '8×10', rows: 10, cols: 8 },
    { label: '9×10', rows: 10, cols: 9 },
    { label: '10×12', rows: 12, cols: 10 },
    { label: '11×14', rows: 14, cols: 11 },
];

const LETTER_COUNT_OPTIONS = [1, 2, 3, 4];

const FONT_SIZE_OPTIONS = [
    { label: 'S', value: 14 },
    { label: 'M', value: 18 },
    { label: 'L', value: 22 },
    { label: 'XL', value: 26 },
];

const LetterSearchExercise = () => {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<'settings' | 'playing' | 'results'>('settings');
    const [gridSizeIdx, setGridSizeIdx] = useState(1);
    const [letterCount, setLetterCount] = useState(2);
    const [fontSize, setFontSize] = useState(18);
    const [targetLetters, setTargetLetters] = useState<string[]>([]);
    const [grid, setGrid] = useState<GridCell[][]>([]);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [errors, setErrors] = useState(0);
    const [totalTargets, setTotalTargets] = useState(0);
    const [foundCount, setFoundCount] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const gridSize = GRID_SIZE_OPTIONS[gridSizeIdx];

    const startGame = useCallback(() => {
        const letters = pickRandomLetters(letterCount);
        const newGrid = generateGrid(gridSize.rows, gridSize.cols, letters);
        const total = newGrid.flat().filter(c => c.isTarget).length;
        setTargetLetters(letters);
        setGrid(newGrid);
        setTotalTargets(total);
        setFoundCount(0);
        setErrors(0);
        setTimeElapsed(0);
        setPhase('playing');
    }, [letterCount, gridSize]);

    useEffect(() => {
        if (phase !== 'playing') return;
        timerRef.current = setInterval(() => setTimeElapsed(p => p + 1), 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase]);

    const finishGame = useCallback(async (finalScore: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        await saveExerciseResult('letter-search', finalScore);
        setPhase('results');
    }, []);

    useEffect(() => {
        if (phase === 'playing' && foundCount > 0 && foundCount >= totalTargets) {
            const fs = calcLetterSearchScore(
                foundCount, errors, timeElapsed,
                gridSize.rows * gridSize.cols, letterCount,
            );
            setTimeout(() => finishGame(fs), 400);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [foundCount, totalTargets, phase]);

    const handleCellClick = (r: number, c: number) => {
        if (phase !== 'playing') return;
        const cell = grid[r][c];
        if (cell.found) return;

        if (cell.isTarget) {
            setGrid(prev => {
                const next = prev.map(row => row.map(cell => ({ ...cell })));
                next[r][c].found = true;
                return next;
            });
            setFoundCount(p => p + 1);
        } else {
            setErrors(p => p + 1);
        }
    };

    const remaining = totalTargets - foundCount;
    const score = calcLetterSearchScore(
        foundCount,
        errors,
        timeElapsed,
        gridSize.rows * gridSize.cols,
        letterCount,
    );



    if (phase === 'settings') {
        return (
            <div className="max-w-2xl mx-auto p-4 lg:p-6">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft size={20} /> До вибору вправ
                </button>
                <div className="glass-card p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Search size={32} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Пошук букв</h2>
                        <p className="text-muted-foreground">
                            Швидко знайдіть усі задані букви серед таблиці довільних букв.
                        </p>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Розмір таблиці</label>
                            <div className="flex gap-2 flex-wrap">
                                {GRID_SIZE_OPTIONS.map((opt, i) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => setGridSizeIdx(i)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            gridSizeIdx === i
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Кількість букв для пошуку</label>
                            <div className="flex gap-2">
                                {LETTER_COUNT_OPTIONS.map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setLetterCount(n)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            letterCount === n
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                                        }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Розмір шрифта</label>
                            <div className="flex gap-2">
                                {FONT_SIZE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setFontSize(opt.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            fontSize === opt.value
                                                ? 'bg-accent text-accent-foreground'
                                                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button onClick={startGame} className="btn-primary w-full flex items-center justify-center gap-2 text-lg">
                        <Play size={22} /> Почати
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'results') {
        return (
            <div className="max-w-2xl mx-auto p-4 lg:p-6">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft size={20} /> До вибору вправ
                </button>
                <div className="glass-card p-8 text-center">
                    <Trophy size={48} className="text-accent mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Результати</h2>
                    <p className="text-muted-foreground mb-8">Вправа «Пошук букв» завершена</p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
                        <div className="glass-card p-4">
                            <p className="text-2xl font-bold text-primary">{score}</p>
                            <p className="text-xs text-muted-foreground">Балів</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-2xl font-bold text-accent">{timeElapsed}с</p>
                            <p className="text-xs text-muted-foreground">Час</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-2xl font-bold text-destructive">{errors}</p>
                            <p className="text-xs text-muted-foreground">Помилок</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-2xl font-bold text-foreground">{gridSize.cols}×{gridSize.rows}</p>
                            <p className="text-xs text-muted-foreground">Розмір</p>
                        </div>
                        <div className="glass-card p-4">
                            <p className="text-2xl font-bold text-foreground">{letterCount}</p>
                            <p className="text-xs text-muted-foreground">Букв</p>
                        </div>
                    </div>

                    <ExerciseStatsChart exerciseId="letter-search" title="Статистика — Пошук букв" />

                    <div className="flex gap-4 justify-center mt-6">
                        <button onClick={startGame} className="btn-primary flex items-center gap-2">
                            <RotateCcw size={18} /> Ще раз
                        </button>
                        <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                            До вправ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Playing phase
    return (
        <div className="max-w-3xl mx-auto p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
                <button onClick={finishGame} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={20} /> Завершити
                </button>
                <span className="text-lg font-mono font-bold text-primary">{timeElapsed}с</span>
            </div>

            {/* Target letters & remaining */}
            <div className="glass-card p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Знайти</span>
                    <div className="flex gap-2">
                        {targetLetters.map(l => (
                            <span key={l} className="px-3 py-1 rounded-lg bg-accent/20 text-accent font-bold text-lg">{l}</span>
                        ))}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Залишилось </span>
                    <span className="text-lg font-bold text-primary">{remaining}</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-secondary/50 rounded-full mb-4 overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: totalTargets > 0 ? `${(foundCount / totalTargets) * 100}%` : '0%' }}
                />
            </div>

            {/* Letter grid */}
            <div className="glass-card p-3 select-none">
                <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)` }}
                >
                    {grid.map((row, r) =>
                        row.map((cell, c) => (
                            <div
                                key={`${r}-${c}`}
                                onClick={() => handleCellClick(r, c)}
                                style={{ fontSize: `${fontSize}px` }}
                                className={`aspect-square flex items-center justify-center font-bold rounded-md cursor-pointer transition-all select-none ${
                                    cell.found
                                        ? 'bg-accent/25 text-accent scale-90'
                                        : 'hover:bg-muted/50 text-foreground/80 active:scale-95'
                                }`}
                            >
                                {cell.letter}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-3">
                Натискайте на букви, які потрібно знайти
            </p>
        </div>
    );
};

export default LetterSearchExercise;
