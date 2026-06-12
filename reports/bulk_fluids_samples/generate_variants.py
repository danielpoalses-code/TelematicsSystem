#!/usr/bin/env python3
"""
Powerstar Bulk Fluids — 10 PDF design samples.
Same sample data in every version; only the visual design changes.
Renders with WeasyPrint. Outputs sample_01 ... sample_10 (.pdf + .html).
"""
import os
from weasyprint import HTML

OUT = os.path.dirname(os.path.abspath(__file__))
GENERATED = "12 Jun 2026 · 06:00 SAST"


# ---------------------------------------------------------------- sample data
def make_data():
    # 14-day end-of-day level series, derived so every number reconciles
    diesel_series = [6840, 6420, 6010, 5630, 5190, 4760, 4310,
                     10510, 10110, 9690, 9290, 8870, 8460, 8040]
    coolant_series = [1690, 1648, 1611, 1572, 1530, 1494, 1452,
                      1415, 1377, 1340, 1298, 1261, 1223, 1186]
    d_cur, c_cur = diesel_series[-1], coolant_series[-1]
    return {
        "diesel": {
            "name": "Diesel", "capacity": 14400, "reorder": 4000,
            "current": d_cur, "pct": d_cur / 14400,
            "avg": 412, "used_yday": 420, "today": 184,
            "days_reorder": round((d_cur - 4000) / 412, 1),
            "days_empty": round(d_cur / 412, 1),
            "refill_l": 6200, "refill_date": "5 Jun",
            "margin": d_cur - 4000, "status": "OK",
            "series": diesel_series, "orient": "h",
        },
        "coolant": {
            "name": "Coolant", "capacity": 2500, "reorder": 1000,
            "current": c_cur, "pct": c_cur / 2500,
            "avg": 38, "used_yday": 37, "today": 12,
            "days_reorder": round((c_cur - 1000) / 38, 1),
            "days_empty": round(c_cur / 38, 1),
            "refill_l": 900, "refill_date": "21 May",
            "margin": c_cur - 1000, "status": "LOW",
            "series": coolant_series, "orient": "v",
        },
    }


def L(n):  # 8 040 style thousands
    return f"{n:,.0f}".replace(",", " ")


def pcts(t):
    return f"{round(t['pct'] * 100)}%"


# ---------------------------------------------------------------- SVG helpers
def chart_svg(t, color, w=480, h=84, line_w=1.6, bg=None, grid=None,
              reorder_col="#8a9099", text_col="#8a9099", marker="#2f8159",
              dot=True, font="Inter"):
    """14-day level line + dashed reorder line + refill markers + endpoint."""
    s = t["series"]
    top = max(max(s), t["reorder"]) * 1.08
    pad_l, pad_r, pad_t, pad_b = 4, 64, 8, 8
    iw, ih = w - pad_l - pad_r, h - pad_t - pad_b
    xs = [pad_l + i * iw / (len(s) - 1) for i in range(len(s))]
    ys = [pad_t + ih * (1 - v / top) for v in s]
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in zip(xs, ys))
    ry = pad_t + ih * (1 - t["reorder"] / top)
    el = [f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    if bg:
        el.append(f'<rect x="0" y="0" width="{w}" height="{h}" rx="4" fill="{bg}"/>')
    if grid:
        for gy in (pad_t, pad_t + ih / 2, pad_t + ih):
            el.append(f'<line x1="{pad_l}" y1="{gy:.1f}" x2="{w-pad_r}" y2="{gy:.1f}" stroke="{grid}" stroke-width="0.7"/>')
    el.append(f'<line x1="{pad_l}" y1="{ry:.1f}" x2="{w-pad_r}" y2="{ry:.1f}" stroke="{reorder_col}" stroke-width="1" stroke-dasharray="4 3"/>')
    el.append(f'<text x="{w-pad_r+5}" y="{ry+3:.1f}" font-family="{font}" font-size="8" fill="{text_col}">reorder {L(t["reorder"])}</text>')
    el.append(f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="{line_w}" stroke-linejoin="round"/>')
    for i in range(1, len(s)):                      # refill markers (rise > 200 L)
        if s[i] - s[i - 1] > 200:
            x, y = xs[i], ys[i]
            el.append(f'<path d="M{x:.1f} {y-9:.1f} l4.5 7 h-9 z" fill="{marker}"/>')
    if dot:
        el.append(f'<circle cx="{xs[-1]:.1f}" cy="{ys[-1]:.1f}" r="2.6" fill="{color}"/>')
    el.append(f'<text x="{xs[-1]+7:.1f}" y="{ys[-1]+3:.1f}" font-family="{font}" font-size="8.5" font-weight="600" fill="{text_col}">{L(t["current"])} today</text>')
    el.append("</svg>")
    return "".join(el)


def hbar(t, color, track="#eef0f2", w=190, h=34, r=6, ink="#1d2228", font="Inter"):
    fw = max(10, int(w * t["pct"]))
    label = f'{pcts(t)} · {L(t["current"])} L'
    inside = fw > 95
    tx = fw - 8 if inside else fw + 8
    anc = "end" if inside else "start"
    tc = "#ffffff" if inside else ink
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<rect x="0" y="0" width="{w}" height="{h}" rx="{r}" fill="{track}"/>'
            f'<rect x="0" y="0" width="{fw}" height="{h}" rx="{r}" fill="{color}"/>'
            f'<text x="{tx}" y="{h/2+3.5}" text-anchor="{anc}" font-family="{font}" '
            f'font-size="10" font-weight="700" fill="{tc}">{label}</text></svg>')


def _on_fill(color):  # readable text colour on top of a fill
    rgb = [int(color.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)] if len(color) == 7 else [0, 0, 0]
    return "#1d2228" if 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] > 150 else "#ffffff"


