# Builds the CUSTOMER EDITION (customer-edition.html) from the original sources WITHOUT modifying them.
# Differences: no Developer card/menu, no "Copy" controls, brand + feature hooks (parts/customer_layer.js, customer_top.js).
# Usage: python3 tools_customer.py        -> writes customer-edition.html
import re,base64,glob,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
rd=lambda p:open(p,encoding='utf-8').read()
def sub1(pat,rep,s,flags=re.S,min_n=1):
    s2,n=re.subn(pat,lambda m:rep,s,flags=flags); assert n>=min_n,('no match: '+pat[:60]); return s2
t=rd('wrapper_template.html')
t=t.replace('/*LOCPICKER*/',rd('parts/locpicker.js').replace('</script','<\\/script'))
b=''.join(rd(p) for p in sorted(glob.glob('parts/srcB_*.part')))
b=b.replace('/*QRLIBS*/',rd('parts/qrlibs.js').replace('</script','<\\/script'))
src={'srcA':rd('parts/srcA.html'),'srcB':b,'srcN':rd('parts/srcN.html'),
     'srcDev':'<!DOCTYPE html><html><head><meta charset="utf-8"><title></title></head><body></body></html>'}
# --- wrapper: remove Developer entry and its deep link
t=sub1(r'\s*<button class="sw-item"[^>]*data-act="dev">.*?</button>','',t)
t=sub1(r"\n\s*if \(location\.hash === '#developer'\) openDev\(\);",'',t)
t=t.replace('</body>','<script>'+rd('parts/customer_top.js')+'</script></body>',1); assert 'customer_top' in t or 'vcxBrand' in t
# --- srcB: remove the 'Contact Developer' tile from the home grid
n0=len(src['srcB'])
src['srcB']=sub1(r"\n ?\['panel-contact','[^\]]*\]\];",'\n];',src['srcB'])
assert len(src['srcB'])<n0
# --- layer into every app document
layer='<script>'+rd('parts/customer_layer.js').replace('</script','<\\/script')+'</script>'
for k in ('srcA','srcB','srcN'):
    src[k]=sub1(r'(<head[^>]*>)',r'\1'+layer.replace('\\','\\\\'),src[k],flags=re.I) if False else re.sub(r'(<head[^>]*>)',lambda m:m.group(1)+layer,src[k],count=1,flags=re.I)
    assert 'CUSTOMER LAYER' in src[k]
for i in src:
    t,n=re.subn(r'(<script type="text/plain" id="%s">)\.\.(</script>)'%i,lambda m:m.group(1)+base64.b64encode(src[i].encode()).decode()+m.group(2),t,count=1);assert n==1
open('customer-edition.html','w',encoding='utf-8').write(t)
print('customer-edition.html',len(t)//1024,'KB')
