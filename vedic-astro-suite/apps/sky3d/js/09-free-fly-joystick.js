/* ---- Mobile joystick for Free Fly movement + on-screen up/down buttons ---- */
function setupFreeFlyJoystick(){
  const stickBase = document.getElementById('ffStickBase');
  const stickNub = document.getElementById('ffStickNub');
  let stickActive = false, stickCenter = {x:0,y:0};
  const maxRadius = 36;

  function stickPointerDown(e){
    stickActive = true;
    const rect = stickBase.getBoundingClientRect();
    stickCenter = { x: rect.left+rect.width/2, y: rect.top+rect.height/2 };
    e.preventDefault();
  }
  function stickPointerMove(e){
    if (!stickActive) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    let dx = touch.clientX - stickCenter.x, dy = touch.clientY - stickCenter.y;
    const dist = Math.min(maxRadius, Math.hypot(dx,dy));
    const ang = Math.atan2(dy,dx);
    dx = Math.cos(ang)*dist; dy = Math.sin(ang)*dist;
    stickNub.style.transform = `translate(${dx}px, ${dy}px)`;
    freeMoveState.fwd = -dy/maxRadius;
    freeMoveState.right = dx/maxRadius;
  }
  function stickPointerUp(e){
    stickActive = false;
    stickNub.style.transform = `translate(0px,0px)`;
    freeMoveState.fwd = 0; freeMoveState.right = 0;
  }
  stickBase.addEventListener('touchstart', stickPointerDown, {passive:false});
  stickBase.addEventListener('touchmove', stickPointerMove, {passive:false});
  stickBase.addEventListener('touchend', stickPointerUp, {passive:false});
  stickBase.addEventListener('mousedown', stickPointerDown);
  window.addEventListener('mousemove', stickPointerMove);
  window.addEventListener('mouseup', stickPointerUp);

  const upBtn = document.getElementById('ffUpBtn'), downBtn = document.getElementById('ffDownBtn');
  const bindHold = (btn, val)=>{
    const start = (e)=>{ e.preventDefault(); freeMoveState.up = val; };
    const end = (e)=>{ freeMoveState.up = 0; };
    btn.addEventListener('touchstart', start, {passive:false});
    btn.addEventListener('touchend', end);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
  };
  bindHold(upBtn, 1);
  bindHold(downBtn, -1);
}

function onResize(){
  const vp = document.querySelector('.viewport');
  camera.aspect = vp.clientWidth/vp.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(vp.clientWidth, vp.clientHeight);
  markDirty();
}