def vbar(t, color, track="#eef0f2", w=56, h=86, r=6, ink="#1d2228", font="Inter"):
    fh = max(8, int(h * t["pct"]))
    fill_top = h - fh
    c1 = _on_fill(color) if h / 2 > fill_top else ink  # label colour vs fill overlap
    c2 = _on_fill(color) if h / 2 + 11 > fill_top else ink
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<rect x="0" y="0" width="{w}" height="{h}" rx="{r}" fill="{track}"/>'
            f'<rect x="0" y="{fill_top}" width="{w}" height="{fh}" rx="{r}" fill="{color}"/>'
            f'<text x="{w/2}" y="{h/2}" text-anchor="middle" font-family="{font}" font-size="10.5" font-weight="800" fill="{c1}">{pcts(t)}</text>'
            f'<text x="{w/2}" y="{h/2+11}" text-anchor="middle" font-family="{font}" font-size="7.5" fill="{c2}">{L(t["current"])} L</text></svg>')


def tank_visual(t, color, **kw):
    return hbar(t, color, **kw) if t["orient"] == "h" else vbar(t, color, **kw)


def margin_phrase(t):
    side = "above" if t["margin"] >= 0 else "below"
    return f"margin {L(abs(t['margin']))} L {side} the reorder level"


def render(name, html):
    path = os.path.join(OUT, name)
    with open(path + ".html", "w") as f:
        f.write(html)
    HTML(string=html, base_url=OUT).write_pdf(path + ".pdf")
    print("wrote", name + ".pdf")


PAGE = "@page{{size:A4;margin:{m};{extra}}}"


# ============================================================ 01 · BASELINE
def v01(d):
    ink, mut, hair, track = "#1d2228", "#8a9099", "#ececef", "#eef0f2"
    cols = {"Diesel": "#a87f2c", "Coolant": "#3e7888"}
    badge = {"OK": ("#eaf3ee", "#2f8159"), "LOW": ("#fbf2e0", "#b07d1f"),
             "REORDER": ("#fbeceb", "#c0605e")}
    secs = ""
    for t in d.values():
        c = cols[t["name"]]
        bb, bc = badge[t["status"]]
        alert = ('<div style="border-left:3px solid #c0605e;background:#fbeceb;color:#9c4a48;'
                 'padding:6px 10px;font-size:10px;margin:8px 0;border-radius:0 4px 4px 0">'
                 'At or below the reorder level — place an order now.</div>') if t["status"] == "REORDER" else ""
        secs += f"""
<div class="sec">
 <div class="row"><span class="fname" style="color:{c}">{t['name']}</span>
  <span class="badge" style="background:{bb};color:{bc}">{t['status']}</span></div>
 {alert}
 <table class="lay"><tr>
  <td style="width:215px;vertical-align:middle">{tank_visual(t, c, track=track, ink=ink)}</td>
  <td style="vertical-align:middle;padding-left:18px">
    <div class="hero">{max(0, t['days_reorder'])}<span class="hu"> days to reorder</span></div>
    <div class="sub">{margin_phrase(t)}</div></td>
  <td style="vertical-align:middle;padding-left:18px">
    <div class="g">CONSUMPTION</div>
    <div class="m"><b>{L(t['avg'])}</b> avg L/day &nbsp;·&nbsp; <b>{L(t['used_yday'])}</b> yesterday &nbsp;·&nbsp; <b>{L(t['today'])}</b> today</div>
    <div class="g" style="margin-top:7px">SUPPLY</div>
    <div class="m"><b>{t['days_empty']}</b> days to empty &nbsp;·&nbsp; last refill <b>{L(t['refill_l'])} L</b> · {t['refill_date']}</div></td>
 </tr></table>
 <div style="margin-top:10px">{chart_svg(t, c, w=540, h=88)}</div>
</div>"""
    return f"""<html><head><style>
{PAGE.format(m="11mm", extra="")}
body{{font-family:Inter;font-size:11px;color:{ink};margin:0}}
.kick{{font-size:9px;letter-spacing:2.2px;color:{mut};font-weight:600}}
h1{{font-size:27px;font-weight:800;margin:2px 0 0}}
.gen{{font-size:9.5px;color:{mut};margin-top:2px}}
.sec{{border-top:1px solid {hair};margin-top:14px;padding-top:12px}}
.row{{display:flex;align-items:center;gap:8px}}
.fname{{font-size:15px;font-weight:800}}
.badge{{font-size:8.5px;font-weight:800;letter-spacing:1px;padding:2.5px 8px;border-radius:9px}}
.lay{{width:100%;border-collapse:collapse;margin-top:9px}}
.hero{{font-size:30px;font-weight:900;font-variant-numeric:tabular-nums}}
.hu{{font-size:10px;font-weight:600;color:{mut}}}
.sub{{font-size:9.5px;color:{mut}}}
.g{{font-size:8px;letter-spacing:1.6px;color:{mut};font-weight:700}}
.m{{font-size:10px;margin-top:2px}} .m b{{font-weight:800}}
.foot{{margin-top:16px;border-top:1px solid {hair};padding-top:7px;font-size:8.5px;color:{mut}}}
</style></head><body>
<div class="kick">POWERSTAR · PIETERMARITZBURG FACTORY</div>
<h1>Bulk Fluids</h1><div class="gen">Generated {GENERATED}</div>
{secs}
<div class="foot">Automated by the KhuluDigital telematics pipeline. &nbsp;·&nbsp; Sample 01 — Baseline</div>
</body></html>"""


