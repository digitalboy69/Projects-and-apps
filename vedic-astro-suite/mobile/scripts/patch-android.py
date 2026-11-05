#!/usr/bin/env python3
"""Patches the generated Capacitor android project: release signing (stable key so updates install over old versions) + version numbers."""
import os, re, sys
p = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'build.gradle')
s = open(p).read()
signing = """    signingConfigs {
        release {
            storeFile file(System.getenv('KS_FILE'))
            storePassword System.getenv('KS_PASS') ?: 'vedicastro'
            keyAlias System.getenv('KEY_ALIAS') ?: 'vedic'
            keyPassword System.getenv('KEY_PASS') ?: 'vedicastro'
        }
    }
"""
if 'signingConfigs' not in s:
    s, n = re.subn(r'(\n\s*)buildTypes\s*\{\s*\n(\s*)release\s*\{', lambda m: '\n' + signing + m.group(1) + 'buildTypes {\n' + m.group(2) + 'release {\n' + m.group(2) + '    signingConfig signingConfigs.release', s, count=1)
    if n != 1: sys.exit('could not patch buildTypes.release')
s, n1 = re.subn(r'versionCode\s+\d+', "versionCode Integer.parseInt(System.getenv('VERSION_CODE') ?: '1')", s, count=1)
s, n2 = re.subn(r'versionName\s+"[^"]*"', "versionName \"${System.getenv('VERSION_NAME') ?: '1.0'}\"", s, count=1)
if not (n1 and n2): sys.exit('could not patch version fields')
open(p, 'w').write(s)
print('patched', p)
