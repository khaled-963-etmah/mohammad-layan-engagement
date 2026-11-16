#!/usr/bin/env python3
"""Local server for site/ with HTTP Range support.

Safari and iPhone only play <video> when the server answers byte-range requests (206);
python -m http.server does not, so the envelope/hero videos may never start there.

usage: python3 tools/serve.py [port] [--lan]      (--lan to open it from a phone on the same Wi-Fi)
"""
import os, re, sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")


class RangeHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
        size = os.path.getsize(path)
        if not m:
            self.send_error(416); return None
        start, end = m.group(1), m.group(2)
        if start == "":
            start, end = max(0, size - int(end)), size - 1
        else:
            start, end = int(start), (int(end) if end else size - 1)
        end = min(end, size - 1)
        if start > end:
            self.send_response(416); self.send_header("Content-Range", f"bytes */{size}"); self.end_headers(); return None
        f = open(path, "rb"); f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        self._remaining = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        left = getattr(self, "_remaining", None)
        if left is None:
            return super().copyfile(source, outputfile)
        while left > 0:
            chunk = source.read(min(65536, left))
            if not chunk:
                break
            outputfile.write(chunk); left -= len(chunk)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()


if __name__ == "__main__":
    port = int(next((a for a in sys.argv[1:] if a.isdigit()), 8765))
    host = "0.0.0.0" if "--lan" in sys.argv else "127.0.0.1"
    print(f"Serving {os.path.abspath(ROOT)} on http://{'localhost' if host == '127.0.0.1' else host}:{port}")
    ThreadingHTTPServer((host, port), partial(RangeHandler, directory=ROOT)).serve_forever()