# ============================================================ 02 · DARK CONTROL ROOM
def v02(d):
    bg, panel, ink, mut, grid = "#11161d", "#19212b", "#e8edf3", "#7c8794", "#232d3a"
    cols = {"Diesel": "#e3a93c", "Coolant": "#5fb7cc"}
    bcol = {"OK": "#46c489", "LOW": "#e0a93c", "REORDER": "#e06c66"}
    secs = ""
    for t in d.values():
        c = cols[t["name"]]
        secs += f"""
<div class="panel">
 <div class="row"><span class="fname" style="color:{c}">{t['name'].upper()}</span>
  <span class="badge" style="color:{bcol[t['status']]};border:1px solid {bcol[t['status']]}">{t['status']}</span></div>
 <table class="lay"><tr>
  <td style="width:200px;vertical-align:middle">{tank_visual(t, c, track="#0d1218", ink=ink)}</td>
  <td style="vertical-align:middle;padding-left:16px">
   <div class="hero" style="color:{c}">{max(0, t['days_reorder'])}</div>
   <div class="hu">DAYS TO REORDER</div>
   <div class="sub">{margin_phrase(t)}</div></td>
  <td style="vertical-align:middle;padding-left:16px;font-family:'Liberation Mono'">
   <div class="kv"><span>AVG USE</span><b>{L(t['avg'])} L/d</b></div>
   <div class="kv"><span>USED YDAY</span><b>{L(t['used_yday'])} L</b></div>
   <div class="kv"><span>TODAY</span><b>{L(t['today'])} L</b></div>
   <div class="kv"><span>DAYS EMPTY</span><b>{t['days_empty']}</b></div>
   <div class="kv"><span>LAST REFILL</span><b>{L(t['refill_l'])} L · {t['refill_date']}</b></div></td>
 </tr></table>
 <div style="margin-top:8px">{chart_svg(t, c, w=520, h=84, bg="#0d1218", grid=grid, reorder_col="#5a6675", text_col=mut, marker="#46c489", font="Liberation Mono")}</div>
</div>"""
    return f"""<html><head><style>
{PAGE.format(m="10mm", extra=f"background:{bg};")}
body{{font-family:Inter;font-size:11px;color:{ink};margin:0}}
.kick{{font-family:'Liberation Mono';font-size:9px;letter-spacing:2px;color:{mut}}}
h1{{font-size:25px;font-weight:800;margin:2px 0 0;color:#fff}}
.gen{{font-family:'Liberation Mono';font-size:9px;color:{mut};margin-top:2px}}
.panel{{background:{panel};border:1px solid {grid};border-radius:10px;padding:13px 15px;margin-top:13px}}
.row{{display:flex;align-items:center;gap:9px}}
.fname{{font-size:14px;font-weight:800;letter-spacing:1.5px}}
.badge{{font-family:'Liberation Mono';font-size:8.5px;font-weight:700;padding:2px 8px;border-radius:3px}}
.lay{{width:100%;border-collapse:collapse;margin-top:10px}}
.hero{{font-size:32px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1}}
.hu{{font-size:7.5px;letter-spacing:1.8px;color:{mut};font-weight:700;margin-top:2px}}
.sub{{font-size:9px;color:{mut};margin-top:3px}}
.kv{{display:flex;justify-content:space-between;font-size:9px;padding:1.5px 0;width:215px}}
.kv span{{color:{mut}}} .kv b{{color:{ink};font-weight:700}}
.foot{{margin-top:14px;font-family:'Liberation Mono';font-size:8.5px;color:{mut};text-align:center}}
</style></head><body>
<div class="kick">POWERSTAR // PIETERMARITZBURG FACTORY</div>
<h1>BULK FLUIDS — TANK MONITOR</h1>
<div class="gen">GENERATED {GENERATED.upper()}</div>
{secs}
<div class="foot">AUTOMATED BY THE KHULUDIGITAL TELEMATICS PIPELINE · SAMPLE 02 — DARK CONTROL ROOM</div>
</body></html>"""


# ============================================================ 03 · INDUSTRIAL BOLD
def v03(d):
    yellow, ink = "#f5b800", "#101010"
    cols = {"Diesel": "#a87f2c", "Coolant": "#3e7888"}
    secs = ""
    for t in d.values():
        c = cols[t["name"]]
        chip = {"OK": "#1d7a4c", "LOW": "#b07d1f", "REORDER": "#b3261e"}[t["status"]]
        secs += f"""
<div class="sec">
 <div class="bar"><span class="fname">{t['name'].upper()}</span>
  <span class="badge" style="background:{chip}">{t['status']}</span>
  <span class="fill"></span><span class="lvl">{pcts(t)} FULL · {L(t['current'])} L</span></div>
 <table class="lay"><tr>
  <td style="width:225px;vertical-align:middle">{tank_visual(t, c, track="#e4e4e4", ink=ink)}</td>
  <td style="vertical-align:middle;padding-left:16px;border-left:3px solid {ink}">
   <div class="hero">{max(0, t['days_reorder'])} <span class="hu">DAYS TO REORDER</span></div>
   <div class="sub">{margin_phrase(t).upper()}</div></td>
  <td style="vertical-align:middle;padding-left:16px">
   <table class="mt">
    <tr><td>AVG USE</td><td>{L(t['avg'])} L/DAY</td><td>DAYS TO EMPTY</td><td>{t['days_empty']}</td></tr>
    <tr><td>USED YESTERDAY</td><td>{L(t['used_yday'])} L</td><td>LAST REFILL</td><td>{L(t['refill_l'])} L · {t['refill_date'].upper()}</td></tr>
    <tr><td>TODAY'S DRAW</td><td>{L(t['today'])} L</td><td>REORDER AT</td><td>{L(t['reorder'])} L</td></tr>
   </table></td>
 </tr></table>
 <div style="margin-top:9px">{chart_svg(t, ink, w=540, h=82, line_w=2.2, reorder_col="#b3261e", text_col="#444", marker=c)}</div>
</div>"""
    return f"""<html><head><style>
{PAGE.format(m="10mm", extra="")}
body{{font-family:Inter;font-size:11px;color:{ink};margin:0}}
.head{{background:{ink};color:{yellow};padding:12px 14px;margin:0 0 4px}}
.kick{{font-size:8.5px;letter-spacing:3px;font-weight:800;color:#fff}}
h1{{font-size:30px;font-weight:900;margin:1px 0 0;letter-spacing:1px}}
.gen{{font-size:9px;color:#cfcfcf;margin-top:2px;font-weight:600}}
.sec{{margin-top:14px;border-top:3px solid {ink};padding-top:10px}}
.bar{{display:flex;align-items:center;gap:10px}}
.fname{{font-size:17px;font-weight:900;letter-spacing:2px}}
.badge{{color:#fff;font-size:9px;font-weight:900;letter-spacing:1.5px;padding:3px 10px}}
.fill{{flex:1}} .lvl{{font-size:10px;font-weight:800}}
.lay{{width:100%;border-collapse:collapse;margin-top:10px}}
.hero{{font-size:33px;font-weight:900;font-variant-numeric:tabular-nums}}
.hu{{font-size:9px;font-weight:800;letter-spacing:1px}}
.sub{{font-size:8.5px;font-weight:700;color:#555;letter-spacing:.5px}}
.mt{{border-collapse:collapse;font-size:8.5px}}
.mt td{{padding:2.5px 10px 2.5px 0;font-weight:600;color:#555}}
.mt td:nth-child(even){{font-weight:900;color:{ink};padding-right:18px}}
.foot{{margin-top:14px;background:{yellow};color:{ink};font-size:8.5px;font-weight:800;
letter-spacing:1px;padding:6px 10px}}
</style></head><body>
<div class="head"><div class="kick">POWERSTAR · PIETERMARITZBURG FACTORY</div>
<h1>BULK FLUIDS</h1><div class="gen">GENERATED {GENERATED.upper()}</div></div>
{secs}
<div class="foot">AUTOMATED BY THE KHULUDIGITAL TELEMATICS PIPELINE — SAMPLE 03 · INDUSTRIAL BOLD</div>
</body></html>"""


