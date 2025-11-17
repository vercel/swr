import useLocalesMap from "../use-locales-map";
import { diagramInfinitePathMap } from "../../translations/svgs";

export const Infinite = () => {
  const path = useLocalesMap(diagramInfinitePathMap);

  return (
    <svg viewBox="0 0 769 356" fill="none" className="invert-on-dark">
      <path
        d="M5 0.5H763C765.485 0.5 767.5 2.51472 767.5 5V351C767.5 353.485 765.485 355.5 763 355.5H5.00002C2.51473 355.5 0.5 353.485 0.5 351V5C0.5 2.51472 2.51472 0.5 5 0.5Z"
        fill="white"
        stroke="#EEEEEE"
      />
      <path d="M21 26H747V40H21V26Z" fill="#E5E5E5" />
      <path d="M21 70H747V84H21V70Z" fill="#E5E5E5" />
      <path d="M21 114H747V128H21V114Z" fill="#E5E5E5" />
      <path d="M21 158H747V172H21V158Z" fill="#E5E5E5" />
      <path d="M21 202H747V216H21V202Z" fill="#E5E5E5" />
      <path d="M21 246H747V260H21V246Z" fill="#E5E5E5" />
      <rect
        x="21.5"
        y="288.5"
        width="725"
        height="31"
        rx="2.5"
        fill="#FAFAFA"
        stroke="#D3D3D3"
      />
      <path d={path} fill="#454545" />
    </svg>
  );
};
