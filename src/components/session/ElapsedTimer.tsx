import { useTheme } from '@/context/ThemeContext';
import { formatElapsed } from '@/utils/datetime';
import { useEffect, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

interface ElapsedTimerProps {
  startedAt: string;
  textStyle?: StyleProp<TextStyle>;
}

// A live "hh:mm:ss" / "mm:ss" clock ticking up from startedAt.
// Its own tiny component on purpose: the once-per-second `now` update re-renders only this leaf,
// so the session header's name TextInput and the exercise cards don't re-render every tick.
export default function ElapsedTimer({ startedAt, textStyle }: ElapsedTimerProps) {
  const { typography } = useTheme();
  const [now, setNow] = useState(() => Date.now());

  // useEffect (not useFocusEffect) — this is a plain non-screen component with no navigation
  // lifecycle. Ticks every second and tears the interval down on unmount.
  useEffect(() => {
    // setInterval starts a repeating timer that fires its callback every 1000ms, writing the
    // current time into `now` on each tick — which re-renders and advances the displayed clock.
    // It returns a handle we keep so we can stop that timer later.
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    // The function returned from useEffect is its cleanup; React runs it on unmount.
    // clearInterval cancels the timer via its handle, so it stops firing once this component is
    // gone (otherwise the interval would leak and keep calling setNow on an unmounted component).
    return () => clearInterval(intervalId);
  }, []);

  return <Text style={[typography.caption, textStyle]}>{formatElapsed(startedAt, now)}</Text>;
}