# ============================================================ 04 · SWISS MINIMAL
def v04(d):
    ink, mut, hair, red = "#111111", "#9a9a9a", "#e3e3e3", "#e0312c"
    secs = ""
    for t in d.values():
        dot = {"OK": "#111", "LOW": red, "REORDER": red}[t["status"]]
        secs += f"""
<div class="sec">
 <div class="row"><span class="dot" style="background:{dot}"></span>
  <span class="fname">{t['name']}</span><span class="st">{t['status']}</span>
  <span class="fillx"></span><span class="lvl">{pcts(t)} — {L(t['current'])} L of {L(t['capacity'])}</span></div>
 <table class="grid"><tr>
  <td><div class="lab">DAYS TO REORDER</div><div class="big">{max(0, t['days_reorder'])}</div>
      <div class="note">{margin_phrase(t)}</div></td>
  <td><div class="lab">AVG USE</div><div class="num">{L(t['avg'])}<span class="u"> L/day</span></div>
      <div class="lab" style="margin-top:7px">USED YESTERDAY</div><div class="num">{L(t['used_yday'])}<span class="u"> L</span></div></td>
  <td><div class="lab">TODAY'S DRAW</div><div class="num">{L(t['today'])}<span class="u"> L</span></div>
      <div class="lab" style="margin-top:7px">DAYS TO EMPTY</div><div class="num">{t['days_empty']}</div></td>
  <td><div class="lab">LAST REFILL</div><div class="num">{L(t['refill_l'])}<span class="u"> L</span></div>
      <div class="note">{t['refill_date']} 2026</div>
      <div class="lab" style="margin-top:7px">REORDER LEVEL</div><div class="num">{L(t['reorder'])}<span class="u"> L</span></div></td>
 </tr></table>
 <div style="margin-top:8px">{chart_svg(t, ink, w=545, h=78, line_w=1.1, reorder_col=red, text_col=mut, marker=ink, dot=False)}</div>
</div>"""
    return f"""<html><head><style>
{PAGE.format(m="13mm", extra="")}
body{{font-family:Inter;font-size:11px;color:{ink};margin:0;font-weight:400}}
.top{{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid {ink};padding-bottom:8px}}
h1{{font-size:21px;font-weight:600;margin:0;letter-spacing:-.3px}}
.meta{{font-size:8.5px;color:{mut};letter-spacing:1.5px;text-align:right;line-height:1.6}}
.sec{{margin-top:20px;border-bottom:1px solid {hair};padding-bottom:16px}}
.row{{display:flex;align-items:center;gap:8px}}
.dot{{width:7px;height:7px;border-radius:50%}}
.fname{{font-size:13px;font-weight:600}}
.st{{font-size:8px;letter-spacing:2px;color:{mut}}}
.fillx{{flex:1}} .lvl{{font-size:9.5px;color:{mut}}}
.grid{{width:100%;border-collapse:collapse;margin-top:13px}}
.grid td{{vertical-align:top;width:25%;border-left:1px solid {hair};padding:0 0 0 11px}}
.grid td:first-child{{border-left:none;padding-left:0}}
.lab{{font-size:7.5px;letter-spacing:1.8px;color:{mut};font-weight:500}}
.big{{font-size:34px;font-weight:300;letter-spacing:-1px;font-variant-numeric:tabular-nums;line-height:1.1}}
.num{{font-size:14px;font-weight:500;font-variant-numeric:tabular-nums}}
.u{{font-size:9px;color:{mut};font-weight:400}}
.note{{font-size:8.5px;color:{mut};margin-top:1px}}
.foot{{margin-top:16px;font-size:8px;color:{mut};letter-spacing:1.5px}}
</style></head><body>
<div class="top"><h1>Bulk Fluids</h1>
<div class="meta">POWERSTAR — PIETERMARITZBURG FACTORY<br/>GENERATED {GENERATED.upper()}</div></div>
{secs}
<div class="foot">AUTOMATED BY THE KHULUDIGITAL TELEMATICS PIPELINE · SAMPLE 04 — SWISS MINIMAL</div>
</body></html>"""


