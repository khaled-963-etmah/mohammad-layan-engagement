#!/usr/bin/env python3
"""One-off: convert the PNGs the page uses to resized WebP, point the page at the
compressed media in assets/media/, and report what is no longer referenced."""
import os, re
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__)); site = os.path.join(here, "..", "site")
files = [os.path.join(here, "page.html"), os.path.join(site, "assets/js/seal.js")]
text = {f: open(f, encoding="utf-8").read() for f in files}
refs = sorted({m for t in text.values() for m in re.findall(r"assets/[^\"' )]+\.png", t)})
# longest side in pixels, by how big each picture is shown (2x for sharp phone screens)
BIG = {"tild6665": 900, "tild6461": 900, "envelope-clean": 1280, "seal-patch": 340,
       "tild3561": 700, "tild3766": 700, "tild6262": 700, "tild3462": 700}
names = {}
for r in refs:
    src = os.path.join(site, r)
    key = next((k for k in BIG if k in r), None)
    limit = BIG.get(key, 480)
    im = Image.open(src); im.load()
    if max(im.size) > limit:
        s = limit / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    base = os.path.splitext(os.path.basename(r))[0]
    tid = re.search(r"(tild\d{4})", r)
    name = f"{tid.group(1)}-{base}" if tid else base
    out = f"assets/img/{name}.webp"
    im.save(os.path.join(site, out), "WEBP", quality=84, method=6)
    names[r] = out
    print(f"{os.path.getsize(src)//1024:6d}K -> {os.path.getsize(os.path.join(site, out))//1024:5d}K  {out}")
media = {"assets/assets.webgencyinvitations.com/Envelope_opening_with_golden_light_202607270136__2_.mp4": "assets/media/envelope.mp4",
         "assets/pub-4dc8201144ca418fb604349c73e8c724.r2.dev/Newbeautifulvideo.mp4": "assets/media/hero.mp4",
         "assets/pub-4dc8201144ca418fb604349c73e8c724.r2.dev/Einaudi__Divenire__1___1_.mp3": "assets/media/music.mp3"}
for f, t in text.items():
    for a, b in list(names.items()) + list(media.items()):
        t = t.replace(a, b)
    open(f, "w", encoding="utf-8").write(t)
