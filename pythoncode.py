from PIL import Image
# import Image
import pytesseract
import sys
import os
from pdf2image import convert_from_path, convert_from_bytes
import urllib
import urllib.request

if os.path.isfile("out_text.txt"):
    os.remove("out_text.txt")  

pdf_path = sys.argv[1]

# name = "Test"

# def download_file(download_url, filename):
#     response = urllib.request.urlopen(download_url)    
#     file = open(filename + ".pdf", 'wb')
#     file.write(response.read())
#     file.close()
 
# download_file(pdf_path, name)

images = convert_from_path('public/' + pdf_path, 500,poppler_path=r'poppler-0.68.0\bin')

  
'''
Part #1 : Converting PDF to images
'''

image_counter = 1
  

for page in images:
  
   
    filename = "page_"+str(image_counter)+".jpg"
      
  
    page.save(filename, 'JPEG')
  
 
    image_counter = image_counter + 1
    
'''

Part #2 - Recognizing text from the images using OCR
'''
    
filelimit = image_counter-1
  
outfile = "out_text.txt"
  

f = open(outfile, "a",encoding='utf-8')
  

for i in range(1, filelimit + 1):
  

    filename = "page_"+str(i)+".jpg"
          

    text = str(((pytesseract.image_to_string(Image.open(filename)))))
  

    text = text.replace('-\n', '')    
  

    f.write(text)
  


f.close()

print(outfile)
sys.stdout.flush()