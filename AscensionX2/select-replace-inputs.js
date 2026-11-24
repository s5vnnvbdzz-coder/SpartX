/* AX 2.0 select-to-replace inputs.
 *
 * HTML number inputs do not support setSelectionRange/select on iOS Safari.
 * Temporarily use type=text with the same inputmode while the user is editing,
 * validate against the original number constraints, then restore number
 * on blur when the entry is valid. Delegation covers dynamically generated
 * top-set weight/reps/RPE inputs and the entire athlete intake/editor.
 *
 * No writes to browser storage. Never affects classic AX or SpartanX.
 */
(function(){
'use strict';
const editable='input[type="number"],input[type="text"],input[type="search"],input[type="tel"],input[type="url"],input[type="email"],textarea';
function validNumber(field){
 if(field.dataset.axOriginalType!=='number')return true;
 const raw=field.value.trim();
 const required=field.required,empty=raw==='';
 if(empty){
  field.setCustomValidity(required?'Enter a number.':'');
  return !required;
 }
 // The programme engine uses numeric decimal values, not exponent notation.
 if(!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)){
  field.setCustomValidity('Enter a valid number.');
  return false;
 }
 const number=Number(raw);
 const min=field.hasAttribute('min')?Number(field.getAttribute('min')):null;
 const max=field.hasAttribute('max')?Number(field.getAttribute('max')):null;
 const step=field.getAttribute('step');
 if(min!==null&&Number.isFinite(min)&&number<min){
  field.setCustomValidity('Minimum: '+min+'.');return false;
 }
 if(max!==null&&Number.isFinite(max)&&number>max){
  field.setCustomValidity('Maximum: '+max+'.');return false;
 }
 if(step&&step!=='any'){
  const spacing=Number(step),base=min!==null&&Number.isFinite(min)?min:0;
  if(spacing>0&&Math.abs((number-base)/spacing-Math.round((number-base)/spacing))>0.000001){
   field.setCustomValidity('Use increments of '+step+'.');return false;
  }
 }
 field.setCustomValidity('');
 return true;
}
function select(field){
 if(field.disabled||field.readOnly||field.value===''||document.activeElement!==field)return;
 try{field.select()}catch(_){}
 try{field.setSelectionRange(0,field.value.length)}catch(_){}
}
document.addEventListener('focusin',event=>{
 const field=event.target;
 if(!(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement)||!field.matches(editable))return;
 if(field.type==='number'){
  field.dataset.axOriginalType='number';
  if(!field.hasAttribute('inputmode')){
   field.dataset.axAddedInputmode='true';
   field.setAttribute('inputmode',field.getAttribute('step')==='1'?'numeric':'decimal');
  }
  field.type='text';
  validNumber(field);
 }
 // Select on focus AND on the first tap, because touch browsers can collapse
 // a focus-triggered selection during their subsequent click default action.
 field.dataset.axPendingFirstTap='true';
 select(field);
 setTimeout(()=>{
  if(field.isConnected&&document.activeElement===field&&field.dataset.axPendingFirstTap==='true')
   select(field);
 },0);
},true);
document.addEventListener('click',event=>{
 const field=event.target;
 if(!(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement)||!field.matches(editable))return;
 if(field.dataset.axPendingFirstTap!=='true')return;
 field.dataset.axPendingFirstTap='false';
 select(field);
},true);
document.addEventListener('input',event=>{
 const field=event.target;
 if(!(field instanceof HTMLInputElement)||field.dataset.axOriginalType!=='number')return;
 if(field.value.includes(',')){
  const normalized=field.value.replace(/,/g,'.');
  const cursor=field.selectionStart;
  field.value=normalized;
  try{if(cursor!==null)field.setSelectionRange(cursor,cursor)}catch(_){}
 }
 validNumber(field);
},true);
document.addEventListener('focusout',event=>{
 const field=event.target;
 if(!(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement))return;
 delete field.dataset.axPendingFirstTap;
 if(field.dataset.axOriginalType!=='number')return;
 // Keep an invalid value editable so it can be corrected. A valid number is
 // returned to native input type for standard form/DOM semantics.
 if(validNumber(field)){
  field.type='number';
  field.setCustomValidity('');
 }
},true);
// Before submission, ensure AX2's dynamic number controls are valid even if
// the mobile keyboard's submit action fires without a preceding blur.
document.addEventListener('submit',event=>{
 const form=event.target;
 if(!(form instanceof HTMLFormElement))return;
 for(const field of form.querySelectorAll('input[data-ax-original-type="number"]')){
  if(!validNumber(field)){
   event.preventDefault();
   event.stopImmediatePropagation();
   field.reportValidity();
   field.focus();
   return;
  }
 }
},true);
window.AXSelectReplace=Object.freeze({validNumber});
})();
