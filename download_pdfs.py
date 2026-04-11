#!/usr/bin/env python3
"""
Download all PDFs from DOJ Epstein disclosures page
"""
import urllib.request
import urllib.parse
import urllib.error
import re
import os
import ssl
import gzip
from pathlib import Path

# Disable SSL verification (for development only)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

def fetch_page(url):
    """Fetch HTML content from URL"""
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
        with urllib.request.urlopen(req, context=ssl_context) as response:
            data = response.read()
            # Try to decompress if gzipped
            try:
                data = gzip.decompress(data)
            except:
                pass  # Not gzipped, use as is
            return data.decode('utf-8')
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.reason}")
        if e.code == 403:
            print("The server is blocking automated requests.")
            print("This page may require JavaScript or have bot protection.")
        return None
    except Exception as e:
        print(f"Error fetching page: {e}")
        return None

def extract_pdf_links(html, base_url):
    """Extract all PDF links from HTML"""
    pdf_links = []
    
    # Pattern 1: href="...pdf..."
    pattern1 = r'href=["\']([^"\']*\.pdf[^"\']*)["\']'
    matches1 = re.findall(pattern1, html, re.IGNORECASE)
    
    # Pattern 2: href="..." with .pdf in the link
    pattern2 = r'href=["\']([^"\']*\.pdf)["\']'
    matches2 = re.findall(pattern2, html, re.IGNORECASE)
    
    all_matches = matches1 + matches2
    
    for link in all_matches:
        # Convert to absolute URL
        if link.startswith('http://') or link.startswith('https://'):
            full_url = link
        elif link.startswith('/'):
            full_url = urllib.parse.urljoin(base_url, link)
        else:
            full_url = urllib.parse.urljoin(base_url + '/', link)
        
        if full_url not in pdf_links:
            pdf_links.append(full_url)
    
    return pdf_links

def download_pdf(url, output_dir):
    """Download a PDF file"""
    try:
        filename = url.split('/')[-1].split('?')[0]
        if not filename.endswith('.pdf'):
            filename += '.pdf'
        
        filepath = os.path.join(output_dir, filename)
        
        # Skip if already exists
        if os.path.exists(filepath):
            print(f"  ✓ Already exists: {filename}")
            return True
        
        print(f"  Downloading: {filename}")
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
        with urllib.request.urlopen(req, context=ssl_context) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())
        
        print(f"  ✓ Downloaded: {filename}")
        return True
    except Exception as e:
        print(f"  ✗ Error downloading {url}: {e}")
        return False

def main():
    url = "https://www.justice.gov/epstein/doj-disclosures/data-set-1-files?page=14"
    base_url = "https://www.justice.gov"
    
    # Create output directory
    output_dir = "epstein_pdfs_page14"
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Fetching page: {url}")
    html = fetch_page(url)
    
    if not html:
        print("Failed to fetch page")
        return
    
    print("Extracting PDF links...")
    pdf_links = extract_pdf_links(html, base_url)
    
    print(f"\nFound {len(pdf_links)} PDF links:")
    for i, link in enumerate(pdf_links, 1):
        print(f"  {i}. {link}")
    
    if not pdf_links:
        print("\nNo PDF links found. The page might require JavaScript or have a CAPTCHA.")
        print("Saving HTML for inspection...")
        with open(os.path.join(output_dir, "page_source.html"), 'w') as f:
            f.write(html)
        return
    
    print(f"\nDownloading {len(pdf_links)} PDFs to '{output_dir}' directory...")
    success_count = 0
    for link in pdf_links:
        if download_pdf(link, output_dir):
            success_count += 1
    
    print(f"\n✓ Downloaded {success_count}/{len(pdf_links)} PDFs successfully")

if __name__ == "__main__":
    main()
