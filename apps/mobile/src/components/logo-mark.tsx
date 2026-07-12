import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

/**
 * Rinciku brand mark — lowercase “r.” (cream glyph + lime full stop) on the
 * warm dark ground, mirroring the app icon 1:1 (same geometry as the web
 * `LogoMark` in apps/web/src/components/shared/logo.tsx). Colors are fixed
 * brand values rather than theme tokens so the mark reads identically on
 * light and dark grounds, like the app icon does on a home screen.
 */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox='0 0 100 100'>
      <Defs>
        <RadialGradient id='rk-mark-ground' cx='50%' cy='38%' r='80%'>
          <Stop offset='0%' stopColor='#26261C' />
          <Stop offset='100%' stopColor='#131310' />
        </RadialGradient>
      </Defs>
      <Rect width='100' height='100' rx='25' fill='url(#rk-mark-ground)' />
      <Path
        d='M 41 68.4 V 46.9 Q 41 38.7 49.2 38.7 H 54.7'
        fill='none'
        stroke='#FBFBF9'
        strokeWidth='10.2'
        strokeLinecap='round'
      />
      <Circle cx='65.2' cy='63.3' r='5.1' fill='#9AE600' />
    </Svg>
  );
}
