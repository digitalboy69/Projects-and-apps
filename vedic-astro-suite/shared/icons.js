/* ============================================================================
   ICONS  ·  shared/icons.js
   Premium line-icon set that quietly replaces UI emojis everywhere (all apps + shell).
   - Duotone line icons: 1.6px rounded stroke + a soft tinted fill (.f). Colour = currentColor.
   - Works on anything that renders text (static html, innerHTML, textContent updates) via a
     MutationObserver, so no app code has to change. The original emoji stays in the DOM as
     hidden text (.vxe) so copy / textContent logic keeps working.
   - Astrology glyphs (♈ ☉ ☽ ♄ ...), arrows and ✓ ✕ are NOT touched: they are real text symbols.
   - Skipped: <textarea>/<input>/<option>/<svg>/<script>/<style>, contenteditable (user notes), .vx-noicon.
   TO ADD AN ICON: add it to ICONS (24x24 viewBox, `class="f"` = soft fill) and list its emoji in MAP.
   ============================================================================ */
(function(){
  'use strict';
  var I = {
    home:'<path class="f" d="M4 11 12 4l8 7v8.5a.5.5 0 0 1-.5.5H15v-5.5H9V20H4.5a.5.5 0 0 1-.5-.5Z"/>',
    doc:'<path class="f" d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20Z"/><path d="M14 3.5V8h4M9 12.5h6M9 16h6"/>',
    book:'<path class="f" d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v16H6.5A1.5 1.5 0 0 0 5 20.5Z"/><path d="M5 20.5A1.5 1.5 0 0 0 6.5 22H19M9 7h6"/>',
    calendar:'<rect class="f" x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clock:'<circle class="f" cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    hourglass:'<path d="M7 3.5h10M7 20.5h10M8 3.5c0 4 4 5 4 8.5 0-3.5 4-4.5 4-8.5M8 20.5c0-4 4-5 4-8.5 0 3.5 4 4.5 4 8.5"/>',
    search:'<circle class="f" cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    alert:'<path class="f" d="M12 4 21 19.5H3Z"/><path d="M12 10v4.5M12 17.2v.1"/>',
    target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle class="f" cx="12" cy="12" r="1.2"/>',
    orb:'<circle class="f" cx="12" cy="11" r="7"/><path d="M7 20.5h10M9 17.5 8 20.5M15 17.5l1 3M9 8.5a3.5 3.5 0 0 1 3-1.8"/>',
    sparkle:'<path class="f" d="M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5Z"/><path d="M18.5 16.5c.2 1.5.8 2.1 2 2.3-1.2.2-1.8.8-2 2.2-.2-1.4-.8-2-2-2.2 1.2-.2 1.8-.8 2-2.3Z"/>',
    coin:'<circle class="f" cx="12" cy="12" r="8.5"/><path d="M9.5 9.2c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7c0 2.4-5 1.2-5 3.8 0 1 1 1.8 2.5 1.8s2.5-.8 2.5-1.8M12 6v1.5M12 16.5V18"/>',
    ring:'<circle cx="12" cy="14.5" r="5.5"/><path class="f" d="m9 6 1.5-2.5h3L15 6l-3 3.5Z"/>',
    briefcase:'<rect class="f" x="3.5" y="7.5" width="17" height="12.5" rx="2.5"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 13h17"/>',
    bulb:'<path class="f" d="M12 3.5a5.5 5.5 0 0 0-3.2 10c.6.5 1.2 1.2 1.2 2v.5h4v-.5c0-.8.6-1.5 1.2-2A5.5 5.5 0 0 0 12 3.5Z"/><path d="M9.5 19h5M10.5 21h3"/>',
    download:'<path d="M12 4v11M7.5 10.8 12 15.3l4.5-4.5M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15"/>',
    upload:'<path d="M12 15.5V4M7.8 8.2 12 4l4.2 4.2M4.5 14v4.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V14"/>',
    user:'<circle class="f" cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',
    users:'<circle class="f" cx="9" cy="9" r="3.3"/><path d="M3 19.5c.6-3.4 3-5.2 6-5.2s5.4 1.8 6 5.2M15.5 6a3.2 3.2 0 0 1 0 6M17.5 14.6c1.8.6 3 2.2 3.5 4.9"/>',
    smile:'<circle class="f" cx="12" cy="12" r="8.5"/><path d="M8.5 14c.9 1.4 2 2 3.5 2s2.6-.6 3.5-2M9 10v.1M15 10v.1"/>',
    planet:'<circle class="f" cx="12" cy="12" r="4.6"/><ellipse cx="12" cy="12" rx="9.5" ry="3.2" transform="rotate(-25 12 12)"/>',
    moon:'<path class="f" d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/>',
    sun:'<circle class="f" cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    newmoon:'<circle cx="12" cy="12" r="8.5" fill="currentColor" fill-opacity=".32"/>',
    sunrise:'<path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 6v3M5.5 10.5 7 12M18.5 10.5 17 12M8 21h8"/>',
    thermo:'<path class="f" d="M10 14.2V5a2 2 0 0 1 4 0v9.2a4 4 0 1 1-4 0Z"/><path d="M12 9v7"/>',
    flame:'<path class="f" d="M12 3.5c.5 3.2 4.5 5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-1.8.8-3 1.8-4 .2 1.2.8 1.8 1.5 2 0-3 .2-5 1.2-7.5Z"/>',
    bolt:'<path class="f" d="M13 3 5 13.5h6L10 21l8-10.5h-6Z"/>',
    cake:'<path class="f" d="M4.5 20.5v-6.5A1.5 1.5 0 0 1 6 12.5h12a1.5 1.5 0 0 1 1.5 1.5v6.5Z"/><path d="M4.5 16.5c2 1.5 3.5 1.5 5 0s3.5-1.5 5 0 3.5 1.5 5 0M12 12.5V9M12 4.5c.8.9.8 1.8 0 2.8-.8-1-.8-1.9 0-2.8ZM3 20.5h18"/>',
    pulse:'<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    heart:'<path class="f" d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z"/>',
    lotus:'<path class="f" d="M12 4c2.5 2.2 3.5 5 0 9-3.5-4-2.5-6.8 0-9Z"/><path d="M12 13c0-3.5 3.5-6 8-6 0 4.5-3 7.5-8 7M12 13c0-3.5-3.5-6-8-6 0 4.5 3 7.5 8 7M7 19h10"/>',
    pin:'<path class="f" d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
    link:'<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    lock:'<rect class="f" x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5V17"/>',
    scales:'<path d="M12 4v16M7 20h10M5 7h14"/><path class="f" d="m5 7-2.5 6a3 3 0 0 0 5 0ZM19 7l-2.5 6a3 3 0 0 0 5 0Z"/>',
    eye:'<path class="f" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    telescope:'<path class="f" d="m3.5 11.5 12-5 2 4.8-12 5Z"/><path d="m15.5 6.5 1.5-.6M12 14l-3 7M12 14l3 7"/>',
    camera:'<path class="f" d="M4 8h3l1.5-2.5h7L17 8h3a.5.5 0 0 1 .5.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V8.5A.5.5 0 0 1 4 8Z"/><circle cx="12" cy="13" r="3.5"/>',
    map:'<path class="f" d="m3.5 6 5.5-2 6 2 5.5-2v14l-5.5 2-6-2-5.5 2Z"/><path d="M9 4v14M15 6v14"/>',
    check:'<circle class="f" cx="12" cy="12" r="8.5"/><path d="m8.2 12.2 2.7 2.7 5-5.4"/>',
    globe:'<circle class="f" cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.3 3.5 8.5s-1 6-3.5 8.5C9.5 18 8.5 15.200 8.5 12S9.500 6 12 3.500Z"/>',
    cap:'<path class="f" d="m12 4.5 10 4.5-10 4.5L2 9Z"/><path d="M6 11.5v4c0 1.2 2.500 2.500 6 2.500s6-1.300 6-2.500v-4M22 9v5"/>',
    crown:'<path class="f" d="m3.5 8 4.5 4 4-6.500 4 6.500 4.500-4-1.500 11h-14Z"/>',
    compass:'<circle cx="12" cy="12" r="8.5"/><path class="f" d="m15.500 8.500-2 5-5 2 2-5Z"/>',
    mirror:'<ellipse class="f" cx="12" cy="10" rx="6" ry="7"/><path d="M12 17v3.500M8.500 20.500h7"/>',
    wrench:'<path class="f" d="M14.700 6.300a1 1 0 0 0 0 1.400l1.600 1.600a1 1 0 0 0 1.400 0l3.770-3.770a6 6 0 0 1-7.940 7.940l-6.910 6.910a2.120 2.120 0 0 1-3-3l6.910-6.910a6 6 0 0 1 7.940-7.940l-3.760 3.760z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    trash:'<path d="M4 7h16M9.500 7V4.500h5V7M6.500 7l.8 12.500a1 1 0 0 0 1 .9h7.400a1 1 0 0 0 1-.9L17.500 7M10 11v5.500M14 11v5.500"/>',
    gear:'<circle class="f" cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.500"/><path d="M12 2.800v2.700M12 18.500v2.700M2.800 12h2.700M18.500 12h2.700M5.500 5.500l1.900 1.900M16.600 16.600l1.900 1.900M5.500 18.500l1.900-1.900M16.600 7.400l1.900-1.900"/>',
    pencil:'<path class="f" d="M15.500 4.500a2 2 0 0 1 3 3L8.500 17.500 4 19l1.500-4.500Z"/><path d="m14 6 4 4"/>',
    clip:'<path d="m20 11-8 8a5 5 0 0 1-7-7l8.500-8.500a3.500 3.500 0 0 1 5 5L10 17a2 2 0 0 1-3-3l7-7"/>',
    mic:'<rect class="f" x="9" y="3.500" width="6" height="11" rx="3"/><path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3"/>',
    folder:'<path class="f" d="M3.500 7A1.500 1.500 0 0 1 5 5.500h4.200l2 2.500H19A1.500 1.500 0 0 1 20.500 9.500V18A1.500 1.500 0 0 1 19 19.500H5A1.500 1.500 0 0 1 3.500 18Z"/>',
    phone:'<path class="f" d="M5 4.500h3.500l1.500 4-2 1.500a11 11 0 0 0 5 5l1.500-2 4 1.500V18a1.500 1.500 0 0 1-1.500 1.500A14.500 14.500 0 0 1 3.500 6 1.500 1.500 0 0 1 5 4.500Z"/>',
    help:'<circle class="f" cx="12" cy="12" r="8.500"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 16.800v.1"/>',
    chat:'<path class="f" d="M4 6.500A2.500 2.500 0 0 1 6.500 4h11A2.500 2.500 0 0 1 20 6.500v7a2.500 2.500 0 0 1-2.500 2.500H10l-4.500 3.500V16A2.500 2.500 0 0 1 4 13.500Z"/>',
    bug:'<ellipse class="f" cx="12" cy="13.500" rx="4.500" ry="5.500"/><path d="M9.500 8.500a2.500 2.500 0 0 1 5 0M3.500 12.500h4M16.500 12.500h4M4.500 18l3-1.500M19.500 18l-3-1.500M5 7.500l3 2M19 7.500l-3 2M12 9v10"/>',
    refresh:'<path d="M20 11a8 8 0 0 0-14-4.500L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.500L20 15M20 20v-5h-5"/>',
    ruler:'<path class="f" d="m3.500 16.500 13-13 4 4-13 13Z"/><path d="m8 12 2 2M11 9l1.500 1.500M14 6l2 2M5.500 14.500 7 16"/>',
    video:'<rect class="f" x="3" y="6.500" width="12" height="11" rx="2.500"/><path d="m15 11 6-3.500v9L15 13Z"/>',
    satellite:'<rect class="f" x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)"/><path d="m5 5 3.500 3.500M15.500 15.500 19 19M3.500 8.500l5-5M15.500 20.500l5-5"/>',
    gem:'<path class="f" d="M6.500 4.500h11L22 10l-10 10.500L2 10Z"/><path d="M2 10h20M9 4.500 7.500 10 12 20.500 16.500 10 15 4.500"/>',
    lamp:'<path class="f" d="M3.500 12h17c0 4-3.500 7-8.500 7s-8.500-3-8.500-7Z"/><path d="M12 4c1.500 1.800 1.500 3.600 0 5.500-1.500-1.900-1.500-3.700 0-5.500Z"/>',
    swirl:'<path d="M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6"/>',
    star:'<path class="f" d="m12 3.500 2.600 5.300 5.900.9-4.300 4.100 1 5.800L12 16.800 6.800 19.600l1-5.800L3.500 9.700l5.900-.9Z"/>',
    gift:'<rect class="f" x="3.500" y="9" width="17" height="11.500" rx="1.500"/><path d="M3 9h18v3.500H3M12 9v11.500M12 9c-1-3-4-4-4.500-2S10 9 12 9Zm0 0c1-3 4-4 4.500-2S14 9 12 9Z"/>',
    ban:'<circle cx="12" cy="12" r="8.500"/><path d="m6 6 12 12"/>',
    chart:'<path class="f" d="M5 12.500h3.500V20H5ZM10.300 4.500h3.500V20h-3.500ZM15.500 9H19v11h-3.500Z"/>',
    trend:'<path d="M3.500 17.500 9.500 11l4 3.500 7-8M15 6.500h5.500V12"/>',
    sprout:'<path d="M12 20.500V12M12 12c0-4 3-6.500 7.500-6.500 0 4-3 6.500-7.500 6.500ZM12 14.500C12 11 9.500 9 5 9c0 3.500 2.500 5.500 7 5.500Z"/>',
    bell:'<path class="f" d="M6 16.500V11a6 6 0 0 1 12 0v5.500l1.500 2h-15ZM10 20.500a2 2 0 0 0 4 0"/>',
    building:'<path class="f" d="M3.500 9 12 4l8.500 5Z"/><path d="M6 11v7M10 11v7M14 11v7M18 11v7M3.500 20h17"/>',
    cloud:'<path class="f" d="M7 18.500a4.500 4.500 0 0 1-.500-8.970A6 6 0 0 1 18 9.500a4.500 4.500 0 0 1-.500 9Z"/>',
    trophy:'<path class="f" d="M8 4.500h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6H4.500c0 3 1.500 4.500 3.800 4.800M16 6h3.500c0 3-1.500 4.500-3.800 4.800M12 13.500V17M8.500 20h7M9.500 17h5"/>',
    up:'<path d="M12 19V5M6 11l6-6 6 6"/>',
    waves:'<path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
    fullmoon:'<circle class="f" cx="12" cy="12" r="8.500"/><path d="M9 9.500v.1M14.500 8.500v.1M13.500 14.500v.1M8.500 14v.1"/>',
    layers:'<path class="f" d="m12 3.500 9 4.500-9 4.500L3 8Z"/><path d="m3 12 9 4.500 9-4.500M3 16l9 4.500 9-4.500"/>',
    hexagram:'<path d="M12 3.5 19.5 16.5h-15Z"/><path class="f" d="M12 20.5 4.5 7.5h15Z"/>',
    octagram:'<rect class="f" x="5.5" y="5.5" width="13" height="13" rx="1"/><rect x="5.5" y="5.5" width="13" height="13" rx="1" transform="rotate(45 12 12)"/>',
    wheel:'<circle class="f" cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2"/><path d="M12 3.5V10M12 14v6.5M3.5 12H10M14 12h6.5M6 6l4.5 4.5M13.5 13.5 18 18M18 6l-4.5 4.5M10.5 13.5 6 18"/>',
    daynight:'<circle cx="12" cy="12" r="8.5"/><path class="f" d="M12 3.5a8.5 8.5 0 0 1 0 17Z"/><path d="M12 3.5v17"/>',
    swap:'<path d="M4 8h14M14.5 4.5 18 8l-3.5 3.5M20 16H6M9.5 12.5 6 16l3.5 3.5"/>',
    triangle:'<path class="f" d="M12 4 20.5 19h-17Z"/><circle cx="12" cy="14" r="1.2"/>',
    kendra:'<rect class="f" x="4" y="4" width="16" height="16" rx="2.5"/><path d="M12 4v16M4 12h16"/>',
    feet:'<ellipse class="f" cx="8.5" cy="14" rx="3" ry="5"/><ellipse class="f" cx="16" cy="9.5" rx="3" ry="5"/>',
    anchor:'<circle cx="12" cy="5.5" r="2"/><path d="M12 7.5V20M7.5 11h9M5 14c0 3.5 3 6 7 6s7-2.5 7-6"/>',
    trident:'<path d="M12 3.5v17M6.5 5v4.5a5.5 5.5 0 0 0 11 0V5M9.5 20.5h5"/>',
    beads:'<g class="f"><circle cx="12" cy="4.5" r="1.7"/><circle cx="17.3" cy="6.7" r="1.7"/><circle cx="19.5" cy="12" r="1.7"/><circle cx="17.3" cy="17.3" r="1.7"/><circle cx="12" cy="19.5" r="1.7"/><circle cx="6.7" cy="17.3" r="1.7"/><circle cx="4.5" cy="12" r="1.7"/><circle cx="6.7" cy="6.7" r="1.7"/></g><path d="M12 19.5v2.5"/>',
    dna:'<path d="M8 3.5c0 5 8 5 8 8.5s-8 3.5-8 8.5M16 3.5c0 5-8 5-8 8.5s8 3.5 8 8.5M9 7h6M9 17h6"/>'
  };
  var M = {
    home:'🏠 🏡', doc:'🗎 📋 📄 📃 📜 📒 🗒️ 🗒', book:'📚 📖', calendar:'📅 🗓️ 🗓 📆', clock:'🕰️ 🕰 ⏱️ ⏱ 🕘 ⏰ 🕐 🕒', hourglass:'⏳ ⌛', search:'🔎 🔍 🔬',
    alert:'⚠️ ⚠', target:'🎯 🏹', orb:'🔮', sparkle:'✨ 🌟 💫 🌠', coin:'💰 💵 🪙 💴', ring:'💍 💒', briefcase:'💼 🧳', bulb:'💡', download:'📥', upload:'📤',
    user:'👤 🧍 🧑 🙍', users:'👥 🤝 👪 👨 👩 👨‍👩‍👧 🪪 🙋', smile:'👶 🙂 😊', planet:'🪐 🌌', moon:'🌙 🌒 🌓 🌔 🌖 🌗 🌘 🌛 🌜 🦀', sun:'☀️ ☀ 🌞', newmoon:'🌑', sunrise:'🌅 🌄 🌇 🌆', thermo:'🌡️ 🌡',
    flame:'🔥 🕯️', bolt:'⚡ 💪', cake:'🎂', pulse:'🩺 💓', heart:'❤️ ❤ 💞 💕 ♥️ 💖 💗 💝', lotus:'🙏 🕉️ 🕉 🪷', pin:'📍 📌', link:'🔗', lock:'🔒 🔐', scales:'⚖️ ⚖',
    eye:'🧿 👁️ 👁 👀 🧐', telescope:'🔭', camera:'📸 📷', map:'🗺️ 🗺', check:'✅ ☑️ ☑', cloud:'☁️ ☁', trophy:'🏆 🥇 🎖️', up:'👆 ⬆️', waves:'🌊 🐸', fullmoon:'🌕',
    globe:'🌐 🌍 🌎 🌏', cap:'🎓', crown:'👑 🦁', compass:'🧭', mirror:'🪞', wrench:'🛠️ 🛠 🔧',
    plus:'➕', trash:'🗑️ 🗑', gear:'⚙️ ⚙', pencil:'📝 ✏️ ✏ 🖊️', clip:'📎', mic:'🎙️ 🎙 🎤', folder:'🗂️ 🗂 📁 📂', phone:'📞 📱 📲', help:'❓ ❔ 🤷', chat:'💬 🗣️ 🗣',
    bug:'🐞 🐛', refresh:'🔄 🔁 ♻️', ruler:'📏 📐', video:'🎥 🎬', satellite:'🛰️ 🛰', gem:'💎 💠', lamp:'🪔', swirl:'🌀', star:'⭐ 🌃', gift:'🎁', ban:'⛔ 🚫',
    chart:'📊 🔢', trend:'📈', sprout:'🌱 🍀 🌳 🌿 🪴', bell:'🔔', building:'🏛️ 🏛 🛕', layers:'🗃️ 📑 🧱',
    hexagram:'🔯', octagram:'✴️', wheel:'☸️ 🎡', daynight:'🔅', swap:'🔀', triangle:'🔺', kendra:'🔲', feet:'👣', anchor:'⚓', trident:'🔱', beads:'📿', dna:'🧬'
  };
  var MAP = {}, keys = [];
  Object.keys(M).forEach(function(n){ M[n].split(' ').forEach(function(e){ if (e){ MAP[e.replace(/️/g, '')] = n; } }); });
  Object.keys(MAP).forEach(function(k){ keys.push(k); });
  keys.sort(function(a, b){ return b.length - a.length; });
  var RX = new RegExp('(' + keys.join('|') + ')\\uFE0F?', 'g'), RXT = new RegExp(keys.join('|'));
  /* cheap pre-check: a text node can only contain an icon if it has the FIRST character of some mapped emoji.
     One character-class test is far cheaper than the big alternation above, so most text nodes stop here. */
  var firsts = {}; keys.forEach(function(k){ firsts[k.codePointAt(0)] = 1; });
  var RXQ = new RegExp('[' + Object.keys(firsts).map(function(c){ return '\\u{' + (+c).toString(16) + '}'; }).join('') + ']', 'u');
  var SKIP = 'script,style,textarea,input,select,option,title,svg,noscript,[contenteditable="true"],[contenteditable=""],.vxi,.vx-noicon';
  var cache = {};
  function svg(n){
    return cache[n] || (cache[n] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + I[n] + '</svg>');
  }
  function fix(t){
    var p = t.parentNode; if (!p || p.nodeType !== 1) return;
    var v = t.nodeValue; if (!v || !RXQ.test(v) || !RXT.test(v)) return;
    if (p.closest && p.closest(SKIP)) return;
    RX.lastIndex = 0;
    var f = document.createDocumentFragment(), last = 0, m;
    while ((m = RX.exec(v))){
      var n = MAP[m[1]]; if (!n || !I[n]) continue;
      if (m.index > last) f.appendChild(document.createTextNode(v.slice(last, m.index)));
      var s = document.createElement('span'); s.className = 'vxi vxi-' + n; s.setAttribute('role', 'img');
      s.innerHTML = '<i class="vxe">' + m[0] + '</i>' + svg(n);
      f.appendChild(s); last = m.index + m[0].length;
    }
    if (!f.childNodes.length) return;
    if (last < v.length) f.appendChild(document.createTextNode(v.slice(last)));
    p.replaceChild(f, t);
  }
  function scan(n){
    if (n.nodeType === 3){ fix(n); return; }
    if (n.nodeType !== 1) return;
    var w = document.createTreeWalker(n, 4, null), list = [], x;   /* no whole-subtree textContent: walk text nodes with the cheap test */
    while ((x = w.nextNode())) if (RXQ.test(x.nodeValue) && RXT.test(x.nodeValue)) list.push(x);
    for (var i = 0; i < list.length; i++) fix(list[i]);
  }
  var obs = new MutationObserver(function(recs){
    for (var i = 0; i < recs.length; i++){
      var r = recs[i];
      if (r.type === 'characterData') fix(r.target);
      else for (var j = 0; j < r.addedNodes.length; j++) scan(r.addedNodes[j]);
    }
    obs.takeRecords();   /* drop the mutations we just made ourselves */
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  document.addEventListener('DOMContentLoaded', function(){ scan(document.body); });
  window.VXI = { icons: I, map: MAP, scan: scan };
})();
