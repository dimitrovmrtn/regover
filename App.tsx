
import React, { useState, useEffect, useCallback, useRef } from 'react';
import CaCopyBox from './components/CaCopyBox';
import FallingItems from './components/FallingItems';
import song from './public/song.mp3';
import clicksound from './public/clicksound.m4a';
import clicksound2 from './public/clicksound.m4a';
import image1 from './public/1.png';
import image2 from './public/2.png';
import image3 from './public/3.png';
import image4 from './public/4.png';
import image5 from './public/5.png';
import image6 from './public/6.png';
import image7 from './public/7.png';
import image8 from './public/8.png';

import { 
  API_KEY,
  API_URL,
  TOKEN_ADDRESS,
  TOTAL_SUPPLY,
  UPDATE_INTERVAL_MS,
  MARKET_CAP_THRESHOLD,
  MAX_IMAGE_LEVEL
} from './constants';
import type { MoralisPriceResponse } from './types';

// Helper component for the evolving image
interface DynamicImageProps {
  level: number;
}
const DynamicImage: React.FC<DynamicImageProps> = ({ level }) => {
  const imagesArray = [image1, image2, image3, image4, image5, image6, image7, image8]
  const imageUrl = level > 8 ? imagesArray[7] : imagesArray[level-1]
  const imageAlt = `Regovernment evolution level ${level}`;
  return (
    level &&
    <div className="my-8 w-full flex justify-center">
      <img
        src={imageUrl}
        alt={imageAlt}
        style={{
          width: 'min(98vw, 1200px)',
          aspectRatio: '1.89/1', // 1.2x taller than 2.27/1
          height: 'auto',
          maxHeight: '85vh',
          display: 'block',
          background: 'white',
        }}
      />
    </div>
  );
};

// Helper component for displaying market cap
interface MarketCapDisplayProps {
    marketCap: number | null;
}
const getCapColor = (cap: number | null) => {
  if (cap === null) return '#aaa';
  if (cap < 60) return '#e3342f'; // Red
  if (cap < 90) return '#f59e42'; // Orange
  if (cap < 180) return '#22c55e'; // Green
  if (cap < 300) return 'gold'; // Gold
  if (cap < 500) return 'linear-gradient(90deg, #b8b8b8, #e5e4e2, #b8b8b8)'; // Platinum
  if (cap < 1000000) return 'linear-gradient(90deg, #00e6e6, #b9f2ff, #fff, #00e6e6)'; // Diamond
  return 'linear-gradient(90deg, #00e6e6, #b9f2ff, #fff, #00e6e6, #b9f2ff 90%)'; // Diamond shine
};

