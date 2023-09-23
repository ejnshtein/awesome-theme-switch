import * as htmlToImage from 'html-to-image'
import type { FC, PropsWithChildren, RefObject } from 'react'
import { useViewportSize } from '@mantine/hooks'
import {
  Box,
  type ColorScheme as ColorSchemeName,
  MantineProvider,
  useMantineTheme
} from '@mantine/core'
import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
  useMemo
} from 'react'
import { Circle, Image, Layer, Stage } from 'react-konva'
import {
  animated,
  useSpringValue,
  type SpringValue,
  to
} from '@react-spring/konva'
import { sleep } from '~/utils/sleep'

interface ColorScheme {
  active: boolean
  colorScheme: ColorSchemeName
  overlay1: HTMLImageElement | null
  overlay2: HTMLImageElement | null
}

interface ColorSchemeContext extends ColorScheme {
  ref: RefObject<HTMLDivElement>
  transition: SpringValue<number>
  circle: {
    x: SpringValue<number>
    y: SpringValue<number>
    r: SpringValue<number>
  }
  dispatch: (scheme: ColorScheme) => void
}

interface Point {
  readonly x: number
  readonly y: number
}

const LOCAL_STORAGE_COLORSCHEME_NAME = 'colorScheme'
const defaultValue: ColorScheme = {
  active: false,
  colorScheme:
    (window.localStorage.getItem(
      LOCAL_STORAGE_COLORSCHEME_NAME
    ) as ColorSchemeName) ?? 'light',
  overlay1: null,
  overlay2: null
}

const ColorSchemeContext = createContext<ColorSchemeContext | null>(null)

const colorSchemeReducer = (_: ColorScheme, colorScheme: ColorScheme) => {
  return colorScheme
}

const dist = (cornerA: Point, cornerB: Point) => {
  const distX = cornerA.x - cornerB.x
  const distY = cornerA.y - cornerB.y

  return Math.sqrt(distX * distX + distY * distY)
}

const makeBlobUrl = (blob: Blob) => {
  const urlCreator = window.URL || window.webkitURL
  const imageUrl = urlCreator.createObjectURL(blob)

  return imageUrl
}

export const useColorScheme = () => {
  const theme = useMantineTheme()
  const { width, height } = useViewportSize()
  const corners: Point[] = useMemo(
    () => [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
    ],
    [width, height]
  )
  const ctx = useContext(ColorSchemeContext)
  if (ctx === null) {
    throw new Error('No ColorScheme context context found')
  }
  const { colorScheme, dispatch, ref, transition, circle, active } = ctx

  const toggle = useCallback(
    async (x: number, y: number) => {
      const newColorScheme = colorScheme === 'light' ? 'dark' : 'light'

      dispatch({
        active: true,
        colorScheme,
        overlay1: null,
        overlay2: null
      })
      // 0. Define the circle and its maximum radius
      const r = Math.max(...corners.map((corner) => dist(corner, { x, y })))
      circle.x.set(x)
      circle.y.set(y)
      circle.r.set(r)

      // 1. Take the screenshot
      const overlay1Blob = await htmlToImage.toBlob(ref.current!, {
        canvasHeight: height,
        canvasWidth: width,
        backgroundColor:
          colorScheme === 'dark' ? theme.colors.dark[7] : theme.white
      })
      if (!overlay1Blob) {
        throw new Error('did not receive blob for overlay 1')
      }
      const overlay1 = new window.Image()
      overlay1.src = makeBlobUrl(overlay1Blob)

      // 2. display it
      dispatch({
        active: true,
        colorScheme,
        overlay1,
        overlay2: null
      })

      // 3. switch to dark mode
      await sleep(16)

      dispatch({
        active: true,
        colorScheme: newColorScheme,
        overlay1,
        overlay2: null
      })
      // 4. sleep for the dark mode to render
      await sleep(16)
      // 5. take screenshot
      const overlay2Blob = await htmlToImage.toBlob(ref.current!, {
        canvasHeight: height,
        canvasWidth: width,
        backgroundColor:
          newColorScheme === 'dark' ? theme.colors.dark[7] : theme.white
      })
      if (!overlay2Blob) {
        throw new Error('did not receive blob for overlay 2')
      }
      const overlay2 = new window.Image()
      overlay2.src = makeBlobUrl(overlay2Blob)

      dispatch({
        active: true,
        colorScheme: newColorScheme,
        overlay1,
        overlay2
      })
      await transition.start(1, {
        from: 0
      })

      dispatch({
        active: false,
        colorScheme: newColorScheme,
        overlay1: null,
        overlay2: null
      })
    },
    [
      colorScheme,
      dispatch,
      corners,
      circle.x,
      circle.y,
      circle.r,
      ref,
      width,
      height,
      theme.colors.dark,
      theme.white,
      transition
    ]
  )
  return { colorScheme, toggle, active }
}

const mix = (partial: number, rangeMin: number, rangeMax: number) => {
  const percentage = partial * 100

  return ((rangeMax - rangeMin) / 100) * percentage + rangeMin
}

const ColorSchemeProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
  const { height, width } = useViewportSize()
  const circleX = useSpringValue(0)
  const circleY = useSpringValue(0)
  const circleRadius = useSpringValue(0)

  const transition = useSpringValue(0, {
    config: {
      tension: 100
    }
  })

  const ref = useRef<HTMLDivElement>(null)
  const [{ colorScheme, overlay1, overlay2, active }, dispatch] = useReducer(
    colorSchemeReducer,
    defaultValue
  )
  const r = to([transition, circleRadius], (t, ra) => mix(t, 0, ra))

  return (
    <>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{ colorScheme }}
      >
        <Box ref={ref} sx={{ flex: 1 }}>
          <ColorSchemeContext.Provider
            value={{
              active,
              colorScheme,
              overlay1,
              overlay2,
              dispatch,
              ref,
              transition,
              circle: {
                x: circleX,
                y: circleY,
                r: circleRadius
              }
            }}
          >
            {children}
          </ColorSchemeContext.Provider>
        </Box>
      </MantineProvider>
      {active && (
        <Stage
          width={width}
          height={height}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          }}
        >
          <Layer>
            {overlay1 && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image
                image={overlay1}
                x={0}
                y={0}
                width={width}
                height={height}
              />
            )}
            {overlay2 && (
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              <animated.Circle
                y={circleY}
                x={circleX}
                radius={r}
                fillPatternImage={overlay2}
                fillPatternX={circleX.to((val) => width - val)}
                fillPatternY={circleY.to((val) => height - val)}
                fillPatternScaleX={0.5}
                fillPatternScaleY={0.5}
              />
            )}
            <Circle />
          </Layer>
        </Stage>
      )}
    </>
  )
}

export default ColorSchemeProvider
