import React, { useEffect, useRef, useState } from 'react';
import cash from '../public/cash.png';
import rocket from '../public/rocket.png';

interface FallingItem {
  id: number;
  left: number; // percent
  duration: number; // seconds
  delay: number; // seconds
  rotate: number; // deg
  zIndex: number;
}

interface FallingItemsProps {
  marketCap: number | null;
}

const getRocketCount = (marketCap: number | null) => {
  if (marketCap === null) return 0;
  if (marketCap >= 90) return 0;
  // 0-15k: max (e.g. 20), decrease by 3 every 15k, min 1 (halved)
  const max = 20;
  const step = 3;
  const level = Math.floor(marketCap / 15);
  return Math.max(max - step * level, 1);
};

const getCashCount = (marketCap: number | null) => {
  if (marketCap === null) return 0;
  if (marketCap < 90) return 0;
  // 90k+: increase by 20 every 15k, up to 300k (max 300) (doubled)
  const base = 20;
  const max = 300;
  const level = Math.floor((Math.min(marketCap, 300) - 90) / 15) + 1;
  return Math.min(base * level, max);
};

const getCashSpeedMultiplier = (marketCap: number | null) => {
  if (marketCap === null) return 1;
  if (marketCap < 300) return 1;
  if (marketCap < 1000000) {
    // 300k to 1M: linearly increase from 1x to 2x
    return 1 + (marketCap - 300) / (1000000 - 300);
  }
  return 2;
};

const generateItems = (count: number, zFrontRatio = 0.2, opts?: { speedMultiplier?: number }): FallingItem[] => {
  return Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100;
    let duration = 6 + Math.random() * 6; // 6-12s
    if (opts?.speedMultiplier) duration = duration / opts.speedMultiplier;
    const delay = Math.random() * 4;
    const rotate = (Math.random() - 0.5) * 90; // -45 to 45 deg
    const zIndex = Math.random() < zFrontRatio ? 30 : 0;
    return { id: i, left, duration, delay, rotate, zIndex };
  });
};


type ItemType = 'rocket' | 'cash';
interface SpawnedItem extends FallingItem {
  type: ItemType;
  key: string;
}

const FallingItems: React.FC<FallingItemsProps> = ({ marketCap }) => {
  const [items, setItems] = useState<SpawnedItem[]>([]);
  const itemId = useRef(0);

  // Calculate how many to spawn per second
  const rocketCount = getRocketCount(marketCap);
  const cashCount = getCashCount(marketCap);
  const spawnRate = 0.35; // seconds between spawns (twice as fast)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isMounted = true;
  const MAX_DOM_ITEMS = 500;
    function spawn() {
      if (!isMounted) return;
      const newItems: SpawnedItem[] = [];
      if (rocketCount > 0) {
        for (let i = 0; i < Math.max(1, Math.round(rocketCount / 8)); i++) {
          const base = generateItems(1, 0.2)[0];
          newItems.push({ ...base, type: 'rocket', key: 'r' + itemId.current++ });
        }
      }
      if (cashCount > 0) {
        const cashSpeed = getCashSpeedMultiplier(marketCap);
        for (let i = 0; i < Math.max(1, Math.round(cashCount / 15)); i++) {
          const base = generateItems(1, 0.1, { speedMultiplier: cashSpeed })[0];
          newItems.push({ ...base, type: 'cash', key: 'c' + itemId.current++ });
        }
      }
      setItems(prev => {
        const combined = [...prev, ...newItems];
        return combined.length > MAX_DOM_ITEMS ? combined.slice(combined.length - MAX_DOM_ITEMS) : combined;
      });
    }
    spawn();
    interval = setInterval(spawn, spawnRate * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [rocketCount, cashCount]);

  // Remove items after their animation ends
  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map(item =>
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.key !== item.key));
      }, (item.duration + item.delay) * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, [items]);

  return (
    <>
      {items.map(item => (
        <img
          key={item.key}
          src={item.type === 'rocket' ? rocket : cash}
          alt={item.type}
          style={{
            position: 'fixed',
            left: `${item.left}%`,
            top: '-80px',
            width: item.type === 'rocket' ? 96 : 80,
            height: 'auto',
            zIndex: item.zIndex,
            pointerEvents: 'none',
            animation: `falling-item ${item.duration}s linear ${item.delay}s forwards, rotate-item ${item.duration}s linear ${item.delay}s`,
            transform: `rotate(${item.rotate}deg)`,
            willChange: 'transform, top',
          }}
          className="falling-item pointer-events-none select-none"
        />
      ))}
      <style>{`
        @keyframes falling-item {
          0% { top: -80px; opacity: 0.7; }
          10% { opacity: 1; }
          100% { top: 110vh; opacity: 0.7; }
        }
        @keyframes rotate-item {
          0% {}
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default FallingItems;
