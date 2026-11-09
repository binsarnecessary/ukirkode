export const site = {
  name: "Ukirkode",
  tagline: "Build Better Digital Presence.",
  subTagline: "Website • Automation • Digital Solution",
  description:
    "Studio digital yang membantu bisnis memiliki website profesional, sistem digital, dan AI Automation. Website cepat, design premium, harga transparan.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ukirkode.vercel.app",
  email: "binsar16febuary@gmail.com",
  whatsapp: "6287830377139",
  socials: {
    tiktok: "https://www.tiktok.com/@ukirkode",
  },
};

export const waLink = (text: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
