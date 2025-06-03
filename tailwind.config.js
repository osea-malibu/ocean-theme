const plugin = require("tailwindcss/plugin");

module.exports = {
  content: [
    "./layout/*.liquid",
    "./templates/customers/*.liquid",
    "./templates/*.json",
    "./sections/*.liquid",
    "./snippets/*.liquid",
    "./assets/*.js",
    "./src/js/*.js",
    "./config/settings_data.json",
  ],
  safelist: [
    {
      pattern: /w-(1\/6|1\/5|1\/4|1\/3|1\/2)/,
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
    extend: {
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
      addVariant("ul", "& ul");
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
