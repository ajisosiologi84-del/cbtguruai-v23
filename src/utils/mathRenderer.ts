import katex from 'katex';

/**
 * Safely renders KaTeX LaTeX formulas ($...$ or $$...$$ or raw LaTeX commands) into HTML.
 * Also preserves standard HTML formatting tags (b, i, u, sub, sup, table, etc.)
 */
export function renderMathInText(text: string | null | undefined): string {
  if (!text) return '';
  let str = String(text);

  // 1. Render $$...$$ display math (block formulas)
  str = str.replace(/\$\$(.+?)\$\$/gs, (_, formula) => {
    try {
      return `<div class="katex-display-block my-2 text-center overflow-x-auto">${katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      })}</div>`;
    } catch (e) {
      return formula;
    }
  });

  // 2. Render $...$ or \(...\) inline math
  str = str.replace(/\\\(|\$(.+?)\\\)|\$/g, (match, p1) => {
    const formula = p1 || match.replace(/^(\\\(|\$)|(\\\)|\$)$/g, '');
    if (!formula.trim()) return match;
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch (e) {
      return match;
    }
  });

  // 3. Render raw un-wrapped LaTeX commands like \frac{a}{b}, \sqrt{x}, \ce{H2O}
  str = str.replace(/\\(frac|sqrt|sum|int|lim|vec|alpha|beta|gamma|delta|Delta|theta|lambda|mu|rho|omega|Omega|pi|pm|le|ge|neq|approx|infty|rightarrow|rightleftharpoons|degree)\{[^{}]*\}(\{[^{}]*\})*/g, (match) => {
    try {
      return katex.renderToString(match, {
        displayMode: false,
        throwOnError: false,
      });
    } catch (e) {
      return match;
    }
  });

  return str;
}

/**
 * Formats question text with both math rendering and HTML structure
 */
export function formatQuestionAndMath(text: string | null | undefined): string {
  if (!text) return '';
  const rendered = renderMathInText(text);
  return rendered;
}
