type RsoLogoProps = {
  /** Rendered height in pixels; width scales to the logo's aspect ratio. */
  height?: number;
  className?: string;
};

// The RSO chrome wordmark. public/rso-logo-chrome.png is the original
// public/rso-logo.png art with the white field removed and cropped to the
// letters, so it sits on the dark header bar as well as on light pages. Width is
// computed from the aspect ratio rather than left as `auto`, which can collapse
// to 0 for a replaced element inside a flex column.
const ASPECT_RATIO = 640 / 204;

export default function RsoLogo({ height = 40, className }: RsoLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/rso-logo-chrome.png"
      alt="RSO"
      width={Math.round(height * ASPECT_RATIO)}
      height={height}
      style={{ height, width: Math.round(height * ASPECT_RATIO) }}
      className={className}
    />
  );
}
