# De Wet Bikes — Website

A rebuild of the [De Wet Bikes](https://www.dewetbikes.co.za/) website with the
look & feel of [WeBuyCars](https://www.webuycars.co.za/): bright yellow + deep
navy branding, a big search hero, vehicle-card listings, sliding navigation and
a **multi-page** structure — while keeping all of De Wet Bikes' own details.

## Business details used
- **De Wet Bikes** — "We buy, sell & auction motorcycles, trailers & much more"
- 971 Steve Biko Rd, Wonderboom South, Pretoria
- Phone +27 12 824 0071 · WhatsApp 079 700 5732
- Categories: motorcycles, quads, scooters, off-road, go-karts, trailers
- Brands: KTM, Husqvarna, Honda, Kawasaki, Yamaha, BMW
- Services: finance (major banks), trade-ins, weekend auctions

## Pages (like WeBuyCars — separate pages, not one scroll)
```
index.html      Home — hero slider, search, categories, featured stock, stats
buy.html        Browse stock — sidebar filters, category chips, live search
sell.html       Sell your bike — value form, how it works, FAQs
finance.html    Finance & trade-ins — repayment calculator, apply form
auctions.html   Live & online auctions — register to bid / consign
about.html      About — story, brands, stats, reviews
contact.html    Contact — details, hours, map, enquiry form
```

## Shared structure
```
css/styles.css  WeBuyCars-inspired theme (yellow/navy, cards, page heroes)
js/layout.js    Injects the shared header, slide-in drawer and footer on every
                page; highlights the active page; handles reveals, counters,
                the toast and form submissions.
js/app.js       Page features (guarded so each runs only where relevant):
                stock data + card rendering, filters & URL-param search,
                category tiles, hero slider, finance calculator.
```

The header/drawer/footer live in `layout.js` so the navigation stays identical
across pages from a single source. The current page is marked with
`<body data-page="…">`, which drives the active nav highlight.

## Sliding navigation
- Sticky header that shrinks on scroll, with animated underline links.
- Slide-in mobile drawer (staggered menu items) that marks the current page.

## Cross-page search (WeBuyCars-style)
The home hero search and the category tiles link through to **buy.html** with
URL parameters, e.g. `buy.html?cat=Off-road&make=KTM&price=100000`, which the
Buy page reads to pre-apply the filters.

## Run
Static site — no build step. Serve the folder (needed so the pages can link to
each other and `layout.js`/`app.js` load correctly):

```bash
cd dewetbikes
python3 -m http.server 8080   # then visit http://localhost:8080
```

> Listings/prices are placeholder sample data, and images are lightweight SVG
> placeholders so the site is fully self-contained — swap both for the real
> stock feed and bike photos when wiring up the backend.
