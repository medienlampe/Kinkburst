import { useEffect, useState, type JSX } from "react";
import { useTranslation } from "react-i18next";

// A fine pointer (mouse / trackpad) means desktop; a coarse pointer means a
// touch device. This mirrors how the board itself distinguishes the two:
// mouse drags rotate the wheel, touch gets taps and long presses instead.
const FINE_POINTER_QUERY = "(pointer: fine)";

const useIsDesktop = () : boolean => {
  const [isDesktop, setIsDesktop] = useState<boolean>(() : boolean => window.matchMedia(FINE_POINTER_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(FINE_POINTER_QUERY);
    const onChange = (event: MediaQueryListEvent) : void => {
      setIsDesktop(event.matches);
    };
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

  return isDesktop;
};

// Device-specific usage tips, rendered as a list inside the FAQ's
// "How to use" section.
const UsageTips = () : JSX.Element => {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();

  const tips = isDesktop
    ? [t("usage_tips.rotate"), t("usage_tips.right_click"), t("usage_tips.shift")]
    : [t("usage_tips.long_press")];

  return (
    <>
      <h3 className="usage-tips-title">{t("usage_tips.title")}</h3>
      <ul className="usage-tips">
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </>
  );
}

export default UsageTips;
