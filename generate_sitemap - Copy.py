"""Run: python generate_sitemap.py https://example.com
Replace with your actual verified site origin; needs no third-party packages.
"""
from pathlib import Path
from urllib.parse import urlparse
from xml.etree.ElementTree import Element, SubElement, ElementTree, indent
import sys
base=sys.argv[1].strip().rstrip('/') if len(sys.argv)>1 else ''
p=urlparse(base)
if p.scheme not in ('https','http') or not p.netloc or p.path not in ('','/'):
 print('Usage: python generate_sitemap.py https://YOUR-REAL-DOMAIN');sys.exit(1)
root=Element('urlset',xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
private=('admin','guest-dashboard','wallet','auth','register','payment','account-bookings','booking-voucher','owner','my-reviews','my-searches','my-reservations','notifications','property-settings','host-','support','messages','favorites','booking.html')
for path in sorted(Path(__file__).parent.glob('*.html')):
 if any(path.name.startswith(x) for x in private):continue
 tag=SubElement(root,'url');SubElement(tag,'loc').text=base+'/'+path.name
indent(root)
out=Path(__file__).parent/'sitemap.xml'
ElementTree(root,encoding='utf-8',xml_declaration=True).write(out)
print('Generated',out)
