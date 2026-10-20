// Renders TeX to HTML with KaTeX for _plugins/katex-prerender.rb.
// stdin: JSON array of {tex, display}; stdout: JSON array of HTML strings,
// or null where KaTeX could not parse the input.
const katex = require("./katex.min.js");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const out = JSON.parse(input).map(({ tex, display }) => {
    try {
      return katex.renderToString(tex, { displayMode: display, throwOnError: true });
    } catch (e) {
      return null;
    }
  });
  process.stdout.write(JSON.stringify(out));
});
