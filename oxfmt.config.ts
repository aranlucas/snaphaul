import base from "@aranlucas/oxforge/format-tailwind";

const config = {
  ...base,
  sortTailwindcss: { ...base.sortTailwindcss, stylesheet: "app/globals.css" },
};

export default config;
