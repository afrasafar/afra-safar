#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Download the 13 authentic Wikimedia Commons photos into the website's images folder.
Run in the directory containing index.html and wikimedia-photos-manifest.json.
Full originals are kept in images/wikimedia-originals, and web-optimized derivatives
are saved in images when Pillow is available. No fake substitutes are substituted.
"""
from pathlib import Path
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from html.parser import HTMLParser
from io import BytesIO
import json, os, re, shutil, sys, time

BASE=Path(__file__).resolve().parent
MANIFEST=BASE/'wikimedia-photos-manifest.json'
IMAGE_DIR=BASE/'images'
ORIGINAL_DIR=IMAGE_DIR/'wikimedia-originals'
INDEX=BASE/'index.html'
HEADERS={
  'User-Agent':'AfraSafarImageImporter/1.0 (website deployment; Wikimedia Commons licensed images)',
  'Accept':'application/json,image/*;q=0.9,*/*;q=0.5'
}

def get(url, size_limit=35_000_000):
    last_error=None
    for attempt in range(3):
        try:
            req=Request(url,headers=HEADERS)
            with urlopen(req,timeout=50) as response:
                data=response.read(size_limit+1)
                if len(data)>size_limit: raise ValueError('File is larger than download limit')
                return data
        except (HTTPError,URLError,TimeoutError,ConnectionError,ValueError) as exc:
            last_error=exc
            if attempt<2: time.sleep(1.5*(attempt+1))
    raise RuntimeError(f'Could not download {url}: {last_error}')

def file_type(data):
    if data.startswith(b'\xff\xd8\xff'): return '.jpg'
    if data.startswith(b'\x89PNG\r\n\x1a\n'): return '.png'
    if data.startswith(b'RIFF') and data[8:12]==b'WEBP': return '.webp'
    if data.startswith((b'GIF89a',b'GIF87a')): return '.gif'
    if data.startswith((b'II*\x00',b'MM\x00*')): return '.tiff'
    return None

def api_imageinfo(title):
    query=urlencode({'action':'query','format':'json','prop':'imageinfo',
                      'iiprop':'url|size|mime|extmetadata','titles':'File:'+title})
    payload=json.loads(get('https://commons.wikimedia.org/w/api.php?'+query,size_limit=2_500_000))
    pages=payload.get('query',{}).get('pages',{})
    for p in pages.values():
        inf=p.get('imageinfo',[])
        if inf and inf[0].get('url'): return inf[0]
    raise RuntimeError('Wikimedia file not found: '+title)

def try_picture(item):
    # Resolve the full original file through Wikimedia API (not the thumbnail URL).
    info=api_imageinfo(item['file'])
    raw=get(info['url'])
    ext=file_type(raw)
    if not ext: raise RuntimeError('Downloaded response is not an image')
    ORIGINAL_DIR.mkdir(parents=True,exist_ok=True)
    original=ORIGINAL_DIR/('afra-'+item['slug']+ext)
    original.write_bytes(raw)
    rendered=original
    optimized=False
    try:
        from PIL import Image,ImageOps
        with Image.open(BytesIO(raw)) as im:
            im=ImageOps.exif_transpose(im)
            im.thumbnail((1100,900))
            if im.mode!='RGB': im=im.convert('RGB')
            rendered=IMAGE_DIR/('afra-destination-'+item['slug']+'.webp')
            im.save(rendered,'WEBP',quality=82,method=5)
            optimized=True
    except ImportError:
        print('  Pillow is not installed; keeping original full-resolution image.',flush=True)
    return {'city':item['city'],'slug':item['slug'],'original':original.relative_to(BASE).as_posix(),
            'local_src':rendered.relative_to(BASE).as_posix(),'source':info['url'],
            'commons_page':item['commons_page'],'width':info.get('width'),'height':info.get('height'),
            'size_bytes':len(raw),'web_optimized':optimized,
            'extmetadata':info.get('extmetadata',{})}

def main():
    entries=json.loads(MANIFEST.read_text('utf-8'))
    IMAGE_DIR.mkdir(parents=True,exist_ok=True)
    result=[]; failures=[]
    for i,item in enumerate(entries,1):
        print(f'[{i:02}/{len(entries)}] {item["city"]} — {item["file"]}',flush=True)
        try:
            rec=try_picture(item)
            result.append(rec)
            print('  Saved:',rec['local_src'],flush=True)
        except Exception as exc:
            failures.append({'city':item['city'],'file':item['file'],'error':str(exc)})
            print('  FAILED:',str(exc),flush=True)
        time.sleep(.5)

    # Update only the image URLs whose local files were really downloaded.
    page=INDEX.read_text('utf-8')
    mapping={r['slug']:r for r in result}
    for item in entries:
        data=mapping.get(item['slug'])
        if not data: continue
        source=item['old_url']
        if source not in page:
            print('  WARNING: HTML image URL changed; could not replace for',item['city'],flush=True)
            continue
        page=page.replace(source,data['local_src'])
    INDEX.write_text(page,'utf-8')
    report={'downloaded':result,'failed':failures,'count_downloaded':len(result),'count_failed':len(failures)}
    (BASE/'wikimedia-download-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),'utf-8')
    (ORIGINAL_DIR/'LICENSE-AND-SOURCES.json').write_text(json.dumps(
        [{k:v for k,v in r.items() if k!='extmetadata'} for r in result],ensure_ascii=False,indent=2),'utf-8')
    print('\n--------------------------',flush=True)
    print('Real Wikimedia images saved:',len(result),'/',len(entries),flush=True)
    print('Images folder:',IMAGE_DIR,flush=True)
    print('HTML updated:',INDEX,flush=True)
    if failures:
        print('Some images failed. Check the network or file titles in wikimedia-download-report.json.',flush=True)
        return 1
    print('All images downloaded successfully. Upload the full folder to your website.',flush=True)
    return 0
if __name__=='__main__':
    sys.exit(main())
