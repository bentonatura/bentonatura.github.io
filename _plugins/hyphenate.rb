require "text/hyphen"

# {{ html | hyphenate }}: soft hyphens at the break points of the longer words
# in an HTML fragment's text (TeX's US English patterns, as in LaTeX), for the
# line breaking in assets/js/justify.js. Tags are left alone, and so are
# capitalized words, names mostly, which read badly split.
module Jekyll
  module HyphenateFilter
    HYPHENATOR = Text::Hyphen.new(language: "en_us", left: 2, right: 3)

    def hyphenate(html)
      html.to_s.split(/(<[^>]+>)/).map do |part|
        next part if part.start_with?("<")

        part.gsub(/(?<![\p{L}&])\p{Ll}{6,}(?!\p{L})/) { |word| HYPHENATOR.visualize(word, "\u00AD") }
      end.join
    end
  end
end

Liquid::Template.register_filter(Jekyll::HyphenateFilter)
