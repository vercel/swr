import useLocalesMap from "../use-locales-map";
import { diagramPaginationPathsMap } from "../../translations/svgs";

export const Pagination = () => {
  const paths = useLocalesMap(diagramPaginationPathsMap);

  return (
    <svg viewBox="0 0 769 356" fill="none" className="invert-on-dark">
      <path
        d="M5 0.5H763C765.485 0.5 767.5 2.51472 767.5 5V351C767.5 353.485 765.485 355.5 763 355.5H5.00002C2.51473 355.5 0.5 353.485 0.5 351V5C0.5 2.51472 2.51472 0.5 5 0.5Z"
        fill="white"
        stroke="#EEEEEE"
      />
      <path d="M1 288H769" stroke="#E5E5E5" />
      <path d="M21 26H747V40H21V26Z" fill="#E5E5E5" />
      <path d="M21 70H747V84H21V70Z" fill="#E5E5E5" />
      <path d="M21 114H747V128H21V114Z" fill="#E5E5E5" />
      <path d="M21 158H747V172H21V158Z" fill="#E5E5E5" />
      <path d="M21 202H747V216H21V202Z" fill="#E5E5E5" />
      <path d="M21 246H747V260H21V246Z" fill="#E5E5E5" />
      <rect
        x="21.5"
        y="306.5"
        width="69"
        height="31"
        rx="2.5"
        fill="#FAFAFA"
        stroke="#D3D3D3"
      />
      <path d={paths.prev} fill="#454545" />
      <rect
        x="307.5"
        y="306.5"
        width="69"
        height="31"
        rx="2.5"
        fill="#FAFAFA"
        stroke="#D3D3D3"
      />
      <path d={paths.next} fill="#454545" />
      <path
        d="M281.098 322.03C281.563 322.03 281.951 321.651 281.951 321.178C281.951 320.713 281.563 320.33 281.098 320.33C280.63 320.33 280.246 320.713 280.246 321.178C280.246 321.651 280.63 322.03 281.098 322.03ZM284.497 322.03C284.961 322.03 285.349 321.651 285.349 321.178C285.349 320.713 284.961 320.33 284.497 320.33C284.028 320.33 283.645 320.713 283.645 321.178C283.645 321.651 284.028 322.03 284.497 322.03ZM287.895 322.03C288.36 322.03 288.748 321.651 288.748 321.178C288.748 320.713 288.36 320.33 287.895 320.33C287.426 320.33 287.043 320.713 287.043 321.178C287.043 321.651 287.426 322.03 287.895 322.03Z"
        fill="black"
      />
      <rect
        x="103.5"
        y="306.5"
        width="44"
        height="31"
        rx="2.5"
        fill="#FAFAFA"
        stroke="#D3D3D3"
      />
      <path d={paths.one} fill="#454545" />
      <rect
        x="160.5"
        y="306.5"
        width="44"
        height="31"
        rx="2.5"
        fill="#EDEDED"
        stroke="#B3B3B3"
      />
      <path d={paths.two} fill="#454545" />
      <rect
        x="217.5"
        y="306.5"
        width="44"
        height="31"
        rx="2.5"
        fill="#FAFAFA"
        stroke="#D3D3D3"
      />
      <path d={paths.three} fill="#454545" />
    </svg>
  );
};