# ============================================================ 05 · KPI CARD DASHBOARD
def v05(d):
    bgp, ink, mut = "#f4f6f8", "#1f2733", "#8b95a3"
    cols = {"Diesel": "#a87f2c", "Coolant": "#3e7888"}
    badge = {"OK": ("#e7f4ec", "#2f8159"), "LOW": ("#fdf3df", "#a8770e"),
             "REORDER": ("#fcebea", "#c0473f")}
    cards = ""
    for t in d.values():
        c = cols[t["name"]]
        bb, bc = badge[t["status"]]
        cards += f"""
<td class="card">
 <div class="row"><span class="ic" style="background:{c}"></span>
  <span class="fname">{t['name']}</span>
  <span class="badge" style="background:{bb};color:{bc}">{t['status']}</span></div>
 <div class="lvlrow"><span class="pctbig" style="color:{c}">{pcts(t)}</span>
  <span class="lvltxt">{L(t['current'])} L of {L(t['capacity'])} L</span></div>
 <div class="track"><div class="fillb" style="width:{t['pct']*100:.0f}%;background:{c}"></div>
  <div class="mark" style="left:{t['reorder']/t['capacity']*100:.0f}%"></div></div>
 <div class="herobox"><span class="hero">{max(0, t['days_reorder'])}</span>
  <span class="hu">days to reorder<br/><span class="hn">{margin_phrase(t)}</span></span></div>
 <table class="kpis"><tr>
  <td><div class="kl">AVG USE</div><div class="kn">{L(t['avg'])} <span class="ku">L/d</span></div></td>
  <td><div class="kl">YESTERDAY</div><div class="kn">{L(t['used_yday'])} <span class="ku">L</span></div></td>
  <td><div class="kl">TODAY</div><div class="kn">{L(t['today'])} <span class="ku">L</span></div></td></tr>
 <tr><td><div class="kl">DAYS TO EMPTY</div><div class="kn">{t['days_empty']}</div></td>
  <td colspan="2"><div class="kl">LAST REFILL</div><div class="kn">{L(t['refill_l'])} L <span class="ku">· {t['refill_date']}</span></div></td></tr>
 </table>
 <div style="margin-top:10px">{chart_svg(t, c, w=305, h=86, bg="#fafbfc", grid="#edf0f3", text_col=mut)}</div>
</td>"""
    return f"""<html><head><style>
{PAGE.format(m="9mm", extra=f"background:{bgp};")}
body{{font-family:Inter;font-size:11px;color:{ink};margin:0}}
.kick{{font-size:8.5px;letter-spacing:2.2px;color:{mut};font-weight:700}}
h1{{font-size:24px;font-weight:800;margin:2px 0 0}}
.gen{{font-size:9px;color:{mut};margin-top:1px}}
.wrap{{width:100%;border-collapse:separate;border-spacing:12px 0;margin:14px -12px 0}}
.card{{background:#fff;border-radius:16px;padding:16px;width:50%;vertical-align:top;
 box-shadow:0 1px 4px rgba(20,30,45,.08)}}
.row{{display:flex;align-items:center;gap:7px}}
.ic{{width:10px;height:10px;border-radius:3px}}
.fname{{font-size:14px;font-weight:800}}
.badge{{font-size:8px;font-weight:800;letter-spacing:1px;padding:2.5px 8px;border-radius:9px;margin-left:auto}}
.lvlrow{{margin-top:12px;display:flex;align-items:baseline;gap:8px}}
.pctbig{{font-size:25px;font-weight:900}} .lvltxt{{font-size:9.5px;color:{mut}}}
.track{{position:relative;height:9px;background:#edf0f3;border-radius:5px;margin-top:6px}}
.fillb{{height:9px;border-radius:5px}}
.mark{{position:absolute;top:-2px;width:2px;height:13px;background:{ink};opacity:.45}}
.herobox{{display:flex;align-items:center;gap:9px;margin-top:13px;background:#fafbfc;border-radius:10px;padding:9px 12px}}
.hero{{font-size:29px;font-weight:900;font-variant-numeric:tabular-nums}}
.hu{{font-size:9px;font-weight:700;color:{ink};line-height:1.35}}
.hn{{font-weight:400;color:{mut};font-size:8.5px}}
.kpis{{width:100%;border-collapse:collapse;margin-top:11px}}
.kpis td{{padding:4px 6px 4px 0}}
.kl{{font-size:7px;letter-spacing:1.4px;color:{mut};font-weight:700}}
.kn{{font-size:12.5px;font-weight:800;font-variant-numeric:tabular-nums}}
.ku{{font-size:8.5px;color:{mut};font-weight:500}}
.foot{{margin-top:13px;font-size:8.5px;color:{mut};text-align:center}}
</style></head><body>
<div class="kick">POWERSTAR · PIETERMARITZBURG FACTORY</div>
<h1>Bulk Fluids Dashboard</h1><div class="gen">Generated {GENERATED}</div>
<table class="wrap"><tr>{cards}</tr></table>
<div class="foot">Automated by the KhuluDigital telematics pipeline · Sample 05 — KPI Cards</div>
</body></html>"""


