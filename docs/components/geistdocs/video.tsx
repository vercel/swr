import type { ComponentProps } from "react";
import ReactPlayer from "react-player";

type VideoProps = ComponentProps<typeof ReactPlayer>;

export const Video = (props: VideoProps) => (
  <div className="not-prose relative mb-6 aspect-video w-full overflow-hidden rounded-lg bg-black">
    <ReactPlayer
      {...props}
      className="absolute inset-0"
      controls
      height="100%"
      width="100%"
    />
  </div>
);
