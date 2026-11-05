const approvedLogoColors = {
  steam: ['#3478aa', '#72b8e8'],
  dota2: ['#b63d34', '#ed776c'],
  cs2: ['#b46b1d', '#f0af61'],
  deadlock: ['#76599d', '#b99bdd'],
};

export function moduleAppearance(moduleId) {
  if (!Object.hasOwn(approvedLogoColors, moduleId)) return undefined;
  const [light, dark] = approvedLogoColors[moduleId];
  return {light: {logo: light}, dark: {logo: dark}};
}
