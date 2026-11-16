#!/usr/bin/env python3
"""Build site/index.html (and site/invite.ics) from tools/page.html.

Quran verses come verbatim from tools/verses.txt (fetched from api.alquran.cloud, quran-simple
edition: line 1 = Ar-Rum 30:21, line 2 = An-Naba 78:8) so they are never retyped by hand.

WHATSAPP: the number guests send their RSVP to, international format without + or spaces
(e.g. "9639XXXXXXXX"). Leave empty to hide the RSVP section.
"""
import os

WHATSAPP = ""

# public address of the published page (used for the link preview image); must end with /
SITE_URL = "https://khaled-963-etmah.github.io/mohammad-layan-engagement/"

TITLE = "حفل خطوبة محمد خالد عتمه وليان الرفاعي"
LOCATION = "صالة قصر الشام الملكية، المزة، دمشق"
MAPS = "https://maps.app.goo.gl/mym5dYzm7wmxYik6A"
START, END = "20261127T170000Z", "20261127T190000Z"  # Friday 27 Nov 2026, 20:00-22:00 Damascus (UTC+3)

here = os.path.dirname(os.path.abspath(__file__))
site = os.path.join(here, "..", "site")


def ics_fold(line):
    """RFC 5545: lines longer than 75 octets continue on the next line after CRLF + space."""
    out, cur = [], b""
    for ch in line:
        b = ch.encode("utf-8")
        if len(cur) + len(b) > (75 if not out else 74):
            out.append(cur); cur = b""
        cur += b
    out.append(cur)
    return "\r\n ".join(x.decode("utf-8") for x in out)


def ics_text(s):
    return s.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;")


def build_ics():
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//engagement-invite//AR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
             "BEGIN:VEVENT", "UID:mohammad-layan-20261127@engagement-invite", "DTSTAMP:20261116T000000Z",
             f"DTSTART:{START}", f"DTEND:{END}",
             f"SUMMARY:{ics_text(TITLE)}", f"LOCATION:{ics_text(LOCATION)}",
             f"DESCRIPTION:{ics_text('الموقع على الخريطة: ' + MAPS)}", f"URL:{MAPS}",
             "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT3H", f"DESCRIPTION:{ics_text(TITLE)}", "END:VALARM",
             "END:VEVENT", "END:VCALENDAR"]
    with open(os.path.join(site, "invite.ics"), "w", encoding="utf-8", newline="") as f:
        f.write("\r\n".join(ics_fold(l) for l in lines) + "\r\n")


RSVP = '''  <!-- RSVP: builds a WhatsApp message to the family -->
  <section class="rsvp reveal">
    <h2>تأكيد الحضور</h2>
    <img class="divider" src="assets/img/tild3337-ChatGPT_Image_Jul_5_.webp" alt="">
    <form class="card" id="rsvp" autocomplete="on">
      <label for="rsvp-name">الاسم</label>
      <input id="rsvp-name" name="name" required placeholder="اكتب اسمك">
      <label>هل ستحضر؟</label>
      <div class="choice">
        <label><input type="radio" name="come" value="yes" checked><span>نعم، بكل سرور</span></label>
        <label><input type="radio" name="come" value="no"><span>أعتذر عن الحضور</span></label>
      </div>
      <label for="rsvp-count">عدد الأشخاص</label>
      <select id="rsvp-count" name="count"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select>
      <button class="btn" type="submit">إرسال عبر واتساب</button>
      <div class="note">سيفتح واتساب برسالة جاهزة، اضغط إرسال فقط.</div>
    </form>
  </section>
  <script>
  document.getElementById('rsvp').addEventListener('submit', function(e){
    e.preventDefault();
    var f = e.target, name = f.name.value.trim(), yes = f.come.value === 'yes';
    var msg = yes
      ? 'مرحباً، أؤكد حضوري حفل خطوبة محمد وليان يوم الجمعة 27 تشرين الثاني.\\nالاسم: ' + name + '\\nعدد الأشخاص: ' + f.count.value
      : 'مرحباً، أعتذر عن حضور حفل خطوبة محمد وليان، مع أطيب التمنيات وألف مبروك.\\nالاسم: ' + name;
    window.open('https://wa.me/__WA__?text=' + encodeURIComponent(msg), '_blank');
  });
  document.querySelectorAll('#rsvp input[name=come]').forEach(function(r){ r.addEventListener('change', function(){
    document.getElementById('rsvp-count').disabled = this.value === 'no'; }); });
  </script>
'''

rum21, naba8 = [l.strip() for l in open(os.path.join(here, "verses.txt"), encoding="utf-8") if l.strip()]
html = open(os.path.join(here, "page.html"), encoding="utf-8").read()
html = (html.replace("{{RUM_21}}", rum21).replace("{{NABA_8}}", naba8)
            .replace("{{SITE_URL}}", SITE_URL)
            .replace("{{RSVP}}", RSVP.replace("__WA__", WHATSAPP) if WHATSAPP else ""))
assert "{{" not in html
open(os.path.join(site, "index.html"), "w", encoding="utf-8").write(html)
build_ics()
print("built site/index.html + site/invite.ics" + ("" if WHATSAPP else "  (RSVP hidden: set WHATSAPP in tools/build.py)"))