const MarketCapDisplay: React.FC<MarketCapDisplayProps> = ({ marketCap }) => {
    const formattedMarketCap = marketCap !== null 
        ? `$${marketCap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'Loading...';
    const color = getCapColor(marketCap);
    const isShiny = marketCap !== null && marketCap >= 300;
    return (
        <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold font-display tracking-wide mb-2" style={{
              background: color.startsWith('linear-gradient') ? color : undefined,
              color: color.startsWith('linear-gradient') ? undefined : color,
              WebkitBackgroundClip: color.startsWith('linear-gradient') ? 'text' : undefined,
              WebkitTextFillColor: color.startsWith('linear-gradient') ? 'transparent' : undefined,
              backgroundClip: color.startsWith('linear-gradient') ? 'text' : undefined,
              fontFamily: 'Montserrat, Arial, sans-serif'
            }}>
                Current Market Cap
            </h2>
            <p
              className={
                `text-5xl md:text-7xl font-extrabold font-display mt-2 min-h-[60px] md:min-h-[80px] ` +
                (isShiny ? 'shine-text' : '')
              }
              style={
                isShiny
                  ? { background: color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
                  : color.startsWith('linear-gradient')
                    ? { background: color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: 'Montserrat, Arial, sans-serif' }
                    : { color: color, fontFamily: 'Montserrat, Arial, sans-serif' }
              }
            >
                {marketCap === null ? 'Loading...' : formattedMarketCap + 'K'}
            </p>
            {isShiny && (
              <style>{`
                .shine-text {
                  background: linear-gradient(90deg, #bfff00, #00ff99, #fff700, #fff 80%);
                  background-size: 200% auto;
                  color: #fff;
                  background-clip: text;
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  animation: shine 2s linear infinite;
                }
                @keyframes shine {
                  0% { background-position: 200% center; }
                  100% { background-position: 0% center; }
                }
              `}</style>
            )}
        </div>
    );
};

// SVG Icon for loading spinner
const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


function getRandomDirection() {
  const angle = Math.random() * 2 * Math.PI;
  const distance = 400 + Math.random() * 300; // much further
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rot: (Math.random() - 0.5) * 60,
    scale: 1 + Math.random() * 0.5,
  };
}

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const clickSoundRef = useRef<HTMLAudioElement>(null);
  const clickSound2Ref = useRef<HTMLAudioElement>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [flyingTexts, setFlyingTexts] = useState<any[]>([]);
  const flyingId = useRef(0);
  const [imageLevel, setImageLevel] = useState<number>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTokenData = useCallback(async () => {
    setIsLoading(true);
    // Don't clear previous error, to avoid UI flashing if there are repeated errors
    try {
      const response = await fetch(API_URL, {
        headers: {
          'accept': 'application/json',
          'X-API-Key': API_KEY,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorBody}`);
      }

      const data: MoralisPriceResponse = await response.json();
      
      if (typeof data.usdPrice === 'number') {
         const mc = data.usdPrice * TOTAL_SUPPLY;
        //const mc = 60;
        setMarketCap(mc);
        const levelFromMC = Math.floor(mc > MARKET_CAP_THRESHOLD ? mc / MARKET_CAP_THRESHOLD : 1) + 1;
        setImageLevel(Math.max(levelFromMC)); // Ensure level is at least 1
        setError(null); // Clear error on success
      } else {
        throw new Error('Invalid data format from API');
      }

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokenData(); // Fetch immediately on mount
    const interval = setInterval(fetchTokenData, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mouse click handler for flying Ffffff...
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const dir = getRandomDirection();
      const id = flyingId.current++;
  // Use the same logic as imageLevel: image 5 appears at 5 * MARKET_CAP_THRESHOLD
  const isAhh = marketCap !== null && marketCap >= 5 * MARKET_CAP_THRESHOLD;
      setFlyingTexts(prev => [
        ...prev,
        {
          id,
          x: clientX,
          y: clientY,
          dx: dir.x,
          dy: dir.y,
          rot: dir.rot,
          scale: dir.scale,
          ahh: isAhh,
        },
      ]);
      setTimeout(() => {
        setFlyingTexts(prev => prev.filter(t => t.id !== id));
      }, 1200);
      // Play click sound depending on market cap
      if (isAhh) {
        if (clickSound2Ref.current) {
          clickSound2Ref.current.currentTime = 0;
          clickSound2Ref.current.play().catch(() => {});
        }
      } else {
        if (clickSoundRef.current) {
          clickSoundRef.current.currentTime = 0;
          clickSoundRef.current.play().catch(() => {});
        }
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [marketCap]);

  // Audio control effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioOn ? 1 : 0;
      if (audioOn && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
      if (!audioOn && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [audioOn]);

  // Autoplay on mount (browser may block until user interacts)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <>
      <style>{`
        html, body, #root, .app-cursor {
          cursor: url('./cursor.png') 16 16, auto !important;
        }
        .flying-fffff {
          position: fixed;
          left: 0; top: 0;
          font-size: 2.2rem;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 2px 8px #000, 0 0 2px #000;
          pointer-events: none;
          z-index: 9999;
          will-change: transform, opacity;
          transition: opacity 0.2s;
        }
      `}</style>
      {flyingTexts.map(t => (
        <span
          key={t.id}
          className="flying-fffff"
          style={{
            left: t.x,
            top: t.y,
            transform: `translate(-50%, -50%) scale(${t.scale}) rotate(${t.rot}deg)`,
            opacity: 1,
            animation: `fffff-fly 1.2s cubic-bezier(.4,1.6,.6,1) forwards, fffff-fade 1.2s linear forwards`,
            animationDelay: '0s, 0s',
            '--fffff-dx': `${t.dx}px`,
            '--fffff-dy': `${t.dy}px`,
          } as React.CSSProperties}
        >
          {t.ahh ? 'Ahhh...Ahh...' : 'Ffffff...'}
        </span>
      ))}
      <style>{`
        @keyframes fffff-fly {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--fffff-dx, 0)), calc(-50% + var(--fffff-dy, 0))) scale(1.2) rotate(30deg); opacity: 0; }
        }
        @keyframes fffff-fade {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
  <audio ref={audioRef} src={song} loop autoPlay style={{ display: 'none' }} />
  <audio ref={clickSoundRef} src={clicksound} preload="auto" style={{ display: 'none' }} />
  <audio ref={clickSound2Ref} src={clicksound2} preload="auto" style={{ display: 'none' }} />
      <button
        onClick={() => setAudioOn(v => !v)}
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 10000,
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid #ccc',
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
          fontSize: 18,
          cursor: 'pointer',
          boxShadow: '0 2px 8px #0002',
        }}
        aria-label={audioOn ? 'Mute music' : 'Unmute music'}
      >
        {audioOn ? '🔊' : '🔇'}
      </button>
      <div className="bg-white text-black min-h-screen font-sans p-4 md:p-8 flex flex-col items-center relative overflow-x-hidden app-cursor">
        {/* Falling items overlay */}
        <FallingItems marketCap={marketCap} />
        <div className="container mx-auto max-w-4xl w-full">
          <header className="mb-8 flex flex-col items-center justify-center">
            <h1
              className="text-6xl md:text-8xl font-extrabold font-display tracking-tight mb-2 flex items-center justify-center w-full"
              style={{
                fontFamily: 'Montserrat, Arial, sans-serif',
                background: getCapColor(marketCap).startsWith('linear-gradient') ? getCapColor(marketCap) : undefined,
                color: getCapColor(marketCap).startsWith('linear-gradient') ? undefined : getCapColor(marketCap),
                WebkitBackgroundClip: getCapColor(marketCap).startsWith('linear-gradient') ? 'text' : undefined,
                WebkitTextFillColor: getCapColor(marketCap).startsWith('linear-gradient') ? 'transparent' : undefined,
                backgroundClip: getCapColor(marketCap).startsWith('linear-gradient') ? 'text' : undefined,
                letterSpacing: '0.04em',
                transition: 'color 0.5s',
                textAlign: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                display: 'flex',
                width: '100%',
              }}
            >
              $REGOVER
            </h1>
            <p className="mt-2 text-xl font-medium font-display" style={{
              fontFamily: 'Montserrat, Arial, sans-serif',
              background: getCapColor(marketCap).startsWith('linear-gradient') ? getCapColor(marketCap) : undefined,
              color: getCapColor(marketCap).startsWith('linear-gradient') ? undefined : getCapColor(marketCap),
              WebkitBackgroundClip: getCapColor(marketCap).startsWith('linear-gradient') ? 'text' : undefined,
              WebkitTextFillColor: getCapColor(marketCap).startsWith('linear-gradient') ? 'transparent' : undefined,
              backgroundClip: getCapColor(marketCap).startsWith('linear-gradient') ? 'text' : undefined,
              transition: 'color 0.5s',
              textAlign: 'center',
            }}>
              The coin that evolves.
            </p>
          </header>
          <main>
            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-lg">
              <div className="flex justify-center items-center mb-4 gap-3 relative" style={{ minHeight: '110px' }}>
                <div className="flex-1 flex justify-center">
                  <MarketCapDisplay marketCap={marketCap} />
                </div>
                <div style={{ width: 32, height: 32, position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isLoading ? <LoadingSpinner /> : null}
                </div>
              </div>
              {error && !marketCap ? (
                <div className="text-center text-red-400 bg-red-100 p-4 rounded-lg my-8">
                  <p className="font-semibold">Failed to load data:</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              ) : (
                   <DynamicImage level={imageLevel} />
              )}
            </div>
            <CaCopyBox address={TOKEN_ADDRESS} />
          </main>
          <footer className="text-center mt-12 text-sm" style={{
            background: getCapColor(marketCap).startsWith('linear-gradient') ? getCapColor(marketCap) : undefined,
            color: getCapColor(marketCap).startsWith('linear-gradient') ? undefined : getCapColor(marketCap),
            WebkitBackgroundClip: getCapColor(marketCap).startsWith('linear-gradient') ? 'text' : undefined,
            WebkitTextFillColor: getCapColor(marketCap).startsWith('linear-gradient') ? 'transparent' : undefined,
            backgroundClip: getCapColor(marketCap).startsWith('linear-gradient') ? 'text' : undefined,
            transition: 'color 0.5s'
          }}>
            <p>Data refreshed every 3 seconds, with a few secs delay.</p>
            <p>&copy; {new Date().getFullYear()} Regovernment.</p>
          </footer>
        </div>
      </div>
    </>
  );
}

export default App;
