require "cgi"
require "json"
require "open3"

# Renders $...$ and $$...$$ math to HTML with KaTeX at build time, so pages
# arrive typeset instead of flashing raw TeX until the browser renders it.
# Text inside <script>, <style>, <pre>, <code>, <textarea> and <title> (e.g.
# the BibTeX blocks) is left alone. The browser-side KaTeX auto-render in
# _includes/scripts.liquid stays as a fallback for anything not rendered here.
# Needs Node.js; without it the build continues and the browser renders math.
module Jekyll
  module KatexPrerender
    RENDERER = File.join(__dir__, "katex", "render.js")
    SKIP = %w[script style pre code textarea title].freeze
    MATH = /(?<!\\)\$\$(.+?)(?<!\\)\$\$|(?<![\\$])\$(?!\s)([^$]+?)(?<![\s\\])\$(?!\d)/m

    @cache = {}
    @node_missing = false

    class << self
      def process(doc)
        html = doc.output
        return unless html&.include?("$")

        parts = html.split(/(<[^>]+>)/)
        skip_depth = 0
        jobs = []
        parts.each_with_index do |part, i|
          if part.start_with?("<")
            name = part[%r{\A</?([a-zA-Z0-9]+)}, 1]&.downcase
            next unless SKIP.include?(name) && !part.end_with?("/>")

            skip_depth += part.start_with?("</") ? -1 : 1
            skip_depth = 0 if skip_depth.negative?
          elsif skip_depth.zero? && part.include?("$")
            part.scan(MATH) { jobs << [i, Regexp.last_match] }
          end
        end
        return if jobs.empty?

        rendered = render(jobs.map { |_, m| [tex(m), !m[1].nil?] })
        return if rendered.nil?

        # replace from the end of each text part so match offsets stay valid
        jobs.zip(rendered).reverse_each do |(i, m), out|
          next if out.nil?

          parts[i] = parts[i][0...m.begin(0)] + out + parts[i][m.end(0)..]
        end
        doc.output = parts.join
      end

      private

      def tex(match)
        CGI.unescapeHTML((match[1] || match[2]).strip)
      end

      def render(items)
        return nil if @node_missing

        todo = items.uniq.reject { |it| @cache.key?(it) }
        unless todo.empty?
          payload = todo.map { |t, d| { "tex" => t, "display" => d } }.to_json
          out, err, status = Open3.capture3("node", RENDERER, stdin_data: payload)
          unless status.success?
            Jekyll.logger.warn "KaTeX prerender:", "node failed, leaving math to the browser (#{err.lines.first&.strip})"
            return nil
          end
          todo.zip(JSON.parse(out)).each { |it, html| @cache[it] = html }
        end
        items.map { |it| @cache[it] }
      rescue Errno::ENOENT
        @node_missing = true
        Jekyll.logger.warn "KaTeX prerender:", "node not found, leaving math to the browser"
        nil
      end
    end
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_render do |doc|
  next unless doc.output_ext == ".html"

  Jekyll::KatexPrerender.process(doc)
end
