import Image from "next/image";

export function ArkanaLogo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/logo.jpg"
      alt="Arkana"
      width={size}
      height={size}
      className="rounded-[26%] object-cover"
      style={{ width: size, height: size }}
      priority
    />
  );
}
