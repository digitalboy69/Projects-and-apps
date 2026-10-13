import re,base64
s=open('/home/claude/w/wrapper.html',encoding='utf-8').read()
for i in ('srcB',):
    b=base64.b64encode(open('/home/claude/w/%s.html'%i,'rb').read()).decode()
    s,n=re.subn(r'(<script type="text/plain" id="%s">)(.*?)(</script>)'%i,lambda m:m.group(1)+b+m.group(3),s,flags=re.S);assert n==1
open('/home/claude/w/new.html','w',encoding='utf-8').write(s)
