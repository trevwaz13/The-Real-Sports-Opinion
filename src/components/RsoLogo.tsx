type RsoLogoProps = {
  /** Rendered height in pixels; width scales to the logo's aspect ratio. */
  height?: number;
  className?: string;
};

// The RSO wordmark — a chrome/embossed "RSO" on a white field.
// Source asset lives at public/rso-logo.png (1536×1024) so real art drops in
// by a file swap. Width is computed from the aspect ratio rather than left as
// `auto`, which can collapse to 0 for a replaced element inside a flex column.
const ASPECT_RATIO = 1536 / 1024;

export default function RsoLogo({ height = 40, className }: RsoLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/rso-logo.png"
      alt="RSO"
      width={Math.round(height * ASPECT_RATIO)}
      height={height}
      style={{ height, width: Math.round(height * ASPECT_RATIO) }}
      className={className}
    />
  );
}