# ============================================================ 06 · OPERATIONS LEDGER
def v06(d):
    ink, mut, head = "#202632", "#7d8694", "#2b3442"
    cols = {"Diesel": "#a87f2c", "Coolant": "#3e7888"}
    dz, cz = d["diesel"], d["coolant"]
    def st(t):
        col = {"OK": "#2f8159", "LOW": "#b07d1f", "REORDER": "#c0605e"}[t["status"]]
        return f'<span style="color:{col};font-weight:800">{t["status"]}</span>'
    rows = [
        ("Status", st(dz), st(cz)),
        ("Current level", f"{L(dz['current'])} L ({pcts(dz)})", f"{L(cz['current'])} L ({pcts(cz)})"),
        ("Capacity", f"{L(dz['capacity'])} L", f"{L(cz['capacity'])} L"),
        ("Reorder level", f"{L(dz['reorder'])} L", f"{L(cz['reorder'])} L"),
        ("Days to reorder", f"<b>{max(0,dz['days_reorder'])}</b>", f"<b>{max(0,cz['days_reorder'])}</b>"),
        ("Margin vs reorder", margin_phrase(dz).replace("margin ", ""), margin_phrase(cz).replace("margin ", "")),
        ("Avg use (14 d)", f"{L(dz['avg'])} L/day", f"{L(cz['avg'])} L/day"),
        ("Used yesterday", f"{L(dz['used_yday'])} L", f"{L(cz['used_yday'])} L"),
        ("Today's draw", f"{L(dz['today'])} L", f"{L(cz['today'])} L"),
        ("Days to empty", f"{dz['days_empty']}", f"{cz['days_empty']}"),
        ("Last refill", f"{L(dz['refill_l'])} L · {dz['refill_date']}", f"{L(cz['refill_l'])} L · {cz['refill_date']}"),
    ]
    body = "".join(f"<tr><td class='k'>{k}</td><td>{a}</td><td>{b}</td></tr>" for k, a, b in rows)
    return f"""<html><head><style>
{PAGE.format(m="12mm", extra="")}
body{{font-family:Inter;font-size:10px;color:{ink};margin:0}}
.kick{{font-size:8.5px;letter-spacing:2px;color:{mut};font-weight:700}}
h1{{font-size:22px;font-weight:800;margin:2px 0 0}}
.gen{{font-size:9px;color:{mut};margin-top:1px}}
table.led{{width:100%;border-collapse:collapse;margin-top:14px;font-variant-numeric:tabular-nums}}
.led th{{background:{head};color:#fff;text-align:left;font-size:9.5px;letter-spacing:1px;padding:7px 10px;font-weight:800}}
.led th:first-child{{width:32%}}
.led td{{padding:5.5px 10px;border-bottom:1px solid #e8eaee;font-size:10px}}
.led tr:nth-child(even) td{{background:#f6f7f9}}
.led .k{{color:{mut};font-weight:600}}
.led b{{font-size:13px;font-weight:900}}
.chl{{font-size:8px;letter-spacing:1.6px;color:{mut};font-weight:700;margin:16px 0 5px}}
.bars td{{vertical-align:middle;padding:4px 14px 4px 0}}
.foot{{margin-top:16px;border-top:1px solid #e8eaee;padding-top:6px;font-size:8.5px;color:{mut}}}
</style></head><body>
<div class="kick">POWERSTAR · PIETERMARITZBURG FACTORY</div>
<h1>Bulk Fluids — Daily Operations Sheet</h1>
<div class="gen">Generated {GENERATED}</div>
<table class="led"><tr><th>METRIC</th>
<th style="color:#ecc97e">◆ DIESEL</th><th style="color:#9fd0db">◆ COOLANT</th></tr>{body}</table>
<table class="bars"><tr>
<td>{tank_visual(dz, cols['Diesel'], track='#edeff2', ink=ink, w=240, h=26)}</td>
<td>{tank_visual(cz, cols['Coolant'], track='#edeff2', ink=ink, w=56, h=72)}</td></tr></table>
<div class="chl">14-DAY LEVEL TREND</div>
{chart_svg(dz, cols['Diesel'], w=545, h=76, grid='#eef0f3', text_col=mut)}
<div style="height:6px"></div>
{chart_svg(cz, cols['Coolant'], w=545, h=76, grid='#eef0f3', text_col=mut)}
<div class="foot">Automated by the KhuluDigital telematics pipeline · Sample 06 — Operations Ledger</div>
</body></html>"""


# ============================================================ 07 · SOFT PASTEL
def v07(d):
    ink, mut = "#3a4252", "#9aa3b2"
    theme = {"Diesel": ("#fdf6ea", "#c79544", "#f3e3c3"),
             "Coolant": ("#edf6f8", "#4b93a6", "#d3e8ed")}
    badge = {"OK": ("#ddf2e4", "#27764f"), "LOW": ("#fdeed3", "#a8770e"),
             "REORDER": ("#fcdfdd", "#b3473f")}
    secs = ""
    for t in d.values():
        bg, c, track = theme[t["name"]]
        bb, bc = badge[t["status"]]
        secs += f"""
<div class="card" style="background:{bg}">
 <div class="row"><span class="fname" style="color:{c}">{t['name']}</span>
  <span class="badge" style="background:{bb};color:{bc}">{t['status']}</span>
  <span class="fillx"></span><span class="lvl">{pcts(t)} full · {L(t['current'])} L</span></div>
 <table class="lay"><tr>
  <td style="width:210px;vertical-align:middle">{tank_visual(t, c, track=track, ink=ink, r=12)}</td>
  <td style="vertical-align:middle;padding-left:18px">
   <div class="hero" style="color:{c}">{max(0, t['days_reorder'])}</div>
   <div class="hu">days until reorder</div>
   <div class="sub">{margin_phrase(t)}</div></td>
  <td style="vertical-align:middle;padding-left:14px">
   <div class="pill">Avg <b>{L(t['avg'])} L/day</b></div>
   <div class="pill">Yesterday <b>{L(t['used_yday'])} L</b></div>
   <div class="pill">Today <b>{L(t['today'])} L</b></div>
   <div class="pill">Empty in <b>{t['days_empty']} days</b></div>
   <div class="pill">Refill <b>{L(t['refill_l'])} L · {t['refill_date']}</b></div></td>
 </tr></table>
 <div style="margin-top:9px">{chart_svg(t, c, w=520, h=82, bg="#ffffff", grid="#f0f2f5", text_col=mut)}</div>
</div>"""
    return f"""<html><head><style>
{PAGE.format(m="10mm", extra="")}
body{{font-family:Inter;font-size:11px;color:{ink};margin:0}}
.head{{background:linear-gradient(100deg,#fdeedd,#e3f1f5);border-radius:18px;padding:16px 20px}}
.kick{{font-size:8.5px;letter-spacing:2px;color:{mut};font-weight:700}}
h1{{font-size:25px;font-weight:800;margin:2px 0 0;color:#465062}}
.gen{{font-size:9px;color:{mut};margin-top:2px}}
.card{{border-radius:18px;padding:15px 18px;margin-top:12px}}
.row{{display:flex;align-items:center;gap:9px}}
.fname{{font-size:15px;font-weight:800}}
.badge{{font-size:8px;font-weight:800;letter-spacing:1px;padding:3px 9px;border-radius:10px}}
.fillx{{flex:1}} .lvl{{font-size:9.5px;color:{mut};font-weight:600}}
.lay{{width:100%;border-collapse:collapse;margin-top:10px}}
.hero{{font-size:33px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}}
.hu{{font-size:9.5px;color:{ink};font-weight:700;margin-top:2px}}
.sub{{font-size:8.5px;color:{mut};margin-top:2px}}
.pill{{display:inline-block;background:#fff;border-radius:10px;padding:3px 9px;font-size:8.5px;
color:{mut};margin:0 4px 5px 0}} .pill b{{color:{ink};font-weight:800}}
.foot{{margin-top:13px;text-align:center;font-size:8.5px;color:{mut}}}
</style></head><body>
<div class="head"><div class="kick">POWERSTAR · PIETERMARITZBURG FACTORY</div>
<h1>Bulk Fluids</h1><div class="gen">Generated {GENERATED}</div></div>
{secs}
<div class="foot">Automated by the KhuluDigital telematics pipeline · Sample 07 — Soft Pastel</div>
</body></html>"""


