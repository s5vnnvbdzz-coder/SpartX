/* SpartanX v245: movable circular avatar crop selection.
   Selected photos are not committed until "Use this crop" and SAVE PROFILE.
   Source image bytes never leave the browser. */
(()=>{
  'use strict';
  const fileInput=document.getElementById('profilePhotoInput');
  const editOverlay=document.getElementById('editProfileOverlay');
  const avatar=document.getElementById('editProfileAvatar');
  if(!fileInput||!editOverlay||!avatar)return;

  const cropper=document.createElement('div');
  cropper.id='sxPhotoCropOverlay';
  cropper.className='sx-photo-crop-overlay';
  cropper.hidden=true;
  cropper.setAttribute('role','dialog');
  cropper.setAttribute('aria-modal','true');
  cropper.setAttribute('aria-labelledby','sxPhotoCropHeading');
  cropper.innerHTML=`
    <div class="sx-photo-crop-panel">
      <div class="sx-photo-crop-header">
        <button type="button" id="sxPhotoCropBack" class="sx-photo-crop-back">← Back</button>
        <h2 id="sxPhotoCropHeading">Crop profile photo</h2>
      </div>
      <p class="sx-photo-crop-instruction">Drag the circle over the part of your photo you want to display.</p>
      <div class="sx-photo-crop-stage" id="sxPhotoCropStage" aria-label="Photo cropping workspace">
        <div class="sx-photo-crop-surface" id="sxPhotoCropSurface">
          <img id="sxPhotoCropImage" alt="Selected image for cropping" draggable="false">
          <div id="sxPhotoCropCircle" class="sx-photo-crop-circle" role="slider" tabindex="0"
               aria-label="Move photo selection" aria-valuetext="Drag or use arrow keys to reposition"
               aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"
               title="Drag this circle to select your picture">
             <span class="sx-photo-crop-grip" aria-hidden="true"></span>
          </div>
        </div>
      </div>
      <div class="sx-photo-crop-tools">
        <label for="sxPhotoCropSize"><span>Circle size</span><output id="sxPhotoCropSizeValue">85%</output></label>
        <input type="range" id="sxPhotoCropSize" min="40" max="100" step="1" value="85">
        <div class="sx-photo-crop-preview-row">
          <canvas width="104" height="104" id="sxPhotoCropPreview" aria-label="Preview of final profile photo" role="img"></canvas>
          <span><strong>Profile preview</strong><small>Everything inside the circle will fit inside your SpartanX profile frame.</small></span>
        </div>
      </div>
      <p class="sx-photo-crop-error" id="sxPhotoCropError" role="alert" hidden></p>
      <div class="sx-photo-crop-actions">
        <button type="button" id="sxPhotoCropCancel" class="sx-photo-crop-cancel">Cancel</button>
        <button type="button" id="sxPhotoCropApply" class="sx-photo-crop-apply">Use this crop</button>
      </div>
    </div>`;
  document.body.appendChild(cropper);

  const stage=document.getElementById('sxPhotoCropStage');
  const surface=document.getElementById('sxPhotoCropSurface');
  const image=document.getElementById('sxPhotoCropImage');
  const circle=document.getElementById('sxPhotoCropCircle');
  const sizeRange=document.getElementById('sxPhotoCropSize');
  const sizeValue=document.getElementById('sxPhotoCropSizeValue');
  const preview=document.getElementById('sxPhotoCropPreview');
  const apply=document.getElementById('sxPhotoCropApply');
  const error=document.getElementById('sxPhotoCropError');

  let sourceURL=null;
  let active=false;
  let drag=null;
  let renderedWidth=0;
  let renderedHeight=0;
  let diameter=0;
  let posX=0,posY=0;
  let previewRequest=0;
  let beforeFocus=null;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function showError(message){error.textContent=message||'';error.hidden=!message;}
  function circleSize(){return Math.max(1,Math.min(renderedWidth,renderedHeight)*Number(sizeRange.value)/100);}
  function placeCircle(){
    diameter=circleSize();
    posX=clamp(posX,0,renderedWidth-diameter);
    posY=clamp(posY,0,renderedHeight-diameter);
    circle.style.width=diameter+'px';
    circle.style.height=diameter+'px';
    circle.style.left=posX+'px';
    circle.style.top=posY+'px';
    circle.setAttribute('aria-valuenow',String(Math.round(100*(posX+diameter/2)/(renderedWidth||1))));
    sizeValue.value=sizeRange.value+'%';
    sizeValue.textContent=sizeRange.value+'%';
    schedulePreview();
  }
  function fitImage(reset){
    if(!active||!image.naturalWidth||!stage.clientWidth)return;
    const oldX=renderedWidth?(posX+diameter/2)/renderedWidth:0.5;
    const oldY=renderedHeight?(posY+diameter/2)/renderedHeight:0.5;
    const capW=stage.clientWidth;
    const capH=Math.min(430,Math.max(190,Math.min(window.innerHeight*.46,window.innerHeight-380)));
    const scale=Math.min(capW/image.naturalWidth,capH/image.naturalHeight);
    renderedWidth=image.naturalWidth*scale;
    renderedHeight=image.naturalHeight*scale;
    surface.style.width=renderedWidth+'px';
    surface.style.height=renderedHeight+'px';
    const d=circleSize();
    posX=(reset?0.5:oldX)*renderedWidth-d/2;
    posY=(reset?0.5:oldY)*renderedHeight-d/2;
    placeCircle();
  }
  function drawCrop(ctx,canvasSize){
    if(!active||!image.naturalWidth||!diameter)return;
    const factor=image.naturalWidth/renderedWidth;
    const sx=posX*factor,sy=posY*factor,sourceSize=diameter*factor;
    ctx.clearRect(0,0,canvasSize,canvasSize);
    ctx.fillStyle='#1b211e';ctx.fillRect(0,0,canvasSize,canvasSize);
    ctx.drawImage(image,sx,sy,sourceSize,sourceSize,0,0,canvasSize,canvasSize);
  }
  function schedulePreview(){
    if(previewRequest)cancelAnimationFrame(previewRequest);
    previewRequest=requestAnimationFrame(()=>{
      previewRequest=0;
      if(active)drawCrop(preview.getContext('2d'),preview.width);
    });
  }
  function closeCropper(){
    drag=null;active=false;
    cropper.hidden=true;
    document.body.classList.remove('sx-photo-crop-open');
    if(previewRequest){cancelAnimationFrame(previewRequest);previewRequest=0;}
    image.removeAttribute('src');
    if(sourceURL){URL.revokeObjectURL(sourceURL);sourceURL=null;}
    showError('');
    if(beforeFocus&&beforeFocus.isConnected&&typeof beforeFocus.focus==='function'){
      beforeFocus.focus({preventScroll:true});
    }
  }
  function showCropper(file){
    if(!file)return;
    if(!file.type.startsWith('image/')&&!/\.(heic|heif|jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name)){
      alert('Choose a photo from your library.');return;
    }
    if(file.size>35*1024*1024){alert('This photo is too large. Choose one under 35 MB.');return;}
    closeCropper();
    beforeFocus=document.activeElement;
    active=true;
    cropper.hidden=false;
    document.body.classList.add('sx-photo-crop-open');
    apply.disabled=true;
    sizeRange.value='85';
    renderedWidth=0;renderedHeight=0;diameter=0;
    showError('');
    sourceURL=URL.createObjectURL(file);
    image.onload=()=>{
      if(!active)return;
      fitImage(true);
      apply.disabled=false;
      circle.focus({preventScroll:true});
    };
    image.onerror=()=>{
      apply.disabled=true;
      showError('This photo could not be opened. Try a JPEG, PNG or another photo from your library.');
    };
    image.src=sourceURL;
  }
  surface.addEventListener('pointerdown',event=>{
    if(!active||!image.naturalWidth||event.button>0)return;
    event.preventDefault();
    const bounds=surface.getBoundingClientRect();
    const cursorX=event.clientX-bounds.left,cursorY=event.clientY-bounds.top;
    const hit=cursorX>=posX&&cursorX<=posX+diameter&&cursorY>=posY&&cursorY<=posY+diameter;
    const offsetX=hit?cursorX-posX:diameter/2;
    const offsetY=hit?cursorY-posY:diameter/2;
    drag={id:event.pointerId,offsetX,offsetY};
    surface.setPointerCapture(event.pointerId);
    if(!hit){
      posX=cursorX-offsetX;posY=cursorY-offsetY;placeCircle();
    }
  });
  surface.addEventListener('pointermove',event=>{
    if(!active||!drag||drag.id!==event.pointerId)return;
    event.preventDefault();
    const bounds=surface.getBoundingClientRect();
    posX=event.clientX-bounds.left-drag.offsetX;
    posY=event.clientY-bounds.top-drag.offsetY;
    placeCircle();
  });
  const stopDrag=event=>{if(drag?.id===event.pointerId)drag=null;};
  surface.addEventListener('pointerup',stopDrag);
  surface.addEventListener('pointercancel',stopDrag);
  surface.addEventListener('lostpointercapture',()=>{drag=null;});
  circle.addEventListener('keydown',event=>{
    if(!active||!/^Arrow(Up|Down|Left|Right)$/.test(event.key))return;
    event.preventDefault();
    const step=event.shiftKey?10:3;
    if(event.key==='ArrowUp')posY-=step;
    if(event.key==='ArrowDown')posY+=step;
    if(event.key==='ArrowLeft')posX-=step;
    if(event.key==='ArrowRight')posX+=step;
    placeCircle();
  });
  sizeRange.addEventListener('input',()=>{
    if(!active)return;
    const cx=posX+diameter/2,cy=posY+diameter/2,newD=circleSize();
    posX=cx-newD/2;posY=cy-newD/2;placeCircle();
  });
  window.addEventListener('resize',()=>{if(active)fitImage(false);});
  document.getElementById('sxPhotoCropBack').addEventListener('click',closeCropper);
  document.getElementById('sxPhotoCropCancel').addEventListener('click',closeCropper);
  cropper.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeCropper();}});
  apply.addEventListener('click',()=>{
    if(!active||!image.naturalWidth||apply.disabled)return;
    try{
      const canvas=document.createElement('canvas');
      canvas.width=512;canvas.height=512;
      drawCrop(canvas.getContext('2d',{alpha:false}),512);
      const data=canvas.toDataURL('image/jpeg',.88);
      if(!data.startsWith('data:image/jpeg,'))throw Error('Could not create the cropped picture.');
      // The existing SAVE PROFILE action commits the pending photo along
      // with all the other fields; cancelling the editor still discards it.
      editOverlay.dataset.pendingPhoto=data;
      avatar.innerHTML='<img src="'+data+'" alt="Cropped profile picture preview">';
      closeCropper();
    }catch(e){
      cropper.dataset.lastCropError=String(e&&e.message||e);
      console.error('[SpartanX photo crop]',e);
      showError('Could not save this crop. Try a smaller image or another photo.');
    }
  });
  // Existing change handler delegates to this event. It never auto-crops.
  document.addEventListener('spartx:profile-photo-selected',event=>{
    showCropper(event.detail?.file);
  });
  window.SpartanXPhotoCrop={open:showCropper,close:closeCropper,element:cropper};
})();