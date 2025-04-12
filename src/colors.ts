const colorMap: Record<string, string> = {
  white: "$background",
  black: "$foreground",
  gray: "$gray9",
  "light-gray": "$gray6",
  "dark-gray": "$gray11",
  red: "$red9",
  "light-red": "$red6",
  "dark-red": "$red11",
  green: "$green9",
  "light-green": "$green6",
  "dark-green": "$green11",
  blue: "$blue9",
  "light-blue": "$blue6",
  "dark-blue": "$blue11",
  yellow: "$yellow9",
  "light-yellow": "$yellow6",
  "dark-yellow": "$yellow11",
  cyan: "$cyan9",
  "light-cyan": "$cyan6",
  "dark-cyan": "$cyan11",
  magenta: "$magenta9",
  "light-magenta": "$magenta6",
  "dark-magenta": "$magenta11",
  orange: "$orange9",
  "light-orange": "$orange6",
  "dark-orange": "$orange11",
  purple: "$purple9",
  "light-purple": "$purple6",
  "dark-purple": "$purple11",
};

const colorKeys = [...Object.keys(colorMap)] as const;

export const colors = colorKeys as readonly [string, ...string[]];

export function convertColor(colorName?: string) {
  if (!colorName) return undefined;
  return colorMap[colorName];
}
