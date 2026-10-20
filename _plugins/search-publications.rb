require "bibtex"

# Exposes the entries of the bibliography files as site.data["search_publications"],
# so that _scripts/search.liquid.js can add every paper to the site search, and
# _includes/publications_by_year.liquid can list the years that have papers.
module Jekyll
  class SearchPublicationsGenerator < Generator
    safe true
    priority :low

    # bibliography file => [page that lists its entries, search section]
    SOURCES = {
      "papers.bib" => ["/publications/", "Publications"],
      "preprints.bib" => ["/preprints/", "Preprints"],
      "thesis.bib" => ["/publications/", "Thesis"],
    }.freeze

    def generate(site)
      source = site.config.dig("scholar", "source") || "/_bibliography/"
      dir = File.join(site.source, source)

      site.data["search_publications"] = SOURCES.flat_map do |file, (page, section)|
        path = File.join(dir, file)
        next [] unless File.exist?(path)

        BibTeX.open(path, filter: :latex).data.select { |e| e.is_a?(BibTeX::Entry) }.map do |entry|
          authors = entry.author ? entry.author.map { |a| [a.first, a.last].compact.join(" ") } : []

          {
            "key" => entry.key.to_s,
            "title" => clean(entry.title),
            "authors" => clean(authors.join(", ")),
            "venue" => clean(venue(entry)),
            "year" => entry.year.to_s,
            # year of first appearance: the conference version if there is one
            "first_year" => (entry[:conference_year] || entry.year).to_s,
            "selected" => entry[:selected].to_s,
            "url" => "#{page}##{entry.key}",
            "section" => section,
          }
        end
      end
    end

    private

    # Prefer the short conference/journal fields used on the publication
    # pages ("FOCS 2022 · SIAM Journal on Computing 2025"), falling back to
    # the standard BibTeX fields.
    def venue(entry)
      venues = [%i[conference conference_year], %i[journal journal_year]].filter_map do |name, year|
        "#{entry[name]} #{entry[year]}".strip if entry[name]
      end
      return venues.join(" · ") unless venues.empty?

      [entry[:booktitle] || entry[:preprint] || entry[:publisher], entry.year].compact.join(" ")
    end

    def clean(value)
      value.to_s
        .gsub("\\ell", "ℓ")
        .gsub(/_\{?(\w+)\}?/, "\\1")
        .delete("{}$\\")
        .gsub(/\s+/, " ")
        .strip
    end
  end
end
