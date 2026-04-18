import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const WIDTH = 1200;
const HEIGHT = 630;

let fontCache: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const path = join(process.cwd(), 'src/assets/fonts/Ayandeh Bold.ttf');
  fontCache = (await readFile(path)).buffer as ArrayBuffer;
  return fontCache;
}

export async function createOgImage(args: {
  title: string;
  subtitle?: string;
}): Promise<ImageResponse> {
  const font = await loadFont();

  return new ImageResponse(
    (
      <div
        dir="rtl"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          backgroundColor: '#1C1917',
          fontFamily: 'Ayandeh',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '8px',
            height: '100%',
            backgroundColor: '#C4841D',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxWidth: '900px',
          }}
        >
          <p
            style={{
              fontSize: '24px',
              color: '#C4841D',
              letterSpacing: '0.1em',
              margin: 0,
            }}
          >
            ژیک
          </p>

          <h1
            style={{
              fontSize: '56px',
              fontWeight: 700,
              color: '#FAF8F5',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {args.title}
          </h1>

          {args.subtitle ? (
            <p
              style={{
                fontSize: '28px',
                color: '#A8A29E',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {args.subtitle}
            </p>
          ) : null}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        {
          name: 'Ayandeh',
          data: font,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );
}
