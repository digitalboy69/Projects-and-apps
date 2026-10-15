# Usage: python3 encrypt_app.py <plain.html> <out/app.enc>   (key from env APP_KEY or /home/claude/w/.appkey; NEVER commit the key)
import sys,os,gzip,base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
key=bytes.fromhex(os.environ.get('APP_KEY') or open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'.appkey')).read().strip())
data=gzip.compress(open(sys.argv[1],'rb').read(),9)
iv=os.urandom(12)
open(sys.argv[2],'w').write(base64.b64encode(iv+AESGCM(key).encrypt(iv,data,None)).decode())
print('encrypted',len(data),'->',os.path.getsize(sys.argv[2]))
