import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

async function main() {
  const url = "https://slipatip.co.za/";

  const projectRoot = process.cwd();
  const publicDir = path.join(projectRoot, "public");

  await fs.mkdir(publicDir, { recursive: true });

  const pngPath = path.join(publicDir, "qr-slipatip.png");
  const svgPath = path.join(publicDir, "qr-slipatip.svg");

  const opts = {
    errorCorrectionLevel: "H" as const,
    margin: 2,
    scale: 12,
    width: 1024,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  };

  const png = await QRCode.toBuffer(url, { ...opts, type: "png" });
  await fs.writeFile(pngPath, png);

  const svg = await QRCode.toString(url, { ...opts, type: "svg" });
  await fs.writeFile(svgPath, svg, "utf8");

  // eslint-disable-next-line no-console
  console.log("Generated:");
  // eslint-disable-next-line no-console
  console.log(pngPath);
  // eslint-disable-next-line no-console
  console.log(svgPath);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
