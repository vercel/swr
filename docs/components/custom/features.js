import { useId } from "react";
import styles from "./features.module.css";
import useLocalesMap from "./use-locales-map";
import { featuresMap, titleMap } from "../translations/text";

import BackendAgnosticIcon from "../components/icons/backend-agnostic";
import LightweightIcon from "../components/icons/lightweight";
import PaginationIcon from "../components/icons/pagination";
import RealtimeIcon from "../components/icons/realtime";
import RemoteLocalIcon from "../components/icons/remote-local";
import RenderingStrategiesIcon from "../components/icons/rendering-strategies";
import SuspenseIcon from "../components/icons/suspense";
import TypeScriptIcon from "../components/icons/typescript";

export function Feature({ text, icon }) {
  return (
    <div className={styles.feature}>
      {icon}
      <h4>{text}</h4>
    </div>
  );
}

/** @type {{ key: string; icon: React.FC }[]} */
const FEATURES_LIST = [
  { key: "lightweight", icon: <LightweightIcon /> },
  { key: "realtime", icon: <RealtimeIcon /> },
  { key: "suspense", icon: <SuspenseIcon /> },
  { key: "pagination", icon: <PaginationIcon /> },
  { key: "backendAgnostic", icon: <BackendAgnosticIcon /> },
  { key: "renderingStrategies", icon: <RenderingStrategiesIcon /> },
  { key: "typescript", icon: <TypeScriptIcon /> },
  { key: "remoteLocal", icon: <RemoteLocalIcon /> },
];

export default function Features() {
  const keyId = useId();
  const title = useLocalesMap(titleMap);
  const features = useLocalesMap(featuresMap);

  return (
    <div className="mx-auto max-w-full w-[880px] text-center px-4 mb-10">
      <p className="text-lg mb-2 text-gray-600 md:!text-2xl">{title}</p>
      <div className={styles.features}>
        {FEATURES_LIST.map(({ key, icon }) => (
          <Feature text={features[key]} icon={icon} key={keyId + key} />
        ))}
      </div>
    </div>
  );
}