# ============================================================ 08 · MONO B&W PRINT
def v08(d):
    secs = ""
    for t in d.values():
        flag = " !! ORDER NOW !!" if t["status"] == "REORDER" else (" — watch closely" if t["status"] == "LOW" else "")
        secs += f"""
<div class="sec">
<div class="fname">== {t['name'].upper()} ==================================== [{t['status']}]{flag}</div>
<table class="lay"><tr>
 <td style="width:210px;vertical-align:middle">{tank_visual(t, '#000', track='#fff', ink='#000', r=0)}</td>
 <td style="vertical-align:top;padding-left:14px">
  <pre class="kv">level          {L(t['current']):>9} L  ({pcts(t)} of {L(t['capacity'])} L)
reorder at     {L(t['reorder']):>9} L  ({margin_phrase(t)})
days->reorder  {max(0,t['days_reorder']):>9}
avg use        {L(t['avg']):>9} L/day     used yday  {L(t['used_yday'])} L
today's draw   {L(t['today']):>9} L         days->empty {t['days_empty']}
last refill    {L(t['refill_l']):>9} L  on {t['refill_date']} 2026</pre></td>
</tr></table>
{chart_svg(t, '#000', w=545, h=76, line_w=1.4, reorder_col='#000', text_col='#000', marker='#000', font='Liberation Mono')}
</div>"""
    return f"""<html><head><style>
{PAGE.format(m="12mm", extra="")}
body{{font-family:'Liberation Mono';font-size:10px;color:#000;margin:0}}
.h1{{font-size:17px;font-weight:700;letter-spacing:1px}}
.rule{{border-top:3px double #000;margin:6px 0}}
.meta{{font-size:9px}}
.sec{{margin-top:16px}}
.fname{{font-size:10.5px;font-weight:700;margin-bottom:8px;white-space:pre}}
.lay{{width:100%;border-collapse:collapse}}
.kv{{font-size:9.5px;line-height:1.65;margin:0}}
svg rect{{stroke:#000;stroke-width:1}}
.foot{{margin-top:16px;border-top:1px solid #000;padding-top:5px;font-size:8.5px}}
</style></head><body>
<div class="h1">POWERSTAR — BULK FLUIDS REPORT</div>
<div class="meta">Pietermaritzburg factory · Generated {GENERATED} · KhuluDigital telematics</div>
<div class="rule"></div>
{secs}
<div class="foot">Automated by the KhuluDigital telematics pipeline · Sample 08 — Mono print-lean (B&amp;W, fax/printer safe)</div>
</body></html>"""


# ============================================================ 09 · COLOR BLOCKING
def v09(d):
    cols = {"Diesel": "#a87f2c", "Coolant": "#3e7888"}
    deep = {"Diesel": "#8a6722", "Coolant": "#326271"}
    badge = {"OK": "#2f8159", "LOW": "#d99a23", "REORDER": "#c0473f"}
    secs = ""
    for t in d.values():
        c, dp = cols[t["name"]], deep[t["name"]]
        secs += f"""
<div class="banner" style="background:{c}">
 <table class="bl"><tr>
  <td style="vertical-align:middle">
   <div class="bname">{t['name'].upper()} <span class="bbadge" style="background:{badge[t['status']]}">{t['status']}</span></div>
   <div class="bsub">{pcts(t)} full · {L(t['current'])} L of {L(t['capacity'])} L</div>
   <div style="margin-top:8px">{tank_visual(t, '#ffffff', track=dp, ink='#fff', w=200 if t['orient']=='h' else 56, h=26 if t['orient']=='h' else 64)}</div></td>
  <td style="vertical-align:middle;text-align:right">
   <div class="bhero">{max(0, t['days_reorder'])}</div>
   <div class="bhu">DAYS TO REORDER</div>
   <div class="bsub2">{margin_phrase(t)}</div></td>
 </tr></table>
</div>
<table class="strip"><tr>
 <td><div class="sl">AVG USE</div><div class="sn">{L(t['avg'])} L/d</div></td>
 <td><div class="sl">USED YESTERDAY</div><div class="sn">{L(t['used_yday'])} L</div></td>
 <td><div class="sl">TODAY'S DRAW</div><div class="sn">{L(t['today'])} L</div></td>
 <td><div class="sl">DAYS TO EMPTY</div><div class="sn">{t['days_empty']}</div></td>
 <td><div class="sl">LAST REFILL</div><div class="sn">{L(t['refill_l'])} L · {t['refill_date']}</div></td>
</tr></table>
<div style="margin:6px 0 14px">{chart_svg(t, c, w=545, h=78, grid='#f0f0ee', text_col='#8a9099')}</div>"""
    return f"""<html><head><style>
{PAGE.format(m="10mm", extra="")}
body{{font-family:Inter;font-size:11px;color:#1d2228;margin:0}}
.head{{background:#16191d;color:#fff;padding:13px 16px;border-radius:6px}}
.kick{{font-size:8.5px;letter-spacing:2.4px;color:#b9bec6;font-weight:700}}
h1{{font-size:25px;font-weight:900;margin:2px 0 0}}
.gen{{font-size:9px;color:#b9bec6;margin-top:2px}}
.banner{{border-radius:6px;color:#fff;padding:14px 18px;margin-top:14px}}
.bl{{width:100%;border-collapse:collapse}}
.bname{{font-size:16px;font-weight:900;letter-spacing:1.5px}}
.bbadge{{font-size:8px;font-weight:800;letter-spacing:1px;padding:2.5px 8px;border-radius:9px;color:#fff;margin-left:6px}}
.bsub{{font-size:9.5px;opacity:.92;margin-top:3px}}
.bhero{{font-size:38px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}}
.bhu{{font-size:8px;letter-spacing:1.8px;font-weight:800;opacity:.95;margin-top:2px}}
.bsub2{{font-size:8.5px;opacity:.9;margin-top:2px}}
.strip{{width:100%;border-collapse:collapse;margin-top:7px}}
.strip td{{padding:4px 12px 4px 0}}
.sl{{font-size:7px;letter-spacing:1.5px;color:#8a9099;font-weight:700}}
.sn{{font-size:11.5px;font-weight:800;font-variant-numeric:tabular-nums}}
.foot{{border-top:1px solid #ececef;padding-top:6px;font-size:8.5px;color:#8a9099}}
</style></head><body>
<div class="head"><div class="kick">POWERSTAR · PIETERMARITZBURG FACTORY</div>
<h1>Bulk Fluids</h1><div class="gen">Generated {GENERATED}</div></div>
{secs}
<div class="foot">Automated by the KhuluDigital telematics pipeline · Sample 09 — Colour Blocking</div>
</body></html>"""


