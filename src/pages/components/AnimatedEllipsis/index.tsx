import { useEffect, useState } from 'react';

export default function AnimatedEllipsis() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const frames = ["   ", ".  ", ".. ", "...", " ..", "  .", "   "];
    let currentFrame = 0;

    const interval = setInterval(() => {
      currentFrame = (currentFrame + 1) % frames.length;
      setDots(currentFrame);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const frames = ["   ", ".  ", ".. ", "...", " ..", "  .", "   "];
  return <span className="font-mono">{frames[dots]}</span>;
} 