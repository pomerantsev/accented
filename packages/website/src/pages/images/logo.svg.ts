import { primaryColor } from 'common/tokens';

const svg = `<svg width="100" height="100" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <rect
    x="0" y="0"
    width="1000" height="1000"
    rx="150" ry="150"
    fill="${primaryColor}"
  />
  <path style="transform: scaleY(-1) translateY(12%) translateX(22%); transform-origin: 30%;" fill="white" d="M288 545Q386 545 433.0 502.0Q480 459 480 365V0H416L399 76H395Q372 47 347.5 27.5Q323 8 291.5 -1.0Q260 -10 215 -10Q167 -10 128.5 7.0Q90 24 68.0 59.5Q46 95 46 149Q46 229 109.0 272.5Q172 316 303 320L394 323V355Q394 422 365.0 448.0Q336 474 283 474Q241 474 203.0 461.5Q165 449 132 433L105 499Q140 518 188.0 531.5Q236 545 288 545ZM314 259Q214 255 175.5 227.0Q137 199 137 148Q137 103 164.5 82.0Q192 61 235 61Q303 61 348.0 98.5Q393 136 393 214V262ZM429 756Q420 742 403.0 722.0Q386 702 365.5 680.5Q345 659 324.5 639.5Q304 620 286 606H228V618Q243 637 260.5 663.0Q278 689 295.0 716.5Q312 744 323 766H429Z" />
</svg>`;

export async function GET() {
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
    },
  });
}
