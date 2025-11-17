import useLocalesMap from "../use-locales-map";
import { diagramWelcomePathMap } from "../../translations/svgs";

export const Welcome = () => {
  const path = useLocalesMap(diagramWelcomePathMap);

  return (
    <svg fill="none" viewBox="0 0 769 193" className="invert-on-dark">
      <path fill="#fff" d="M0 0h768v193H0z" />
      <mask
        id="a"
        width="32"
        height="32"
        x="720"
        y="11"
        maskUnits="userSpaceOnUse"
      >
        <circle cx="736" cy="27" r="16" fill="#fff" />
      </mask>
      <g mask="url(#a)">
        <circle cx="736" cy="27" r="16" fill="#EEE" />
        <circle cx="736" cy="22.9" r="6.5" fill="#C4C4C4" />
        <ellipse cx="736" cy="39.3" fill="#C4C4C4" rx="11.2" ry="7.8" />
      </g>
      <path fill="#EEE" d="M15 24h186v7H15z" />
      <path stroke="#EEE" d="M0 54.5h768" />
      <path fill="#E5E5E5" d="M423 107h108v14H423z" />
      <path fill="#000" d={path} />
      <path
        fill="#EEE"
        fillRule="evenodd"
        d="M5 1h758a4 4 0 014 4v173h1V5a5 5 0 00-5-5H5a5 5 0 00-5 5v173h1V5a4 4 0 014-4z"
        clipRule="evenodd"
      />
    </svg>
  );
};
