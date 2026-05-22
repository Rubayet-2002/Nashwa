import type { StaticImageData } from "next/image";
import aiubLogo from "../../../../asset/uni logo/aiub-logo.png";
import bracLogo from "../../../../asset/uni logo/BRAC_University_monogram.svg.png";
import ewuLogo from "../../../../asset/uni logo/east-west-university-ewu-logo-png_seeklogo-350606.png";
import iubLogo from "../../../../asset/uni logo/iub.png";
import nsuLogo from "../../../../asset/uni logo/North_South_University_Monogram.svg.png";
import uiuLogo from "../../../../asset/uni logo/United_International_University_Monogram.svg.png";

const universityLogos: Array<{ match: RegExp; logo: StaticImageData }> = [
  { match: /american international university bangladesh|aiub/i, logo: aiubLogo },
  { match: /brac university/i, logo: bracLogo },
  { match: /east west university|ewu/i, logo: ewuLogo },
  { match: /independent university bangladesh|iub/i, logo: iubLogo },
  { match: /north south university|nsu/i, logo: nsuLogo },
  { match: /united international university|uiu/i, logo: uiuLogo },
];

export function getUniversityLogo(universityName: string) {
  return universityLogos.find(({ match }) => match.test(universityName))?.logo ?? null;
}
