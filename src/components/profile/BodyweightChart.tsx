import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/styles';
import type { WeightUnit } from '@/types';
import { Fragment, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

export interface BodyweightChartPoint {
  recordedAt: string; // ISO 8601
  weight: number; // already converted to the display unit by the screen
}

interface BodyweightChartProps {
  points: BodyweightChartPoint[]; // sorted oldest -> newest, at least 2
  unit: WeightUnit; // display unit, for the y-axis caption
  domainStartMs: number; // left edge of the plotted time window
  domainEndMs: number; // right edge (today)
}

const CHART_HEIGHT = 200;
const PADDING_LEFT = 40; // room for y-axis value labels
const PADDING_RIGHT = 14;
const PADDING_TOP = 14;
const PADDING_BOTTOM = 22; // room for x-axis date labels
// SVG <Text> takes a numeric fontSize prop and cannot consume the RN typography style tokens
// (those are TextStyle objects). Colour still comes from the theme via the fill prop below.
const AXIS_FONT_SIZE = 11;
const POINT_RADIUS = 2.5;
const LINE_WIDTH = 2;
const GRIDLINE_TARGET = 4; // approximate number of horizontal gridlines

// Hand-built single-series line chart for bodyweight over time. Theme-reactive (repaints on toggle
// because it re-renders through useTheme), time-proportional x-axis, non-zero y-baseline so the
// narrow band of bodyweight variation reads as a trend rather than a flat line.
export default function BodyweightChart({
  points,
  unit,
  domainStartMs,
  domainEndMs,
}: BodyweightChartProps) {
  const { colors, layout, typography } = useTheme();
  const [chartWidth, setChartWidth] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth !== chartWidth) setChartWidth(nextWidth);
  }

  const geometry = useMemo(
    () => (chartWidth > 0 ? buildGeometry(points, domainStartMs, domainEndMs, chartWidth) : null),
    [points, domainStartMs, domainEndMs, chartWidth],
  );

  return (
    <View style={[layout.card, styles.card]}>
      <Text style={typography.caption}>Weight ({unit})</Text>

      {/* Inner, unpadded View is what we measure, so the SVG width matches the plot area exactly.
          Height is reserved up front so the card does not jump when the SVG paints. */}
      <View style={styles.plot} onLayout={handleLayout}>
        {geometry && (
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {geometry.gridlines.map((gridline) => (
              <Fragment key={gridline.value}>
                <Line
                  x1={PADDING_LEFT}
                  y1={gridline.y}
                  x2={chartWidth - PADDING_RIGHT}
                  y2={gridline.y}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={PADDING_LEFT - 6}
                  y={gridline.y + AXIS_FONT_SIZE / 3}
                  fill={colors.textSubtle}
                  fontSize={AXIS_FONT_SIZE}
                  textAnchor="end"
                >
                  {gridline.label}
                </SvgText>
              </Fragment>
            ))}

            <Polyline
              points={geometry.polyline}
              fill="none"
              stroke={colors.primary}
              strokeWidth={LINE_WIDTH}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {geometry.coords.map((coord) => (
              <Circle key={coord.key} cx={coord.x} cy={coord.y} r={POINT_RADIUS} fill={colors.primary} />
            ))}

            <SvgText
              x={PADDING_LEFT}
              y={CHART_HEIGHT - 6}
              fill={colors.textSubtle}
              fontSize={AXIS_FONT_SIZE}
              textAnchor="start"
            >
              {geometry.startLabel}
            </SvgText>
            <SvgText
              x={chartWidth - PADDING_RIGHT}
              y={CHART_HEIGHT - 6}
              fill={colors.textSubtle}
              fontSize={AXIS_FONT_SIZE}
              textAnchor="end"
            >
              {geometry.endLabel}
            </SvgText>
          </Svg>
        )}
      </View>
    </View>
  );
}

interface ChartGeometry {
  polyline: string;
  coords: { x: number; y: number; key: string }[];
  gridlines: { value: number; y: number; label: string }[];
  startLabel: string;
  endLabel: string;
}

function buildGeometry(
  points: BodyweightChartPoint[],
  domainStartMs: number,
  domainEndMs: number,
  chartWidth: number,
): ChartGeometry {
  const plotWidth = chartWidth - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const weights = points.map((point) => point.weight);
  const [yMin, yMax] = paddedWeightDomain(Math.min(...weights), Math.max(...weights));

  const spanMs = Math.max(1, domainEndMs - domainStartMs);
  const mapX = (timeMs: number) => PADDING_LEFT + ((timeMs - domainStartMs) / spanMs) * plotWidth;
  const mapY = (weight: number) => PADDING_TOP + (1 - (weight - yMin) / (yMax - yMin)) * plotHeight;

  const coords = points.map((point) => ({
    x: mapX(new Date(point.recordedAt).getTime()),
    y: mapY(point.weight),
    key: point.recordedAt,
  }));

  return {
    polyline: coords.map((coord) => `${coord.x},${coord.y}`).join(' '),
    coords,
    gridlines: buildGridlines(yMin, yMax, mapY),
    startLabel: formatAxisDate(domainStartMs),
    endLabel: formatAxisDate(domainEndMs),
  };
}

// Non-zero baseline: pad the data range so the line sits in the middle band rather than hugging the
// edges. A flat line (all readings equal) gets a small fixed band so it renders mid-chart.
function paddedWeightDomain(dataMin: number, dataMax: number): [number, number] {
  if (dataMin === dataMax) return [dataMin - 1, dataMax + 1];
  const pad = (dataMax - dataMin) * 0.15;
  return [dataMin - pad, dataMax + pad];
}

function buildGridlines(
  yMin: number,
  yMax: number,
  mapY: (weight: number) => number,
): { value: number; y: number; label: string }[] {
  const step = niceStep(yMax - yMin, GRIDLINE_TARGET);
  const gridlines: { value: number; y: number; label: string }[] = [];
  // Start at the first nice multiple at or above yMin, step up to yMax.
  for (let value = Math.ceil(yMin / step) * step; value <= yMax + 1e-9; value += step) {
    gridlines.push({ value, y: mapY(value), label: formatAxisWeight(value) });
  }
  return gridlines;
}

// Rounds a raw step up to the nearest "nice" value (1, 2, 2.5, 5, 10 x a power of ten) so the axis
// labels land on clean numbers instead of arbitrary fractions.
function niceStep(range: number, targetTicks: number): number {
  const rough = range / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / magnitude;
  const niceNormalized =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function formatAxisWeight(value: number): string {
  return String(Number(value.toFixed(1))); // one decimal max, trailing .0 dropped
}

// Full date including the year: "All" can span years and a 1Y window's left edge is always in the
// previous year, so a bare month + day would be ambiguous. No time — axis-corner noise.
function formatAxisDate(timeMs: number): string {
  return new Date(timeMs).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.s,
  },
  plot: {
    height: CHART_HEIGHT,
  },
});
