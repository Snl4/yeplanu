const COLORS = ["#c45c26", "#2f6f6a", "#3d4d7a", "#8a4b3b", "#4d6b3c"];

export function makeAvatar(name: string) {
  const letter = (name.trim()[0] || "П").toUpperCase();
  const color = COLORS[letter.charCodeAt(0) % COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="28" fill="${color}"/><text x="50%" y="54%" text-anchor="middle" font-family="Manrope,sans-serif" font-size="34" font-weight="700" fill="#fff">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.readAsDataURL(file);
  });
}
