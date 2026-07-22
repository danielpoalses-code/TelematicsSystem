# De Wet Bikes — Website

A rebuild of the [De Wet Bikes](https://www.dewetbikes.co.za/) website with the
look & feel of [WeBuyCars](https://www.webuycars.co.za/): bright yellow + deep
navy branding, a big search hero, vehicle-card listings, sliding navigation and
animated sections — while keeping all of De Wet Bikes' own details.

## Business details used
- **De Wet Bikes** — "We buy, sell & auction motorcycles, trailers & much more"
- 971 Steve Biko Rd, Wonderboom South, Pretoria
- Phone +27 12 824 0071 · WhatsApp 079 700 5732
- Categories: motorcycles, quads, scooters, off-road, go-karts, trailers
- Brands: KTM, Husqvarna, Honda, Kawasaki, Yamaha, BMW
- Services: finance (major banks), trade-ins, weekend auctions

## Structure
```
dewetbikes/
├── index.html      # single-page site (all sections + anchors)
├── css/styles.css  # WeBuyCars-inspired theme (yellow/navy, cards)
└── js/main.js      # slide-in nav, hero slider, stock filter/search,
                    # finance calculator, scroll reveals, forms
```

## Features
- **Sliding navigation** — sticky header that shrinks on scroll, animated
  underline links, and a slide-in mobile drawer with staggered menu items.
- **Hero** with auto-rotating background slider + a Find-a-bike / Value-my-bike
  search card.
- **Live stock grid** — filter by category chips or hero search, plus a
  make/model text search. Listings render from data in `js/main.js`.
- **Sell**, **How it works**, **Finance** (with a working repayment calculator),
  **Auctions**, animated **stats counters**, reviews, about and a contact form.
- Fully responsive; graceful no-JS fallback (content shows even if JS fails).

## Run
It's a static site — no build step. Open `index.html` directly, or serve it:

```bash
cd dewetbikes
python3 -m http.server 8080   # then visit http://localhost:8080
```

> Data (listings, prices) is placeholder sample content — swap it for the real
> stock feed when wiring up the backend. Images use lightweight SVG placeholders
> so the site is fully self-contained; replace with real bike photos anytime.