# ============================================================ 10 · EXECUTIVE SERIF
def v10(d):
    ink, mut, gold = "#23201a", "#8c8678", "#9c8347"
    cols = {"Diesel": "#8a6722", "Coolant": "#3c6e7d"}
    secs = ""
    for t in d.values():
        c = cols[t["name"]]
        stx = {"OK": "Healthy", "LOW": "Approaching reorder", "REORDER": "Order now"}[t["status"]]
        secs += f"""
<div class="sec">
 <div class="srow"><span class="fname">{t['name']}</span><span class="srule"></span>
  <span class="stx" style="color:{c}">{stx}</span></div>
 <table class="lay"><tr>
  <td style="width:46%;vertical-align:top;padding-right:20px">
   <div class="bigwrap"><span class="big">{max(0, t['days_reorder'])}</span>
    <span class="bigu">days to<br/>reorder</span></div>
   <div class="note">{margin_phrase(t).capitalize()}. Holding {L(t['current'])} litres
    ({pcts(t)} of a {L(t['capacity'])} litre tank).</div>
   <div style="margin-top:10px">{tank_visual(t, c, track='#eee9dd', ink=ink, w=215 if t['orient']=='h' else 56, h=28 if t['orient']=='h' else 74)}</div></td>
  <td style="vertical-align:top;border-left:1px solid #e2dccc;padding-left:20px">
   <table class="fact">
    <tr><td>Average use, last 14 days</td><td>{L(t['avg'])} L/day</td></tr>
    <tr><td>Used yesterday</td><td>{L(t['used_yday'])} L</td></tr>
    <tr><td>Drawn so far today</td><td>{L(t['today'])} L</td></tr>
    <tr><td>Projected days to empty</td><td>{t['days_empty']}</td></tr>
    <tr><td>Most recent delivery</td><td>{L(t['refill_l'])} L · {t['refill_date']}</td></tr>
    <tr><td>Reorder threshold</td><td>{L(t['reorder'])} L</td></tr>
   </table></td>
 </tr></table>
 <div style="margin-top:10px">{chart_svg(t, c, w=545, h=74, line_w=1.3, reorder_col=gold, text_col=mut, marker=c, dot=False, font='Liberation Serif')}</div>
</div>"""
    return f"""<html><head><style>
{PAGE.format(m="14mm", extra="background:#fffdf7;")}
body{{font-family:'Liberation Serif';font-size:11px;color:{ink};margin:0}}
.lh{{text-align:center;border-bottom:1px solid {gold};padding-bottom:10px}}
.brand{{font-family:Inter;font-size:10px;letter-spacing:5px;font-weight:800;color:{ink}}}
h1{{font-size:26px;font-weight:400;margin:6px 0 0;font-style:italic}}
.gen{{font-family:Inter;font-size:8px;letter-spacing:1.8px;color:{mut};margin-top:5px}}
.sec{{margin-top:20px}}
.srow{{display:flex;align-items:center;gap:12px}}
.fname{{font-size:16px;font-weight:700;letter-spacing:.5px}}
.srule{{flex:1;border-top:1px solid #e2dccc}}
.stx{{font-family:Inter;font-size:8.5px;letter-spacing:1.5px;font-weight:700;text-transform:uppercase}}
.lay{{width:100%;border-collapse:collapse;margin-top:12px}}
.bigwrap{{display:flex;align-items:center;gap:10px}}
.big{{font-size:44px;font-weight:400;line-height:1;font-variant-numeric:tabular-nums}}
.bigu{{font-family:Inter;font-size:8.5px;letter-spacing:1.5px;font-weight:700;color:{mut};text-transform:uppercase;line-height:1.5}}
.note{{font-size:10.5px;color:#54503f;margin-top:8px;line-height:1.55;font-style:italic}}
.fact{{width:100%;border-collapse:collapse}}
.fact td{{padding:4.5px 0;border-bottom:1px dotted #ddd6c2;font-size:10.5px}}
.fact td:last-child{{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}}
.foot{{margin-top:20px;border-top:1px solid {gold};padding-top:7px;text-align:center;
font-family:Inter;font-size:7.5px;letter-spacing:1.8px;color:{mut}}}
</style></head><body>
<div class="lh"><div class="brand">P O W E R S T A R</div>
<h1>Bulk Fluids Report</h1>
<div class="gen">PIETERMARITZBURG FACTORY · GENERATED {GENERATED.upper()}</div></div>
{secs}
<div class="foot">AUTOMATED BY THE KHULUDIGITAL TELEMATICS PIPELINE · SAMPLE 10 — EXECUTIVE SERIF</div>
</body></html>"""


VARIANTS = [
    ("sample_01_baseline", v01), ("sample_02_dark_control_room", v02),
    ("sample_03_industrial_bold", v03), ("sample_04_swiss_minimal", v04),
    ("sample_05_kpi_cards", v05), ("sample_06_operations_ledger", v06),
    ("sample_07_soft_pastel", v07), ("sample_08_mono_print", v08),
    ("sample_09_colour_blocking", v09), ("sample_10_executive_serif", v10),
]

if __name__ == "__main__":
    data = make_data()
    for name, fn in VARIANTS:
        render(name, fn(data))
