const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [
    "./layout/*.liquid",
    "./templates/customers/*.liquid",
    "./templates/*.json",
    "./sections/*.liquid",
    "./snippets/*.liquid",
    "./assets/*.js",
    "./config/settings_data.json",
  ],
  safelist: [
    {
      pattern: /order-(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20)/,
    },
    /* {
      pattern: /(bg|text|from|to)-(wave|seafoam|seaweed|sand|shell|coral)-(100|200|300|400|500|600|700|800)/,
      variants: ["xs", "sm", "md", "lg", "hover"],
    },
    {
      pattern: /(bg|object|text)-(bottom|center|left|right|top)/,
      variants: ["xs", "sm", "md", "lg"],
    },
    {
      pattern: /(text|w|max-w)-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|base)/,
      variants: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      pattern: /(w|max-w|min-w|h|max-h|min-h|bottom|top|left|right|basis)-(1\/5|1\/4|1\/3|2\/5|1\/2|3\/5|2\/3|3\/4|4\/5|full|screen)/,
      variants: ["xs", "sm", "md", "lg", "xl", "2xl"],
    },
    {
      pattern: /(w|h|p|px|py|pb|pt|pl|pr|m|mx|my|mt|mb|ml|mr|bottom|top|left|right|gap|gap-x|gap-y)-(0|1|2|3|4|5|6|7|8|9|10|12|16|20|24|26|32|36|40|44|48|52|56|60|64|72|80|auto)/,
      variants: ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"],
    },
    {
      pattern: /(hidden|block|flex|sr-only|not-sr-only)/,
      variants: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      pattern: /leading-(none|tight|snug|normal|relaxed|loose)/,
      variants: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      pattern: /font-(light|normal|book|medium|bold)/,
      variants: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      pattern: /button-(xs|sm|lg|xl|primary|secondary|tertiary|white)/,
      variants: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      pattern: /tracking-(tighter|tight|normal|wide|wider|widest)/,
      variants: ["xs", "sm", "md", "lg"],
    },
    {
      pattern: /flex-(row|row-reverse|col|col-reverse|grow|shrink)/,
      variants: ["xs", "sm", "md", "lg"],
    },
    {
      pattern: /(grid-cols|grid-rows|col-span|row-span|order)-(1|2|3|4|5|6|7|8|9|10|11|12|none)/,
      variants: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      pattern: /(opacity)-(0|5|10|20|25|30|40|50|60|70|75|80|90|100)/,
      variants: ["xs", "sm", "md", "lg", "xl"],
    },
    {
      pattern: /bg-(auto|contain|cover)/,
      variants: ["xs", "sm", "md", "lg", "xl"],
    }, */
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        "2xs": "1.5rem",
      },
    },
    colors: {
      black: "#000",
      white: "#FFF",
      transparent: "transparent",
      current: "currentColor",
      seaweed: {
        100: "#F6FCFA",
        200: "#E7F1EF",
        300: "#D4E1DE",
        400: "#A0BEB7",
        500: "#6E958B",
        600: "#497469",
        700: "#1D4D41",
        800: "#0B2E25",
      },
      coral: {
        100: "#FFF9F9",
        200: "#FFEFED",
        300: "#FDDDD8",
        400: "#FFC2B9",
        500: "#FFA496",
        600: "#FF6F61",
        700: "#F55445",
        800: "#DD2715",
      },
      wave: {
        100: "#F9FBFA",
        200: "#F1F5F4",
        300: "#E6ECEE",
        400: "#CAD8DD",
        500: "#A2BAC1",
        600: "#809BA5",
        700: "#607981",
        800: "#435961",
      },
      seafoam: {
        100: "#F5F9F1",
        200: "#EDF2EB",
        300: "#DBE5D3",
        400: "#C4D5B6",
        500: "#B0C69F",
        600: "#98AE87",
        700: "#7B9268",
        800: "#627851",
      },
      sand: {
        100: "#FFFEF9",
        200: "#FAF9F1",
        300: "#F4F3E7",
        400: "#E8E6CD",
        500: "#DAD6AE",
        600: "#CCC895",
        700: "#BEB97A",
        800: "#A9A35E",
      },
      shell: {
        100: "#FFFCF6",
        200: "#FBF5E9",
        300: "#F5EBDE",
        400: "#E9D8C3",
        500: "#DBC09E",
        600: "#CBAB82",
        700: "#BA9763",
        800: "#A98045",
      },
      aas: {
        light: "#FAF7EC",
      },
      adv: {
        light: "#F6F2F0",
      },
      apc: {
        light: "#E9EFEB",
      },
      areye: {
        light: "#F5F4EF",
      },
      bbalm: {
        light: "#F4F3EE",
      },
      cdnc: {
        light: "#F1EFF5",
        medium: "#D3C3E0",
      },
      ec: {
        light: "#F5F5F0",
      },
      eh: {
        light: "#F7F5EF",
      },
      hss: {
        light: "#EFF4EC",
      },
      oc: {
        light: "#F7F9F6",
      },
      oey: {
        light: "#FBF6F6",
        medium: "#F8EAEA",
      },
      sos: {
        light: "#F8F1EF",
      },
      swc: {
        light: "#EFF7F9",
      },
      uabb: {
        light: "#FAF5EA",
      },
      uao: {
        light: "#FFF8E1",
        medium: "#FFE49F",
      },
      ucbl: {
        light: "#FFFAF0",
      },
      ucbp: {
        light: "#F7F0E2",
      },
      "neon-green": "#DCF5AB",
      "dream-navy": "#1D284D",
    },
    fontFamily: {
      sans: "Circular, sans-serif",
      serif: "Canela, serif",
    },
    fontWeight: {
      light: 300,
      regular: 400,
      book: 500,
      medium: 600,
      bold: 700,
    },
    letterSpacing: {
      tightest: "-.075em",
      tighter: "-.05em",
      tight: "-.02em",
      normal: "0",
      slight: ".015em",
      wide: ".025em",
      wider: ".05em",
      widest: ".1em",
    },
    strokeWidth: {
      1: "1px",
      "1/25": "1.25px",
      "1/50": "1.5px",
      "1/75": "1.75px",
      2: "2px",
      "2/25": "2.25px",
      "2/50": "2.5px",
      "2/75": "2.75px",
    },
    screens: {
      "2xs": "414px",
      xs: "472px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      animation: {
        marquee: "marquee 100s linear infinite",
        skeleton: "skeleton 2s cubic-bezier(.4,0,.6,1) infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "100%": { transform: "translate3d(-50%, 0, 0)" },
        },
      },
      maxHeight: {
        100: "28rem",
      },
      maxWidth: {
        "2xs": "18rem",
      },
      order: {
        13: "13",
        14: "14",
        15: "15",
        16: "16",
        17: "17",
        18: "18",
        19: "19",
        20: "20",
      },
      textShadow: {
        sm: "0 0 2px var(--tw-shadow-color)",
        DEFAULT: "0 0 4px var(--tw-shadow-color)",
        lg: "0 0 16px var(--tw-shadow-color)",
      },
      transitionProperty: {
        height: "height",
        "max-height": "max-height",
        "max-width": "max-width",
        spacing: "margin, padding",
        "transform-opacity": "transform, opacity",
        visibility: "visibility, opacity",
        "transform-visibility": "transform, visibility",
        "transform-border": "transform, border",
      },
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
    },
    groups: ["accordion", "child"],
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    // target child elements (helpful in targeting liquid generated children)
    function ({ addVariant }) {
      addVariant("child", "& > *");
      addVariant("child-hover", "& > *:hover");
      addVariant("link", "&:link");
      addVariant("small", "& small");
      addVariant("span", "& > span");
      addVariant("video", "& > video");
      addVariant("label", "& label");
      addVariant("img", "& img");
      addVariant("li", "& li");
      addVariant("td", "& > td");
      addVariant("tr", "& > tr");
      addVariant("th", "& > th");
      addVariant("h1", "& h1");
      addVariant("h2", "& h2");
      addVariant("a", "& a");
      addVariant("b", "& b");
      addVariant("i", "& i");
      addVariant("p", "& p");
    },
    // add backface classes
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".backface-visible": { "backface-visibility": "visible" },
        ".backface-hidden": { "backface-visibility": "hidden" },
      });
    }),
    // add named groups: https://github.com/tailwindlabs/tailwindcss/issues/1192#issuecomment-1069149920
    plugin(({ addVariant, theme }) => {
      const groups = theme("groups") || [];

      groups.forEach((group) => {
        addVariant(`group-${group}-hover`, () => {
          return `:merge(.group-${group}):hover &`;
        });
        addVariant(`group-${group}-open`, () => {
          return `:merge(.group-${group})[open] &`;
        });
      });
    }),
    // add functionality for peer-group stack
    plugin(function groupPeer({ addVariant }) {
      let pseudoVariants = [
        // ... Any other pseudo variants you want to support.
        // See https://github.com/tailwindlabs/tailwindcss/blob/6729524185b48c9e25af62fc2372911d66e7d1f0/src/corePlugins.js#L78
        "checked",
      ].map((variant) => (Array.isArray(variant) ? variant : [variant, `&:${variant}`]));

      for (let [variantName, state] of pseudoVariants) {
        addVariant(`group-peer-${variantName}`, (ctx) => {
          let result = typeof state === "function" ? state(ctx) : state;
          return result.replace(/&(\S+)/, ":merge(.peer)$1 ~ .group &");
        });
      }
    }),
    // add support for text-shadow
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") }
      );
    }),
  ],
};
