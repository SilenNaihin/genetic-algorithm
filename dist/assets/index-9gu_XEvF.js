(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function e(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(s){if(s.ep)return;s.ep=!0;const o=e(s);fetch(s.href,o)}})();const Fc="182",wm=0,Th=1,Em=2,Gr=1,Tm=2,vo=3,Di=0,an=1,ai=2,ui=0,Fs=1,Ah=2,Ch=3,Rh=4,Am=5,Qi=100,Cm=101,Rm=102,Pm=103,Lm=104,Dm=200,Im=201,Fm=202,Nm=203,Pl=204,Ll=205,Om=206,Um=207,Bm=208,zm=209,km=210,Vm=211,Hm=212,Gm=213,Wm=214,Dl=0,Il=1,Fl=2,zs=3,Nl=4,Ol=5,Ul=6,Bl=7,Sf=0,qm=1,Xm=2,zn=0,wf=1,Ef=2,Tf=3,Af=4,Cf=5,Rf=6,Pf=7,Lf=300,rs=301,ks=302,zl=303,kl=304,fa=306,Vl=1e3,li=1001,Hl=1002,Be=1003,$m=1004,Qo=1005,We=1006,Ra=1007,ns=1008,pn=1009,Df=1010,If=1011,Fo=1012,Nc=1013,Gn=1014,Un=1015,pi=1016,Oc=1017,Uc=1018,No=1020,Ff=35902,Nf=35899,Of=1021,Uf=1022,Tn=1023,mi=1026,is=1027,Bf=1028,Bc=1029,Vs=1030,zc=1031,kc=1033,Wr=33776,qr=33777,Xr=33778,$r=33779,Gl=35840,Wl=35841,ql=35842,Xl=35843,$l=36196,Yl=37492,jl=37496,Kl=37488,Zl=37489,Jl=37490,Ql=37491,tc=37808,ec=37809,nc=37810,ic=37811,sc=37812,oc=37813,rc=37814,ac=37815,lc=37816,cc=37817,hc=37818,dc=37819,uc=37820,fc=37821,pc=36492,mc=36494,gc=36495,xc=36283,_c=36284,vc=36285,yc=36286,Ym=3200,zf=0,jm=1,Ei="",vn="srgb",Hs="srgb-linear",Zr="linear",le="srgb",ds=7680,Ph=519,Km=512,Zm=513,Jm=514,Vc=515,Qm=516,tg=517,Hc=518,eg=519,Lh=35044,Dh="300 es",Bn=2e3,Jr=2001;function kf(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Qr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function ng(){const i=Qr("canvas");return i.style.display="block",i}const Ih={};function Fh(...i){const t="THREE."+i.shift();console.log(t,...i)}function Bt(...i){const t="THREE."+i.shift();console.warn(t,...i)}function te(...i){const t="THREE."+i.shift();console.error(t,...i)}function Oo(...i){const t=i.join(" ");t in Ih||(Ih[t]=!0,Bt(...i))}function ig(i,t,e){return new Promise(function(n,s){function o(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(o,e);break;default:n()}}setTimeout(o,e)})}class Ks{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const s=n[t];if(s!==void 0){const o=s.indexOf(e);o!==-1&&s.splice(o,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let o=0,r=s.length;o<r;o++)s[o].call(this,t);t.target=null}}}const ke=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Nh=1234567;const To=Math.PI/180,Uo=180/Math.PI;function Zs(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(ke[i&255]+ke[i>>8&255]+ke[i>>16&255]+ke[i>>24&255]+"-"+ke[t&255]+ke[t>>8&255]+"-"+ke[t>>16&15|64]+ke[t>>24&255]+"-"+ke[e&63|128]+ke[e>>8&255]+"-"+ke[e>>16&255]+ke[e>>24&255]+ke[n&255]+ke[n>>8&255]+ke[n>>16&255]+ke[n>>24&255]).toLowerCase()}function jt(i,t,e){return Math.max(t,Math.min(e,i))}function Gc(i,t){return(i%t+t)%t}function sg(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function og(i,t,e){return i!==t?(e-i)/(t-i):0}function Ao(i,t,e){return(1-e)*i+e*t}function rg(i,t,e,n){return Ao(i,t,1-Math.exp(-e*n))}function ag(i,t=1){return t-Math.abs(Gc(i,t*2)-t)}function lg(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function cg(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function hg(i,t){return i+Math.floor(Math.random()*(t-i+1))}function dg(i,t){return i+Math.random()*(t-i)}function ug(i){return i*(.5-Math.random())}function fg(i){i!==void 0&&(Nh=i);let t=Nh+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function pg(i){return i*To}function mg(i){return i*Uo}function gg(i){return(i&i-1)===0&&i!==0}function xg(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function _g(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function vg(i,t,e,n,s){const o=Math.cos,r=Math.sin,a=o(e/2),l=r(e/2),c=o((t+n)/2),h=r((t+n)/2),d=o((t-n)/2),u=r((t-n)/2),f=o((n-t)/2),m=r((n-t)/2);switch(s){case"XYX":i.set(a*h,l*d,l*u,a*c);break;case"YZY":i.set(l*u,a*h,l*d,a*c);break;case"ZXZ":i.set(l*d,l*u,a*h,a*c);break;case"XZX":i.set(a*h,l*m,l*f,a*c);break;case"YXY":i.set(l*f,a*h,l*m,a*c);break;case"ZYZ":i.set(l*m,l*f,a*h,a*c);break;default:Bt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Ds(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function je(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const us={DEG2RAD:To,RAD2DEG:Uo,generateUUID:Zs,clamp:jt,euclideanModulo:Gc,mapLinear:sg,inverseLerp:og,lerp:Ao,damp:rg,pingpong:ag,smoothstep:lg,smootherstep:cg,randInt:hg,randFloat:dg,randFloatSpread:ug,seededRandom:fg,degToRad:pg,radToDeg:mg,isPowerOfTwo:gg,ceilPowerOfTwo:xg,floorPowerOfTwo:_g,setQuaternionFromProperEuler:vg,normalize:je,denormalize:Ds};class ne{constructor(t=0,e=0){ne.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=jt(this.x,t.x,e.x),this.y=jt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=jt(this.x,t,e),this.y=jt(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(jt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(jt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),o=this.x-t.x,r=this.y-t.y;return this.x=o*n-r*s+t.x,this.y=o*s+r*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}let Xo=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,o,r,a){let l=n[s+0],c=n[s+1],h=n[s+2],d=n[s+3],u=o[r+0],f=o[r+1],m=o[r+2],x=o[r+3];if(a<=0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d;return}if(a>=1){t[e+0]=u,t[e+1]=f,t[e+2]=m,t[e+3]=x;return}if(d!==x||l!==u||c!==f||h!==m){let p=l*u+c*f+h*m+d*x;p<0&&(u=-u,f=-f,m=-m,x=-x,p=-p);let g=1-a;if(p<.9995){const _=Math.acos(p),v=Math.sin(_);g=Math.sin(g*_)/v,a=Math.sin(a*_)/v,l=l*g+u*a,c=c*g+f*a,h=h*g+m*a,d=d*g+x*a}else{l=l*g+u*a,c=c*g+f*a,h=h*g+m*a,d=d*g+x*a;const _=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=_,c*=_,h*=_,d*=_}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,o,r){const a=n[s],l=n[s+1],c=n[s+2],h=n[s+3],d=o[r],u=o[r+1],f=o[r+2],m=o[r+3];return t[e]=a*m+h*d+l*f-c*u,t[e+1]=l*m+h*u+c*d-a*f,t[e+2]=c*m+h*f+a*u-l*d,t[e+3]=h*m-a*d-l*u-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,o=t._z,r=t._order,a=Math.cos,l=Math.sin,c=a(n/2),h=a(s/2),d=a(o/2),u=l(n/2),f=l(s/2),m=l(o/2);switch(r){case"XYZ":this._x=u*h*d+c*f*m,this._y=c*f*d-u*h*m,this._z=c*h*m+u*f*d,this._w=c*h*d-u*f*m;break;case"YXZ":this._x=u*h*d+c*f*m,this._y=c*f*d-u*h*m,this._z=c*h*m-u*f*d,this._w=c*h*d+u*f*m;break;case"ZXY":this._x=u*h*d-c*f*m,this._y=c*f*d+u*h*m,this._z=c*h*m+u*f*d,this._w=c*h*d-u*f*m;break;case"ZYX":this._x=u*h*d-c*f*m,this._y=c*f*d+u*h*m,this._z=c*h*m-u*f*d,this._w=c*h*d+u*f*m;break;case"YZX":this._x=u*h*d+c*f*m,this._y=c*f*d+u*h*m,this._z=c*h*m-u*f*d,this._w=c*h*d-u*f*m;break;case"XZY":this._x=u*h*d-c*f*m,this._y=c*f*d-u*h*m,this._z=c*h*m+u*f*d,this._w=c*h*d+u*f*m;break;default:Bt("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],o=e[8],r=e[1],a=e[5],l=e[9],c=e[2],h=e[6],d=e[10],u=n+a+d;if(u>0){const f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-l)*f,this._y=(o-c)*f,this._z=(r-s)*f}else if(n>a&&n>d){const f=2*Math.sqrt(1+n-a-d);this._w=(h-l)/f,this._x=.25*f,this._y=(s+r)/f,this._z=(o+c)/f}else if(a>d){const f=2*Math.sqrt(1+a-n-d);this._w=(o-c)/f,this._x=(s+r)/f,this._y=.25*f,this._z=(l+h)/f}else{const f=2*Math.sqrt(1+d-n-a);this._w=(r-s)/f,this._x=(o+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(jt(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,o=t._z,r=t._w,a=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+r*a+s*c-o*l,this._y=s*h+r*l+o*a-n*c,this._z=o*h+r*c+n*l-s*a,this._w=r*h-n*a-s*l-o*c,this._onChangeCallback(),this}slerp(t,e){if(e<=0)return this;if(e>=1)return this.copy(t);let n=t._x,s=t._y,o=t._z,r=t._w,a=this.dot(t);a<0&&(n=-n,s=-s,o=-o,r=-r,a=-a);let l=1-e;if(a<.9995){const c=Math.acos(a),h=Math.sin(c);l=Math.sin(l*c)/h,e=Math.sin(e*c)/h,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+o*e,this._w=this._w*l+r*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+o*e,this._w=this._w*l+r*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),o=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),o*Math.sin(e),o*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}};class H{constructor(t=0,e=0,n=0){H.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Oh.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Oh.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,o=t.elements;return this.x=o[0]*e+o[3]*n+o[6]*s,this.y=o[1]*e+o[4]*n+o[7]*s,this.z=o[2]*e+o[5]*n+o[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,o=t.elements,r=1/(o[3]*e+o[7]*n+o[11]*s+o[15]);return this.x=(o[0]*e+o[4]*n+o[8]*s+o[12])*r,this.y=(o[1]*e+o[5]*n+o[9]*s+o[13])*r,this.z=(o[2]*e+o[6]*n+o[10]*s+o[14])*r,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,o=t.x,r=t.y,a=t.z,l=t.w,c=2*(r*s-a*n),h=2*(a*e-o*s),d=2*(o*n-r*e);return this.x=e+l*c+r*d-a*h,this.y=n+l*h+a*c-o*d,this.z=s+l*d+o*h-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s,this.y=o[1]*e+o[5]*n+o[9]*s,this.z=o[2]*e+o[6]*n+o[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=jt(this.x,t.x,e.x),this.y=jt(this.y,t.y,e.y),this.z=jt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=jt(this.x,t,e),this.y=jt(this.y,t,e),this.z=jt(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(jt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,o=t.z,r=e.x,a=e.y,l=e.z;return this.x=s*l-o*a,this.y=o*r-n*l,this.z=n*a-s*r,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Pa.copy(this).projectOnVector(t),this.sub(Pa)}reflect(t){return this.sub(Pa.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(jt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Pa=new H,Oh=new Xo;class Ht{constructor(t,e,n,s,o,r,a,l,c){Ht.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,o,r,a,l,c)}set(t,e,n,s,o,r,a,l,c){const h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=o,h[5]=l,h[6]=n,h[7]=r,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,o=this.elements,r=n[0],a=n[3],l=n[6],c=n[1],h=n[4],d=n[7],u=n[2],f=n[5],m=n[8],x=s[0],p=s[3],g=s[6],_=s[1],v=s[4],y=s[7],b=s[2],w=s[5],T=s[8];return o[0]=r*x+a*_+l*b,o[3]=r*p+a*v+l*w,o[6]=r*g+a*y+l*T,o[1]=c*x+h*_+d*b,o[4]=c*p+h*v+d*w,o[7]=c*g+h*y+d*T,o[2]=u*x+f*_+m*b,o[5]=u*p+f*v+m*w,o[8]=u*g+f*y+m*T,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],o=t[3],r=t[4],a=t[5],l=t[6],c=t[7],h=t[8];return e*r*h-e*a*c-n*o*h+n*a*l+s*o*c-s*r*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],o=t[3],r=t[4],a=t[5],l=t[6],c=t[7],h=t[8],d=h*r-a*c,u=a*l-h*o,f=c*o-r*l,m=e*d+n*u+s*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/m;return t[0]=d*x,t[1]=(s*c-h*n)*x,t[2]=(a*n-s*r)*x,t[3]=u*x,t[4]=(h*e-s*l)*x,t[5]=(s*o-a*e)*x,t[6]=f*x,t[7]=(n*l-c*e)*x,t[8]=(r*e-n*o)*x,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,o,r,a){const l=Math.cos(o),c=Math.sin(o);return this.set(n*l,n*c,-n*(l*r+c*a)+r+t,-s*c,s*l,-s*(-c*r+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(La.makeScale(t,e)),this}rotate(t){return this.premultiply(La.makeRotation(-t)),this}translate(t,e){return this.premultiply(La.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const La=new Ht,Uh=new Ht().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Bh=new Ht().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function yg(){const i={enabled:!0,workingColorSpace:Hs,spaces:{},convert:function(s,o,r){return this.enabled===!1||o===r||!o||!r||(this.spaces[o].transfer===le&&(s.r=fi(s.r),s.g=fi(s.g),s.b=fi(s.b)),this.spaces[o].primaries!==this.spaces[r].primaries&&(s.applyMatrix3(this.spaces[o].toXYZ),s.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===le&&(s.r=Ns(s.r),s.g=Ns(s.g),s.b=Ns(s.b))),s},workingToColorSpace:function(s,o){return this.convert(s,this.workingColorSpace,o)},colorSpaceToWorking:function(s,o){return this.convert(s,o,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Ei?Zr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,o=this.workingColorSpace){return s.fromArray(this.spaces[o].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,o,r){return s.copy(this.spaces[o].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,o){return Oo("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,o)},toWorkingColorSpace:function(s,o){return Oo("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,o)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Hs]:{primaries:t,whitePoint:n,transfer:Zr,toXYZ:Uh,fromXYZ:Bh,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:vn},outputColorSpaceConfig:{drawingBufferColorSpace:vn}},[vn]:{primaries:t,whitePoint:n,transfer:le,toXYZ:Uh,fromXYZ:Bh,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:vn}}}),i}const Zt=yg();function fi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ns(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let fs;class bg{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{fs===void 0&&(fs=Qr("canvas")),fs.width=t.width,fs.height=t.height;const s=fs.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=fs}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Qr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),o=s.data;for(let r=0;r<o.length;r++)o[r]=fi(o[r]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(fi(e[n]/255)*255):e[n]=fi(e[n]);return{data:e,width:t.width,height:t.height}}else return Bt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Mg=0;class Wc{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Mg++}),this.uuid=Zs(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayHeight,e.displayWidth,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let o;if(Array.isArray(s)){o=[];for(let r=0,a=s.length;r<a;r++)s[r].isDataTexture?o.push(Da(s[r].image)):o.push(Da(s[r]))}else o=Da(s);n.url=o}return e||(t.images[this.uuid]=n),n}}function Da(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?bg.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Bt("Texture: Unable to serialize Texture."),{})}let Sg=0;const Ia=new H;class Qe extends Ks{constructor(t=Qe.DEFAULT_IMAGE,e=Qe.DEFAULT_MAPPING,n=li,s=li,o=We,r=ns,a=Tn,l=pn,c=Qe.DEFAULT_ANISOTROPY,h=Ei){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Sg++}),this.uuid=Zs(),this.name="",this.source=new Wc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=o,this.minFilter=r,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new ne(0,0),this.repeat=new ne(1,1),this.center=new ne(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ht,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(Ia).x}get height(){return this.source.getSize(Ia).y}get depth(){return this.source.getSize(Ia).z}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){Bt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){Bt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Lf)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Vl:t.x=t.x-Math.floor(t.x);break;case li:t.x=t.x<0?0:1;break;case Hl:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Vl:t.y=t.y-Math.floor(t.y);break;case li:t.y=t.y<0?0:1;break;case Hl:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Qe.DEFAULT_IMAGE=null;Qe.DEFAULT_MAPPING=Lf;Qe.DEFAULT_ANISOTROPY=1;class we{constructor(t=0,e=0,n=0,s=1){we.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,o=this.w,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s+r[12]*o,this.y=r[1]*e+r[5]*n+r[9]*s+r[13]*o,this.z=r[2]*e+r[6]*n+r[10]*s+r[14]*o,this.w=r[3]*e+r[7]*n+r[11]*s+r[15]*o,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,o;const l=t.elements,c=l[0],h=l[4],d=l[8],u=l[1],f=l[5],m=l[9],x=l[2],p=l[6],g=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-x)<.01&&Math.abs(m-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+x)<.1&&Math.abs(m+p)<.1&&Math.abs(c+f+g-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const v=(c+1)/2,y=(f+1)/2,b=(g+1)/2,w=(h+u)/4,T=(d+x)/4,P=(m+p)/4;return v>y&&v>b?v<.01?(n=0,s=.707106781,o=.707106781):(n=Math.sqrt(v),s=w/n,o=T/n):y>b?y<.01?(n=.707106781,s=0,o=.707106781):(s=Math.sqrt(y),n=w/s,o=P/s):b<.01?(n=.707106781,s=.707106781,o=0):(o=Math.sqrt(b),n=T/o,s=P/o),this.set(n,s,o,e),this}let _=Math.sqrt((p-m)*(p-m)+(d-x)*(d-x)+(u-h)*(u-h));return Math.abs(_)<.001&&(_=1),this.x=(p-m)/_,this.y=(d-x)/_,this.z=(u-h)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=jt(this.x,t.x,e.x),this.y=jt(this.y,t.y,e.y),this.z=jt(this.z,t.z,e.z),this.w=jt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=jt(this.x,t,e),this.y=jt(this.y,t,e),this.z=jt(this.z,t,e),this.w=jt(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(jt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class wg extends Ks{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:We,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new we(0,0,t,e),this.scissorTest=!1,this.viewport=new we(0,0,t,e);const s={width:t,height:e,depth:n.depth},o=new Qe(s);this.textures=[];const r=n.count;for(let a=0;a<r;a++)this.textures[a]=o.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(t={}){const e={minFilter:We,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,o=this.textures.length;s<o;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const s=Object.assign({},t.textures[e].image);this.textures[e].source=new Wc(s)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class kn extends wg{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Vf extends Qe{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Be,this.minFilter=Be,this.wrapR=li,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Eg extends Qe{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Be,this.minFilter=Be,this.wrapR=li,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Js{constructor(t=new H(1/0,1/0,1/0),e=new H(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(bn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(bn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=bn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const o=n.getAttribute("position");if(e===!0&&o!==void 0&&t.isInstancedMesh!==!0)for(let r=0,a=o.count;r<a;r++)t.isMesh===!0?t.getVertexPosition(r,bn):bn.fromBufferAttribute(o,r),bn.applyMatrix4(t.matrixWorld),this.expandByPoint(bn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),tr.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),tr.copy(n.boundingBox)),tr.applyMatrix4(t.matrixWorld),this.union(tr)}const s=t.children;for(let o=0,r=s.length;o<r;o++)this.expandByObject(s[o],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,bn),bn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(no),er.subVectors(this.max,no),ps.subVectors(t.a,no),ms.subVectors(t.b,no),gs.subVectors(t.c,no),xi.subVectors(ms,ps),_i.subVectors(gs,ms),zi.subVectors(ps,gs);let e=[0,-xi.z,xi.y,0,-_i.z,_i.y,0,-zi.z,zi.y,xi.z,0,-xi.x,_i.z,0,-_i.x,zi.z,0,-zi.x,-xi.y,xi.x,0,-_i.y,_i.x,0,-zi.y,zi.x,0];return!Fa(e,ps,ms,gs,er)||(e=[1,0,0,0,1,0,0,0,1],!Fa(e,ps,ms,gs,er))?!1:(nr.crossVectors(xi,_i),e=[nr.x,nr.y,nr.z],Fa(e,ps,ms,gs,er))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,bn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(bn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:($n[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),$n[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),$n[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),$n[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),$n[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),$n[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),$n[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),$n[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints($n),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const $n=[new H,new H,new H,new H,new H,new H,new H,new H],bn=new H,tr=new Js,ps=new H,ms=new H,gs=new H,xi=new H,_i=new H,zi=new H,no=new H,er=new H,nr=new H,ki=new H;function Fa(i,t,e,n,s){for(let o=0,r=i.length-3;o<=r;o+=3){ki.fromArray(i,o);const a=s.x*Math.abs(ki.x)+s.y*Math.abs(ki.y)+s.z*Math.abs(ki.z),l=t.dot(ki),c=e.dot(ki),h=n.dot(ki);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}const Tg=new Js,io=new H,Na=new H;let pa=class{constructor(t=new H,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Tg.setFromPoints(t).getCenter(n);let s=0;for(let o=0,r=t.length;o<r;o++)s=Math.max(s,n.distanceToSquared(t[o]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;io.subVectors(t,this.center);const e=io.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(io,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Na.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(io.copy(t.center).add(Na)),this.expandByPoint(io.copy(t.center).sub(Na))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}};const Yn=new H,Oa=new H,ir=new H,vi=new H,Ua=new H,sr=new H,Ba=new H;let Hf=class{constructor(t=new H,e=new H(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Yn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Yn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Yn.copy(this.origin).addScaledVector(this.direction,e),Yn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Oa.copy(t).add(e).multiplyScalar(.5),ir.copy(e).sub(t).normalize(),vi.copy(this.origin).sub(Oa);const o=t.distanceTo(e)*.5,r=-this.direction.dot(ir),a=vi.dot(this.direction),l=-vi.dot(ir),c=vi.lengthSq(),h=Math.abs(1-r*r);let d,u,f,m;if(h>0)if(d=r*l-a,u=r*a-l,m=o*h,d>=0)if(u>=-m)if(u<=m){const x=1/h;d*=x,u*=x,f=d*(d+r*u+2*a)+u*(r*d+u+2*l)+c}else u=o,d=Math.max(0,-(r*u+a)),f=-d*d+u*(u+2*l)+c;else u=-o,d=Math.max(0,-(r*u+a)),f=-d*d+u*(u+2*l)+c;else u<=-m?(d=Math.max(0,-(-r*o+a)),u=d>0?-o:Math.min(Math.max(-o,-l),o),f=-d*d+u*(u+2*l)+c):u<=m?(d=0,u=Math.min(Math.max(-o,-l),o),f=u*(u+2*l)+c):(d=Math.max(0,-(r*o+a)),u=d>0?o:Math.min(Math.max(-o,-l),o),f=-d*d+u*(u+2*l)+c);else u=r>0?-o:o,d=Math.max(0,-(r*u+a)),f=-d*d+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Oa).addScaledVector(ir,u),f}intersectSphere(t,e){Yn.subVectors(t.center,this.origin);const n=Yn.dot(this.direction),s=Yn.dot(Yn)-n*n,o=t.radius*t.radius;if(s>o)return null;const r=Math.sqrt(o-s),a=n-r,l=n+r;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,o,r,a,l;const c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),h>=0?(o=(t.min.y-u.y)*h,r=(t.max.y-u.y)*h):(o=(t.max.y-u.y)*h,r=(t.min.y-u.y)*h),n>r||o>s||((o>n||isNaN(n))&&(n=o),(r<s||isNaN(s))&&(s=r),d>=0?(a=(t.min.z-u.z)*d,l=(t.max.z-u.z)*d):(a=(t.max.z-u.z)*d,l=(t.min.z-u.z)*d),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Yn)!==null}intersectTriangle(t,e,n,s,o){Ua.subVectors(e,t),sr.subVectors(n,t),Ba.crossVectors(Ua,sr);let r=this.direction.dot(Ba),a;if(r>0){if(s)return null;a=1}else if(r<0)a=-1,r=-r;else return null;vi.subVectors(this.origin,t);const l=a*this.direction.dot(sr.crossVectors(vi,sr));if(l<0)return null;const c=a*this.direction.dot(Ua.cross(vi));if(c<0||l+c>r)return null;const h=-a*vi.dot(Ba);return h<0?null:this.at(h/r,o)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}};class be{constructor(t,e,n,s,o,r,a,l,c,h,d,u,f,m,x,p){be.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,o,r,a,l,c,h,d,u,f,m,x,p)}set(t,e,n,s,o,r,a,l,c,h,d,u,f,m,x,p){const g=this.elements;return g[0]=t,g[4]=e,g[8]=n,g[12]=s,g[1]=o,g[5]=r,g[9]=a,g[13]=l,g[2]=c,g[6]=h,g[10]=d,g[14]=u,g[3]=f,g[7]=m,g[11]=x,g[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new be().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinant()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinant()===0)return this.identity();const e=this.elements,n=t.elements,s=1/xs.setFromMatrixColumn(t,0).length(),o=1/xs.setFromMatrixColumn(t,1).length(),r=1/xs.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*o,e[5]=n[5]*o,e[6]=n[6]*o,e[7]=0,e[8]=n[8]*r,e[9]=n[9]*r,e[10]=n[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,o=t.z,r=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(o),d=Math.sin(o);if(t.order==="XYZ"){const u=r*h,f=r*d,m=a*h,x=a*d;e[0]=l*h,e[4]=-l*d,e[8]=c,e[1]=f+m*c,e[5]=u-x*c,e[9]=-a*l,e[2]=x-u*c,e[6]=m+f*c,e[10]=r*l}else if(t.order==="YXZ"){const u=l*h,f=l*d,m=c*h,x=c*d;e[0]=u+x*a,e[4]=m*a-f,e[8]=r*c,e[1]=r*d,e[5]=r*h,e[9]=-a,e[2]=f*a-m,e[6]=x+u*a,e[10]=r*l}else if(t.order==="ZXY"){const u=l*h,f=l*d,m=c*h,x=c*d;e[0]=u-x*a,e[4]=-r*d,e[8]=m+f*a,e[1]=f+m*a,e[5]=r*h,e[9]=x-u*a,e[2]=-r*c,e[6]=a,e[10]=r*l}else if(t.order==="ZYX"){const u=r*h,f=r*d,m=a*h,x=a*d;e[0]=l*h,e[4]=m*c-f,e[8]=u*c+x,e[1]=l*d,e[5]=x*c+u,e[9]=f*c-m,e[2]=-c,e[6]=a*l,e[10]=r*l}else if(t.order==="YZX"){const u=r*l,f=r*c,m=a*l,x=a*c;e[0]=l*h,e[4]=x-u*d,e[8]=m*d+f,e[1]=d,e[5]=r*h,e[9]=-a*h,e[2]=-c*h,e[6]=f*d+m,e[10]=u-x*d}else if(t.order==="XZY"){const u=r*l,f=r*c,m=a*l,x=a*c;e[0]=l*h,e[4]=-d,e[8]=c*h,e[1]=u*d+x,e[5]=r*h,e[9]=f*d-m,e[2]=m*d-f,e[6]=a*h,e[10]=x*d+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Ag,t,Cg)}lookAt(t,e,n){const s=this.elements;return dn.subVectors(t,e),dn.lengthSq()===0&&(dn.z=1),dn.normalize(),yi.crossVectors(n,dn),yi.lengthSq()===0&&(Math.abs(n.z)===1?dn.x+=1e-4:dn.z+=1e-4,dn.normalize(),yi.crossVectors(n,dn)),yi.normalize(),or.crossVectors(dn,yi),s[0]=yi.x,s[4]=or.x,s[8]=dn.x,s[1]=yi.y,s[5]=or.y,s[9]=dn.y,s[2]=yi.z,s[6]=or.z,s[10]=dn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,o=this.elements,r=n[0],a=n[4],l=n[8],c=n[12],h=n[1],d=n[5],u=n[9],f=n[13],m=n[2],x=n[6],p=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],w=s[0],T=s[4],P=s[8],M=s[12],E=s[1],R=s[5],N=s[9],D=s[13],O=s[2],F=s[6],I=s[10],z=s[14],W=s[3],j=s[7],tt=s[11],nt=s[15];return o[0]=r*w+a*E+l*O+c*W,o[4]=r*T+a*R+l*F+c*j,o[8]=r*P+a*N+l*I+c*tt,o[12]=r*M+a*D+l*z+c*nt,o[1]=h*w+d*E+u*O+f*W,o[5]=h*T+d*R+u*F+f*j,o[9]=h*P+d*N+u*I+f*tt,o[13]=h*M+d*D+u*z+f*nt,o[2]=m*w+x*E+p*O+g*W,o[6]=m*T+x*R+p*F+g*j,o[10]=m*P+x*N+p*I+g*tt,o[14]=m*M+x*D+p*z+g*nt,o[3]=_*w+v*E+y*O+b*W,o[7]=_*T+v*R+y*F+b*j,o[11]=_*P+v*N+y*I+b*tt,o[15]=_*M+v*D+y*z+b*nt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],o=t[12],r=t[1],a=t[5],l=t[9],c=t[13],h=t[2],d=t[6],u=t[10],f=t[14],m=t[3],x=t[7],p=t[11],g=t[15],_=l*f-c*u,v=a*f-c*d,y=a*u-l*d,b=r*f-c*h,w=r*u-l*h,T=r*d-a*h;return e*(x*_-p*v+g*y)-n*(m*_-p*b+g*w)+s*(m*v-x*b+g*T)-o*(m*y-x*w+p*T)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],o=t[3],r=t[4],a=t[5],l=t[6],c=t[7],h=t[8],d=t[9],u=t[10],f=t[11],m=t[12],x=t[13],p=t[14],g=t[15],_=d*p*c-x*u*c+x*l*f-a*p*f-d*l*g+a*u*g,v=m*u*c-h*p*c-m*l*f+r*p*f+h*l*g-r*u*g,y=h*x*c-m*d*c+m*a*f-r*x*f-h*a*g+r*d*g,b=m*d*l-h*x*l-m*a*u+r*x*u+h*a*p-r*d*p,w=e*_+n*v+s*y+o*b;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const T=1/w;return t[0]=_*T,t[1]=(x*u*o-d*p*o-x*s*f+n*p*f+d*s*g-n*u*g)*T,t[2]=(a*p*o-x*l*o+x*s*c-n*p*c-a*s*g+n*l*g)*T,t[3]=(d*l*o-a*u*o-d*s*c+n*u*c+a*s*f-n*l*f)*T,t[4]=v*T,t[5]=(h*p*o-m*u*o+m*s*f-e*p*f-h*s*g+e*u*g)*T,t[6]=(m*l*o-r*p*o-m*s*c+e*p*c+r*s*g-e*l*g)*T,t[7]=(r*u*o-h*l*o+h*s*c-e*u*c-r*s*f+e*l*f)*T,t[8]=y*T,t[9]=(m*d*o-h*x*o-m*n*f+e*x*f+h*n*g-e*d*g)*T,t[10]=(r*x*o-m*a*o+m*n*c-e*x*c-r*n*g+e*a*g)*T,t[11]=(h*a*o-r*d*o-h*n*c+e*d*c+r*n*f-e*a*f)*T,t[12]=b*T,t[13]=(h*x*s-m*d*s+m*n*u-e*x*u-h*n*p+e*d*p)*T,t[14]=(m*a*s-r*x*s-m*n*l+e*x*l+r*n*p-e*a*p)*T,t[15]=(r*d*s-h*a*s+h*n*l-e*d*l-r*n*u+e*a*u)*T,this}scale(t){const e=this.elements,n=t.x,s=t.y,o=t.z;return e[0]*=n,e[4]*=s,e[8]*=o,e[1]*=n,e[5]*=s,e[9]*=o,e[2]*=n,e[6]*=s,e[10]*=o,e[3]*=n,e[7]*=s,e[11]*=o,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),o=1-n,r=t.x,a=t.y,l=t.z,c=o*r,h=o*a;return this.set(c*r+n,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+n,h*l-s*r,0,c*l-s*a,h*l+s*r,o*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,o,r){return this.set(1,n,o,0,t,1,r,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,o=e._x,r=e._y,a=e._z,l=e._w,c=o+o,h=r+r,d=a+a,u=o*c,f=o*h,m=o*d,x=r*h,p=r*d,g=a*d,_=l*c,v=l*h,y=l*d,b=n.x,w=n.y,T=n.z;return s[0]=(1-(x+g))*b,s[1]=(f+y)*b,s[2]=(m-v)*b,s[3]=0,s[4]=(f-y)*w,s[5]=(1-(u+g))*w,s[6]=(p+_)*w,s[7]=0,s[8]=(m+v)*T,s[9]=(p-_)*T,s[10]=(1-(u+x))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;if(t.x=s[12],t.y=s[13],t.z=s[14],this.determinant()===0)return n.set(1,1,1),e.identity(),this;let o=xs.set(s[0],s[1],s[2]).length();const r=xs.set(s[4],s[5],s[6]).length(),a=xs.set(s[8],s[9],s[10]).length();this.determinant()<0&&(o=-o),Mn.copy(this);const c=1/o,h=1/r,d=1/a;return Mn.elements[0]*=c,Mn.elements[1]*=c,Mn.elements[2]*=c,Mn.elements[4]*=h,Mn.elements[5]*=h,Mn.elements[6]*=h,Mn.elements[8]*=d,Mn.elements[9]*=d,Mn.elements[10]*=d,e.setFromRotationMatrix(Mn),n.x=o,n.y=r,n.z=a,this}makePerspective(t,e,n,s,o,r,a=Bn,l=!1){const c=this.elements,h=2*o/(e-t),d=2*o/(n-s),u=(e+t)/(e-t),f=(n+s)/(n-s);let m,x;if(l)m=o/(r-o),x=r*o/(r-o);else if(a===Bn)m=-(r+o)/(r-o),x=-2*r*o/(r-o);else if(a===Jr)m=-r/(r-o),x=-r*o/(r-o);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=d,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=m,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,o,r,a=Bn,l=!1){const c=this.elements,h=2/(e-t),d=2/(n-s),u=-(e+t)/(e-t),f=-(n+s)/(n-s);let m,x;if(l)m=1/(r-o),x=r/(r-o);else if(a===Bn)m=-2/(r-o),x=-(r+o)/(r-o);else if(a===Jr)m=-1/(r-o),x=-o/(r-o);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=d,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=m,c[14]=x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const xs=new H,Mn=new be,Ag=new H(0,0,0),Cg=new H(1,1,1),yi=new H,or=new H,dn=new H,zh=new be,kh=new Xo;class Wn{constructor(t=0,e=0,n=0,s=Wn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,o=s[0],r=s[4],a=s[8],l=s[1],c=s[5],h=s[9],d=s[2],u=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(jt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-r,o)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-jt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,o),this._z=0);break;case"ZXY":this._x=Math.asin(jt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(l,o));break;case"ZYX":this._y=Math.asin(-jt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(l,o)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(jt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,o)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-jt(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(a,o)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Bt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return zh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(zh,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return kh.setFromEuler(this),this.setFromQuaternion(kh,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Wn.DEFAULT_ORDER="XYZ";class Gf{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Rg=0;const Vh=new H,_s=new Xo,jn=new be,rr=new H,so=new H,Pg=new H,Lg=new Xo,Hh=new H(1,0,0),Gh=new H(0,1,0),Wh=new H(0,0,1),qh={type:"added"},Dg={type:"removed"},vs={type:"childadded",child:null},za={type:"childremoved",child:null};class ze extends Ks{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Rg++}),this.uuid=Zs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ze.DEFAULT_UP.clone();const t=new H,e=new Wn,n=new Xo,s=new H(1,1,1);function o(){n.setFromEuler(e,!1)}function r(){e.setFromQuaternion(n,void 0,!1)}e._onChange(o),n._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new be},normalMatrix:{value:new Ht}}),this.matrix=new be,this.matrixWorld=new be,this.matrixAutoUpdate=ze.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ze.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Gf,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return _s.setFromAxisAngle(t,e),this.quaternion.multiply(_s),this}rotateOnWorldAxis(t,e){return _s.setFromAxisAngle(t,e),this.quaternion.premultiply(_s),this}rotateX(t){return this.rotateOnAxis(Hh,t)}rotateY(t){return this.rotateOnAxis(Gh,t)}rotateZ(t){return this.rotateOnAxis(Wh,t)}translateOnAxis(t,e){return Vh.copy(t).applyQuaternion(this.quaternion),this.position.add(Vh.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Hh,t)}translateY(t){return this.translateOnAxis(Gh,t)}translateZ(t){return this.translateOnAxis(Wh,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(jn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?rr.copy(t):rr.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),so.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?jn.lookAt(so,rr,this.up):jn.lookAt(rr,so,this.up),this.quaternion.setFromRotationMatrix(jn),s&&(jn.extractRotation(s.matrixWorld),_s.setFromRotationMatrix(jn),this.quaternion.premultiply(_s.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(te("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(qh),vs.child=t,this.dispatchEvent(vs),vs.child=null):te("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Dg),za.child=t,this.dispatchEvent(za),za.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),jn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),jn.multiply(t.parent.matrixWorld)),t.applyMatrix4(jn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(qh),vs.child=t,this.dispatchEvent(vs),vs.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const r=this.children[n].getObjectByProperty(t,e);if(r!==void 0)return r}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let o=0,r=s.length;o<r;o++)s[o].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(so,t,Pg),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(so,Lg,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let o=0,r=s.length;o<r;o++)s[o].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function o(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=o(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const d=l[c];o(t.shapes,d)}else o(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(o(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(o(t.materials,this.material[l]));s.material=a}else s.material=o(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];s.animations.push(o(t.animations,l))}}if(e){const a=r(t.geometries),l=r(t.materials),c=r(t.textures),h=r(t.images),d=r(t.shapes),u=r(t.skeletons),f=r(t.animations),m=r(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),f.length>0&&(n.animations=f),m.length>0&&(n.nodes=m)}return n.object=s,n;function r(a){const l=[];for(const c in a){const h=a[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}ze.DEFAULT_UP=new H(0,1,0);ze.DEFAULT_MATRIX_AUTO_UPDATE=!0;ze.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Sn=new H,Kn=new H,ka=new H,Zn=new H,ys=new H,bs=new H,Xh=new H,Va=new H,Ha=new H,Ga=new H,Wa=new we,qa=new we,Xa=new we;class En{constructor(t=new H,e=new H,n=new H){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Sn.subVectors(t,e),s.cross(Sn);const o=s.lengthSq();return o>0?s.multiplyScalar(1/Math.sqrt(o)):s.set(0,0,0)}static getBarycoord(t,e,n,s,o){Sn.subVectors(s,e),Kn.subVectors(n,e),ka.subVectors(t,e);const r=Sn.dot(Sn),a=Sn.dot(Kn),l=Sn.dot(ka),c=Kn.dot(Kn),h=Kn.dot(ka),d=r*c-a*a;if(d===0)return o.set(0,0,0),null;const u=1/d,f=(c*l-a*h)*u,m=(r*h-a*l)*u;return o.set(1-f-m,m,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Zn)===null?!1:Zn.x>=0&&Zn.y>=0&&Zn.x+Zn.y<=1}static getInterpolation(t,e,n,s,o,r,a,l){return this.getBarycoord(t,e,n,s,Zn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(o,Zn.x),l.addScaledVector(r,Zn.y),l.addScaledVector(a,Zn.z),l)}static getInterpolatedAttribute(t,e,n,s,o,r){return Wa.setScalar(0),qa.setScalar(0),Xa.setScalar(0),Wa.fromBufferAttribute(t,e),qa.fromBufferAttribute(t,n),Xa.fromBufferAttribute(t,s),r.setScalar(0),r.addScaledVector(Wa,o.x),r.addScaledVector(qa,o.y),r.addScaledVector(Xa,o.z),r}static isFrontFacing(t,e,n,s){return Sn.subVectors(n,e),Kn.subVectors(t,e),Sn.cross(Kn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Sn.subVectors(this.c,this.b),Kn.subVectors(this.a,this.b),Sn.cross(Kn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return En.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return En.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,o){return En.getInterpolation(t,this.a,this.b,this.c,e,n,s,o)}containsPoint(t){return En.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return En.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,o=this.c;let r,a;ys.subVectors(s,n),bs.subVectors(o,n),Va.subVectors(t,n);const l=ys.dot(Va),c=bs.dot(Va);if(l<=0&&c<=0)return e.copy(n);Ha.subVectors(t,s);const h=ys.dot(Ha),d=bs.dot(Ha);if(h>=0&&d<=h)return e.copy(s);const u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return r=l/(l-h),e.copy(n).addScaledVector(ys,r);Ga.subVectors(t,o);const f=ys.dot(Ga),m=bs.dot(Ga);if(m>=0&&f<=m)return e.copy(o);const x=f*c-l*m;if(x<=0&&c>=0&&m<=0)return a=c/(c-m),e.copy(n).addScaledVector(bs,a);const p=h*m-f*d;if(p<=0&&d-h>=0&&f-m>=0)return Xh.subVectors(o,s),a=(d-h)/(d-h+(f-m)),e.copy(s).addScaledVector(Xh,a);const g=1/(p+x+u);return r=x*g,a=u*g,e.copy(n).addScaledVector(ys,r).addScaledVector(bs,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Wf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},bi={h:0,s:0,l:0},ar={h:0,s:0,l:0};function $a(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}let qt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=vn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Zt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=Zt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Zt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=Zt.workingColorSpace){if(t=Gc(t,1),e=jt(e,0,1),n=jt(n,0,1),e===0)this.r=this.g=this.b=n;else{const o=n<=.5?n*(1+e):n+e-n*e,r=2*n-o;this.r=$a(r,o,t+1/3),this.g=$a(r,o,t),this.b=$a(r,o,t-1/3)}return Zt.colorSpaceToWorking(this,s),this}setStyle(t,e=vn){function n(o){o!==void 0&&parseFloat(o)<1&&Bt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let o;const r=s[1],a=s[2];switch(r){case"rgb":case"rgba":if(o=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(o[4]),this.setRGB(Math.min(255,parseInt(o[1],10))/255,Math.min(255,parseInt(o[2],10))/255,Math.min(255,parseInt(o[3],10))/255,e);if(o=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(o[4]),this.setRGB(Math.min(100,parseInt(o[1],10))/100,Math.min(100,parseInt(o[2],10))/100,Math.min(100,parseInt(o[3],10))/100,e);break;case"hsl":case"hsla":if(o=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(o[4]),this.setHSL(parseFloat(o[1])/360,parseFloat(o[2])/100,parseFloat(o[3])/100,e);break;default:Bt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const o=s[1],r=o.length;if(r===3)return this.setRGB(parseInt(o.charAt(0),16)/15,parseInt(o.charAt(1),16)/15,parseInt(o.charAt(2),16)/15,e);if(r===6)return this.setHex(parseInt(o,16),e);Bt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=vn){const n=Wf[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Bt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=fi(t.r),this.g=fi(t.g),this.b=fi(t.b),this}copyLinearToSRGB(t){return this.r=Ns(t.r),this.g=Ns(t.g),this.b=Ns(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=vn){return Zt.workingToColorSpace(Ve.copy(this),t),Math.round(jt(Ve.r*255,0,255))*65536+Math.round(jt(Ve.g*255,0,255))*256+Math.round(jt(Ve.b*255,0,255))}getHexString(t=vn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Zt.workingColorSpace){Zt.workingToColorSpace(Ve.copy(this),e);const n=Ve.r,s=Ve.g,o=Ve.b,r=Math.max(n,s,o),a=Math.min(n,s,o);let l,c;const h=(a+r)/2;if(a===r)l=0,c=0;else{const d=r-a;switch(c=h<=.5?d/(r+a):d/(2-r-a),r){case n:l=(s-o)/d+(s<o?6:0);break;case s:l=(o-n)/d+2;break;case o:l=(n-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Zt.workingColorSpace){return Zt.workingToColorSpace(Ve.copy(this),e),t.r=Ve.r,t.g=Ve.g,t.b=Ve.b,t}getStyle(t=vn){Zt.workingToColorSpace(Ve.copy(this),t);const e=Ve.r,n=Ve.g,s=Ve.b;return t!==vn?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(bi),this.setHSL(bi.h+t,bi.s+e,bi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(bi),t.getHSL(ar);const n=Ao(bi.h,ar.h,e),s=Ao(bi.s,ar.s,e),o=Ao(bi.l,ar.l,e);return this.setHSL(n,s,o),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,o=t.elements;return this.r=o[0]*e+o[3]*n+o[6]*s,this.g=o[1]*e+o[4]*n+o[7]*s,this.b=o[2]*e+o[5]*n+o[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}};const Ve=new qt;qt.NAMES=Wf;let Ig=0,Qs=class extends Ks{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ig++}),this.uuid=Zs(),this.name="",this.type="Material",this.blending=Fs,this.side=Di,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Pl,this.blendDst=Ll,this.blendEquation=Qi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new qt(0,0,0),this.blendAlpha=0,this.depthFunc=zs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ph,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ds,this.stencilZFail=ds,this.stencilZPass=ds,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){Bt(`Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){Bt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Fs&&(n.blending=this.blending),this.side!==Di&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Pl&&(n.blendSrc=this.blendSrc),this.blendDst!==Ll&&(n.blendDst=this.blendDst),this.blendEquation!==Qi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==zs&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ph&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ds&&(n.stencilFail=this.stencilFail),this.stencilZFail!==ds&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==ds&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(o){const r=[];for(const a in o){const l=o[a];delete l.metadata,r.push(l)}return r}if(e){const o=s(t.textures),r=s(t.images);o.length>0&&(n.textures=o),r.length>0&&(n.images=r)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let o=0;o!==s;++o)n[o]=e[o].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};class qf extends Qs{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new qt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wn,this.combine=Sf,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Ce=new H,lr=new ne;let Fg=0;class Vn{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Fg++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Lh,this.updateRanges=[],this.gpuType=Un,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,o=this.itemSize;s<o;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)lr.fromBufferAttribute(this,e),lr.applyMatrix3(t),this.setXY(e,lr.x,lr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ce.fromBufferAttribute(this,e),Ce.applyMatrix3(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ce.fromBufferAttribute(this,e),Ce.applyMatrix4(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ce.fromBufferAttribute(this,e),Ce.applyNormalMatrix(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ce.fromBufferAttribute(this,e),Ce.transformDirection(t),this.setXYZ(e,Ce.x,Ce.y,Ce.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Ds(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=je(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Ds(e,this.array)),e}setX(t,e){return this.normalized&&(e=je(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Ds(e,this.array)),e}setY(t,e){return this.normalized&&(e=je(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Ds(e,this.array)),e}setZ(t,e){return this.normalized&&(e=je(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Ds(e,this.array)),e}setW(t,e){return this.normalized&&(e=je(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=je(e,this.array),n=je(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=je(e,this.array),n=je(n,this.array),s=je(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,o){return t*=this.itemSize,this.normalized&&(e=je(e,this.array),n=je(n,this.array),s=je(s,this.array),o=je(o,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=o,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Lh&&(t.usage=this.usage),t}}class Xf extends Vn{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class $f extends Vn{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Ie extends Vn{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Ng=0;const xn=new be,Ya=new ze,Ms=new H,un=new Js,oo=new Js,Oe=new H;class ln extends Ks{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ng++}),this.uuid=Zs(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(kf(t)?$f:Xf)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const o=new Ht().getNormalMatrix(t);n.applyNormalMatrix(o),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return xn.makeRotationFromQuaternion(t),this.applyMatrix4(xn),this}rotateX(t){return xn.makeRotationX(t),this.applyMatrix4(xn),this}rotateY(t){return xn.makeRotationY(t),this.applyMatrix4(xn),this}rotateZ(t){return xn.makeRotationZ(t),this.applyMatrix4(xn),this}translate(t,e,n){return xn.makeTranslation(t,e,n),this.applyMatrix4(xn),this}scale(t,e,n){return xn.makeScale(t,e,n),this.applyMatrix4(xn),this}lookAt(t){return Ya.lookAt(t),Ya.updateMatrix(),this.applyMatrix4(Ya.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ms).negate(),this.translate(Ms.x,Ms.y,Ms.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,o=t.length;s<o;s++){const r=t[s];n.push(r.x,r.y,r.z||0)}this.setAttribute("position",new Ie(n,3))}else{const n=Math.min(t.length,e.count);for(let s=0;s<n;s++){const o=t[s];e.setXYZ(s,o.x,o.y,o.z||0)}t.length>e.count&&Bt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Js);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){te("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new H(-1/0,-1/0,-1/0),new H(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const o=e[n];un.setFromBufferAttribute(o),this.morphTargetsRelative?(Oe.addVectors(this.boundingBox.min,un.min),this.boundingBox.expandByPoint(Oe),Oe.addVectors(this.boundingBox.max,un.max),this.boundingBox.expandByPoint(Oe)):(this.boundingBox.expandByPoint(un.min),this.boundingBox.expandByPoint(un.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&te('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new pa);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){te("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new H,1/0);return}if(t){const n=this.boundingSphere.center;if(un.setFromBufferAttribute(t),e)for(let o=0,r=e.length;o<r;o++){const a=e[o];oo.setFromBufferAttribute(a),this.morphTargetsRelative?(Oe.addVectors(un.min,oo.min),un.expandByPoint(Oe),Oe.addVectors(un.max,oo.max),un.expandByPoint(Oe)):(un.expandByPoint(oo.min),un.expandByPoint(oo.max))}un.getCenter(n);let s=0;for(let o=0,r=t.count;o<r;o++)Oe.fromBufferAttribute(t,o),s=Math.max(s,n.distanceToSquared(Oe));if(e)for(let o=0,r=e.length;o<r;o++){const a=e[o],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Oe.fromBufferAttribute(a,c),l&&(Ms.fromBufferAttribute(t,c),Oe.add(Ms)),s=Math.max(s,n.distanceToSquared(Oe))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&te('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){te("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,o=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Vn(new Float32Array(4*n.count),4));const r=this.getAttribute("tangent"),a=[],l=[];for(let P=0;P<n.count;P++)a[P]=new H,l[P]=new H;const c=new H,h=new H,d=new H,u=new ne,f=new ne,m=new ne,x=new H,p=new H;function g(P,M,E){c.fromBufferAttribute(n,P),h.fromBufferAttribute(n,M),d.fromBufferAttribute(n,E),u.fromBufferAttribute(o,P),f.fromBufferAttribute(o,M),m.fromBufferAttribute(o,E),h.sub(c),d.sub(c),f.sub(u),m.sub(u);const R=1/(f.x*m.y-m.x*f.y);isFinite(R)&&(x.copy(h).multiplyScalar(m.y).addScaledVector(d,-f.y).multiplyScalar(R),p.copy(d).multiplyScalar(f.x).addScaledVector(h,-m.x).multiplyScalar(R),a[P].add(x),a[M].add(x),a[E].add(x),l[P].add(p),l[M].add(p),l[E].add(p))}let _=this.groups;_.length===0&&(_=[{start:0,count:t.count}]);for(let P=0,M=_.length;P<M;++P){const E=_[P],R=E.start,N=E.count;for(let D=R,O=R+N;D<O;D+=3)g(t.getX(D+0),t.getX(D+1),t.getX(D+2))}const v=new H,y=new H,b=new H,w=new H;function T(P){b.fromBufferAttribute(s,P),w.copy(b);const M=a[P];v.copy(M),v.sub(b.multiplyScalar(b.dot(M))).normalize(),y.crossVectors(w,M);const R=y.dot(l[P])<0?-1:1;r.setXYZW(P,v.x,v.y,v.z,R)}for(let P=0,M=_.length;P<M;++P){const E=_[P],R=E.start,N=E.count;for(let D=R,O=R+N;D<O;D+=3)T(t.getX(D+0)),T(t.getX(D+1)),T(t.getX(D+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Vn(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,f=n.count;u<f;u++)n.setXYZ(u,0,0,0);const s=new H,o=new H,r=new H,a=new H,l=new H,c=new H,h=new H,d=new H;if(t)for(let u=0,f=t.count;u<f;u+=3){const m=t.getX(u+0),x=t.getX(u+1),p=t.getX(u+2);s.fromBufferAttribute(e,m),o.fromBufferAttribute(e,x),r.fromBufferAttribute(e,p),h.subVectors(r,o),d.subVectors(s,o),h.cross(d),a.fromBufferAttribute(n,m),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,p),a.add(h),l.add(h),c.add(h),n.setXYZ(m,a.x,a.y,a.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let u=0,f=e.count;u<f;u+=3)s.fromBufferAttribute(e,u+0),o.fromBufferAttribute(e,u+1),r.fromBufferAttribute(e,u+2),h.subVectors(r,o),d.subVectors(s,o),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Oe.fromBufferAttribute(t,e),Oe.normalize(),t.setXYZ(e,Oe.x,Oe.y,Oe.z)}toNonIndexed(){function t(a,l){const c=a.array,h=a.itemSize,d=a.normalized,u=new c.constructor(l.length*h);let f=0,m=0;for(let x=0,p=l.length;x<p;x++){a.isInterleavedBufferAttribute?f=l[x]*a.data.stride+a.offset:f=l[x]*h;for(let g=0;g<h;g++)u[m++]=c[f++]}return new Vn(u,h,d)}if(this.index===null)return Bt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ln,n=this.index.array,s=this.attributes;for(const a in s){const l=s[a],c=t(l,n);e.setAttribute(a,c)}const o=this.morphAttributes;for(const a in o){const l=[],c=o[a];for(let h=0,d=c.length;h<d;h++){const u=c[h],f=t(u,n);l.push(f)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;const r=this.groups;for(let a=0,l=r.length;a<l;a++){const c=r[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let o=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){const f=c[d];h.push(f.toJSON(t.data))}h.length>0&&(s[l]=h,o=!0)}o&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere=a.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const s=t.attributes;for(const c in s){const h=s[c];this.setAttribute(c,h.clone(e))}const o=t.morphAttributes;for(const c in o){const h=[],d=o[c];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const r=t.groups;for(let c=0,h=r.length;c<h;c++){const d=r[c];this.addGroup(d.start,d.count,d.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const $h=new be,Vi=new Hf,cr=new pa,Yh=new H,hr=new H,dr=new H,ur=new H,ja=new H,fr=new H,jh=new H,pr=new H;class Je extends ze{constructor(t=new ln,e=new qf){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,r=s.length;o<r;o++){const a=s[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,o=n.morphAttributes.position,r=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const a=this.morphTargetInfluences;if(o&&a){fr.set(0,0,0);for(let l=0,c=o.length;l<c;l++){const h=a[l],d=o[l];h!==0&&(ja.fromBufferAttribute(d,t),r?fr.addScaledVector(ja,h):fr.addScaledVector(ja.sub(e),h))}e.add(fr)}return e}raycast(t,e){const n=this.geometry,s=this.material,o=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),cr.copy(n.boundingSphere),cr.applyMatrix4(o),Vi.copy(t.ray).recast(t.near),!(cr.containsPoint(Vi.origin)===!1&&(Vi.intersectSphere(cr,Yh)===null||Vi.origin.distanceToSquared(Yh)>(t.far-t.near)**2))&&($h.copy(o).invert(),Vi.copy(t.ray).applyMatrix4($h),!(n.boundingBox!==null&&Vi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Vi)))}_computeIntersections(t,e,n){let s;const o=this.geometry,r=this.material,a=o.index,l=o.attributes.position,c=o.attributes.uv,h=o.attributes.uv1,d=o.attributes.normal,u=o.groups,f=o.drawRange;if(a!==null)if(Array.isArray(r))for(let m=0,x=u.length;m<x;m++){const p=u[m],g=r[p.materialIndex],_=Math.max(p.start,f.start),v=Math.min(a.count,Math.min(p.start+p.count,f.start+f.count));for(let y=_,b=v;y<b;y+=3){const w=a.getX(y),T=a.getX(y+1),P=a.getX(y+2);s=mr(this,g,t,n,c,h,d,w,T,P),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{const m=Math.max(0,f.start),x=Math.min(a.count,f.start+f.count);for(let p=m,g=x;p<g;p+=3){const _=a.getX(p),v=a.getX(p+1),y=a.getX(p+2);s=mr(this,r,t,n,c,h,d,_,v,y),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(r))for(let m=0,x=u.length;m<x;m++){const p=u[m],g=r[p.materialIndex],_=Math.max(p.start,f.start),v=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let y=_,b=v;y<b;y+=3){const w=y,T=y+1,P=y+2;s=mr(this,g,t,n,c,h,d,w,T,P),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{const m=Math.max(0,f.start),x=Math.min(l.count,f.start+f.count);for(let p=m,g=x;p<g;p+=3){const _=p,v=p+1,y=p+2;s=mr(this,r,t,n,c,h,d,_,v,y),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}}function Og(i,t,e,n,s,o,r,a){let l;if(t.side===an?l=n.intersectTriangle(r,o,s,!0,a):l=n.intersectTriangle(s,o,r,t.side===Di,a),l===null)return null;pr.copy(a),pr.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(pr);return c<e.near||c>e.far?null:{distance:c,point:pr.clone(),object:i}}function mr(i,t,e,n,s,o,r,a,l,c){i.getVertexPosition(a,hr),i.getVertexPosition(l,dr),i.getVertexPosition(c,ur);const h=Og(i,t,e,n,hr,dr,ur,jh);if(h){const d=new H;En.getBarycoord(jh,hr,dr,ur,d),s&&(h.uv=En.getInterpolatedAttribute(s,a,l,c,d,new ne)),o&&(h.uv1=En.getInterpolatedAttribute(o,a,l,c,d,new ne)),r&&(h.normal=En.getInterpolatedAttribute(r,a,l,c,d,new H),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a,b:l,c,normal:new H,materialIndex:0};En.getNormal(hr,dr,ur,u.normal),h.face=u,h.barycoord=d}return h}class $o extends ln{constructor(t=1,e=1,n=1,s=1,o=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:o,depthSegments:r};const a=this;s=Math.floor(s),o=Math.floor(o),r=Math.floor(r);const l=[],c=[],h=[],d=[];let u=0,f=0;m("z","y","x",-1,-1,n,e,t,r,o,0),m("z","y","x",1,-1,n,e,-t,r,o,1),m("x","z","y",1,1,t,n,e,s,r,2),m("x","z","y",1,-1,t,n,-e,s,r,3),m("x","y","z",1,-1,t,e,n,s,o,4),m("x","y","z",-1,-1,t,e,-n,s,o,5),this.setIndex(l),this.setAttribute("position",new Ie(c,3)),this.setAttribute("normal",new Ie(h,3)),this.setAttribute("uv",new Ie(d,2));function m(x,p,g,_,v,y,b,w,T,P,M){const E=y/T,R=b/P,N=y/2,D=b/2,O=w/2,F=T+1,I=P+1;let z=0,W=0;const j=new H;for(let tt=0;tt<I;tt++){const nt=tt*R-D;for(let et=0;et<F;et++){const St=et*E-N;j[x]=St*_,j[p]=nt*v,j[g]=O,c.push(j.x,j.y,j.z),j[x]=0,j[p]=0,j[g]=w>0?1:-1,h.push(j.x,j.y,j.z),d.push(et/T),d.push(1-tt/P),z+=1}}for(let tt=0;tt<P;tt++)for(let nt=0;nt<T;nt++){const et=u+nt+F*tt,St=u+nt+F*(tt+1),Xt=u+(nt+1)+F*(tt+1),ut=u+(nt+1)+F*tt;l.push(et,St,ut),l.push(St,Xt,ut),W+=6}a.addGroup(f,W,M),f+=W,u+=z}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new $o(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Gs(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(Bt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Ke(i){const t={};for(let e=0;e<i.length;e++){const n=Gs(i[e]);for(const s in n)t[s]=n[s]}return t}function Ug(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Yf(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Zt.workingColorSpace}const Bg={clone:Gs,merge:Ke};var zg=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,kg=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class qn extends Qs{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=zg,this.fragmentShader=kg,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Gs(t.uniforms),this.uniformsGroups=Ug(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const r=this.uniforms[s].value;r&&r.isTexture?e.uniforms[s]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?e.uniforms[s]={type:"c",value:r.getHex()}:r&&r.isVector2?e.uniforms[s]={type:"v2",value:r.toArray()}:r&&r.isVector3?e.uniforms[s]={type:"v3",value:r.toArray()}:r&&r.isVector4?e.uniforms[s]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?e.uniforms[s]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?e.uniforms[s]={type:"m4",value:r.toArray()}:e.uniforms[s]={value:r}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class jf extends ze{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new be,this.projectionMatrix=new be,this.projectionMatrixInverse=new be,this.coordinateSystem=Bn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Mi=new H,Kh=new ne,Zh=new ne;class on extends jf{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Uo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(To*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Uo*2*Math.atan(Math.tan(To*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Mi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Mi.x,Mi.y).multiplyScalar(-t/Mi.z),Mi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Mi.x,Mi.y).multiplyScalar(-t/Mi.z)}getViewSize(t,e){return this.getViewBounds(t,Kh,Zh),e.subVectors(Zh,Kh)}setViewOffset(t,e,n,s,o,r){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=o,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(To*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,o=-.5*s;const r=this.view;if(this.view!==null&&this.view.enabled){const l=r.fullWidth,c=r.fullHeight;o+=r.offsetX*s/l,e-=r.offsetY*n/c,s*=r.width/l,n*=r.height/c}const a=this.filmOffset;a!==0&&(o+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(o,o+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Ss=-90,ws=1;class Vg extends ze{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new on(Ss,ws,t,e);s.layers=this.layers,this.add(s);const o=new on(Ss,ws,t,e);o.layers=this.layers,this.add(o);const r=new on(Ss,ws,t,e);r.layers=this.layers,this.add(r);const a=new on(Ss,ws,t,e);a.layers=this.layers,this.add(a);const l=new on(Ss,ws,t,e);l.layers=this.layers,this.add(l);const c=new on(Ss,ws,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,o,r,a,l]=e;for(const c of e)this.remove(c);if(t===Bn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),o.up.set(0,0,-1),o.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Jr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),o.up.set(0,0,1),o.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[o,r,a,l,c,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,o),t.setRenderTarget(n,1,s),t.render(e,r),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(d,u,f),t.xr.enabled=m,n.texture.needsPMREMUpdate=!0}}class Kf extends Qe{constructor(t=[],e=rs,n,s,o,r,a,l,c,h){super(t,e,n,s,o,r,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Zf extends kn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Kf(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new $o(5,5,5),o=new qn({name:"CubemapFromEquirect",uniforms:Gs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:an,blending:ui});o.uniforms.tEquirect.value=e;const r=new Je(s,o),a=e.minFilter;return e.minFilter===ns&&(e.minFilter=We),new Vg(1,10,this).update(t,r),e.minFilter=a,r.geometry.dispose(),r.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){const o=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(e,n,s);t.setRenderTarget(o)}}class yo extends ze{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Hg={type:"move"};class Ka{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new yo,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new yo,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new H,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new H),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new yo,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new H,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new H),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,o=null,r=null;const a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){r=!0;for(const x of t.hand.values()){const p=e.getJointPose(x,n),g=this._getHandJoint(c,x);p!==null&&(g.matrix.fromArray(p.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=p.radius),g.visible=p!==null}const h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,m=.005;c.inputState.pinching&&u>f+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=f-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(o=e.getPose(t.gripSpace,n),o!==null&&(l.matrix.fromArray(o.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,o.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(o.linearVelocity)):l.hasLinearVelocity=!1,o.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(o.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&o!==null&&(s=o),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Hg)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=o!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new yo;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}class Za extends ze{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Wn,this.environmentIntensity=1,this.environmentRotation=new Wn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class Gg extends Qe{constructor(t=null,e=1,n=1,s,o,r,a,l,c=Be,h=Be,d,u){super(null,r,a,l,c,h,s,o,d,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Ja=new H,Wg=new H,qg=new Ht;let Ki=class{constructor(t=new H(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=Ja.subVectors(n,e).cross(Wg.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Ja),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const o=-(t.start.dot(this.normal)+this.constant)/s;return o<0||o>1?null:e.copy(t.start).addScaledVector(n,o)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||qg.getNormalMatrix(t),s=this.coplanarPoint(Ja).applyMatrix4(t),o=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(o),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}};const Hi=new pa,Xg=new ne(.5,.5),gr=new H;class qc{constructor(t=new Ki,e=new Ki,n=new Ki,s=new Ki,o=new Ki,r=new Ki){this.planes=[t,e,n,s,o,r]}set(t,e,n,s,o,r){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(o),a[5].copy(r),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Bn,n=!1){const s=this.planes,o=t.elements,r=o[0],a=o[1],l=o[2],c=o[3],h=o[4],d=o[5],u=o[6],f=o[7],m=o[8],x=o[9],p=o[10],g=o[11],_=o[12],v=o[13],y=o[14],b=o[15];if(s[0].setComponents(c-r,f-h,g-m,b-_).normalize(),s[1].setComponents(c+r,f+h,g+m,b+_).normalize(),s[2].setComponents(c+a,f+d,g+x,b+v).normalize(),s[3].setComponents(c-a,f-d,g-x,b-v).normalize(),n)s[4].setComponents(l,u,p,y).normalize(),s[5].setComponents(c-l,f-u,g-p,b-y).normalize();else if(s[4].setComponents(c-l,f-u,g-p,b-y).normalize(),e===Bn)s[5].setComponents(c+l,f+u,g+p,b+y).normalize();else if(e===Jr)s[5].setComponents(l,u,p,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Hi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Hi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Hi)}intersectsSprite(t){Hi.center.set(0,0,0);const e=Xg.distanceTo(t.center);return Hi.radius=.7071067811865476+e,Hi.applyMatrix4(t.matrixWorld),this.intersectsSphere(Hi)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let o=0;o<6;o++)if(e[o].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(gr.x=s.normal.x>0?t.max.x:t.min.x,gr.y=s.normal.y>0?t.max.y:t.min.y,gr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(gr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Xc extends Qs{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new qt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const ta=new H,ea=new H,Jh=new be,ro=new Hf,xr=new pa,Qa=new H,Qh=new H;class Jf extends ze{constructor(t=new ln,e=new Xc){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,o=e.count;s<o;s++)ta.fromBufferAttribute(e,s-1),ea.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=ta.distanceTo(ea);t.setAttribute("lineDistance",new Ie(n,1))}else Bt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,o=t.params.Line.threshold,r=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),xr.copy(n.boundingSphere),xr.applyMatrix4(s),xr.radius+=o,t.ray.intersectsSphere(xr)===!1)return;Jh.copy(s).invert(),ro.copy(t.ray).applyMatrix4(Jh);const a=o/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,h=n.index,u=n.attributes.position;if(h!==null){const f=Math.max(0,r.start),m=Math.min(h.count,r.start+r.count);for(let x=f,p=m-1;x<p;x+=c){const g=h.getX(x),_=h.getX(x+1),v=_r(this,t,ro,l,g,_,x);v&&e.push(v)}if(this.isLineLoop){const x=h.getX(m-1),p=h.getX(f),g=_r(this,t,ro,l,x,p,m-1);g&&e.push(g)}}else{const f=Math.max(0,r.start),m=Math.min(u.count,r.start+r.count);for(let x=f,p=m-1;x<p;x+=c){const g=_r(this,t,ro,l,x,x+1,x);g&&e.push(g)}if(this.isLineLoop){const x=_r(this,t,ro,l,m-1,f,m-1);x&&e.push(x)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let o=0,r=s.length;o<r;o++){const a=s[o].name||String(o);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=o}}}}}function _r(i,t,e,n,s,o,r){const a=i.geometry.attributes.position;if(ta.fromBufferAttribute(a,s),ea.fromBufferAttribute(a,o),e.distanceSqToSegment(ta,ea,Qa,Qh)>n)return;Qa.applyMatrix4(i.matrixWorld);const c=t.ray.origin.distanceTo(Qa);if(!(c<t.near||c>t.far))return{distance:c,point:Qh.clone().applyMatrix4(i.matrixWorld),index:r,face:null,faceIndex:null,barycoord:null,object:i}}const td=new H,ed=new H;class $g extends Jf{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let s=0,o=e.count;s<o;s+=2)td.fromBufferAttribute(e,s),ed.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+td.distanceTo(ed);t.setAttribute("lineDistance",new Ie(n,1))}else Bt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Bo extends Qe{constructor(t,e,n=Gn,s,o,r,a=Be,l=Be,c,h=mi,d=1){if(h!==mi&&h!==is)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:t,height:e,depth:d};super(u,s,o,r,a,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Wc(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class Yg extends Bo{constructor(t,e=Gn,n=rs,s,o,r=Be,a=Be,l,c=mi){const h={width:t,height:t,depth:1},d=[h,h,h,h,h,h];super(t,t,e,n,s,o,r,a,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Qf extends Qe{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class $c extends ln{constructor(t=1,e=1,n=1,s=32,o=1,r=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:o,openEnded:r,thetaStart:a,thetaLength:l};const c=this;s=Math.floor(s),o=Math.floor(o);const h=[],d=[],u=[],f=[];let m=0;const x=[],p=n/2;let g=0;_(),r===!1&&(t>0&&v(!0),e>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new Ie(d,3)),this.setAttribute("normal",new Ie(u,3)),this.setAttribute("uv",new Ie(f,2));function _(){const y=new H,b=new H;let w=0;const T=(e-t)/n;for(let P=0;P<=o;P++){const M=[],E=P/o,R=E*(e-t)+t;for(let N=0;N<=s;N++){const D=N/s,O=D*l+a,F=Math.sin(O),I=Math.cos(O);b.x=R*F,b.y=-E*n+p,b.z=R*I,d.push(b.x,b.y,b.z),y.set(F,T,I).normalize(),u.push(y.x,y.y,y.z),f.push(D,1-E),M.push(m++)}x.push(M)}for(let P=0;P<s;P++)for(let M=0;M<o;M++){const E=x[M][P],R=x[M+1][P],N=x[M+1][P+1],D=x[M][P+1];(t>0||M!==0)&&(h.push(E,R,D),w+=3),(e>0||M!==o-1)&&(h.push(R,N,D),w+=3)}c.addGroup(g,w,0),g+=w}function v(y){const b=m,w=new ne,T=new H;let P=0;const M=y===!0?t:e,E=y===!0?1:-1;for(let N=1;N<=s;N++)d.push(0,p*E,0),u.push(0,E,0),f.push(.5,.5),m++;const R=m;for(let N=0;N<=s;N++){const O=N/s*l+a,F=Math.cos(O),I=Math.sin(O);T.x=M*I,T.y=p*E,T.z=M*F,d.push(T.x,T.y,T.z),u.push(0,E,0),w.x=F*.5+.5,w.y=I*.5*E+.5,f.push(w.x,w.y),m++}for(let N=0;N<s;N++){const D=b+N,O=R+N;y===!0?h.push(O,O+1,D):h.push(O+1,O,D),P+=3}c.addGroup(g,P,y===!0?1:2),g+=P}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new $c(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Ws extends ln{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const o=t/2,r=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,h=l+1,d=t/a,u=e/l,f=[],m=[],x=[],p=[];for(let g=0;g<h;g++){const _=g*u-r;for(let v=0;v<c;v++){const y=v*d-o;m.push(y,-_,0),x.push(0,0,1),p.push(v/a),p.push(1-g/l)}}for(let g=0;g<l;g++)for(let _=0;_<a;_++){const v=_+c*g,y=_+c*(g+1),b=_+1+c*(g+1),w=_+1+c*g;f.push(v,y,w),f.push(y,b,w)}this.setIndex(f),this.setAttribute("position",new Ie(m,3)),this.setAttribute("normal",new Ie(x,3)),this.setAttribute("uv",new Ie(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ws(t.width,t.height,t.widthSegments,t.heightSegments)}}class Co extends ln{constructor(t=1,e=32,n=16,s=0,o=Math.PI*2,r=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:o,thetaStart:r,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(r+a,Math.PI);let c=0;const h=[],d=new H,u=new H,f=[],m=[],x=[],p=[];for(let g=0;g<=n;g++){const _=[],v=g/n;let y=0;g===0&&r===0?y=.5/e:g===n&&l===Math.PI&&(y=-.5/e);for(let b=0;b<=e;b++){const w=b/e;d.x=-t*Math.cos(s+w*o)*Math.sin(r+v*a),d.y=t*Math.cos(r+v*a),d.z=t*Math.sin(s+w*o)*Math.sin(r+v*a),m.push(d.x,d.y,d.z),u.copy(d).normalize(),x.push(u.x,u.y,u.z),p.push(w+y,1-v),_.push(c++)}h.push(_)}for(let g=0;g<n;g++)for(let _=0;_<e;_++){const v=h[g][_+1],y=h[g][_],b=h[g+1][_],w=h[g+1][_+1];(g!==0||r>0)&&f.push(v,y,w),(g!==n-1||l<Math.PI)&&f.push(y,b,w)}this.setIndex(f),this.setAttribute("position",new Ie(m,3)),this.setAttribute("normal",new Ie(x,3)),this.setAttribute("uv",new Ie(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Co(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class jg extends qn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Es extends Qs{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new qt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new qt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=zf,this.normalScale=new ne(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Kg extends Qs{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ym,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Zg extends Qs{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class Jg extends Xc{constructor(t){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(t)}copy(t){return super.copy(t),this.scale=t.scale,this.dashSize=t.dashSize,this.gapSize=t.gapSize,this}}class tp extends ze{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new qt(t),this.intensity=e}dispose(){this.dispatchEvent({type:"dispose"})}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}}const tl=new be,nd=new H,id=new H;class Qg{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ne(512,512),this.mapType=pn,this.map=null,this.mapPass=null,this.matrix=new be,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new qc,this._frameExtents=new ne(1,1),this._viewportCount=1,this._viewports=[new we(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;nd.setFromMatrixPosition(t.matrixWorld),e.position.copy(nd),id.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(id),e.updateMatrixWorld(),tl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(tl,e.coordinateSystem,e.reversedDepth),e.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(tl)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class Yc extends jf{constructor(t=-1,e=1,n=1,s=-1,o=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=o,this.far=r,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,o,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=o,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let o=n-t,r=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;o+=c*this.view.offsetX,r=o+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(o,r,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class t0 extends Qg{constructor(){super(new Yc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class el extends tp{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ze.DEFAULT_UP),this.updateMatrix(),this.target=new ze,this.shadow=new t0}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}}class nl extends tp{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}class e0 extends on{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}class sd extends $g{constructor(t=10,e=10,n=4473924,s=8947848){n=new qt(n),s=new qt(s);const o=e/2,r=t/e,a=t/2,l=[],c=[];for(let u=0,f=0,m=-a;u<=e;u++,m+=r){l.push(-a,0,m,a,0,m),l.push(m,0,-a,m,0,a);const x=u===o?n:s;x.toArray(c,f),f+=3,x.toArray(c,f),f+=3,x.toArray(c,f),f+=3,x.toArray(c,f),f+=3}const h=new ln;h.setAttribute("position",new Ie(l,3)),h.setAttribute("color",new Ie(c,3));const d=new Xc({vertexColors:!0,toneMapped:!1});super(h,d),this.type="GridHelper"}dispose(){this.geometry.dispose(),this.material.dispose()}}function od(i,t,e,n){const s=n0(n);switch(e){case Of:return i*t;case Bf:return i*t/s.components*s.byteLength;case Bc:return i*t/s.components*s.byteLength;case Vs:return i*t*2/s.components*s.byteLength;case zc:return i*t*2/s.components*s.byteLength;case Uf:return i*t*3/s.components*s.byteLength;case Tn:return i*t*4/s.components*s.byteLength;case kc:return i*t*4/s.components*s.byteLength;case Wr:case qr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Xr:case $r:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Wl:case Xl:return Math.max(i,16)*Math.max(t,8)/4;case Gl:case ql:return Math.max(i,8)*Math.max(t,8)/2;case $l:case Yl:case Kl:case Zl:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case jl:case Jl:case Ql:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case tc:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ec:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case nc:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ic:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case sc:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case oc:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case rc:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case ac:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case lc:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case cc:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case hc:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case dc:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case uc:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case fc:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case pc:case mc:case gc:return Math.ceil(i/4)*Math.ceil(t/4)*16;case xc:case _c:return Math.ceil(i/4)*Math.ceil(t/4)*8;case vc:case yc:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function n0(i){switch(i){case pn:case Df:return{byteLength:1,components:1};case Fo:case If:case pi:return{byteLength:2,components:1};case Oc:case Uc:return{byteLength:2,components:4};case Gn:case Nc:case Un:return{byteLength:4,components:1};case Ff:case Nf:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Fc}}));typeof window<"u"&&(window.__THREE__?Bt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Fc);function ep(){let i=null,t=!1,e=null,n=null;function s(o,r){e(o,r),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(o){e=o},setContext:function(o){i=o}}}function i0(i){const t=new WeakMap;function e(a,l){const c=a.array,h=a.usage,d=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),a.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=i.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function n(a,l,c){const h=l.array,d=l.updateRanges;if(i.bindBuffer(c,a),d.length===0)i.bufferSubData(c,0,h);else{d.sort((f,m)=>f.start-m.start);let u=0;for(let f=1;f<d.length;f++){const m=d[u],x=d[f];x.start<=m.start+m.count+1?m.count=Math.max(m.count,x.start+x.count-m.start):(++u,d[u]=x)}d.length=u+1;for(let f=0,m=d.length;f<m;f++){const x=d[f];i.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function o(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function r(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:o,update:r}}var s0=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,o0=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,r0=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,a0=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,l0=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,c0=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,h0=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,d0=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,u0=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,f0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,p0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,m0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,g0=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,x0=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,_0=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,v0=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,y0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,b0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,M0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,S0=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,w0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,E0=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,T0=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,A0=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,C0=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,R0=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,P0=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,L0=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,D0=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,I0=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,F0="gl_FragColor = linearToOutputTexel( gl_FragColor );",N0=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,O0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,U0=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,B0=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,z0=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,k0=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,V0=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,H0=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,G0=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,W0=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,q0=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,X0=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,$0=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Y0=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,j0=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,K0=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Z0=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,J0=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Q0=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,tx=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ex=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,nx=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return v;
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( vec3( 1.0 ) - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,ix=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,sx=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,ox=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,rx=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ax=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,lx=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,cx=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,hx=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,dx=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,ux=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,fx=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,px=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,mx=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,gx=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,xx=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,_x=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,vx=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,yx=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,bx=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Mx=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Sx=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,wx=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ex=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Tx=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Ax=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Cx=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Rx=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Px=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Lx=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Dx=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Ix=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Fx=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Nx=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Ox=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ux=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Bx=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,zx=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * 6.28318530718;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * 6.28318530718;
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * vogelDiskSample( 0, 5, phi ).x + bitangent * vogelDiskSample( 0, 5, phi ).y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * vogelDiskSample( 1, 5, phi ).x + bitangent * vogelDiskSample( 1, 5, phi ).y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * vogelDiskSample( 2, 5, phi ).x + bitangent * vogelDiskSample( 2, 5, phi ).y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * vogelDiskSample( 3, 5, phi ).x + bitangent * vogelDiskSample( 3, 5, phi ).y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * vogelDiskSample( 4, 5, phi ).x + bitangent * vogelDiskSample( 4, 5, phi ).y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadow = step( depth, dp );
			#else
				shadow = step( dp, depth );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,kx=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Vx=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Hx=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Gx=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Wx=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,qx=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Xx=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,$x=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Yx=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,jx=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Kx=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Zx=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Jx=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Qx=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,t_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,e_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,n_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const i_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,s_=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,o_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,r_=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,a_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,l_=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,c_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,h_=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,d_=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,u_=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,f_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,p_=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,m_=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,g_=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,x_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,__=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,v_=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,y_=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,b_=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,M_=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,S_=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,w_=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,E_=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,T_=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,A_=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,C_=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,R_=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,P_=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,L_=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,D_=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,I_=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,F_=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,N_=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,O_=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Gt={alphahash_fragment:s0,alphahash_pars_fragment:o0,alphamap_fragment:r0,alphamap_pars_fragment:a0,alphatest_fragment:l0,alphatest_pars_fragment:c0,aomap_fragment:h0,aomap_pars_fragment:d0,batching_pars_vertex:u0,batching_vertex:f0,begin_vertex:p0,beginnormal_vertex:m0,bsdfs:g0,iridescence_fragment:x0,bumpmap_pars_fragment:_0,clipping_planes_fragment:v0,clipping_planes_pars_fragment:y0,clipping_planes_pars_vertex:b0,clipping_planes_vertex:M0,color_fragment:S0,color_pars_fragment:w0,color_pars_vertex:E0,color_vertex:T0,common:A0,cube_uv_reflection_fragment:C0,defaultnormal_vertex:R0,displacementmap_pars_vertex:P0,displacementmap_vertex:L0,emissivemap_fragment:D0,emissivemap_pars_fragment:I0,colorspace_fragment:F0,colorspace_pars_fragment:N0,envmap_fragment:O0,envmap_common_pars_fragment:U0,envmap_pars_fragment:B0,envmap_pars_vertex:z0,envmap_physical_pars_fragment:K0,envmap_vertex:k0,fog_vertex:V0,fog_pars_vertex:H0,fog_fragment:G0,fog_pars_fragment:W0,gradientmap_pars_fragment:q0,lightmap_pars_fragment:X0,lights_lambert_fragment:$0,lights_lambert_pars_fragment:Y0,lights_pars_begin:j0,lights_toon_fragment:Z0,lights_toon_pars_fragment:J0,lights_phong_fragment:Q0,lights_phong_pars_fragment:tx,lights_physical_fragment:ex,lights_physical_pars_fragment:nx,lights_fragment_begin:ix,lights_fragment_maps:sx,lights_fragment_end:ox,logdepthbuf_fragment:rx,logdepthbuf_pars_fragment:ax,logdepthbuf_pars_vertex:lx,logdepthbuf_vertex:cx,map_fragment:hx,map_pars_fragment:dx,map_particle_fragment:ux,map_particle_pars_fragment:fx,metalnessmap_fragment:px,metalnessmap_pars_fragment:mx,morphinstance_vertex:gx,morphcolor_vertex:xx,morphnormal_vertex:_x,morphtarget_pars_vertex:vx,morphtarget_vertex:yx,normal_fragment_begin:bx,normal_fragment_maps:Mx,normal_pars_fragment:Sx,normal_pars_vertex:wx,normal_vertex:Ex,normalmap_pars_fragment:Tx,clearcoat_normal_fragment_begin:Ax,clearcoat_normal_fragment_maps:Cx,clearcoat_pars_fragment:Rx,iridescence_pars_fragment:Px,opaque_fragment:Lx,packing:Dx,premultiplied_alpha_fragment:Ix,project_vertex:Fx,dithering_fragment:Nx,dithering_pars_fragment:Ox,roughnessmap_fragment:Ux,roughnessmap_pars_fragment:Bx,shadowmap_pars_fragment:zx,shadowmap_pars_vertex:kx,shadowmap_vertex:Vx,shadowmask_pars_fragment:Hx,skinbase_vertex:Gx,skinning_pars_vertex:Wx,skinning_vertex:qx,skinnormal_vertex:Xx,specularmap_fragment:$x,specularmap_pars_fragment:Yx,tonemapping_fragment:jx,tonemapping_pars_fragment:Kx,transmission_fragment:Zx,transmission_pars_fragment:Jx,uv_pars_fragment:Qx,uv_pars_vertex:t_,uv_vertex:e_,worldpos_vertex:n_,background_vert:i_,background_frag:s_,backgroundCube_vert:o_,backgroundCube_frag:r_,cube_vert:a_,cube_frag:l_,depth_vert:c_,depth_frag:h_,distance_vert:d_,distance_frag:u_,equirect_vert:f_,equirect_frag:p_,linedashed_vert:m_,linedashed_frag:g_,meshbasic_vert:x_,meshbasic_frag:__,meshlambert_vert:v_,meshlambert_frag:y_,meshmatcap_vert:b_,meshmatcap_frag:M_,meshnormal_vert:S_,meshnormal_frag:w_,meshphong_vert:E_,meshphong_frag:T_,meshphysical_vert:A_,meshphysical_frag:C_,meshtoon_vert:R_,meshtoon_frag:P_,points_vert:L_,points_frag:D_,shadow_vert:I_,shadow_frag:F_,sprite_vert:N_,sprite_frag:O_},ft={common:{diffuse:{value:new qt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ht},alphaMap:{value:null},alphaMapTransform:{value:new Ht},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ht}},envmap:{envMap:{value:null},envMapRotation:{value:new Ht},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ht}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ht}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ht},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ht},normalScale:{value:new ne(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ht},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ht}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ht}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ht}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new qt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new qt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ht},alphaTest:{value:0},uvTransform:{value:new Ht}},sprite:{diffuse:{value:new qt(16777215)},opacity:{value:1},center:{value:new ne(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ht},alphaMap:{value:null},alphaMapTransform:{value:new Ht},alphaTest:{value:0}}},On={basic:{uniforms:Ke([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.fog]),vertexShader:Gt.meshbasic_vert,fragmentShader:Gt.meshbasic_frag},lambert:{uniforms:Ke([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,ft.lights,{emissive:{value:new qt(0)}}]),vertexShader:Gt.meshlambert_vert,fragmentShader:Gt.meshlambert_frag},phong:{uniforms:Ke([ft.common,ft.specularmap,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,ft.lights,{emissive:{value:new qt(0)},specular:{value:new qt(1118481)},shininess:{value:30}}]),vertexShader:Gt.meshphong_vert,fragmentShader:Gt.meshphong_frag},standard:{uniforms:Ke([ft.common,ft.envmap,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.roughnessmap,ft.metalnessmap,ft.fog,ft.lights,{emissive:{value:new qt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Gt.meshphysical_vert,fragmentShader:Gt.meshphysical_frag},toon:{uniforms:Ke([ft.common,ft.aomap,ft.lightmap,ft.emissivemap,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.gradientmap,ft.fog,ft.lights,{emissive:{value:new qt(0)}}]),vertexShader:Gt.meshtoon_vert,fragmentShader:Gt.meshtoon_frag},matcap:{uniforms:Ke([ft.common,ft.bumpmap,ft.normalmap,ft.displacementmap,ft.fog,{matcap:{value:null}}]),vertexShader:Gt.meshmatcap_vert,fragmentShader:Gt.meshmatcap_frag},points:{uniforms:Ke([ft.points,ft.fog]),vertexShader:Gt.points_vert,fragmentShader:Gt.points_frag},dashed:{uniforms:Ke([ft.common,ft.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Gt.linedashed_vert,fragmentShader:Gt.linedashed_frag},depth:{uniforms:Ke([ft.common,ft.displacementmap]),vertexShader:Gt.depth_vert,fragmentShader:Gt.depth_frag},normal:{uniforms:Ke([ft.common,ft.bumpmap,ft.normalmap,ft.displacementmap,{opacity:{value:1}}]),vertexShader:Gt.meshnormal_vert,fragmentShader:Gt.meshnormal_frag},sprite:{uniforms:Ke([ft.sprite,ft.fog]),vertexShader:Gt.sprite_vert,fragmentShader:Gt.sprite_frag},background:{uniforms:{uvTransform:{value:new Ht},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Gt.background_vert,fragmentShader:Gt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ht}},vertexShader:Gt.backgroundCube_vert,fragmentShader:Gt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Gt.cube_vert,fragmentShader:Gt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Gt.equirect_vert,fragmentShader:Gt.equirect_frag},distance:{uniforms:Ke([ft.common,ft.displacementmap,{referencePosition:{value:new H},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Gt.distance_vert,fragmentShader:Gt.distance_frag},shadow:{uniforms:Ke([ft.lights,ft.fog,{color:{value:new qt(0)},opacity:{value:1}}]),vertexShader:Gt.shadow_vert,fragmentShader:Gt.shadow_frag}};On.physical={uniforms:Ke([On.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ht},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ht},clearcoatNormalScale:{value:new ne(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ht},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ht},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ht},sheen:{value:0},sheenColor:{value:new qt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ht},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ht},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ht},transmissionSamplerSize:{value:new ne},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ht},attenuationDistance:{value:0},attenuationColor:{value:new qt(0)},specularColor:{value:new qt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ht},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ht},anisotropyVector:{value:new ne},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ht}}]),vertexShader:Gt.meshphysical_vert,fragmentShader:Gt.meshphysical_frag};const vr={r:0,b:0,g:0},Gi=new Wn,U_=new be;function B_(i,t,e,n,s,o,r){const a=new qt(0);let l=o===!0?0:1,c,h,d=null,u=0,f=null;function m(v){let y=v.isScene===!0?v.background:null;return y&&y.isTexture&&(y=(v.backgroundBlurriness>0?e:t).get(y)),y}function x(v){let y=!1;const b=m(v);b===null?g(a,l):b&&b.isColor&&(g(b,1),y=!0);const w=i.xr.getEnvironmentBlendMode();w==="additive"?n.buffers.color.setClear(0,0,0,1,r):w==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,r),(i.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(v,y){const b=m(y);b&&(b.isCubeTexture||b.mapping===fa)?(h===void 0&&(h=new Je(new $o(1,1,1),new qn({name:"BackgroundCubeMaterial",uniforms:Gs(On.backgroundCube.uniforms),vertexShader:On.backgroundCube.vertexShader,fragmentShader:On.backgroundCube.fragmentShader,side:an,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(w,T,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Gi.copy(y.backgroundRotation),Gi.x*=-1,Gi.y*=-1,Gi.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(Gi.y*=-1,Gi.z*=-1),h.material.uniforms.envMap.value=b,h.material.uniforms.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(U_.makeRotationFromEuler(Gi)),h.material.toneMapped=Zt.getTransfer(b.colorSpace)!==le,(d!==b||u!==b.version||f!==i.toneMapping)&&(h.material.needsUpdate=!0,d=b,u=b.version,f=i.toneMapping),h.layers.enableAll(),v.unshift(h,h.geometry,h.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new Je(new Ws(2,2),new qn({name:"BackgroundMaterial",uniforms:Gs(On.background.uniforms),vertexShader:On.background.vertexShader,fragmentShader:On.background.fragmentShader,side:Di,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=Zt.getTransfer(b.colorSpace)!==le,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(d!==b||u!==b.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,d=b,u=b.version,f=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null))}function g(v,y){v.getRGB(vr,Yf(i)),n.buffers.color.setClear(vr.r,vr.g,vr.b,y,r)}function _(){h!==void 0&&(h.geometry.dispose(),h.material.dispose(),h=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,y=1){a.set(v),l=y,g(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(v){l=v,g(a,l)},render:x,addToRenderList:p,dispose:_}}function z_(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null);let o=s,r=!1;function a(E,R,N,D,O){let F=!1;const I=d(D,N,R);o!==I&&(o=I,c(o.object)),F=f(E,D,N,O),F&&m(E,D,N,O),O!==null&&t.update(O,i.ELEMENT_ARRAY_BUFFER),(F||r)&&(r=!1,y(E,R,N,D),O!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(O).buffer))}function l(){return i.createVertexArray()}function c(E){return i.bindVertexArray(E)}function h(E){return i.deleteVertexArray(E)}function d(E,R,N){const D=N.wireframe===!0;let O=n[E.id];O===void 0&&(O={},n[E.id]=O);let F=O[R.id];F===void 0&&(F={},O[R.id]=F);let I=F[D];return I===void 0&&(I=u(l()),F[D]=I),I}function u(E){const R=[],N=[],D=[];for(let O=0;O<e;O++)R[O]=0,N[O]=0,D[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:R,enabledAttributes:N,attributeDivisors:D,object:E,attributes:{},index:null}}function f(E,R,N,D){const O=o.attributes,F=R.attributes;let I=0;const z=N.getAttributes();for(const W in z)if(z[W].location>=0){const tt=O[W];let nt=F[W];if(nt===void 0&&(W==="instanceMatrix"&&E.instanceMatrix&&(nt=E.instanceMatrix),W==="instanceColor"&&E.instanceColor&&(nt=E.instanceColor)),tt===void 0||tt.attribute!==nt||nt&&tt.data!==nt.data)return!0;I++}return o.attributesNum!==I||o.index!==D}function m(E,R,N,D){const O={},F=R.attributes;let I=0;const z=N.getAttributes();for(const W in z)if(z[W].location>=0){let tt=F[W];tt===void 0&&(W==="instanceMatrix"&&E.instanceMatrix&&(tt=E.instanceMatrix),W==="instanceColor"&&E.instanceColor&&(tt=E.instanceColor));const nt={};nt.attribute=tt,tt&&tt.data&&(nt.data=tt.data),O[W]=nt,I++}o.attributes=O,o.attributesNum=I,o.index=D}function x(){const E=o.newAttributes;for(let R=0,N=E.length;R<N;R++)E[R]=0}function p(E){g(E,0)}function g(E,R){const N=o.newAttributes,D=o.enabledAttributes,O=o.attributeDivisors;N[E]=1,D[E]===0&&(i.enableVertexAttribArray(E),D[E]=1),O[E]!==R&&(i.vertexAttribDivisor(E,R),O[E]=R)}function _(){const E=o.newAttributes,R=o.enabledAttributes;for(let N=0,D=R.length;N<D;N++)R[N]!==E[N]&&(i.disableVertexAttribArray(N),R[N]=0)}function v(E,R,N,D,O,F,I){I===!0?i.vertexAttribIPointer(E,R,N,O,F):i.vertexAttribPointer(E,R,N,D,O,F)}function y(E,R,N,D){x();const O=D.attributes,F=N.getAttributes(),I=R.defaultAttributeValues;for(const z in F){const W=F[z];if(W.location>=0){let j=O[z];if(j===void 0&&(z==="instanceMatrix"&&E.instanceMatrix&&(j=E.instanceMatrix),z==="instanceColor"&&E.instanceColor&&(j=E.instanceColor)),j!==void 0){const tt=j.normalized,nt=j.itemSize,et=t.get(j);if(et===void 0)continue;const St=et.buffer,Xt=et.type,ut=et.bytesPerElement,X=Xt===i.INT||Xt===i.UNSIGNED_INT||j.gpuType===Nc;if(j.isInterleavedBufferAttribute){const Z=j.data,rt=Z.stride,Lt=j.offset;if(Z.isInstancedInterleavedBuffer){for(let pt=0;pt<W.locationSize;pt++)g(W.location+pt,Z.meshPerAttribute);E.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let pt=0;pt<W.locationSize;pt++)p(W.location+pt);i.bindBuffer(i.ARRAY_BUFFER,St);for(let pt=0;pt<W.locationSize;pt++)v(W.location+pt,nt/W.locationSize,Xt,tt,rt*ut,(Lt+nt/W.locationSize*pt)*ut,X)}else{if(j.isInstancedBufferAttribute){for(let Z=0;Z<W.locationSize;Z++)g(W.location+Z,j.meshPerAttribute);E.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let Z=0;Z<W.locationSize;Z++)p(W.location+Z);i.bindBuffer(i.ARRAY_BUFFER,St);for(let Z=0;Z<W.locationSize;Z++)v(W.location+Z,nt/W.locationSize,Xt,tt,nt*ut,nt/W.locationSize*Z*ut,X)}}else if(I!==void 0){const tt=I[z];if(tt!==void 0)switch(tt.length){case 2:i.vertexAttrib2fv(W.location,tt);break;case 3:i.vertexAttrib3fv(W.location,tt);break;case 4:i.vertexAttrib4fv(W.location,tt);break;default:i.vertexAttrib1fv(W.location,tt)}}}}_()}function b(){P();for(const E in n){const R=n[E];for(const N in R){const D=R[N];for(const O in D)h(D[O].object),delete D[O];delete R[N]}delete n[E]}}function w(E){if(n[E.id]===void 0)return;const R=n[E.id];for(const N in R){const D=R[N];for(const O in D)h(D[O].object),delete D[O];delete R[N]}delete n[E.id]}function T(E){for(const R in n){const N=n[R];if(N[E.id]===void 0)continue;const D=N[E.id];for(const O in D)h(D[O].object),delete D[O];delete N[E.id]}}function P(){M(),r=!0,o!==s&&(o=s,c(o.object))}function M(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:P,resetDefaultState:M,dispose:b,releaseStatesOfGeometry:w,releaseStatesOfProgram:T,initAttributes:x,enableAttribute:p,disableUnusedAttributes:_}}function k_(i,t,e){let n;function s(c){n=c}function o(c,h){i.drawArrays(n,c,h),e.update(h,n,1)}function r(c,h,d){d!==0&&(i.drawArraysInstanced(n,c,h,d),e.update(h,n,d))}function a(c,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,d);let f=0;for(let m=0;m<d;m++)f+=h[m];e.update(f,n,1)}function l(c,h,d,u){if(d===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<c.length;m++)r(c[m],h[m],u[m]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,h,0,u,0,d);let m=0;for(let x=0;x<d;x++)m+=h[x]*u[x];e.update(m,n,1)}}this.setMode=s,this.render=o,this.renderInstances=r,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function V_(i,t,e,n){let s;function o(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function r(T){return!(T!==Tn&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(T){const P=T===pi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==pn&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==Un&&!P)}function l(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(Bt("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const d=e.logarithmicDepthBuffer===!0,u=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),g=i.getParameter(i.MAX_VERTEX_ATTRIBS),_=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),v=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),b=i.getParameter(i.MAX_SAMPLES),w=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:o,getMaxPrecision:l,textureFormatReadable:r,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:m,maxTextureSize:x,maxCubemapSize:p,maxAttributes:g,maxVertexUniforms:_,maxVaryings:v,maxFragmentUniforms:y,maxSamples:b,samples:w}}function H_(i){const t=this;let e=null,n=0,s=!1,o=!1;const r=new Ki,a=new Ht,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){const f=d.length!==0||u||n!==0||s;return s=u,n=d.length,f},this.beginShadows=function(){o=!0,h(null)},this.endShadows=function(){o=!1},this.setGlobalState=function(d,u){e=h(d,u,0)},this.setState=function(d,u,f){const m=d.clippingPlanes,x=d.clipIntersection,p=d.clipShadows,g=i.get(d);if(!s||m===null||m.length===0||o&&!p)o?h(null):c();else{const _=o?0:n,v=_*4;let y=g.clippingState||null;l.value=y,y=h(m,u,v,f);for(let b=0;b!==v;++b)y[b]=e[b];g.clippingState=y,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=_}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,u,f,m){const x=d!==null?d.length:0;let p=null;if(x!==0){if(p=l.value,m!==!0||p===null){const g=f+x*4,_=u.matrixWorldInverse;a.getNormalMatrix(_),(p===null||p.length<g)&&(p=new Float32Array(g));for(let v=0,y=f;v!==x;++v,y+=4)r.copy(d[v]).applyMatrix4(_,a),r.normal.toArray(p,y),p[y+3]=r.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,p}}function G_(i){let t=new WeakMap;function e(r,a){return a===zl?r.mapping=rs:a===kl&&(r.mapping=ks),r}function n(r){if(r&&r.isTexture){const a=r.mapping;if(a===zl||a===kl)if(t.has(r)){const l=t.get(r).texture;return e(l,r.mapping)}else{const l=r.image;if(l&&l.height>0){const c=new Zf(l.height);return c.fromEquirectangularTexture(i,r),t.set(r,c),r.addEventListener("dispose",s),e(c.texture,r.mapping)}else return null}}return r}function s(r){const a=r.target;a.removeEventListener("dispose",s);const l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function o(){t=new WeakMap}return{get:n,dispose:o}}const Ti=4,rd=[.125,.215,.35,.446,.526,.582],ts=20,W_=256,ao=new Yc,ad=new qt;let il=null,sl=0,ol=0,rl=!1;const q_=new H;class ld{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,o={}){const{size:r=256,position:a=q_}=o;il=this._renderer.getRenderTarget(),sl=this._renderer.getActiveCubeFace(),ol=this._renderer.getActiveMipmapLevel(),rl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(r);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,s,l,a),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=dd(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=hd(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(il,sl,ol),this._renderer.xr.enabled=rl,t.scissorTest=!1,Ts(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===rs||t.mapping===ks?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),il=this._renderer.getRenderTarget(),sl=this._renderer.getActiveCubeFace(),ol=this._renderer.getActiveMipmapLevel(),rl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:We,minFilter:We,generateMipmaps:!1,type:pi,format:Tn,colorSpace:Hs,depthBuffer:!1},s=cd(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=cd(t,e,n);const{_lodMax:o}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=X_(o)),this._blurMaterial=Y_(o,t,e),this._ggxMaterial=$_(o,t,e)}return s}_compileMaterial(t){const e=new Je(new ln,t);this._renderer.compile(e,ao)}_sceneToCubeUV(t,e,n,s,o){const l=new on(90,1,e,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,f=d.toneMapping;d.getClearColor(ad),d.toneMapping=zn,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Je(new $o,new qf({name:"PMREM.Background",side:an,depthWrite:!1,depthTest:!1})));const x=this._backgroundBox,p=x.material;let g=!1;const _=t.background;_?_.isColor&&(p.color.copy(_),t.background=null,g=!0):(p.color.copy(ad),g=!0);for(let v=0;v<6;v++){const y=v%3;y===0?(l.up.set(0,c[v],0),l.position.set(o.x,o.y,o.z),l.lookAt(o.x+h[v],o.y,o.z)):y===1?(l.up.set(0,0,c[v]),l.position.set(o.x,o.y,o.z),l.lookAt(o.x,o.y+h[v],o.z)):(l.up.set(0,c[v],0),l.position.set(o.x,o.y,o.z),l.lookAt(o.x,o.y,o.z+h[v]));const b=this._cubeSize;Ts(s,y*b,v>2?b:0,b,b),d.setRenderTarget(s),g&&d.render(x,l),d.render(t,l)}d.toneMapping=f,d.autoClear=u,t.background=_}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===rs||t.mapping===ks;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=dd()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=hd());const o=s?this._cubemapMaterial:this._equirectMaterial,r=this._lodMeshes[0];r.material=o;const a=o.uniforms;a.envMap.value=t;const l=this._cubeSize;Ts(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(r,ao)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodMeshes.length;for(let o=1;o<s;o++)this._applyGGXFilter(t,o-1,o);e.autoClear=n}_applyGGXFilter(t,e,n){const s=this._renderer,o=this._pingPongRenderTarget,r=this._ggxMaterial,a=this._lodMeshes[n];a.material=r;const l=r.uniforms,c=n/(this._lodMeshes.length-1),h=e/(this._lodMeshes.length-1),d=Math.sqrt(c*c-h*h),u=0+c*1.25,f=d*u,{_lodMax:m}=this,x=this._sizeLods[n],p=3*x*(n>m-Ti?n-m+Ti:0),g=4*(this._cubeSize-x);l.envMap.value=t.texture,l.roughness.value=f,l.mipInt.value=m-e,Ts(o,p,g,3*x,2*x),s.setRenderTarget(o),s.render(a,ao),l.envMap.value=o.texture,l.roughness.value=0,l.mipInt.value=m-n,Ts(t,p,g,3*x,2*x),s.setRenderTarget(t),s.render(a,ao)}_blur(t,e,n,s,o){const r=this._pingPongRenderTarget;this._halfBlur(t,r,e,n,s,"latitudinal",o),this._halfBlur(r,t,n,n,s,"longitudinal",o)}_halfBlur(t,e,n,s,o,r,a){const l=this._renderer,c=this._blurMaterial;r!=="latitudinal"&&r!=="longitudinal"&&te("blur direction must be either latitudinal or longitudinal!");const h=3,d=this._lodMeshes[s];d.material=c;const u=c.uniforms,f=this._sizeLods[n]-1,m=isFinite(o)?Math.PI/(2*f):2*Math.PI/(2*ts-1),x=o/m,p=isFinite(o)?1+Math.floor(h*x):ts;p>ts&&Bt(`sigmaRadians, ${o}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${ts}`);const g=[];let _=0;for(let T=0;T<ts;++T){const P=T/x,M=Math.exp(-P*P/2);g.push(M),T===0?_+=M:T<p&&(_+=2*M)}for(let T=0;T<g.length;T++)g[T]=g[T]/_;u.envMap.value=t.texture,u.samples.value=p,u.weights.value=g,u.latitudinal.value=r==="latitudinal",a&&(u.poleAxis.value=a);const{_lodMax:v}=this;u.dTheta.value=m,u.mipInt.value=v-n;const y=this._sizeLods[s],b=3*y*(s>v-Ti?s-v+Ti:0),w=4*(this._cubeSize-y);Ts(e,b,w,3*y,2*y),l.setRenderTarget(e),l.render(d,ao)}}function X_(i){const t=[],e=[],n=[];let s=i;const o=i-Ti+1+rd.length;for(let r=0;r<o;r++){const a=Math.pow(2,s);t.push(a);let l=1/a;r>i-Ti?l=rd[r-i+Ti-1]:r===0&&(l=0),e.push(l);const c=1/(a-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],f=6,m=6,x=3,p=2,g=1,_=new Float32Array(x*m*f),v=new Float32Array(p*m*f),y=new Float32Array(g*m*f);for(let w=0;w<f;w++){const T=w%3*2/3-1,P=w>2?0:-1,M=[T,P,0,T+2/3,P,0,T+2/3,P+1,0,T,P,0,T+2/3,P+1,0,T,P+1,0];_.set(M,x*m*w),v.set(u,p*m*w);const E=[w,w,w,w,w,w];y.set(E,g*m*w)}const b=new ln;b.setAttribute("position",new Vn(_,x)),b.setAttribute("uv",new Vn(v,p)),b.setAttribute("faceIndex",new Vn(y,g)),n.push(new Je(b,null)),s>Ti&&s--}return{lodMeshes:n,sizeLods:t,sigmas:e}}function cd(i,t,e){const n=new kn(i,t,e);return n.texture.mapping=fa,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ts(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function $_(i,t,e){return new qn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:W_,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:ma(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 3.2: Transform view direction to hemisphere configuration
				vec3 Vh = normalize(vec3(alpha * V.x, alpha * V.y, V.z));

				// Section 4.1: Orthonormal basis
				float lensq = Vh.x * Vh.x + Vh.y * Vh.y;
				vec3 T1 = lensq > 0.0 ? vec3(-Vh.y, Vh.x, 0.0) / sqrt(lensq) : vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(Vh, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + Vh.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * Vh;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function Y_(i,t,e){const n=new Float32Array(ts),s=new H(0,1,0);return new qn({name:"SphericalGaussianBlur",defines:{n:ts,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:ma(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function hd(){return new qn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ma(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function dd(){return new qn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ma(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ui,depthTest:!1,depthWrite:!1})}function ma(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function j_(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===zl||l===kl,h=l===rs||l===ks;if(c||h){let d=t.get(a);const u=d!==void 0?d.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==u)return e===null&&(e=new ld(i)),d=c?e.fromEquirectangular(a,d):e.fromCubemap(a,d),d.texture.pmremVersion=a.pmremVersion,t.set(a,d),d.texture;if(d!==void 0)return d.texture;{const f=a.image;return c&&f&&f.height>0||h&&f&&s(f)?(e===null&&(e=new ld(i)),d=c?e.fromEquirectangular(a):e.fromCubemap(a),d.texture.pmremVersion=a.pmremVersion,t.set(a,d),a.addEventListener("dispose",o),d.texture):null}}}return a}function s(a){let l=0;const c=6;for(let h=0;h<c;h++)a[h]!==void 0&&l++;return l===c}function o(a){const l=a.target;l.removeEventListener("dispose",o);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function r(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:r}}function K_(i){const t={};function e(n){if(t[n]!==void 0)return t[n];const s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&Oo("WebGLRenderer: "+n+" extension not supported."),s}}}function Z_(i,t,e,n){const s={},o=new WeakMap;function r(d){const u=d.target;u.index!==null&&t.remove(u.index);for(const m in u.attributes)t.remove(u.attributes[m]);u.removeEventListener("dispose",r),delete s[u.id];const f=o.get(u);f&&(t.remove(f),o.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function a(d,u){return s[u.id]===!0||(u.addEventListener("dispose",r),s[u.id]=!0,e.memory.geometries++),u}function l(d){const u=d.attributes;for(const f in u)t.update(u[f],i.ARRAY_BUFFER)}function c(d){const u=[],f=d.index,m=d.attributes.position;let x=0;if(f!==null){const _=f.array;x=f.version;for(let v=0,y=_.length;v<y;v+=3){const b=_[v+0],w=_[v+1],T=_[v+2];u.push(b,w,w,T,T,b)}}else if(m!==void 0){const _=m.array;x=m.version;for(let v=0,y=_.length/3-1;v<y;v+=3){const b=v+0,w=v+1,T=v+2;u.push(b,w,w,T,T,b)}}else return;const p=new(kf(u)?$f:Xf)(u,1);p.version=x;const g=o.get(d);g&&t.remove(g),o.set(d,p)}function h(d){const u=o.get(d);if(u){const f=d.index;f!==null&&u.version<f.version&&c(d)}else c(d);return o.get(d)}return{get:a,update:l,getWireframeAttribute:h}}function J_(i,t,e){let n;function s(u){n=u}let o,r;function a(u){o=u.type,r=u.bytesPerElement}function l(u,f){i.drawElements(n,f,o,u*r),e.update(f,n,1)}function c(u,f,m){m!==0&&(i.drawElementsInstanced(n,f,o,u*r,m),e.update(f,n,m))}function h(u,f,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,o,u,0,m);let p=0;for(let g=0;g<m;g++)p+=f[g];e.update(p,n,1)}function d(u,f,m,x){if(m===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<u.length;g++)c(u[g]/r,f[g],x[g]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,o,u,0,x,0,m);let g=0;for(let _=0;_<m;_++)g+=f[_]*x[_];e.update(g,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function Q_(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(o,r,a){switch(e.calls++,r){case i.TRIANGLES:e.triangles+=a*(o/3);break;case i.LINES:e.lines+=a*(o/2);break;case i.LINE_STRIP:e.lines+=a*(o-1);break;case i.LINE_LOOP:e.lines+=a*o;break;case i.POINTS:e.points+=a*o;break;default:te("WebGLInfo: Unknown draw mode:",r);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function tv(i,t,e){const n=new WeakMap,s=new we;function o(r,a,l){const c=r.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0;let u=n.get(a);if(u===void 0||u.count!==d){let E=function(){P.dispose(),n.delete(a),a.removeEventListener("dispose",E)};var f=E;u!==void 0&&u.texture.dispose();const m=a.morphAttributes.position!==void 0,x=a.morphAttributes.normal!==void 0,p=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],_=a.morphAttributes.normal||[],v=a.morphAttributes.color||[];let y=0;m===!0&&(y=1),x===!0&&(y=2),p===!0&&(y=3);let b=a.attributes.position.count*y,w=1;b>t.maxTextureSize&&(w=Math.ceil(b/t.maxTextureSize),b=t.maxTextureSize);const T=new Float32Array(b*w*4*d),P=new Vf(T,b,w,d);P.type=Un,P.needsUpdate=!0;const M=y*4;for(let R=0;R<d;R++){const N=g[R],D=_[R],O=v[R],F=b*w*4*R;for(let I=0;I<N.count;I++){const z=I*M;m===!0&&(s.fromBufferAttribute(N,I),T[F+z+0]=s.x,T[F+z+1]=s.y,T[F+z+2]=s.z,T[F+z+3]=0),x===!0&&(s.fromBufferAttribute(D,I),T[F+z+4]=s.x,T[F+z+5]=s.y,T[F+z+6]=s.z,T[F+z+7]=0),p===!0&&(s.fromBufferAttribute(O,I),T[F+z+8]=s.x,T[F+z+9]=s.y,T[F+z+10]=s.z,T[F+z+11]=O.itemSize===4?s.w:1)}}u={count:d,texture:P,size:new ne(b,w)},n.set(a,u),a.addEventListener("dispose",E)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",r.morphTexture,e);else{let m=0;for(let p=0;p<c.length;p++)m+=c[p];const x=a.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",x),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:o}}function ev(i,t,e,n){let s=new WeakMap;function o(l){const c=n.render.frame,h=l.geometry,d=t.get(l,h);if(s.get(d)!==c&&(t.update(d),s.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const u=l.skeleton;s.get(u)!==c&&(u.update(),s.set(u,c))}return d}function r(){s=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:o,dispose:r}}const nv={[wf]:"LINEAR_TONE_MAPPING",[Ef]:"REINHARD_TONE_MAPPING",[Tf]:"CINEON_TONE_MAPPING",[Af]:"ACES_FILMIC_TONE_MAPPING",[Rf]:"AGX_TONE_MAPPING",[Pf]:"NEUTRAL_TONE_MAPPING",[Cf]:"CUSTOM_TONE_MAPPING"};function iv(i,t,e,n,s){const o=new kn(t,e,{type:i,depthBuffer:n,stencilBuffer:s}),r=new kn(t,e,{type:pi,depthBuffer:!1,stencilBuffer:!1}),a=new ln;a.setAttribute("position",new Ie([-1,3,0,-1,-1,0,3,-1,0],3)),a.setAttribute("uv",new Ie([0,2,0,0,2,0],2));const l=new jg({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),c=new Je(a,l),h=new Yc(-1,1,1,-1,0,1);let d=null,u=null,f=!1,m,x=null,p=[],g=!1;this.setSize=function(_,v){o.setSize(_,v),r.setSize(_,v);for(let y=0;y<p.length;y++){const b=p[y];b.setSize&&b.setSize(_,v)}},this.setEffects=function(_){p=_,g=p.length>0&&p[0].isRenderPass===!0;const v=o.width,y=o.height;for(let b=0;b<p.length;b++){const w=p[b];w.setSize&&w.setSize(v,y)}},this.begin=function(_,v){if(f||_.toneMapping===zn&&p.length===0)return!1;if(x=v,v!==null){const y=v.width,b=v.height;(o.width!==y||o.height!==b)&&this.setSize(y,b)}return g===!1&&_.setRenderTarget(o),m=_.toneMapping,_.toneMapping=zn,!0},this.hasRenderPass=function(){return g},this.end=function(_,v){_.toneMapping=m,f=!0;let y=o,b=r;for(let w=0;w<p.length;w++){const T=p[w];if(T.enabled!==!1&&(T.render(_,b,y,v),T.needsSwap!==!1)){const P=y;y=b,b=P}}if(d!==_.outputColorSpace||u!==_.toneMapping){d=_.outputColorSpace,u=_.toneMapping,l.defines={},Zt.getTransfer(d)===le&&(l.defines.SRGB_TRANSFER="");const w=nv[u];w&&(l.defines[w]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=y.texture,_.setRenderTarget(x),_.render(c,h),x=null,f=!1},this.isCompositing=function(){return f},this.dispose=function(){o.dispose(),r.dispose(),a.dispose(),l.dispose()}}const np=new Qe,bc=new Bo(1,1),ip=new Vf,sp=new Eg,op=new Kf,ud=[],fd=[],pd=new Float32Array(16),md=new Float32Array(9),gd=new Float32Array(4);function to(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let o=ud[s];if(o===void 0&&(o=new Float32Array(s),ud[s]=o),t!==0){n.toArray(o,0);for(let r=1,a=0;r!==t;++r)a+=e,i[r].toArray(o,a)}return o}function Fe(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Ne(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function ga(i,t){let e=fd[t];e===void 0&&(e=new Int32Array(t),fd[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function sv(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function ov(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Fe(e,t))return;i.uniform2fv(this.addr,t),Ne(e,t)}}function rv(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Fe(e,t))return;i.uniform3fv(this.addr,t),Ne(e,t)}}function av(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Fe(e,t))return;i.uniform4fv(this.addr,t),Ne(e,t)}}function lv(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Fe(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Ne(e,t)}else{if(Fe(e,n))return;gd.set(n),i.uniformMatrix2fv(this.addr,!1,gd),Ne(e,n)}}function cv(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Fe(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Ne(e,t)}else{if(Fe(e,n))return;md.set(n),i.uniformMatrix3fv(this.addr,!1,md),Ne(e,n)}}function hv(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Fe(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Ne(e,t)}else{if(Fe(e,n))return;pd.set(n),i.uniformMatrix4fv(this.addr,!1,pd),Ne(e,n)}}function dv(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function uv(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Fe(e,t))return;i.uniform2iv(this.addr,t),Ne(e,t)}}function fv(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Fe(e,t))return;i.uniform3iv(this.addr,t),Ne(e,t)}}function pv(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Fe(e,t))return;i.uniform4iv(this.addr,t),Ne(e,t)}}function mv(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function gv(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Fe(e,t))return;i.uniform2uiv(this.addr,t),Ne(e,t)}}function xv(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Fe(e,t))return;i.uniform3uiv(this.addr,t),Ne(e,t)}}function _v(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Fe(e,t))return;i.uniform4uiv(this.addr,t),Ne(e,t)}}function vv(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let o;this.type===i.SAMPLER_2D_SHADOW?(bc.compareFunction=e.isReversedDepthBuffer()?Hc:Vc,o=bc):o=np,e.setTexture2D(t||o,s)}function yv(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||sp,s)}function bv(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||op,s)}function Mv(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||ip,s)}function Sv(i){switch(i){case 5126:return sv;case 35664:return ov;case 35665:return rv;case 35666:return av;case 35674:return lv;case 35675:return cv;case 35676:return hv;case 5124:case 35670:return dv;case 35667:case 35671:return uv;case 35668:case 35672:return fv;case 35669:case 35673:return pv;case 5125:return mv;case 36294:return gv;case 36295:return xv;case 36296:return _v;case 35678:case 36198:case 36298:case 36306:case 35682:return vv;case 35679:case 36299:case 36307:return yv;case 35680:case 36300:case 36308:case 36293:return bv;case 36289:case 36303:case 36311:case 36292:return Mv}}function wv(i,t){i.uniform1fv(this.addr,t)}function Ev(i,t){const e=to(t,this.size,2);i.uniform2fv(this.addr,e)}function Tv(i,t){const e=to(t,this.size,3);i.uniform3fv(this.addr,e)}function Av(i,t){const e=to(t,this.size,4);i.uniform4fv(this.addr,e)}function Cv(i,t){const e=to(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Rv(i,t){const e=to(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Pv(i,t){const e=to(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Lv(i,t){i.uniform1iv(this.addr,t)}function Dv(i,t){i.uniform2iv(this.addr,t)}function Iv(i,t){i.uniform3iv(this.addr,t)}function Fv(i,t){i.uniform4iv(this.addr,t)}function Nv(i,t){i.uniform1uiv(this.addr,t)}function Ov(i,t){i.uniform2uiv(this.addr,t)}function Uv(i,t){i.uniform3uiv(this.addr,t)}function Bv(i,t){i.uniform4uiv(this.addr,t)}function zv(i,t,e){const n=this.cache,s=t.length,o=ga(e,s);Fe(n,o)||(i.uniform1iv(this.addr,o),Ne(n,o));let r;this.type===i.SAMPLER_2D_SHADOW?r=bc:r=np;for(let a=0;a!==s;++a)e.setTexture2D(t[a]||r,o[a])}function kv(i,t,e){const n=this.cache,s=t.length,o=ga(e,s);Fe(n,o)||(i.uniform1iv(this.addr,o),Ne(n,o));for(let r=0;r!==s;++r)e.setTexture3D(t[r]||sp,o[r])}function Vv(i,t,e){const n=this.cache,s=t.length,o=ga(e,s);Fe(n,o)||(i.uniform1iv(this.addr,o),Ne(n,o));for(let r=0;r!==s;++r)e.setTextureCube(t[r]||op,o[r])}function Hv(i,t,e){const n=this.cache,s=t.length,o=ga(e,s);Fe(n,o)||(i.uniform1iv(this.addr,o),Ne(n,o));for(let r=0;r!==s;++r)e.setTexture2DArray(t[r]||ip,o[r])}function Gv(i){switch(i){case 5126:return wv;case 35664:return Ev;case 35665:return Tv;case 35666:return Av;case 35674:return Cv;case 35675:return Rv;case 35676:return Pv;case 5124:case 35670:return Lv;case 35667:case 35671:return Dv;case 35668:case 35672:return Iv;case 35669:case 35673:return Fv;case 5125:return Nv;case 36294:return Ov;case 36295:return Uv;case 36296:return Bv;case 35678:case 36198:case 36298:case 36306:case 35682:return zv;case 35679:case 36299:case 36307:return kv;case 35680:case 36300:case 36308:case 36293:return Vv;case 36289:case 36303:case 36311:case 36292:return Hv}}class Wv{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Sv(e.type)}}class qv{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Gv(e.type)}}class Xv{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let o=0,r=s.length;o!==r;++o){const a=s[o];a.setValue(t,e[a.id],n)}}}const al=/(\w+)(\])?(\[|\.)?/g;function xd(i,t){i.seq.push(t),i.map[t.id]=t}function $v(i,t,e){const n=i.name,s=n.length;for(al.lastIndex=0;;){const o=al.exec(n),r=al.lastIndex;let a=o[1];const l=o[2]==="]",c=o[3];if(l&&(a=a|0),c===void 0||c==="["&&r+2===s){xd(e,c===void 0?new Wv(a,i,t):new qv(a,i,t));break}else{let d=e.map[a];d===void 0&&(d=new Xv(a),xd(e,d)),e=d}}}class Yr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){const a=t.getActiveUniform(e,r),l=t.getUniformLocation(e,a.name);$v(a,l,this)}const s=[],o=[];for(const r of this.seq)r.type===t.SAMPLER_2D_SHADOW||r.type===t.SAMPLER_CUBE_SHADOW||r.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(r):o.push(r);s.length>0&&(this.seq=s.concat(o))}setValue(t,e,n,s){const o=this.map[e];o!==void 0&&o.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let o=0,r=e.length;o!==r;++o){const a=e[o],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,o=t.length;s!==o;++s){const r=t[s];r.id in e&&n.push(r)}return n}}function _d(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Yv=37297;let jv=0;function Kv(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),o=Math.min(t+6,e.length);for(let r=s;r<o;r++){const a=r+1;n.push(`${a===t?">":" "} ${a}: ${e[r]}`)}return n.join(`
`)}const vd=new Ht;function Zv(i){Zt._getMatrix(vd,Zt.workingColorSpace,i);const t=`mat3( ${vd.elements.map(e=>e.toFixed(4))} )`;switch(Zt.getTransfer(i)){case Zr:return[t,"LinearTransferOETF"];case le:return[t,"sRGBTransferOETF"];default:return Bt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function yd(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),o=(i.getShaderInfoLog(t)||"").trim();if(n&&o==="")return"";const r=/ERROR: 0:(\d+)/.exec(o);if(r){const a=parseInt(r[1]);return e.toUpperCase()+`

`+o+`

`+Kv(i.getShaderSource(t),a)}else return o}function Jv(i,t){const e=Zv(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}const Qv={[wf]:"Linear",[Ef]:"Reinhard",[Tf]:"Cineon",[Af]:"ACESFilmic",[Rf]:"AgX",[Pf]:"Neutral",[Cf]:"Custom"};function ty(i,t){const e=Qv[t];return e===void 0?(Bt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const yr=new H;function ey(){Zt.getLuminanceCoefficients(yr);const i=yr.x.toFixed(4),t=yr.y.toFixed(4),e=yr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function ny(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(bo).join(`
`)}function iy(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function sy(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const o=i.getActiveAttrib(t,s),r=o.name;let a=1;o.type===i.FLOAT_MAT2&&(a=2),o.type===i.FLOAT_MAT3&&(a=3),o.type===i.FLOAT_MAT4&&(a=4),e[r]={type:o.type,location:i.getAttribLocation(t,r),locationSize:a}}return e}function bo(i){return i!==""}function bd(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Md(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const oy=/^[ \t]*#include +<([\w\d./]+)>/gm;function Mc(i){return i.replace(oy,ay)}const ry=new Map;function ay(i,t){let e=Gt[t];if(e===void 0){const n=ry.get(t);if(n!==void 0)e=Gt[n],Bt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Mc(e)}const ly=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Sd(i){return i.replace(ly,cy)}function cy(i,t,e,n){let s="";for(let o=parseInt(t);o<parseInt(e);o++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+o+" ]").replace(/UNROLLED_LOOP_INDEX/g,o);return s}function wd(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const hy={[Gr]:"SHADOWMAP_TYPE_PCF",[vo]:"SHADOWMAP_TYPE_VSM"};function dy(i){return hy[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const uy={[rs]:"ENVMAP_TYPE_CUBE",[ks]:"ENVMAP_TYPE_CUBE",[fa]:"ENVMAP_TYPE_CUBE_UV"};function fy(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":uy[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const py={[ks]:"ENVMAP_MODE_REFRACTION"};function my(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":py[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const gy={[Sf]:"ENVMAP_BLENDING_MULTIPLY",[qm]:"ENVMAP_BLENDING_MIX",[Xm]:"ENVMAP_BLENDING_ADD"};function xy(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":gy[i.combine]||"ENVMAP_BLENDING_NONE"}function _y(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function vy(i,t,e,n){const s=i.getContext(),o=e.defines;let r=e.vertexShader,a=e.fragmentShader;const l=dy(e),c=fy(e),h=my(e),d=xy(e),u=_y(e),f=ny(e),m=iy(o),x=s.createProgram();let p,g,_=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(bo).join(`
`),p.length>0&&(p+=`
`),g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(bo).join(`
`),g.length>0&&(g+=`
`)):(p=[wd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(bo).join(`
`),g=[wd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==zn?"#define TONE_MAPPING":"",e.toneMapping!==zn?Gt.tonemapping_pars_fragment:"",e.toneMapping!==zn?ty("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Gt.colorspace_pars_fragment,Jv("linearToOutputTexel",e.outputColorSpace),ey(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(bo).join(`
`)),r=Mc(r),r=bd(r,e),r=Md(r,e),a=Mc(a),a=bd(a,e),a=Md(a,e),r=Sd(r),a=Sd(a),e.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,g=["#define varying in",e.glslVersion===Dh?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Dh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);const v=_+p+r,y=_+g+a,b=_d(s,s.VERTEX_SHADER,v),w=_d(s,s.FRAGMENT_SHADER,y);s.attachShader(x,b),s.attachShader(x,w),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function T(R){if(i.debug.checkShaderErrors){const N=s.getProgramInfoLog(x)||"",D=s.getShaderInfoLog(b)||"",O=s.getShaderInfoLog(w)||"",F=N.trim(),I=D.trim(),z=O.trim();let W=!0,j=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(W=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,b,w);else{const tt=yd(s,b,"vertex"),nt=yd(s,w,"fragment");te("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+F+`
`+tt+`
`+nt)}else F!==""?Bt("WebGLProgram: Program Info Log:",F):(I===""||z==="")&&(j=!1);j&&(R.diagnostics={runnable:W,programLog:F,vertexShader:{log:I,prefix:p},fragmentShader:{log:z,prefix:g}})}s.deleteShader(b),s.deleteShader(w),P=new Yr(s,x),M=sy(s,x)}let P;this.getUniforms=function(){return P===void 0&&T(this),P};let M;this.getAttributes=function(){return M===void 0&&T(this),M};let E=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=s.getProgramParameter(x,Yv)),E},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=jv++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=b,this.fragmentShader=w,this}let yy=0;class by{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),o=this._getShaderStage(n),r=this._getShaderCacheForMaterial(t);return r.has(s)===!1&&(r.add(s),s.usedTimes++),r.has(o)===!1&&(r.add(o),o.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new My(t),e.set(t,n)),n}}class My{constructor(t){this.id=yy++,this.code=t,this.usedTimes=0}}function Sy(i,t,e,n,s,o,r){const a=new Gf,l=new by,c=new Set,h=[],d=new Map,u=s.logarithmicDepthBuffer;let f=s.precision;const m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(M){return c.add(M),M===0?"uv":`uv${M}`}function p(M,E,R,N,D){const O=N.fog,F=D.geometry,I=M.isMeshStandardMaterial?N.environment:null,z=(M.isMeshStandardMaterial?e:t).get(M.envMap||I),W=z&&z.mapping===fa?z.image.height:null,j=m[M.type];M.precision!==null&&(f=s.getMaxPrecision(M.precision),f!==M.precision&&Bt("WebGLProgram.getParameters:",M.precision,"not supported, using",f,"instead."));const tt=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,nt=tt!==void 0?tt.length:0;let et=0;F.morphAttributes.position!==void 0&&(et=1),F.morphAttributes.normal!==void 0&&(et=2),F.morphAttributes.color!==void 0&&(et=3);let St,Xt,ut,X;if(j){const re=On[j];St=re.vertexShader,Xt=re.fragmentShader}else St=M.vertexShader,Xt=M.fragmentShader,l.update(M),ut=l.getVertexShaderID(M),X=l.getFragmentShaderID(M);const Z=i.getRenderTarget(),rt=i.state.buffers.depth.getReversed(),Lt=D.isInstancedMesh===!0,pt=D.isBatchedMesh===!0,Ft=!!M.map,oe=!!M.matcap,Ot=!!z,Rt=!!M.aoMap,Vt=!!M.lightMap,Pt=!!M.bumpMap,se=!!M.normalMap,U=!!M.displacementMap,ue=!!M.emissiveMap,Jt=!!M.metalnessMap,fe=!!M.roughnessMap,Et=M.anisotropy>0,L=M.clearcoat>0,S=M.dispersion>0,k=M.iridescence>0,K=M.sheen>0,Q=M.transmission>0,Y=Et&&!!M.anisotropyMap,At=L&&!!M.clearcoatMap,lt=L&&!!M.clearcoatNormalMap,wt=L&&!!M.clearcoatRoughnessMap,Ut=k&&!!M.iridescenceMap,st=k&&!!M.iridescenceThicknessMap,ht=K&&!!M.sheenColorMap,Mt=K&&!!M.sheenRoughnessMap,Tt=!!M.specularMap,ct=!!M.specularColorMap,Wt=!!M.specularIntensityMap,B=Q&&!!M.transmissionMap,gt=Q&&!!M.thicknessMap,ot=!!M.gradientMap,xt=!!M.alphaMap,it=M.alphaTest>0,J=!!M.alphaHash,at=!!M.extensions;let zt=zn;M.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(zt=i.toneMapping);const pe={shaderID:j,shaderType:M.type,shaderName:M.name,vertexShader:St,fragmentShader:Xt,defines:M.defines,customVertexShaderID:ut,customFragmentShaderID:X,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:f,batching:pt,batchingColor:pt&&D._colorsTexture!==null,instancing:Lt,instancingColor:Lt&&D.instanceColor!==null,instancingMorph:Lt&&D.morphTexture!==null,outputColorSpace:Z===null?i.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:Hs,alphaToCoverage:!!M.alphaToCoverage,map:Ft,matcap:oe,envMap:Ot,envMapMode:Ot&&z.mapping,envMapCubeUVHeight:W,aoMap:Rt,lightMap:Vt,bumpMap:Pt,normalMap:se,displacementMap:U,emissiveMap:ue,normalMapObjectSpace:se&&M.normalMapType===jm,normalMapTangentSpace:se&&M.normalMapType===zf,metalnessMap:Jt,roughnessMap:fe,anisotropy:Et,anisotropyMap:Y,clearcoat:L,clearcoatMap:At,clearcoatNormalMap:lt,clearcoatRoughnessMap:wt,dispersion:S,iridescence:k,iridescenceMap:Ut,iridescenceThicknessMap:st,sheen:K,sheenColorMap:ht,sheenRoughnessMap:Mt,specularMap:Tt,specularColorMap:ct,specularIntensityMap:Wt,transmission:Q,transmissionMap:B,thicknessMap:gt,gradientMap:ot,opaque:M.transparent===!1&&M.blending===Fs&&M.alphaToCoverage===!1,alphaMap:xt,alphaTest:it,alphaHash:J,combine:M.combine,mapUv:Ft&&x(M.map.channel),aoMapUv:Rt&&x(M.aoMap.channel),lightMapUv:Vt&&x(M.lightMap.channel),bumpMapUv:Pt&&x(M.bumpMap.channel),normalMapUv:se&&x(M.normalMap.channel),displacementMapUv:U&&x(M.displacementMap.channel),emissiveMapUv:ue&&x(M.emissiveMap.channel),metalnessMapUv:Jt&&x(M.metalnessMap.channel),roughnessMapUv:fe&&x(M.roughnessMap.channel),anisotropyMapUv:Y&&x(M.anisotropyMap.channel),clearcoatMapUv:At&&x(M.clearcoatMap.channel),clearcoatNormalMapUv:lt&&x(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:wt&&x(M.clearcoatRoughnessMap.channel),iridescenceMapUv:Ut&&x(M.iridescenceMap.channel),iridescenceThicknessMapUv:st&&x(M.iridescenceThicknessMap.channel),sheenColorMapUv:ht&&x(M.sheenColorMap.channel),sheenRoughnessMapUv:Mt&&x(M.sheenRoughnessMap.channel),specularMapUv:Tt&&x(M.specularMap.channel),specularColorMapUv:ct&&x(M.specularColorMap.channel),specularIntensityMapUv:Wt&&x(M.specularIntensityMap.channel),transmissionMapUv:B&&x(M.transmissionMap.channel),thicknessMapUv:gt&&x(M.thicknessMap.channel),alphaMapUv:xt&&x(M.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(se||Et),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!F.attributes.uv&&(Ft||xt),fog:!!O,useFog:M.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:M.flatShading===!0&&M.wireframe===!1,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:rt,skinning:D.isSkinnedMesh===!0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:nt,morphTextureStride:et,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:M.dithering,shadowMapEnabled:i.shadowMap.enabled&&R.length>0,shadowMapType:i.shadowMap.type,toneMapping:zt,decodeVideoTexture:Ft&&M.map.isVideoTexture===!0&&Zt.getTransfer(M.map.colorSpace)===le,decodeVideoTextureEmissive:ue&&M.emissiveMap.isVideoTexture===!0&&Zt.getTransfer(M.emissiveMap.colorSpace)===le,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===ai,flipSided:M.side===an,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:at&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(at&&M.extensions.multiDraw===!0||pt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return pe.vertexUv1s=c.has(1),pe.vertexUv2s=c.has(2),pe.vertexUv3s=c.has(3),c.clear(),pe}function g(M){const E=[];if(M.shaderID?E.push(M.shaderID):(E.push(M.customVertexShaderID),E.push(M.customFragmentShaderID)),M.defines!==void 0)for(const R in M.defines)E.push(R),E.push(M.defines[R]);return M.isRawShaderMaterial===!1&&(_(E,M),v(E,M),E.push(i.outputColorSpace)),E.push(M.customProgramCacheKey),E.join()}function _(M,E){M.push(E.precision),M.push(E.outputColorSpace),M.push(E.envMapMode),M.push(E.envMapCubeUVHeight),M.push(E.mapUv),M.push(E.alphaMapUv),M.push(E.lightMapUv),M.push(E.aoMapUv),M.push(E.bumpMapUv),M.push(E.normalMapUv),M.push(E.displacementMapUv),M.push(E.emissiveMapUv),M.push(E.metalnessMapUv),M.push(E.roughnessMapUv),M.push(E.anisotropyMapUv),M.push(E.clearcoatMapUv),M.push(E.clearcoatNormalMapUv),M.push(E.clearcoatRoughnessMapUv),M.push(E.iridescenceMapUv),M.push(E.iridescenceThicknessMapUv),M.push(E.sheenColorMapUv),M.push(E.sheenRoughnessMapUv),M.push(E.specularMapUv),M.push(E.specularColorMapUv),M.push(E.specularIntensityMapUv),M.push(E.transmissionMapUv),M.push(E.thicknessMapUv),M.push(E.combine),M.push(E.fogExp2),M.push(E.sizeAttenuation),M.push(E.morphTargetsCount),M.push(E.morphAttributeCount),M.push(E.numDirLights),M.push(E.numPointLights),M.push(E.numSpotLights),M.push(E.numSpotLightMaps),M.push(E.numHemiLights),M.push(E.numRectAreaLights),M.push(E.numDirLightShadows),M.push(E.numPointLightShadows),M.push(E.numSpotLightShadows),M.push(E.numSpotLightShadowsWithMaps),M.push(E.numLightProbes),M.push(E.shadowMapType),M.push(E.toneMapping),M.push(E.numClippingPlanes),M.push(E.numClipIntersection),M.push(E.depthPacking)}function v(M,E){a.disableAll(),E.instancing&&a.enable(0),E.instancingColor&&a.enable(1),E.instancingMorph&&a.enable(2),E.matcap&&a.enable(3),E.envMap&&a.enable(4),E.normalMapObjectSpace&&a.enable(5),E.normalMapTangentSpace&&a.enable(6),E.clearcoat&&a.enable(7),E.iridescence&&a.enable(8),E.alphaTest&&a.enable(9),E.vertexColors&&a.enable(10),E.vertexAlphas&&a.enable(11),E.vertexUv1s&&a.enable(12),E.vertexUv2s&&a.enable(13),E.vertexUv3s&&a.enable(14),E.vertexTangents&&a.enable(15),E.anisotropy&&a.enable(16),E.alphaHash&&a.enable(17),E.batching&&a.enable(18),E.dispersion&&a.enable(19),E.batchingColor&&a.enable(20),E.gradientMap&&a.enable(21),M.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.reversedDepthBuffer&&a.enable(4),E.skinning&&a.enable(5),E.morphTargets&&a.enable(6),E.morphNormals&&a.enable(7),E.morphColors&&a.enable(8),E.premultipliedAlpha&&a.enable(9),E.shadowMapEnabled&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),E.decodeVideoTextureEmissive&&a.enable(20),E.alphaToCoverage&&a.enable(21),M.push(a.mask)}function y(M){const E=m[M.type];let R;if(E){const N=On[E];R=Bg.clone(N.uniforms)}else R=M.uniforms;return R}function b(M,E){let R=d.get(E);return R!==void 0?++R.usedTimes:(R=new vy(i,E,M,o),h.push(R),d.set(E,R)),R}function w(M){if(--M.usedTimes===0){const E=h.indexOf(M);h[E]=h[h.length-1],h.pop(),d.delete(M.cacheKey),M.destroy()}}function T(M){l.remove(M)}function P(){l.dispose()}return{getParameters:p,getProgramCacheKey:g,getUniforms:y,acquireProgram:b,releaseProgram:w,releaseShaderCache:T,programs:h,dispose:P}}function wy(){let i=new WeakMap;function t(r){return i.has(r)}function e(r){let a=i.get(r);return a===void 0&&(a={},i.set(r,a)),a}function n(r){i.delete(r)}function s(r,a,l){i.get(r)[a]=l}function o(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:o}}function Ey(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Ed(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Td(){const i=[];let t=0;const e=[],n=[],s=[];function o(){t=0,e.length=0,n.length=0,s.length=0}function r(d,u,f,m,x,p){let g=i[t];return g===void 0?(g={id:d.id,object:d,geometry:u,material:f,groupOrder:m,renderOrder:d.renderOrder,z:x,group:p},i[t]=g):(g.id=d.id,g.object=d,g.geometry=u,g.material=f,g.groupOrder=m,g.renderOrder=d.renderOrder,g.z=x,g.group=p),t++,g}function a(d,u,f,m,x,p){const g=r(d,u,f,m,x,p);f.transmission>0?n.push(g):f.transparent===!0?s.push(g):e.push(g)}function l(d,u,f,m,x,p){const g=r(d,u,f,m,x,p);f.transmission>0?n.unshift(g):f.transparent===!0?s.unshift(g):e.unshift(g)}function c(d,u){e.length>1&&e.sort(d||Ey),n.length>1&&n.sort(u||Ed),s.length>1&&s.sort(u||Ed)}function h(){for(let d=t,u=i.length;d<u;d++){const f=i[d];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:s,init:o,push:a,unshift:l,finish:h,sort:c}}function Ty(){let i=new WeakMap;function t(n,s){const o=i.get(n);let r;return o===void 0?(r=new Td,i.set(n,[r])):s>=o.length?(r=new Td,o.push(r)):r=o[s],r}function e(){i=new WeakMap}return{get:t,dispose:e}}function Ay(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new H,color:new qt};break;case"SpotLight":e={position:new H,direction:new H,color:new qt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new H,color:new qt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new H,skyColor:new qt,groundColor:new qt};break;case"RectAreaLight":e={color:new qt,position:new H,halfWidth:new H,halfHeight:new H};break}return i[t.id]=e,e}}}function Cy(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ne};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ne};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ne,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let Ry=0;function Py(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Ly(i){const t=new Ay,e=Cy(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new H);const s=new H,o=new be,r=new be;function a(c){let h=0,d=0,u=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let f=0,m=0,x=0,p=0,g=0,_=0,v=0,y=0,b=0,w=0,T=0;c.sort(Py);for(let M=0,E=c.length;M<E;M++){const R=c[M],N=R.color,D=R.intensity,O=R.distance;let F=null;if(R.shadow&&R.shadow.map&&(R.shadow.map.texture.format===Vs?F=R.shadow.map.texture:F=R.shadow.map.depthTexture||R.shadow.map.texture),R.isAmbientLight)h+=N.r*D,d+=N.g*D,u+=N.b*D;else if(R.isLightProbe){for(let I=0;I<9;I++)n.probe[I].addScaledVector(R.sh.coefficients[I],D);T++}else if(R.isDirectionalLight){const I=t.get(R);if(I.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){const z=R.shadow,W=e.get(R);W.shadowIntensity=z.intensity,W.shadowBias=z.bias,W.shadowNormalBias=z.normalBias,W.shadowRadius=z.radius,W.shadowMapSize=z.mapSize,n.directionalShadow[f]=W,n.directionalShadowMap[f]=F,n.directionalShadowMatrix[f]=R.shadow.matrix,_++}n.directional[f]=I,f++}else if(R.isSpotLight){const I=t.get(R);I.position.setFromMatrixPosition(R.matrixWorld),I.color.copy(N).multiplyScalar(D),I.distance=O,I.coneCos=Math.cos(R.angle),I.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),I.decay=R.decay,n.spot[x]=I;const z=R.shadow;if(R.map&&(n.spotLightMap[b]=R.map,b++,z.updateMatrices(R),R.castShadow&&w++),n.spotLightMatrix[x]=z.matrix,R.castShadow){const W=e.get(R);W.shadowIntensity=z.intensity,W.shadowBias=z.bias,W.shadowNormalBias=z.normalBias,W.shadowRadius=z.radius,W.shadowMapSize=z.mapSize,n.spotShadow[x]=W,n.spotShadowMap[x]=F,y++}x++}else if(R.isRectAreaLight){const I=t.get(R);I.color.copy(N).multiplyScalar(D),I.halfWidth.set(R.width*.5,0,0),I.halfHeight.set(0,R.height*.5,0),n.rectArea[p]=I,p++}else if(R.isPointLight){const I=t.get(R);if(I.color.copy(R.color).multiplyScalar(R.intensity),I.distance=R.distance,I.decay=R.decay,R.castShadow){const z=R.shadow,W=e.get(R);W.shadowIntensity=z.intensity,W.shadowBias=z.bias,W.shadowNormalBias=z.normalBias,W.shadowRadius=z.radius,W.shadowMapSize=z.mapSize,W.shadowCameraNear=z.camera.near,W.shadowCameraFar=z.camera.far,n.pointShadow[m]=W,n.pointShadowMap[m]=F,n.pointShadowMatrix[m]=R.shadow.matrix,v++}n.point[m]=I,m++}else if(R.isHemisphereLight){const I=t.get(R);I.skyColor.copy(R.color).multiplyScalar(D),I.groundColor.copy(R.groundColor).multiplyScalar(D),n.hemi[g]=I,g++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ft.LTC_FLOAT_1,n.rectAreaLTC2=ft.LTC_FLOAT_2):(n.rectAreaLTC1=ft.LTC_HALF_1,n.rectAreaLTC2=ft.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;const P=n.hash;(P.directionalLength!==f||P.pointLength!==m||P.spotLength!==x||P.rectAreaLength!==p||P.hemiLength!==g||P.numDirectionalShadows!==_||P.numPointShadows!==v||P.numSpotShadows!==y||P.numSpotMaps!==b||P.numLightProbes!==T)&&(n.directional.length=f,n.spot.length=x,n.rectArea.length=p,n.point.length=m,n.hemi.length=g,n.directionalShadow.length=_,n.directionalShadowMap.length=_,n.pointShadow.length=v,n.pointShadowMap.length=v,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=_,n.pointShadowMatrix.length=v,n.spotLightMatrix.length=y+b-w,n.spotLightMap.length=b,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=T,P.directionalLength=f,P.pointLength=m,P.spotLength=x,P.rectAreaLength=p,P.hemiLength=g,P.numDirectionalShadows=_,P.numPointShadows=v,P.numSpotShadows=y,P.numSpotMaps=b,P.numLightProbes=T,n.version=Ry++)}function l(c,h){let d=0,u=0,f=0,m=0,x=0;const p=h.matrixWorldInverse;for(let g=0,_=c.length;g<_;g++){const v=c[g];if(v.isDirectionalLight){const y=n.directional[d];y.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(p),d++}else if(v.isSpotLight){const y=n.spot[f];y.position.setFromMatrixPosition(v.matrixWorld),y.position.applyMatrix4(p),y.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(p),f++}else if(v.isRectAreaLight){const y=n.rectArea[m];y.position.setFromMatrixPosition(v.matrixWorld),y.position.applyMatrix4(p),r.identity(),o.copy(v.matrixWorld),o.premultiply(p),r.extractRotation(o),y.halfWidth.set(v.width*.5,0,0),y.halfHeight.set(0,v.height*.5,0),y.halfWidth.applyMatrix4(r),y.halfHeight.applyMatrix4(r),m++}else if(v.isPointLight){const y=n.point[u];y.position.setFromMatrixPosition(v.matrixWorld),y.position.applyMatrix4(p),u++}else if(v.isHemisphereLight){const y=n.hemi[x];y.direction.setFromMatrixPosition(v.matrixWorld),y.direction.transformDirection(p),x++}}}return{setup:a,setupView:l,state:n}}function Ad(i){const t=new Ly(i),e=[],n=[];function s(h){c.camera=h,e.length=0,n.length=0}function o(h){e.push(h)}function r(h){n.push(h)}function a(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:o,pushShadow:r}}function Dy(i){let t=new WeakMap;function e(s,o=0){const r=t.get(s);let a;return r===void 0?(a=new Ad(i),t.set(s,[a])):o>=r.length?(a=new Ad(i),r.push(a)):a=r[o],a}function n(){t=new WeakMap}return{get:e,dispose:n}}const Iy=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Fy=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Ny=[new H(1,0,0),new H(-1,0,0),new H(0,1,0),new H(0,-1,0),new H(0,0,1),new H(0,0,-1)],Oy=[new H(0,-1,0),new H(0,-1,0),new H(0,0,1),new H(0,0,-1),new H(0,-1,0),new H(0,-1,0)],Cd=new be,lo=new H,ll=new H;function Uy(i,t,e){let n=new qc;const s=new ne,o=new ne,r=new we,a=new Kg,l=new Zg,c={},h=e.maxTextureSize,d={[Di]:an,[an]:Di,[ai]:ai},u=new qn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ne},radius:{value:4}},vertexShader:Iy,fragmentShader:Fy}),f=u.clone();f.defines.HORIZONTAL_PASS=1;const m=new ln;m.setAttribute("position",new Vn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new Je(m,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Gr;let g=this.type;this.render=function(w,T,P){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||w.length===0)return;w.type===Tm&&(Bt("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),w.type=Gr);const M=i.getRenderTarget(),E=i.getActiveCubeFace(),R=i.getActiveMipmapLevel(),N=i.state;N.setBlending(ui),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);const D=g!==this.type;D&&T.traverse(function(O){O.material&&(Array.isArray(O.material)?O.material.forEach(F=>F.needsUpdate=!0):O.material.needsUpdate=!0)});for(let O=0,F=w.length;O<F;O++){const I=w[O],z=I.shadow;if(z===void 0){Bt("WebGLShadowMap:",I,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;s.copy(z.mapSize);const W=z.getFrameExtents();if(s.multiply(W),o.copy(z.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(o.x=Math.floor(h/W.x),s.x=o.x*W.x,z.mapSize.x=o.x),s.y>h&&(o.y=Math.floor(h/W.y),s.y=o.y*W.y,z.mapSize.y=o.y)),z.map===null||D===!0){if(z.map!==null&&(z.map.depthTexture!==null&&(z.map.depthTexture.dispose(),z.map.depthTexture=null),z.map.dispose()),this.type===vo){if(I.isPointLight){Bt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}z.map=new kn(s.x,s.y,{format:Vs,type:pi,minFilter:We,magFilter:We,generateMipmaps:!1}),z.map.texture.name=I.name+".shadowMap",z.map.depthTexture=new Bo(s.x,s.y,Un),z.map.depthTexture.name=I.name+".shadowMapDepth",z.map.depthTexture.format=mi,z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=Be,z.map.depthTexture.magFilter=Be}else{I.isPointLight?(z.map=new Zf(s.x),z.map.depthTexture=new Yg(s.x,Gn)):(z.map=new kn(s.x,s.y),z.map.depthTexture=new Bo(s.x,s.y,Gn)),z.map.depthTexture.name=I.name+".shadowMap",z.map.depthTexture.format=mi;const tt=i.state.buffers.depth.getReversed();this.type===Gr?(z.map.depthTexture.compareFunction=tt?Hc:Vc,z.map.depthTexture.minFilter=We,z.map.depthTexture.magFilter=We):(z.map.depthTexture.compareFunction=null,z.map.depthTexture.minFilter=Be,z.map.depthTexture.magFilter=Be)}z.camera.updateProjectionMatrix()}const j=z.map.isWebGLCubeRenderTarget?6:1;for(let tt=0;tt<j;tt++){if(z.map.isWebGLCubeRenderTarget)i.setRenderTarget(z.map,tt),i.clear();else{tt===0&&(i.setRenderTarget(z.map),i.clear());const nt=z.getViewport(tt);r.set(o.x*nt.x,o.y*nt.y,o.x*nt.z,o.y*nt.w),N.viewport(r)}if(I.isPointLight){const nt=z.camera,et=z.matrix,St=I.distance||nt.far;St!==nt.far&&(nt.far=St,nt.updateProjectionMatrix()),lo.setFromMatrixPosition(I.matrixWorld),nt.position.copy(lo),ll.copy(nt.position),ll.add(Ny[tt]),nt.up.copy(Oy[tt]),nt.lookAt(ll),nt.updateMatrixWorld(),et.makeTranslation(-lo.x,-lo.y,-lo.z),Cd.multiplyMatrices(nt.projectionMatrix,nt.matrixWorldInverse),z._frustum.setFromProjectionMatrix(Cd,nt.coordinateSystem,nt.reversedDepth)}else z.updateMatrices(I);n=z.getFrustum(),y(T,P,z.camera,I,this.type)}z.isPointLightShadow!==!0&&this.type===vo&&_(z,P),z.needsUpdate=!1}g=this.type,p.needsUpdate=!1,i.setRenderTarget(M,E,R)};function _(w,T){const P=t.update(x);u.defines.VSM_SAMPLES!==w.blurSamples&&(u.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new kn(s.x,s.y,{format:Vs,type:pi})),u.uniforms.shadow_pass.value=w.map.depthTexture,u.uniforms.resolution.value=w.mapSize,u.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(T,null,P,u,x,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value=w.mapSize,f.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(T,null,P,f,x,null)}function v(w,T,P,M){let E=null;const R=P.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(R!==void 0)E=R;else if(E=P.isPointLight===!0?l:a,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0||T.alphaToCoverage===!0){const N=E.uuid,D=T.uuid;let O=c[N];O===void 0&&(O={},c[N]=O);let F=O[D];F===void 0&&(F=E.clone(),O[D]=F,T.addEventListener("dispose",b)),E=F}if(E.visible=T.visible,E.wireframe=T.wireframe,M===vo?E.side=T.shadowSide!==null?T.shadowSide:T.side:E.side=T.shadowSide!==null?T.shadowSide:d[T.side],E.alphaMap=T.alphaMap,E.alphaTest=T.alphaToCoverage===!0?.5:T.alphaTest,E.map=T.map,E.clipShadows=T.clipShadows,E.clippingPlanes=T.clippingPlanes,E.clipIntersection=T.clipIntersection,E.displacementMap=T.displacementMap,E.displacementScale=T.displacementScale,E.displacementBias=T.displacementBias,E.wireframeLinewidth=T.wireframeLinewidth,E.linewidth=T.linewidth,P.isPointLight===!0&&E.isMeshDistanceMaterial===!0){const N=i.properties.get(E);N.light=P}return E}function y(w,T,P,M,E){if(w.visible===!1)return;if(w.layers.test(T.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&E===vo)&&(!w.frustumCulled||n.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,w.matrixWorld);const D=t.update(w),O=w.material;if(Array.isArray(O)){const F=D.groups;for(let I=0,z=F.length;I<z;I++){const W=F[I],j=O[W.materialIndex];if(j&&j.visible){const tt=v(w,j,M,E);w.onBeforeShadow(i,w,T,P,D,tt,W),i.renderBufferDirect(P,null,D,tt,w,W),w.onAfterShadow(i,w,T,P,D,tt,W)}}}else if(O.visible){const F=v(w,O,M,E);w.onBeforeShadow(i,w,T,P,D,F,null),i.renderBufferDirect(P,null,D,F,w,null),w.onAfterShadow(i,w,T,P,D,F,null)}}const N=w.children;for(let D=0,O=N.length;D<O;D++)y(N[D],T,P,M,E)}function b(w){w.target.removeEventListener("dispose",b);for(const P in c){const M=c[P],E=w.target.uuid;E in M&&(M[E].dispose(),delete M[E])}}}const By={[Dl]:Il,[Fl]:Ul,[Nl]:Bl,[zs]:Ol,[Il]:Dl,[Ul]:Fl,[Bl]:Nl,[Ol]:zs};function zy(i,t){function e(){let B=!1;const gt=new we;let ot=null;const xt=new we(0,0,0,0);return{setMask:function(it){ot!==it&&!B&&(i.colorMask(it,it,it,it),ot=it)},setLocked:function(it){B=it},setClear:function(it,J,at,zt,pe){pe===!0&&(it*=zt,J*=zt,at*=zt),gt.set(it,J,at,zt),xt.equals(gt)===!1&&(i.clearColor(it,J,at,zt),xt.copy(gt))},reset:function(){B=!1,ot=null,xt.set(-1,0,0,0)}}}function n(){let B=!1,gt=!1,ot=null,xt=null,it=null;return{setReversed:function(J){if(gt!==J){const at=t.get("EXT_clip_control");J?at.clipControlEXT(at.LOWER_LEFT_EXT,at.ZERO_TO_ONE_EXT):at.clipControlEXT(at.LOWER_LEFT_EXT,at.NEGATIVE_ONE_TO_ONE_EXT),gt=J;const zt=it;it=null,this.setClear(zt)}},getReversed:function(){return gt},setTest:function(J){J?Z(i.DEPTH_TEST):rt(i.DEPTH_TEST)},setMask:function(J){ot!==J&&!B&&(i.depthMask(J),ot=J)},setFunc:function(J){if(gt&&(J=By[J]),xt!==J){switch(J){case Dl:i.depthFunc(i.NEVER);break;case Il:i.depthFunc(i.ALWAYS);break;case Fl:i.depthFunc(i.LESS);break;case zs:i.depthFunc(i.LEQUAL);break;case Nl:i.depthFunc(i.EQUAL);break;case Ol:i.depthFunc(i.GEQUAL);break;case Ul:i.depthFunc(i.GREATER);break;case Bl:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}xt=J}},setLocked:function(J){B=J},setClear:function(J){it!==J&&(gt&&(J=1-J),i.clearDepth(J),it=J)},reset:function(){B=!1,ot=null,xt=null,it=null,gt=!1}}}function s(){let B=!1,gt=null,ot=null,xt=null,it=null,J=null,at=null,zt=null,pe=null;return{setTest:function(re){B||(re?Z(i.STENCIL_TEST):rt(i.STENCIL_TEST))},setMask:function(re){gt!==re&&!B&&(i.stencilMask(re),gt=re)},setFunc:function(re,Rn,Xn){(ot!==re||xt!==Rn||it!==Xn)&&(i.stencilFunc(re,Rn,Xn),ot=re,xt=Rn,it=Xn)},setOp:function(re,Rn,Xn){(J!==re||at!==Rn||zt!==Xn)&&(i.stencilOp(re,Rn,Xn),J=re,at=Rn,zt=Xn)},setLocked:function(re){B=re},setClear:function(re){pe!==re&&(i.clearStencil(re),pe=re)},reset:function(){B=!1,gt=null,ot=null,xt=null,it=null,J=null,at=null,zt=null,pe=null}}}const o=new e,r=new n,a=new s,l=new WeakMap,c=new WeakMap;let h={},d={},u=new WeakMap,f=[],m=null,x=!1,p=null,g=null,_=null,v=null,y=null,b=null,w=null,T=new qt(0,0,0),P=0,M=!1,E=null,R=null,N=null,D=null,O=null;const F=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let I=!1,z=0;const W=i.getParameter(i.VERSION);W.indexOf("WebGL")!==-1?(z=parseFloat(/^WebGL (\d)/.exec(W)[1]),I=z>=1):W.indexOf("OpenGL ES")!==-1&&(z=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),I=z>=2);let j=null,tt={};const nt=i.getParameter(i.SCISSOR_BOX),et=i.getParameter(i.VIEWPORT),St=new we().fromArray(nt),Xt=new we().fromArray(et);function ut(B,gt,ot,xt){const it=new Uint8Array(4),J=i.createTexture();i.bindTexture(B,J),i.texParameteri(B,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(B,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let at=0;at<ot;at++)B===i.TEXTURE_3D||B===i.TEXTURE_2D_ARRAY?i.texImage3D(gt,0,i.RGBA,1,1,xt,0,i.RGBA,i.UNSIGNED_BYTE,it):i.texImage2D(gt+at,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,it);return J}const X={};X[i.TEXTURE_2D]=ut(i.TEXTURE_2D,i.TEXTURE_2D,1),X[i.TEXTURE_CUBE_MAP]=ut(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),X[i.TEXTURE_2D_ARRAY]=ut(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),X[i.TEXTURE_3D]=ut(i.TEXTURE_3D,i.TEXTURE_3D,1,1),o.setClear(0,0,0,1),r.setClear(1),a.setClear(0),Z(i.DEPTH_TEST),r.setFunc(zs),Pt(!1),se(Th),Z(i.CULL_FACE),Rt(ui);function Z(B){h[B]!==!0&&(i.enable(B),h[B]=!0)}function rt(B){h[B]!==!1&&(i.disable(B),h[B]=!1)}function Lt(B,gt){return d[B]!==gt?(i.bindFramebuffer(B,gt),d[B]=gt,B===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=gt),B===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=gt),!0):!1}function pt(B,gt){let ot=f,xt=!1;if(B){ot=u.get(gt),ot===void 0&&(ot=[],u.set(gt,ot));const it=B.textures;if(ot.length!==it.length||ot[0]!==i.COLOR_ATTACHMENT0){for(let J=0,at=it.length;J<at;J++)ot[J]=i.COLOR_ATTACHMENT0+J;ot.length=it.length,xt=!0}}else ot[0]!==i.BACK&&(ot[0]=i.BACK,xt=!0);xt&&i.drawBuffers(ot)}function Ft(B){return m!==B?(i.useProgram(B),m=B,!0):!1}const oe={[Qi]:i.FUNC_ADD,[Cm]:i.FUNC_SUBTRACT,[Rm]:i.FUNC_REVERSE_SUBTRACT};oe[Pm]=i.MIN,oe[Lm]=i.MAX;const Ot={[Dm]:i.ZERO,[Im]:i.ONE,[Fm]:i.SRC_COLOR,[Pl]:i.SRC_ALPHA,[km]:i.SRC_ALPHA_SATURATE,[Bm]:i.DST_COLOR,[Om]:i.DST_ALPHA,[Nm]:i.ONE_MINUS_SRC_COLOR,[Ll]:i.ONE_MINUS_SRC_ALPHA,[zm]:i.ONE_MINUS_DST_COLOR,[Um]:i.ONE_MINUS_DST_ALPHA,[Vm]:i.CONSTANT_COLOR,[Hm]:i.ONE_MINUS_CONSTANT_COLOR,[Gm]:i.CONSTANT_ALPHA,[Wm]:i.ONE_MINUS_CONSTANT_ALPHA};function Rt(B,gt,ot,xt,it,J,at,zt,pe,re){if(B===ui){x===!0&&(rt(i.BLEND),x=!1);return}if(x===!1&&(Z(i.BLEND),x=!0),B!==Am){if(B!==p||re!==M){if((g!==Qi||y!==Qi)&&(i.blendEquation(i.FUNC_ADD),g=Qi,y=Qi),re)switch(B){case Fs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ah:i.blendFunc(i.ONE,i.ONE);break;case Ch:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Rh:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:te("WebGLState: Invalid blending: ",B);break}else switch(B){case Fs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ah:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Ch:te("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Rh:te("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:te("WebGLState: Invalid blending: ",B);break}_=null,v=null,b=null,w=null,T.set(0,0,0),P=0,p=B,M=re}return}it=it||gt,J=J||ot,at=at||xt,(gt!==g||it!==y)&&(i.blendEquationSeparate(oe[gt],oe[it]),g=gt,y=it),(ot!==_||xt!==v||J!==b||at!==w)&&(i.blendFuncSeparate(Ot[ot],Ot[xt],Ot[J],Ot[at]),_=ot,v=xt,b=J,w=at),(zt.equals(T)===!1||pe!==P)&&(i.blendColor(zt.r,zt.g,zt.b,pe),T.copy(zt),P=pe),p=B,M=!1}function Vt(B,gt){B.side===ai?rt(i.CULL_FACE):Z(i.CULL_FACE);let ot=B.side===an;gt&&(ot=!ot),Pt(ot),B.blending===Fs&&B.transparent===!1?Rt(ui):Rt(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),r.setFunc(B.depthFunc),r.setTest(B.depthTest),r.setMask(B.depthWrite),o.setMask(B.colorWrite);const xt=B.stencilWrite;a.setTest(xt),xt&&(a.setMask(B.stencilWriteMask),a.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),a.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),ue(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?Z(i.SAMPLE_ALPHA_TO_COVERAGE):rt(i.SAMPLE_ALPHA_TO_COVERAGE)}function Pt(B){E!==B&&(B?i.frontFace(i.CW):i.frontFace(i.CCW),E=B)}function se(B){B!==wm?(Z(i.CULL_FACE),B!==R&&(B===Th?i.cullFace(i.BACK):B===Em?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):rt(i.CULL_FACE),R=B}function U(B){B!==N&&(I&&i.lineWidth(B),N=B)}function ue(B,gt,ot){B?(Z(i.POLYGON_OFFSET_FILL),(D!==gt||O!==ot)&&(i.polygonOffset(gt,ot),D=gt,O=ot)):rt(i.POLYGON_OFFSET_FILL)}function Jt(B){B?Z(i.SCISSOR_TEST):rt(i.SCISSOR_TEST)}function fe(B){B===void 0&&(B=i.TEXTURE0+F-1),j!==B&&(i.activeTexture(B),j=B)}function Et(B,gt,ot){ot===void 0&&(j===null?ot=i.TEXTURE0+F-1:ot=j);let xt=tt[ot];xt===void 0&&(xt={type:void 0,texture:void 0},tt[ot]=xt),(xt.type!==B||xt.texture!==gt)&&(j!==ot&&(i.activeTexture(ot),j=ot),i.bindTexture(B,gt||X[B]),xt.type=B,xt.texture=gt)}function L(){const B=tt[j];B!==void 0&&B.type!==void 0&&(i.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function S(){try{i.compressedTexImage2D(...arguments)}catch(B){te("WebGLState:",B)}}function k(){try{i.compressedTexImage3D(...arguments)}catch(B){te("WebGLState:",B)}}function K(){try{i.texSubImage2D(...arguments)}catch(B){te("WebGLState:",B)}}function Q(){try{i.texSubImage3D(...arguments)}catch(B){te("WebGLState:",B)}}function Y(){try{i.compressedTexSubImage2D(...arguments)}catch(B){te("WebGLState:",B)}}function At(){try{i.compressedTexSubImage3D(...arguments)}catch(B){te("WebGLState:",B)}}function lt(){try{i.texStorage2D(...arguments)}catch(B){te("WebGLState:",B)}}function wt(){try{i.texStorage3D(...arguments)}catch(B){te("WebGLState:",B)}}function Ut(){try{i.texImage2D(...arguments)}catch(B){te("WebGLState:",B)}}function st(){try{i.texImage3D(...arguments)}catch(B){te("WebGLState:",B)}}function ht(B){St.equals(B)===!1&&(i.scissor(B.x,B.y,B.z,B.w),St.copy(B))}function Mt(B){Xt.equals(B)===!1&&(i.viewport(B.x,B.y,B.z,B.w),Xt.copy(B))}function Tt(B,gt){let ot=c.get(gt);ot===void 0&&(ot=new WeakMap,c.set(gt,ot));let xt=ot.get(B);xt===void 0&&(xt=i.getUniformBlockIndex(gt,B.name),ot.set(B,xt))}function ct(B,gt){const xt=c.get(gt).get(B);l.get(gt)!==xt&&(i.uniformBlockBinding(gt,xt,B.__bindingPointIndex),l.set(gt,xt))}function Wt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),r.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},j=null,tt={},d={},u=new WeakMap,f=[],m=null,x=!1,p=null,g=null,_=null,v=null,y=null,b=null,w=null,T=new qt(0,0,0),P=0,M=!1,E=null,R=null,N=null,D=null,O=null,St.set(0,0,i.canvas.width,i.canvas.height),Xt.set(0,0,i.canvas.width,i.canvas.height),o.reset(),r.reset(),a.reset()}return{buffers:{color:o,depth:r,stencil:a},enable:Z,disable:rt,bindFramebuffer:Lt,drawBuffers:pt,useProgram:Ft,setBlending:Rt,setMaterial:Vt,setFlipSided:Pt,setCullFace:se,setLineWidth:U,setPolygonOffset:ue,setScissorTest:Jt,activeTexture:fe,bindTexture:Et,unbindTexture:L,compressedTexImage2D:S,compressedTexImage3D:k,texImage2D:Ut,texImage3D:st,updateUBOMapping:Tt,uniformBlockBinding:ct,texStorage2D:lt,texStorage3D:wt,texSubImage2D:K,texSubImage3D:Q,compressedTexSubImage2D:Y,compressedTexSubImage3D:At,scissor:ht,viewport:Mt,reset:Wt}}function ky(i,t,e,n,s,o,r){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ne,h=new WeakMap;let d;const u=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(L,S){return f?new OffscreenCanvas(L,S):Qr("canvas")}function x(L,S,k){let K=1;const Q=Et(L);if((Q.width>k||Q.height>k)&&(K=k/Math.max(Q.width,Q.height)),K<1)if(typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&L instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&L instanceof ImageBitmap||typeof VideoFrame<"u"&&L instanceof VideoFrame){const Y=Math.floor(K*Q.width),At=Math.floor(K*Q.height);d===void 0&&(d=m(Y,At));const lt=S?m(Y,At):d;return lt.width=Y,lt.height=At,lt.getContext("2d").drawImage(L,0,0,Y,At),Bt("WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+Y+"x"+At+")."),lt}else return"data"in L&&Bt("WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),L;return L}function p(L){return L.generateMipmaps}function g(L){i.generateMipmap(L)}function _(L){return L.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:L.isWebGL3DRenderTarget?i.TEXTURE_3D:L.isWebGLArrayRenderTarget||L.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function v(L,S,k,K,Q=!1){if(L!==null){if(i[L]!==void 0)return i[L];Bt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let Y=S;if(S===i.RED&&(k===i.FLOAT&&(Y=i.R32F),k===i.HALF_FLOAT&&(Y=i.R16F),k===i.UNSIGNED_BYTE&&(Y=i.R8)),S===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.R8UI),k===i.UNSIGNED_SHORT&&(Y=i.R16UI),k===i.UNSIGNED_INT&&(Y=i.R32UI),k===i.BYTE&&(Y=i.R8I),k===i.SHORT&&(Y=i.R16I),k===i.INT&&(Y=i.R32I)),S===i.RG&&(k===i.FLOAT&&(Y=i.RG32F),k===i.HALF_FLOAT&&(Y=i.RG16F),k===i.UNSIGNED_BYTE&&(Y=i.RG8)),S===i.RG_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RG8UI),k===i.UNSIGNED_SHORT&&(Y=i.RG16UI),k===i.UNSIGNED_INT&&(Y=i.RG32UI),k===i.BYTE&&(Y=i.RG8I),k===i.SHORT&&(Y=i.RG16I),k===i.INT&&(Y=i.RG32I)),S===i.RGB_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),k===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),k===i.UNSIGNED_INT&&(Y=i.RGB32UI),k===i.BYTE&&(Y=i.RGB8I),k===i.SHORT&&(Y=i.RGB16I),k===i.INT&&(Y=i.RGB32I)),S===i.RGBA_INTEGER&&(k===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),k===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),k===i.UNSIGNED_INT&&(Y=i.RGBA32UI),k===i.BYTE&&(Y=i.RGBA8I),k===i.SHORT&&(Y=i.RGBA16I),k===i.INT&&(Y=i.RGBA32I)),S===i.RGB&&(k===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),k===i.UNSIGNED_INT_10F_11F_11F_REV&&(Y=i.R11F_G11F_B10F)),S===i.RGBA){const At=Q?Zr:Zt.getTransfer(K);k===i.FLOAT&&(Y=i.RGBA32F),k===i.HALF_FLOAT&&(Y=i.RGBA16F),k===i.UNSIGNED_BYTE&&(Y=At===le?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&t.get("EXT_color_buffer_float"),Y}function y(L,S){let k;return L?S===null||S===Gn||S===No?k=i.DEPTH24_STENCIL8:S===Un?k=i.DEPTH32F_STENCIL8:S===Fo&&(k=i.DEPTH24_STENCIL8,Bt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===Gn||S===No?k=i.DEPTH_COMPONENT24:S===Un?k=i.DEPTH_COMPONENT32F:S===Fo&&(k=i.DEPTH_COMPONENT16),k}function b(L,S){return p(L)===!0||L.isFramebufferTexture&&L.minFilter!==Be&&L.minFilter!==We?Math.log2(Math.max(S.width,S.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?S.mipmaps.length:1}function w(L){const S=L.target;S.removeEventListener("dispose",w),P(S),S.isVideoTexture&&h.delete(S)}function T(L){const S=L.target;S.removeEventListener("dispose",T),E(S)}function P(L){const S=n.get(L);if(S.__webglInit===void 0)return;const k=L.source,K=u.get(k);if(K){const Q=K[S.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&M(L),Object.keys(K).length===0&&u.delete(k)}n.remove(L)}function M(L){const S=n.get(L);i.deleteTexture(S.__webglTexture);const k=L.source,K=u.get(k);delete K[S.__cacheKey],r.memory.textures--}function E(L){const S=n.get(L);if(L.depthTexture&&(L.depthTexture.dispose(),n.remove(L.depthTexture)),L.isWebGLCubeRenderTarget)for(let K=0;K<6;K++){if(Array.isArray(S.__webglFramebuffer[K]))for(let Q=0;Q<S.__webglFramebuffer[K].length;Q++)i.deleteFramebuffer(S.__webglFramebuffer[K][Q]);else i.deleteFramebuffer(S.__webglFramebuffer[K]);S.__webglDepthbuffer&&i.deleteRenderbuffer(S.__webglDepthbuffer[K])}else{if(Array.isArray(S.__webglFramebuffer))for(let K=0;K<S.__webglFramebuffer.length;K++)i.deleteFramebuffer(S.__webglFramebuffer[K]);else i.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&i.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&i.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let K=0;K<S.__webglColorRenderbuffer.length;K++)S.__webglColorRenderbuffer[K]&&i.deleteRenderbuffer(S.__webglColorRenderbuffer[K]);S.__webglDepthRenderbuffer&&i.deleteRenderbuffer(S.__webglDepthRenderbuffer)}const k=L.textures;for(let K=0,Q=k.length;K<Q;K++){const Y=n.get(k[K]);Y.__webglTexture&&(i.deleteTexture(Y.__webglTexture),r.memory.textures--),n.remove(k[K])}n.remove(L)}let R=0;function N(){R=0}function D(){const L=R;return L>=s.maxTextures&&Bt("WebGLTextures: Trying to use "+L+" texture units while this GPU supports only "+s.maxTextures),R+=1,L}function O(L){const S=[];return S.push(L.wrapS),S.push(L.wrapT),S.push(L.wrapR||0),S.push(L.magFilter),S.push(L.minFilter),S.push(L.anisotropy),S.push(L.internalFormat),S.push(L.format),S.push(L.type),S.push(L.generateMipmaps),S.push(L.premultiplyAlpha),S.push(L.flipY),S.push(L.unpackAlignment),S.push(L.colorSpace),S.join()}function F(L,S){const k=n.get(L);if(L.isVideoTexture&&Jt(L),L.isRenderTargetTexture===!1&&L.isExternalTexture!==!0&&L.version>0&&k.__version!==L.version){const K=L.image;if(K===null)Bt("WebGLRenderer: Texture marked for update but no image data found.");else if(K.complete===!1)Bt("WebGLRenderer: Texture marked for update but image is incomplete");else{X(k,L,S);return}}else L.isExternalTexture&&(k.__webglTexture=L.sourceTexture?L.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+S)}function I(L,S){const k=n.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&k.__version!==L.version){X(k,L,S);return}else L.isExternalTexture&&(k.__webglTexture=L.sourceTexture?L.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+S)}function z(L,S){const k=n.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&k.__version!==L.version){X(k,L,S);return}e.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+S)}function W(L,S){const k=n.get(L);if(L.isCubeDepthTexture!==!0&&L.version>0&&k.__version!==L.version){Z(k,L,S);return}e.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+S)}const j={[Vl]:i.REPEAT,[li]:i.CLAMP_TO_EDGE,[Hl]:i.MIRRORED_REPEAT},tt={[Be]:i.NEAREST,[$m]:i.NEAREST_MIPMAP_NEAREST,[Qo]:i.NEAREST_MIPMAP_LINEAR,[We]:i.LINEAR,[Ra]:i.LINEAR_MIPMAP_NEAREST,[ns]:i.LINEAR_MIPMAP_LINEAR},nt={[Km]:i.NEVER,[eg]:i.ALWAYS,[Zm]:i.LESS,[Vc]:i.LEQUAL,[Jm]:i.EQUAL,[Hc]:i.GEQUAL,[Qm]:i.GREATER,[tg]:i.NOTEQUAL};function et(L,S){if(S.type===Un&&t.has("OES_texture_float_linear")===!1&&(S.magFilter===We||S.magFilter===Ra||S.magFilter===Qo||S.magFilter===ns||S.minFilter===We||S.minFilter===Ra||S.minFilter===Qo||S.minFilter===ns)&&Bt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(L,i.TEXTURE_WRAP_S,j[S.wrapS]),i.texParameteri(L,i.TEXTURE_WRAP_T,j[S.wrapT]),(L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY)&&i.texParameteri(L,i.TEXTURE_WRAP_R,j[S.wrapR]),i.texParameteri(L,i.TEXTURE_MAG_FILTER,tt[S.magFilter]),i.texParameteri(L,i.TEXTURE_MIN_FILTER,tt[S.minFilter]),S.compareFunction&&(i.texParameteri(L,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(L,i.TEXTURE_COMPARE_FUNC,nt[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===Be||S.minFilter!==Qo&&S.minFilter!==ns||S.type===Un&&t.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||n.get(S).__currentAnisotropy){const k=t.get("EXT_texture_filter_anisotropic");i.texParameterf(L,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,s.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy}}}function St(L,S){let k=!1;L.__webglInit===void 0&&(L.__webglInit=!0,S.addEventListener("dispose",w));const K=S.source;let Q=u.get(K);Q===void 0&&(Q={},u.set(K,Q));const Y=O(S);if(Y!==L.__cacheKey){Q[Y]===void 0&&(Q[Y]={texture:i.createTexture(),usedTimes:0},r.memory.textures++,k=!0),Q[Y].usedTimes++;const At=Q[L.__cacheKey];At!==void 0&&(Q[L.__cacheKey].usedTimes--,At.usedTimes===0&&M(S)),L.__cacheKey=Y,L.__webglTexture=Q[Y].texture}return k}function Xt(L,S,k){return Math.floor(Math.floor(L/k)/S)}function ut(L,S,k,K){const Y=L.updateRanges;if(Y.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,S.width,S.height,k,K,S.data);else{Y.sort((st,ht)=>st.start-ht.start);let At=0;for(let st=1;st<Y.length;st++){const ht=Y[At],Mt=Y[st],Tt=ht.start+ht.count,ct=Xt(Mt.start,S.width,4),Wt=Xt(ht.start,S.width,4);Mt.start<=Tt+1&&ct===Wt&&Xt(Mt.start+Mt.count-1,S.width,4)===ct?ht.count=Math.max(ht.count,Mt.start+Mt.count-ht.start):(++At,Y[At]=Mt)}Y.length=At+1;const lt=i.getParameter(i.UNPACK_ROW_LENGTH),wt=i.getParameter(i.UNPACK_SKIP_PIXELS),Ut=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,S.width);for(let st=0,ht=Y.length;st<ht;st++){const Mt=Y[st],Tt=Math.floor(Mt.start/4),ct=Math.ceil(Mt.count/4),Wt=Tt%S.width,B=Math.floor(Tt/S.width),gt=ct,ot=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,Wt),i.pixelStorei(i.UNPACK_SKIP_ROWS,B),e.texSubImage2D(i.TEXTURE_2D,0,Wt,B,gt,ot,k,K,S.data)}L.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,lt),i.pixelStorei(i.UNPACK_SKIP_PIXELS,wt),i.pixelStorei(i.UNPACK_SKIP_ROWS,Ut)}}function X(L,S,k){let K=i.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(K=i.TEXTURE_2D_ARRAY),S.isData3DTexture&&(K=i.TEXTURE_3D);const Q=St(L,S),Y=S.source;e.bindTexture(K,L.__webglTexture,i.TEXTURE0+k);const At=n.get(Y);if(Y.version!==At.__version||Q===!0){e.activeTexture(i.TEXTURE0+k);const lt=Zt.getPrimaries(Zt.workingColorSpace),wt=S.colorSpace===Ei?null:Zt.getPrimaries(S.colorSpace),Ut=S.colorSpace===Ei||lt===wt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,S.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,S.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ut);let st=x(S.image,!1,s.maxTextureSize);st=fe(S,st);const ht=o.convert(S.format,S.colorSpace),Mt=o.convert(S.type);let Tt=v(S.internalFormat,ht,Mt,S.colorSpace,S.isVideoTexture);et(K,S);let ct;const Wt=S.mipmaps,B=S.isVideoTexture!==!0,gt=At.__version===void 0||Q===!0,ot=Y.dataReady,xt=b(S,st);if(S.isDepthTexture)Tt=y(S.format===is,S.type),gt&&(B?e.texStorage2D(i.TEXTURE_2D,1,Tt,st.width,st.height):e.texImage2D(i.TEXTURE_2D,0,Tt,st.width,st.height,0,ht,Mt,null));else if(S.isDataTexture)if(Wt.length>0){B&&gt&&e.texStorage2D(i.TEXTURE_2D,xt,Tt,Wt[0].width,Wt[0].height);for(let it=0,J=Wt.length;it<J;it++)ct=Wt[it],B?ot&&e.texSubImage2D(i.TEXTURE_2D,it,0,0,ct.width,ct.height,ht,Mt,ct.data):e.texImage2D(i.TEXTURE_2D,it,Tt,ct.width,ct.height,0,ht,Mt,ct.data);S.generateMipmaps=!1}else B?(gt&&e.texStorage2D(i.TEXTURE_2D,xt,Tt,st.width,st.height),ot&&ut(S,st,ht,Mt)):e.texImage2D(i.TEXTURE_2D,0,Tt,st.width,st.height,0,ht,Mt,st.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){B&&gt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,xt,Tt,Wt[0].width,Wt[0].height,st.depth);for(let it=0,J=Wt.length;it<J;it++)if(ct=Wt[it],S.format!==Tn)if(ht!==null)if(B){if(ot)if(S.layerUpdates.size>0){const at=od(ct.width,ct.height,S.format,S.type);for(const zt of S.layerUpdates){const pe=ct.data.subarray(zt*at/ct.data.BYTES_PER_ELEMENT,(zt+1)*at/ct.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,it,0,0,zt,ct.width,ct.height,1,ht,pe)}S.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,it,0,0,0,ct.width,ct.height,st.depth,ht,ct.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,it,Tt,ct.width,ct.height,st.depth,0,ct.data,0,0);else Bt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else B?ot&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,it,0,0,0,ct.width,ct.height,st.depth,ht,Mt,ct.data):e.texImage3D(i.TEXTURE_2D_ARRAY,it,Tt,ct.width,ct.height,st.depth,0,ht,Mt,ct.data)}else{B&&gt&&e.texStorage2D(i.TEXTURE_2D,xt,Tt,Wt[0].width,Wt[0].height);for(let it=0,J=Wt.length;it<J;it++)ct=Wt[it],S.format!==Tn?ht!==null?B?ot&&e.compressedTexSubImage2D(i.TEXTURE_2D,it,0,0,ct.width,ct.height,ht,ct.data):e.compressedTexImage2D(i.TEXTURE_2D,it,Tt,ct.width,ct.height,0,ct.data):Bt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):B?ot&&e.texSubImage2D(i.TEXTURE_2D,it,0,0,ct.width,ct.height,ht,Mt,ct.data):e.texImage2D(i.TEXTURE_2D,it,Tt,ct.width,ct.height,0,ht,Mt,ct.data)}else if(S.isDataArrayTexture)if(B){if(gt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,xt,Tt,st.width,st.height,st.depth),ot)if(S.layerUpdates.size>0){const it=od(st.width,st.height,S.format,S.type);for(const J of S.layerUpdates){const at=st.data.subarray(J*it/st.data.BYTES_PER_ELEMENT,(J+1)*it/st.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,J,st.width,st.height,1,ht,Mt,at)}S.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,st.width,st.height,st.depth,ht,Mt,st.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Tt,st.width,st.height,st.depth,0,ht,Mt,st.data);else if(S.isData3DTexture)B?(gt&&e.texStorage3D(i.TEXTURE_3D,xt,Tt,st.width,st.height,st.depth),ot&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,st.width,st.height,st.depth,ht,Mt,st.data)):e.texImage3D(i.TEXTURE_3D,0,Tt,st.width,st.height,st.depth,0,ht,Mt,st.data);else if(S.isFramebufferTexture){if(gt)if(B)e.texStorage2D(i.TEXTURE_2D,xt,Tt,st.width,st.height);else{let it=st.width,J=st.height;for(let at=0;at<xt;at++)e.texImage2D(i.TEXTURE_2D,at,Tt,it,J,0,ht,Mt,null),it>>=1,J>>=1}}else if(Wt.length>0){if(B&&gt){const it=Et(Wt[0]);e.texStorage2D(i.TEXTURE_2D,xt,Tt,it.width,it.height)}for(let it=0,J=Wt.length;it<J;it++)ct=Wt[it],B?ot&&e.texSubImage2D(i.TEXTURE_2D,it,0,0,ht,Mt,ct):e.texImage2D(i.TEXTURE_2D,it,Tt,ht,Mt,ct);S.generateMipmaps=!1}else if(B){if(gt){const it=Et(st);e.texStorage2D(i.TEXTURE_2D,xt,Tt,it.width,it.height)}ot&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ht,Mt,st)}else e.texImage2D(i.TEXTURE_2D,0,Tt,ht,Mt,st);p(S)&&g(K),At.__version=Y.version,S.onUpdate&&S.onUpdate(S)}L.__version=S.version}function Z(L,S,k){if(S.image.length!==6)return;const K=St(L,S),Q=S.source;e.bindTexture(i.TEXTURE_CUBE_MAP,L.__webglTexture,i.TEXTURE0+k);const Y=n.get(Q);if(Q.version!==Y.__version||K===!0){e.activeTexture(i.TEXTURE0+k);const At=Zt.getPrimaries(Zt.workingColorSpace),lt=S.colorSpace===Ei?null:Zt.getPrimaries(S.colorSpace),wt=S.colorSpace===Ei||At===lt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,S.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,S.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,wt);const Ut=S.isCompressedTexture||S.image[0].isCompressedTexture,st=S.image[0]&&S.image[0].isDataTexture,ht=[];for(let J=0;J<6;J++)!Ut&&!st?ht[J]=x(S.image[J],!0,s.maxCubemapSize):ht[J]=st?S.image[J].image:S.image[J],ht[J]=fe(S,ht[J]);const Mt=ht[0],Tt=o.convert(S.format,S.colorSpace),ct=o.convert(S.type),Wt=v(S.internalFormat,Tt,ct,S.colorSpace),B=S.isVideoTexture!==!0,gt=Y.__version===void 0||K===!0,ot=Q.dataReady;let xt=b(S,Mt);et(i.TEXTURE_CUBE_MAP,S);let it;if(Ut){B&&gt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,xt,Wt,Mt.width,Mt.height);for(let J=0;J<6;J++){it=ht[J].mipmaps;for(let at=0;at<it.length;at++){const zt=it[at];S.format!==Tn?Tt!==null?B?ot&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,at,0,0,zt.width,zt.height,Tt,zt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,at,Wt,zt.width,zt.height,0,zt.data):Bt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):B?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,at,0,0,zt.width,zt.height,Tt,ct,zt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,at,Wt,zt.width,zt.height,0,Tt,ct,zt.data)}}}else{if(it=S.mipmaps,B&&gt){it.length>0&&xt++;const J=Et(ht[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,xt,Wt,J.width,J.height)}for(let J=0;J<6;J++)if(st){B?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,ht[J].width,ht[J].height,Tt,ct,ht[J].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,Wt,ht[J].width,ht[J].height,0,Tt,ct,ht[J].data);for(let at=0;at<it.length;at++){const pe=it[at].image[J].image;B?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,at+1,0,0,pe.width,pe.height,Tt,ct,pe.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,at+1,Wt,pe.width,pe.height,0,Tt,ct,pe.data)}}else{B?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,Tt,ct,ht[J]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,Wt,Tt,ct,ht[J]);for(let at=0;at<it.length;at++){const zt=it[at];B?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,at+1,0,0,Tt,ct,zt.image[J]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,at+1,Wt,Tt,ct,zt.image[J])}}}p(S)&&g(i.TEXTURE_CUBE_MAP),Y.__version=Q.version,S.onUpdate&&S.onUpdate(S)}L.__version=S.version}function rt(L,S,k,K,Q,Y){const At=o.convert(k.format,k.colorSpace),lt=o.convert(k.type),wt=v(k.internalFormat,At,lt,k.colorSpace),Ut=n.get(S),st=n.get(k);if(st.__renderTarget=S,!Ut.__hasExternalTextures){const ht=Math.max(1,S.width>>Y),Mt=Math.max(1,S.height>>Y);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?e.texImage3D(Q,Y,wt,ht,Mt,S.depth,0,At,lt,null):e.texImage2D(Q,Y,wt,ht,Mt,0,At,lt,null)}e.bindFramebuffer(i.FRAMEBUFFER,L),ue(S)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,K,Q,st.__webglTexture,0,U(S)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,K,Q,st.__webglTexture,Y),e.bindFramebuffer(i.FRAMEBUFFER,null)}function Lt(L,S,k){if(i.bindRenderbuffer(i.RENDERBUFFER,L),S.depthBuffer){const K=S.depthTexture,Q=K&&K.isDepthTexture?K.type:null,Y=y(S.stencilBuffer,Q),At=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;ue(S)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,U(S),Y,S.width,S.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,U(S),Y,S.width,S.height):i.renderbufferStorage(i.RENDERBUFFER,Y,S.width,S.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,At,i.RENDERBUFFER,L)}else{const K=S.textures;for(let Q=0;Q<K.length;Q++){const Y=K[Q],At=o.convert(Y.format,Y.colorSpace),lt=o.convert(Y.type),wt=v(Y.internalFormat,At,lt,Y.colorSpace);ue(S)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,U(S),wt,S.width,S.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,U(S),wt,S.width,S.height):i.renderbufferStorage(i.RENDERBUFFER,wt,S.width,S.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function pt(L,S,k){const K=S.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,L),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Q=n.get(S.depthTexture);if(Q.__renderTarget=S,(!Q.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),K){if(Q.__webglInit===void 0&&(Q.__webglInit=!0,S.depthTexture.addEventListener("dispose",w)),Q.__webglTexture===void 0){Q.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,Q.__webglTexture),et(i.TEXTURE_CUBE_MAP,S.depthTexture);const Ut=o.convert(S.depthTexture.format),st=o.convert(S.depthTexture.type);let ht;S.depthTexture.format===mi?ht=i.DEPTH_COMPONENT24:S.depthTexture.format===is&&(ht=i.DEPTH24_STENCIL8);for(let Mt=0;Mt<6;Mt++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,0,ht,S.width,S.height,0,Ut,st,null)}}else F(S.depthTexture,0);const Y=Q.__webglTexture,At=U(S),lt=K?i.TEXTURE_CUBE_MAP_POSITIVE_X+k:i.TEXTURE_2D,wt=S.depthTexture.format===is?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(S.depthTexture.format===mi)ue(S)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,wt,lt,Y,0,At):i.framebufferTexture2D(i.FRAMEBUFFER,wt,lt,Y,0);else if(S.depthTexture.format===is)ue(S)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,wt,lt,Y,0,At):i.framebufferTexture2D(i.FRAMEBUFFER,wt,lt,Y,0);else throw new Error("Unknown depthTexture format")}function Ft(L){const S=n.get(L),k=L.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==L.depthTexture){const K=L.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),K){const Q=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,K.removeEventListener("dispose",Q)};K.addEventListener("dispose",Q),S.__depthDisposeCallback=Q}S.__boundDepthTexture=K}if(L.depthTexture&&!S.__autoAllocateDepthBuffer)if(k)for(let K=0;K<6;K++)pt(S.__webglFramebuffer[K],L,K);else{const K=L.texture.mipmaps;K&&K.length>0?pt(S.__webglFramebuffer[0],L,0):pt(S.__webglFramebuffer,L,0)}else if(k){S.__webglDepthbuffer=[];for(let K=0;K<6;K++)if(e.bindFramebuffer(i.FRAMEBUFFER,S.__webglFramebuffer[K]),S.__webglDepthbuffer[K]===void 0)S.__webglDepthbuffer[K]=i.createRenderbuffer(),Lt(S.__webglDepthbuffer[K],L,!1);else{const Q=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=S.__webglDepthbuffer[K];i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,Y)}}else{const K=L.texture.mipmaps;if(K&&K.length>0?e.bindFramebuffer(i.FRAMEBUFFER,S.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=i.createRenderbuffer(),Lt(S.__webglDepthbuffer,L,!1);else{const Q=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=S.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,Y)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function oe(L,S,k){const K=n.get(L);S!==void 0&&rt(K.__webglFramebuffer,L,L.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&Ft(L)}function Ot(L){const S=L.texture,k=n.get(L),K=n.get(S);L.addEventListener("dispose",T);const Q=L.textures,Y=L.isWebGLCubeRenderTarget===!0,At=Q.length>1;if(At||(K.__webglTexture===void 0&&(K.__webglTexture=i.createTexture()),K.__version=S.version,r.memory.textures++),Y){k.__webglFramebuffer=[];for(let lt=0;lt<6;lt++)if(S.mipmaps&&S.mipmaps.length>0){k.__webglFramebuffer[lt]=[];for(let wt=0;wt<S.mipmaps.length;wt++)k.__webglFramebuffer[lt][wt]=i.createFramebuffer()}else k.__webglFramebuffer[lt]=i.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){k.__webglFramebuffer=[];for(let lt=0;lt<S.mipmaps.length;lt++)k.__webglFramebuffer[lt]=i.createFramebuffer()}else k.__webglFramebuffer=i.createFramebuffer();if(At)for(let lt=0,wt=Q.length;lt<wt;lt++){const Ut=n.get(Q[lt]);Ut.__webglTexture===void 0&&(Ut.__webglTexture=i.createTexture(),r.memory.textures++)}if(L.samples>0&&ue(L)===!1){k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let lt=0;lt<Q.length;lt++){const wt=Q[lt];k.__webglColorRenderbuffer[lt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[lt]);const Ut=o.convert(wt.format,wt.colorSpace),st=o.convert(wt.type),ht=v(wt.internalFormat,Ut,st,wt.colorSpace,L.isXRRenderTarget===!0),Mt=U(L);i.renderbufferStorageMultisample(i.RENDERBUFFER,Mt,ht,L.width,L.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+lt,i.RENDERBUFFER,k.__webglColorRenderbuffer[lt])}i.bindRenderbuffer(i.RENDERBUFFER,null),L.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),Lt(k.__webglDepthRenderbuffer,L,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Y){e.bindTexture(i.TEXTURE_CUBE_MAP,K.__webglTexture),et(i.TEXTURE_CUBE_MAP,S);for(let lt=0;lt<6;lt++)if(S.mipmaps&&S.mipmaps.length>0)for(let wt=0;wt<S.mipmaps.length;wt++)rt(k.__webglFramebuffer[lt][wt],L,S,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,wt);else rt(k.__webglFramebuffer[lt],L,S,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0);p(S)&&g(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(At){for(let lt=0,wt=Q.length;lt<wt;lt++){const Ut=Q[lt],st=n.get(Ut);let ht=i.TEXTURE_2D;(L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(ht=L.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ht,st.__webglTexture),et(ht,Ut),rt(k.__webglFramebuffer,L,Ut,i.COLOR_ATTACHMENT0+lt,ht,0),p(Ut)&&g(ht)}e.unbindTexture()}else{let lt=i.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(lt=L.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(lt,K.__webglTexture),et(lt,S),S.mipmaps&&S.mipmaps.length>0)for(let wt=0;wt<S.mipmaps.length;wt++)rt(k.__webglFramebuffer[wt],L,S,i.COLOR_ATTACHMENT0,lt,wt);else rt(k.__webglFramebuffer,L,S,i.COLOR_ATTACHMENT0,lt,0);p(S)&&g(lt),e.unbindTexture()}L.depthBuffer&&Ft(L)}function Rt(L){const S=L.textures;for(let k=0,K=S.length;k<K;k++){const Q=S[k];if(p(Q)){const Y=_(L),At=n.get(Q).__webglTexture;e.bindTexture(Y,At),g(Y),e.unbindTexture()}}}const Vt=[],Pt=[];function se(L){if(L.samples>0){if(ue(L)===!1){const S=L.textures,k=L.width,K=L.height;let Q=i.COLOR_BUFFER_BIT;const Y=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,At=n.get(L),lt=S.length>1;if(lt)for(let Ut=0;Ut<S.length;Ut++)e.bindFramebuffer(i.FRAMEBUFFER,At.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ut,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,At.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ut,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,At.__webglMultisampledFramebuffer);const wt=L.texture.mipmaps;wt&&wt.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,At.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,At.__webglFramebuffer);for(let Ut=0;Ut<S.length;Ut++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),lt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,At.__webglColorRenderbuffer[Ut]);const st=n.get(S[Ut]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,st,0)}i.blitFramebuffer(0,0,k,K,0,0,k,K,Q,i.NEAREST),l===!0&&(Vt.length=0,Pt.length=0,Vt.push(i.COLOR_ATTACHMENT0+Ut),L.depthBuffer&&L.resolveDepthBuffer===!1&&(Vt.push(Y),Pt.push(Y),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Pt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Vt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),lt)for(let Ut=0;Ut<S.length;Ut++){e.bindFramebuffer(i.FRAMEBUFFER,At.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ut,i.RENDERBUFFER,At.__webglColorRenderbuffer[Ut]);const st=n.get(S[Ut]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,At.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Ut,i.TEXTURE_2D,st,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,At.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.resolveDepthBuffer===!1&&l){const S=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[S])}}}function U(L){return Math.min(s.maxSamples,L.samples)}function ue(L){const S=n.get(L);return L.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function Jt(L){const S=r.render.frame;h.get(L)!==S&&(h.set(L,S),L.update())}function fe(L,S){const k=L.colorSpace,K=L.format,Q=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||k!==Hs&&k!==Ei&&(Zt.getTransfer(k)===le?(K!==Tn||Q!==pn)&&Bt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):te("WebGLTextures: Unsupported texture color space:",k)),S}function Et(L){return typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement?(c.width=L.naturalWidth||L.width,c.height=L.naturalHeight||L.height):typeof VideoFrame<"u"&&L instanceof VideoFrame?(c.width=L.displayWidth,c.height=L.displayHeight):(c.width=L.width,c.height=L.height),c}this.allocateTextureUnit=D,this.resetTextureUnits=N,this.setTexture2D=F,this.setTexture2DArray=I,this.setTexture3D=z,this.setTextureCube=W,this.rebindTextures=oe,this.setupRenderTarget=Ot,this.updateRenderTargetMipmap=Rt,this.updateMultisampleRenderTarget=se,this.setupDepthRenderbuffer=Ft,this.setupFrameBufferTexture=rt,this.useMultisampledRTT=ue,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function Vy(i,t){function e(n,s=Ei){let o;const r=Zt.getTransfer(s);if(n===pn)return i.UNSIGNED_BYTE;if(n===Oc)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Uc)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Ff)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Nf)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Df)return i.BYTE;if(n===If)return i.SHORT;if(n===Fo)return i.UNSIGNED_SHORT;if(n===Nc)return i.INT;if(n===Gn)return i.UNSIGNED_INT;if(n===Un)return i.FLOAT;if(n===pi)return i.HALF_FLOAT;if(n===Of)return i.ALPHA;if(n===Uf)return i.RGB;if(n===Tn)return i.RGBA;if(n===mi)return i.DEPTH_COMPONENT;if(n===is)return i.DEPTH_STENCIL;if(n===Bf)return i.RED;if(n===Bc)return i.RED_INTEGER;if(n===Vs)return i.RG;if(n===zc)return i.RG_INTEGER;if(n===kc)return i.RGBA_INTEGER;if(n===Wr||n===qr||n===Xr||n===$r)if(r===le)if(o=t.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(n===Wr)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===qr)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Xr)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===$r)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=t.get("WEBGL_compressed_texture_s3tc"),o!==null){if(n===Wr)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===qr)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Xr)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===$r)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Gl||n===Wl||n===ql||n===Xl)if(o=t.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(n===Gl)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Wl)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ql)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Xl)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===$l||n===Yl||n===jl||n===Kl||n===Zl||n===Jl||n===Ql)if(o=t.get("WEBGL_compressed_texture_etc"),o!==null){if(n===$l||n===Yl)return r===le?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(n===jl)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC;if(n===Kl)return o.COMPRESSED_R11_EAC;if(n===Zl)return o.COMPRESSED_SIGNED_R11_EAC;if(n===Jl)return o.COMPRESSED_RG11_EAC;if(n===Ql)return o.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===tc||n===ec||n===nc||n===ic||n===sc||n===oc||n===rc||n===ac||n===lc||n===cc||n===hc||n===dc||n===uc||n===fc)if(o=t.get("WEBGL_compressed_texture_astc"),o!==null){if(n===tc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ec)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===nc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ic)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===sc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===oc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===rc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ac)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===lc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===cc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===hc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===dc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===uc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===fc)return r===le?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===pc||n===mc||n===gc)if(o=t.get("EXT_texture_compression_bptc"),o!==null){if(n===pc)return r===le?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===mc)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===gc)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===xc||n===_c||n===vc||n===yc)if(o=t.get("EXT_texture_compression_rgtc"),o!==null){if(n===xc)return o.COMPRESSED_RED_RGTC1_EXT;if(n===_c)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===vc)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===yc)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===No?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}const Hy=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Gy=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Wy{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new Qf(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new qn({vertexShader:Hy,fragmentShader:Gy,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Je(new Ws(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class qy extends Ks{constructor(t,e){super();const n=this;let s=null,o=1,r=null,a="local-floor",l=1,c=null,h=null,d=null,u=null,f=null,m=null;const x=typeof XRWebGLBinding<"u",p=new Wy,g={},_=e.getContextAttributes();let v=null,y=null;const b=[],w=[],T=new ne;let P=null;const M=new on;M.viewport=new we;const E=new on;E.viewport=new we;const R=[M,E],N=new e0;let D=null,O=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let Z=b[X];return Z===void 0&&(Z=new Ka,b[X]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(X){let Z=b[X];return Z===void 0&&(Z=new Ka,b[X]=Z),Z.getGripSpace()},this.getHand=function(X){let Z=b[X];return Z===void 0&&(Z=new Ka,b[X]=Z),Z.getHandSpace()};function F(X){const Z=w.indexOf(X.inputSource);if(Z===-1)return;const rt=b[Z];rt!==void 0&&(rt.update(X.inputSource,X.frame,c||r),rt.dispatchEvent({type:X.type,data:X.inputSource}))}function I(){s.removeEventListener("select",F),s.removeEventListener("selectstart",F),s.removeEventListener("selectend",F),s.removeEventListener("squeeze",F),s.removeEventListener("squeezestart",F),s.removeEventListener("squeezeend",F),s.removeEventListener("end",I),s.removeEventListener("inputsourceschange",z);for(let X=0;X<b.length;X++){const Z=w[X];Z!==null&&(w[X]=null,b[X].disconnect(Z))}D=null,O=null,p.reset();for(const X in g)delete g[X];t.setRenderTarget(v),f=null,u=null,d=null,s=null,y=null,ut.stop(),n.isPresenting=!1,t.setPixelRatio(P),t.setSize(T.width,T.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){o=X,n.isPresenting===!0&&Bt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){a=X,n.isPresenting===!0&&Bt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(X){c=X},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d===null&&x&&(d=new XRWebGLBinding(s,e)),d},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(X){if(s=X,s!==null){if(v=t.getRenderTarget(),s.addEventListener("select",F),s.addEventListener("selectstart",F),s.addEventListener("selectend",F),s.addEventListener("squeeze",F),s.addEventListener("squeezestart",F),s.addEventListener("squeezeend",F),s.addEventListener("end",I),s.addEventListener("inputsourceschange",z),_.xrCompatible!==!0&&await e.makeXRCompatible(),P=t.getPixelRatio(),t.getSize(T),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let rt=null,Lt=null,pt=null;_.depth&&(pt=_.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,rt=_.stencil?is:mi,Lt=_.stencil?No:Gn);const Ft={colorFormat:e.RGBA8,depthFormat:pt,scaleFactor:o};d=this.getBinding(),u=d.createProjectionLayer(Ft),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),y=new kn(u.textureWidth,u.textureHeight,{format:Tn,type:pn,depthTexture:new Bo(u.textureWidth,u.textureHeight,Lt,void 0,void 0,void 0,void 0,void 0,void 0,rt),stencilBuffer:_.stencil,colorSpace:t.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{const rt={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:o};f=new XRWebGLLayer(s,e,rt),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new kn(f.framebufferWidth,f.framebufferHeight,{format:Tn,type:pn,colorSpace:t.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,r=await s.requestReferenceSpace(a),ut.setContext(s),ut.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function z(X){for(let Z=0;Z<X.removed.length;Z++){const rt=X.removed[Z],Lt=w.indexOf(rt);Lt>=0&&(w[Lt]=null,b[Lt].disconnect(rt))}for(let Z=0;Z<X.added.length;Z++){const rt=X.added[Z];let Lt=w.indexOf(rt);if(Lt===-1){for(let Ft=0;Ft<b.length;Ft++)if(Ft>=w.length){w.push(rt),Lt=Ft;break}else if(w[Ft]===null){w[Ft]=rt,Lt=Ft;break}if(Lt===-1)break}const pt=b[Lt];pt&&pt.connect(rt)}}const W=new H,j=new H;function tt(X,Z,rt){W.setFromMatrixPosition(Z.matrixWorld),j.setFromMatrixPosition(rt.matrixWorld);const Lt=W.distanceTo(j),pt=Z.projectionMatrix.elements,Ft=rt.projectionMatrix.elements,oe=pt[14]/(pt[10]-1),Ot=pt[14]/(pt[10]+1),Rt=(pt[9]+1)/pt[5],Vt=(pt[9]-1)/pt[5],Pt=(pt[8]-1)/pt[0],se=(Ft[8]+1)/Ft[0],U=oe*Pt,ue=oe*se,Jt=Lt/(-Pt+se),fe=Jt*-Pt;if(Z.matrixWorld.decompose(X.position,X.quaternion,X.scale),X.translateX(fe),X.translateZ(Jt),X.matrixWorld.compose(X.position,X.quaternion,X.scale),X.matrixWorldInverse.copy(X.matrixWorld).invert(),pt[10]===-1)X.projectionMatrix.copy(Z.projectionMatrix),X.projectionMatrixInverse.copy(Z.projectionMatrixInverse);else{const Et=oe+Jt,L=Ot+Jt,S=U-fe,k=ue+(Lt-fe),K=Rt*Ot/L*Et,Q=Vt*Ot/L*Et;X.projectionMatrix.makePerspective(S,k,K,Q,Et,L),X.projectionMatrixInverse.copy(X.projectionMatrix).invert()}}function nt(X,Z){Z===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(Z.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(s===null)return;let Z=X.near,rt=X.far;p.texture!==null&&(p.depthNear>0&&(Z=p.depthNear),p.depthFar>0&&(rt=p.depthFar)),N.near=E.near=M.near=Z,N.far=E.far=M.far=rt,(D!==N.near||O!==N.far)&&(s.updateRenderState({depthNear:N.near,depthFar:N.far}),D=N.near,O=N.far),N.layers.mask=X.layers.mask|6,M.layers.mask=N.layers.mask&3,E.layers.mask=N.layers.mask&5;const Lt=X.parent,pt=N.cameras;nt(N,Lt);for(let Ft=0;Ft<pt.length;Ft++)nt(pt[Ft],Lt);pt.length===2?tt(N,M,E):N.projectionMatrix.copy(M.projectionMatrix),et(X,N,Lt)};function et(X,Z,rt){rt===null?X.matrix.copy(Z.matrixWorld):(X.matrix.copy(rt.matrixWorld),X.matrix.invert(),X.matrix.multiply(Z.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(Z.projectionMatrix),X.projectionMatrixInverse.copy(Z.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=Uo*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return N},this.getFoveation=function(){if(!(u===null&&f===null))return l},this.setFoveation=function(X){l=X,u!==null&&(u.fixedFoveation=X),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=X)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(N)},this.getCameraTexture=function(X){return g[X]};let St=null;function Xt(X,Z){if(h=Z.getViewerPose(c||r),m=Z,h!==null){const rt=h.views;f!==null&&(t.setRenderTargetFramebuffer(y,f.framebuffer),t.setRenderTarget(y));let Lt=!1;rt.length!==N.cameras.length&&(N.cameras.length=0,Lt=!0);for(let Ot=0;Ot<rt.length;Ot++){const Rt=rt[Ot];let Vt=null;if(f!==null)Vt=f.getViewport(Rt);else{const se=d.getViewSubImage(u,Rt);Vt=se.viewport,Ot===0&&(t.setRenderTargetTextures(y,se.colorTexture,se.depthStencilTexture),t.setRenderTarget(y))}let Pt=R[Ot];Pt===void 0&&(Pt=new on,Pt.layers.enable(Ot),Pt.viewport=new we,R[Ot]=Pt),Pt.matrix.fromArray(Rt.transform.matrix),Pt.matrix.decompose(Pt.position,Pt.quaternion,Pt.scale),Pt.projectionMatrix.fromArray(Rt.projectionMatrix),Pt.projectionMatrixInverse.copy(Pt.projectionMatrix).invert(),Pt.viewport.set(Vt.x,Vt.y,Vt.width,Vt.height),Ot===0&&(N.matrix.copy(Pt.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),Lt===!0&&N.cameras.push(Pt)}const pt=s.enabledFeatures;if(pt&&pt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&x){d=n.getBinding();const Ot=d.getDepthInformation(rt[0]);Ot&&Ot.isValid&&Ot.texture&&p.init(Ot,s.renderState)}if(pt&&pt.includes("camera-access")&&x){t.state.unbindTexture(),d=n.getBinding();for(let Ot=0;Ot<rt.length;Ot++){const Rt=rt[Ot].camera;if(Rt){let Vt=g[Rt];Vt||(Vt=new Qf,g[Rt]=Vt);const Pt=d.getCameraImage(Rt);Vt.sourceTexture=Pt}}}}for(let rt=0;rt<b.length;rt++){const Lt=w[rt],pt=b[rt];Lt!==null&&pt!==void 0&&pt.update(Lt,Z,c||r)}St&&St(X,Z),Z.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Z}),m=null}const ut=new ep;ut.setAnimationLoop(Xt),this.setAnimationLoop=function(X){St=X},this.dispose=function(){}}}const Wi=new Wn,Xy=new be;function $y(i,t){function e(p,g){p.matrixAutoUpdate===!0&&p.updateMatrix(),g.value.copy(p.matrix)}function n(p,g){g.color.getRGB(p.fogColor.value,Yf(i)),g.isFog?(p.fogNear.value=g.near,p.fogFar.value=g.far):g.isFogExp2&&(p.fogDensity.value=g.density)}function s(p,g,_,v,y){g.isMeshBasicMaterial||g.isMeshLambertMaterial?o(p,g):g.isMeshToonMaterial?(o(p,g),d(p,g)):g.isMeshPhongMaterial?(o(p,g),h(p,g)):g.isMeshStandardMaterial?(o(p,g),u(p,g),g.isMeshPhysicalMaterial&&f(p,g,y)):g.isMeshMatcapMaterial?(o(p,g),m(p,g)):g.isMeshDepthMaterial?o(p,g):g.isMeshDistanceMaterial?(o(p,g),x(p,g)):g.isMeshNormalMaterial?o(p,g):g.isLineBasicMaterial?(r(p,g),g.isLineDashedMaterial&&a(p,g)):g.isPointsMaterial?l(p,g,_,v):g.isSpriteMaterial?c(p,g):g.isShadowMaterial?(p.color.value.copy(g.color),p.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function o(p,g){p.opacity.value=g.opacity,g.color&&p.diffuse.value.copy(g.color),g.emissive&&p.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(p.map.value=g.map,e(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.bumpMap&&(p.bumpMap.value=g.bumpMap,e(g.bumpMap,p.bumpMapTransform),p.bumpScale.value=g.bumpScale,g.side===an&&(p.bumpScale.value*=-1)),g.normalMap&&(p.normalMap.value=g.normalMap,e(g.normalMap,p.normalMapTransform),p.normalScale.value.copy(g.normalScale),g.side===an&&p.normalScale.value.negate()),g.displacementMap&&(p.displacementMap.value=g.displacementMap,e(g.displacementMap,p.displacementMapTransform),p.displacementScale.value=g.displacementScale,p.displacementBias.value=g.displacementBias),g.emissiveMap&&(p.emissiveMap.value=g.emissiveMap,e(g.emissiveMap,p.emissiveMapTransform)),g.specularMap&&(p.specularMap.value=g.specularMap,e(g.specularMap,p.specularMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest);const _=t.get(g),v=_.envMap,y=_.envMapRotation;v&&(p.envMap.value=v,Wi.copy(y),Wi.x*=-1,Wi.y*=-1,Wi.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(Wi.y*=-1,Wi.z*=-1),p.envMapRotation.value.setFromMatrix4(Xy.makeRotationFromEuler(Wi)),p.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=g.reflectivity,p.ior.value=g.ior,p.refractionRatio.value=g.refractionRatio),g.lightMap&&(p.lightMap.value=g.lightMap,p.lightMapIntensity.value=g.lightMapIntensity,e(g.lightMap,p.lightMapTransform)),g.aoMap&&(p.aoMap.value=g.aoMap,p.aoMapIntensity.value=g.aoMapIntensity,e(g.aoMap,p.aoMapTransform))}function r(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,g.map&&(p.map.value=g.map,e(g.map,p.mapTransform))}function a(p,g){p.dashSize.value=g.dashSize,p.totalSize.value=g.dashSize+g.gapSize,p.scale.value=g.scale}function l(p,g,_,v){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.size.value=g.size*_,p.scale.value=v*.5,g.map&&(p.map.value=g.map,e(g.map,p.uvTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function c(p,g){p.diffuse.value.copy(g.color),p.opacity.value=g.opacity,p.rotation.value=g.rotation,g.map&&(p.map.value=g.map,e(g.map,p.mapTransform)),g.alphaMap&&(p.alphaMap.value=g.alphaMap,e(g.alphaMap,p.alphaMapTransform)),g.alphaTest>0&&(p.alphaTest.value=g.alphaTest)}function h(p,g){p.specular.value.copy(g.specular),p.shininess.value=Math.max(g.shininess,1e-4)}function d(p,g){g.gradientMap&&(p.gradientMap.value=g.gradientMap)}function u(p,g){p.metalness.value=g.metalness,g.metalnessMap&&(p.metalnessMap.value=g.metalnessMap,e(g.metalnessMap,p.metalnessMapTransform)),p.roughness.value=g.roughness,g.roughnessMap&&(p.roughnessMap.value=g.roughnessMap,e(g.roughnessMap,p.roughnessMapTransform)),g.envMap&&(p.envMapIntensity.value=g.envMapIntensity)}function f(p,g,_){p.ior.value=g.ior,g.sheen>0&&(p.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),p.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(p.sheenColorMap.value=g.sheenColorMap,e(g.sheenColorMap,p.sheenColorMapTransform)),g.sheenRoughnessMap&&(p.sheenRoughnessMap.value=g.sheenRoughnessMap,e(g.sheenRoughnessMap,p.sheenRoughnessMapTransform))),g.clearcoat>0&&(p.clearcoat.value=g.clearcoat,p.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(p.clearcoatMap.value=g.clearcoatMap,e(g.clearcoatMap,p.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,e(g.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(p.clearcoatNormalMap.value=g.clearcoatNormalMap,e(g.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===an&&p.clearcoatNormalScale.value.negate())),g.dispersion>0&&(p.dispersion.value=g.dispersion),g.iridescence>0&&(p.iridescence.value=g.iridescence,p.iridescenceIOR.value=g.iridescenceIOR,p.iridescenceThicknessMinimum.value=g.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=g.iridescenceThicknessRange[1],g.iridescenceMap&&(p.iridescenceMap.value=g.iridescenceMap,e(g.iridescenceMap,p.iridescenceMapTransform)),g.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=g.iridescenceThicknessMap,e(g.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),g.transmission>0&&(p.transmission.value=g.transmission,p.transmissionSamplerMap.value=_.texture,p.transmissionSamplerSize.value.set(_.width,_.height),g.transmissionMap&&(p.transmissionMap.value=g.transmissionMap,e(g.transmissionMap,p.transmissionMapTransform)),p.thickness.value=g.thickness,g.thicknessMap&&(p.thicknessMap.value=g.thicknessMap,e(g.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=g.attenuationDistance,p.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(p.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(p.anisotropyMap.value=g.anisotropyMap,e(g.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=g.specularIntensity,p.specularColor.value.copy(g.specularColor),g.specularColorMap&&(p.specularColorMap.value=g.specularColorMap,e(g.specularColorMap,p.specularColorMapTransform)),g.specularIntensityMap&&(p.specularIntensityMap.value=g.specularIntensityMap,e(g.specularIntensityMap,p.specularIntensityMapTransform))}function m(p,g){g.matcap&&(p.matcap.value=g.matcap)}function x(p,g){const _=t.get(g).light;p.referencePosition.value.setFromMatrixPosition(_.matrixWorld),p.nearDistance.value=_.shadow.camera.near,p.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Yy(i,t,e,n){let s={},o={},r=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(_,v){const y=v.program;n.uniformBlockBinding(_,y)}function c(_,v){let y=s[_.id];y===void 0&&(m(_),y=h(_),s[_.id]=y,_.addEventListener("dispose",p));const b=v.program;n.updateUBOMapping(_,b);const w=t.render.frame;o[_.id]!==w&&(u(_),o[_.id]=w)}function h(_){const v=d();_.__bindingPointIndex=v;const y=i.createBuffer(),b=_.__size,w=_.usage;return i.bindBuffer(i.UNIFORM_BUFFER,y),i.bufferData(i.UNIFORM_BUFFER,b,w),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,v,y),y}function d(){for(let _=0;_<a;_++)if(r.indexOf(_)===-1)return r.push(_),_;return te("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(_){const v=s[_.id],y=_.uniforms,b=_.__cache;i.bindBuffer(i.UNIFORM_BUFFER,v);for(let w=0,T=y.length;w<T;w++){const P=Array.isArray(y[w])?y[w]:[y[w]];for(let M=0,E=P.length;M<E;M++){const R=P[M];if(f(R,w,M,b)===!0){const N=R.__offset,D=Array.isArray(R.value)?R.value:[R.value];let O=0;for(let F=0;F<D.length;F++){const I=D[F],z=x(I);typeof I=="number"||typeof I=="boolean"?(R.__data[0]=I,i.bufferSubData(i.UNIFORM_BUFFER,N+O,R.__data)):I.isMatrix3?(R.__data[0]=I.elements[0],R.__data[1]=I.elements[1],R.__data[2]=I.elements[2],R.__data[3]=0,R.__data[4]=I.elements[3],R.__data[5]=I.elements[4],R.__data[6]=I.elements[5],R.__data[7]=0,R.__data[8]=I.elements[6],R.__data[9]=I.elements[7],R.__data[10]=I.elements[8],R.__data[11]=0):(I.toArray(R.__data,O),O+=z.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,N,R.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(_,v,y,b){const w=_.value,T=v+"_"+y;if(b[T]===void 0)return typeof w=="number"||typeof w=="boolean"?b[T]=w:b[T]=w.clone(),!0;{const P=b[T];if(typeof w=="number"||typeof w=="boolean"){if(P!==w)return b[T]=w,!0}else if(P.equals(w)===!1)return P.copy(w),!0}return!1}function m(_){const v=_.uniforms;let y=0;const b=16;for(let T=0,P=v.length;T<P;T++){const M=Array.isArray(v[T])?v[T]:[v[T]];for(let E=0,R=M.length;E<R;E++){const N=M[E],D=Array.isArray(N.value)?N.value:[N.value];for(let O=0,F=D.length;O<F;O++){const I=D[O],z=x(I),W=y%b,j=W%z.boundary,tt=W+j;y+=j,tt!==0&&b-tt<z.storage&&(y+=b-tt),N.__data=new Float32Array(z.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=y,y+=z.storage}}}const w=y%b;return w>0&&(y+=b-w),_.__size=y,_.__cache={},this}function x(_){const v={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(v.boundary=4,v.storage=4):_.isVector2?(v.boundary=8,v.storage=8):_.isVector3||_.isColor?(v.boundary=16,v.storage=12):_.isVector4?(v.boundary=16,v.storage=16):_.isMatrix3?(v.boundary=48,v.storage=48):_.isMatrix4?(v.boundary=64,v.storage=64):_.isTexture?Bt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):Bt("WebGLRenderer: Unsupported uniform value type.",_),v}function p(_){const v=_.target;v.removeEventListener("dispose",p);const y=r.indexOf(v.__bindingPointIndex);r.splice(y,1),i.deleteBuffer(s[v.id]),delete s[v.id],delete o[v.id]}function g(){for(const _ in s)i.deleteBuffer(s[_]);r=[],s={},o={}}return{bind:l,update:c,dispose:g}}const jy=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Pn=null;function Ky(){return Pn===null&&(Pn=new Gg(jy,16,16,Vs,pi),Pn.name="DFG_LUT",Pn.minFilter=We,Pn.magFilter=We,Pn.wrapS=li,Pn.wrapT=li,Pn.generateMipmaps=!1,Pn.needsUpdate=!0),Pn}class cl{constructor(t={}){const{canvas:e=ng(),context:n=null,depth:s=!0,stencil:o=!1,alpha:r=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:f=pn}=t;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=r;const x=f,p=new Set([kc,zc,Bc]),g=new Set([pn,Gn,Fo,No,Oc,Uc]),_=new Uint32Array(4),v=new Int32Array(4);let y=null,b=null;const w=[],T=[];let P=null;this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=zn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const M=this;let E=!1;this._outputColorSpace=vn;let R=0,N=0,D=null,O=-1,F=null;const I=new we,z=new we;let W=null;const j=new qt(0);let tt=0,nt=e.width,et=e.height,St=1,Xt=null,ut=null;const X=new we(0,0,nt,et),Z=new we(0,0,nt,et);let rt=!1;const Lt=new qc;let pt=!1,Ft=!1;const oe=new be,Ot=new H,Rt=new we,Vt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Pt=!1;function se(){return D===null?St:1}let U=n;function ue(C,V){return e.getContext(C,V)}try{const C={alpha:!0,depth:s,stencil:o,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Fc}`),e.addEventListener("webglcontextlost",zt,!1),e.addEventListener("webglcontextrestored",pe,!1),e.addEventListener("webglcontextcreationerror",re,!1),U===null){const V="webgl2";if(U=ue(V,C),U===null)throw ue(V)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(C){throw te("WebGLRenderer: "+C.message),C}let Jt,fe,Et,L,S,k,K,Q,Y,At,lt,wt,Ut,st,ht,Mt,Tt,ct,Wt,B,gt,ot,xt,it;function J(){Jt=new K_(U),Jt.init(),ot=new Vy(U,Jt),fe=new V_(U,Jt,t,ot),Et=new zy(U,Jt),fe.reversedDepthBuffer&&u&&Et.buffers.depth.setReversed(!0),L=new Q_(U),S=new wy,k=new ky(U,Jt,Et,S,fe,ot,L),K=new G_(M),Q=new j_(M),Y=new i0(U),xt=new z_(U,Y),At=new Z_(U,Y,L,xt),lt=new ev(U,At,Y,L),Wt=new tv(U,fe,k),Mt=new H_(S),wt=new Sy(M,K,Q,Jt,fe,xt,Mt),Ut=new $y(M,S),st=new Ty,ht=new Dy(Jt),ct=new B_(M,K,Q,Et,lt,m,l),Tt=new Uy(M,lt,fe),it=new Yy(U,L,fe,Et),B=new k_(U,Jt,L),gt=new J_(U,Jt,L),L.programs=wt.programs,M.capabilities=fe,M.extensions=Jt,M.properties=S,M.renderLists=st,M.shadowMap=Tt,M.state=Et,M.info=L}J(),x!==pn&&(P=new iv(x,e.width,e.height,s,o));const at=new qy(M,U);this.xr=at,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){const C=Jt.get("WEBGL_lose_context");C&&C.loseContext()},this.forceContextRestore=function(){const C=Jt.get("WEBGL_lose_context");C&&C.restoreContext()},this.getPixelRatio=function(){return St},this.setPixelRatio=function(C){C!==void 0&&(St=C,this.setSize(nt,et,!1))},this.getSize=function(C){return C.set(nt,et)},this.setSize=function(C,V,$=!0){if(at.isPresenting){Bt("WebGLRenderer: Can't change size while VR device is presenting.");return}nt=C,et=V,e.width=Math.floor(C*St),e.height=Math.floor(V*St),$===!0&&(e.style.width=C+"px",e.style.height=V+"px"),P!==null&&P.setSize(e.width,e.height),this.setViewport(0,0,C,V)},this.getDrawingBufferSize=function(C){return C.set(nt*St,et*St).floor()},this.setDrawingBufferSize=function(C,V,$){nt=C,et=V,St=$,e.width=Math.floor(C*$),e.height=Math.floor(V*$),this.setViewport(0,0,C,V)},this.setEffects=function(C){if(x===pn){console.error("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(C){for(let V=0;V<C.length;V++)if(C[V].isOutputPass===!0){console.warn("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}P.setEffects(C||[])},this.getCurrentViewport=function(C){return C.copy(I)},this.getViewport=function(C){return C.copy(X)},this.setViewport=function(C,V,$,q){C.isVector4?X.set(C.x,C.y,C.z,C.w):X.set(C,V,$,q),Et.viewport(I.copy(X).multiplyScalar(St).round())},this.getScissor=function(C){return C.copy(Z)},this.setScissor=function(C,V,$,q){C.isVector4?Z.set(C.x,C.y,C.z,C.w):Z.set(C,V,$,q),Et.scissor(z.copy(Z).multiplyScalar(St).round())},this.getScissorTest=function(){return rt},this.setScissorTest=function(C){Et.setScissorTest(rt=C)},this.setOpaqueSort=function(C){Xt=C},this.setTransparentSort=function(C){ut=C},this.getClearColor=function(C){return C.copy(ct.getClearColor())},this.setClearColor=function(){ct.setClearColor(...arguments)},this.getClearAlpha=function(){return ct.getClearAlpha()},this.setClearAlpha=function(){ct.setClearAlpha(...arguments)},this.clear=function(C=!0,V=!0,$=!0){let q=0;if(C){let G=!1;if(D!==null){const dt=D.texture.format;G=p.has(dt)}if(G){const dt=D.texture.type,_t=g.has(dt),mt=ct.getClearColor(),bt=ct.getClearAlpha(),Ct=mt.r,Nt=mt.g,Dt=mt.b;_t?(_[0]=Ct,_[1]=Nt,_[2]=Dt,_[3]=bt,U.clearBufferuiv(U.COLOR,0,_)):(v[0]=Ct,v[1]=Nt,v[2]=Dt,v[3]=bt,U.clearBufferiv(U.COLOR,0,v))}else q|=U.COLOR_BUFFER_BIT}V&&(q|=U.DEPTH_BUFFER_BIT),$&&(q|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),U.clear(q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",zt,!1),e.removeEventListener("webglcontextrestored",pe,!1),e.removeEventListener("webglcontextcreationerror",re,!1),ct.dispose(),st.dispose(),ht.dispose(),S.dispose(),K.dispose(),Q.dispose(),lt.dispose(),xt.dispose(),it.dispose(),wt.dispose(),at.dispose(),at.removeEventListener("sessionstart",vh),at.removeEventListener("sessionend",yh),Ui.stop()};function zt(C){C.preventDefault(),Fh("WebGLRenderer: Context Lost."),E=!0}function pe(){Fh("WebGLRenderer: Context Restored."),E=!1;const C=L.autoReset,V=Tt.enabled,$=Tt.autoUpdate,q=Tt.needsUpdate,G=Tt.type;J(),L.autoReset=C,Tt.enabled=V,Tt.autoUpdate=$,Tt.needsUpdate=q,Tt.type=G}function re(C){te("WebGLRenderer: A WebGL context could not be created. Reason: ",C.statusMessage)}function Rn(C){const V=C.target;V.removeEventListener("dispose",Rn),Xn(V)}function Xn(C){gm(C),S.remove(C)}function gm(C){const V=S.get(C).programs;V!==void 0&&(V.forEach(function($){wt.releaseProgram($)}),C.isShaderMaterial&&wt.releaseShaderCache(C))}this.renderBufferDirect=function(C,V,$,q,G,dt){V===null&&(V=Vt);const _t=G.isMesh&&G.matrixWorld.determinant()<0,mt=_m(C,V,$,q,G);Et.setMaterial(q,_t);let bt=$.index,Ct=1;if(q.wireframe===!0){if(bt=At.getWireframeAttribute($),bt===void 0)return;Ct=2}const Nt=$.drawRange,Dt=$.attributes.position;let $t=Nt.start*Ct,he=(Nt.start+Nt.count)*Ct;dt!==null&&($t=Math.max($t,dt.start*Ct),he=Math.min(he,(dt.start+dt.count)*Ct)),bt!==null?($t=Math.max($t,0),he=Math.min(he,bt.count)):Dt!=null&&($t=Math.max($t,0),he=Math.min(he,Dt.count));const Me=he-$t;if(Me<0||Me===1/0)return;xt.setup(G,q,mt,$,bt);let Se,de=B;if(bt!==null&&(Se=Y.get(bt),de=gt,de.setIndex(Se)),G.isMesh)q.wireframe===!0?(Et.setLineWidth(q.wireframeLinewidth*se()),de.setMode(U.LINES)):de.setMode(U.TRIANGLES);else if(G.isLine){let It=q.linewidth;It===void 0&&(It=1),Et.setLineWidth(It*se()),G.isLineSegments?de.setMode(U.LINES):G.isLineLoop?de.setMode(U.LINE_LOOP):de.setMode(U.LINE_STRIP)}else G.isPoints?de.setMode(U.POINTS):G.isSprite&&de.setMode(U.TRIANGLES);if(G.isBatchedMesh)if(G._multiDrawInstances!==null)Oo("WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),de.renderMultiDrawInstances(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount,G._multiDrawInstances);else if(Jt.get("WEBGL_multi_draw"))de.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{const It=G._multiDrawStarts,ae=G._multiDrawCounts,Qt=G._multiDrawCount,cn=bt?Y.get(bt).bytesPerElement:1,hs=S.get(q).currentProgram.getUniforms();for(let hn=0;hn<Qt;hn++)hs.setValue(U,"_gl_DrawID",hn),de.render(It[hn]/cn,ae[hn])}else if(G.isInstancedMesh)de.renderInstances($t,Me,G.count);else if($.isInstancedBufferGeometry){const It=$._maxInstanceCount!==void 0?$._maxInstanceCount:1/0,ae=Math.min($.instanceCount,It);de.renderInstances($t,Me,ae)}else de.render($t,Me)};function _h(C,V,$){C.transparent===!0&&C.side===ai&&C.forceSinglePass===!1?(C.side=an,C.needsUpdate=!0,Jo(C,V,$),C.side=Di,C.needsUpdate=!0,Jo(C,V,$),C.side=ai):Jo(C,V,$)}this.compile=function(C,V,$=null){$===null&&($=C),b=ht.get($),b.init(V),T.push(b),$.traverseVisible(function(G){G.isLight&&G.layers.test(V.layers)&&(b.pushLight(G),G.castShadow&&b.pushShadow(G))}),C!==$&&C.traverseVisible(function(G){G.isLight&&G.layers.test(V.layers)&&(b.pushLight(G),G.castShadow&&b.pushShadow(G))}),b.setupLights();const q=new Set;return C.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;const dt=G.material;if(dt)if(Array.isArray(dt))for(let _t=0;_t<dt.length;_t++){const mt=dt[_t];_h(mt,$,G),q.add(mt)}else _h(dt,$,G),q.add(dt)}),b=T.pop(),q},this.compileAsync=function(C,V,$=null){const q=this.compile(C,V,$);return new Promise(G=>{function dt(){if(q.forEach(function(_t){S.get(_t).currentProgram.isReady()&&q.delete(_t)}),q.size===0){G(C);return}setTimeout(dt,10)}Jt.get("KHR_parallel_shader_compile")!==null?dt():setTimeout(dt,10)})};let Ta=null;function xm(C){Ta&&Ta(C)}function vh(){Ui.stop()}function yh(){Ui.start()}const Ui=new ep;Ui.setAnimationLoop(xm),typeof self<"u"&&Ui.setContext(self),this.setAnimationLoop=function(C){Ta=C,at.setAnimationLoop(C),C===null?Ui.stop():Ui.start()},at.addEventListener("sessionstart",vh),at.addEventListener("sessionend",yh),this.render=function(C,V){if(V!==void 0&&V.isCamera!==!0){te("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(E===!0)return;const $=at.enabled===!0&&at.isPresenting===!0,q=P!==null&&(D===null||$)&&P.begin(M,D);if(C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),V.parent===null&&V.matrixWorldAutoUpdate===!0&&V.updateMatrixWorld(),at.enabled===!0&&at.isPresenting===!0&&(P===null||P.isCompositing()===!1)&&(at.cameraAutoUpdate===!0&&at.updateCamera(V),V=at.getCamera()),C.isScene===!0&&C.onBeforeRender(M,C,V,D),b=ht.get(C,T.length),b.init(V),T.push(b),oe.multiplyMatrices(V.projectionMatrix,V.matrixWorldInverse),Lt.setFromProjectionMatrix(oe,Bn,V.reversedDepth),Ft=this.localClippingEnabled,pt=Mt.init(this.clippingPlanes,Ft),y=st.get(C,w.length),y.init(),w.push(y),at.enabled===!0&&at.isPresenting===!0){const _t=M.xr.getDepthSensingMesh();_t!==null&&Aa(_t,V,-1/0,M.sortObjects)}Aa(C,V,0,M.sortObjects),y.finish(),M.sortObjects===!0&&y.sort(Xt,ut),Pt=at.enabled===!1||at.isPresenting===!1||at.hasDepthSensing()===!1,Pt&&ct.addToRenderList(y,C),this.info.render.frame++,pt===!0&&Mt.beginShadows();const G=b.state.shadowsArray;if(Tt.render(G,C,V),pt===!0&&Mt.endShadows(),this.info.autoReset===!0&&this.info.reset(),(q&&P.hasRenderPass())===!1){const _t=y.opaque,mt=y.transmissive;if(b.setupLights(),V.isArrayCamera){const bt=V.cameras;if(mt.length>0)for(let Ct=0,Nt=bt.length;Ct<Nt;Ct++){const Dt=bt[Ct];Mh(_t,mt,C,Dt)}Pt&&ct.render(C);for(let Ct=0,Nt=bt.length;Ct<Nt;Ct++){const Dt=bt[Ct];bh(y,C,Dt,Dt.viewport)}}else mt.length>0&&Mh(_t,mt,C,V),Pt&&ct.render(C),bh(y,C,V)}D!==null&&N===0&&(k.updateMultisampleRenderTarget(D),k.updateRenderTargetMipmap(D)),q&&P.end(M),C.isScene===!0&&C.onAfterRender(M,C,V),xt.resetDefaultState(),O=-1,F=null,T.pop(),T.length>0?(b=T[T.length-1],pt===!0&&Mt.setGlobalState(M.clippingPlanes,b.state.camera)):b=null,w.pop(),w.length>0?y=w[w.length-1]:y=null};function Aa(C,V,$,q){if(C.visible===!1)return;if(C.layers.test(V.layers)){if(C.isGroup)$=C.renderOrder;else if(C.isLOD)C.autoUpdate===!0&&C.update(V);else if(C.isLight)b.pushLight(C),C.castShadow&&b.pushShadow(C);else if(C.isSprite){if(!C.frustumCulled||Lt.intersectsSprite(C)){q&&Rt.setFromMatrixPosition(C.matrixWorld).applyMatrix4(oe);const _t=lt.update(C),mt=C.material;mt.visible&&y.push(C,_t,mt,$,Rt.z,null)}}else if((C.isMesh||C.isLine||C.isPoints)&&(!C.frustumCulled||Lt.intersectsObject(C))){const _t=lt.update(C),mt=C.material;if(q&&(C.boundingSphere!==void 0?(C.boundingSphere===null&&C.computeBoundingSphere(),Rt.copy(C.boundingSphere.center)):(_t.boundingSphere===null&&_t.computeBoundingSphere(),Rt.copy(_t.boundingSphere.center)),Rt.applyMatrix4(C.matrixWorld).applyMatrix4(oe)),Array.isArray(mt)){const bt=_t.groups;for(let Ct=0,Nt=bt.length;Ct<Nt;Ct++){const Dt=bt[Ct],$t=mt[Dt.materialIndex];$t&&$t.visible&&y.push(C,_t,$t,$,Rt.z,Dt)}}else mt.visible&&y.push(C,_t,mt,$,Rt.z,null)}}const dt=C.children;for(let _t=0,mt=dt.length;_t<mt;_t++)Aa(dt[_t],V,$,q)}function bh(C,V,$,q){const{opaque:G,transmissive:dt,transparent:_t}=C;b.setupLightsView($),pt===!0&&Mt.setGlobalState(M.clippingPlanes,$),q&&Et.viewport(I.copy(q)),G.length>0&&Zo(G,V,$),dt.length>0&&Zo(dt,V,$),_t.length>0&&Zo(_t,V,$),Et.buffers.depth.setTest(!0),Et.buffers.depth.setMask(!0),Et.buffers.color.setMask(!0),Et.setPolygonOffset(!1)}function Mh(C,V,$,q){if(($.isScene===!0?$.overrideMaterial:null)!==null)return;if(b.state.transmissionRenderTarget[q.id]===void 0){const $t=Jt.has("EXT_color_buffer_half_float")||Jt.has("EXT_color_buffer_float");b.state.transmissionRenderTarget[q.id]=new kn(1,1,{generateMipmaps:!0,type:$t?pi:pn,minFilter:ns,samples:fe.samples,stencilBuffer:o,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Zt.workingColorSpace})}const dt=b.state.transmissionRenderTarget[q.id],_t=q.viewport||I;dt.setSize(_t.z*M.transmissionResolutionScale,_t.w*M.transmissionResolutionScale);const mt=M.getRenderTarget(),bt=M.getActiveCubeFace(),Ct=M.getActiveMipmapLevel();M.setRenderTarget(dt),M.getClearColor(j),tt=M.getClearAlpha(),tt<1&&M.setClearColor(16777215,.5),M.clear(),Pt&&ct.render($);const Nt=M.toneMapping;M.toneMapping=zn;const Dt=q.viewport;if(q.viewport!==void 0&&(q.viewport=void 0),b.setupLightsView(q),pt===!0&&Mt.setGlobalState(M.clippingPlanes,q),Zo(C,$,q),k.updateMultisampleRenderTarget(dt),k.updateRenderTargetMipmap(dt),Jt.has("WEBGL_multisampled_render_to_texture")===!1){let $t=!1;for(let he=0,Me=V.length;he<Me;he++){const Se=V[he],{object:de,geometry:It,material:ae,group:Qt}=Se;if(ae.side===ai&&de.layers.test(q.layers)){const cn=ae.side;ae.side=an,ae.needsUpdate=!0,Sh(de,$,q,It,ae,Qt),ae.side=cn,ae.needsUpdate=!0,$t=!0}}$t===!0&&(k.updateMultisampleRenderTarget(dt),k.updateRenderTargetMipmap(dt))}M.setRenderTarget(mt,bt,Ct),M.setClearColor(j,tt),Dt!==void 0&&(q.viewport=Dt),M.toneMapping=Nt}function Zo(C,V,$){const q=V.isScene===!0?V.overrideMaterial:null;for(let G=0,dt=C.length;G<dt;G++){const _t=C[G],{object:mt,geometry:bt,group:Ct}=_t;let Nt=_t.material;Nt.allowOverride===!0&&q!==null&&(Nt=q),mt.layers.test($.layers)&&Sh(mt,V,$,bt,Nt,Ct)}}function Sh(C,V,$,q,G,dt){C.onBeforeRender(M,V,$,q,G,dt),C.modelViewMatrix.multiplyMatrices($.matrixWorldInverse,C.matrixWorld),C.normalMatrix.getNormalMatrix(C.modelViewMatrix),G.onBeforeRender(M,V,$,q,C,dt),G.transparent===!0&&G.side===ai&&G.forceSinglePass===!1?(G.side=an,G.needsUpdate=!0,M.renderBufferDirect($,V,q,G,C,dt),G.side=Di,G.needsUpdate=!0,M.renderBufferDirect($,V,q,G,C,dt),G.side=ai):M.renderBufferDirect($,V,q,G,C,dt),C.onAfterRender(M,V,$,q,G,dt)}function Jo(C,V,$){V.isScene!==!0&&(V=Vt);const q=S.get(C),G=b.state.lights,dt=b.state.shadowsArray,_t=G.state.version,mt=wt.getParameters(C,G.state,dt,V,$),bt=wt.getProgramCacheKey(mt);let Ct=q.programs;q.environment=C.isMeshStandardMaterial?V.environment:null,q.fog=V.fog,q.envMap=(C.isMeshStandardMaterial?Q:K).get(C.envMap||q.environment),q.envMapRotation=q.environment!==null&&C.envMap===null?V.environmentRotation:C.envMapRotation,Ct===void 0&&(C.addEventListener("dispose",Rn),Ct=new Map,q.programs=Ct);let Nt=Ct.get(bt);if(Nt!==void 0){if(q.currentProgram===Nt&&q.lightsStateVersion===_t)return Eh(C,mt),Nt}else mt.uniforms=wt.getUniforms(C),C.onBeforeCompile(mt,M),Nt=wt.acquireProgram(mt,bt),Ct.set(bt,Nt),q.uniforms=mt.uniforms;const Dt=q.uniforms;return(!C.isShaderMaterial&&!C.isRawShaderMaterial||C.clipping===!0)&&(Dt.clippingPlanes=Mt.uniform),Eh(C,mt),q.needsLights=ym(C),q.lightsStateVersion=_t,q.needsLights&&(Dt.ambientLightColor.value=G.state.ambient,Dt.lightProbe.value=G.state.probe,Dt.directionalLights.value=G.state.directional,Dt.directionalLightShadows.value=G.state.directionalShadow,Dt.spotLights.value=G.state.spot,Dt.spotLightShadows.value=G.state.spotShadow,Dt.rectAreaLights.value=G.state.rectArea,Dt.ltc_1.value=G.state.rectAreaLTC1,Dt.ltc_2.value=G.state.rectAreaLTC2,Dt.pointLights.value=G.state.point,Dt.pointLightShadows.value=G.state.pointShadow,Dt.hemisphereLights.value=G.state.hemi,Dt.directionalShadowMap.value=G.state.directionalShadowMap,Dt.directionalShadowMatrix.value=G.state.directionalShadowMatrix,Dt.spotShadowMap.value=G.state.spotShadowMap,Dt.spotLightMatrix.value=G.state.spotLightMatrix,Dt.spotLightMap.value=G.state.spotLightMap,Dt.pointShadowMap.value=G.state.pointShadowMap,Dt.pointShadowMatrix.value=G.state.pointShadowMatrix),q.currentProgram=Nt,q.uniformsList=null,Nt}function wh(C){if(C.uniformsList===null){const V=C.currentProgram.getUniforms();C.uniformsList=Yr.seqWithValue(V.seq,C.uniforms)}return C.uniformsList}function Eh(C,V){const $=S.get(C);$.outputColorSpace=V.outputColorSpace,$.batching=V.batching,$.batchingColor=V.batchingColor,$.instancing=V.instancing,$.instancingColor=V.instancingColor,$.instancingMorph=V.instancingMorph,$.skinning=V.skinning,$.morphTargets=V.morphTargets,$.morphNormals=V.morphNormals,$.morphColors=V.morphColors,$.morphTargetsCount=V.morphTargetsCount,$.numClippingPlanes=V.numClippingPlanes,$.numIntersection=V.numClipIntersection,$.vertexAlphas=V.vertexAlphas,$.vertexTangents=V.vertexTangents,$.toneMapping=V.toneMapping}function _m(C,V,$,q,G){V.isScene!==!0&&(V=Vt),k.resetTextureUnits();const dt=V.fog,_t=q.isMeshStandardMaterial?V.environment:null,mt=D===null?M.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:Hs,bt=(q.isMeshStandardMaterial?Q:K).get(q.envMap||_t),Ct=q.vertexColors===!0&&!!$.attributes.color&&$.attributes.color.itemSize===4,Nt=!!$.attributes.tangent&&(!!q.normalMap||q.anisotropy>0),Dt=!!$.morphAttributes.position,$t=!!$.morphAttributes.normal,he=!!$.morphAttributes.color;let Me=zn;q.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(Me=M.toneMapping);const Se=$.morphAttributes.position||$.morphAttributes.normal||$.morphAttributes.color,de=Se!==void 0?Se.length:0,It=S.get(q),ae=b.state.lights;if(pt===!0&&(Ft===!0||C!==F)){const $e=C===F&&q.id===O;Mt.setState(q,C,$e)}let Qt=!1;q.version===It.__version?(It.needsLights&&It.lightsStateVersion!==ae.state.version||It.outputColorSpace!==mt||G.isBatchedMesh&&It.batching===!1||!G.isBatchedMesh&&It.batching===!0||G.isBatchedMesh&&It.batchingColor===!0&&G.colorTexture===null||G.isBatchedMesh&&It.batchingColor===!1&&G.colorTexture!==null||G.isInstancedMesh&&It.instancing===!1||!G.isInstancedMesh&&It.instancing===!0||G.isSkinnedMesh&&It.skinning===!1||!G.isSkinnedMesh&&It.skinning===!0||G.isInstancedMesh&&It.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&It.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&It.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&It.instancingMorph===!1&&G.morphTexture!==null||It.envMap!==bt||q.fog===!0&&It.fog!==dt||It.numClippingPlanes!==void 0&&(It.numClippingPlanes!==Mt.numPlanes||It.numIntersection!==Mt.numIntersection)||It.vertexAlphas!==Ct||It.vertexTangents!==Nt||It.morphTargets!==Dt||It.morphNormals!==$t||It.morphColors!==he||It.toneMapping!==Me||It.morphTargetsCount!==de)&&(Qt=!0):(Qt=!0,It.__version=q.version);let cn=It.currentProgram;Qt===!0&&(cn=Jo(q,V,G));let hs=!1,hn=!1,eo=!1;const me=cn.getUniforms(),tn=It.uniforms;if(Et.useProgram(cn.program)&&(hs=!0,hn=!0,eo=!0),q.id!==O&&(O=q.id,hn=!0),hs||F!==C){Et.buffers.depth.getReversed()&&C.reversedDepth!==!0&&(C._reversedDepth=!0,C.updateProjectionMatrix()),me.setValue(U,"projectionMatrix",C.projectionMatrix),me.setValue(U,"viewMatrix",C.matrixWorldInverse);const en=me.map.cameraPosition;en!==void 0&&en.setValue(U,Ot.setFromMatrixPosition(C.matrixWorld)),fe.logarithmicDepthBuffer&&me.setValue(U,"logDepthBufFC",2/(Math.log(C.far+1)/Math.LN2)),(q.isMeshPhongMaterial||q.isMeshToonMaterial||q.isMeshLambertMaterial||q.isMeshBasicMaterial||q.isMeshStandardMaterial||q.isShaderMaterial)&&me.setValue(U,"isOrthographic",C.isOrthographicCamera===!0),F!==C&&(F=C,hn=!0,eo=!0)}if(It.needsLights&&(ae.state.directionalShadowMap.length>0&&me.setValue(U,"directionalShadowMap",ae.state.directionalShadowMap,k),ae.state.spotShadowMap.length>0&&me.setValue(U,"spotShadowMap",ae.state.spotShadowMap,k),ae.state.pointShadowMap.length>0&&me.setValue(U,"pointShadowMap",ae.state.pointShadowMap,k)),G.isSkinnedMesh){me.setOptional(U,G,"bindMatrix"),me.setOptional(U,G,"bindMatrixInverse");const $e=G.skeleton;$e&&($e.boneTexture===null&&$e.computeBoneTexture(),me.setValue(U,"boneTexture",$e.boneTexture,k))}G.isBatchedMesh&&(me.setOptional(U,G,"batchingTexture"),me.setValue(U,"batchingTexture",G._matricesTexture,k),me.setOptional(U,G,"batchingIdTexture"),me.setValue(U,"batchingIdTexture",G._indirectTexture,k),me.setOptional(U,G,"batchingColorTexture"),G._colorsTexture!==null&&me.setValue(U,"batchingColorTexture",G._colorsTexture,k));const gn=$.morphAttributes;if((gn.position!==void 0||gn.normal!==void 0||gn.color!==void 0)&&Wt.update(G,$,cn),(hn||It.receiveShadow!==G.receiveShadow)&&(It.receiveShadow=G.receiveShadow,me.setValue(U,"receiveShadow",G.receiveShadow)),q.isMeshGouraudMaterial&&q.envMap!==null&&(tn.envMap.value=bt,tn.flipEnvMap.value=bt.isCubeTexture&&bt.isRenderTargetTexture===!1?-1:1),q.isMeshStandardMaterial&&q.envMap===null&&V.environment!==null&&(tn.envMapIntensity.value=V.environmentIntensity),tn.dfgLUT!==void 0&&(tn.dfgLUT.value=Ky()),hn&&(me.setValue(U,"toneMappingExposure",M.toneMappingExposure),It.needsLights&&vm(tn,eo),dt&&q.fog===!0&&Ut.refreshFogUniforms(tn,dt),Ut.refreshMaterialUniforms(tn,q,St,et,b.state.transmissionRenderTarget[C.id]),Yr.upload(U,wh(It),tn,k)),q.isShaderMaterial&&q.uniformsNeedUpdate===!0&&(Yr.upload(U,wh(It),tn,k),q.uniformsNeedUpdate=!1),q.isSpriteMaterial&&me.setValue(U,"center",G.center),me.setValue(U,"modelViewMatrix",G.modelViewMatrix),me.setValue(U,"normalMatrix",G.normalMatrix),me.setValue(U,"modelMatrix",G.matrixWorld),q.isShaderMaterial||q.isRawShaderMaterial){const $e=q.uniformsGroups;for(let en=0,Ca=$e.length;en<Ca;en++){const Bi=$e[en];it.update(Bi,cn),it.bind(Bi,cn)}}return cn}function vm(C,V){C.ambientLightColor.needsUpdate=V,C.lightProbe.needsUpdate=V,C.directionalLights.needsUpdate=V,C.directionalLightShadows.needsUpdate=V,C.pointLights.needsUpdate=V,C.pointLightShadows.needsUpdate=V,C.spotLights.needsUpdate=V,C.spotLightShadows.needsUpdate=V,C.rectAreaLights.needsUpdate=V,C.hemisphereLights.needsUpdate=V}function ym(C){return C.isMeshLambertMaterial||C.isMeshToonMaterial||C.isMeshPhongMaterial||C.isMeshStandardMaterial||C.isShadowMaterial||C.isShaderMaterial&&C.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return N},this.getRenderTarget=function(){return D},this.setRenderTargetTextures=function(C,V,$){const q=S.get(C);q.__autoAllocateDepthBuffer=C.resolveDepthBuffer===!1,q.__autoAllocateDepthBuffer===!1&&(q.__useRenderToTexture=!1),S.get(C.texture).__webglTexture=V,S.get(C.depthTexture).__webglTexture=q.__autoAllocateDepthBuffer?void 0:$,q.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(C,V){const $=S.get(C);$.__webglFramebuffer=V,$.__useDefaultFramebuffer=V===void 0};const bm=U.createFramebuffer();this.setRenderTarget=function(C,V=0,$=0){D=C,R=V,N=$;let q=null,G=!1,dt=!1;if(C){const mt=S.get(C);if(mt.__useDefaultFramebuffer!==void 0){Et.bindFramebuffer(U.FRAMEBUFFER,mt.__webglFramebuffer),I.copy(C.viewport),z.copy(C.scissor),W=C.scissorTest,Et.viewport(I),Et.scissor(z),Et.setScissorTest(W),O=-1;return}else if(mt.__webglFramebuffer===void 0)k.setupRenderTarget(C);else if(mt.__hasExternalTextures)k.rebindTextures(C,S.get(C.texture).__webglTexture,S.get(C.depthTexture).__webglTexture);else if(C.depthBuffer){const Nt=C.depthTexture;if(mt.__boundDepthTexture!==Nt){if(Nt!==null&&S.has(Nt)&&(C.width!==Nt.image.width||C.height!==Nt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");k.setupDepthRenderbuffer(C)}}const bt=C.texture;(bt.isData3DTexture||bt.isDataArrayTexture||bt.isCompressedArrayTexture)&&(dt=!0);const Ct=S.get(C).__webglFramebuffer;C.isWebGLCubeRenderTarget?(Array.isArray(Ct[V])?q=Ct[V][$]:q=Ct[V],G=!0):C.samples>0&&k.useMultisampledRTT(C)===!1?q=S.get(C).__webglMultisampledFramebuffer:Array.isArray(Ct)?q=Ct[$]:q=Ct,I.copy(C.viewport),z.copy(C.scissor),W=C.scissorTest}else I.copy(X).multiplyScalar(St).floor(),z.copy(Z).multiplyScalar(St).floor(),W=rt;if($!==0&&(q=bm),Et.bindFramebuffer(U.FRAMEBUFFER,q)&&Et.drawBuffers(C,q),Et.viewport(I),Et.scissor(z),Et.setScissorTest(W),G){const mt=S.get(C.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+V,mt.__webglTexture,$)}else if(dt){const mt=V;for(let bt=0;bt<C.textures.length;bt++){const Ct=S.get(C.textures[bt]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+bt,Ct.__webglTexture,$,mt)}}else if(C!==null&&$!==0){const mt=S.get(C.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,mt.__webglTexture,$)}O=-1},this.readRenderTargetPixels=function(C,V,$,q,G,dt,_t,mt=0){if(!(C&&C.isWebGLRenderTarget)){te("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let bt=S.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&_t!==void 0&&(bt=bt[_t]),bt){Et.bindFramebuffer(U.FRAMEBUFFER,bt);try{const Ct=C.textures[mt],Nt=Ct.format,Dt=Ct.type;if(!fe.textureFormatReadable(Nt)){te("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!fe.textureTypeReadable(Dt)){te("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}V>=0&&V<=C.width-q&&$>=0&&$<=C.height-G&&(C.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+mt),U.readPixels(V,$,q,G,ot.convert(Nt),ot.convert(Dt),dt))}finally{const Ct=D!==null?S.get(D).__webglFramebuffer:null;Et.bindFramebuffer(U.FRAMEBUFFER,Ct)}}},this.readRenderTargetPixelsAsync=async function(C,V,$,q,G,dt,_t,mt=0){if(!(C&&C.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let bt=S.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&_t!==void 0&&(bt=bt[_t]),bt)if(V>=0&&V<=C.width-q&&$>=0&&$<=C.height-G){Et.bindFramebuffer(U.FRAMEBUFFER,bt);const Ct=C.textures[mt],Nt=Ct.format,Dt=Ct.type;if(!fe.textureFormatReadable(Nt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!fe.textureTypeReadable(Dt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const $t=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,$t),U.bufferData(U.PIXEL_PACK_BUFFER,dt.byteLength,U.STREAM_READ),C.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+mt),U.readPixels(V,$,q,G,ot.convert(Nt),ot.convert(Dt),0);const he=D!==null?S.get(D).__webglFramebuffer:null;Et.bindFramebuffer(U.FRAMEBUFFER,he);const Me=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await ig(U,Me,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,$t),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,dt),U.deleteBuffer($t),U.deleteSync(Me),dt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(C,V=null,$=0){const q=Math.pow(2,-$),G=Math.floor(C.image.width*q),dt=Math.floor(C.image.height*q),_t=V!==null?V.x:0,mt=V!==null?V.y:0;k.setTexture2D(C,0),U.copyTexSubImage2D(U.TEXTURE_2D,$,0,0,_t,mt,G,dt),Et.unbindTexture()};const Mm=U.createFramebuffer(),Sm=U.createFramebuffer();this.copyTextureToTexture=function(C,V,$=null,q=null,G=0,dt=null){dt===null&&(G!==0?(Oo("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),dt=G,G=0):dt=0);let _t,mt,bt,Ct,Nt,Dt,$t,he,Me;const Se=C.isCompressedTexture?C.mipmaps[dt]:C.image;if($!==null)_t=$.max.x-$.min.x,mt=$.max.y-$.min.y,bt=$.isBox3?$.max.z-$.min.z:1,Ct=$.min.x,Nt=$.min.y,Dt=$.isBox3?$.min.z:0;else{const gn=Math.pow(2,-G);_t=Math.floor(Se.width*gn),mt=Math.floor(Se.height*gn),C.isDataArrayTexture?bt=Se.depth:C.isData3DTexture?bt=Math.floor(Se.depth*gn):bt=1,Ct=0,Nt=0,Dt=0}q!==null?($t=q.x,he=q.y,Me=q.z):($t=0,he=0,Me=0);const de=ot.convert(V.format),It=ot.convert(V.type);let ae;V.isData3DTexture?(k.setTexture3D(V,0),ae=U.TEXTURE_3D):V.isDataArrayTexture||V.isCompressedArrayTexture?(k.setTexture2DArray(V,0),ae=U.TEXTURE_2D_ARRAY):(k.setTexture2D(V,0),ae=U.TEXTURE_2D),U.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,V.flipY),U.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),U.pixelStorei(U.UNPACK_ALIGNMENT,V.unpackAlignment);const Qt=U.getParameter(U.UNPACK_ROW_LENGTH),cn=U.getParameter(U.UNPACK_IMAGE_HEIGHT),hs=U.getParameter(U.UNPACK_SKIP_PIXELS),hn=U.getParameter(U.UNPACK_SKIP_ROWS),eo=U.getParameter(U.UNPACK_SKIP_IMAGES);U.pixelStorei(U.UNPACK_ROW_LENGTH,Se.width),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,Se.height),U.pixelStorei(U.UNPACK_SKIP_PIXELS,Ct),U.pixelStorei(U.UNPACK_SKIP_ROWS,Nt),U.pixelStorei(U.UNPACK_SKIP_IMAGES,Dt);const me=C.isDataArrayTexture||C.isData3DTexture,tn=V.isDataArrayTexture||V.isData3DTexture;if(C.isDepthTexture){const gn=S.get(C),$e=S.get(V),en=S.get(gn.__renderTarget),Ca=S.get($e.__renderTarget);Et.bindFramebuffer(U.READ_FRAMEBUFFER,en.__webglFramebuffer),Et.bindFramebuffer(U.DRAW_FRAMEBUFFER,Ca.__webglFramebuffer);for(let Bi=0;Bi<bt;Bi++)me&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,S.get(C).__webglTexture,G,Dt+Bi),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,S.get(V).__webglTexture,dt,Me+Bi)),U.blitFramebuffer(Ct,Nt,_t,mt,$t,he,_t,mt,U.DEPTH_BUFFER_BIT,U.NEAREST);Et.bindFramebuffer(U.READ_FRAMEBUFFER,null),Et.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(G!==0||C.isRenderTargetTexture||S.has(C)){const gn=S.get(C),$e=S.get(V);Et.bindFramebuffer(U.READ_FRAMEBUFFER,Mm),Et.bindFramebuffer(U.DRAW_FRAMEBUFFER,Sm);for(let en=0;en<bt;en++)me?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,gn.__webglTexture,G,Dt+en):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,gn.__webglTexture,G),tn?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,$e.__webglTexture,dt,Me+en):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,$e.__webglTexture,dt),G!==0?U.blitFramebuffer(Ct,Nt,_t,mt,$t,he,_t,mt,U.COLOR_BUFFER_BIT,U.NEAREST):tn?U.copyTexSubImage3D(ae,dt,$t,he,Me+en,Ct,Nt,_t,mt):U.copyTexSubImage2D(ae,dt,$t,he,Ct,Nt,_t,mt);Et.bindFramebuffer(U.READ_FRAMEBUFFER,null),Et.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else tn?C.isDataTexture||C.isData3DTexture?U.texSubImage3D(ae,dt,$t,he,Me,_t,mt,bt,de,It,Se.data):V.isCompressedArrayTexture?U.compressedTexSubImage3D(ae,dt,$t,he,Me,_t,mt,bt,de,Se.data):U.texSubImage3D(ae,dt,$t,he,Me,_t,mt,bt,de,It,Se):C.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,dt,$t,he,_t,mt,de,It,Se.data):C.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,dt,$t,he,Se.width,Se.height,de,Se.data):U.texSubImage2D(U.TEXTURE_2D,dt,$t,he,_t,mt,de,It,Se);U.pixelStorei(U.UNPACK_ROW_LENGTH,Qt),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,cn),U.pixelStorei(U.UNPACK_SKIP_PIXELS,hs),U.pixelStorei(U.UNPACK_SKIP_ROWS,hn),U.pixelStorei(U.UNPACK_SKIP_IMAGES,eo),dt===0&&V.generateMipmaps&&U.generateMipmap(ae),Et.unbindTexture()},this.initRenderTarget=function(C){S.get(C).__webglFramebuffer===void 0&&k.setupRenderTarget(C)},this.initTexture=function(C){C.isCubeTexture?k.setTextureCube(C,0):C.isData3DTexture?k.setTexture3D(C,0):C.isDataArrayTexture||C.isCompressedArrayTexture?k.setTexture2DArray(C,0):k.setTexture2D(C,0),Et.unbindTexture()},this.resetState=function(){R=0,N=0,D=null,Et.reset(),xt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Bn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=Zt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Zt._getUnpackColorSpace()}}const qs={minNodes:2,maxNodes:8,minMuscles:1,maxMuscles:15,minSize:.2,maxSize:.8,minStiffness:50,maxStiffness:500,minFrequency:.5,maxFrequency:3,maxAmplitude:.4,spawnRadius:2},na={baseFitness:10,pelletWeight:100,proximityWeight:2.5,proximityMaxDistance:20,movementWeight:1,movementCap:5,distanceWeight:0,distanceCap:50},ia={gravity:-9.8,groundFriction:.5,timeStep:1/60,simulationDuration:10,populationSize:100,cullPercentage:.5,mutationRate:.1,mutationMagnitude:.3,crossoverRate:.3,eliteCount:5,minNodes:3,maxNodes:8,maxMuscles:15,maxAllowedFrequency:3,pelletCount:3,arenaSize:10,fitnessWeights:na};let Zy=0;function br(i){return`${i}_${Date.now()}_${Zy++}`}function Te(i,t){return Math.random()*(t-i)+i}function As(i,t){return Math.floor(Te(i,t+1))}function Jy(i){return{x:Te(-i,i),y:Te(.5,i*1.5),z:Te(-i,i)}}function Rd(i,t){const e=i.x-t.x,n=i.y-t.y,s=i.z-t.z;return Math.sqrt(e*e+n*n+s*s)}function Qy(){return{h:Math.random(),s:Te(.5,.9),l:Te(.4,.6)}}function rp(i=qs){const t=br("creature"),e=Math.min(i.maxNodes,i.maxMuscles+1),n=Math.min(i.minNodes,e),s=As(n,e),o=[];for(let u=0;u<s;u++)o.push({id:br("node"),size:Te(i.minSize,i.maxSize),friction:Te(.3,.9),position:Jy(i.spawnRadius)});const r=[],a=Math.min(i.maxMuscles,s*(s-1)/2),l=new Set([o[0].id]),c=new Set(o.slice(1).map(u=>u.id));for(;c.size>0;){const u=Array.from(l),f=Array.from(c),m=u[As(0,u.length-1)],x=f[As(0,f.length-1)],p=o.find(v=>v.id===m),g=o.find(v=>v.id===x),_=Rd(p.position,g.position);r.push({id:br("muscle"),nodeA:m,nodeB:x,restLength:_*Te(.8,1.2),stiffness:Te(i.minStiffness,i.maxStiffness),damping:Te(.1,.5),frequency:Te(i.minFrequency,i.maxFrequency),amplitude:Te(.1,i.maxAmplitude),phase:Te(0,Math.PI*2)}),l.add(x),c.delete(x)}const h=As(0,a-r.length),d=new Set(r.map(u=>[u.nodeA,u.nodeB].sort().join("-")));for(let u=0;u<h;u++){const f=o[As(0,o.length-1)],m=o[As(0,o.length-1)];if(f.id===m.id)continue;const x=[f.id,m.id].sort().join("-");if(d.has(x))continue;d.add(x);const p=Rd(f.position,m.position);r.push({id:br("muscle"),nodeA:f.id,nodeB:m.id,restLength:p*Te(.8,1.2),stiffness:Te(i.minStiffness,i.maxStiffness),damping:Te(.1,.5),frequency:Te(i.minFrequency,i.maxFrequency),amplitude:Te(.1,i.maxAmplitude),phase:Te(0,Math.PI*2)})}return{id:t,generation:0,survivalStreak:0,parentIds:[],nodes:o,muscles:r,globalFrequencyMultiplier:Te(.5,1.5),controllerType:"oscillator",color:Qy()}}class An{constructor(t){t===void 0&&(t=[0,0,0,0,0,0,0,0,0]),this.elements=t}identity(){const t=this.elements;t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=0,t[7]=0,t[8]=1}setZero(){const t=this.elements;t[0]=0,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=0,t[6]=0,t[7]=0,t[8]=0}setTrace(t){const e=this.elements;e[0]=t.x,e[4]=t.y,e[8]=t.z}getTrace(t){t===void 0&&(t=new A);const e=this.elements;return t.x=e[0],t.y=e[4],t.z=e[8],t}vmult(t,e){e===void 0&&(e=new A);const n=this.elements,s=t.x,o=t.y,r=t.z;return e.x=n[0]*s+n[1]*o+n[2]*r,e.y=n[3]*s+n[4]*o+n[5]*r,e.z=n[6]*s+n[7]*o+n[8]*r,e}smult(t){for(let e=0;e<this.elements.length;e++)this.elements[e]*=t}mmult(t,e){e===void 0&&(e=new An);const n=this.elements,s=t.elements,o=e.elements,r=n[0],a=n[1],l=n[2],c=n[3],h=n[4],d=n[5],u=n[6],f=n[7],m=n[8],x=s[0],p=s[1],g=s[2],_=s[3],v=s[4],y=s[5],b=s[6],w=s[7],T=s[8];return o[0]=r*x+a*_+l*b,o[1]=r*p+a*v+l*w,o[2]=r*g+a*y+l*T,o[3]=c*x+h*_+d*b,o[4]=c*p+h*v+d*w,o[5]=c*g+h*y+d*T,o[6]=u*x+f*_+m*b,o[7]=u*p+f*v+m*w,o[8]=u*g+f*y+m*T,e}scale(t,e){e===void 0&&(e=new An);const n=this.elements,s=e.elements;for(let o=0;o!==3;o++)s[3*o+0]=t.x*n[3*o+0],s[3*o+1]=t.y*n[3*o+1],s[3*o+2]=t.z*n[3*o+2];return e}solve(t,e){e===void 0&&(e=new A);const n=3,s=4,o=[];let r,a;for(r=0;r<n*s;r++)o.push(0);for(r=0;r<3;r++)for(a=0;a<3;a++)o[r+s*a]=this.elements[r+3*a];o[3]=t.x,o[7]=t.y,o[11]=t.z;let l=3;const c=l;let h;const d=4;let u;do{if(r=c-l,o[r+s*r]===0){for(a=r+1;a<c;a++)if(o[r+s*a]!==0){h=d;do u=d-h,o[u+s*r]+=o[u+s*a];while(--h);break}}if(o[r+s*r]!==0)for(a=r+1;a<c;a++){const f=o[r+s*a]/o[r+s*r];h=d;do u=d-h,o[u+s*a]=u<=r?0:o[u+s*a]-o[u+s*r]*f;while(--h)}}while(--l);if(e.z=o[2*s+3]/o[2*s+2],e.y=(o[1*s+3]-o[1*s+2]*e.z)/o[1*s+1],e.x=(o[0*s+3]-o[0*s+2]*e.z-o[0*s+1]*e.y)/o[0*s+0],isNaN(e.x)||isNaN(e.y)||isNaN(e.z)||e.x===1/0||e.y===1/0||e.z===1/0)throw`Could not solve equation! Got x=[${e.toString()}], b=[${t.toString()}], A=[${this.toString()}]`;return e}e(t,e,n){if(n===void 0)return this.elements[e+3*t];this.elements[e+3*t]=n}copy(t){for(let e=0;e<t.elements.length;e++)this.elements[e]=t.elements[e];return this}toString(){let t="";for(let n=0;n<9;n++)t+=this.elements[n]+",";return t}reverse(t){t===void 0&&(t=new An);const e=3,n=6,s=tb;let o,r;for(o=0;o<3;o++)for(r=0;r<3;r++)s[o+n*r]=this.elements[o+3*r];s[3]=1,s[9]=0,s[15]=0,s[4]=0,s[10]=1,s[16]=0,s[5]=0,s[11]=0,s[17]=1;let a=3;const l=a;let c;const h=n;let d;do{if(o=l-a,s[o+n*o]===0){for(r=o+1;r<l;r++)if(s[o+n*r]!==0){c=h;do d=h-c,s[d+n*o]+=s[d+n*r];while(--c);break}}if(s[o+n*o]!==0)for(r=o+1;r<l;r++){const u=s[o+n*r]/s[o+n*o];c=h;do d=h-c,s[d+n*r]=d<=o?0:s[d+n*r]-s[d+n*o]*u;while(--c)}}while(--a);o=2;do{r=o-1;do{const u=s[o+n*r]/s[o+n*o];c=n;do d=n-c,s[d+n*r]=s[d+n*r]-s[d+n*o]*u;while(--c)}while(r--)}while(--o);o=2;do{const u=1/s[o+n*o];c=n;do d=n-c,s[d+n*o]=s[d+n*o]*u;while(--c)}while(o--);o=2;do{r=2;do{if(d=s[e+r+n*o],isNaN(d)||d===1/0)throw`Could not reverse! A=[${this.toString()}]`;t.e(o,r,d)}while(r--)}while(o--);return t}setRotationFromQuaternion(t){const e=t.x,n=t.y,s=t.z,o=t.w,r=e+e,a=n+n,l=s+s,c=e*r,h=e*a,d=e*l,u=n*a,f=n*l,m=s*l,x=o*r,p=o*a,g=o*l,_=this.elements;return _[0]=1-(u+m),_[1]=h-g,_[2]=d+p,_[3]=h+g,_[4]=1-(c+m),_[5]=f-x,_[6]=d-p,_[7]=f+x,_[8]=1-(c+u),this}transpose(t){t===void 0&&(t=new An);const e=this.elements,n=t.elements;let s;return n[0]=e[0],n[4]=e[4],n[8]=e[8],s=e[1],n[1]=e[3],n[3]=s,s=e[2],n[2]=e[6],n[6]=s,s=e[5],n[5]=e[7],n[7]=s,t}}const tb=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];class A{constructor(t,e,n){t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0),this.x=t,this.y=e,this.z=n}cross(t,e){e===void 0&&(e=new A);const n=t.x,s=t.y,o=t.z,r=this.x,a=this.y,l=this.z;return e.x=a*o-l*s,e.y=l*n-r*o,e.z=r*s-a*n,e}set(t,e,n){return this.x=t,this.y=e,this.z=n,this}setZero(){this.x=this.y=this.z=0}vadd(t,e){if(e)e.x=t.x+this.x,e.y=t.y+this.y,e.z=t.z+this.z;else return new A(this.x+t.x,this.y+t.y,this.z+t.z)}vsub(t,e){if(e)e.x=this.x-t.x,e.y=this.y-t.y,e.z=this.z-t.z;else return new A(this.x-t.x,this.y-t.y,this.z-t.z)}crossmat(){return new An([0,-this.z,this.y,this.z,0,-this.x,-this.y,this.x,0])}normalize(){const t=this.x,e=this.y,n=this.z,s=Math.sqrt(t*t+e*e+n*n);if(s>0){const o=1/s;this.x*=o,this.y*=o,this.z*=o}else this.x=0,this.y=0,this.z=0;return s}unit(t){t===void 0&&(t=new A);const e=this.x,n=this.y,s=this.z;let o=Math.sqrt(e*e+n*n+s*s);return o>0?(o=1/o,t.x=e*o,t.y=n*o,t.z=s*o):(t.x=1,t.y=0,t.z=0),t}length(){const t=this.x,e=this.y,n=this.z;return Math.sqrt(t*t+e*e+n*n)}lengthSquared(){return this.dot(this)}distanceTo(t){const e=this.x,n=this.y,s=this.z,o=t.x,r=t.y,a=t.z;return Math.sqrt((o-e)*(o-e)+(r-n)*(r-n)+(a-s)*(a-s))}distanceSquared(t){const e=this.x,n=this.y,s=this.z,o=t.x,r=t.y,a=t.z;return(o-e)*(o-e)+(r-n)*(r-n)+(a-s)*(a-s)}scale(t,e){e===void 0&&(e=new A);const n=this.x,s=this.y,o=this.z;return e.x=t*n,e.y=t*s,e.z=t*o,e}vmul(t,e){return e===void 0&&(e=new A),e.x=t.x*this.x,e.y=t.y*this.y,e.z=t.z*this.z,e}addScaledVector(t,e,n){return n===void 0&&(n=new A),n.x=this.x+t*e.x,n.y=this.y+t*e.y,n.z=this.z+t*e.z,n}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}isZero(){return this.x===0&&this.y===0&&this.z===0}negate(t){return t===void 0&&(t=new A),t.x=-this.x,t.y=-this.y,t.z=-this.z,t}tangents(t,e){const n=this.length();if(n>0){const s=eb,o=1/n;s.set(this.x*o,this.y*o,this.z*o);const r=nb;Math.abs(s.x)<.9?(r.set(1,0,0),s.cross(r,t)):(r.set(0,1,0),s.cross(r,t)),s.cross(t,e)}else t.set(1,0,0),e.set(0,1,0)}toString(){return`${this.x},${this.y},${this.z}`}toArray(){return[this.x,this.y,this.z]}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}lerp(t,e,n){const s=this.x,o=this.y,r=this.z;n.x=s+(t.x-s)*e,n.y=o+(t.y-o)*e,n.z=r+(t.z-r)*e}almostEquals(t,e){return e===void 0&&(e=1e-6),!(Math.abs(this.x-t.x)>e||Math.abs(this.y-t.y)>e||Math.abs(this.z-t.z)>e)}almostZero(t){return t===void 0&&(t=1e-6),!(Math.abs(this.x)>t||Math.abs(this.y)>t||Math.abs(this.z)>t)}isAntiparallelTo(t,e){return this.negate(Pd),Pd.almostEquals(t,e)}clone(){return new A(this.x,this.y,this.z)}}A.ZERO=new A(0,0,0);A.UNIT_X=new A(1,0,0);A.UNIT_Y=new A(0,1,0);A.UNIT_Z=new A(0,0,1);const eb=new A,nb=new A,Pd=new A;class mn{constructor(t){t===void 0&&(t={}),this.lowerBound=new A,this.upperBound=new A,t.lowerBound&&this.lowerBound.copy(t.lowerBound),t.upperBound&&this.upperBound.copy(t.upperBound)}setFromPoints(t,e,n,s){const o=this.lowerBound,r=this.upperBound,a=n;o.copy(t[0]),a&&a.vmult(o,o),r.copy(o);for(let l=1;l<t.length;l++){let c=t[l];a&&(a.vmult(c,Ld),c=Ld),c.x>r.x&&(r.x=c.x),c.x<o.x&&(o.x=c.x),c.y>r.y&&(r.y=c.y),c.y<o.y&&(o.y=c.y),c.z>r.z&&(r.z=c.z),c.z<o.z&&(o.z=c.z)}return e&&(e.vadd(o,o),e.vadd(r,r)),s&&(o.x-=s,o.y-=s,o.z-=s,r.x+=s,r.y+=s,r.z+=s),this}copy(t){return this.lowerBound.copy(t.lowerBound),this.upperBound.copy(t.upperBound),this}clone(){return new mn().copy(this)}extend(t){this.lowerBound.x=Math.min(this.lowerBound.x,t.lowerBound.x),this.upperBound.x=Math.max(this.upperBound.x,t.upperBound.x),this.lowerBound.y=Math.min(this.lowerBound.y,t.lowerBound.y),this.upperBound.y=Math.max(this.upperBound.y,t.upperBound.y),this.lowerBound.z=Math.min(this.lowerBound.z,t.lowerBound.z),this.upperBound.z=Math.max(this.upperBound.z,t.upperBound.z)}overlaps(t){const e=this.lowerBound,n=this.upperBound,s=t.lowerBound,o=t.upperBound,r=s.x<=n.x&&n.x<=o.x||e.x<=o.x&&o.x<=n.x,a=s.y<=n.y&&n.y<=o.y||e.y<=o.y&&o.y<=n.y,l=s.z<=n.z&&n.z<=o.z||e.z<=o.z&&o.z<=n.z;return r&&a&&l}volume(){const t=this.lowerBound,e=this.upperBound;return(e.x-t.x)*(e.y-t.y)*(e.z-t.z)}contains(t){const e=this.lowerBound,n=this.upperBound,s=t.lowerBound,o=t.upperBound;return e.x<=s.x&&n.x>=o.x&&e.y<=s.y&&n.y>=o.y&&e.z<=s.z&&n.z>=o.z}getCorners(t,e,n,s,o,r,a,l){const c=this.lowerBound,h=this.upperBound;t.copy(c),e.set(h.x,c.y,c.z),n.set(h.x,h.y,c.z),s.set(c.x,h.y,h.z),o.set(h.x,c.y,h.z),r.set(c.x,h.y,c.z),a.set(c.x,c.y,h.z),l.copy(h)}toLocalFrame(t,e){const n=Dd,s=n[0],o=n[1],r=n[2],a=n[3],l=n[4],c=n[5],h=n[6],d=n[7];this.getCorners(s,o,r,a,l,c,h,d);for(let u=0;u!==8;u++){const f=n[u];t.pointToLocal(f,f)}return e.setFromPoints(n)}toWorldFrame(t,e){const n=Dd,s=n[0],o=n[1],r=n[2],a=n[3],l=n[4],c=n[5],h=n[6],d=n[7];this.getCorners(s,o,r,a,l,c,h,d);for(let u=0;u!==8;u++){const f=n[u];t.pointToWorld(f,f)}return e.setFromPoints(n)}overlapsRay(t){const{direction:e,from:n}=t,s=1/e.x,o=1/e.y,r=1/e.z,a=(this.lowerBound.x-n.x)*s,l=(this.upperBound.x-n.x)*s,c=(this.lowerBound.y-n.y)*o,h=(this.upperBound.y-n.y)*o,d=(this.lowerBound.z-n.z)*r,u=(this.upperBound.z-n.z)*r,f=Math.max(Math.max(Math.min(a,l),Math.min(c,h)),Math.min(d,u)),m=Math.min(Math.min(Math.max(a,l),Math.max(c,h)),Math.max(d,u));return!(m<0||f>m)}}const Ld=new A,Dd=[new A,new A,new A,new A,new A,new A,new A,new A];class Id{constructor(){this.matrix=[]}get(t,e){let{index:n}=t,{index:s}=e;if(s>n){const o=s;s=n,n=o}return this.matrix[(n*(n+1)>>1)+s-1]}set(t,e,n){let{index:s}=t,{index:o}=e;if(o>s){const r=o;o=s,s=r}this.matrix[(s*(s+1)>>1)+o-1]=n?1:0}reset(){for(let t=0,e=this.matrix.length;t!==e;t++)this.matrix[t]=0}setNumObjects(t){this.matrix.length=t*(t-1)>>1}}class ap{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;return n[t]===void 0&&(n[t]=[]),n[t].includes(e)||n[t].push(e),this}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return!!(n[t]!==void 0&&n[t].includes(e))}hasAnyEventListener(t){return this._listeners===void 0?!1:this._listeners[t]!==void 0}removeEventListener(t,e){if(this._listeners===void 0)return this;const n=this._listeners;if(n[t]===void 0)return this;const s=n[t].indexOf(e);return s!==-1&&n[t].splice(s,1),this}dispatchEvent(t){if(this._listeners===void 0)return this;const n=this._listeners[t.type];if(n!==void 0){t.target=this;for(let s=0,o=n.length;s<o;s++)n[s].call(this,t)}return this}}class Pe{constructor(t,e,n,s){t===void 0&&(t=0),e===void 0&&(e=0),n===void 0&&(n=0),s===void 0&&(s=1),this.x=t,this.y=e,this.z=n,this.w=s}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}toString(){return`${this.x},${this.y},${this.z},${this.w}`}toArray(){return[this.x,this.y,this.z,this.w]}setFromAxisAngle(t,e){const n=Math.sin(e*.5);return this.x=t.x*n,this.y=t.y*n,this.z=t.z*n,this.w=Math.cos(e*.5),this}toAxisAngle(t){t===void 0&&(t=new A),this.normalize();const e=2*Math.acos(this.w),n=Math.sqrt(1-this.w*this.w);return n<.001?(t.x=this.x,t.y=this.y,t.z=this.z):(t.x=this.x/n,t.y=this.y/n,t.z=this.z/n),[t,e]}setFromVectors(t,e){if(t.isAntiparallelTo(e)){const n=ib,s=sb;t.tangents(n,s),this.setFromAxisAngle(n,Math.PI)}else{const n=t.cross(e);this.x=n.x,this.y=n.y,this.z=n.z,this.w=Math.sqrt(t.length()**2*e.length()**2)+t.dot(e),this.normalize()}return this}mult(t,e){e===void 0&&(e=new Pe);const n=this.x,s=this.y,o=this.z,r=this.w,a=t.x,l=t.y,c=t.z,h=t.w;return e.x=n*h+r*a+s*c-o*l,e.y=s*h+r*l+o*a-n*c,e.z=o*h+r*c+n*l-s*a,e.w=r*h-n*a-s*l-o*c,e}inverse(t){t===void 0&&(t=new Pe);const e=this.x,n=this.y,s=this.z,o=this.w;this.conjugate(t);const r=1/(e*e+n*n+s*s+o*o);return t.x*=r,t.y*=r,t.z*=r,t.w*=r,t}conjugate(t){return t===void 0&&(t=new Pe),t.x=-this.x,t.y=-this.y,t.z=-this.z,t.w=this.w,t}normalize(){let t=Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w);return t===0?(this.x=0,this.y=0,this.z=0,this.w=0):(t=1/t,this.x*=t,this.y*=t,this.z*=t,this.w*=t),this}normalizeFast(){const t=(3-(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w))/2;return t===0?(this.x=0,this.y=0,this.z=0,this.w=0):(this.x*=t,this.y*=t,this.z*=t,this.w*=t),this}vmult(t,e){e===void 0&&(e=new A);const n=t.x,s=t.y,o=t.z,r=this.x,a=this.y,l=this.z,c=this.w,h=c*n+a*o-l*s,d=c*s+l*n-r*o,u=c*o+r*s-a*n,f=-r*n-a*s-l*o;return e.x=h*c+f*-r+d*-l-u*-a,e.y=d*c+f*-a+u*-r-h*-l,e.z=u*c+f*-l+h*-a-d*-r,e}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w,this}toEuler(t,e){e===void 0&&(e="YZX");let n,s,o;const r=this.x,a=this.y,l=this.z,c=this.w;switch(e){case"YZX":const h=r*a+l*c;if(h>.499&&(n=2*Math.atan2(r,c),s=Math.PI/2,o=0),h<-.499&&(n=-2*Math.atan2(r,c),s=-Math.PI/2,o=0),n===void 0){const d=r*r,u=a*a,f=l*l;n=Math.atan2(2*a*c-2*r*l,1-2*u-2*f),s=Math.asin(2*h),o=Math.atan2(2*r*c-2*a*l,1-2*d-2*f)}break;default:throw new Error(`Euler order ${e} not supported yet.`)}t.y=n,t.z=s,t.x=o}setFromEuler(t,e,n,s){s===void 0&&(s="XYZ");const o=Math.cos(t/2),r=Math.cos(e/2),a=Math.cos(n/2),l=Math.sin(t/2),c=Math.sin(e/2),h=Math.sin(n/2);return s==="XYZ"?(this.x=l*r*a+o*c*h,this.y=o*c*a-l*r*h,this.z=o*r*h+l*c*a,this.w=o*r*a-l*c*h):s==="YXZ"?(this.x=l*r*a+o*c*h,this.y=o*c*a-l*r*h,this.z=o*r*h-l*c*a,this.w=o*r*a+l*c*h):s==="ZXY"?(this.x=l*r*a-o*c*h,this.y=o*c*a+l*r*h,this.z=o*r*h+l*c*a,this.w=o*r*a-l*c*h):s==="ZYX"?(this.x=l*r*a-o*c*h,this.y=o*c*a+l*r*h,this.z=o*r*h-l*c*a,this.w=o*r*a+l*c*h):s==="YZX"?(this.x=l*r*a+o*c*h,this.y=o*c*a+l*r*h,this.z=o*r*h-l*c*a,this.w=o*r*a-l*c*h):s==="XZY"&&(this.x=l*r*a-o*c*h,this.y=o*c*a-l*r*h,this.z=o*r*h+l*c*a,this.w=o*r*a+l*c*h),this}clone(){return new Pe(this.x,this.y,this.z,this.w)}slerp(t,e,n){n===void 0&&(n=new Pe);const s=this.x,o=this.y,r=this.z,a=this.w;let l=t.x,c=t.y,h=t.z,d=t.w,u,f,m,x,p;return f=s*l+o*c+r*h+a*d,f<0&&(f=-f,l=-l,c=-c,h=-h,d=-d),1-f>1e-6?(u=Math.acos(f),m=Math.sin(u),x=Math.sin((1-e)*u)/m,p=Math.sin(e*u)/m):(x=1-e,p=e),n.x=x*s+p*l,n.y=x*o+p*c,n.z=x*r+p*h,n.w=x*a+p*d,n}integrate(t,e,n,s){s===void 0&&(s=new Pe);const o=t.x*n.x,r=t.y*n.y,a=t.z*n.z,l=this.x,c=this.y,h=this.z,d=this.w,u=e*.5;return s.x+=u*(o*d+r*h-a*c),s.y+=u*(r*d+a*l-o*h),s.z+=u*(a*d+o*c-r*l),s.w+=u*(-o*l-r*c-a*h),s}}const ib=new A,sb=new A,ob={SPHERE:1,PLANE:2,BOX:4,COMPOUND:8,CONVEXPOLYHEDRON:16,HEIGHTFIELD:32,PARTICLE:64,CYLINDER:128,TRIMESH:256};class vt{constructor(t){t===void 0&&(t={}),this.id=vt.idCounter++,this.type=t.type||0,this.boundingSphereRadius=0,this.collisionResponse=t.collisionResponse?t.collisionResponse:!0,this.collisionFilterGroup=t.collisionFilterGroup!==void 0?t.collisionFilterGroup:1,this.collisionFilterMask=t.collisionFilterMask!==void 0?t.collisionFilterMask:-1,this.material=t.material?t.material:null,this.body=null}updateBoundingSphereRadius(){throw`computeBoundingSphereRadius() not implemented for shape type ${this.type}`}volume(){throw`volume() not implemented for shape type ${this.type}`}calculateLocalInertia(t,e){throw`calculateLocalInertia() not implemented for shape type ${this.type}`}calculateWorldAABB(t,e,n,s){throw`calculateWorldAABB() not implemented for shape type ${this.type}`}}vt.idCounter=0;vt.types=ob;class ie{constructor(t){t===void 0&&(t={}),this.position=new A,this.quaternion=new Pe,t.position&&this.position.copy(t.position),t.quaternion&&this.quaternion.copy(t.quaternion)}pointToLocal(t,e){return ie.pointToLocalFrame(this.position,this.quaternion,t,e)}pointToWorld(t,e){return ie.pointToWorldFrame(this.position,this.quaternion,t,e)}vectorToWorldFrame(t,e){return e===void 0&&(e=new A),this.quaternion.vmult(t,e),e}static pointToLocalFrame(t,e,n,s){return s===void 0&&(s=new A),n.vsub(t,s),e.conjugate(Fd),Fd.vmult(s,s),s}static pointToWorldFrame(t,e,n,s){return s===void 0&&(s=new A),e.vmult(n,s),s.vadd(t,s),s}static vectorToWorldFrame(t,e,n){return n===void 0&&(n=new A),t.vmult(e,n),n}static vectorToLocalFrame(t,e,n,s){return s===void 0&&(s=new A),e.w*=-1,e.vmult(n,s),e.w*=-1,s}}const Fd=new Pe;class Ro extends vt{constructor(t){t===void 0&&(t={});const{vertices:e=[],faces:n=[],normals:s=[],axes:o,boundingSphereRadius:r}=t;super({type:vt.types.CONVEXPOLYHEDRON}),this.vertices=e,this.faces=n,this.faceNormals=s,this.faceNormals.length===0&&this.computeNormals(),r?this.boundingSphereRadius=r:this.updateBoundingSphereRadius(),this.worldVertices=[],this.worldVerticesNeedsUpdate=!0,this.worldFaceNormals=[],this.worldFaceNormalsNeedsUpdate=!0,this.uniqueAxes=o?o.slice():null,this.uniqueEdges=[],this.computeEdges()}computeEdges(){const t=this.faces,e=this.vertices,n=this.uniqueEdges;n.length=0;const s=new A;for(let o=0;o!==t.length;o++){const r=t[o],a=r.length;for(let l=0;l!==a;l++){const c=(l+1)%a;e[r[l]].vsub(e[r[c]],s),s.normalize();let h=!1;for(let d=0;d!==n.length;d++)if(n[d].almostEquals(s)||n[d].almostEquals(s)){h=!0;break}h||n.push(s.clone())}}}computeNormals(){this.faceNormals.length=this.faces.length;for(let t=0;t<this.faces.length;t++){for(let s=0;s<this.faces[t].length;s++)if(!this.vertices[this.faces[t][s]])throw new Error(`Vertex ${this.faces[t][s]} not found!`);const e=this.faceNormals[t]||new A;this.getFaceNormal(t,e),e.negate(e),this.faceNormals[t]=e;const n=this.vertices[this.faces[t][0]];if(e.dot(n)<0){console.error(`.faceNormals[${t}] = Vec3(${e.toString()}) looks like it points into the shape? The vertices follow. Make sure they are ordered CCW around the normal, using the right hand rule.`);for(let s=0;s<this.faces[t].length;s++)console.warn(`.vertices[${this.faces[t][s]}] = Vec3(${this.vertices[this.faces[t][s]].toString()})`)}}}getFaceNormal(t,e){const n=this.faces[t],s=this.vertices[n[0]],o=this.vertices[n[1]],r=this.vertices[n[2]];Ro.computeNormal(s,o,r,e)}static computeNormal(t,e,n,s){const o=new A,r=new A;e.vsub(t,r),n.vsub(e,o),o.cross(r,s),s.isZero()||s.normalize()}clipAgainstHull(t,e,n,s,o,r,a,l,c){const h=new A;let d=-1,u=-Number.MAX_VALUE;for(let m=0;m<n.faces.length;m++){h.copy(n.faceNormals[m]),o.vmult(h,h);const x=h.dot(r);x>u&&(u=x,d=m)}const f=[];for(let m=0;m<n.faces[d].length;m++){const x=n.vertices[n.faces[d][m]],p=new A;p.copy(x),o.vmult(p,p),s.vadd(p,p),f.push(p)}d>=0&&this.clipFaceAgainstHull(r,t,e,f,a,l,c)}findSeparatingAxis(t,e,n,s,o,r,a,l){const c=new A,h=new A,d=new A,u=new A,f=new A,m=new A;let x=Number.MAX_VALUE;const p=this;if(p.uniqueAxes)for(let g=0;g!==p.uniqueAxes.length;g++){n.vmult(p.uniqueAxes[g],c);const _=p.testSepAxis(c,t,e,n,s,o);if(_===!1)return!1;_<x&&(x=_,r.copy(c))}else{const g=a?a.length:p.faces.length;for(let _=0;_<g;_++){const v=a?a[_]:_;c.copy(p.faceNormals[v]),n.vmult(c,c);const y=p.testSepAxis(c,t,e,n,s,o);if(y===!1)return!1;y<x&&(x=y,r.copy(c))}}if(t.uniqueAxes)for(let g=0;g!==t.uniqueAxes.length;g++){o.vmult(t.uniqueAxes[g],h);const _=p.testSepAxis(h,t,e,n,s,o);if(_===!1)return!1;_<x&&(x=_,r.copy(h))}else{const g=l?l.length:t.faces.length;for(let _=0;_<g;_++){const v=l?l[_]:_;h.copy(t.faceNormals[v]),o.vmult(h,h);const y=p.testSepAxis(h,t,e,n,s,o);if(y===!1)return!1;y<x&&(x=y,r.copy(h))}}for(let g=0;g!==p.uniqueEdges.length;g++){n.vmult(p.uniqueEdges[g],u);for(let _=0;_!==t.uniqueEdges.length;_++)if(o.vmult(t.uniqueEdges[_],f),u.cross(f,m),!m.almostZero()){m.normalize();const v=p.testSepAxis(m,t,e,n,s,o);if(v===!1)return!1;v<x&&(x=v,r.copy(m))}}return s.vsub(e,d),d.dot(r)>0&&r.negate(r),!0}testSepAxis(t,e,n,s,o,r){const a=this;Ro.project(a,t,n,s,hl),Ro.project(e,t,o,r,dl);const l=hl[0],c=hl[1],h=dl[0],d=dl[1];if(l<d||h<c)return!1;const u=l-d,f=h-c;return u<f?u:f}calculateLocalInertia(t,e){const n=new A,s=new A;this.computeLocalAABB(s,n);const o=n.x-s.x,r=n.y-s.y,a=n.z-s.z;e.x=1/12*t*(2*r*2*r+2*a*2*a),e.y=1/12*t*(2*o*2*o+2*a*2*a),e.z=1/12*t*(2*r*2*r+2*o*2*o)}getPlaneConstantOfFace(t){const e=this.faces[t],n=this.faceNormals[t],s=this.vertices[e[0]];return-n.dot(s)}clipFaceAgainstHull(t,e,n,s,o,r,a){const l=new A,c=new A,h=new A,d=new A,u=new A,f=new A,m=new A,x=new A,p=this,g=[],_=s,v=g;let y=-1,b=Number.MAX_VALUE;for(let E=0;E<p.faces.length;E++){l.copy(p.faceNormals[E]),n.vmult(l,l);const R=l.dot(t);R<b&&(b=R,y=E)}if(y<0)return;const w=p.faces[y];w.connectedFaces=[];for(let E=0;E<p.faces.length;E++)for(let R=0;R<p.faces[E].length;R++)w.indexOf(p.faces[E][R])!==-1&&E!==y&&w.connectedFaces.indexOf(E)===-1&&w.connectedFaces.push(E);const T=w.length;for(let E=0;E<T;E++){const R=p.vertices[w[E]],N=p.vertices[w[(E+1)%T]];R.vsub(N,c),h.copy(c),n.vmult(h,h),e.vadd(h,h),d.copy(this.faceNormals[y]),n.vmult(d,d),e.vadd(d,d),h.cross(d,u),u.negate(u),f.copy(R),n.vmult(f,f),e.vadd(f,f);const D=w.connectedFaces[E];m.copy(this.faceNormals[D]);const O=this.getPlaneConstantOfFace(D);x.copy(m),n.vmult(x,x);const F=O-x.dot(e);for(this.clipFaceAgainstPlane(_,v,x,F);_.length;)_.shift();for(;v.length;)_.push(v.shift())}m.copy(this.faceNormals[y]);const P=this.getPlaneConstantOfFace(y);x.copy(m),n.vmult(x,x);const M=P-x.dot(e);for(let E=0;E<_.length;E++){let R=x.dot(_[E])+M;if(R<=o&&(console.log(`clamped: depth=${R} to minDist=${o}`),R=o),R<=r){const N=_[E];if(R<=1e-6){const D={point:N,normal:x,depth:R};a.push(D)}}}}clipFaceAgainstPlane(t,e,n,s){let o,r;const a=t.length;if(a<2)return e;let l=t[t.length-1],c=t[0];o=n.dot(l)+s;for(let h=0;h<a;h++){if(c=t[h],r=n.dot(c)+s,o<0)if(r<0){const d=new A;d.copy(c),e.push(d)}else{const d=new A;l.lerp(c,o/(o-r),d),e.push(d)}else if(r<0){const d=new A;l.lerp(c,o/(o-r),d),e.push(d),e.push(c)}l=c,o=r}return e}computeWorldVertices(t,e){for(;this.worldVertices.length<this.vertices.length;)this.worldVertices.push(new A);const n=this.vertices,s=this.worldVertices;for(let o=0;o!==this.vertices.length;o++)e.vmult(n[o],s[o]),t.vadd(s[o],s[o]);this.worldVerticesNeedsUpdate=!1}computeLocalAABB(t,e){const n=this.vertices;t.set(Number.MAX_VALUE,Number.MAX_VALUE,Number.MAX_VALUE),e.set(-Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE);for(let s=0;s<this.vertices.length;s++){const o=n[s];o.x<t.x?t.x=o.x:o.x>e.x&&(e.x=o.x),o.y<t.y?t.y=o.y:o.y>e.y&&(e.y=o.y),o.z<t.z?t.z=o.z:o.z>e.z&&(e.z=o.z)}}computeWorldFaceNormals(t){const e=this.faceNormals.length;for(;this.worldFaceNormals.length<e;)this.worldFaceNormals.push(new A);const n=this.faceNormals,s=this.worldFaceNormals;for(let o=0;o!==e;o++)t.vmult(n[o],s[o]);this.worldFaceNormalsNeedsUpdate=!1}updateBoundingSphereRadius(){let t=0;const e=this.vertices;for(let n=0;n!==e.length;n++){const s=e[n].lengthSquared();s>t&&(t=s)}this.boundingSphereRadius=Math.sqrt(t)}calculateWorldAABB(t,e,n,s){const o=this.vertices;let r,a,l,c,h,d,u=new A;for(let f=0;f<o.length;f++){u.copy(o[f]),e.vmult(u,u),t.vadd(u,u);const m=u;(r===void 0||m.x<r)&&(r=m.x),(c===void 0||m.x>c)&&(c=m.x),(a===void 0||m.y<a)&&(a=m.y),(h===void 0||m.y>h)&&(h=m.y),(l===void 0||m.z<l)&&(l=m.z),(d===void 0||m.z>d)&&(d=m.z)}n.set(r,a,l),s.set(c,h,d)}volume(){return 4*Math.PI*this.boundingSphereRadius/3}getAveragePointLocal(t){t===void 0&&(t=new A);const e=this.vertices;for(let n=0;n<e.length;n++)t.vadd(e[n],t);return t.scale(1/e.length,t),t}transformAllPoints(t,e){const n=this.vertices.length,s=this.vertices;if(e){for(let o=0;o<n;o++){const r=s[o];e.vmult(r,r)}for(let o=0;o<this.faceNormals.length;o++){const r=this.faceNormals[o];e.vmult(r,r)}}if(t)for(let o=0;o<n;o++){const r=s[o];r.vadd(t,r)}}pointIsInside(t){const e=this.vertices,n=this.faces,s=this.faceNormals,o=new A;this.getAveragePointLocal(o);for(let r=0;r<this.faces.length;r++){let a=s[r];const l=e[n[r][0]],c=new A;t.vsub(l,c);const h=a.dot(c),d=new A;o.vsub(l,d);const u=a.dot(d);if(h<0&&u>0||h>0&&u<0)return!1}return-1}static project(t,e,n,s,o){const r=t.vertices.length,a=rb;let l=0,c=0;const h=ab,d=t.vertices;h.setZero(),ie.vectorToLocalFrame(n,s,e,a),ie.pointToLocalFrame(n,s,h,h);const u=h.dot(a);c=l=d[0].dot(a);for(let f=1;f<r;f++){const m=d[f].dot(a);m>l&&(l=m),m<c&&(c=m)}if(c-=u,l-=u,c>l){const f=c;c=l,l=f}o[0]=l,o[1]=c}}const hl=[],dl=[];new A;const rb=new A,ab=new A;class jc extends vt{constructor(t){super({type:vt.types.BOX}),this.halfExtents=t,this.convexPolyhedronRepresentation=null,this.updateConvexPolyhedronRepresentation(),this.updateBoundingSphereRadius()}updateConvexPolyhedronRepresentation(){const t=this.halfExtents.x,e=this.halfExtents.y,n=this.halfExtents.z,s=A,o=[new s(-t,-e,-n),new s(t,-e,-n),new s(t,e,-n),new s(-t,e,-n),new s(-t,-e,n),new s(t,-e,n),new s(t,e,n),new s(-t,e,n)],r=[[3,2,1,0],[4,5,6,7],[5,4,0,1],[2,3,7,6],[0,4,7,3],[1,2,6,5]],a=[new s(0,0,1),new s(0,1,0),new s(1,0,0)],l=new Ro({vertices:o,faces:r,axes:a});this.convexPolyhedronRepresentation=l,l.material=this.material}calculateLocalInertia(t,e){return e===void 0&&(e=new A),jc.calculateInertia(this.halfExtents,t,e),e}static calculateInertia(t,e,n){const s=t;n.x=1/12*e*(2*s.y*2*s.y+2*s.z*2*s.z),n.y=1/12*e*(2*s.x*2*s.x+2*s.z*2*s.z),n.z=1/12*e*(2*s.y*2*s.y+2*s.x*2*s.x)}getSideNormals(t,e){const n=t,s=this.halfExtents;if(n[0].set(s.x,0,0),n[1].set(0,s.y,0),n[2].set(0,0,s.z),n[3].set(-s.x,0,0),n[4].set(0,-s.y,0),n[5].set(0,0,-s.z),e!==void 0)for(let o=0;o!==n.length;o++)e.vmult(n[o],n[o]);return n}volume(){return 8*this.halfExtents.x*this.halfExtents.y*this.halfExtents.z}updateBoundingSphereRadius(){this.boundingSphereRadius=this.halfExtents.length()}forEachWorldCorner(t,e,n){const s=this.halfExtents,o=[[s.x,s.y,s.z],[-s.x,s.y,s.z],[-s.x,-s.y,s.z],[-s.x,-s.y,-s.z],[s.x,-s.y,-s.z],[s.x,s.y,-s.z],[-s.x,s.y,-s.z],[s.x,-s.y,s.z]];for(let r=0;r<o.length;r++)Si.set(o[r][0],o[r][1],o[r][2]),e.vmult(Si,Si),t.vadd(Si,Si),n(Si.x,Si.y,Si.z)}calculateWorldAABB(t,e,n,s){const o=this.halfExtents;Ln[0].set(o.x,o.y,o.z),Ln[1].set(-o.x,o.y,o.z),Ln[2].set(-o.x,-o.y,o.z),Ln[3].set(-o.x,-o.y,-o.z),Ln[4].set(o.x,-o.y,-o.z),Ln[5].set(o.x,o.y,-o.z),Ln[6].set(-o.x,o.y,-o.z),Ln[7].set(o.x,-o.y,o.z);const r=Ln[0];e.vmult(r,r),t.vadd(r,r),s.copy(r),n.copy(r);for(let a=1;a<8;a++){const l=Ln[a];e.vmult(l,l),t.vadd(l,l);const c=l.x,h=l.y,d=l.z;c>s.x&&(s.x=c),h>s.y&&(s.y=h),d>s.z&&(s.z=d),c<n.x&&(n.x=c),h<n.y&&(n.y=h),d<n.z&&(n.z=d)}}}const Si=new A,Ln=[new A,new A,new A,new A,new A,new A,new A,new A],Kc={DYNAMIC:1,STATIC:2,KINEMATIC:4},Zc={AWAKE:0,SLEEPY:1,SLEEPING:2};class yt extends ap{constructor(t){t===void 0&&(t={}),super(),this.id=yt.idCounter++,this.index=-1,this.world=null,this.vlambda=new A,this.collisionFilterGroup=typeof t.collisionFilterGroup=="number"?t.collisionFilterGroup:1,this.collisionFilterMask=typeof t.collisionFilterMask=="number"?t.collisionFilterMask:-1,this.collisionResponse=typeof t.collisionResponse=="boolean"?t.collisionResponse:!0,this.position=new A,this.previousPosition=new A,this.interpolatedPosition=new A,this.initPosition=new A,t.position&&(this.position.copy(t.position),this.previousPosition.copy(t.position),this.interpolatedPosition.copy(t.position),this.initPosition.copy(t.position)),this.velocity=new A,t.velocity&&this.velocity.copy(t.velocity),this.initVelocity=new A,this.force=new A;const e=typeof t.mass=="number"?t.mass:0;this.mass=e,this.invMass=e>0?1/e:0,this.material=t.material||null,this.linearDamping=typeof t.linearDamping=="number"?t.linearDamping:.01,this.type=e<=0?yt.STATIC:yt.DYNAMIC,typeof t.type==typeof yt.STATIC&&(this.type=t.type),this.allowSleep=typeof t.allowSleep<"u"?t.allowSleep:!0,this.sleepState=yt.AWAKE,this.sleepSpeedLimit=typeof t.sleepSpeedLimit<"u"?t.sleepSpeedLimit:.1,this.sleepTimeLimit=typeof t.sleepTimeLimit<"u"?t.sleepTimeLimit:1,this.timeLastSleepy=0,this.wakeUpAfterNarrowphase=!1,this.torque=new A,this.quaternion=new Pe,this.initQuaternion=new Pe,this.previousQuaternion=new Pe,this.interpolatedQuaternion=new Pe,t.quaternion&&(this.quaternion.copy(t.quaternion),this.initQuaternion.copy(t.quaternion),this.previousQuaternion.copy(t.quaternion),this.interpolatedQuaternion.copy(t.quaternion)),this.angularVelocity=new A,t.angularVelocity&&this.angularVelocity.copy(t.angularVelocity),this.initAngularVelocity=new A,this.shapes=[],this.shapeOffsets=[],this.shapeOrientations=[],this.inertia=new A,this.invInertia=new A,this.invInertiaWorld=new An,this.invMassSolve=0,this.invInertiaSolve=new A,this.invInertiaWorldSolve=new An,this.fixedRotation=typeof t.fixedRotation<"u"?t.fixedRotation:!1,this.angularDamping=typeof t.angularDamping<"u"?t.angularDamping:.01,this.linearFactor=new A(1,1,1),t.linearFactor&&this.linearFactor.copy(t.linearFactor),this.angularFactor=new A(1,1,1),t.angularFactor&&this.angularFactor.copy(t.angularFactor),this.aabb=new mn,this.aabbNeedsUpdate=!0,this.boundingRadius=0,this.wlambda=new A,this.isTrigger=!!t.isTrigger,t.shape&&this.addShape(t.shape),this.updateMassProperties()}wakeUp(){const t=this.sleepState;this.sleepState=yt.AWAKE,this.wakeUpAfterNarrowphase=!1,t===yt.SLEEPING&&this.dispatchEvent(yt.wakeupEvent)}sleep(){this.sleepState=yt.SLEEPING,this.velocity.set(0,0,0),this.angularVelocity.set(0,0,0),this.wakeUpAfterNarrowphase=!1}sleepTick(t){if(this.allowSleep){const e=this.sleepState,n=this.velocity.lengthSquared()+this.angularVelocity.lengthSquared(),s=this.sleepSpeedLimit**2;e===yt.AWAKE&&n<s?(this.sleepState=yt.SLEEPY,this.timeLastSleepy=t,this.dispatchEvent(yt.sleepyEvent)):e===yt.SLEEPY&&n>s?this.wakeUp():e===yt.SLEEPY&&t-this.timeLastSleepy>this.sleepTimeLimit&&(this.sleep(),this.dispatchEvent(yt.sleepEvent))}}updateSolveMassProperties(){this.sleepState===yt.SLEEPING||this.type===yt.KINEMATIC?(this.invMassSolve=0,this.invInertiaSolve.setZero(),this.invInertiaWorldSolve.setZero()):(this.invMassSolve=this.invMass,this.invInertiaSolve.copy(this.invInertia),this.invInertiaWorldSolve.copy(this.invInertiaWorld))}pointToLocalFrame(t,e){return e===void 0&&(e=new A),t.vsub(this.position,e),this.quaternion.conjugate().vmult(e,e),e}vectorToLocalFrame(t,e){return e===void 0&&(e=new A),this.quaternion.conjugate().vmult(t,e),e}pointToWorldFrame(t,e){return e===void 0&&(e=new A),this.quaternion.vmult(t,e),e.vadd(this.position,e),e}vectorToWorldFrame(t,e){return e===void 0&&(e=new A),this.quaternion.vmult(t,e),e}addShape(t,e,n){const s=new A,o=new Pe;return e&&s.copy(e),n&&o.copy(n),this.shapes.push(t),this.shapeOffsets.push(s),this.shapeOrientations.push(o),this.updateMassProperties(),this.updateBoundingRadius(),this.aabbNeedsUpdate=!0,t.body=this,this}removeShape(t){const e=this.shapes.indexOf(t);return e===-1?(console.warn("Shape does not belong to the body"),this):(this.shapes.splice(e,1),this.shapeOffsets.splice(e,1),this.shapeOrientations.splice(e,1),this.updateMassProperties(),this.updateBoundingRadius(),this.aabbNeedsUpdate=!0,t.body=null,this)}updateBoundingRadius(){const t=this.shapes,e=this.shapeOffsets,n=t.length;let s=0;for(let o=0;o!==n;o++){const r=t[o];r.updateBoundingSphereRadius();const a=e[o].length(),l=r.boundingSphereRadius;a+l>s&&(s=a+l)}this.boundingRadius=s}updateAABB(){const t=this.shapes,e=this.shapeOffsets,n=this.shapeOrientations,s=t.length,o=lb,r=cb,a=this.quaternion,l=this.aabb,c=hb;for(let h=0;h!==s;h++){const d=t[h];a.vmult(e[h],o),o.vadd(this.position,o),a.mult(n[h],r),d.calculateWorldAABB(o,r,c.lowerBound,c.upperBound),h===0?l.copy(c):l.extend(c)}this.aabbNeedsUpdate=!1}updateInertiaWorld(t){const e=this.invInertia;if(!(e.x===e.y&&e.y===e.z&&!t)){const n=db,s=ub;n.setRotationFromQuaternion(this.quaternion),n.transpose(s),n.scale(e,n),n.mmult(s,this.invInertiaWorld)}}applyForce(t,e){if(e===void 0&&(e=new A),this.type!==yt.DYNAMIC)return;this.sleepState===yt.SLEEPING&&this.wakeUp();const n=fb;e.cross(t,n),this.force.vadd(t,this.force),this.torque.vadd(n,this.torque)}applyLocalForce(t,e){if(e===void 0&&(e=new A),this.type!==yt.DYNAMIC)return;const n=pb,s=mb;this.vectorToWorldFrame(t,n),this.vectorToWorldFrame(e,s),this.applyForce(n,s)}applyTorque(t){this.type===yt.DYNAMIC&&(this.sleepState===yt.SLEEPING&&this.wakeUp(),this.torque.vadd(t,this.torque))}applyImpulse(t,e){if(e===void 0&&(e=new A),this.type!==yt.DYNAMIC)return;this.sleepState===yt.SLEEPING&&this.wakeUp();const n=e,s=gb;s.copy(t),s.scale(this.invMass,s),this.velocity.vadd(s,this.velocity);const o=xb;n.cross(t,o),this.invInertiaWorld.vmult(o,o),this.angularVelocity.vadd(o,this.angularVelocity)}applyLocalImpulse(t,e){if(e===void 0&&(e=new A),this.type!==yt.DYNAMIC)return;const n=_b,s=vb;this.vectorToWorldFrame(t,n),this.vectorToWorldFrame(e,s),this.applyImpulse(n,s)}updateMassProperties(){const t=yb;this.invMass=this.mass>0?1/this.mass:0;const e=this.inertia,n=this.fixedRotation;this.updateAABB(),t.set((this.aabb.upperBound.x-this.aabb.lowerBound.x)/2,(this.aabb.upperBound.y-this.aabb.lowerBound.y)/2,(this.aabb.upperBound.z-this.aabb.lowerBound.z)/2),jc.calculateInertia(t,this.mass,e),this.invInertia.set(e.x>0&&!n?1/e.x:0,e.y>0&&!n?1/e.y:0,e.z>0&&!n?1/e.z:0),this.updateInertiaWorld(!0)}getVelocityAtWorldPoint(t,e){const n=new A;return t.vsub(this.position,n),this.angularVelocity.cross(n,e),this.velocity.vadd(e,e),e}integrate(t,e,n){if(this.previousPosition.copy(this.position),this.previousQuaternion.copy(this.quaternion),!(this.type===yt.DYNAMIC||this.type===yt.KINEMATIC)||this.sleepState===yt.SLEEPING)return;const s=this.velocity,o=this.angularVelocity,r=this.position,a=this.force,l=this.torque,c=this.quaternion,h=this.invMass,d=this.invInertiaWorld,u=this.linearFactor,f=h*t;s.x+=a.x*f*u.x,s.y+=a.y*f*u.y,s.z+=a.z*f*u.z;const m=d.elements,x=this.angularFactor,p=l.x*x.x,g=l.y*x.y,_=l.z*x.z;o.x+=t*(m[0]*p+m[1]*g+m[2]*_),o.y+=t*(m[3]*p+m[4]*g+m[5]*_),o.z+=t*(m[6]*p+m[7]*g+m[8]*_),r.x+=s.x*t,r.y+=s.y*t,r.z+=s.z*t,c.integrate(this.angularVelocity,t,this.angularFactor,c),e&&(n?c.normalizeFast():c.normalize()),this.aabbNeedsUpdate=!0,this.updateInertiaWorld()}}yt.idCounter=0;yt.COLLIDE_EVENT_NAME="collide";yt.DYNAMIC=Kc.DYNAMIC;yt.STATIC=Kc.STATIC;yt.KINEMATIC=Kc.KINEMATIC;yt.AWAKE=Zc.AWAKE;yt.SLEEPY=Zc.SLEEPY;yt.SLEEPING=Zc.SLEEPING;yt.wakeupEvent={type:"wakeup"};yt.sleepyEvent={type:"sleepy"};yt.sleepEvent={type:"sleep"};const lb=new A,cb=new Pe,hb=new mn,db=new An,ub=new An;new An;const fb=new A,pb=new A,mb=new A,gb=new A,xb=new A,_b=new A,vb=new A,yb=new A;class lp{constructor(){this.world=null,this.useBoundingBoxes=!1,this.dirty=!0}collisionPairs(t,e,n){throw new Error("collisionPairs not implemented for this BroadPhase class!")}needBroadphaseCollision(t,e){return!((t.collisionFilterGroup&e.collisionFilterMask)===0||(e.collisionFilterGroup&t.collisionFilterMask)===0||((t.type&yt.STATIC)!==0||t.sleepState===yt.SLEEPING)&&((e.type&yt.STATIC)!==0||e.sleepState===yt.SLEEPING))}intersectionTest(t,e,n,s){this.useBoundingBoxes?this.doBoundingBoxBroadphase(t,e,n,s):this.doBoundingSphereBroadphase(t,e,n,s)}doBoundingSphereBroadphase(t,e,n,s){const o=bb;e.position.vsub(t.position,o);const r=(t.boundingRadius+e.boundingRadius)**2;o.lengthSquared()<r&&(n.push(t),s.push(e))}doBoundingBoxBroadphase(t,e,n,s){t.aabbNeedsUpdate&&t.updateAABB(),e.aabbNeedsUpdate&&e.updateAABB(),t.aabb.overlaps(e.aabb)&&(n.push(t),s.push(e))}makePairsUnique(t,e){const n=Mb,s=Sb,o=wb,r=t.length;for(let a=0;a!==r;a++)s[a]=t[a],o[a]=e[a];t.length=0,e.length=0;for(let a=0;a!==r;a++){const l=s[a].id,c=o[a].id,h=l<c?`${l},${c}`:`${c},${l}`;n[h]=a,n.keys.push(h)}for(let a=0;a!==n.keys.length;a++){const l=n.keys.pop(),c=n[l];t.push(s[c]),e.push(o[c]),delete n[l]}}setWorld(t){}static boundingSphereCheck(t,e){const n=new A;t.position.vsub(e.position,n);const s=t.shapes[0],o=e.shapes[0];return Math.pow(s.boundingSphereRadius+o.boundingSphereRadius,2)>n.lengthSquared()}aabbQuery(t,e,n){return console.warn(".aabbQuery is not implemented in this Broadphase subclass."),[]}}const bb=new A;new A;new Pe;new A;const Mb={keys:[]},Sb=[],wb=[];new A;new A;new A;class Eb extends lp{constructor(){super()}collisionPairs(t,e,n){const s=t.bodies,o=s.length;let r,a;for(let l=0;l!==o;l++)for(let c=0;c!==l;c++)r=s[l],a=s[c],this.needBroadphaseCollision(r,a)&&this.intersectionTest(r,a,e,n)}aabbQuery(t,e,n){n===void 0&&(n=[]);for(let s=0;s<t.bodies.length;s++){const o=t.bodies[s];o.aabbNeedsUpdate&&o.updateAABB(),o.aabb.overlaps(e)&&n.push(o)}return n}}class sa{constructor(){this.rayFromWorld=new A,this.rayToWorld=new A,this.hitNormalWorld=new A,this.hitPointWorld=new A,this.hasHit=!1,this.shape=null,this.body=null,this.hitFaceIndex=-1,this.distance=-1,this.shouldStop=!1}reset(){this.rayFromWorld.setZero(),this.rayToWorld.setZero(),this.hitNormalWorld.setZero(),this.hitPointWorld.setZero(),this.hasHit=!1,this.shape=null,this.body=null,this.hitFaceIndex=-1,this.distance=-1,this.shouldStop=!1}abort(){this.shouldStop=!0}set(t,e,n,s,o,r,a){this.rayFromWorld.copy(t),this.rayToWorld.copy(e),this.hitNormalWorld.copy(n),this.hitPointWorld.copy(s),this.shape=o,this.body=r,this.distance=a}}let cp,hp,dp,up,fp,pp,mp;const Jc={CLOSEST:1,ANY:2,ALL:4};cp=vt.types.SPHERE;hp=vt.types.PLANE;dp=vt.types.BOX;up=vt.types.CYLINDER;fp=vt.types.CONVEXPOLYHEDRON;pp=vt.types.HEIGHTFIELD;mp=vt.types.TRIMESH;class Re{get[cp](){return this._intersectSphere}get[hp](){return this._intersectPlane}get[dp](){return this._intersectBox}get[up](){return this._intersectConvex}get[fp](){return this._intersectConvex}get[pp](){return this._intersectHeightfield}get[mp](){return this._intersectTrimesh}constructor(t,e){t===void 0&&(t=new A),e===void 0&&(e=new A),this.from=t.clone(),this.to=e.clone(),this.direction=new A,this.precision=1e-4,this.checkCollisionResponse=!0,this.skipBackfaces=!1,this.collisionFilterMask=-1,this.collisionFilterGroup=-1,this.mode=Re.ANY,this.result=new sa,this.hasHit=!1,this.callback=n=>{}}intersectWorld(t,e){return this.mode=e.mode||Re.ANY,this.result=e.result||new sa,this.skipBackfaces=!!e.skipBackfaces,this.collisionFilterMask=typeof e.collisionFilterMask<"u"?e.collisionFilterMask:-1,this.collisionFilterGroup=typeof e.collisionFilterGroup<"u"?e.collisionFilterGroup:-1,this.checkCollisionResponse=typeof e.checkCollisionResponse<"u"?e.checkCollisionResponse:!0,e.from&&this.from.copy(e.from),e.to&&this.to.copy(e.to),this.callback=e.callback||(()=>{}),this.hasHit=!1,this.result.reset(),this.updateDirection(),this.getAABB(Nd),ul.length=0,t.broadphase.aabbQuery(t,Nd,ul),this.intersectBodies(ul),this.hasHit}intersectBody(t,e){e&&(this.result=e,this.updateDirection());const n=this.checkCollisionResponse;if(n&&!t.collisionResponse||(this.collisionFilterGroup&t.collisionFilterMask)===0||(t.collisionFilterGroup&this.collisionFilterMask)===0)return;const s=Tb,o=Ab;for(let r=0,a=t.shapes.length;r<a;r++){const l=t.shapes[r];if(!(n&&!l.collisionResponse)&&(t.quaternion.mult(t.shapeOrientations[r],o),t.quaternion.vmult(t.shapeOffsets[r],s),s.vadd(t.position,s),this.intersectShape(l,o,s,t),this.result.shouldStop))break}}intersectBodies(t,e){e&&(this.result=e,this.updateDirection());for(let n=0,s=t.length;!this.result.shouldStop&&n<s;n++)this.intersectBody(t[n])}updateDirection(){this.to.vsub(this.from,this.direction),this.direction.normalize()}intersectShape(t,e,n,s){const o=this.from;if(Vb(o,this.direction,n)>t.boundingSphereRadius)return;const a=this[t.type];a&&a.call(this,t,e,n,s,t)}_intersectBox(t,e,n,s,o){return this._intersectConvex(t.convexPolyhedronRepresentation,e,n,s,o)}_intersectPlane(t,e,n,s,o){const r=this.from,a=this.to,l=this.direction,c=new A(0,0,1);e.vmult(c,c);const h=new A;r.vsub(n,h);const d=h.dot(c);a.vsub(n,h);const u=h.dot(c);if(d*u>0||r.distanceTo(a)<d)return;const f=c.dot(l);if(Math.abs(f)<this.precision)return;const m=new A,x=new A,p=new A;r.vsub(n,m);const g=-c.dot(m)/f;l.scale(g,x),r.vadd(x,p),this.reportIntersection(c,p,o,s,-1)}getAABB(t){const{lowerBound:e,upperBound:n}=t,s=this.to,o=this.from;e.x=Math.min(s.x,o.x),e.y=Math.min(s.y,o.y),e.z=Math.min(s.z,o.z),n.x=Math.max(s.x,o.x),n.y=Math.max(s.y,o.y),n.z=Math.max(s.z,o.z)}_intersectHeightfield(t,e,n,s,o){t.data,t.elementSize;const r=Cb;r.from.copy(this.from),r.to.copy(this.to),ie.pointToLocalFrame(n,e,r.from,r.from),ie.pointToLocalFrame(n,e,r.to,r.to),r.updateDirection();const a=Rb;let l,c,h,d;l=c=0,h=d=t.data.length-1;const u=new mn;r.getAABB(u),t.getIndexOfPosition(u.lowerBound.x,u.lowerBound.y,a,!0),l=Math.max(l,a[0]),c=Math.max(c,a[1]),t.getIndexOfPosition(u.upperBound.x,u.upperBound.y,a,!0),h=Math.min(h,a[0]+1),d=Math.min(d,a[1]+1);for(let f=l;f<h;f++)for(let m=c;m<d;m++){if(this.result.shouldStop)return;if(t.getAabbAtIndex(f,m,u),!!u.overlapsRay(r)){if(t.getConvexTrianglePillar(f,m,!1),ie.pointToWorldFrame(n,e,t.pillarOffset,Mr),this._intersectConvex(t.pillarConvex,e,Mr,s,o,Od),this.result.shouldStop)return;t.getConvexTrianglePillar(f,m,!0),ie.pointToWorldFrame(n,e,t.pillarOffset,Mr),this._intersectConvex(t.pillarConvex,e,Mr,s,o,Od)}}}_intersectSphere(t,e,n,s,o){const r=this.from,a=this.to,l=t.radius,c=(a.x-r.x)**2+(a.y-r.y)**2+(a.z-r.z)**2,h=2*((a.x-r.x)*(r.x-n.x)+(a.y-r.y)*(r.y-n.y)+(a.z-r.z)*(r.z-n.z)),d=(r.x-n.x)**2+(r.y-n.y)**2+(r.z-n.z)**2-l**2,u=h**2-4*c*d,f=Pb,m=Lb;if(!(u<0))if(u===0)r.lerp(a,u,f),f.vsub(n,m),m.normalize(),this.reportIntersection(m,f,o,s,-1);else{const x=(-h-Math.sqrt(u))/(2*c),p=(-h+Math.sqrt(u))/(2*c);if(x>=0&&x<=1&&(r.lerp(a,x,f),f.vsub(n,m),m.normalize(),this.reportIntersection(m,f,o,s,-1)),this.result.shouldStop)return;p>=0&&p<=1&&(r.lerp(a,p,f),f.vsub(n,m),m.normalize(),this.reportIntersection(m,f,o,s,-1))}}_intersectConvex(t,e,n,s,o,r){const a=Db,l=Ud,c=r&&r.faceList||null,h=t.faces,d=t.vertices,u=t.faceNormals,f=this.direction,m=this.from,x=this.to,p=m.distanceTo(x),g=c?c.length:h.length,_=this.result;for(let v=0;!_.shouldStop&&v<g;v++){const y=c?c[v]:v,b=h[y],w=u[y],T=e,P=n;l.copy(d[b[0]]),T.vmult(l,l),l.vadd(P,l),l.vsub(m,l),T.vmult(w,a);const M=f.dot(a);if(Math.abs(M)<this.precision)continue;const E=a.dot(l)/M;if(!(E<0)){f.scale(E,nn),nn.vadd(m,nn),wn.copy(d[b[0]]),T.vmult(wn,wn),P.vadd(wn,wn);for(let R=1;!_.shouldStop&&R<b.length-1;R++){Dn.copy(d[b[R]]),In.copy(d[b[R+1]]),T.vmult(Dn,Dn),T.vmult(In,In),P.vadd(Dn,Dn),P.vadd(In,In);const N=nn.distanceTo(m);!(Re.pointInTriangle(nn,wn,Dn,In)||Re.pointInTriangle(nn,Dn,wn,In))||N>p||this.reportIntersection(a,nn,o,s,y)}}}}_intersectTrimesh(t,e,n,s,o,r){const a=Ib,l=zb,c=kb,h=Ud,d=Fb,u=Nb,f=Ob,m=Bb,x=Ub,p=t.indices;t.vertices;const g=this.from,_=this.to,v=this.direction;c.position.copy(n),c.quaternion.copy(e),ie.vectorToLocalFrame(n,e,v,d),ie.pointToLocalFrame(n,e,g,u),ie.pointToLocalFrame(n,e,_,f),f.x*=t.scale.x,f.y*=t.scale.y,f.z*=t.scale.z,u.x*=t.scale.x,u.y*=t.scale.y,u.z*=t.scale.z,f.vsub(u,d),d.normalize();const y=u.distanceSquared(f);t.tree.rayQuery(this,c,l);for(let b=0,w=l.length;!this.result.shouldStop&&b!==w;b++){const T=l[b];t.getNormal(T,a),t.getVertex(p[T*3],wn),wn.vsub(u,h);const P=d.dot(a),M=a.dot(h)/P;if(M<0)continue;d.scale(M,nn),nn.vadd(u,nn),t.getVertex(p[T*3+1],Dn),t.getVertex(p[T*3+2],In);const E=nn.distanceSquared(u);!(Re.pointInTriangle(nn,Dn,wn,In)||Re.pointInTriangle(nn,wn,Dn,In))||E>y||(ie.vectorToWorldFrame(e,a,x),ie.pointToWorldFrame(n,e,nn,m),this.reportIntersection(x,m,o,s,T))}l.length=0}reportIntersection(t,e,n,s,o){const r=this.from,a=this.to,l=r.distanceTo(e),c=this.result;if(!(this.skipBackfaces&&t.dot(this.direction)>0))switch(c.hitFaceIndex=typeof o<"u"?o:-1,this.mode){case Re.ALL:this.hasHit=!0,c.set(r,a,t,e,n,s,l),c.hasHit=!0,this.callback(c);break;case Re.CLOSEST:(l<c.distance||!c.hasHit)&&(this.hasHit=!0,c.hasHit=!0,c.set(r,a,t,e,n,s,l));break;case Re.ANY:this.hasHit=!0,c.hasHit=!0,c.set(r,a,t,e,n,s,l),c.shouldStop=!0;break}}static pointInTriangle(t,e,n,s){s.vsub(e,es),n.vsub(e,co),t.vsub(e,fl);const o=es.dot(es),r=es.dot(co),a=es.dot(fl),l=co.dot(co),c=co.dot(fl);let h,d;return(h=l*a-r*c)>=0&&(d=o*c-r*a)>=0&&h+d<o*l-r*r}}Re.CLOSEST=Jc.CLOSEST;Re.ANY=Jc.ANY;Re.ALL=Jc.ALL;const Nd=new mn,ul=[],co=new A,fl=new A,Tb=new A,Ab=new Pe,nn=new A,wn=new A,Dn=new A,In=new A;new A;new sa;const Od={faceList:[0]},Mr=new A,Cb=new Re,Rb=[],Pb=new A,Lb=new A,Db=new A;new A;new A;const Ud=new A,Ib=new A,Fb=new A,Nb=new A,Ob=new A,Ub=new A,Bb=new A;new mn;const zb=[],kb=new ie,es=new A,Sr=new A;function Vb(i,t,e){e.vsub(i,es);const n=es.dot(t);return t.scale(n,Sr),Sr.vadd(i,Sr),e.distanceTo(Sr)}class Is extends lp{static checkBounds(t,e,n){let s,o;n===0?(s=t.position.x,o=e.position.x):n===1?(s=t.position.y,o=e.position.y):n===2&&(s=t.position.z,o=e.position.z);const r=t.boundingRadius,a=e.boundingRadius,l=s+r;return o-a<l}static insertionSortX(t){for(let e=1,n=t.length;e<n;e++){const s=t[e];let o;for(o=e-1;o>=0&&!(t[o].aabb.lowerBound.x<=s.aabb.lowerBound.x);o--)t[o+1]=t[o];t[o+1]=s}return t}static insertionSortY(t){for(let e=1,n=t.length;e<n;e++){const s=t[e];let o;for(o=e-1;o>=0&&!(t[o].aabb.lowerBound.y<=s.aabb.lowerBound.y);o--)t[o+1]=t[o];t[o+1]=s}return t}static insertionSortZ(t){for(let e=1,n=t.length;e<n;e++){const s=t[e];let o;for(o=e-1;o>=0&&!(t[o].aabb.lowerBound.z<=s.aabb.lowerBound.z);o--)t[o+1]=t[o];t[o+1]=s}return t}constructor(t){super(),this.axisList=[],this.world=null,this.axisIndex=0;const e=this.axisList;this._addBodyHandler=n=>{e.push(n.body)},this._removeBodyHandler=n=>{const s=e.indexOf(n.body);s!==-1&&e.splice(s,1)},t&&this.setWorld(t)}setWorld(t){this.axisList.length=0;for(let e=0;e<t.bodies.length;e++)this.axisList.push(t.bodies[e]);t.removeEventListener("addBody",this._addBodyHandler),t.removeEventListener("removeBody",this._removeBodyHandler),t.addEventListener("addBody",this._addBodyHandler),t.addEventListener("removeBody",this._removeBodyHandler),this.world=t,this.dirty=!0}collisionPairs(t,e,n){const s=this.axisList,o=s.length,r=this.axisIndex;let a,l;for(this.dirty&&(this.sortList(),this.dirty=!1),a=0;a!==o;a++){const c=s[a];for(l=a+1;l<o;l++){const h=s[l];if(this.needBroadphaseCollision(c,h)){if(!Is.checkBounds(c,h,r))break;this.intersectionTest(c,h,e,n)}}}}sortList(){const t=this.axisList,e=this.axisIndex,n=t.length;for(let s=0;s!==n;s++){const o=t[s];o.aabbNeedsUpdate&&o.updateAABB()}e===0?Is.insertionSortX(t):e===1?Is.insertionSortY(t):e===2&&Is.insertionSortZ(t)}autoDetectAxis(){let t=0,e=0,n=0,s=0,o=0,r=0;const a=this.axisList,l=a.length,c=1/l;for(let f=0;f!==l;f++){const m=a[f],x=m.position.x;t+=x,e+=x*x;const p=m.position.y;n+=p,s+=p*p;const g=m.position.z;o+=g,r+=g*g}const h=e-t*t*c,d=s-n*n*c,u=r-o*o*c;h>d?h>u?this.axisIndex=0:this.axisIndex=2:d>u?this.axisIndex=1:this.axisIndex=2}aabbQuery(t,e,n){n===void 0&&(n=[]),this.dirty&&(this.sortList(),this.dirty=!1);const s=this.axisIndex;let o="x";s===1&&(o="y"),s===2&&(o="z");const r=this.axisList;e.lowerBound[o],e.upperBound[o];for(let a=0;a<r.length;a++){const l=r[a];l.aabbNeedsUpdate&&l.updateAABB(),l.aabb.overlaps(e)&&n.push(l)}return n}}class Hb{static defaults(t,e){t===void 0&&(t={});for(let n in e)n in t||(t[n]=e[n]);return t}}class Bd{constructor(){this.spatial=new A,this.rotational=new A}multiplyElement(t){return t.spatial.dot(this.spatial)+t.rotational.dot(this.rotational)}multiplyVectors(t,e){return t.dot(this.spatial)+e.dot(this.rotational)}}class Yo{constructor(t,e,n,s){n===void 0&&(n=-1e6),s===void 0&&(s=1e6),this.id=Yo.idCounter++,this.minForce=n,this.maxForce=s,this.bi=t,this.bj=e,this.a=0,this.b=0,this.eps=0,this.jacobianElementA=new Bd,this.jacobianElementB=new Bd,this.enabled=!0,this.multiplier=0,this.setSpookParams(1e7,4,1/60)}setSpookParams(t,e,n){const s=e,o=t,r=n;this.a=4/(r*(1+4*s)),this.b=4*s/(1+4*s),this.eps=4/(r*r*o*(1+4*s))}computeB(t,e,n){const s=this.computeGW(),o=this.computeGq(),r=this.computeGiMf();return-o*t-s*e-r*n}computeGq(){const t=this.jacobianElementA,e=this.jacobianElementB,n=this.bi,s=this.bj,o=n.position,r=s.position;return t.spatial.dot(o)+e.spatial.dot(r)}computeGW(){const t=this.jacobianElementA,e=this.jacobianElementB,n=this.bi,s=this.bj,o=n.velocity,r=s.velocity,a=n.angularVelocity,l=s.angularVelocity;return t.multiplyVectors(o,a)+e.multiplyVectors(r,l)}computeGWlambda(){const t=this.jacobianElementA,e=this.jacobianElementB,n=this.bi,s=this.bj,o=n.vlambda,r=s.vlambda,a=n.wlambda,l=s.wlambda;return t.multiplyVectors(o,a)+e.multiplyVectors(r,l)}computeGiMf(){const t=this.jacobianElementA,e=this.jacobianElementB,n=this.bi,s=this.bj,o=n.force,r=n.torque,a=s.force,l=s.torque,c=n.invMassSolve,h=s.invMassSolve;return o.scale(c,zd),a.scale(h,kd),n.invInertiaWorldSolve.vmult(r,Vd),s.invInertiaWorldSolve.vmult(l,Hd),t.multiplyVectors(zd,Vd)+e.multiplyVectors(kd,Hd)}computeGiMGt(){const t=this.jacobianElementA,e=this.jacobianElementB,n=this.bi,s=this.bj,o=n.invMassSolve,r=s.invMassSolve,a=n.invInertiaWorldSolve,l=s.invInertiaWorldSolve;let c=o+r;return a.vmult(t.rotational,wr),c+=wr.dot(t.rotational),l.vmult(e.rotational,wr),c+=wr.dot(e.rotational),c}addToWlambda(t){const e=this.jacobianElementA,n=this.jacobianElementB,s=this.bi,o=this.bj,r=Gb;s.vlambda.addScaledVector(s.invMassSolve*t,e.spatial,s.vlambda),o.vlambda.addScaledVector(o.invMassSolve*t,n.spatial,o.vlambda),s.invInertiaWorldSolve.vmult(e.rotational,r),s.wlambda.addScaledVector(t,r,s.wlambda),o.invInertiaWorldSolve.vmult(n.rotational,r),o.wlambda.addScaledVector(t,r,o.wlambda)}computeC(){return this.computeGiMGt()+this.eps}}Yo.idCounter=0;const zd=new A,kd=new A,Vd=new A,Hd=new A,wr=new A,Gb=new A;class Wb extends Yo{constructor(t,e,n){n===void 0&&(n=1e6),super(t,e,0,n),this.restitution=0,this.ri=new A,this.rj=new A,this.ni=new A}computeB(t){const e=this.a,n=this.b,s=this.bi,o=this.bj,r=this.ri,a=this.rj,l=qb,c=Xb,h=s.velocity,d=s.angularVelocity;s.force,s.torque;const u=o.velocity,f=o.angularVelocity;o.force,o.torque;const m=$b,x=this.jacobianElementA,p=this.jacobianElementB,g=this.ni;r.cross(g,l),a.cross(g,c),g.negate(x.spatial),l.negate(x.rotational),p.spatial.copy(g),p.rotational.copy(c),m.copy(o.position),m.vadd(a,m),m.vsub(s.position,m),m.vsub(r,m);const _=g.dot(m),v=this.restitution+1,y=v*u.dot(g)-v*h.dot(g)+f.dot(c)-d.dot(l),b=this.computeGiMf();return-_*e-y*n-t*b}getImpactVelocityAlongNormal(){const t=Yb,e=jb,n=Kb,s=Zb,o=Jb;return this.bi.position.vadd(this.ri,n),this.bj.position.vadd(this.rj,s),this.bi.getVelocityAtWorldPoint(n,t),this.bj.getVelocityAtWorldPoint(s,e),t.vsub(e,o),this.ni.dot(o)}}const qb=new A,Xb=new A,$b=new A,Yb=new A,jb=new A,Kb=new A,Zb=new A,Jb=new A;new A;new A;new A;new A;new A;new A;new A;new A;new A;new A;class Gd extends Yo{constructor(t,e,n){super(t,e,-n,n),this.ri=new A,this.rj=new A,this.t=new A}computeB(t){this.a;const e=this.b;this.bi,this.bj;const n=this.ri,s=this.rj,o=Qb,r=tM,a=this.t;n.cross(a,o),s.cross(a,r);const l=this.jacobianElementA,c=this.jacobianElementB;a.negate(l.spatial),o.negate(l.rotational),c.spatial.copy(a),c.rotational.copy(r);const h=this.computeGW(),d=this.computeGiMf();return-h*e-t*d}}const Qb=new A,tM=new A;class xa{constructor(t,e,n){n=Hb.defaults(n,{friction:.3,restitution:.3,contactEquationStiffness:1e7,contactEquationRelaxation:3,frictionEquationStiffness:1e7,frictionEquationRelaxation:3}),this.id=xa.idCounter++,this.materials=[t,e],this.friction=n.friction,this.restitution=n.restitution,this.contactEquationStiffness=n.contactEquationStiffness,this.contactEquationRelaxation=n.contactEquationRelaxation,this.frictionEquationStiffness=n.frictionEquationStiffness,this.frictionEquationRelaxation=n.frictionEquationRelaxation}}xa.idCounter=0;class Xs{constructor(t){t===void 0&&(t={});let e="";typeof t=="string"&&(e=t,t={}),this.name=e,this.id=Xs.idCounter++,this.friction=typeof t.friction<"u"?t.friction:-1,this.restitution=typeof t.restitution<"u"?t.restitution:-1}}Xs.idCounter=0;class eM{constructor(t,e,n){n===void 0&&(n={}),this.restLength=typeof n.restLength=="number"?n.restLength:1,this.stiffness=n.stiffness||100,this.damping=n.damping||1,this.bodyA=t,this.bodyB=e,this.localAnchorA=new A,this.localAnchorB=new A,n.localAnchorA&&this.localAnchorA.copy(n.localAnchorA),n.localAnchorB&&this.localAnchorB.copy(n.localAnchorB),n.worldAnchorA&&this.setWorldAnchorA(n.worldAnchorA),n.worldAnchorB&&this.setWorldAnchorB(n.worldAnchorB)}setWorldAnchorA(t){this.bodyA.pointToLocalFrame(t,this.localAnchorA)}setWorldAnchorB(t){this.bodyB.pointToLocalFrame(t,this.localAnchorB)}getWorldAnchorA(t){this.bodyA.pointToWorldFrame(this.localAnchorA,t)}getWorldAnchorB(t){this.bodyB.pointToWorldFrame(this.localAnchorB,t)}applyForce(){const t=this.stiffness,e=this.damping,n=this.restLength,s=this.bodyA,o=this.bodyB,r=nM,a=iM,l=sM,c=oM,h=uM,d=rM,u=aM,f=lM,m=cM,x=hM,p=dM;this.getWorldAnchorA(d),this.getWorldAnchorB(u),d.vsub(s.position,f),u.vsub(o.position,m),u.vsub(d,r);const g=r.length();a.copy(r),a.normalize(),o.velocity.vsub(s.velocity,l),o.angularVelocity.cross(m,h),l.vadd(h,l),s.angularVelocity.cross(f,h),l.vsub(h,l),a.scale(-t*(g-n)-e*l.dot(a),c),s.force.vsub(c,s.force),o.force.vadd(c,o.force),f.cross(c,x),m.cross(c,p),s.torque.vsub(x,s.torque),o.torque.vadd(p,o.torque)}}const nM=new A,iM=new A,sM=new A,oM=new A,rM=new A,aM=new A,lM=new A,cM=new A,hM=new A,dM=new A,uM=new A;new A;new A;new A;new A;new A;new A;new A;new A;new Re;new A;new A;new A;new A(1,0,0),new A(0,1,0),new A(0,0,1);new A;new A;new A;new A;new A;new A;new A;new A;new A;new A;new A;class fM extends vt{constructor(t){if(super({type:vt.types.SPHERE}),this.radius=t!==void 0?t:1,this.radius<0)throw new Error("The sphere radius cannot be negative.");this.updateBoundingSphereRadius()}calculateLocalInertia(t,e){e===void 0&&(e=new A);const n=2*t*this.radius*this.radius/5;return e.x=n,e.y=n,e.z=n,e}volume(){return 4*Math.PI*Math.pow(this.radius,3)/3}updateBoundingSphereRadius(){this.boundingSphereRadius=this.radius}calculateWorldAABB(t,e,n,s){const o=this.radius,r=["x","y","z"];for(let a=0;a<r.length;a++){const l=r[a];n[l]=t[l]-o,s[l]=t[l]+o}}}new A;new A;new A;new A;new A;new A;new A;new A;new A;class pM extends vt{constructor(){super({type:vt.types.PLANE}),this.worldNormal=new A,this.worldNormalNeedsUpdate=!0,this.boundingSphereRadius=Number.MAX_VALUE}computeWorldNormal(t){const e=this.worldNormal;e.set(0,0,1),t.vmult(e,e),this.worldNormalNeedsUpdate=!1}calculateLocalInertia(t,e){return e===void 0&&(e=new A),e}volume(){return Number.MAX_VALUE}calculateWorldAABB(t,e,n,s){Jn.set(0,0,1),e.vmult(Jn,Jn);const o=Number.MAX_VALUE;n.set(-o,-o,-o),s.set(o,o,o),Jn.x===1?s.x=t.x:Jn.x===-1&&(n.x=t.x),Jn.y===1?s.y=t.y:Jn.y===-1&&(n.y=t.y),Jn.z===1?s.z=t.z:Jn.z===-1&&(n.z=t.z)}updateBoundingSphereRadius(){this.boundingSphereRadius=Number.MAX_VALUE}}const Jn=new A;new A;new A;new A;new A;new A;new A;new A;new A;new A;new A;new mn;new A;new mn;new A;new A;new A;new A;new A;new A;new A;new mn;new A;new ie;new mn;class mM{constructor(){this.equations=[]}solve(t,e){return 0}addEquation(t){t.enabled&&!t.bi.isTrigger&&!t.bj.isTrigger&&this.equations.push(t)}removeEquation(t){const e=this.equations,n=e.indexOf(t);n!==-1&&e.splice(n,1)}removeAllEquations(){this.equations.length=0}}class gM extends mM{constructor(){super(),this.iterations=10,this.tolerance=1e-7}solve(t,e){let n=0;const s=this.iterations,o=this.tolerance*this.tolerance,r=this.equations,a=r.length,l=e.bodies,c=l.length,h=t;let d,u,f,m,x,p;if(a!==0)for(let y=0;y!==c;y++)l[y].updateSolveMassProperties();const g=_M,_=vM,v=xM;g.length=a,_.length=a,v.length=a;for(let y=0;y!==a;y++){const b=r[y];v[y]=0,_[y]=b.computeB(h),g[y]=1/b.computeC()}if(a!==0){for(let w=0;w!==c;w++){const T=l[w],P=T.vlambda,M=T.wlambda;P.set(0,0,0),M.set(0,0,0)}for(n=0;n!==s;n++){m=0;for(let w=0;w!==a;w++){const T=r[w];d=_[w],u=g[w],p=v[w],x=T.computeGWlambda(),f=u*(d-x-T.eps*p),p+f<T.minForce?f=T.minForce-p:p+f>T.maxForce&&(f=T.maxForce-p),v[w]+=f,m+=f>0?f:-f,T.addToWlambda(f)}if(m*m<o)break}for(let w=0;w!==c;w++){const T=l[w],P=T.velocity,M=T.angularVelocity;T.vlambda.vmul(T.linearFactor,T.vlambda),P.vadd(T.vlambda,P),T.wlambda.vmul(T.angularFactor,T.wlambda),M.vadd(T.wlambda,M)}let y=r.length;const b=1/h;for(;y--;)r[y].multiplier=v[y]*b}return n}}const xM=[],_M=[],vM=[];class yM{constructor(){this.objects=[],this.type=Object}release(){const t=arguments.length;for(let e=0;e!==t;e++)this.objects.push(e<0||arguments.length<=e?void 0:arguments[e]);return this}get(){return this.objects.length===0?this.constructObject():this.objects.pop()}constructObject(){throw new Error("constructObject() not implemented in this Pool subclass yet!")}resize(t){const e=this.objects;for(;e.length>t;)e.pop();for(;e.length<t;)e.push(this.constructObject());return this}}class bM extends yM{constructor(){super(...arguments),this.type=A}constructObject(){return new A}}const xe={sphereSphere:vt.types.SPHERE,spherePlane:vt.types.SPHERE|vt.types.PLANE,boxBox:vt.types.BOX|vt.types.BOX,sphereBox:vt.types.SPHERE|vt.types.BOX,planeBox:vt.types.PLANE|vt.types.BOX,convexConvex:vt.types.CONVEXPOLYHEDRON,sphereConvex:vt.types.SPHERE|vt.types.CONVEXPOLYHEDRON,planeConvex:vt.types.PLANE|vt.types.CONVEXPOLYHEDRON,boxConvex:vt.types.BOX|vt.types.CONVEXPOLYHEDRON,sphereHeightfield:vt.types.SPHERE|vt.types.HEIGHTFIELD,boxHeightfield:vt.types.BOX|vt.types.HEIGHTFIELD,convexHeightfield:vt.types.CONVEXPOLYHEDRON|vt.types.HEIGHTFIELD,sphereParticle:vt.types.PARTICLE|vt.types.SPHERE,planeParticle:vt.types.PLANE|vt.types.PARTICLE,boxParticle:vt.types.BOX|vt.types.PARTICLE,convexParticle:vt.types.PARTICLE|vt.types.CONVEXPOLYHEDRON,cylinderCylinder:vt.types.CYLINDER,sphereCylinder:vt.types.SPHERE|vt.types.CYLINDER,planeCylinder:vt.types.PLANE|vt.types.CYLINDER,boxCylinder:vt.types.BOX|vt.types.CYLINDER,convexCylinder:vt.types.CONVEXPOLYHEDRON|vt.types.CYLINDER,heightfieldCylinder:vt.types.HEIGHTFIELD|vt.types.CYLINDER,particleCylinder:vt.types.PARTICLE|vt.types.CYLINDER,sphereTrimesh:vt.types.SPHERE|vt.types.TRIMESH,planeTrimesh:vt.types.PLANE|vt.types.TRIMESH};class MM{get[xe.sphereSphere](){return this.sphereSphere}get[xe.spherePlane](){return this.spherePlane}get[xe.boxBox](){return this.boxBox}get[xe.sphereBox](){return this.sphereBox}get[xe.planeBox](){return this.planeBox}get[xe.convexConvex](){return this.convexConvex}get[xe.sphereConvex](){return this.sphereConvex}get[xe.planeConvex](){return this.planeConvex}get[xe.boxConvex](){return this.boxConvex}get[xe.sphereHeightfield](){return this.sphereHeightfield}get[xe.boxHeightfield](){return this.boxHeightfield}get[xe.convexHeightfield](){return this.convexHeightfield}get[xe.sphereParticle](){return this.sphereParticle}get[xe.planeParticle](){return this.planeParticle}get[xe.boxParticle](){return this.boxParticle}get[xe.convexParticle](){return this.convexParticle}get[xe.cylinderCylinder](){return this.convexConvex}get[xe.sphereCylinder](){return this.sphereConvex}get[xe.planeCylinder](){return this.planeConvex}get[xe.boxCylinder](){return this.boxConvex}get[xe.convexCylinder](){return this.convexConvex}get[xe.heightfieldCylinder](){return this.heightfieldCylinder}get[xe.particleCylinder](){return this.particleCylinder}get[xe.sphereTrimesh](){return this.sphereTrimesh}get[xe.planeTrimesh](){return this.planeTrimesh}constructor(t){this.contactPointPool=[],this.frictionEquationPool=[],this.result=[],this.frictionResult=[],this.v3pool=new bM,this.world=t,this.currentContactMaterial=t.defaultContactMaterial,this.enableFrictionReduction=!1}createContactEquation(t,e,n,s,o,r){let a;this.contactPointPool.length?(a=this.contactPointPool.pop(),a.bi=t,a.bj=e):a=new Wb(t,e),a.enabled=t.collisionResponse&&e.collisionResponse&&n.collisionResponse&&s.collisionResponse;const l=this.currentContactMaterial;a.restitution=l.restitution,a.setSpookParams(l.contactEquationStiffness,l.contactEquationRelaxation,this.world.dt);const c=n.material||t.material,h=s.material||e.material;return c&&h&&c.restitution>=0&&h.restitution>=0&&(a.restitution=c.restitution*h.restitution),a.si=o||n,a.sj=r||s,a}createFrictionEquationsFromContact(t,e){const n=t.bi,s=t.bj,o=t.si,r=t.sj,a=this.world,l=this.currentContactMaterial;let c=l.friction;const h=o.material||n.material,d=r.material||s.material;if(h&&d&&h.friction>=0&&d.friction>=0&&(c=h.friction*d.friction),c>0){const u=c*(a.frictionGravity||a.gravity).length();let f=n.invMass+s.invMass;f>0&&(f=1/f);const m=this.frictionEquationPool,x=m.length?m.pop():new Gd(n,s,u*f),p=m.length?m.pop():new Gd(n,s,u*f);return x.bi=p.bi=n,x.bj=p.bj=s,x.minForce=p.minForce=-u*f,x.maxForce=p.maxForce=u*f,x.ri.copy(t.ri),x.rj.copy(t.rj),p.ri.copy(t.ri),p.rj.copy(t.rj),t.ni.tangents(x.t,p.t),x.setSpookParams(l.frictionEquationStiffness,l.frictionEquationRelaxation,a.dt),p.setSpookParams(l.frictionEquationStiffness,l.frictionEquationRelaxation,a.dt),x.enabled=p.enabled=t.enabled,e.push(x,p),!0}return!1}createFrictionFromAverage(t){let e=this.result[this.result.length-1];if(!this.createFrictionEquationsFromContact(e,this.frictionResult)||t===1)return;const n=this.frictionResult[this.frictionResult.length-2],s=this.frictionResult[this.frictionResult.length-1];qi.setZero(),Cs.setZero(),Rs.setZero();const o=e.bi;e.bj;for(let a=0;a!==t;a++)e=this.result[this.result.length-1-a],e.bi!==o?(qi.vadd(e.ni,qi),Cs.vadd(e.ri,Cs),Rs.vadd(e.rj,Rs)):(qi.vsub(e.ni,qi),Cs.vadd(e.rj,Cs),Rs.vadd(e.ri,Rs));const r=1/t;Cs.scale(r,n.ri),Rs.scale(r,n.rj),s.ri.copy(n.ri),s.rj.copy(n.rj),qi.normalize(),qi.tangents(n.t,s.t)}getContacts(t,e,n,s,o,r,a){this.contactPointPool=o,this.frictionEquationPool=a,this.result=s,this.frictionResult=r;const l=EM,c=TM,h=SM,d=wM;for(let u=0,f=t.length;u!==f;u++){const m=t[u],x=e[u];let p=null;m.material&&x.material&&(p=n.getContactMaterial(m.material,x.material)||null);const g=m.type&yt.KINEMATIC&&x.type&yt.STATIC||m.type&yt.STATIC&&x.type&yt.KINEMATIC||m.type&yt.KINEMATIC&&x.type&yt.KINEMATIC;for(let _=0;_<m.shapes.length;_++){m.quaternion.mult(m.shapeOrientations[_],l),m.quaternion.vmult(m.shapeOffsets[_],h),h.vadd(m.position,h);const v=m.shapes[_];for(let y=0;y<x.shapes.length;y++){x.quaternion.mult(x.shapeOrientations[y],c),x.quaternion.vmult(x.shapeOffsets[y],d),d.vadd(x.position,d);const b=x.shapes[y];if(!(v.collisionFilterMask&b.collisionFilterGroup&&b.collisionFilterMask&v.collisionFilterGroup)||h.distanceTo(d)>v.boundingSphereRadius+b.boundingSphereRadius)continue;let w=null;v.material&&b.material&&(w=n.getContactMaterial(v.material,b.material)||null),this.currentContactMaterial=w||p||n.defaultContactMaterial;const T=v.type|b.type,P=this[T];if(P){let M=!1;v.type<b.type?M=P.call(this,v,b,h,d,l,c,m,x,v,b,g):M=P.call(this,b,v,d,h,c,l,x,m,v,b,g),M&&g&&(n.shapeOverlapKeeper.set(v.id,b.id),n.bodyOverlapKeeper.set(m.id,x.id))}}}}}sphereSphere(t,e,n,s,o,r,a,l,c,h,d){if(d)return n.distanceSquared(s)<(t.radius+e.radius)**2;const u=this.createContactEquation(a,l,t,e,c,h);s.vsub(n,u.ni),u.ni.normalize(),u.ri.copy(u.ni),u.rj.copy(u.ni),u.ri.scale(t.radius,u.ri),u.rj.scale(-e.radius,u.rj),u.ri.vadd(n,u.ri),u.ri.vsub(a.position,u.ri),u.rj.vadd(s,u.rj),u.rj.vsub(l.position,u.rj),this.result.push(u),this.createFrictionEquationsFromContact(u,this.frictionResult)}spherePlane(t,e,n,s,o,r,a,l,c,h,d){const u=this.createContactEquation(a,l,t,e,c,h);if(u.ni.set(0,0,1),r.vmult(u.ni,u.ni),u.ni.negate(u.ni),u.ni.normalize(),u.ni.scale(t.radius,u.ri),n.vsub(s,Er),u.ni.scale(u.ni.dot(Er),Wd),Er.vsub(Wd,u.rj),-Er.dot(u.ni)<=t.radius){if(d)return!0;const f=u.ri,m=u.rj;f.vadd(n,f),f.vsub(a.position,f),m.vadd(s,m),m.vsub(l.position,m),this.result.push(u),this.createFrictionEquationsFromContact(u,this.frictionResult)}}boxBox(t,e,n,s,o,r,a,l,c,h,d){return t.convexPolyhedronRepresentation.material=t.material,e.convexPolyhedronRepresentation.material=e.material,t.convexPolyhedronRepresentation.collisionResponse=t.collisionResponse,e.convexPolyhedronRepresentation.collisionResponse=e.collisionResponse,this.convexConvex(t.convexPolyhedronRepresentation,e.convexPolyhedronRepresentation,n,s,o,r,a,l,t,e,d)}sphereBox(t,e,n,s,o,r,a,l,c,h,d){const u=this.v3pool,f=JM;n.vsub(s,Tr),e.getSideNormals(f,r);const m=t.radius;let x=!1;const p=tS,g=eS,_=nS;let v=null,y=0,b=0,w=0,T=null;for(let I=0,z=f.length;I!==z&&x===!1;I++){const W=jM;W.copy(f[I]);const j=W.length();W.normalize();const tt=Tr.dot(W);if(tt<j+m&&tt>0){const nt=KM,et=ZM;nt.copy(f[(I+1)%3]),et.copy(f[(I+2)%3]);const St=nt.length(),Xt=et.length();nt.normalize(),et.normalize();const ut=Tr.dot(nt),X=Tr.dot(et);if(ut<St&&ut>-St&&X<Xt&&X>-Xt){const Z=Math.abs(tt-j-m);if((T===null||Z<T)&&(T=Z,b=ut,w=X,v=j,p.copy(W),g.copy(nt),_.copy(et),y++,d))return!0}}}if(y){x=!0;const I=this.createContactEquation(a,l,t,e,c,h);p.scale(-m,I.ri),I.ni.copy(p),I.ni.negate(I.ni),p.scale(v,p),g.scale(b,g),p.vadd(g,p),_.scale(w,_),p.vadd(_,I.rj),I.ri.vadd(n,I.ri),I.ri.vsub(a.position,I.ri),I.rj.vadd(s,I.rj),I.rj.vsub(l.position,I.rj),this.result.push(I),this.createFrictionEquationsFromContact(I,this.frictionResult)}let P=u.get();const M=QM;for(let I=0;I!==2&&!x;I++)for(let z=0;z!==2&&!x;z++)for(let W=0;W!==2&&!x;W++)if(P.set(0,0,0),I?P.vadd(f[0],P):P.vsub(f[0],P),z?P.vadd(f[1],P):P.vsub(f[1],P),W?P.vadd(f[2],P):P.vsub(f[2],P),s.vadd(P,M),M.vsub(n,M),M.lengthSquared()<m*m){if(d)return!0;x=!0;const j=this.createContactEquation(a,l,t,e,c,h);j.ri.copy(M),j.ri.normalize(),j.ni.copy(j.ri),j.ri.scale(m,j.ri),j.rj.copy(P),j.ri.vadd(n,j.ri),j.ri.vsub(a.position,j.ri),j.rj.vadd(s,j.rj),j.rj.vsub(l.position,j.rj),this.result.push(j),this.createFrictionEquationsFromContact(j,this.frictionResult)}u.release(P),P=null;const E=u.get(),R=u.get(),N=u.get(),D=u.get(),O=u.get(),F=f.length;for(let I=0;I!==F&&!x;I++)for(let z=0;z!==F&&!x;z++)if(I%3!==z%3){f[z].cross(f[I],E),E.normalize(),f[I].vadd(f[z],R),N.copy(n),N.vsub(R,N),N.vsub(s,N);const W=N.dot(E);E.scale(W,D);let j=0;for(;j===I%3||j===z%3;)j++;O.copy(n),O.vsub(D,O),O.vsub(R,O),O.vsub(s,O);const tt=Math.abs(W),nt=O.length();if(tt<f[j].length()&&nt<m){if(d)return!0;x=!0;const et=this.createContactEquation(a,l,t,e,c,h);R.vadd(D,et.rj),et.rj.copy(et.rj),O.negate(et.ni),et.ni.normalize(),et.ri.copy(et.rj),et.ri.vadd(s,et.ri),et.ri.vsub(n,et.ri),et.ri.normalize(),et.ri.scale(m,et.ri),et.ri.vadd(n,et.ri),et.ri.vsub(a.position,et.ri),et.rj.vadd(s,et.rj),et.rj.vsub(l.position,et.rj),this.result.push(et),this.createFrictionEquationsFromContact(et,this.frictionResult)}}u.release(E,R,N,D,O)}planeBox(t,e,n,s,o,r,a,l,c,h,d){return e.convexPolyhedronRepresentation.material=e.material,e.convexPolyhedronRepresentation.collisionResponse=e.collisionResponse,e.convexPolyhedronRepresentation.id=e.id,this.planeConvex(t,e.convexPolyhedronRepresentation,n,s,o,r,a,l,t,e,d)}convexConvex(t,e,n,s,o,r,a,l,c,h,d,u,f){const m=xS;if(!(n.distanceTo(s)>t.boundingSphereRadius+e.boundingSphereRadius)&&t.findSeparatingAxis(e,n,o,s,r,m,u,f)){const x=[],p=_S;t.clipAgainstHull(n,o,e,s,r,m,-100,100,x);let g=0;for(let _=0;_!==x.length;_++){if(d)return!0;const v=this.createContactEquation(a,l,t,e,c,h),y=v.ri,b=v.rj;m.negate(v.ni),x[_].normal.negate(p),p.scale(x[_].depth,p),x[_].point.vadd(p,y),b.copy(x[_].point),y.vsub(n,y),b.vsub(s,b),y.vadd(n,y),y.vsub(a.position,y),b.vadd(s,b),b.vsub(l.position,b),this.result.push(v),g++,this.enableFrictionReduction||this.createFrictionEquationsFromContact(v,this.frictionResult)}this.enableFrictionReduction&&g&&this.createFrictionFromAverage(g)}}sphereConvex(t,e,n,s,o,r,a,l,c,h,d){const u=this.v3pool;n.vsub(s,iS);const f=e.faceNormals,m=e.faces,x=e.vertices,p=t.radius;let g=!1;for(let _=0;_!==x.length;_++){const v=x[_],y=aS;r.vmult(v,y),s.vadd(y,y);const b=rS;if(y.vsub(n,b),b.lengthSquared()<p*p){if(d)return!0;g=!0;const w=this.createContactEquation(a,l,t,e,c,h);w.ri.copy(b),w.ri.normalize(),w.ni.copy(w.ri),w.ri.scale(p,w.ri),y.vsub(s,w.rj),w.ri.vadd(n,w.ri),w.ri.vsub(a.position,w.ri),w.rj.vadd(s,w.rj),w.rj.vsub(l.position,w.rj),this.result.push(w),this.createFrictionEquationsFromContact(w,this.frictionResult);return}}for(let _=0,v=m.length;_!==v&&g===!1;_++){const y=f[_],b=m[_],w=lS;r.vmult(y,w);const T=cS;r.vmult(x[b[0]],T),T.vadd(s,T);const P=hS;w.scale(-p,P),n.vadd(P,P);const M=dS;P.vsub(T,M);const E=M.dot(w),R=uS;if(n.vsub(T,R),E<0&&R.dot(w)>0){const N=[];for(let D=0,O=b.length;D!==O;D++){const F=u.get();r.vmult(x[b[D]],F),s.vadd(F,F),N.push(F)}if(YM(N,w,n)){if(d)return!0;g=!0;const D=this.createContactEquation(a,l,t,e,c,h);w.scale(-p,D.ri),w.negate(D.ni);const O=u.get();w.scale(-E,O);const F=u.get();w.scale(-p,F),n.vsub(s,D.rj),D.rj.vadd(F,D.rj),D.rj.vadd(O,D.rj),D.rj.vadd(s,D.rj),D.rj.vsub(l.position,D.rj),D.ri.vadd(n,D.ri),D.ri.vsub(a.position,D.ri),u.release(O),u.release(F),this.result.push(D),this.createFrictionEquationsFromContact(D,this.frictionResult);for(let I=0,z=N.length;I!==z;I++)u.release(N[I]);return}else for(let D=0;D!==b.length;D++){const O=u.get(),F=u.get();r.vmult(x[b[(D+1)%b.length]],O),r.vmult(x[b[(D+2)%b.length]],F),s.vadd(O,O),s.vadd(F,F);const I=sS;F.vsub(O,I);const z=oS;I.unit(z);const W=u.get(),j=u.get();n.vsub(O,j);const tt=j.dot(z);z.scale(tt,W),W.vadd(O,W);const nt=u.get();if(W.vsub(n,nt),tt>0&&tt*tt<I.lengthSquared()&&nt.lengthSquared()<p*p){if(d)return!0;const et=this.createContactEquation(a,l,t,e,c,h);W.vsub(s,et.rj),W.vsub(n,et.ni),et.ni.normalize(),et.ni.scale(p,et.ri),et.rj.vadd(s,et.rj),et.rj.vsub(l.position,et.rj),et.ri.vadd(n,et.ri),et.ri.vsub(a.position,et.ri),this.result.push(et),this.createFrictionEquationsFromContact(et,this.frictionResult);for(let St=0,Xt=N.length;St!==Xt;St++)u.release(N[St]);u.release(O),u.release(F),u.release(W),u.release(nt),u.release(j);return}u.release(O),u.release(F),u.release(W),u.release(nt),u.release(j)}for(let D=0,O=N.length;D!==O;D++)u.release(N[D])}}}planeConvex(t,e,n,s,o,r,a,l,c,h,d){const u=fS,f=pS;f.set(0,0,1),o.vmult(f,f);let m=0;const x=mS;for(let p=0;p!==e.vertices.length;p++)if(u.copy(e.vertices[p]),r.vmult(u,u),s.vadd(u,u),u.vsub(n,x),f.dot(x)<=0){if(d)return!0;const _=this.createContactEquation(a,l,t,e,c,h),v=gS;f.scale(f.dot(x),v),u.vsub(v,v),v.vsub(n,_.ri),_.ni.copy(f),u.vsub(s,_.rj),_.ri.vadd(n,_.ri),_.ri.vsub(a.position,_.ri),_.rj.vadd(s,_.rj),_.rj.vsub(l.position,_.rj),this.result.push(_),m++,this.enableFrictionReduction||this.createFrictionEquationsFromContact(_,this.frictionResult)}this.enableFrictionReduction&&m&&this.createFrictionFromAverage(m)}boxConvex(t,e,n,s,o,r,a,l,c,h,d){return t.convexPolyhedronRepresentation.material=t.material,t.convexPolyhedronRepresentation.collisionResponse=t.collisionResponse,this.convexConvex(t.convexPolyhedronRepresentation,e,n,s,o,r,a,l,t,e,d)}sphereHeightfield(t,e,n,s,o,r,a,l,c,h,d){const u=e.data,f=t.radius,m=e.elementSize,x=PS,p=RS;ie.pointToLocalFrame(s,r,n,p);let g=Math.floor((p.x-f)/m)-1,_=Math.ceil((p.x+f)/m)+1,v=Math.floor((p.y-f)/m)-1,y=Math.ceil((p.y+f)/m)+1;if(_<0||y<0||g>u.length||v>u[0].length)return;g<0&&(g=0),_<0&&(_=0),v<0&&(v=0),y<0&&(y=0),g>=u.length&&(g=u.length-1),_>=u.length&&(_=u.length-1),y>=u[0].length&&(y=u[0].length-1),v>=u[0].length&&(v=u[0].length-1);const b=[];e.getRectMinMax(g,v,_,y,b);const w=b[0],T=b[1];if(p.z-f>T||p.z+f<w)return;const P=this.result;for(let M=g;M<_;M++)for(let E=v;E<y;E++){const R=P.length;let N=!1;if(e.getConvexTrianglePillar(M,E,!1),ie.pointToWorldFrame(s,r,e.pillarOffset,x),n.distanceTo(x)<e.pillarConvex.boundingSphereRadius+t.boundingSphereRadius&&(N=this.sphereConvex(t,e.pillarConvex,n,x,o,r,a,l,t,e,d)),d&&N||(e.getConvexTrianglePillar(M,E,!0),ie.pointToWorldFrame(s,r,e.pillarOffset,x),n.distanceTo(x)<e.pillarConvex.boundingSphereRadius+t.boundingSphereRadius&&(N=this.sphereConvex(t,e.pillarConvex,n,x,o,r,a,l,t,e,d)),d&&N))return!0;if(P.length-R>2)return}}boxHeightfield(t,e,n,s,o,r,a,l,c,h,d){return t.convexPolyhedronRepresentation.material=t.material,t.convexPolyhedronRepresentation.collisionResponse=t.collisionResponse,this.convexHeightfield(t.convexPolyhedronRepresentation,e,n,s,o,r,a,l,t,e,d)}convexHeightfield(t,e,n,s,o,r,a,l,c,h,d){const u=e.data,f=e.elementSize,m=t.boundingSphereRadius,x=AS,p=CS,g=TS;ie.pointToLocalFrame(s,r,n,g);let _=Math.floor((g.x-m)/f)-1,v=Math.ceil((g.x+m)/f)+1,y=Math.floor((g.y-m)/f)-1,b=Math.ceil((g.y+m)/f)+1;if(v<0||b<0||_>u.length||y>u[0].length)return;_<0&&(_=0),v<0&&(v=0),y<0&&(y=0),b<0&&(b=0),_>=u.length&&(_=u.length-1),v>=u.length&&(v=u.length-1),b>=u[0].length&&(b=u[0].length-1),y>=u[0].length&&(y=u[0].length-1);const w=[];e.getRectMinMax(_,y,v,b,w);const T=w[0],P=w[1];if(!(g.z-m>P||g.z+m<T))for(let M=_;M<v;M++)for(let E=y;E<b;E++){let R=!1;if(e.getConvexTrianglePillar(M,E,!1),ie.pointToWorldFrame(s,r,e.pillarOffset,x),n.distanceTo(x)<e.pillarConvex.boundingSphereRadius+t.boundingSphereRadius&&(R=this.convexConvex(t,e.pillarConvex,n,x,o,r,a,l,null,null,d,p,null)),d&&R||(e.getConvexTrianglePillar(M,E,!0),ie.pointToWorldFrame(s,r,e.pillarOffset,x),n.distanceTo(x)<e.pillarConvex.boundingSphereRadius+t.boundingSphereRadius&&(R=this.convexConvex(t,e.pillarConvex,n,x,o,r,a,l,null,null,d,p,null)),d&&R))return!0}}sphereParticle(t,e,n,s,o,r,a,l,c,h,d){const u=MS;if(u.set(0,0,1),s.vsub(n,u),u.lengthSquared()<=t.radius*t.radius){if(d)return!0;const m=this.createContactEquation(l,a,e,t,c,h);u.normalize(),m.rj.copy(u),m.rj.scale(t.radius,m.rj),m.ni.copy(u),m.ni.negate(m.ni),m.ri.set(0,0,0),this.result.push(m),this.createFrictionEquationsFromContact(m,this.frictionResult)}}planeParticle(t,e,n,s,o,r,a,l,c,h,d){const u=vS;u.set(0,0,1),a.quaternion.vmult(u,u);const f=yS;if(s.vsub(a.position,f),u.dot(f)<=0){if(d)return!0;const x=this.createContactEquation(l,a,e,t,c,h);x.ni.copy(u),x.ni.negate(x.ni),x.ri.set(0,0,0);const p=bS;u.scale(u.dot(s),p),s.vsub(p,p),x.rj.copy(p),this.result.push(x),this.createFrictionEquationsFromContact(x,this.frictionResult)}}boxParticle(t,e,n,s,o,r,a,l,c,h,d){return t.convexPolyhedronRepresentation.material=t.material,t.convexPolyhedronRepresentation.collisionResponse=t.collisionResponse,this.convexParticle(t.convexPolyhedronRepresentation,e,n,s,o,r,a,l,t,e,d)}convexParticle(t,e,n,s,o,r,a,l,c,h,d){let u=-1;const f=wS,m=ES;let x=null;const p=SS;if(p.copy(s),p.vsub(n,p),o.conjugate(qd),qd.vmult(p,p),t.pointIsInside(p)){t.worldVerticesNeedsUpdate&&t.computeWorldVertices(n,o),t.worldFaceNormalsNeedsUpdate&&t.computeWorldFaceNormals(o);for(let g=0,_=t.faces.length;g!==_;g++){const v=[t.worldVertices[t.faces[g][0]]],y=t.worldFaceNormals[g];s.vsub(v[0],Xd);const b=-y.dot(Xd);if(x===null||Math.abs(b)<Math.abs(x)){if(d)return!0;x=b,u=g,f.copy(y)}}if(u!==-1){const g=this.createContactEquation(l,a,e,t,c,h);f.scale(x,m),m.vadd(s,m),m.vsub(n,m),g.rj.copy(m),f.negate(g.ni),g.ri.set(0,0,0);const _=g.ri,v=g.rj;_.vadd(s,_),_.vsub(l.position,_),v.vadd(n,v),v.vsub(a.position,v),this.result.push(g),this.createFrictionEquationsFromContact(g,this.frictionResult)}else console.warn("Point found inside convex, but did not find penetrating face!")}}heightfieldCylinder(t,e,n,s,o,r,a,l,c,h,d){return this.convexHeightfield(e,t,s,n,r,o,l,a,c,h,d)}particleCylinder(t,e,n,s,o,r,a,l,c,h,d){return this.convexParticle(e,t,s,n,r,o,l,a,c,h,d)}sphereTrimesh(t,e,n,s,o,r,a,l,c,h,d){const u=FM,f=NM,m=OM,x=UM,p=BM,g=zM,_=GM,v=IM,y=LM,b=WM;ie.pointToLocalFrame(s,r,n,p);const w=t.radius;_.lowerBound.set(p.x-w,p.y-w,p.z-w),_.upperBound.set(p.x+w,p.y+w,p.z+w),e.getTrianglesInAABB(_,b);const T=DM,P=t.radius*t.radius;for(let D=0;D<b.length;D++)for(let O=0;O<3;O++)if(e.getVertex(e.indices[b[D]*3+O],T),T.vsub(p,y),y.lengthSquared()<=P){if(v.copy(T),ie.pointToWorldFrame(s,r,v,T),T.vsub(n,y),d)return!0;let F=this.createContactEquation(a,l,t,e,c,h);F.ni.copy(y),F.ni.normalize(),F.ri.copy(F.ni),F.ri.scale(t.radius,F.ri),F.ri.vadd(n,F.ri),F.ri.vsub(a.position,F.ri),F.rj.copy(T),F.rj.vsub(l.position,F.rj),this.result.push(F),this.createFrictionEquationsFromContact(F,this.frictionResult)}for(let D=0;D<b.length;D++)for(let O=0;O<3;O++){e.getVertex(e.indices[b[D]*3+O],u),e.getVertex(e.indices[b[D]*3+(O+1)%3],f),f.vsub(u,m),p.vsub(f,g);const F=g.dot(m);p.vsub(u,g);let I=g.dot(m);if(I>0&&F<0&&(p.vsub(u,g),x.copy(m),x.normalize(),I=g.dot(x),x.scale(I,g),g.vadd(u,g),g.distanceTo(p)<t.radius)){if(d)return!0;const W=this.createContactEquation(a,l,t,e,c,h);g.vsub(p,W.ni),W.ni.normalize(),W.ni.scale(t.radius,W.ri),W.ri.vadd(n,W.ri),W.ri.vsub(a.position,W.ri),ie.pointToWorldFrame(s,r,g,g),g.vsub(l.position,W.rj),ie.vectorToWorldFrame(r,W.ni,W.ni),ie.vectorToWorldFrame(r,W.ri,W.ri),this.result.push(W),this.createFrictionEquationsFromContact(W,this.frictionResult)}}const M=kM,E=VM,R=HM,N=PM;for(let D=0,O=b.length;D!==O;D++){e.getTriangleVertices(b[D],M,E,R),e.getNormal(b[D],N),p.vsub(M,g);let F=g.dot(N);if(N.scale(F,g),p.vsub(g,g),F=g.distanceTo(p),Re.pointInTriangle(g,M,E,R)&&F<t.radius){if(d)return!0;let I=this.createContactEquation(a,l,t,e,c,h);g.vsub(p,I.ni),I.ni.normalize(),I.ni.scale(t.radius,I.ri),I.ri.vadd(n,I.ri),I.ri.vsub(a.position,I.ri),ie.pointToWorldFrame(s,r,g,g),g.vsub(l.position,I.rj),ie.vectorToWorldFrame(r,I.ni,I.ni),ie.vectorToWorldFrame(r,I.ri,I.ri),this.result.push(I),this.createFrictionEquationsFromContact(I,this.frictionResult)}}b.length=0}planeTrimesh(t,e,n,s,o,r,a,l,c,h,d){const u=new A,f=AM;f.set(0,0,1),o.vmult(f,f);for(let m=0;m<e.vertices.length/3;m++){e.getVertex(m,u);const x=new A;x.copy(u),ie.pointToWorldFrame(s,r,x,u);const p=CM;if(u.vsub(n,p),f.dot(p)<=0){if(d)return!0;const _=this.createContactEquation(a,l,t,e,c,h);_.ni.copy(f);const v=RM;f.scale(p.dot(f),v),u.vsub(v,v),_.ri.copy(v),_.ri.vsub(a.position,_.ri),_.rj.copy(u),_.rj.vsub(l.position,_.rj),this.result.push(_),this.createFrictionEquationsFromContact(_,this.frictionResult)}}}}const qi=new A,Cs=new A,Rs=new A,SM=new A,wM=new A,EM=new Pe,TM=new Pe,AM=new A,CM=new A,RM=new A,PM=new A,LM=new A;new A;const DM=new A,IM=new A,FM=new A,NM=new A,OM=new A,UM=new A,BM=new A,zM=new A,kM=new A,VM=new A,HM=new A,GM=new mn,WM=[],Er=new A,Wd=new A,qM=new A,XM=new A,$M=new A;function YM(i,t,e){let n=null;const s=i.length;for(let o=0;o!==s;o++){const r=i[o],a=qM;i[(o+1)%s].vsub(r,a);const l=XM;a.cross(t,l);const c=$M;e.vsub(r,c);const h=l.dot(c);if(n===null||h>0&&n===!0||h<=0&&n===!1){n===null&&(n=h>0);continue}else return!1}return!0}const Tr=new A,jM=new A,KM=new A,ZM=new A,JM=[new A,new A,new A,new A,new A,new A],QM=new A,tS=new A,eS=new A,nS=new A,iS=new A,sS=new A,oS=new A,rS=new A,aS=new A,lS=new A,cS=new A,hS=new A,dS=new A,uS=new A;new A;new A;const fS=new A,pS=new A,mS=new A,gS=new A,xS=new A,_S=new A,vS=new A,yS=new A,bS=new A,MS=new A,qd=new Pe,SS=new A;new A;const wS=new A,Xd=new A,ES=new A,TS=new A,AS=new A,CS=[0],RS=new A,PS=new A;class $d{constructor(){this.current=[],this.previous=[]}getKey(t,e){if(e<t){const n=e;e=t,t=n}return t<<16|e}set(t,e){const n=this.getKey(t,e),s=this.current;let o=0;for(;n>s[o];)o++;if(n!==s[o]){for(let r=s.length-1;r>=o;r--)s[r+1]=s[r];s[o]=n}}tick(){const t=this.current;this.current=this.previous,this.previous=t,this.current.length=0}getDiff(t,e){const n=this.current,s=this.previous,o=n.length,r=s.length;let a=0;for(let l=0;l<o;l++){let c=!1;const h=n[l];for(;h>s[a];)a++;c=h===s[a],c||Yd(t,h)}a=0;for(let l=0;l<r;l++){let c=!1;const h=s[l];for(;h>n[a];)a++;c=n[a]===h,c||Yd(e,h)}}}function Yd(i,t){i.push((t&4294901760)>>16,t&65535)}const pl=(i,t)=>i<t?`${i}-${t}`:`${t}-${i}`;class LS{constructor(){this.data={keys:[]}}get(t,e){const n=pl(t,e);return this.data[n]}set(t,e,n){const s=pl(t,e);this.get(t,e)||this.data.keys.push(s),this.data[s]=n}delete(t,e){const n=pl(t,e),s=this.data.keys.indexOf(n);s!==-1&&this.data.keys.splice(s,1),delete this.data[n]}reset(){const t=this.data,e=t.keys;for(;e.length>0;){const n=e.pop();delete t[n]}}}class DS extends ap{constructor(t){t===void 0&&(t={}),super(),this.dt=-1,this.allowSleep=!!t.allowSleep,this.contacts=[],this.frictionEquations=[],this.quatNormalizeSkip=t.quatNormalizeSkip!==void 0?t.quatNormalizeSkip:0,this.quatNormalizeFast=t.quatNormalizeFast!==void 0?t.quatNormalizeFast:!1,this.time=0,this.stepnumber=0,this.default_dt=1/60,this.nextId=0,this.gravity=new A,t.gravity&&this.gravity.copy(t.gravity),t.frictionGravity&&(this.frictionGravity=new A,this.frictionGravity.copy(t.frictionGravity)),this.broadphase=t.broadphase!==void 0?t.broadphase:new Eb,this.bodies=[],this.hasActiveBodies=!1,this.solver=t.solver!==void 0?t.solver:new gM,this.constraints=[],this.narrowphase=new MM(this),this.collisionMatrix=new Id,this.collisionMatrixPrevious=new Id,this.bodyOverlapKeeper=new $d,this.shapeOverlapKeeper=new $d,this.contactmaterials=[],this.contactMaterialTable=new LS,this.defaultMaterial=new Xs("default"),this.defaultContactMaterial=new xa(this.defaultMaterial,this.defaultMaterial,{friction:.3,restitution:0}),this.doProfiling=!1,this.profile={solve:0,makeContactConstraints:0,broadphase:0,integrate:0,narrowphase:0},this.accumulator=0,this.subsystems=[],this.addBodyEvent={type:"addBody",body:null},this.removeBodyEvent={type:"removeBody",body:null},this.idToBodyMap={},this.broadphase.setWorld(this)}getContactMaterial(t,e){return this.contactMaterialTable.get(t.id,e.id)}collisionMatrixTick(){const t=this.collisionMatrixPrevious;this.collisionMatrixPrevious=this.collisionMatrix,this.collisionMatrix=t,this.collisionMatrix.reset(),this.bodyOverlapKeeper.tick(),this.shapeOverlapKeeper.tick()}addConstraint(t){this.constraints.push(t)}removeConstraint(t){const e=this.constraints.indexOf(t);e!==-1&&this.constraints.splice(e,1)}rayTest(t,e,n){n instanceof sa?this.raycastClosest(t,e,{skipBackfaces:!0},n):this.raycastAll(t,e,{skipBackfaces:!0},n)}raycastAll(t,e,n,s){return n===void 0&&(n={}),n.mode=Re.ALL,n.from=t,n.to=e,n.callback=s,ml.intersectWorld(this,n)}raycastAny(t,e,n,s){return n===void 0&&(n={}),n.mode=Re.ANY,n.from=t,n.to=e,n.result=s,ml.intersectWorld(this,n)}raycastClosest(t,e,n,s){return n===void 0&&(n={}),n.mode=Re.CLOSEST,n.from=t,n.to=e,n.result=s,ml.intersectWorld(this,n)}addBody(t){this.bodies.includes(t)||(t.index=this.bodies.length,this.bodies.push(t),t.world=this,t.initPosition.copy(t.position),t.initVelocity.copy(t.velocity),t.timeLastSleepy=this.time,t instanceof yt&&(t.initAngularVelocity.copy(t.angularVelocity),t.initQuaternion.copy(t.quaternion)),this.collisionMatrix.setNumObjects(this.bodies.length),this.addBodyEvent.body=t,this.idToBodyMap[t.id]=t,this.dispatchEvent(this.addBodyEvent))}removeBody(t){t.world=null;const e=this.bodies.length-1,n=this.bodies,s=n.indexOf(t);if(s!==-1){n.splice(s,1);for(let o=0;o!==n.length;o++)n[o].index=o;this.collisionMatrix.setNumObjects(e),this.removeBodyEvent.body=t,delete this.idToBodyMap[t.id],this.dispatchEvent(this.removeBodyEvent)}}getBodyById(t){return this.idToBodyMap[t]}getShapeById(t){const e=this.bodies;for(let n=0;n<e.length;n++){const s=e[n].shapes;for(let o=0;o<s.length;o++){const r=s[o];if(r.id===t)return r}}return null}addContactMaterial(t){this.contactmaterials.push(t),this.contactMaterialTable.set(t.materials[0].id,t.materials[1].id,t)}removeContactMaterial(t){const e=this.contactmaterials.indexOf(t);e!==-1&&(this.contactmaterials.splice(e,1),this.contactMaterialTable.delete(t.materials[0].id,t.materials[1].id))}fixedStep(t,e){t===void 0&&(t=1/60),e===void 0&&(e=10);const n=Le.now()/1e3;if(!this.lastCallTime)this.step(t,void 0,e);else{const s=n-this.lastCallTime;this.step(t,s,e)}this.lastCallTime=n}step(t,e,n){if(n===void 0&&(n=10),e===void 0)this.internalStep(t),this.time+=t;else{this.accumulator+=e;const s=Le.now();let o=0;for(;this.accumulator>=t&&o<n&&(this.internalStep(t),this.accumulator-=t,o++,!(Le.now()-s>t*1e3)););this.accumulator=this.accumulator%t;const r=this.accumulator/t;for(let a=0;a!==this.bodies.length;a++){const l=this.bodies[a];l.previousPosition.lerp(l.position,r,l.interpolatedPosition),l.previousQuaternion.slerp(l.quaternion,r,l.interpolatedQuaternion),l.previousQuaternion.normalize()}this.time+=e}}internalStep(t){this.dt=t;const e=this.contacts,n=US,s=BS,o=this.bodies.length,r=this.bodies,a=this.solver,l=this.gravity,c=this.doProfiling,h=this.profile,d=yt.DYNAMIC;let u=-1/0;const f=this.constraints,m=OS;l.length();const x=l.x,p=l.y,g=l.z;let _=0;for(c&&(u=Le.now()),_=0;_!==o;_++){const D=r[_];if(D.type===d){const O=D.force,F=D.mass;O.x+=F*x,O.y+=F*p,O.z+=F*g}}for(let D=0,O=this.subsystems.length;D!==O;D++)this.subsystems[D].update();c&&(u=Le.now()),n.length=0,s.length=0,this.broadphase.collisionPairs(this,n,s),c&&(h.broadphase=Le.now()-u);let v=f.length;for(_=0;_!==v;_++){const D=f[_];if(!D.collideConnected)for(let O=n.length-1;O>=0;O-=1)(D.bodyA===n[O]&&D.bodyB===s[O]||D.bodyB===n[O]&&D.bodyA===s[O])&&(n.splice(O,1),s.splice(O,1))}this.collisionMatrixTick(),c&&(u=Le.now());const y=NS,b=e.length;for(_=0;_!==b;_++)y.push(e[_]);e.length=0;const w=this.frictionEquations.length;for(_=0;_!==w;_++)m.push(this.frictionEquations[_]);for(this.frictionEquations.length=0,this.narrowphase.getContacts(n,s,this,e,y,this.frictionEquations,m),c&&(h.narrowphase=Le.now()-u),c&&(u=Le.now()),_=0;_<this.frictionEquations.length;_++)a.addEquation(this.frictionEquations[_]);const T=e.length;for(let D=0;D!==T;D++){const O=e[D],F=O.bi,I=O.bj,z=O.si,W=O.sj;let j;if(F.material&&I.material?j=this.getContactMaterial(F.material,I.material)||this.defaultContactMaterial:j=this.defaultContactMaterial,j.friction,F.material&&I.material&&(F.material.friction>=0&&I.material.friction>=0&&F.material.friction*I.material.friction,F.material.restitution>=0&&I.material.restitution>=0&&(O.restitution=F.material.restitution*I.material.restitution)),a.addEquation(O),F.allowSleep&&F.type===yt.DYNAMIC&&F.sleepState===yt.SLEEPING&&I.sleepState===yt.AWAKE&&I.type!==yt.STATIC){const tt=I.velocity.lengthSquared()+I.angularVelocity.lengthSquared(),nt=I.sleepSpeedLimit**2;tt>=nt*2&&(F.wakeUpAfterNarrowphase=!0)}if(I.allowSleep&&I.type===yt.DYNAMIC&&I.sleepState===yt.SLEEPING&&F.sleepState===yt.AWAKE&&F.type!==yt.STATIC){const tt=F.velocity.lengthSquared()+F.angularVelocity.lengthSquared(),nt=F.sleepSpeedLimit**2;tt>=nt*2&&(I.wakeUpAfterNarrowphase=!0)}this.collisionMatrix.set(F,I,!0),this.collisionMatrixPrevious.get(F,I)||(ho.body=I,ho.contact=O,F.dispatchEvent(ho),ho.body=F,I.dispatchEvent(ho)),this.bodyOverlapKeeper.set(F.id,I.id),this.shapeOverlapKeeper.set(z.id,W.id)}for(this.emitContactEvents(),c&&(h.makeContactConstraints=Le.now()-u,u=Le.now()),_=0;_!==o;_++){const D=r[_];D.wakeUpAfterNarrowphase&&(D.wakeUp(),D.wakeUpAfterNarrowphase=!1)}for(v=f.length,_=0;_!==v;_++){const D=f[_];D.update();for(let O=0,F=D.equations.length;O!==F;O++){const I=D.equations[O];a.addEquation(I)}}a.solve(t,this),c&&(h.solve=Le.now()-u),a.removeAllEquations();const P=Math.pow;for(_=0;_!==o;_++){const D=r[_];if(D.type&d){const O=P(1-D.linearDamping,t),F=D.velocity;F.scale(O,F);const I=D.angularVelocity;if(I){const z=P(1-D.angularDamping,t);I.scale(z,I)}}}this.dispatchEvent(FS),c&&(u=Le.now());const E=this.stepnumber%(this.quatNormalizeSkip+1)===0,R=this.quatNormalizeFast;for(_=0;_!==o;_++)r[_].integrate(t,E,R);this.clearForces(),this.broadphase.dirty=!0,c&&(h.integrate=Le.now()-u),this.stepnumber+=1,this.dispatchEvent(IS);let N=!0;if(this.allowSleep)for(N=!1,_=0;_!==o;_++){const D=r[_];D.sleepTick(this.time),D.sleepState!==yt.SLEEPING&&(N=!0)}this.hasActiveBodies=N}emitContactEvents(){const t=this.hasAnyEventListener("beginContact"),e=this.hasAnyEventListener("endContact");if((t||e)&&this.bodyOverlapKeeper.getDiff(Qn,ti),t){for(let o=0,r=Qn.length;o<r;o+=2)uo.bodyA=this.getBodyById(Qn[o]),uo.bodyB=this.getBodyById(Qn[o+1]),this.dispatchEvent(uo);uo.bodyA=uo.bodyB=null}if(e){for(let o=0,r=ti.length;o<r;o+=2)fo.bodyA=this.getBodyById(ti[o]),fo.bodyB=this.getBodyById(ti[o+1]),this.dispatchEvent(fo);fo.bodyA=fo.bodyB=null}Qn.length=ti.length=0;const n=this.hasAnyEventListener("beginShapeContact"),s=this.hasAnyEventListener("endShapeContact");if((n||s)&&this.shapeOverlapKeeper.getDiff(Qn,ti),n){for(let o=0,r=Qn.length;o<r;o+=2){const a=this.getShapeById(Qn[o]),l=this.getShapeById(Qn[o+1]);ei.shapeA=a,ei.shapeB=l,a&&(ei.bodyA=a.body),l&&(ei.bodyB=l.body),this.dispatchEvent(ei)}ei.bodyA=ei.bodyB=ei.shapeA=ei.shapeB=null}if(s){for(let o=0,r=ti.length;o<r;o+=2){const a=this.getShapeById(ti[o]),l=this.getShapeById(ti[o+1]);ni.shapeA=a,ni.shapeB=l,a&&(ni.bodyA=a.body),l&&(ni.bodyB=l.body),this.dispatchEvent(ni)}ni.bodyA=ni.bodyB=ni.shapeA=ni.shapeB=null}}clearForces(){const t=this.bodies,e=t.length;for(let n=0;n!==e;n++){const s=t[n];s.force,s.torque,s.force.set(0,0,0),s.torque.set(0,0,0)}}}new mn;const ml=new Re,Le=globalThis.performance||{};if(!Le.now){let i=Date.now();Le.timing&&Le.timing.navigationStart&&(i=Le.timing.navigationStart),Le.now=()=>Date.now()-i}new A;const IS={type:"postStep"},FS={type:"preStep"},ho={type:yt.COLLIDE_EVENT_NAME,body:null,contact:null},NS=[],OS=[],US=[],BS=[],Qn=[],ti=[],uo={type:"beginContact",bodyA:null,bodyB:null},fo={type:"endContact",bodyA:null,bodyB:null},ei={type:"beginShapeContact",bodyA:null,bodyB:null,shapeA:null,shapeB:null},ni={type:"endShapeContact",bodyA:null,bodyB:null,shapeA:null,shapeB:null};function jd(i,t){const n=i*.4,s=Math.min(t/5,1),o=1+(n-1)*s,r=.3,l=t===0?r:r+t*.4,c=Math.random()*Math.PI*2,h=o*(.8+Math.random()*.4);return{x:Math.cos(c)*h,y:l,z:Math.sin(c)*h}}function zS(i,t=ia,e=15){const n=t.maxAllowedFrequency||3;let s=!1;for(const ut of i.muscles)if(ut.frequency*i.globalFrequencyMultiplier>n){s=!0;break}if(s)return{genome:i,frames:[{time:0,nodePositions:new Map(i.nodes.map(ut=>[ut.id,{...ut.position}])),centerOfMass:{x:0,y:.5,z:0},activePelletIndex:0}],finalFitness:1,pelletsCollected:0,distanceTraveled:0,netDisplacement:0,closestPelletDistance:1/0,pellets:[],fitnessOverTime:[1],disqualified:"frequency_exceeded"};const o=new DS;o.gravity.set(0,t.gravity,0),o.broadphase=new Is(o),o.solver.iterations=10;const r=new yt({mass:0,shape:new pM,material:new Xs({friction:t.groundFriction,restitution:.3})});r.quaternion.setFromEuler(-Math.PI/2,0,0),o.addBody(r);const a=new Map;for(const ut of i.nodes){const X=ut.size*.5,Z=4/3*Math.PI*Math.pow(X,3)*10,rt=new yt({mass:Z,shape:new fM(X),position:new A(ut.position.x,ut.position.y+1,ut.position.z),linearDamping:.1,angularDamping:.5,material:new Xs({friction:ut.friction,restitution:.2})});o.addBody(rt),a.set(ut.id,rt)}const l=[];for(const ut of i.muscles){const X=a.get(ut.nodeA),Z=a.get(ut.nodeB);if(!X||!Z)continue;const rt=new eM(X,Z,{restLength:ut.restLength,stiffness:ut.stiffness,damping:ut.damping});l.push({spring:rt,frequency:ut.frequency*i.globalFrequencyMultiplier,amplitude:ut.amplitude,phase:ut.phase,baseRestLength:ut.restLength})}const c=[];let h=0;c.push({id:"pellet_0",position:jd(t.arenaSize,0),collectedAtFrame:null,spawnedAtFrame:0});const d=[],u=[],f=1/60,m=1/e,x=t.simulationDuration,p=Math.ceil(x/f);let g=0,_=0,v=0,y=null,b=null,w=0,T=null;const P=50,M=30,E=()=>c.find(ut=>ut.collectedAtFrame===null)||null,R=t.fitnessWeights||na,N=(ut,X,Z,rt)=>{if(T)return 1;const Lt={x:isFinite(ut.x)?ut.x:0,y:isFinite(ut.y)?ut.y:0,z:isFinite(ut.z)?ut.z:0},pt=isFinite(Z)?Z:0;let Ft=R.baseFitness;Ft+=X*R.pelletWeight;const oe=E();if(oe){const Ot=Lt.x-oe.position.x,Rt=Lt.y-oe.position.y,Vt=Lt.z-oe.position.z,Pt=Math.sqrt(Ot*Ot+Rt*Rt+Vt*Vt);isFinite(Pt)&&(Ft+=Math.max(0,R.proximityMaxDistance-Pt)*R.proximityWeight)}if(Ft+=Math.min(pt*R.movementWeight,R.movementCap),R.distanceWeight>0&&rt){const Ot={x:isFinite(rt.x)?rt.x:0,y:isFinite(rt.y)?rt.y:0,z:isFinite(rt.z)?rt.z:0},Rt=Lt.x-Ot.x,Vt=Lt.y-Ot.y,Pt=Lt.z-Ot.z,se=Math.sqrt(Rt*Rt+Vt*Vt+Pt*Pt);isFinite(se)&&(Ft+=Math.min(se*R.distanceWeight,R.distanceCap))}return isFinite(Ft)?Math.max(Ft,1):1};for(let ut=0;ut<p;ut++){for(const{spring:X,frequency:Z,amplitude:rt,phase:Lt,baseRestLength:pt}of l){const Ft=Math.sin(g*Z*Math.PI*2+Lt);X.restLength=pt*(1-Ft*rt),X.applyForce()}if(o.step(f),g+=f,g-_>=m||ut===0){const X=new Map;let Z=0,rt=0,Lt=0,pt=0;for(const[Ot,Rt]of a){(!isFinite(Rt.position.x)||!isFinite(Rt.position.y)||!isFinite(Rt.position.z))&&(T="nan_position");const Vt=isFinite(Rt.position.x)?Rt.position.x:0,Pt=isFinite(Rt.position.y)?Rt.position.y:0,se=isFinite(Rt.position.z)?Rt.position.z:0;(Math.sqrt(Vt*Vt+Pt*Pt+se*se)>P||Pt>M)&&(T="physics_explosion");const ue={x:Vt,y:Pt,z:se};X.set(Ot,ue),Z+=ue.x*Rt.mass,rt+=ue.y*Rt.mass,Lt+=ue.z*Rt.mass,pt+=Rt.mass}const Ft=pt>0?{x:isFinite(Z/pt)?Z/pt:0,y:isFinite(rt/pt)?rt/pt:0,z:isFinite(Lt/pt)?Lt/pt:0}:{x:0,y:0,z:0};if(y){const Ot=Ft.x-y.x,Rt=Ft.y-y.y,Vt=Ft.z-y.z,Pt=Math.sqrt(Ot*Ot+Rt*Rt+Vt*Vt);isFinite(Pt)&&(v+=Pt)}y={...Ft},b===null&&(b={...Ft});const oe=E();if(oe)for(const[Ot,Rt]of a){const Vt=i.nodes.find(Jt=>Jt.id===Ot);if(!Vt)continue;const Pt=Rt.position.x-oe.position.x,se=Rt.position.y-oe.position.y,U=Rt.position.z-oe.position.z;if(Math.sqrt(Pt*Pt+se*se+U*U)<Vt.size*.5+.35){oe.collectedAtFrame=d.length,w++,h++,h<10&&c.push({id:`pellet_${h}`,position:jd(t.arenaSize,h),collectedAtFrame:null,spawnedAtFrame:d.length});break}}d.push({time:g,nodePositions:X,centerOfMass:Ft,activePelletIndex:h}),u.push(N(Ft,w,v,b)),_=g}}const D=d[d.length-1]?.centerOfMass||{x:0,y:0,z:0},O={x:isFinite(D.x)?D.x:0,y:isFinite(D.y)?D.y:0,z:isFinite(D.z)?D.z:0};let F=1/0;const I=E();if(I){const ut=O.x-I.position.x,X=O.y-I.position.y,Z=O.z-I.position.z;F=Math.sqrt(ut*ut+X*X+Z*Z),isFinite(F)||(F=1/0)}const z=b||{x:0,y:0,z:0},W=O.x-z.x,j=O.y-z.y,tt=O.z-z.z,nt=Math.sqrt(W*W+j*j+tt*tt),et=isFinite(nt)?nt:0;if(T)return{genome:i,frames:d,finalFitness:1,pelletsCollected:w,distanceTraveled:v,netDisplacement:et,closestPelletDistance:F,pellets:c,fitnessOverTime:u,disqualified:T};let St=R.baseFitness;if(St+=w*R.pelletWeight,isFinite(F)){const ut=Math.max(0,R.proximityMaxDistance-F)*R.proximityWeight;St+=ut}const Xt=isFinite(v)?v:0;return St+=Math.min(Xt*R.movementWeight,R.movementCap),R.distanceWeight>0&&(St+=Math.min(et*R.distanceWeight,R.distanceCap)),(!isFinite(St)||St<1)&&(St=1),{genome:i,frames:d,finalFitness:St,pelletsCollected:w,distanceTraveled:v,netDisplacement:et,closestPelletDistance:F,pellets:c,fitnessOverTime:u,disqualified:null}}async function kS(i,t,e){const n=[];for(let s=0;s<i.length;s++){const o=zS(i[s],t);n.push(o),e&&e(s+1,i.length),await new Promise(r=>setTimeout(r,0))}return n}function VS(i,t=.5){const e=[...i].sort((s,o)=>o.state.fitness-s.state.fitness),n=Math.max(1,Math.floor(e.length*t));return{survivors:e.slice(0,n),culled:e.slice(n)}}function HS(i,t){const e=[...i].sort((n,s)=>s.state.fitness-n.state.fitness);return e.slice(0,Math.min(t,e.length))}function GS(i){const t=[...i].sort((o,r)=>r.state.fitness-o.state.fitness),e=new Map,n=t.length;let s=0;for(let o=0;o<n;o++)s+=n-o;for(let o=0;o<n;o++){const r=n-o;e.set(t[o].genome.id,r/s)}return e}function Ar(i,t){const e=Math.random();let n=0;for(const s of i)if(n+=t.get(s.genome.id)||0,e<=n)return s;return i[i.length-1]}const gp={rate:.3,magnitude:.5,structuralRate:.1};let WS=0;function Os(i){return`${i}_mut_${Date.now()}_${WS++}`}function qS(i,t,e){return Math.max(t,Math.min(e,i))}function yn(i,t,e,n){const s=e-t,o=(Math.random()*2-1)*s*n;return qS(i+o,t,e)}function xp(i,t){const e=i.x-t.x,n=i.y-t.y,s=i.z-t.z;return Math.sqrt(e*e+n*n+s*s)}function XS(i,t,e){const n={...i};return Math.random()<t.rate&&(n.size=yn(i.size,e.minSize,e.maxSize,t.magnitude)),Math.random()<t.rate&&(n.friction=yn(i.friction,.1,1,t.magnitude)),Math.random()<t.rate&&(n.position={x:yn(i.position.x,-e.spawnRadius,e.spawnRadius,t.magnitude*.5),y:yn(i.position.y,.3,e.spawnRadius*1.5,t.magnitude*.5),z:yn(i.position.z,-e.spawnRadius,e.spawnRadius,t.magnitude*.5)}),n}function $S(i,t,e){const n={...i};return Math.random()<t.rate&&(n.stiffness=yn(i.stiffness,e.minStiffness,e.maxStiffness,t.magnitude)),Math.random()<t.rate&&(n.damping=yn(i.damping,.05,.8,t.magnitude)),Math.random()<t.rate&&(n.frequency=yn(i.frequency,e.minFrequency,e.maxFrequency,t.magnitude)),Math.random()<t.rate&&(n.amplitude=yn(i.amplitude,.05,e.maxAmplitude,t.magnitude)),Math.random()<t.rate&&(n.phase=yn(i.phase,0,Math.PI*2,t.magnitude)),Math.random()<t.rate&&(n.restLength=yn(i.restLength,.2,4,t.magnitude*.3)),n}function YS(i,t){if(i.nodes.length>=t.maxNodes||i.muscles.length>=t.maxMuscles)return null;const e=i.nodes[Math.floor(Math.random()*i.nodes.length)],n={id:Os("node"),size:Math.random()*(t.maxSize-t.minSize)+t.minSize,friction:Math.random()*.5+.3,position:{x:e.position.x+(Math.random()*2-1)*1.5,y:e.position.y+(Math.random()*2-1)*1,z:e.position.z+(Math.random()*2-1)*1.5}};n.position.y=Math.max(n.size*.5,n.position.y);const s=xp(e.position,n.position),o={id:Os("muscle"),nodeA:e.id,nodeB:n.id,restLength:s*(Math.random()*.4+.8),stiffness:Math.random()*(t.maxStiffness-t.minStiffness)+t.minStiffness,damping:Math.random()*.4+.1,frequency:Math.random()*(t.maxFrequency-t.minFrequency)+t.minFrequency,amplitude:Math.random()*t.maxAmplitude,phase:Math.random()*Math.PI*2};return{node:n,muscle:o}}function jS(i,t){if(i.nodes.length<=t.minNodes)return null;const e=new Map;for(const a of i.nodes)e.set(a.id,0);for(const a of i.muscles)e.set(a.nodeA,(e.get(a.nodeA)||0)+1),e.set(a.nodeB,(e.get(a.nodeB)||0)+1);const n=[...i.nodes].sort((a,l)=>(e.get(a.id)||0)-(e.get(l.id)||0)),s=Math.max(1,Math.floor(n.length/2)),o=n[Math.floor(Math.random()*s)],r=i.muscles.filter(a=>a.nodeA===o.id||a.nodeB===o.id).map(a=>a.id);return{nodeId:o.id,muscleIds:r}}function KS(i,t){if(i.muscles.length>=t.maxMuscles)return null;const e=new Set(i.muscles.map(a=>[a.nodeA,a.nodeB].sort().join("-"))),n=[];for(let a=0;a<i.nodes.length;a++)for(let l=a+1;l<i.nodes.length;l++){const c=[i.nodes[a].id,i.nodes[l].id].sort().join("-");e.has(c)||n.push([i.nodes[a],i.nodes[l]])}if(n.length===0)return null;const[s,o]=n[Math.floor(Math.random()*n.length)],r=xp(s.position,o.position);return{id:Os("muscle"),nodeA:s.id,nodeB:o.id,restLength:r*(Math.random()*.4+.8),stiffness:Math.random()*(t.maxStiffness-t.minStiffness)+t.minStiffness,damping:Math.random()*.4+.1,frequency:Math.random()*(t.maxFrequency-t.minFrequency)+t.minFrequency,amplitude:Math.random()*t.maxAmplitude,phase:Math.random()*Math.PI*2}}function Kd(i,t=gp,e=qs){const n={...i,id:Os("creature"),parentIds:[...i.parentIds,i.id],generation:i.generation+1,nodes:i.nodes.map(o=>XS({...o,id:Os("node")},t,e)),muscles:[],color:{...i.color}},s=new Map;for(let o=0;o<i.nodes.length;o++)s.set(i.nodes[o].id,n.nodes[o].id);if(n.muscles=i.muscles.map(o=>{const r=$S({...o,id:Os("muscle")},t,e);return r.nodeA=s.get(o.nodeA)||o.nodeA,r.nodeB=s.get(o.nodeB)||o.nodeB,r}),Math.random()<t.rate&&(n.globalFrequencyMultiplier=yn(i.globalFrequencyMultiplier,.3,2,t.magnitude)),Math.random()<t.rate*.5&&(n.color.h=(i.color.h+(Math.random()*.1-.05)+1)%1),Math.random()<t.structuralRate){const o=YS(n,e);o&&(n.nodes.push(o.node),n.muscles.push(o.muscle))}if(Math.random()<t.structuralRate){const o=jS(n,e);o&&(n.nodes=n.nodes.filter(r=>r.id!==o.nodeId),n.muscles=n.muscles.filter(r=>!o.muscleIds.includes(r.id)))}if(Math.random()<t.structuralRate){const o=KS(n,e);o&&n.muscles.push(o)}return n}let ZS=0;function Us(i){return`${i}_cross_${Date.now()}_${ZS++}`}function JS(i,t){const e=i.x-t.x,n=i.y-t.y,s=i.z-t.z;return Math.sqrt(e*e+n*n+s*s)}function Ze(i,t,e){return i+(t-i)*e}function QS(i,t,e){return{x:Ze(i.x,t.x,e),y:Ze(i.y,t.y,e),z:Ze(i.z,t.z,e)}}function tw(i,t,e){let n=t.h-i.h;return n>.5&&(n-=1),n<-.5&&(n+=1),{h:(i.h+n*e+1)%1,s:Ze(i.s,t.s,e),l:Ze(i.l,t.l,e)}}function ew(i,t,e=qs){const n=Math.min(e.maxNodes,e.maxMuscles+1),s=Math.min(i.nodes.length,n),o=[],r=[];for(let l=0;l<s;l++){const c=i.nodes[l],h=t.nodes[l%t.nodes.length],d=Math.random();o.push({id:Us("node"),size:Ze(c.size,h.size,d),friction:Ze(c.friction,h.friction,d),position:QS(c.position,h.position,d*.5)})}const a=new Map;for(let l=0;l<s;l++)a.set(i.nodes[l].id,o[l].id);for(let l=0;l<i.muscles.length&&r.length<e.maxMuscles;l++){const c=i.muscles[l],h=t.muscles[l%t.muscles.length],d=Math.random(),u=a.get(c.nodeA),f=a.get(c.nodeB);if(!u||!f)continue;const m=o.find(g=>g.id===u),x=o.find(g=>g.id===f),p=m&&x?JS(m.position,x.position):Ze(c.restLength,h.restLength,d);r.push({id:Us("muscle"),nodeA:u,nodeB:f,restLength:p*Ze(.9,1.1,Math.random()),stiffness:Ze(c.stiffness,h.stiffness,d),damping:Ze(c.damping,h.damping,d),frequency:Ze(c.frequency,h.frequency,d),amplitude:Ze(c.amplitude,h.amplitude,d),phase:Ze(c.phase,h.phase,d)})}return{id:Us("creature"),generation:Math.max(i.generation,t.generation)+1,survivalStreak:0,parentIds:[i.id,t.id],nodes:o,muscles:r,globalFrequencyMultiplier:Ze(i.globalFrequencyMultiplier,t.globalFrequencyMultiplier,Math.random()),controllerType:"oscillator",color:tw(i.color,t.color,Math.random())}}function nw(i,t=qs){const e=Math.min(t.maxNodes,t.maxMuscles+1),n=Math.min(i.nodes.length,e),s=i.nodes.slice(0,n).map(a=>({...a,id:Us("node"),position:{...a.position}})),o=new Map;for(let a=0;a<n;a++)o.set(i.nodes[a].id,s[a].id);const r=[];for(const a of i.muscles){if(r.length>=t.maxMuscles)break;const l=o.get(a.nodeA),c=o.get(a.nodeB);!l||!c||r.push({...a,id:Us("muscle"),nodeA:l,nodeB:c})}return{...i,id:Us("creature"),parentIds:[i.id],generation:i.generation+1,survivalStreak:0,nodes:s,muscles:r,color:{...i.color}}}class Zd{genome;state;physics=null;bodyFactory=null;meshes=null;renderer=null;simulationTime=0;constructor(t){this.genome=t,this.state=this.createInitialState(t)}createInitialState(t){const e=new Map,n=new Map;for(const s of t.nodes)e.set(s.id,{...s.position}),n.set(s.id,{x:0,y:0,z:0});return{genome:t,nodePositions:e,nodeVelocities:n,centerOfMass:{x:0,y:0,z:0},fitness:0,pelletsCollected:0,distanceTraveled:0,closestPelletDistance:1/0,gridX:0,gridY:0,isSelected:!1}}initializePhysics(t,e,n={x:0,y:0,z:0}){this.bodyFactory=e,this.physics=e.createCreaturePhysics(this.genome,n)}initializeRendering(t,e,n={x:0,y:0,z:0}){this.renderer=e,this.meshes=e.createCreatureMesh(this.genome,n)}update(t){if(!this.physics||!this.bodyFactory)return;this.simulationTime+=t,this.bodyFactory.updateMuscleSprings(this.physics.muscleSprings,this.simulationTime,this.genome.globalFrequencyMultiplier);const e=this.bodyFactory.getNodePositions(this.physics.nodeBodies),n=this.bodyFactory.getCenterOfMass(this.physics.nodeBodies),s=n.x-this.state.centerOfMass.x,o=n.y-this.state.centerOfMass.y,r=n.z-this.state.centerOfMass.z;this.state.distanceTraveled+=Math.sqrt(s*s+o*o+r*r),this.state.nodePositions=e,this.state.centerOfMass=n;for(const[a,l]of this.physics.nodeBodies)this.state.nodeVelocities.set(a,{x:l.velocity.x,y:l.velocity.y,z:l.velocity.z})}syncMeshToPhysics(){!this.renderer||!this.meshes||this.renderer.updateCreatureFromGenome(this.genome,this.state.nodePositions)}checkPelletCollisions(t){let e=0;for(const n of t)if(!n.collected){for(const[s,o]of this.state.nodePositions){const r=this.genome.nodes.find(l=>l.id===s);if(!r)continue;const a=r.size*.5;if(n.checkCollision(o,a)){n.setCollected(!0),this.state.pelletsCollected++,e++;break}}if(!n.collected){const s=n.distanceTo(this.state.centerOfMass);s<this.state.closestPelletDistance&&(this.state.closestPelletDistance=s)}}return e}calculateFitness(t){let e=1/0;for(const a of t)if(!a.collected){const l=a.distanceTo(this.state.centerOfMass);l<e&&(e=l)}const n=this.state.pelletsCollected*100,s=e<1/0?Math.max(0,20-e)*2:0,o=Math.min(this.state.distanceTraveled*.5,10),r=this.state.distanceTraveled<.5?-5:0;return this.state.fitness=n+s+o+r,this.state.fitness}reset(t={x:0,y:0,z:0}){if(this.state=this.createInitialState(this.genome),this.simulationTime=0,this.physics){for(const e of this.genome.nodes){const n=this.physics.nodeBodies.get(e.id);n&&(n.position.set(e.position.x+t.x,e.position.y+t.y,e.position.z+t.z),n.velocity.set(0,0,0),n.angularVelocity.set(0,0,0),n.force.set(0,0,0),n.torque.set(0,0,0))}for(const e of this.physics.muscleSprings.values())e.spring.restLength=e.baseRestLength}this.syncMeshToPhysics()}dispose(){this.physics&&this.bodyFactory&&this.bodyFactory.removeCreaturePhysics(this.genome),this.renderer&&this.renderer.removeCreature(this.genome.id),this.physics=null,this.meshes=null}getPosition(){return this.state.centerOfMass}setGridPosition(t,e){this.state.gridX=t,this.state.gridY=e}setSelected(t){this.state.isSelected=t}}class Qc{creatures=[];generation=0;config;genomeConstraints;mutationConfig;constructor(t=ia,e=qs,n=gp){this.config=t,this.genomeConstraints=e,this.mutationConfig={...n,rate:t.mutationRate,magnitude:t.mutationMagnitude}}static createInitial(t=ia,e=qs){const n=new Qc(t,e);for(let s=0;s<t.populationSize;s++){const o=rp(e),r=new Zd(o);n.creatures.push(r)}return n}getGenomes(){return this.creatures.map(t=>t.genome)}rankByFitness(){return[...this.creatures].sort((t,e)=>e.state.fitness-t.state.fitness)}getStats(){const t=this.creatures.map(o=>o.state.fitness),e=[...t].sort((o,r)=>r-o),n=this.creatures.reduce((o,r)=>o+r.genome.nodes.length,0)/this.creatures.length,s=this.creatures.reduce((o,r)=>o+r.genome.muscles.length,0)/this.creatures.length;return{generation:this.generation,bestFitness:e[0]||0,averageFitness:t.reduce((o,r)=>o+r,0)/t.length||0,worstFitness:e[e.length-1]||0,avgNodes:n,avgMuscles:s}}evolve(){const e=HS(this.creatures,this.config.eliteCount).map(a=>({...a.genome,survivalStreak:a.genome.survivalStreak+1})),{survivors:n}=VS(this.creatures,1-this.config.cullPercentage),s=GS(n),o=[...e],r=this.config.populationSize;for(;o.length<r;)if(Math.random()<this.config.crossoverRate&&n.length>=2){const a=Ar(n,s);let l=Ar(n,s),c=0;for(;l.genome.id===a.genome.id&&c<10;)l=Ar(n,s),c++;let h=ew(a.genome,l.genome,this.genomeConstraints);h=Kd(h,this.mutationConfig,this.genomeConstraints),o.push(h)}else{const a=Ar(n,s),l=Kd(nw(a.genome,this.genomeConstraints),this.mutationConfig,this.genomeConstraints);o.push(l)}return this.generation++,o}replaceCreatures(t){for(const e of this.creatures)e.dispose();this.creatures=t.map(e=>new Zd(e))}updateConfig(t){Object.assign(this.config,t),t.mutationRate!==void 0&&(this.mutationConfig.rate=t.mutationRate),t.mutationMagnitude!==void 0&&(this.mutationConfig.magnitude=t.mutationMagnitude)}getCreature(t){return this.creatures[t]}getCreatureById(t){return this.creatures.find(e=>e.genome.id===t)}getBest(){return this.rankByFitness()[0]}dispose(){for(const t of this.creatures)t.dispose();this.creatures=[]}}function jo(i){return i+.5|0}const Ai=(i,t,e)=>Math.max(Math.min(i,e),t);function Mo(i){return Ai(jo(i*2.55),0,255)}function Li(i){return Ai(jo(i*255),0,255)}function ri(i){return Ai(jo(i/2.55)/100,0,1)}function Jd(i){return Ai(jo(i*100),0,100)}const _n={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,A:10,B:11,C:12,D:13,E:14,F:15,a:10,b:11,c:12,d:13,e:14,f:15},Sc=[..."0123456789ABCDEF"],iw=i=>Sc[i&15],sw=i=>Sc[(i&240)>>4]+Sc[i&15],Cr=i=>(i&240)>>4===(i&15),ow=i=>Cr(i.r)&&Cr(i.g)&&Cr(i.b)&&Cr(i.a);function rw(i){var t=i.length,e;return i[0]==="#"&&(t===4||t===5?e={r:255&_n[i[1]]*17,g:255&_n[i[2]]*17,b:255&_n[i[3]]*17,a:t===5?_n[i[4]]*17:255}:(t===7||t===9)&&(e={r:_n[i[1]]<<4|_n[i[2]],g:_n[i[3]]<<4|_n[i[4]],b:_n[i[5]]<<4|_n[i[6]],a:t===9?_n[i[7]]<<4|_n[i[8]]:255})),e}const aw=(i,t)=>i<255?t(i):"";function lw(i){var t=ow(i)?iw:sw;return i?"#"+t(i.r)+t(i.g)+t(i.b)+aw(i.a,t):void 0}const cw=/^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;function _p(i,t,e){const n=t*Math.min(e,1-e),s=(o,r=(o+i/30)%12)=>e-n*Math.max(Math.min(r-3,9-r,1),-1);return[s(0),s(8),s(4)]}function hw(i,t,e){const n=(s,o=(s+i/60)%6)=>e-e*t*Math.max(Math.min(o,4-o,1),0);return[n(5),n(3),n(1)]}function dw(i,t,e){const n=_p(i,1,.5);let s;for(t+e>1&&(s=1/(t+e),t*=s,e*=s),s=0;s<3;s++)n[s]*=1-t-e,n[s]+=t;return n}function uw(i,t,e,n,s){return i===s?(t-e)/n+(t<e?6:0):t===s?(e-i)/n+2:(i-t)/n+4}function th(i){const e=i.r/255,n=i.g/255,s=i.b/255,o=Math.max(e,n,s),r=Math.min(e,n,s),a=(o+r)/2;let l,c,h;return o!==r&&(h=o-r,c=a>.5?h/(2-o-r):h/(o+r),l=uw(e,n,s,h,o),l=l*60+.5),[l|0,c||0,a]}function eh(i,t,e,n){return(Array.isArray(t)?i(t[0],t[1],t[2]):i(t,e,n)).map(Li)}function nh(i,t,e){return eh(_p,i,t,e)}function fw(i,t,e){return eh(dw,i,t,e)}function pw(i,t,e){return eh(hw,i,t,e)}function vp(i){return(i%360+360)%360}function mw(i){const t=cw.exec(i);let e=255,n;if(!t)return;t[5]!==n&&(e=t[6]?Mo(+t[5]):Li(+t[5]));const s=vp(+t[2]),o=+t[3]/100,r=+t[4]/100;return t[1]==="hwb"?n=fw(s,o,r):t[1]==="hsv"?n=pw(s,o,r):n=nh(s,o,r),{r:n[0],g:n[1],b:n[2],a:e}}function gw(i,t){var e=th(i);e[0]=vp(e[0]+t),e=nh(e),i.r=e[0],i.g=e[1],i.b=e[2]}function xw(i){if(!i)return;const t=th(i),e=t[0],n=Jd(t[1]),s=Jd(t[2]);return i.a<255?`hsla(${e}, ${n}%, ${s}%, ${ri(i.a)})`:`hsl(${e}, ${n}%, ${s}%)`}const Qd={x:"dark",Z:"light",Y:"re",X:"blu",W:"gr",V:"medium",U:"slate",A:"ee",T:"ol",S:"or",B:"ra",C:"lateg",D:"ights",R:"in",Q:"turquois",E:"hi",P:"ro",O:"al",N:"le",M:"de",L:"yello",F:"en",K:"ch",G:"arks",H:"ea",I:"ightg",J:"wh"},tu={OiceXe:"f0f8ff",antiquewEte:"faebd7",aqua:"ffff",aquamarRe:"7fffd4",azuY:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"0",blanKedOmond:"ffebcd",Xe:"ff",XeviTet:"8a2be2",bPwn:"a52a2a",burlywood:"deb887",caMtXe:"5f9ea0",KartYuse:"7fff00",KocTate:"d2691e",cSO:"ff7f50",cSnflowerXe:"6495ed",cSnsilk:"fff8dc",crimson:"dc143c",cyan:"ffff",xXe:"8b",xcyan:"8b8b",xgTMnPd:"b8860b",xWay:"a9a9a9",xgYF:"6400",xgYy:"a9a9a9",xkhaki:"bdb76b",xmagFta:"8b008b",xTivegYF:"556b2f",xSange:"ff8c00",xScEd:"9932cc",xYd:"8b0000",xsOmon:"e9967a",xsHgYF:"8fbc8f",xUXe:"483d8b",xUWay:"2f4f4f",xUgYy:"2f4f4f",xQe:"ced1",xviTet:"9400d3",dAppRk:"ff1493",dApskyXe:"bfff",dimWay:"696969",dimgYy:"696969",dodgerXe:"1e90ff",fiYbrick:"b22222",flSOwEte:"fffaf0",foYstWAn:"228b22",fuKsia:"ff00ff",gaRsbSo:"dcdcdc",ghostwEte:"f8f8ff",gTd:"ffd700",gTMnPd:"daa520",Way:"808080",gYF:"8000",gYFLw:"adff2f",gYy:"808080",honeyMw:"f0fff0",hotpRk:"ff69b4",RdianYd:"cd5c5c",Rdigo:"4b0082",ivSy:"fffff0",khaki:"f0e68c",lavFMr:"e6e6fa",lavFMrXsh:"fff0f5",lawngYF:"7cfc00",NmoncEffon:"fffacd",ZXe:"add8e6",ZcSO:"f08080",Zcyan:"e0ffff",ZgTMnPdLw:"fafad2",ZWay:"d3d3d3",ZgYF:"90ee90",ZgYy:"d3d3d3",ZpRk:"ffb6c1",ZsOmon:"ffa07a",ZsHgYF:"20b2aa",ZskyXe:"87cefa",ZUWay:"778899",ZUgYy:"778899",ZstAlXe:"b0c4de",ZLw:"ffffe0",lime:"ff00",limegYF:"32cd32",lRF:"faf0e6",magFta:"ff00ff",maPon:"800000",VaquamarRe:"66cdaa",VXe:"cd",VScEd:"ba55d3",VpurpN:"9370db",VsHgYF:"3cb371",VUXe:"7b68ee",VsprRggYF:"fa9a",VQe:"48d1cc",VviTetYd:"c71585",midnightXe:"191970",mRtcYam:"f5fffa",mistyPse:"ffe4e1",moccasR:"ffe4b5",navajowEte:"ffdead",navy:"80",Tdlace:"fdf5e6",Tive:"808000",TivedBb:"6b8e23",Sange:"ffa500",SangeYd:"ff4500",ScEd:"da70d6",pOegTMnPd:"eee8aa",pOegYF:"98fb98",pOeQe:"afeeee",pOeviTetYd:"db7093",papayawEp:"ffefd5",pHKpuff:"ffdab9",peru:"cd853f",pRk:"ffc0cb",plum:"dda0dd",powMrXe:"b0e0e6",purpN:"800080",YbeccapurpN:"663399",Yd:"ff0000",Psybrown:"bc8f8f",PyOXe:"4169e1",saddNbPwn:"8b4513",sOmon:"fa8072",sandybPwn:"f4a460",sHgYF:"2e8b57",sHshell:"fff5ee",siFna:"a0522d",silver:"c0c0c0",skyXe:"87ceeb",UXe:"6a5acd",UWay:"708090",UgYy:"708090",snow:"fffafa",sprRggYF:"ff7f",stAlXe:"4682b4",tan:"d2b48c",teO:"8080",tEstN:"d8bfd8",tomato:"ff6347",Qe:"40e0d0",viTet:"ee82ee",JHt:"f5deb3",wEte:"ffffff",wEtesmoke:"f5f5f5",Lw:"ffff00",LwgYF:"9acd32"};function _w(){const i={},t=Object.keys(tu),e=Object.keys(Qd);let n,s,o,r,a;for(n=0;n<t.length;n++){for(r=a=t[n],s=0;s<e.length;s++)o=e[s],a=a.replace(o,Qd[o]);o=parseInt(tu[r],16),i[a]=[o>>16&255,o>>8&255,o&255]}return i}let Rr;function vw(i){Rr||(Rr=_w(),Rr.transparent=[0,0,0,0]);const t=Rr[i.toLowerCase()];return t&&{r:t[0],g:t[1],b:t[2],a:t.length===4?t[3]:255}}const yw=/^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;function bw(i){const t=yw.exec(i);let e=255,n,s,o;if(t){if(t[7]!==n){const r=+t[7];e=t[8]?Mo(r):Ai(r*255,0,255)}return n=+t[1],s=+t[3],o=+t[5],n=255&(t[2]?Mo(n):Ai(n,0,255)),s=255&(t[4]?Mo(s):Ai(s,0,255)),o=255&(t[6]?Mo(o):Ai(o,0,255)),{r:n,g:s,b:o,a:e}}}function Mw(i){return i&&(i.a<255?`rgba(${i.r}, ${i.g}, ${i.b}, ${ri(i.a)})`:`rgb(${i.r}, ${i.g}, ${i.b})`)}const gl=i=>i<=.0031308?i*12.92:Math.pow(i,1/2.4)*1.055-.055,Ps=i=>i<=.04045?i/12.92:Math.pow((i+.055)/1.055,2.4);function Sw(i,t,e){const n=Ps(ri(i.r)),s=Ps(ri(i.g)),o=Ps(ri(i.b));return{r:Li(gl(n+e*(Ps(ri(t.r))-n))),g:Li(gl(s+e*(Ps(ri(t.g))-s))),b:Li(gl(o+e*(Ps(ri(t.b))-o))),a:i.a+e*(t.a-i.a)}}function Pr(i,t,e){if(i){let n=th(i);n[t]=Math.max(0,Math.min(n[t]+n[t]*e,t===0?360:1)),n=nh(n),i.r=n[0],i.g=n[1],i.b=n[2]}}function yp(i,t){return i&&Object.assign(t||{},i)}function eu(i){var t={r:0,g:0,b:0,a:255};return Array.isArray(i)?i.length>=3&&(t={r:i[0],g:i[1],b:i[2],a:255},i.length>3&&(t.a=Li(i[3]))):(t=yp(i,{r:0,g:0,b:0,a:1}),t.a=Li(t.a)),t}function ww(i){return i.charAt(0)==="r"?bw(i):mw(i)}class zo{constructor(t){if(t instanceof zo)return t;const e=typeof t;let n;e==="object"?n=eu(t):e==="string"&&(n=rw(t)||vw(t)||ww(t)),this._rgb=n,this._valid=!!n}get valid(){return this._valid}get rgb(){var t=yp(this._rgb);return t&&(t.a=ri(t.a)),t}set rgb(t){this._rgb=eu(t)}rgbString(){return this._valid?Mw(this._rgb):void 0}hexString(){return this._valid?lw(this._rgb):void 0}hslString(){return this._valid?xw(this._rgb):void 0}mix(t,e){if(t){const n=this.rgb,s=t.rgb;let o;const r=e===o?.5:e,a=2*r-1,l=n.a-s.a,c=((a*l===-1?a:(a+l)/(1+a*l))+1)/2;o=1-c,n.r=255&c*n.r+o*s.r+.5,n.g=255&c*n.g+o*s.g+.5,n.b=255&c*n.b+o*s.b+.5,n.a=r*n.a+(1-r)*s.a,this.rgb=n}return this}interpolate(t,e){return t&&(this._rgb=Sw(this._rgb,t._rgb,e)),this}clone(){return new zo(this.rgb)}alpha(t){return this._rgb.a=Li(t),this}clearer(t){const e=this._rgb;return e.a*=1-t,this}greyscale(){const t=this._rgb,e=jo(t.r*.3+t.g*.59+t.b*.11);return t.r=t.g=t.b=e,this}opaquer(t){const e=this._rgb;return e.a*=1+t,this}negate(){const t=this._rgb;return t.r=255-t.r,t.g=255-t.g,t.b=255-t.b,this}lighten(t){return Pr(this._rgb,2,t),this}darken(t){return Pr(this._rgb,2,-t),this}saturate(t){return Pr(this._rgb,1,t),this}desaturate(t){return Pr(this._rgb,1,-t),this}rotate(t){return gw(this._rgb,t),this}}function ii(){}const Ew=(()=>{let i=0;return()=>i++})();function Yt(i){return i==null}function ve(i){if(Array.isArray&&Array.isArray(i))return!0;const t=Object.prototype.toString.call(i);return t.slice(0,7)==="[object"&&t.slice(-6)==="Array]"}function Kt(i){return i!==null&&Object.prototype.toString.call(i)==="[object Object]"}function Ee(i){return(typeof i=="number"||i instanceof Number)&&isFinite(+i)}function fn(i,t){return Ee(i)?i:t}function kt(i,t){return typeof i>"u"?t:i}const Tw=(i,t)=>typeof i=="string"&&i.endsWith("%")?parseFloat(i)/100:+i/t,bp=(i,t)=>typeof i=="string"&&i.endsWith("%")?parseFloat(i)/100*t:+i;function ge(i,t,e){if(i&&typeof i.call=="function")return i.apply(e,t)}function ce(i,t,e,n){let s,o,r;if(ve(i))for(o=i.length,s=0;s<o;s++)t.call(e,i[s],s);else if(Kt(i))for(r=Object.keys(i),o=r.length,s=0;s<o;s++)t.call(e,i[r[s]],r[s])}function oa(i,t){let e,n,s,o;if(!i||!t||i.length!==t.length)return!1;for(e=0,n=i.length;e<n;++e)if(s=i[e],o=t[e],s.datasetIndex!==o.datasetIndex||s.index!==o.index)return!1;return!0}function ra(i){if(ve(i))return i.map(ra);if(Kt(i)){const t=Object.create(null),e=Object.keys(i),n=e.length;let s=0;for(;s<n;++s)t[e[s]]=ra(i[e[s]]);return t}return i}function Mp(i){return["__proto__","prototype","constructor"].indexOf(i)===-1}function Aw(i,t,e,n){if(!Mp(i))return;const s=t[i],o=e[i];Kt(s)&&Kt(o)?ko(s,o,n):t[i]=ra(o)}function ko(i,t,e){const n=ve(t)?t:[t],s=n.length;if(!Kt(i))return i;e=e||{};const o=e.merger||Aw;let r;for(let a=0;a<s;++a){if(r=n[a],!Kt(r))continue;const l=Object.keys(r);for(let c=0,h=l.length;c<h;++c)o(l[c],i,r,e)}return i}function Po(i,t){return ko(i,t,{merger:Cw})}function Cw(i,t,e){if(!Mp(i))return;const n=t[i],s=e[i];Kt(n)&&Kt(s)?Po(n,s):Object.prototype.hasOwnProperty.call(t,i)||(t[i]=ra(s))}const nu={"":i=>i,x:i=>i.x,y:i=>i.y};function Rw(i){const t=i.split("."),e=[];let n="";for(const s of t)n+=s,n.endsWith("\\")?n=n.slice(0,-1)+".":(e.push(n),n="");return e}function Pw(i){const t=Rw(i);return e=>{for(const n of t){if(n==="")break;e=e&&e[n]}return e}}function Ii(i,t){return(nu[t]||(nu[t]=Pw(t)))(i)}function ih(i){return i.charAt(0).toUpperCase()+i.slice(1)}const Vo=i=>typeof i<"u",Fi=i=>typeof i=="function",iu=(i,t)=>{if(i.size!==t.size)return!1;for(const e of i)if(!t.has(e))return!1;return!0};function Lw(i){return i.type==="mouseup"||i.type==="click"||i.type==="contextmenu"}const ee=Math.PI,_e=2*ee,Dw=_e+ee,aa=Number.POSITIVE_INFINITY,Iw=ee/180,Ae=ee/2,Xi=ee/4,su=ee*2/3,Ci=Math.log10,Hn=Math.sign;function Lo(i,t,e){return Math.abs(i-t)<e}function ou(i){const t=Math.round(i);i=Lo(i,t,i/1e3)?t:i;const e=Math.pow(10,Math.floor(Ci(i))),n=i/e;return(n<=1?1:n<=2?2:n<=5?5:10)*e}function Fw(i){const t=[],e=Math.sqrt(i);let n;for(n=1;n<e;n++)i%n===0&&(t.push(n),t.push(i/n));return e===(e|0)&&t.push(e),t.sort((s,o)=>s-o).pop(),t}function Nw(i){return typeof i=="symbol"||typeof i=="object"&&i!==null&&!(Symbol.toPrimitive in i||"toString"in i||"valueOf"in i)}function $s(i){return!Nw(i)&&!isNaN(parseFloat(i))&&isFinite(i)}function Ow(i,t){const e=Math.round(i);return e-t<=i&&e+t>=i}function Sp(i,t,e){let n,s,o;for(n=0,s=i.length;n<s;n++)o=i[n][e],isNaN(o)||(t.min=Math.min(t.min,o),t.max=Math.max(t.max,o))}function Cn(i){return i*(ee/180)}function sh(i){return i*(180/ee)}function ru(i){if(!Ee(i))return;let t=1,e=0;for(;Math.round(i*t)/t!==i;)t*=10,e++;return e}function wp(i,t){const e=t.x-i.x,n=t.y-i.y,s=Math.sqrt(e*e+n*n);let o=Math.atan2(n,e);return o<-.5*ee&&(o+=_e),{angle:o,distance:s}}function wc(i,t){return Math.sqrt(Math.pow(t.x-i.x,2)+Math.pow(t.y-i.y,2))}function Uw(i,t){return(i-t+Dw)%_e-ee}function Ge(i){return(i%_e+_e)%_e}function Ho(i,t,e,n){const s=Ge(i),o=Ge(t),r=Ge(e),a=Ge(o-s),l=Ge(r-s),c=Ge(s-o),h=Ge(s-r);return s===o||s===r||n&&o===r||a>l&&c<h}function Ue(i,t,e){return Math.max(t,Math.min(e,i))}function Bw(i){return Ue(i,-32768,32767)}function ci(i,t,e,n=1e-6){return i>=Math.min(t,e)-n&&i<=Math.max(t,e)+n}function oh(i,t,e){e=e||(r=>i[r]<t);let n=i.length-1,s=0,o;for(;n-s>1;)o=s+n>>1,e(o)?s=o:n=o;return{lo:s,hi:n}}const hi=(i,t,e,n)=>oh(i,e,n?s=>{const o=i[s][t];return o<e||o===e&&i[s+1][t]===e}:s=>i[s][t]<e),zw=(i,t,e)=>oh(i,e,n=>i[n][t]>=e);function kw(i,t,e){let n=0,s=i.length;for(;n<s&&i[n]<t;)n++;for(;s>n&&i[s-1]>e;)s--;return n>0||s<i.length?i.slice(n,s):i}const Ep=["push","pop","shift","splice","unshift"];function Vw(i,t){if(i._chartjs){i._chartjs.listeners.push(t);return}Object.defineProperty(i,"_chartjs",{configurable:!0,enumerable:!1,value:{listeners:[t]}}),Ep.forEach(e=>{const n="_onData"+ih(e),s=i[e];Object.defineProperty(i,e,{configurable:!0,enumerable:!1,value(...o){const r=s.apply(this,o);return i._chartjs.listeners.forEach(a=>{typeof a[n]=="function"&&a[n](...o)}),r}})})}function au(i,t){const e=i._chartjs;if(!e)return;const n=e.listeners,s=n.indexOf(t);s!==-1&&n.splice(s,1),!(n.length>0)&&(Ep.forEach(o=>{delete i[o]}),delete i._chartjs)}function Tp(i){const t=new Set(i);return t.size===i.length?i:Array.from(t)}const Ap=(function(){return typeof window>"u"?function(i){return i()}:window.requestAnimationFrame})();function Cp(i,t){let e=[],n=!1;return function(...s){e=s,n||(n=!0,Ap.call(window,()=>{n=!1,i.apply(t,e)}))}}function Hw(i,t){let e;return function(...n){return t?(clearTimeout(e),e=setTimeout(i,t,n)):i.apply(this,n),t}}const rh=i=>i==="start"?"left":i==="end"?"right":"center",He=(i,t,e)=>i==="start"?t:i==="end"?e:(t+e)/2,Gw=(i,t,e,n)=>i===(n?"left":"right")?e:i==="center"?(t+e)/2:t;function Rp(i,t,e){const n=t.length;let s=0,o=n;if(i._sorted){const{iScale:r,vScale:a,_parsed:l}=i,c=i.dataset&&i.dataset.options?i.dataset.options.spanGaps:null,h=r.axis,{min:d,max:u,minDefined:f,maxDefined:m}=r.getUserBounds();if(f){if(s=Math.min(hi(l,h,d).lo,e?n:hi(t,h,r.getPixelForValue(d)).lo),c){const x=l.slice(0,s+1).reverse().findIndex(p=>!Yt(p[a.axis]));s-=Math.max(0,x)}s=Ue(s,0,n-1)}if(m){let x=Math.max(hi(l,r.axis,u,!0).hi+1,e?0:hi(t,h,r.getPixelForValue(u),!0).hi+1);if(c){const p=l.slice(x-1).findIndex(g=>!Yt(g[a.axis]));x+=Math.max(0,p)}o=Ue(x,s,n)-s}else o=n-s}return{start:s,count:o}}function Pp(i){const{xScale:t,yScale:e,_scaleRanges:n}=i,s={xmin:t.min,xmax:t.max,ymin:e.min,ymax:e.max};if(!n)return i._scaleRanges=s,!0;const o=n.xmin!==t.min||n.xmax!==t.max||n.ymin!==e.min||n.ymax!==e.max;return Object.assign(n,s),o}const Lr=i=>i===0||i===1,lu=(i,t,e)=>-(Math.pow(2,10*(i-=1))*Math.sin((i-t)*_e/e)),cu=(i,t,e)=>Math.pow(2,-10*i)*Math.sin((i-t)*_e/e)+1,Do={linear:i=>i,easeInQuad:i=>i*i,easeOutQuad:i=>-i*(i-2),easeInOutQuad:i=>(i/=.5)<1?.5*i*i:-.5*(--i*(i-2)-1),easeInCubic:i=>i*i*i,easeOutCubic:i=>(i-=1)*i*i+1,easeInOutCubic:i=>(i/=.5)<1?.5*i*i*i:.5*((i-=2)*i*i+2),easeInQuart:i=>i*i*i*i,easeOutQuart:i=>-((i-=1)*i*i*i-1),easeInOutQuart:i=>(i/=.5)<1?.5*i*i*i*i:-.5*((i-=2)*i*i*i-2),easeInQuint:i=>i*i*i*i*i,easeOutQuint:i=>(i-=1)*i*i*i*i+1,easeInOutQuint:i=>(i/=.5)<1?.5*i*i*i*i*i:.5*((i-=2)*i*i*i*i+2),easeInSine:i=>-Math.cos(i*Ae)+1,easeOutSine:i=>Math.sin(i*Ae),easeInOutSine:i=>-.5*(Math.cos(ee*i)-1),easeInExpo:i=>i===0?0:Math.pow(2,10*(i-1)),easeOutExpo:i=>i===1?1:-Math.pow(2,-10*i)+1,easeInOutExpo:i=>Lr(i)?i:i<.5?.5*Math.pow(2,10*(i*2-1)):.5*(-Math.pow(2,-10*(i*2-1))+2),easeInCirc:i=>i>=1?i:-(Math.sqrt(1-i*i)-1),easeOutCirc:i=>Math.sqrt(1-(i-=1)*i),easeInOutCirc:i=>(i/=.5)<1?-.5*(Math.sqrt(1-i*i)-1):.5*(Math.sqrt(1-(i-=2)*i)+1),easeInElastic:i=>Lr(i)?i:lu(i,.075,.3),easeOutElastic:i=>Lr(i)?i:cu(i,.075,.3),easeInOutElastic(i){return Lr(i)?i:i<.5?.5*lu(i*2,.1125,.45):.5+.5*cu(i*2-1,.1125,.45)},easeInBack(i){return i*i*((1.70158+1)*i-1.70158)},easeOutBack(i){return(i-=1)*i*((1.70158+1)*i+1.70158)+1},easeInOutBack(i){let t=1.70158;return(i/=.5)<1?.5*(i*i*(((t*=1.525)+1)*i-t)):.5*((i-=2)*i*(((t*=1.525)+1)*i+t)+2)},easeInBounce:i=>1-Do.easeOutBounce(1-i),easeOutBounce(i){return i<1/2.75?7.5625*i*i:i<2/2.75?7.5625*(i-=1.5/2.75)*i+.75:i<2.5/2.75?7.5625*(i-=2.25/2.75)*i+.9375:7.5625*(i-=2.625/2.75)*i+.984375},easeInOutBounce:i=>i<.5?Do.easeInBounce(i*2)*.5:Do.easeOutBounce(i*2-1)*.5+.5};function ah(i){if(i&&typeof i=="object"){const t=i.toString();return t==="[object CanvasPattern]"||t==="[object CanvasGradient]"}return!1}function hu(i){return ah(i)?i:new zo(i)}function xl(i){return ah(i)?i:new zo(i).saturate(.5).darken(.1).hexString()}const Ww=["x","y","borderWidth","radius","tension"],qw=["color","borderColor","backgroundColor"];function Xw(i){i.set("animation",{delay:void 0,duration:1e3,easing:"easeOutQuart",fn:void 0,from:void 0,loop:void 0,to:void 0,type:void 0}),i.describe("animation",{_fallback:!1,_indexable:!1,_scriptable:t=>t!=="onProgress"&&t!=="onComplete"&&t!=="fn"}),i.set("animations",{colors:{type:"color",properties:qw},numbers:{type:"number",properties:Ww}}),i.describe("animations",{_fallback:"animation"}),i.set("transitions",{active:{animation:{duration:400}},resize:{animation:{duration:0}},show:{animations:{colors:{from:"transparent"},visible:{type:"boolean",duration:0}}},hide:{animations:{colors:{to:"transparent"},visible:{type:"boolean",easing:"linear",fn:t=>t|0}}}})}function $w(i){i.set("layout",{autoPadding:!0,padding:{top:0,right:0,bottom:0,left:0}})}const du=new Map;function Yw(i,t){t=t||{};const e=i+JSON.stringify(t);let n=du.get(e);return n||(n=new Intl.NumberFormat(i,t),du.set(e,n)),n}function Ko(i,t,e){return Yw(t,e).format(i)}const Lp={values(i){return ve(i)?i:""+i},numeric(i,t,e){if(i===0)return"0";const n=this.chart.options.locale;let s,o=i;if(e.length>1){const c=Math.max(Math.abs(e[0].value),Math.abs(e[e.length-1].value));(c<1e-4||c>1e15)&&(s="scientific"),o=jw(i,e)}const r=Ci(Math.abs(o)),a=isNaN(r)?1:Math.max(Math.min(-1*Math.floor(r),20),0),l={notation:s,minimumFractionDigits:a,maximumFractionDigits:a};return Object.assign(l,this.options.ticks.format),Ko(i,n,l)},logarithmic(i,t,e){if(i===0)return"0";const n=e[t].significand||i/Math.pow(10,Math.floor(Ci(i)));return[1,2,3,5,10,15].includes(n)||t>.8*e.length?Lp.numeric.call(this,i,t,e):""}};function jw(i,t){let e=t.length>3?t[2].value-t[1].value:t[1].value-t[0].value;return Math.abs(e)>=1&&i!==Math.floor(i)&&(e=i-Math.floor(i)),e}var _a={formatters:Lp};function Kw(i){i.set("scale",{display:!0,offset:!1,reverse:!1,beginAtZero:!1,bounds:"ticks",clip:!0,grace:0,grid:{display:!0,lineWidth:1,drawOnChartArea:!0,drawTicks:!0,tickLength:8,tickWidth:(t,e)=>e.lineWidth,tickColor:(t,e)=>e.color,offset:!1},border:{display:!0,dash:[],dashOffset:0,width:1},title:{display:!1,text:"",padding:{top:4,bottom:4}},ticks:{minRotation:0,maxRotation:50,mirror:!1,textStrokeWidth:0,textStrokeColor:"",padding:3,display:!0,autoSkip:!0,autoSkipPadding:3,labelOffset:0,callback:_a.formatters.values,minor:{},major:{},align:"center",crossAlign:"near",showLabelBackdrop:!1,backdropColor:"rgba(255, 255, 255, 0.75)",backdropPadding:2}}),i.route("scale.ticks","color","","color"),i.route("scale.grid","color","","borderColor"),i.route("scale.border","color","","borderColor"),i.route("scale.title","color","","color"),i.describe("scale",{_fallback:!1,_scriptable:t=>!t.startsWith("before")&&!t.startsWith("after")&&t!=="callback"&&t!=="parser",_indexable:t=>t!=="borderDash"&&t!=="tickBorderDash"&&t!=="dash"}),i.describe("scales",{_fallback:"scale"}),i.describe("scale.ticks",{_scriptable:t=>t!=="backdropPadding"&&t!=="callback",_indexable:t=>t!=="backdropPadding"})}const as=Object.create(null),Ec=Object.create(null);function Io(i,t){if(!t)return i;const e=t.split(".");for(let n=0,s=e.length;n<s;++n){const o=e[n];i=i[o]||(i[o]=Object.create(null))}return i}function _l(i,t,e){return typeof t=="string"?ko(Io(i,t),e):ko(Io(i,""),t)}class Zw{constructor(t,e){this.animation=void 0,this.backgroundColor="rgba(0,0,0,0.1)",this.borderColor="rgba(0,0,0,0.1)",this.color="#666",this.datasets={},this.devicePixelRatio=n=>n.chart.platform.getDevicePixelRatio(),this.elements={},this.events=["mousemove","mouseout","click","touchstart","touchmove"],this.font={family:"'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",size:12,style:"normal",lineHeight:1.2,weight:null},this.hover={},this.hoverBackgroundColor=(n,s)=>xl(s.backgroundColor),this.hoverBorderColor=(n,s)=>xl(s.borderColor),this.hoverColor=(n,s)=>xl(s.color),this.indexAxis="x",this.interaction={mode:"nearest",intersect:!0,includeInvisible:!1},this.maintainAspectRatio=!0,this.onHover=null,this.onClick=null,this.parsing=!0,this.plugins={},this.responsive=!0,this.scale=void 0,this.scales={},this.showLine=!0,this.drawActiveElementsOnTop=!0,this.describe(t),this.apply(e)}set(t,e){return _l(this,t,e)}get(t){return Io(this,t)}describe(t,e){return _l(Ec,t,e)}override(t,e){return _l(as,t,e)}route(t,e,n,s){const o=Io(this,t),r=Io(this,n),a="_"+e;Object.defineProperties(o,{[a]:{value:o[e],writable:!0},[e]:{enumerable:!0,get(){const l=this[a],c=r[s];return Kt(l)?Object.assign({},c,l):kt(l,c)},set(l){this[a]=l}}})}apply(t){t.forEach(e=>e(this))}}var ye=new Zw({_scriptable:i=>!i.startsWith("on"),_indexable:i=>i!=="events",hover:{_fallback:"interaction"},interaction:{_scriptable:!1,_indexable:!1}},[Xw,$w,Kw]);function Jw(i){return!i||Yt(i.size)||Yt(i.family)?null:(i.style?i.style+" ":"")+(i.weight?i.weight+" ":"")+i.size+"px "+i.family}function la(i,t,e,n,s){let o=t[s];return o||(o=t[s]=i.measureText(s).width,e.push(s)),o>n&&(n=o),n}function Qw(i,t,e,n){n=n||{};let s=n.data=n.data||{},o=n.garbageCollect=n.garbageCollect||[];n.font!==t&&(s=n.data={},o=n.garbageCollect=[],n.font=t),i.save(),i.font=t;let r=0;const a=e.length;let l,c,h,d,u;for(l=0;l<a;l++)if(d=e[l],d!=null&&!ve(d))r=la(i,s,o,r,d);else if(ve(d))for(c=0,h=d.length;c<h;c++)u=d[c],u!=null&&!ve(u)&&(r=la(i,s,o,r,u));i.restore();const f=o.length/2;if(f>e.length){for(l=0;l<f;l++)delete s[o[l]];o.splice(0,f)}return r}function $i(i,t,e){const n=i.currentDevicePixelRatio,s=e!==0?Math.max(e/2,.5):0;return Math.round((t-s)*n)/n+s}function uu(i,t){!t&&!i||(t=t||i.getContext("2d"),t.save(),t.resetTransform(),t.clearRect(0,0,i.width,i.height),t.restore())}function Tc(i,t,e,n){Dp(i,t,e,n,null)}function Dp(i,t,e,n,s){let o,r,a,l,c,h,d,u;const f=t.pointStyle,m=t.rotation,x=t.radius;let p=(m||0)*Iw;if(f&&typeof f=="object"&&(o=f.toString(),o==="[object HTMLImageElement]"||o==="[object HTMLCanvasElement]")){i.save(),i.translate(e,n),i.rotate(p),i.drawImage(f,-f.width/2,-f.height/2,f.width,f.height),i.restore();return}if(!(isNaN(x)||x<=0)){switch(i.beginPath(),f){default:s?i.ellipse(e,n,s/2,x,0,0,_e):i.arc(e,n,x,0,_e),i.closePath();break;case"triangle":h=s?s/2:x,i.moveTo(e+Math.sin(p)*h,n-Math.cos(p)*x),p+=su,i.lineTo(e+Math.sin(p)*h,n-Math.cos(p)*x),p+=su,i.lineTo(e+Math.sin(p)*h,n-Math.cos(p)*x),i.closePath();break;case"rectRounded":c=x*.516,l=x-c,r=Math.cos(p+Xi)*l,d=Math.cos(p+Xi)*(s?s/2-c:l),a=Math.sin(p+Xi)*l,u=Math.sin(p+Xi)*(s?s/2-c:l),i.arc(e-d,n-a,c,p-ee,p-Ae),i.arc(e+u,n-r,c,p-Ae,p),i.arc(e+d,n+a,c,p,p+Ae),i.arc(e-u,n+r,c,p+Ae,p+ee),i.closePath();break;case"rect":if(!m){l=Math.SQRT1_2*x,h=s?s/2:l,i.rect(e-h,n-l,2*h,2*l);break}p+=Xi;case"rectRot":d=Math.cos(p)*(s?s/2:x),r=Math.cos(p)*x,a=Math.sin(p)*x,u=Math.sin(p)*(s?s/2:x),i.moveTo(e-d,n-a),i.lineTo(e+u,n-r),i.lineTo(e+d,n+a),i.lineTo(e-u,n+r),i.closePath();break;case"crossRot":p+=Xi;case"cross":d=Math.cos(p)*(s?s/2:x),r=Math.cos(p)*x,a=Math.sin(p)*x,u=Math.sin(p)*(s?s/2:x),i.moveTo(e-d,n-a),i.lineTo(e+d,n+a),i.moveTo(e+u,n-r),i.lineTo(e-u,n+r);break;case"star":d=Math.cos(p)*(s?s/2:x),r=Math.cos(p)*x,a=Math.sin(p)*x,u=Math.sin(p)*(s?s/2:x),i.moveTo(e-d,n-a),i.lineTo(e+d,n+a),i.moveTo(e+u,n-r),i.lineTo(e-u,n+r),p+=Xi,d=Math.cos(p)*(s?s/2:x),r=Math.cos(p)*x,a=Math.sin(p)*x,u=Math.sin(p)*(s?s/2:x),i.moveTo(e-d,n-a),i.lineTo(e+d,n+a),i.moveTo(e+u,n-r),i.lineTo(e-u,n+r);break;case"line":r=s?s/2:Math.cos(p)*x,a=Math.sin(p)*x,i.moveTo(e-r,n-a),i.lineTo(e+r,n+a);break;case"dash":i.moveTo(e,n),i.lineTo(e+Math.cos(p)*(s?s/2:x),n+Math.sin(p)*x);break;case!1:i.closePath();break}i.fill(),t.borderWidth>0&&i.stroke()}}function di(i,t,e){return e=e||.5,!t||i&&i.x>t.left-e&&i.x<t.right+e&&i.y>t.top-e&&i.y<t.bottom+e}function va(i,t){i.save(),i.beginPath(),i.rect(t.left,t.top,t.right-t.left,t.bottom-t.top),i.clip()}function ya(i){i.restore()}function tE(i,t,e,n,s){if(!t)return i.lineTo(e.x,e.y);if(s==="middle"){const o=(t.x+e.x)/2;i.lineTo(o,t.y),i.lineTo(o,e.y)}else s==="after"!=!!n?i.lineTo(t.x,e.y):i.lineTo(e.x,t.y);i.lineTo(e.x,e.y)}function eE(i,t,e,n){if(!t)return i.lineTo(e.x,e.y);i.bezierCurveTo(n?t.cp1x:t.cp2x,n?t.cp1y:t.cp2y,n?e.cp2x:e.cp1x,n?e.cp2y:e.cp1y,e.x,e.y)}function nE(i,t){t.translation&&i.translate(t.translation[0],t.translation[1]),Yt(t.rotation)||i.rotate(t.rotation),t.color&&(i.fillStyle=t.color),t.textAlign&&(i.textAlign=t.textAlign),t.textBaseline&&(i.textBaseline=t.textBaseline)}function iE(i,t,e,n,s){if(s.strikethrough||s.underline){const o=i.measureText(n),r=t-o.actualBoundingBoxLeft,a=t+o.actualBoundingBoxRight,l=e-o.actualBoundingBoxAscent,c=e+o.actualBoundingBoxDescent,h=s.strikethrough?(l+c)/2:c;i.strokeStyle=i.fillStyle,i.beginPath(),i.lineWidth=s.decorationWidth||2,i.moveTo(r,h),i.lineTo(a,h),i.stroke()}}function sE(i,t){const e=i.fillStyle;i.fillStyle=t.color,i.fillRect(t.left,t.top,t.width,t.height),i.fillStyle=e}function ls(i,t,e,n,s,o={}){const r=ve(t)?t:[t],a=o.strokeWidth>0&&o.strokeColor!=="";let l,c;for(i.save(),i.font=s.string,nE(i,o),l=0;l<r.length;++l)c=r[l],o.backdrop&&sE(i,o.backdrop),a&&(o.strokeColor&&(i.strokeStyle=o.strokeColor),Yt(o.strokeWidth)||(i.lineWidth=o.strokeWidth),i.strokeText(c,e,n,o.maxWidth)),i.fillText(c,e,n,o.maxWidth),iE(i,e,n,c,o),n+=Number(s.lineHeight);i.restore()}function Go(i,t){const{x:e,y:n,w:s,h:o,radius:r}=t;i.arc(e+r.topLeft,n+r.topLeft,r.topLeft,1.5*ee,ee,!0),i.lineTo(e,n+o-r.bottomLeft),i.arc(e+r.bottomLeft,n+o-r.bottomLeft,r.bottomLeft,ee,Ae,!0),i.lineTo(e+s-r.bottomRight,n+o),i.arc(e+s-r.bottomRight,n+o-r.bottomRight,r.bottomRight,Ae,0,!0),i.lineTo(e+s,n+r.topRight),i.arc(e+s-r.topRight,n+r.topRight,r.topRight,0,-Ae,!0),i.lineTo(e+r.topLeft,n)}const oE=/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/,rE=/^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;function aE(i,t){const e=(""+i).match(oE);if(!e||e[1]==="normal")return t*1.2;switch(i=+e[2],e[3]){case"px":return i;case"%":i/=100;break}return t*i}const lE=i=>+i||0;function lh(i,t){const e={},n=Kt(t),s=n?Object.keys(t):t,o=Kt(i)?n?r=>kt(i[r],i[t[r]]):r=>i[r]:()=>i;for(const r of s)e[r]=lE(o(r));return e}function Ip(i){return lh(i,{top:"y",right:"x",bottom:"y",left:"x"})}function ss(i){return lh(i,["topLeft","topRight","bottomLeft","bottomRight"])}function Xe(i){const t=Ip(i);return t.width=t.left+t.right,t.height=t.top+t.bottom,t}function De(i,t){i=i||{},t=t||ye.font;let e=kt(i.size,t.size);typeof e=="string"&&(e=parseInt(e,10));let n=kt(i.style,t.style);n&&!(""+n).match(rE)&&(console.warn('Invalid font style specified: "'+n+'"'),n=void 0);const s={family:kt(i.family,t.family),lineHeight:aE(kt(i.lineHeight,t.lineHeight),e),size:e,style:n,weight:kt(i.weight,t.weight),string:""};return s.string=Jw(s),s}function So(i,t,e,n){let s,o,r;for(s=0,o=i.length;s<o;++s)if(r=i[s],r!==void 0&&r!==void 0)return r}function cE(i,t,e){const{min:n,max:s}=i,o=bp(t,(s-n)/2),r=(a,l)=>e&&a===0?0:a+l;return{min:r(n,-Math.abs(o)),max:r(s,o)}}function Ni(i,t){return Object.assign(Object.create(i),t)}function ch(i,t=[""],e,n,s=()=>i[0]){const o=e||i;typeof n>"u"&&(n=Up("_fallback",i));const r={[Symbol.toStringTag]:"Object",_cacheable:!0,_scopes:i,_rootScopes:o,_fallback:n,_getTarget:s,override:a=>ch([a,...i],t,o,n)};return new Proxy(r,{deleteProperty(a,l){return delete a[l],delete a._keys,delete i[0][l],!0},get(a,l){return Np(a,l,()=>xE(l,t,i,a))},getOwnPropertyDescriptor(a,l){return Reflect.getOwnPropertyDescriptor(a._scopes[0],l)},getPrototypeOf(){return Reflect.getPrototypeOf(i[0])},has(a,l){return pu(a).includes(l)},ownKeys(a){return pu(a)},set(a,l,c){const h=a._storage||(a._storage=s());return a[l]=h[l]=c,delete a._keys,!0}})}function Ys(i,t,e,n){const s={_cacheable:!1,_proxy:i,_context:t,_subProxy:e,_stack:new Set,_descriptors:Fp(i,n),setContext:o=>Ys(i,o,e,n),override:o=>Ys(i.override(o),t,e,n)};return new Proxy(s,{deleteProperty(o,r){return delete o[r],delete i[r],!0},get(o,r,a){return Np(o,r,()=>dE(o,r,a))},getOwnPropertyDescriptor(o,r){return o._descriptors.allKeys?Reflect.has(i,r)?{enumerable:!0,configurable:!0}:void 0:Reflect.getOwnPropertyDescriptor(i,r)},getPrototypeOf(){return Reflect.getPrototypeOf(i)},has(o,r){return Reflect.has(i,r)},ownKeys(){return Reflect.ownKeys(i)},set(o,r,a){return i[r]=a,delete o[r],!0}})}function Fp(i,t={scriptable:!0,indexable:!0}){const{_scriptable:e=t.scriptable,_indexable:n=t.indexable,_allKeys:s=t.allKeys}=i;return{allKeys:s,scriptable:e,indexable:n,isScriptable:Fi(e)?e:()=>e,isIndexable:Fi(n)?n:()=>n}}const hE=(i,t)=>i?i+ih(t):t,hh=(i,t)=>Kt(t)&&i!=="adapters"&&(Object.getPrototypeOf(t)===null||t.constructor===Object);function Np(i,t,e){if(Object.prototype.hasOwnProperty.call(i,t)||t==="constructor")return i[t];const n=e();return i[t]=n,n}function dE(i,t,e){const{_proxy:n,_context:s,_subProxy:o,_descriptors:r}=i;let a=n[t];return Fi(a)&&r.isScriptable(t)&&(a=uE(t,a,i,e)),ve(a)&&a.length&&(a=fE(t,a,i,r.isIndexable)),hh(t,a)&&(a=Ys(a,s,o&&o[t],r)),a}function uE(i,t,e,n){const{_proxy:s,_context:o,_subProxy:r,_stack:a}=e;if(a.has(i))throw new Error("Recursion detected: "+Array.from(a).join("->")+"->"+i);a.add(i);let l=t(o,r||n);return a.delete(i),hh(i,l)&&(l=dh(s._scopes,s,i,l)),l}function fE(i,t,e,n){const{_proxy:s,_context:o,_subProxy:r,_descriptors:a}=e;if(typeof o.index<"u"&&n(i))return t[o.index%t.length];if(Kt(t[0])){const l=t,c=s._scopes.filter(h=>h!==l);t=[];for(const h of l){const d=dh(c,s,i,h);t.push(Ys(d,o,r&&r[i],a))}}return t}function Op(i,t,e){return Fi(i)?i(t,e):i}const pE=(i,t)=>i===!0?t:typeof i=="string"?Ii(t,i):void 0;function mE(i,t,e,n,s){for(const o of t){const r=pE(e,o);if(r){i.add(r);const a=Op(r._fallback,e,s);if(typeof a<"u"&&a!==e&&a!==n)return a}else if(r===!1&&typeof n<"u"&&e!==n)return null}return!1}function dh(i,t,e,n){const s=t._rootScopes,o=Op(t._fallback,e,n),r=[...i,...s],a=new Set;a.add(n);let l=fu(a,r,e,o||e,n);return l===null||typeof o<"u"&&o!==e&&(l=fu(a,r,o,l,n),l===null)?!1:ch(Array.from(a),[""],s,o,()=>gE(t,e,n))}function fu(i,t,e,n,s){for(;e;)e=mE(i,t,e,n,s);return e}function gE(i,t,e){const n=i._getTarget();t in n||(n[t]={});const s=n[t];return ve(s)&&Kt(e)?e:s||{}}function xE(i,t,e,n){let s;for(const o of t)if(s=Up(hE(o,i),e),typeof s<"u")return hh(i,s)?dh(e,n,i,s):s}function Up(i,t){for(const e of t){if(!e)continue;const n=e[i];if(typeof n<"u")return n}}function pu(i){let t=i._keys;return t||(t=i._keys=_E(i._scopes)),t}function _E(i){const t=new Set;for(const e of i)for(const n of Object.keys(e).filter(s=>!s.startsWith("_")))t.add(n);return Array.from(t)}function Bp(i,t,e,n){const{iScale:s}=i,{key:o="r"}=this._parsing,r=new Array(n);let a,l,c,h;for(a=0,l=n;a<l;++a)c=a+e,h=t[c],r[a]={r:s.parse(Ii(h,o),c)};return r}const vE=Number.EPSILON||1e-14,js=(i,t)=>t<i.length&&!i[t].skip&&i[t],zp=i=>i==="x"?"y":"x";function yE(i,t,e,n){const s=i.skip?t:i,o=t,r=e.skip?t:e,a=wc(o,s),l=wc(r,o);let c=a/(a+l),h=l/(a+l);c=isNaN(c)?0:c,h=isNaN(h)?0:h;const d=n*c,u=n*h;return{previous:{x:o.x-d*(r.x-s.x),y:o.y-d*(r.y-s.y)},next:{x:o.x+u*(r.x-s.x),y:o.y+u*(r.y-s.y)}}}function bE(i,t,e){const n=i.length;let s,o,r,a,l,c=js(i,0);for(let h=0;h<n-1;++h)if(l=c,c=js(i,h+1),!(!l||!c)){if(Lo(t[h],0,vE)){e[h]=e[h+1]=0;continue}s=e[h]/t[h],o=e[h+1]/t[h],a=Math.pow(s,2)+Math.pow(o,2),!(a<=9)&&(r=3/Math.sqrt(a),e[h]=s*r*t[h],e[h+1]=o*r*t[h])}}function ME(i,t,e="x"){const n=zp(e),s=i.length;let o,r,a,l=js(i,0);for(let c=0;c<s;++c){if(r=a,a=l,l=js(i,c+1),!a)continue;const h=a[e],d=a[n];r&&(o=(h-r[e])/3,a[`cp1${e}`]=h-o,a[`cp1${n}`]=d-o*t[c]),l&&(o=(l[e]-h)/3,a[`cp2${e}`]=h+o,a[`cp2${n}`]=d+o*t[c])}}function SE(i,t="x"){const e=zp(t),n=i.length,s=Array(n).fill(0),o=Array(n);let r,a,l,c=js(i,0);for(r=0;r<n;++r)if(a=l,l=c,c=js(i,r+1),!!l){if(c){const h=c[t]-l[t];s[r]=h!==0?(c[e]-l[e])/h:0}o[r]=a?c?Hn(s[r-1])!==Hn(s[r])?0:(s[r-1]+s[r])/2:s[r-1]:s[r]}bE(i,s,o),ME(i,o,t)}function Dr(i,t,e){return Math.max(Math.min(i,e),t)}function wE(i,t){let e,n,s,o,r,a=di(i[0],t);for(e=0,n=i.length;e<n;++e)r=o,o=a,a=e<n-1&&di(i[e+1],t),o&&(s=i[e],r&&(s.cp1x=Dr(s.cp1x,t.left,t.right),s.cp1y=Dr(s.cp1y,t.top,t.bottom)),a&&(s.cp2x=Dr(s.cp2x,t.left,t.right),s.cp2y=Dr(s.cp2y,t.top,t.bottom)))}function EE(i,t,e,n,s){let o,r,a,l;if(t.spanGaps&&(i=i.filter(c=>!c.skip)),t.cubicInterpolationMode==="monotone")SE(i,s);else{let c=n?i[i.length-1]:i[0];for(o=0,r=i.length;o<r;++o)a=i[o],l=yE(c,a,i[Math.min(o+1,r-(n?0:1))%r],t.tension),a.cp1x=l.previous.x,a.cp1y=l.previous.y,a.cp2x=l.next.x,a.cp2y=l.next.y,c=a}t.capBezierPoints&&wE(i,e)}function uh(){return typeof window<"u"&&typeof document<"u"}function fh(i){let t=i.parentNode;return t&&t.toString()==="[object ShadowRoot]"&&(t=t.host),t}function ca(i,t,e){let n;return typeof i=="string"?(n=parseInt(i,10),i.indexOf("%")!==-1&&(n=n/100*t.parentNode[e])):n=i,n}const ba=i=>i.ownerDocument.defaultView.getComputedStyle(i,null);function TE(i,t){return ba(i).getPropertyValue(t)}const AE=["top","right","bottom","left"];function os(i,t,e){const n={};e=e?"-"+e:"";for(let s=0;s<4;s++){const o=AE[s];n[o]=parseFloat(i[t+"-"+o+e])||0}return n.width=n.left+n.right,n.height=n.top+n.bottom,n}const CE=(i,t,e)=>(i>0||t>0)&&(!e||!e.shadowRoot);function RE(i,t){const e=i.touches,n=e&&e.length?e[0]:i,{offsetX:s,offsetY:o}=n;let r=!1,a,l;if(CE(s,o,i.target))a=s,l=o;else{const c=t.getBoundingClientRect();a=n.clientX-c.left,l=n.clientY-c.top,r=!0}return{x:a,y:l,box:r}}function Zi(i,t){if("native"in i)return i;const{canvas:e,currentDevicePixelRatio:n}=t,s=ba(e),o=s.boxSizing==="border-box",r=os(s,"padding"),a=os(s,"border","width"),{x:l,y:c,box:h}=RE(i,e),d=r.left+(h&&a.left),u=r.top+(h&&a.top);let{width:f,height:m}=t;return o&&(f-=r.width+a.width,m-=r.height+a.height),{x:Math.round((l-d)/f*e.width/n),y:Math.round((c-u)/m*e.height/n)}}function PE(i,t,e){let n,s;if(t===void 0||e===void 0){const o=i&&fh(i);if(!o)t=i.clientWidth,e=i.clientHeight;else{const r=o.getBoundingClientRect(),a=ba(o),l=os(a,"border","width"),c=os(a,"padding");t=r.width-c.width-l.width,e=r.height-c.height-l.height,n=ca(a.maxWidth,o,"clientWidth"),s=ca(a.maxHeight,o,"clientHeight")}}return{width:t,height:e,maxWidth:n||aa,maxHeight:s||aa}}const Ri=i=>Math.round(i*10)/10;function LE(i,t,e,n){const s=ba(i),o=os(s,"margin"),r=ca(s.maxWidth,i,"clientWidth")||aa,a=ca(s.maxHeight,i,"clientHeight")||aa,l=PE(i,t,e);let{width:c,height:h}=l;if(s.boxSizing==="content-box"){const u=os(s,"border","width"),f=os(s,"padding");c-=f.width+u.width,h-=f.height+u.height}return c=Math.max(0,c-o.width),h=Math.max(0,n?c/n:h-o.height),c=Ri(Math.min(c,r,l.maxWidth)),h=Ri(Math.min(h,a,l.maxHeight)),c&&!h&&(h=Ri(c/2)),(t!==void 0||e!==void 0)&&n&&l.height&&h>l.height&&(h=l.height,c=Ri(Math.floor(h*n))),{width:c,height:h}}function mu(i,t,e){const n=t||1,s=Ri(i.height*n),o=Ri(i.width*n);i.height=Ri(i.height),i.width=Ri(i.width);const r=i.canvas;return r.style&&(e||!r.style.height&&!r.style.width)&&(r.style.height=`${i.height}px`,r.style.width=`${i.width}px`),i.currentDevicePixelRatio!==n||r.height!==s||r.width!==o?(i.currentDevicePixelRatio=n,r.height=s,r.width=o,i.ctx.setTransform(n,0,0,n,0,0),!0):!1}const DE=(function(){let i=!1;try{const t={get passive(){return i=!0,!1}};uh()&&(window.addEventListener("test",null,t),window.removeEventListener("test",null,t))}catch{}return i})();function gu(i,t){const e=TE(i,t),n=e&&e.match(/^(\d+)(\.\d+)?px$/);return n?+n[1]:void 0}function Ji(i,t,e,n){return{x:i.x+e*(t.x-i.x),y:i.y+e*(t.y-i.y)}}function IE(i,t,e,n){return{x:i.x+e*(t.x-i.x),y:n==="middle"?e<.5?i.y:t.y:n==="after"?e<1?i.y:t.y:e>0?t.y:i.y}}function FE(i,t,e,n){const s={x:i.cp2x,y:i.cp2y},o={x:t.cp1x,y:t.cp1y},r=Ji(i,s,e),a=Ji(s,o,e),l=Ji(o,t,e),c=Ji(r,a,e),h=Ji(a,l,e);return Ji(c,h,e)}const NE=function(i,t){return{x(e){return i+i+t-e},setWidth(e){t=e},textAlign(e){return e==="center"?e:e==="right"?"left":"right"},xPlus(e,n){return e-n},leftForLtr(e,n){return e-n}}},OE=function(){return{x(i){return i},setWidth(i){},textAlign(i){return i},xPlus(i,t){return i+t},leftForLtr(i,t){return i}}};function Bs(i,t,e){return i?NE(t,e):OE()}function kp(i,t){let e,n;(t==="ltr"||t==="rtl")&&(e=i.canvas.style,n=[e.getPropertyValue("direction"),e.getPropertyPriority("direction")],e.setProperty("direction",t,"important"),i.prevTextDirection=n)}function Vp(i,t){t!==void 0&&(delete i.prevTextDirection,i.canvas.style.setProperty("direction",t[0],t[1]))}function Hp(i){return i==="angle"?{between:Ho,compare:Uw,normalize:Ge}:{between:ci,compare:(t,e)=>t-e,normalize:t=>t}}function xu({start:i,end:t,count:e,loop:n,style:s}){return{start:i%e,end:t%e,loop:n&&(t-i+1)%e===0,style:s}}function UE(i,t,e){const{property:n,start:s,end:o}=e,{between:r,normalize:a}=Hp(n),l=t.length;let{start:c,end:h,loop:d}=i,u,f;if(d){for(c+=l,h+=l,u=0,f=l;u<f&&r(a(t[c%l][n]),s,o);++u)c--,h--;c%=l,h%=l}return h<c&&(h+=l),{start:c,end:h,loop:d,style:i.style}}function Gp(i,t,e){if(!e)return[i];const{property:n,start:s,end:o}=e,r=t.length,{compare:a,between:l,normalize:c}=Hp(n),{start:h,end:d,loop:u,style:f}=UE(i,t,e),m=[];let x=!1,p=null,g,_,v;const y=()=>l(s,v,g)&&a(s,v)!==0,b=()=>a(o,g)===0||l(o,v,g),w=()=>x||y(),T=()=>!x||b();for(let P=h,M=h;P<=d;++P)_=t[P%r],!_.skip&&(g=c(_[n]),g!==v&&(x=l(g,s,o),p===null&&w()&&(p=a(g,s)===0?P:M),p!==null&&T()&&(m.push(xu({start:p,end:P,loop:u,count:r,style:f})),p=null),M=P,v=g));return p!==null&&m.push(xu({start:p,end:d,loop:u,count:r,style:f})),m}function Wp(i,t){const e=[],n=i.segments;for(let s=0;s<n.length;s++){const o=Gp(n[s],i.points,t);o.length&&e.push(...o)}return e}function BE(i,t,e,n){let s=0,o=t-1;if(e&&!n)for(;s<t&&!i[s].skip;)s++;for(;s<t&&i[s].skip;)s++;for(s%=t,e&&(o+=s);o>s&&i[o%t].skip;)o--;return o%=t,{start:s,end:o}}function zE(i,t,e,n){const s=i.length,o=[];let r=t,a=i[t],l;for(l=t+1;l<=e;++l){const c=i[l%s];c.skip||c.stop?a.skip||(n=!1,o.push({start:t%s,end:(l-1)%s,loop:n}),t=r=c.stop?l:null):(r=l,a.skip&&(t=l)),a=c}return r!==null&&o.push({start:t%s,end:r%s,loop:n}),o}function kE(i,t){const e=i.points,n=i.options.spanGaps,s=e.length;if(!s)return[];const o=!!i._loop,{start:r,end:a}=BE(e,s,o,n);if(n===!0)return _u(i,[{start:r,end:a,loop:o}],e,t);const l=a<r?a+s:a,c=!!i._fullLoop&&r===0&&a===s-1;return _u(i,zE(e,r,l,c),e,t)}function _u(i,t,e,n){return!n||!n.setContext||!e?t:VE(i,t,e,n)}function VE(i,t,e,n){const s=i._chart.getContext(),o=vu(i.options),{_datasetIndex:r,options:{spanGaps:a}}=i,l=e.length,c=[];let h=o,d=t[0].start,u=d;function f(m,x,p,g){const _=a?-1:1;if(m!==x){for(m+=l;e[m%l].skip;)m-=_;for(;e[x%l].skip;)x+=_;m%l!==x%l&&(c.push({start:m%l,end:x%l,loop:p,style:g}),h=g,d=x%l)}}for(const m of t){d=a?d:m.start;let x=e[d%l],p;for(u=d+1;u<=m.end;u++){const g=e[u%l];p=vu(n.setContext(Ni(s,{type:"segment",p0:x,p1:g,p0DataIndex:(u-1)%l,p1DataIndex:u%l,datasetIndex:r}))),HE(p,h)&&f(d,u-1,m.loop,h),x=g,h=p}d<u-1&&f(d,u-1,m.loop,h)}return c}function vu(i){return{backgroundColor:i.backgroundColor,borderCapStyle:i.borderCapStyle,borderDash:i.borderDash,borderDashOffset:i.borderDashOffset,borderJoinStyle:i.borderJoinStyle,borderWidth:i.borderWidth,borderColor:i.borderColor}}function HE(i,t){if(!t)return!1;const e=[],n=function(s,o){return ah(o)?(e.includes(o)||e.push(o),e.indexOf(o)):o};return JSON.stringify(i,n)!==JSON.stringify(t,n)}function Ir(i,t,e){return i.options.clip?i[e]:t[e]}function GE(i,t){const{xScale:e,yScale:n}=i;return e&&n?{left:Ir(e,t,"left"),right:Ir(e,t,"right"),top:Ir(n,t,"top"),bottom:Ir(n,t,"bottom")}:t}function qp(i,t){const e=t._clip;if(e.disabled)return!1;const n=GE(t,i.chartArea);return{left:e.left===!1?0:n.left-(e.left===!0?0:e.left),right:e.right===!1?i.width:n.right+(e.right===!0?0:e.right),top:e.top===!1?0:n.top-(e.top===!0?0:e.top),bottom:e.bottom===!1?i.height:n.bottom+(e.bottom===!0?0:e.bottom)}}class WE{constructor(){this._request=null,this._charts=new Map,this._running=!1,this._lastDate=void 0}_notify(t,e,n,s){const o=e.listeners[s],r=e.duration;o.forEach(a=>a({chart:t,initial:e.initial,numSteps:r,currentStep:Math.min(n-e.start,r)}))}_refresh(){this._request||(this._running=!0,this._request=Ap.call(window,()=>{this._update(),this._request=null,this._running&&this._refresh()}))}_update(t=Date.now()){let e=0;this._charts.forEach((n,s)=>{if(!n.running||!n.items.length)return;const o=n.items;let r=o.length-1,a=!1,l;for(;r>=0;--r)l=o[r],l._active?(l._total>n.duration&&(n.duration=l._total),l.tick(t),a=!0):(o[r]=o[o.length-1],o.pop());a&&(s.draw(),this._notify(s,n,t,"progress")),o.length||(n.running=!1,this._notify(s,n,t,"complete"),n.initial=!1),e+=o.length}),this._lastDate=t,e===0&&(this._running=!1)}_getAnims(t){const e=this._charts;let n=e.get(t);return n||(n={running:!1,initial:!0,items:[],listeners:{complete:[],progress:[]}},e.set(t,n)),n}listen(t,e,n){this._getAnims(t).listeners[e].push(n)}add(t,e){!e||!e.length||this._getAnims(t).items.push(...e)}has(t){return this._getAnims(t).items.length>0}start(t){const e=this._charts.get(t);e&&(e.running=!0,e.start=Date.now(),e.duration=e.items.reduce((n,s)=>Math.max(n,s._duration),0),this._refresh())}running(t){if(!this._running)return!1;const e=this._charts.get(t);return!(!e||!e.running||!e.items.length)}stop(t){const e=this._charts.get(t);if(!e||!e.items.length)return;const n=e.items;let s=n.length-1;for(;s>=0;--s)n[s].cancel();e.items=[],this._notify(t,e,Date.now(),"complete")}remove(t){return this._charts.delete(t)}}var si=new WE;const yu="transparent",qE={boolean(i,t,e){return e>.5?t:i},color(i,t,e){const n=hu(i||yu),s=n.valid&&hu(t||yu);return s&&s.valid?s.mix(n,e).hexString():t},number(i,t,e){return i+(t-i)*e}};class XE{constructor(t,e,n,s){const o=e[n];s=So([t.to,s,o,t.from]);const r=So([t.from,o,s]);this._active=!0,this._fn=t.fn||qE[t.type||typeof r],this._easing=Do[t.easing]||Do.linear,this._start=Math.floor(Date.now()+(t.delay||0)),this._duration=this._total=Math.floor(t.duration),this._loop=!!t.loop,this._target=e,this._prop=n,this._from=r,this._to=s,this._promises=void 0}active(){return this._active}update(t,e,n){if(this._active){this._notify(!1);const s=this._target[this._prop],o=n-this._start,r=this._duration-o;this._start=n,this._duration=Math.floor(Math.max(r,t.duration)),this._total+=o,this._loop=!!t.loop,this._to=So([t.to,e,s,t.from]),this._from=So([t.from,s,e])}}cancel(){this._active&&(this.tick(Date.now()),this._active=!1,this._notify(!1))}tick(t){const e=t-this._start,n=this._duration,s=this._prop,o=this._from,r=this._loop,a=this._to;let l;if(this._active=o!==a&&(r||e<n),!this._active){this._target[s]=a,this._notify(!0);return}if(e<0){this._target[s]=o;return}l=e/n%2,l=r&&l>1?2-l:l,l=this._easing(Math.min(1,Math.max(0,l))),this._target[s]=this._fn(o,a,l)}wait(){const t=this._promises||(this._promises=[]);return new Promise((e,n)=>{t.push({res:e,rej:n})})}_notify(t){const e=t?"res":"rej",n=this._promises||[];for(let s=0;s<n.length;s++)n[s][e]()}}class Xp{constructor(t,e){this._chart=t,this._properties=new Map,this.configure(e)}configure(t){if(!Kt(t))return;const e=Object.keys(ye.animation),n=this._properties;Object.getOwnPropertyNames(t).forEach(s=>{const o=t[s];if(!Kt(o))return;const r={};for(const a of e)r[a]=o[a];(ve(o.properties)&&o.properties||[s]).forEach(a=>{(a===s||!n.has(a))&&n.set(a,r)})})}_animateOptions(t,e){const n=e.options,s=YE(t,n);if(!s)return[];const o=this._createAnimations(s,n);return n.$shared&&$E(t.options.$animations,n).then(()=>{t.options=n},()=>{}),o}_createAnimations(t,e){const n=this._properties,s=[],o=t.$animations||(t.$animations={}),r=Object.keys(e),a=Date.now();let l;for(l=r.length-1;l>=0;--l){const c=r[l];if(c.charAt(0)==="$")continue;if(c==="options"){s.push(...this._animateOptions(t,e));continue}const h=e[c];let d=o[c];const u=n.get(c);if(d)if(u&&d.active()){d.update(u,h,a);continue}else d.cancel();if(!u||!u.duration){t[c]=h;continue}o[c]=d=new XE(u,t,c,h),s.push(d)}return s}update(t,e){if(this._properties.size===0){Object.assign(t,e);return}const n=this._createAnimations(t,e);if(n.length)return si.add(this._chart,n),!0}}function $E(i,t){const e=[],n=Object.keys(t);for(let s=0;s<n.length;s++){const o=i[n[s]];o&&o.active()&&e.push(o.wait())}return Promise.all(e)}function YE(i,t){if(!t)return;let e=i.options;if(!e){i.options=t;return}return e.$shared&&(i.options=e=Object.assign({},e,{$shared:!1,$animations:{}})),e}function bu(i,t){const e=i&&i.options||{},n=e.reverse,s=e.min===void 0?t:0,o=e.max===void 0?t:0;return{start:n?o:s,end:n?s:o}}function jE(i,t,e){if(e===!1)return!1;const n=bu(i,e),s=bu(t,e);return{top:s.end,right:n.end,bottom:s.start,left:n.start}}function KE(i){let t,e,n,s;return Kt(i)?(t=i.top,e=i.right,n=i.bottom,s=i.left):t=e=n=s=i,{top:t,right:e,bottom:n,left:s,disabled:i===!1}}function $p(i,t){const e=[],n=i._getSortedDatasetMetas(t);let s,o;for(s=0,o=n.length;s<o;++s)e.push(n[s].index);return e}function Mu(i,t,e,n={}){const s=i.keys,o=n.mode==="single";let r,a,l,c;if(t===null)return;let h=!1;for(r=0,a=s.length;r<a;++r){if(l=+s[r],l===e){if(h=!0,n.all)continue;break}c=i.values[l],Ee(c)&&(o||t===0||Hn(t)===Hn(c))&&(t+=c)}return!h&&!n.all?0:t}function ZE(i,t){const{iScale:e,vScale:n}=t,s=e.axis==="x"?"x":"y",o=n.axis==="x"?"x":"y",r=Object.keys(i),a=new Array(r.length);let l,c,h;for(l=0,c=r.length;l<c;++l)h=r[l],a[l]={[s]:h,[o]:i[h]};return a}function vl(i,t){const e=i&&i.options.stacked;return e||e===void 0&&t.stack!==void 0}function JE(i,t,e){return`${i.id}.${t.id}.${e.stack||e.type}`}function QE(i){const{min:t,max:e,minDefined:n,maxDefined:s}=i.getUserBounds();return{min:n?t:Number.NEGATIVE_INFINITY,max:s?e:Number.POSITIVE_INFINITY}}function tT(i,t,e){const n=i[t]||(i[t]={});return n[e]||(n[e]={})}function Su(i,t,e,n){for(const s of t.getMatchingVisibleMetas(n).reverse()){const o=i[s.index];if(e&&o>0||!e&&o<0)return s.index}return null}function wu(i,t){const{chart:e,_cachedMeta:n}=i,s=e._stacks||(e._stacks={}),{iScale:o,vScale:r,index:a}=n,l=o.axis,c=r.axis,h=JE(o,r,n),d=t.length;let u;for(let f=0;f<d;++f){const m=t[f],{[l]:x,[c]:p}=m,g=m._stacks||(m._stacks={});u=g[c]=tT(s,h,x),u[a]=p,u._top=Su(u,r,!0,n.type),u._bottom=Su(u,r,!1,n.type);const _=u._visualValues||(u._visualValues={});_[a]=p}}function yl(i,t){const e=i.scales;return Object.keys(e).filter(n=>e[n].axis===t).shift()}function eT(i,t){return Ni(i,{active:!1,dataset:void 0,datasetIndex:t,index:t,mode:"default",type:"dataset"})}function nT(i,t,e){return Ni(i,{active:!1,dataIndex:t,parsed:void 0,raw:void 0,element:e,index:t,mode:"default",type:"data"})}function po(i,t){const e=i.controller.index,n=i.vScale&&i.vScale.axis;if(n){t=t||i._parsed;for(const s of t){const o=s._stacks;if(!o||o[n]===void 0||o[n][e]===void 0)return;delete o[n][e],o[n]._visualValues!==void 0&&o[n]._visualValues[e]!==void 0&&delete o[n]._visualValues[e]}}}const bl=i=>i==="reset"||i==="none",Eu=(i,t)=>t?i:Object.assign({},i),iT=(i,t,e)=>i&&!t.hidden&&t._stacked&&{keys:$p(e,!0),values:null};class Oi{static defaults={};static datasetElementType=null;static dataElementType=null;constructor(t,e){this.chart=t,this._ctx=t.ctx,this.index=e,this._cachedDataOpts={},this._cachedMeta=this.getMeta(),this._type=this._cachedMeta.type,this.options=void 0,this._parsing=!1,this._data=void 0,this._objectData=void 0,this._sharedOptions=void 0,this._drawStart=void 0,this._drawCount=void 0,this.enableOptionSharing=!1,this.supportsDecimation=!1,this.$context=void 0,this._syncList=[],this.datasetElementType=new.target.datasetElementType,this.dataElementType=new.target.dataElementType,this.initialize()}initialize(){const t=this._cachedMeta;this.configure(),this.linkScales(),t._stacked=vl(t.vScale,t),this.addElements(),this.options.fill&&!this.chart.isPluginEnabled("filler")&&console.warn("Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options")}updateIndex(t){this.index!==t&&po(this._cachedMeta),this.index=t}linkScales(){const t=this.chart,e=this._cachedMeta,n=this.getDataset(),s=(d,u,f,m)=>d==="x"?u:d==="r"?m:f,o=e.xAxisID=kt(n.xAxisID,yl(t,"x")),r=e.yAxisID=kt(n.yAxisID,yl(t,"y")),a=e.rAxisID=kt(n.rAxisID,yl(t,"r")),l=e.indexAxis,c=e.iAxisID=s(l,o,r,a),h=e.vAxisID=s(l,r,o,a);e.xScale=this.getScaleForId(o),e.yScale=this.getScaleForId(r),e.rScale=this.getScaleForId(a),e.iScale=this.getScaleForId(c),e.vScale=this.getScaleForId(h)}getDataset(){return this.chart.data.datasets[this.index]}getMeta(){return this.chart.getDatasetMeta(this.index)}getScaleForId(t){return this.chart.scales[t]}_getOtherScale(t){const e=this._cachedMeta;return t===e.iScale?e.vScale:e.iScale}reset(){this._update("reset")}_destroy(){const t=this._cachedMeta;this._data&&au(this._data,this),t._stacked&&po(t)}_dataCheck(){const t=this.getDataset(),e=t.data||(t.data=[]),n=this._data;if(Kt(e)){const s=this._cachedMeta;this._data=ZE(e,s)}else if(n!==e){if(n){au(n,this);const s=this._cachedMeta;po(s),s._parsed=[]}e&&Object.isExtensible(e)&&Vw(e,this),this._syncList=[],this._data=e}}addElements(){const t=this._cachedMeta;this._dataCheck(),this.datasetElementType&&(t.dataset=new this.datasetElementType)}buildOrUpdateElements(t){const e=this._cachedMeta,n=this.getDataset();let s=!1;this._dataCheck();const o=e._stacked;e._stacked=vl(e.vScale,e),e.stack!==n.stack&&(s=!0,po(e),e.stack=n.stack),this._resyncElements(t),(s||o!==e._stacked)&&(wu(this,e._parsed),e._stacked=vl(e.vScale,e))}configure(){const t=this.chart.config,e=t.datasetScopeKeys(this._type),n=t.getOptionScopes(this.getDataset(),e,!0);this.options=t.createResolver(n,this.getContext()),this._parsing=this.options.parsing,this._cachedDataOpts={}}parse(t,e){const{_cachedMeta:n,_data:s}=this,{iScale:o,_stacked:r}=n,a=o.axis;let l=t===0&&e===s.length?!0:n._sorted,c=t>0&&n._parsed[t-1],h,d,u;if(this._parsing===!1)n._parsed=s,n._sorted=!0,u=s;else{ve(s[t])?u=this.parseArrayData(n,s,t,e):Kt(s[t])?u=this.parseObjectData(n,s,t,e):u=this.parsePrimitiveData(n,s,t,e);const f=()=>d[a]===null||c&&d[a]<c[a];for(h=0;h<e;++h)n._parsed[h+t]=d=u[h],l&&(f()&&(l=!1),c=d);n._sorted=l}r&&wu(this,u)}parsePrimitiveData(t,e,n,s){const{iScale:o,vScale:r}=t,a=o.axis,l=r.axis,c=o.getLabels(),h=o===r,d=new Array(s);let u,f,m;for(u=0,f=s;u<f;++u)m=u+n,d[u]={[a]:h||o.parse(c[m],m),[l]:r.parse(e[m],m)};return d}parseArrayData(t,e,n,s){const{xScale:o,yScale:r}=t,a=new Array(s);let l,c,h,d;for(l=0,c=s;l<c;++l)h=l+n,d=e[h],a[l]={x:o.parse(d[0],h),y:r.parse(d[1],h)};return a}parseObjectData(t,e,n,s){const{xScale:o,yScale:r}=t,{xAxisKey:a="x",yAxisKey:l="y"}=this._parsing,c=new Array(s);let h,d,u,f;for(h=0,d=s;h<d;++h)u=h+n,f=e[u],c[h]={x:o.parse(Ii(f,a),u),y:r.parse(Ii(f,l),u)};return c}getParsed(t){return this._cachedMeta._parsed[t]}getDataElement(t){return this._cachedMeta.data[t]}applyStack(t,e,n){const s=this.chart,o=this._cachedMeta,r=e[t.axis],a={keys:$p(s,!0),values:e._stacks[t.axis]._visualValues};return Mu(a,r,o.index,{mode:n})}updateRangeFromParsed(t,e,n,s){const o=n[e.axis];let r=o===null?NaN:o;const a=s&&n._stacks[e.axis];s&&a&&(s.values=a,r=Mu(s,o,this._cachedMeta.index)),t.min=Math.min(t.min,r),t.max=Math.max(t.max,r)}getMinMax(t,e){const n=this._cachedMeta,s=n._parsed,o=n._sorted&&t===n.iScale,r=s.length,a=this._getOtherScale(t),l=iT(e,n,this.chart),c={min:Number.POSITIVE_INFINITY,max:Number.NEGATIVE_INFINITY},{min:h,max:d}=QE(a);let u,f;function m(){f=s[u];const x=f[a.axis];return!Ee(f[t.axis])||h>x||d<x}for(u=0;u<r&&!(!m()&&(this.updateRangeFromParsed(c,t,f,l),o));++u);if(o){for(u=r-1;u>=0;--u)if(!m()){this.updateRangeFromParsed(c,t,f,l);break}}return c}getAllParsedValues(t){const e=this._cachedMeta._parsed,n=[];let s,o,r;for(s=0,o=e.length;s<o;++s)r=e[s][t.axis],Ee(r)&&n.push(r);return n}getMaxOverflow(){return!1}getLabelAndValue(t){const e=this._cachedMeta,n=e.iScale,s=e.vScale,o=this.getParsed(t);return{label:n?""+n.getLabelForValue(o[n.axis]):"",value:s?""+s.getLabelForValue(o[s.axis]):""}}_update(t){const e=this._cachedMeta;this.update(t||"default"),e._clip=KE(kt(this.options.clip,jE(e.xScale,e.yScale,this.getMaxOverflow())))}update(t){}draw(){const t=this._ctx,e=this.chart,n=this._cachedMeta,s=n.data||[],o=e.chartArea,r=[],a=this._drawStart||0,l=this._drawCount||s.length-a,c=this.options.drawActiveElementsOnTop;let h;for(n.dataset&&n.dataset.draw(t,o,a,l),h=a;h<a+l;++h){const d=s[h];d.hidden||(d.active&&c?r.push(d):d.draw(t,o))}for(h=0;h<r.length;++h)r[h].draw(t,o)}getStyle(t,e){const n=e?"active":"default";return t===void 0&&this._cachedMeta.dataset?this.resolveDatasetElementOptions(n):this.resolveDataElementOptions(t||0,n)}getContext(t,e,n){const s=this.getDataset();let o;if(t>=0&&t<this._cachedMeta.data.length){const r=this._cachedMeta.data[t];o=r.$context||(r.$context=nT(this.getContext(),t,r)),o.parsed=this.getParsed(t),o.raw=s.data[t],o.index=o.dataIndex=t}else o=this.$context||(this.$context=eT(this.chart.getContext(),this.index)),o.dataset=s,o.index=o.datasetIndex=this.index;return o.active=!!e,o.mode=n,o}resolveDatasetElementOptions(t){return this._resolveElementOptions(this.datasetElementType.id,t)}resolveDataElementOptions(t,e){return this._resolveElementOptions(this.dataElementType.id,e,t)}_resolveElementOptions(t,e="default",n){const s=e==="active",o=this._cachedDataOpts,r=t+"-"+e,a=o[r],l=this.enableOptionSharing&&Vo(n);if(a)return Eu(a,l);const c=this.chart.config,h=c.datasetElementScopeKeys(this._type,t),d=s?[`${t}Hover`,"hover",t,""]:[t,""],u=c.getOptionScopes(this.getDataset(),h),f=Object.keys(ye.elements[t]),m=()=>this.getContext(n,s,e),x=c.resolveNamedOptions(u,f,m,d);return x.$shared&&(x.$shared=l,o[r]=Object.freeze(Eu(x,l))),x}_resolveAnimations(t,e,n){const s=this.chart,o=this._cachedDataOpts,r=`animation-${e}`,a=o[r];if(a)return a;let l;if(s.options.animation!==!1){const h=this.chart.config,d=h.datasetAnimationScopeKeys(this._type,e),u=h.getOptionScopes(this.getDataset(),d);l=h.createResolver(u,this.getContext(t,n,e))}const c=new Xp(s,l&&l.animations);return l&&l._cacheable&&(o[r]=Object.freeze(c)),c}getSharedOptions(t){if(t.$shared)return this._sharedOptions||(this._sharedOptions=Object.assign({},t))}includeOptions(t,e){return!e||bl(t)||this.chart._animationsDisabled}_getSharedOptions(t,e){const n=this.resolveDataElementOptions(t,e),s=this._sharedOptions,o=this.getSharedOptions(n),r=this.includeOptions(e,o)||o!==s;return this.updateSharedOptions(o,e,n),{sharedOptions:o,includeOptions:r}}updateElement(t,e,n,s){bl(s)?Object.assign(t,n):this._resolveAnimations(e,s).update(t,n)}updateSharedOptions(t,e,n){t&&!bl(e)&&this._resolveAnimations(void 0,e).update(t,n)}_setStyle(t,e,n,s){t.active=s;const o=this.getStyle(e,s);this._resolveAnimations(e,n,s).update(t,{options:!s&&this.getSharedOptions(o)||o})}removeHoverStyle(t,e,n){this._setStyle(t,n,"active",!1)}setHoverStyle(t,e,n){this._setStyle(t,n,"active",!0)}_removeDatasetHoverStyle(){const t=this._cachedMeta.dataset;t&&this._setStyle(t,void 0,"active",!1)}_setDatasetHoverStyle(){const t=this._cachedMeta.dataset;t&&this._setStyle(t,void 0,"active",!0)}_resyncElements(t){const e=this._data,n=this._cachedMeta.data;for(const[a,l,c]of this._syncList)this[a](l,c);this._syncList=[];const s=n.length,o=e.length,r=Math.min(o,s);r&&this.parse(0,r),o>s?this._insertElements(s,o-s,t):o<s&&this._removeElements(o,s-o)}_insertElements(t,e,n=!0){const s=this._cachedMeta,o=s.data,r=t+e;let a;const l=c=>{for(c.length+=e,a=c.length-1;a>=r;a--)c[a]=c[a-e]};for(l(o),a=t;a<r;++a)o[a]=new this.dataElementType;this._parsing&&l(s._parsed),this.parse(t,e),n&&this.updateElements(o,t,e,"reset")}updateElements(t,e,n,s){}_removeElements(t,e){const n=this._cachedMeta;if(this._parsing){const s=n._parsed.splice(t,e);n._stacked&&po(n,s)}n.data.splice(t,e)}_sync(t){if(this._parsing)this._syncList.push(t);else{const[e,n,s]=t;this[e](n,s)}this.chart._dataChanges.push([this.index,...t])}_onDataPush(){const t=arguments.length;this._sync(["_insertElements",this.getDataset().data.length-t,t])}_onDataPop(){this._sync(["_removeElements",this._cachedMeta.data.length-1,1])}_onDataShift(){this._sync(["_removeElements",0,1])}_onDataSplice(t,e){e&&this._sync(["_removeElements",t,e]);const n=arguments.length-2;n&&this._sync(["_insertElements",t,n])}_onDataUnshift(){this._sync(["_insertElements",0,arguments.length])}}function sT(i,t){if(!i._cache.$bar){const e=i.getMatchingVisibleMetas(t);let n=[];for(let s=0,o=e.length;s<o;s++)n=n.concat(e[s].controller.getAllParsedValues(i));i._cache.$bar=Tp(n.sort((s,o)=>s-o))}return i._cache.$bar}function oT(i){const t=i.iScale,e=sT(t,i.type);let n=t._length,s,o,r,a;const l=()=>{r===32767||r===-32768||(Vo(a)&&(n=Math.min(n,Math.abs(r-a)||n)),a=r)};for(s=0,o=e.length;s<o;++s)r=t.getPixelForValue(e[s]),l();for(a=void 0,s=0,o=t.ticks.length;s<o;++s)r=t.getPixelForTick(s),l();return n}function rT(i,t,e,n){const s=e.barThickness;let o,r;return Yt(s)?(o=t.min*e.categoryPercentage,r=e.barPercentage):(o=s*n,r=1),{chunk:o/n,ratio:r,start:t.pixels[i]-o/2}}function aT(i,t,e,n){const s=t.pixels,o=s[i];let r=i>0?s[i-1]:null,a=i<s.length-1?s[i+1]:null;const l=e.categoryPercentage;r===null&&(r=o-(a===null?t.end-t.start:a-o)),a===null&&(a=o+o-r);const c=o-(o-Math.min(r,a))/2*l;return{chunk:Math.abs(a-r)/2*l/n,ratio:e.barPercentage,start:c}}function lT(i,t,e,n){const s=e.parse(i[0],n),o=e.parse(i[1],n),r=Math.min(s,o),a=Math.max(s,o);let l=r,c=a;Math.abs(r)>Math.abs(a)&&(l=a,c=r),t[e.axis]=c,t._custom={barStart:l,barEnd:c,start:s,end:o,min:r,max:a}}function Yp(i,t,e,n){return ve(i)?lT(i,t,e,n):t[e.axis]=e.parse(i,n),t}function Tu(i,t,e,n){const s=i.iScale,o=i.vScale,r=s.getLabels(),a=s===o,l=[];let c,h,d,u;for(c=e,h=e+n;c<h;++c)u=t[c],d={},d[s.axis]=a||s.parse(r[c],c),l.push(Yp(u,d,o,c));return l}function Ml(i){return i&&i.barStart!==void 0&&i.barEnd!==void 0}function cT(i,t,e){return i!==0?Hn(i):(t.isHorizontal()?1:-1)*(t.min>=e?1:-1)}function hT(i){let t,e,n,s,o;return i.horizontal?(t=i.base>i.x,e="left",n="right"):(t=i.base<i.y,e="bottom",n="top"),t?(s="end",o="start"):(s="start",o="end"),{start:e,end:n,reverse:t,top:s,bottom:o}}function dT(i,t,e,n){let s=t.borderSkipped;const o={};if(!s){i.borderSkipped=o;return}if(s===!0){i.borderSkipped={top:!0,right:!0,bottom:!0,left:!0};return}const{start:r,end:a,reverse:l,top:c,bottom:h}=hT(i);s==="middle"&&e&&(i.enableBorderRadius=!0,(e._top||0)===n?s=c:(e._bottom||0)===n?s=h:(o[Au(h,r,a,l)]=!0,s=c)),o[Au(s,r,a,l)]=!0,i.borderSkipped=o}function Au(i,t,e,n){return n?(i=uT(i,t,e),i=Cu(i,e,t)):i=Cu(i,t,e),i}function uT(i,t,e){return i===t?e:i===e?t:i}function Cu(i,t,e){return i==="start"?t:i==="end"?e:i}function fT(i,{inflateAmount:t},e){i.inflateAmount=t==="auto"?e===1?.33:0:t}class pT extends Oi{static id="bar";static defaults={datasetElementType:!1,dataElementType:"bar",categoryPercentage:.8,barPercentage:.9,grouped:!0,animations:{numbers:{type:"number",properties:["x","y","base","width","height"]}}};static overrides={scales:{_index_:{type:"category",offset:!0,grid:{offset:!0}},_value_:{type:"linear",beginAtZero:!0}}};parsePrimitiveData(t,e,n,s){return Tu(t,e,n,s)}parseArrayData(t,e,n,s){return Tu(t,e,n,s)}parseObjectData(t,e,n,s){const{iScale:o,vScale:r}=t,{xAxisKey:a="x",yAxisKey:l="y"}=this._parsing,c=o.axis==="x"?a:l,h=r.axis==="x"?a:l,d=[];let u,f,m,x;for(u=n,f=n+s;u<f;++u)x=e[u],m={},m[o.axis]=o.parse(Ii(x,c),u),d.push(Yp(Ii(x,h),m,r,u));return d}updateRangeFromParsed(t,e,n,s){super.updateRangeFromParsed(t,e,n,s);const o=n._custom;o&&e===this._cachedMeta.vScale&&(t.min=Math.min(t.min,o.min),t.max=Math.max(t.max,o.max))}getMaxOverflow(){return 0}getLabelAndValue(t){const e=this._cachedMeta,{iScale:n,vScale:s}=e,o=this.getParsed(t),r=o._custom,a=Ml(r)?"["+r.start+", "+r.end+"]":""+s.getLabelForValue(o[s.axis]);return{label:""+n.getLabelForValue(o[n.axis]),value:a}}initialize(){this.enableOptionSharing=!0,super.initialize();const t=this._cachedMeta;t.stack=this.getDataset().stack}update(t){const e=this._cachedMeta;this.updateElements(e.data,0,e.data.length,t)}updateElements(t,e,n,s){const o=s==="reset",{index:r,_cachedMeta:{vScale:a}}=this,l=a.getBasePixel(),c=a.isHorizontal(),h=this._getRuler(),{sharedOptions:d,includeOptions:u}=this._getSharedOptions(e,s);for(let f=e;f<e+n;f++){const m=this.getParsed(f),x=o||Yt(m[a.axis])?{base:l,head:l}:this._calculateBarValuePixels(f),p=this._calculateBarIndexPixels(f,h),g=(m._stacks||{})[a.axis],_={horizontal:c,base:x.base,enableBorderRadius:!g||Ml(m._custom)||r===g._top||r===g._bottom,x:c?x.head:p.center,y:c?p.center:x.head,height:c?p.size:Math.abs(x.size),width:c?Math.abs(x.size):p.size};u&&(_.options=d||this.resolveDataElementOptions(f,t[f].active?"active":s));const v=_.options||t[f].options;dT(_,v,g,r),fT(_,v,h.ratio),this.updateElement(t[f],f,_,s)}}_getStacks(t,e){const{iScale:n}=this._cachedMeta,s=n.getMatchingVisibleMetas(this._type).filter(h=>h.controller.options.grouped),o=n.options.stacked,r=[],a=this._cachedMeta.controller.getParsed(e),l=a&&a[n.axis],c=h=>{const d=h._parsed.find(f=>f[n.axis]===l),u=d&&d[h.vScale.axis];if(Yt(u)||isNaN(u))return!0};for(const h of s)if(!(e!==void 0&&c(h))&&((o===!1||r.indexOf(h.stack)===-1||o===void 0&&h.stack===void 0)&&r.push(h.stack),h.index===t))break;return r.length||r.push(void 0),r}_getStackCount(t){return this._getStacks(void 0,t).length}_getAxisCount(){return this._getAxis().length}getFirstScaleIdForIndexAxis(){const t=this.chart.scales,e=this.chart.options.indexAxis;return Object.keys(t).filter(n=>t[n].axis===e).shift()}_getAxis(){const t={},e=this.getFirstScaleIdForIndexAxis();for(const n of this.chart.data.datasets)t[kt(this.chart.options.indexAxis==="x"?n.xAxisID:n.yAxisID,e)]=!0;return Object.keys(t)}_getStackIndex(t,e,n){const s=this._getStacks(t,n),o=e!==void 0?s.indexOf(e):-1;return o===-1?s.length-1:o}_getRuler(){const t=this.options,e=this._cachedMeta,n=e.iScale,s=[];let o,r;for(o=0,r=e.data.length;o<r;++o)s.push(n.getPixelForValue(this.getParsed(o)[n.axis],o));const a=t.barThickness;return{min:a||oT(e),pixels:s,start:n._startPixel,end:n._endPixel,stackCount:this._getStackCount(),scale:n,grouped:t.grouped,ratio:a?1:t.categoryPercentage*t.barPercentage}}_calculateBarValuePixels(t){const{_cachedMeta:{vScale:e,_stacked:n,index:s},options:{base:o,minBarLength:r}}=this,a=o||0,l=this.getParsed(t),c=l._custom,h=Ml(c);let d=l[e.axis],u=0,f=n?this.applyStack(e,l,n):d,m,x;f!==d&&(u=f-d,f=d),h&&(d=c.barStart,f=c.barEnd-c.barStart,d!==0&&Hn(d)!==Hn(c.barEnd)&&(u=0),u+=d);const p=!Yt(o)&&!h?o:u;let g=e.getPixelForValue(p);if(this.chart.getDataVisibility(t)?m=e.getPixelForValue(u+f):m=g,x=m-g,Math.abs(x)<r){x=cT(x,e,a)*r,d===a&&(g-=x/2);const _=e.getPixelForDecimal(0),v=e.getPixelForDecimal(1),y=Math.min(_,v),b=Math.max(_,v);g=Math.max(Math.min(g,b),y),m=g+x,n&&!h&&(l._stacks[e.axis]._visualValues[s]=e.getValueForPixel(m)-e.getValueForPixel(g))}if(g===e.getPixelForValue(a)){const _=Hn(x)*e.getLineWidthForValue(a)/2;g+=_,x-=_}return{size:x,base:g,head:m,center:m+x/2}}_calculateBarIndexPixels(t,e){const n=e.scale,s=this.options,o=s.skipNull,r=kt(s.maxBarThickness,1/0);let a,l;const c=this._getAxisCount();if(e.grouped){const h=o?this._getStackCount(t):e.stackCount,d=s.barThickness==="flex"?aT(t,e,s,h*c):rT(t,e,s,h*c),u=this.chart.options.indexAxis==="x"?this.getDataset().xAxisID:this.getDataset().yAxisID,f=this._getAxis().indexOf(kt(u,this.getFirstScaleIdForIndexAxis())),m=this._getStackIndex(this.index,this._cachedMeta.stack,o?t:void 0)+f;a=d.start+d.chunk*m+d.chunk/2,l=Math.min(r,d.chunk*d.ratio)}else a=n.getPixelForValue(this.getParsed(t)[n.axis],t),l=Math.min(r,e.min*e.ratio);return{base:a-l/2,head:a+l/2,center:a,size:l}}draw(){const t=this._cachedMeta,e=t.vScale,n=t.data,s=n.length;let o=0;for(;o<s;++o)this.getParsed(o)[e.axis]!==null&&!n[o].hidden&&n[o].draw(this._ctx)}}class mT extends Oi{static id="bubble";static defaults={datasetElementType:!1,dataElementType:"point",animations:{numbers:{type:"number",properties:["x","y","borderWidth","radius"]}}};static overrides={scales:{x:{type:"linear"},y:{type:"linear"}}};initialize(){this.enableOptionSharing=!0,super.initialize()}parsePrimitiveData(t,e,n,s){const o=super.parsePrimitiveData(t,e,n,s);for(let r=0;r<o.length;r++)o[r]._custom=this.resolveDataElementOptions(r+n).radius;return o}parseArrayData(t,e,n,s){const o=super.parseArrayData(t,e,n,s);for(let r=0;r<o.length;r++){const a=e[n+r];o[r]._custom=kt(a[2],this.resolveDataElementOptions(r+n).radius)}return o}parseObjectData(t,e,n,s){const o=super.parseObjectData(t,e,n,s);for(let r=0;r<o.length;r++){const a=e[n+r];o[r]._custom=kt(a&&a.r&&+a.r,this.resolveDataElementOptions(r+n).radius)}return o}getMaxOverflow(){const t=this._cachedMeta.data;let e=0;for(let n=t.length-1;n>=0;--n)e=Math.max(e,t[n].size(this.resolveDataElementOptions(n))/2);return e>0&&e}getLabelAndValue(t){const e=this._cachedMeta,n=this.chart.data.labels||[],{xScale:s,yScale:o}=e,r=this.getParsed(t),a=s.getLabelForValue(r.x),l=o.getLabelForValue(r.y),c=r._custom;return{label:n[t]||"",value:"("+a+", "+l+(c?", "+c:"")+")"}}update(t){const e=this._cachedMeta.data;this.updateElements(e,0,e.length,t)}updateElements(t,e,n,s){const o=s==="reset",{iScale:r,vScale:a}=this._cachedMeta,{sharedOptions:l,includeOptions:c}=this._getSharedOptions(e,s),h=r.axis,d=a.axis;for(let u=e;u<e+n;u++){const f=t[u],m=!o&&this.getParsed(u),x={},p=x[h]=o?r.getPixelForDecimal(.5):r.getPixelForValue(m[h]),g=x[d]=o?a.getBasePixel():a.getPixelForValue(m[d]);x.skip=isNaN(p)||isNaN(g),c&&(x.options=l||this.resolveDataElementOptions(u,f.active?"active":s),o&&(x.options.radius=0)),this.updateElement(f,u,x,s)}}resolveDataElementOptions(t,e){const n=this.getParsed(t);let s=super.resolveDataElementOptions(t,e);s.$shared&&(s=Object.assign({},s,{$shared:!1}));const o=s.radius;return e!=="active"&&(s.radius=0),s.radius+=kt(n&&n._custom,o),s}}function gT(i,t,e){let n=1,s=1,o=0,r=0;if(t<_e){const a=i,l=a+t,c=Math.cos(a),h=Math.sin(a),d=Math.cos(l),u=Math.sin(l),f=(v,y,b)=>Ho(v,a,l,!0)?1:Math.max(y,y*e,b,b*e),m=(v,y,b)=>Ho(v,a,l,!0)?-1:Math.min(y,y*e,b,b*e),x=f(0,c,d),p=f(Ae,h,u),g=m(ee,c,d),_=m(ee+Ae,h,u);n=(x-g)/2,s=(p-_)/2,o=-(x+g)/2,r=-(p+_)/2}return{ratioX:n,ratioY:s,offsetX:o,offsetY:r}}class ph extends Oi{static id="doughnut";static defaults={datasetElementType:!1,dataElementType:"arc",animation:{animateRotate:!0,animateScale:!1},animations:{numbers:{type:"number",properties:["circumference","endAngle","innerRadius","outerRadius","startAngle","x","y","offset","borderWidth","spacing"]}},cutout:"50%",rotation:0,circumference:360,radius:"100%",spacing:0,indexAxis:"r"};static descriptors={_scriptable:t=>t!=="spacing",_indexable:t=>t!=="spacing"&&!t.startsWith("borderDash")&&!t.startsWith("hoverBorderDash")};static overrides={aspectRatio:1,plugins:{legend:{labels:{generateLabels(t){const e=t.data,{labels:{pointStyle:n,textAlign:s,color:o,useBorderRadius:r,borderRadius:a}}=t.legend.options;return e.labels.length&&e.datasets.length?e.labels.map((l,c)=>{const d=t.getDatasetMeta(0).controller.getStyle(c);return{text:l,fillStyle:d.backgroundColor,fontColor:o,hidden:!t.getDataVisibility(c),lineDash:d.borderDash,lineDashOffset:d.borderDashOffset,lineJoin:d.borderJoinStyle,lineWidth:d.borderWidth,strokeStyle:d.borderColor,textAlign:s,pointStyle:n,borderRadius:r&&(a||d.borderRadius),index:c}}):[]}},onClick(t,e,n){n.chart.toggleDataVisibility(e.index),n.chart.update()}}}};constructor(t,e){super(t,e),this.enableOptionSharing=!0,this.innerRadius=void 0,this.outerRadius=void 0,this.offsetX=void 0,this.offsetY=void 0}linkScales(){}parse(t,e){const n=this.getDataset().data,s=this._cachedMeta;if(this._parsing===!1)s._parsed=n;else{let o=l=>+n[l];if(Kt(n[t])){const{key:l="value"}=this._parsing;o=c=>+Ii(n[c],l)}let r,a;for(r=t,a=t+e;r<a;++r)s._parsed[r]=o(r)}}_getRotation(){return Cn(this.options.rotation-90)}_getCircumference(){return Cn(this.options.circumference)}_getRotationExtents(){let t=_e,e=-_e;for(let n=0;n<this.chart.data.datasets.length;++n)if(this.chart.isDatasetVisible(n)&&this.chart.getDatasetMeta(n).type===this._type){const s=this.chart.getDatasetMeta(n).controller,o=s._getRotation(),r=s._getCircumference();t=Math.min(t,o),e=Math.max(e,o+r)}return{rotation:t,circumference:e-t}}update(t){const e=this.chart,{chartArea:n}=e,s=this._cachedMeta,o=s.data,r=this.getMaxBorderWidth()+this.getMaxOffset(o)+this.options.spacing,a=Math.max((Math.min(n.width,n.height)-r)/2,0),l=Math.min(Tw(this.options.cutout,a),1),c=this._getRingWeight(this.index),{circumference:h,rotation:d}=this._getRotationExtents(),{ratioX:u,ratioY:f,offsetX:m,offsetY:x}=gT(d,h,l),p=(n.width-r)/u,g=(n.height-r)/f,_=Math.max(Math.min(p,g)/2,0),v=bp(this.options.radius,_),y=Math.max(v*l,0),b=(v-y)/this._getVisibleDatasetWeightTotal();this.offsetX=m*v,this.offsetY=x*v,s.total=this.calculateTotal(),this.outerRadius=v-b*this._getRingWeightOffset(this.index),this.innerRadius=Math.max(this.outerRadius-b*c,0),this.updateElements(o,0,o.length,t)}_circumference(t,e){const n=this.options,s=this._cachedMeta,o=this._getCircumference();return e&&n.animation.animateRotate||!this.chart.getDataVisibility(t)||s._parsed[t]===null||s.data[t].hidden?0:this.calculateCircumference(s._parsed[t]*o/_e)}updateElements(t,e,n,s){const o=s==="reset",r=this.chart,a=r.chartArea,c=r.options.animation,h=(a.left+a.right)/2,d=(a.top+a.bottom)/2,u=o&&c.animateScale,f=u?0:this.innerRadius,m=u?0:this.outerRadius,{sharedOptions:x,includeOptions:p}=this._getSharedOptions(e,s);let g=this._getRotation(),_;for(_=0;_<e;++_)g+=this._circumference(_,o);for(_=e;_<e+n;++_){const v=this._circumference(_,o),y=t[_],b={x:h+this.offsetX,y:d+this.offsetY,startAngle:g,endAngle:g+v,circumference:v,outerRadius:m,innerRadius:f};p&&(b.options=x||this.resolveDataElementOptions(_,y.active?"active":s)),g+=v,this.updateElement(y,_,b,s)}}calculateTotal(){const t=this._cachedMeta,e=t.data;let n=0,s;for(s=0;s<e.length;s++){const o=t._parsed[s];o!==null&&!isNaN(o)&&this.chart.getDataVisibility(s)&&!e[s].hidden&&(n+=Math.abs(o))}return n}calculateCircumference(t){const e=this._cachedMeta.total;return e>0&&!isNaN(t)?_e*(Math.abs(t)/e):0}getLabelAndValue(t){const e=this._cachedMeta,n=this.chart,s=n.data.labels||[],o=Ko(e._parsed[t],n.options.locale);return{label:s[t]||"",value:o}}getMaxBorderWidth(t){let e=0;const n=this.chart;let s,o,r,a,l;if(!t){for(s=0,o=n.data.datasets.length;s<o;++s)if(n.isDatasetVisible(s)){r=n.getDatasetMeta(s),t=r.data,a=r.controller;break}}if(!t)return 0;for(s=0,o=t.length;s<o;++s)l=a.resolveDataElementOptions(s),l.borderAlign!=="inner"&&(e=Math.max(e,l.borderWidth||0,l.hoverBorderWidth||0));return e}getMaxOffset(t){let e=0;for(let n=0,s=t.length;n<s;++n){const o=this.resolveDataElementOptions(n);e=Math.max(e,o.offset||0,o.hoverOffset||0)}return e}_getRingWeightOffset(t){let e=0;for(let n=0;n<t;++n)this.chart.isDatasetVisible(n)&&(e+=this._getRingWeight(n));return e}_getRingWeight(t){return Math.max(kt(this.chart.data.datasets[t].weight,1),0)}_getVisibleDatasetWeightTotal(){return this._getRingWeightOffset(this.chart.data.datasets.length)||1}}class xT extends Oi{static id="line";static defaults={datasetElementType:"line",dataElementType:"point",showLine:!0,spanGaps:!1};static overrides={scales:{_index_:{type:"category"},_value_:{type:"linear"}}};initialize(){this.enableOptionSharing=!0,this.supportsDecimation=!0,super.initialize()}update(t){const e=this._cachedMeta,{dataset:n,data:s=[],_dataset:o}=e,r=this.chart._animationsDisabled;let{start:a,count:l}=Rp(e,s,r);this._drawStart=a,this._drawCount=l,Pp(e)&&(a=0,l=s.length),n._chart=this.chart,n._datasetIndex=this.index,n._decimated=!!o._decimated,n.points=s;const c=this.resolveDatasetElementOptions(t);this.options.showLine||(c.borderWidth=0),c.segment=this.options.segment,this.updateElement(n,void 0,{animated:!r,options:c},t),this.updateElements(s,a,l,t)}updateElements(t,e,n,s){const o=s==="reset",{iScale:r,vScale:a,_stacked:l,_dataset:c}=this._cachedMeta,{sharedOptions:h,includeOptions:d}=this._getSharedOptions(e,s),u=r.axis,f=a.axis,{spanGaps:m,segment:x}=this.options,p=$s(m)?m:Number.POSITIVE_INFINITY,g=this.chart._animationsDisabled||o||s==="none",_=e+n,v=t.length;let y=e>0&&this.getParsed(e-1);for(let b=0;b<v;++b){const w=t[b],T=g?w:{};if(b<e||b>=_){T.skip=!0;continue}const P=this.getParsed(b),M=Yt(P[f]),E=T[u]=r.getPixelForValue(P[u],b),R=T[f]=o||M?a.getBasePixel():a.getPixelForValue(l?this.applyStack(a,P,l):P[f],b);T.skip=isNaN(E)||isNaN(R)||M,T.stop=b>0&&Math.abs(P[u]-y[u])>p,x&&(T.parsed=P,T.raw=c.data[b]),d&&(T.options=h||this.resolveDataElementOptions(b,w.active?"active":s)),g||this.updateElement(w,b,T,s),y=P}}getMaxOverflow(){const t=this._cachedMeta,e=t.dataset,n=e.options&&e.options.borderWidth||0,s=t.data||[];if(!s.length)return n;const o=s[0].size(this.resolveDataElementOptions(0)),r=s[s.length-1].size(this.resolveDataElementOptions(s.length-1));return Math.max(n,o,r)/2}draw(){const t=this._cachedMeta;t.dataset.updateControlPoints(this.chart.chartArea,t.iScale.axis),super.draw()}}class jp extends Oi{static id="polarArea";static defaults={dataElementType:"arc",animation:{animateRotate:!0,animateScale:!0},animations:{numbers:{type:"number",properties:["x","y","startAngle","endAngle","innerRadius","outerRadius"]}},indexAxis:"r",startAngle:0};static overrides={aspectRatio:1,plugins:{legend:{labels:{generateLabels(t){const e=t.data;if(e.labels.length&&e.datasets.length){const{labels:{pointStyle:n,color:s}}=t.legend.options;return e.labels.map((o,r)=>{const l=t.getDatasetMeta(0).controller.getStyle(r);return{text:o,fillStyle:l.backgroundColor,strokeStyle:l.borderColor,fontColor:s,lineWidth:l.borderWidth,pointStyle:n,hidden:!t.getDataVisibility(r),index:r}})}return[]}},onClick(t,e,n){n.chart.toggleDataVisibility(e.index),n.chart.update()}}},scales:{r:{type:"radialLinear",angleLines:{display:!1},beginAtZero:!0,grid:{circular:!0},pointLabels:{display:!1},startAngle:0}}};constructor(t,e){super(t,e),this.innerRadius=void 0,this.outerRadius=void 0}getLabelAndValue(t){const e=this._cachedMeta,n=this.chart,s=n.data.labels||[],o=Ko(e._parsed[t].r,n.options.locale);return{label:s[t]||"",value:o}}parseObjectData(t,e,n,s){return Bp.bind(this)(t,e,n,s)}update(t){const e=this._cachedMeta.data;this._updateRadius(),this.updateElements(e,0,e.length,t)}getMinMax(){const t=this._cachedMeta,e={min:Number.POSITIVE_INFINITY,max:Number.NEGATIVE_INFINITY};return t.data.forEach((n,s)=>{const o=this.getParsed(s).r;!isNaN(o)&&this.chart.getDataVisibility(s)&&(o<e.min&&(e.min=o),o>e.max&&(e.max=o))}),e}_updateRadius(){const t=this.chart,e=t.chartArea,n=t.options,s=Math.min(e.right-e.left,e.bottom-e.top),o=Math.max(s/2,0),r=Math.max(n.cutoutPercentage?o/100*n.cutoutPercentage:1,0),a=(o-r)/t.getVisibleDatasetCount();this.outerRadius=o-a*this.index,this.innerRadius=this.outerRadius-a}updateElements(t,e,n,s){const o=s==="reset",r=this.chart,l=r.options.animation,c=this._cachedMeta.rScale,h=c.xCenter,d=c.yCenter,u=c.getIndexAngle(0)-.5*ee;let f=u,m;const x=360/this.countVisibleElements();for(m=0;m<e;++m)f+=this._computeAngle(m,s,x);for(m=e;m<e+n;m++){const p=t[m];let g=f,_=f+this._computeAngle(m,s,x),v=r.getDataVisibility(m)?c.getDistanceFromCenterForValue(this.getParsed(m).r):0;f=_,o&&(l.animateScale&&(v=0),l.animateRotate&&(g=_=u));const y={x:h,y:d,innerRadius:0,outerRadius:v,startAngle:g,endAngle:_,options:this.resolveDataElementOptions(m,p.active?"active":s)};this.updateElement(p,m,y,s)}}countVisibleElements(){const t=this._cachedMeta;let e=0;return t.data.forEach((n,s)=>{!isNaN(this.getParsed(s).r)&&this.chart.getDataVisibility(s)&&e++}),e}_computeAngle(t,e,n){return this.chart.getDataVisibility(t)?Cn(this.resolveDataElementOptions(t,e).angle||n):0}}class _T extends ph{static id="pie";static defaults={cutout:0,rotation:0,circumference:360,radius:"100%"}}class vT extends Oi{static id="radar";static defaults={datasetElementType:"line",dataElementType:"point",indexAxis:"r",showLine:!0,elements:{line:{fill:"start"}}};static overrides={aspectRatio:1,scales:{r:{type:"radialLinear"}}};getLabelAndValue(t){const e=this._cachedMeta.vScale,n=this.getParsed(t);return{label:e.getLabels()[t],value:""+e.getLabelForValue(n[e.axis])}}parseObjectData(t,e,n,s){return Bp.bind(this)(t,e,n,s)}update(t){const e=this._cachedMeta,n=e.dataset,s=e.data||[],o=e.iScale.getLabels();if(n.points=s,t!=="resize"){const r=this.resolveDatasetElementOptions(t);this.options.showLine||(r.borderWidth=0);const a={_loop:!0,_fullLoop:o.length===s.length,options:r};this.updateElement(n,void 0,a,t)}this.updateElements(s,0,s.length,t)}updateElements(t,e,n,s){const o=this._cachedMeta.rScale,r=s==="reset";for(let a=e;a<e+n;a++){const l=t[a],c=this.resolveDataElementOptions(a,l.active?"active":s),h=o.getPointPositionForValue(a,this.getParsed(a).r),d=r?o.xCenter:h.x,u=r?o.yCenter:h.y,f={x:d,y:u,angle:h.angle,skip:isNaN(d)||isNaN(u),options:c};this.updateElement(l,a,f,s)}}}class yT extends Oi{static id="scatter";static defaults={datasetElementType:!1,dataElementType:"point",showLine:!1,fill:!1};static overrides={interaction:{mode:"point"},scales:{x:{type:"linear"},y:{type:"linear"}}};getLabelAndValue(t){const e=this._cachedMeta,n=this.chart.data.labels||[],{xScale:s,yScale:o}=e,r=this.getParsed(t),a=s.getLabelForValue(r.x),l=o.getLabelForValue(r.y);return{label:n[t]||"",value:"("+a+", "+l+")"}}update(t){const e=this._cachedMeta,{data:n=[]}=e,s=this.chart._animationsDisabled;let{start:o,count:r}=Rp(e,n,s);if(this._drawStart=o,this._drawCount=r,Pp(e)&&(o=0,r=n.length),this.options.showLine){this.datasetElementType||this.addElements();const{dataset:a,_dataset:l}=e;a._chart=this.chart,a._datasetIndex=this.index,a._decimated=!!l._decimated,a.points=n;const c=this.resolveDatasetElementOptions(t);c.segment=this.options.segment,this.updateElement(a,void 0,{animated:!s,options:c},t)}else this.datasetElementType&&(delete e.dataset,this.datasetElementType=!1);this.updateElements(n,o,r,t)}addElements(){const{showLine:t}=this.options;!this.datasetElementType&&t&&(this.datasetElementType=this.chart.registry.getElement("line")),super.addElements()}updateElements(t,e,n,s){const o=s==="reset",{iScale:r,vScale:a,_stacked:l,_dataset:c}=this._cachedMeta,h=this.resolveDataElementOptions(e,s),d=this.getSharedOptions(h),u=this.includeOptions(s,d),f=r.axis,m=a.axis,{spanGaps:x,segment:p}=this.options,g=$s(x)?x:Number.POSITIVE_INFINITY,_=this.chart._animationsDisabled||o||s==="none";let v=e>0&&this.getParsed(e-1);for(let y=e;y<e+n;++y){const b=t[y],w=this.getParsed(y),T=_?b:{},P=Yt(w[m]),M=T[f]=r.getPixelForValue(w[f],y),E=T[m]=o||P?a.getBasePixel():a.getPixelForValue(l?this.applyStack(a,w,l):w[m],y);T.skip=isNaN(M)||isNaN(E)||P,T.stop=y>0&&Math.abs(w[f]-v[f])>g,p&&(T.parsed=w,T.raw=c.data[y]),u&&(T.options=d||this.resolveDataElementOptions(y,b.active?"active":s)),_||this.updateElement(b,y,T,s),v=w}this.updateSharedOptions(d,s,h)}getMaxOverflow(){const t=this._cachedMeta,e=t.data||[];if(!this.options.showLine){let a=0;for(let l=e.length-1;l>=0;--l)a=Math.max(a,e[l].size(this.resolveDataElementOptions(l))/2);return a>0&&a}const n=t.dataset,s=n.options&&n.options.borderWidth||0;if(!e.length)return s;const o=e[0].size(this.resolveDataElementOptions(0)),r=e[e.length-1].size(this.resolveDataElementOptions(e.length-1));return Math.max(s,o,r)/2}}var bT=Object.freeze({__proto__:null,BarController:pT,BubbleController:mT,DoughnutController:ph,LineController:xT,PieController:_T,PolarAreaController:jp,RadarController:vT,ScatterController:yT});function Yi(){throw new Error("This method is not implemented: Check that a complete date adapter is provided.")}class mh{static override(t){Object.assign(mh.prototype,t)}options;constructor(t){this.options=t||{}}init(){}formats(){return Yi()}parse(){return Yi()}format(){return Yi()}add(){return Yi()}diff(){return Yi()}startOf(){return Yi()}endOf(){return Yi()}}var MT={_date:mh};function ST(i,t,e,n){const{controller:s,data:o,_sorted:r}=i,a=s._cachedMeta.iScale,l=i.dataset&&i.dataset.options?i.dataset.options.spanGaps:null;if(a&&t===a.axis&&t!=="r"&&r&&o.length){const c=a._reversePixels?zw:hi;if(n){if(s._sharedOptions){const h=o[0],d=typeof h.getRange=="function"&&h.getRange(t);if(d){const u=c(o,t,e-d),f=c(o,t,e+d);return{lo:u.lo,hi:f.hi}}}}else{const h=c(o,t,e);if(l){const{vScale:d}=s._cachedMeta,{_parsed:u}=i,f=u.slice(0,h.lo+1).reverse().findIndex(x=>!Yt(x[d.axis]));h.lo-=Math.max(0,f);const m=u.slice(h.hi).findIndex(x=>!Yt(x[d.axis]));h.hi+=Math.max(0,m)}return h}}return{lo:0,hi:o.length-1}}function Ma(i,t,e,n,s){const o=i.getSortedVisibleDatasetMetas(),r=e[t];for(let a=0,l=o.length;a<l;++a){const{index:c,data:h}=o[a],{lo:d,hi:u}=ST(o[a],t,r,s);for(let f=d;f<=u;++f){const m=h[f];m.skip||n(m,c,f)}}}function wT(i){const t=i.indexOf("x")!==-1,e=i.indexOf("y")!==-1;return function(n,s){const o=t?Math.abs(n.x-s.x):0,r=e?Math.abs(n.y-s.y):0;return Math.sqrt(Math.pow(o,2)+Math.pow(r,2))}}function Sl(i,t,e,n,s){const o=[];return!s&&!i.isPointInArea(t)||Ma(i,e,t,function(a,l,c){!s&&!di(a,i.chartArea,0)||a.inRange(t.x,t.y,n)&&o.push({element:a,datasetIndex:l,index:c})},!0),o}function ET(i,t,e,n){let s=[];function o(r,a,l){const{startAngle:c,endAngle:h}=r.getProps(["startAngle","endAngle"],n),{angle:d}=wp(r,{x:t.x,y:t.y});Ho(d,c,h)&&s.push({element:r,datasetIndex:a,index:l})}return Ma(i,e,t,o),s}function TT(i,t,e,n,s,o){let r=[];const a=wT(e);let l=Number.POSITIVE_INFINITY;function c(h,d,u){const f=h.inRange(t.x,t.y,s);if(n&&!f)return;const m=h.getCenterPoint(s);if(!(!!o||i.isPointInArea(m))&&!f)return;const p=a(t,m);p<l?(r=[{element:h,datasetIndex:d,index:u}],l=p):p===l&&r.push({element:h,datasetIndex:d,index:u})}return Ma(i,e,t,c),r}function wl(i,t,e,n,s,o){return!o&&!i.isPointInArea(t)?[]:e==="r"&&!n?ET(i,t,e,s):TT(i,t,e,n,s,o)}function Ru(i,t,e,n,s){const o=[],r=e==="x"?"inXRange":"inYRange";let a=!1;return Ma(i,e,t,(l,c,h)=>{l[r]&&l[r](t[e],s)&&(o.push({element:l,datasetIndex:c,index:h}),a=a||l.inRange(t.x,t.y,s))}),n&&!a?[]:o}var AT={modes:{index(i,t,e,n){const s=Zi(t,i),o=e.axis||"x",r=e.includeInvisible||!1,a=e.intersect?Sl(i,s,o,n,r):wl(i,s,o,!1,n,r),l=[];return a.length?(i.getSortedVisibleDatasetMetas().forEach(c=>{const h=a[0].index,d=c.data[h];d&&!d.skip&&l.push({element:d,datasetIndex:c.index,index:h})}),l):[]},dataset(i,t,e,n){const s=Zi(t,i),o=e.axis||"xy",r=e.includeInvisible||!1;let a=e.intersect?Sl(i,s,o,n,r):wl(i,s,o,!1,n,r);if(a.length>0){const l=a[0].datasetIndex,c=i.getDatasetMeta(l).data;a=[];for(let h=0;h<c.length;++h)a.push({element:c[h],datasetIndex:l,index:h})}return a},point(i,t,e,n){const s=Zi(t,i),o=e.axis||"xy",r=e.includeInvisible||!1;return Sl(i,s,o,n,r)},nearest(i,t,e,n){const s=Zi(t,i),o=e.axis||"xy",r=e.includeInvisible||!1;return wl(i,s,o,e.intersect,n,r)},x(i,t,e,n){const s=Zi(t,i);return Ru(i,s,"x",e.intersect,n)},y(i,t,e,n){const s=Zi(t,i);return Ru(i,s,"y",e.intersect,n)}}};const Kp=["left","top","right","bottom"];function mo(i,t){return i.filter(e=>e.pos===t)}function Pu(i,t){return i.filter(e=>Kp.indexOf(e.pos)===-1&&e.box.axis===t)}function go(i,t){return i.sort((e,n)=>{const s=t?n:e,o=t?e:n;return s.weight===o.weight?s.index-o.index:s.weight-o.weight})}function CT(i){const t=[];let e,n,s,o,r,a;for(e=0,n=(i||[]).length;e<n;++e)s=i[e],{position:o,options:{stack:r,stackWeight:a=1}}=s,t.push({index:e,box:s,pos:o,horizontal:s.isHorizontal(),weight:s.weight,stack:r&&o+r,stackWeight:a});return t}function RT(i){const t={};for(const e of i){const{stack:n,pos:s,stackWeight:o}=e;if(!n||!Kp.includes(s))continue;const r=t[n]||(t[n]={count:0,placed:0,weight:0,size:0});r.count++,r.weight+=o}return t}function PT(i,t){const e=RT(i),{vBoxMaxWidth:n,hBoxMaxHeight:s}=t;let o,r,a;for(o=0,r=i.length;o<r;++o){a=i[o];const{fullSize:l}=a.box,c=e[a.stack],h=c&&a.stackWeight/c.weight;a.horizontal?(a.width=h?h*n:l&&t.availableWidth,a.height=s):(a.width=n,a.height=h?h*s:l&&t.availableHeight)}return e}function LT(i){const t=CT(i),e=go(t.filter(c=>c.box.fullSize),!0),n=go(mo(t,"left"),!0),s=go(mo(t,"right")),o=go(mo(t,"top"),!0),r=go(mo(t,"bottom")),a=Pu(t,"x"),l=Pu(t,"y");return{fullSize:e,leftAndTop:n.concat(o),rightAndBottom:s.concat(l).concat(r).concat(a),chartArea:mo(t,"chartArea"),vertical:n.concat(s).concat(l),horizontal:o.concat(r).concat(a)}}function Lu(i,t,e,n){return Math.max(i[e],t[e])+Math.max(i[n],t[n])}function Zp(i,t){i.top=Math.max(i.top,t.top),i.left=Math.max(i.left,t.left),i.bottom=Math.max(i.bottom,t.bottom),i.right=Math.max(i.right,t.right)}function DT(i,t,e,n){const{pos:s,box:o}=e,r=i.maxPadding;if(!Kt(s)){e.size&&(i[s]-=e.size);const d=n[e.stack]||{size:0,count:1};d.size=Math.max(d.size,e.horizontal?o.height:o.width),e.size=d.size/d.count,i[s]+=e.size}o.getPadding&&Zp(r,o.getPadding());const a=Math.max(0,t.outerWidth-Lu(r,i,"left","right")),l=Math.max(0,t.outerHeight-Lu(r,i,"top","bottom")),c=a!==i.w,h=l!==i.h;return i.w=a,i.h=l,e.horizontal?{same:c,other:h}:{same:h,other:c}}function IT(i){const t=i.maxPadding;function e(n){const s=Math.max(t[n]-i[n],0);return i[n]+=s,s}i.y+=e("top"),i.x+=e("left"),e("right"),e("bottom")}function FT(i,t){const e=t.maxPadding;function n(s){const o={left:0,top:0,right:0,bottom:0};return s.forEach(r=>{o[r]=Math.max(t[r],e[r])}),o}return n(i?["left","right"]:["top","bottom"])}function wo(i,t,e,n){const s=[];let o,r,a,l,c,h;for(o=0,r=i.length,c=0;o<r;++o){a=i[o],l=a.box,l.update(a.width||t.w,a.height||t.h,FT(a.horizontal,t));const{same:d,other:u}=DT(t,e,a,n);c|=d&&s.length,h=h||u,l.fullSize||s.push(a)}return c&&wo(s,t,e,n)||h}function Fr(i,t,e,n,s){i.top=e,i.left=t,i.right=t+n,i.bottom=e+s,i.width=n,i.height=s}function Du(i,t,e,n){const s=e.padding;let{x:o,y:r}=t;for(const a of i){const l=a.box,c=n[a.stack]||{placed:0,weight:1},h=a.stackWeight/c.weight||1;if(a.horizontal){const d=t.w*h,u=c.size||l.height;Vo(c.start)&&(r=c.start),l.fullSize?Fr(l,s.left,r,e.outerWidth-s.right-s.left,u):Fr(l,t.left+c.placed,r,d,u),c.start=r,c.placed+=d,r=l.bottom}else{const d=t.h*h,u=c.size||l.width;Vo(c.start)&&(o=c.start),l.fullSize?Fr(l,o,s.top,u,e.outerHeight-s.bottom-s.top):Fr(l,o,t.top+c.placed,u,d),c.start=o,c.placed+=d,o=l.right}}t.x=o,t.y=r}var qe={addBox(i,t){i.boxes||(i.boxes=[]),t.fullSize=t.fullSize||!1,t.position=t.position||"top",t.weight=t.weight||0,t._layers=t._layers||function(){return[{z:0,draw(e){t.draw(e)}}]},i.boxes.push(t)},removeBox(i,t){const e=i.boxes?i.boxes.indexOf(t):-1;e!==-1&&i.boxes.splice(e,1)},configure(i,t,e){t.fullSize=e.fullSize,t.position=e.position,t.weight=e.weight},update(i,t,e,n){if(!i)return;const s=Xe(i.options.layout.padding),o=Math.max(t-s.width,0),r=Math.max(e-s.height,0),a=LT(i.boxes),l=a.vertical,c=a.horizontal;ce(i.boxes,x=>{typeof x.beforeLayout=="function"&&x.beforeLayout()});const h=l.reduce((x,p)=>p.box.options&&p.box.options.display===!1?x:x+1,0)||1,d=Object.freeze({outerWidth:t,outerHeight:e,padding:s,availableWidth:o,availableHeight:r,vBoxMaxWidth:o/2/h,hBoxMaxHeight:r/2}),u=Object.assign({},s);Zp(u,Xe(n));const f=Object.assign({maxPadding:u,w:o,h:r,x:s.left,y:s.top},s),m=PT(l.concat(c),d);wo(a.fullSize,f,d,m),wo(l,f,d,m),wo(c,f,d,m)&&wo(l,f,d,m),IT(f),Du(a.leftAndTop,f,d,m),f.x+=f.w,f.y+=f.h,Du(a.rightAndBottom,f,d,m),i.chartArea={left:f.left,top:f.top,right:f.left+f.w,bottom:f.top+f.h,height:f.h,width:f.w},ce(a.chartArea,x=>{const p=x.box;Object.assign(p,i.chartArea),p.update(f.w,f.h,{left:0,top:0,right:0,bottom:0})})}};class Jp{acquireContext(t,e){}releaseContext(t){return!1}addEventListener(t,e,n){}removeEventListener(t,e,n){}getDevicePixelRatio(){return 1}getMaximumSize(t,e,n,s){return e=Math.max(0,e||t.width),n=n||t.height,{width:e,height:Math.max(0,s?Math.floor(e/s):n)}}isAttached(t){return!0}updateConfig(t){}}class NT extends Jp{acquireContext(t){return t&&t.getContext&&t.getContext("2d")||null}updateConfig(t){t.options.animation=!1}}const jr="$chartjs",OT={touchstart:"mousedown",touchmove:"mousemove",touchend:"mouseup",pointerenter:"mouseenter",pointerdown:"mousedown",pointermove:"mousemove",pointerup:"mouseup",pointerleave:"mouseout",pointerout:"mouseout"},Iu=i=>i===null||i==="";function UT(i,t){const e=i.style,n=i.getAttribute("height"),s=i.getAttribute("width");if(i[jr]={initial:{height:n,width:s,style:{display:e.display,height:e.height,width:e.width}}},e.display=e.display||"block",e.boxSizing=e.boxSizing||"border-box",Iu(s)){const o=gu(i,"width");o!==void 0&&(i.width=o)}if(Iu(n))if(i.style.height==="")i.height=i.width/(t||2);else{const o=gu(i,"height");o!==void 0&&(i.height=o)}return i}const Qp=DE?{passive:!0}:!1;function BT(i,t,e){i&&i.addEventListener(t,e,Qp)}function zT(i,t,e){i&&i.canvas&&i.canvas.removeEventListener(t,e,Qp)}function kT(i,t){const e=OT[i.type]||i.type,{x:n,y:s}=Zi(i,t);return{type:e,chart:t,native:i,x:n!==void 0?n:null,y:s!==void 0?s:null}}function ha(i,t){for(const e of i)if(e===t||e.contains(t))return!0}function VT(i,t,e){const n=i.canvas,s=new MutationObserver(o=>{let r=!1;for(const a of o)r=r||ha(a.addedNodes,n),r=r&&!ha(a.removedNodes,n);r&&e()});return s.observe(document,{childList:!0,subtree:!0}),s}function HT(i,t,e){const n=i.canvas,s=new MutationObserver(o=>{let r=!1;for(const a of o)r=r||ha(a.removedNodes,n),r=r&&!ha(a.addedNodes,n);r&&e()});return s.observe(document,{childList:!0,subtree:!0}),s}const Wo=new Map;let Fu=0;function tm(){const i=window.devicePixelRatio;i!==Fu&&(Fu=i,Wo.forEach((t,e)=>{e.currentDevicePixelRatio!==i&&t()}))}function GT(i,t){Wo.size||window.addEventListener("resize",tm),Wo.set(i,t)}function WT(i){Wo.delete(i),Wo.size||window.removeEventListener("resize",tm)}function qT(i,t,e){const n=i.canvas,s=n&&fh(n);if(!s)return;const o=Cp((a,l)=>{const c=s.clientWidth;e(a,l),c<s.clientWidth&&e()},window),r=new ResizeObserver(a=>{const l=a[0],c=l.contentRect.width,h=l.contentRect.height;c===0&&h===0||o(c,h)});return r.observe(s),GT(i,o),r}function El(i,t,e){e&&e.disconnect(),t==="resize"&&WT(i)}function XT(i,t,e){const n=i.canvas,s=Cp(o=>{i.ctx!==null&&e(kT(o,i))},i);return BT(n,t,s),s}class $T extends Jp{acquireContext(t,e){const n=t&&t.getContext&&t.getContext("2d");return n&&n.canvas===t?(UT(t,e),n):null}releaseContext(t){const e=t.canvas;if(!e[jr])return!1;const n=e[jr].initial;["height","width"].forEach(o=>{const r=n[o];Yt(r)?e.removeAttribute(o):e.setAttribute(o,r)});const s=n.style||{};return Object.keys(s).forEach(o=>{e.style[o]=s[o]}),e.width=e.width,delete e[jr],!0}addEventListener(t,e,n){this.removeEventListener(t,e);const s=t.$proxies||(t.$proxies={}),r={attach:VT,detach:HT,resize:qT}[e]||XT;s[e]=r(t,e,n)}removeEventListener(t,e){const n=t.$proxies||(t.$proxies={}),s=n[e];if(!s)return;({attach:El,detach:El,resize:El}[e]||zT)(t,e,s),n[e]=void 0}getDevicePixelRatio(){return window.devicePixelRatio}getMaximumSize(t,e,n,s){return LE(t,e,n,s)}isAttached(t){const e=t&&fh(t);return!!(e&&e.isConnected)}}function YT(i){return!uh()||typeof OffscreenCanvas<"u"&&i instanceof OffscreenCanvas?NT:$T}class gi{static defaults={};static defaultRoutes=void 0;x;y;active=!1;options;$animations;tooltipPosition(t){const{x:e,y:n}=this.getProps(["x","y"],t);return{x:e,y:n}}hasValue(){return $s(this.x)&&$s(this.y)}getProps(t,e){const n=this.$animations;if(!e||!n)return this;const s={};return t.forEach(o=>{s[o]=n[o]&&n[o].active()?n[o]._to:this[o]}),s}}function jT(i,t){const e=i.options.ticks,n=KT(i),s=Math.min(e.maxTicksLimit||n,n),o=e.major.enabled?JT(t):[],r=o.length,a=o[0],l=o[r-1],c=[];if(r>s)return QT(t,c,o,r/s),c;const h=ZT(o,t,s);if(r>0){let d,u;const f=r>1?Math.round((l-a)/(r-1)):null;for(Nr(t,c,h,Yt(f)?0:a-f,a),d=0,u=r-1;d<u;d++)Nr(t,c,h,o[d],o[d+1]);return Nr(t,c,h,l,Yt(f)?t.length:l+f),c}return Nr(t,c,h),c}function KT(i){const t=i.options.offset,e=i._tickSize(),n=i._length/e+(t?0:1),s=i._maxLength/e;return Math.floor(Math.min(n,s))}function ZT(i,t,e){const n=t1(i),s=t.length/e;if(!n)return Math.max(s,1);const o=Fw(n);for(let r=0,a=o.length-1;r<a;r++){const l=o[r];if(l>s)return l}return Math.max(s,1)}function JT(i){const t=[];let e,n;for(e=0,n=i.length;e<n;e++)i[e].major&&t.push(e);return t}function QT(i,t,e,n){let s=0,o=e[0],r;for(n=Math.ceil(n),r=0;r<i.length;r++)r===o&&(t.push(i[r]),s++,o=e[s*n])}function Nr(i,t,e,n,s){const o=kt(n,0),r=Math.min(kt(s,i.length),i.length);let a=0,l,c,h;for(e=Math.ceil(e),s&&(l=s-n,e=l/Math.floor(l/e)),h=o;h<0;)a++,h=Math.round(o+a*e);for(c=Math.max(o,0);c<r;c++)c===h&&(t.push(i[c]),a++,h=Math.round(o+a*e))}function t1(i){const t=i.length;let e,n;if(t<2)return!1;for(n=i[0],e=1;e<t;++e)if(i[e]-i[e-1]!==n)return!1;return n}const e1=i=>i==="left"?"right":i==="right"?"left":i,Nu=(i,t,e)=>t==="top"||t==="left"?i[t]+e:i[t]-e,Ou=(i,t)=>Math.min(t||i,i);function Uu(i,t){const e=[],n=i.length/t,s=i.length;let o=0;for(;o<s;o+=n)e.push(i[Math.floor(o)]);return e}function n1(i,t,e){const n=i.ticks.length,s=Math.min(t,n-1),o=i._startPixel,r=i._endPixel,a=1e-6;let l=i.getPixelForTick(s),c;if(!(e&&(n===1?c=Math.max(l-o,r-l):t===0?c=(i.getPixelForTick(1)-l)/2:c=(l-i.getPixelForTick(s-1))/2,l+=s<t?c:-c,l<o-a||l>r+a)))return l}function i1(i,t){ce(i,e=>{const n=e.gc,s=n.length/2;let o;if(s>t){for(o=0;o<s;++o)delete e.data[n[o]];n.splice(0,s)}})}function xo(i){return i.drawTicks?i.tickLength:0}function Bu(i,t){if(!i.display)return 0;const e=De(i.font,t),n=Xe(i.padding);return(ve(i.text)?i.text.length:1)*e.lineHeight+n.height}function s1(i,t){return Ni(i,{scale:t,type:"scale"})}function o1(i,t,e){return Ni(i,{tick:e,index:t,type:"tick"})}function r1(i,t,e){let n=rh(i);return(e&&t!=="right"||!e&&t==="right")&&(n=e1(n)),n}function a1(i,t,e,n){const{top:s,left:o,bottom:r,right:a,chart:l}=i,{chartArea:c,scales:h}=l;let d=0,u,f,m;const x=r-s,p=a-o;if(i.isHorizontal()){if(f=He(n,o,a),Kt(e)){const g=Object.keys(e)[0],_=e[g];m=h[g].getPixelForValue(_)+x-t}else e==="center"?m=(c.bottom+c.top)/2+x-t:m=Nu(i,e,t);u=a-o}else{if(Kt(e)){const g=Object.keys(e)[0],_=e[g];f=h[g].getPixelForValue(_)-p+t}else e==="center"?f=(c.left+c.right)/2-p+t:f=Nu(i,e,t);m=He(n,r,s),d=e==="left"?-Ae:Ae}return{titleX:f,titleY:m,maxWidth:u,rotation:d}}class cs extends gi{constructor(t){super(),this.id=t.id,this.type=t.type,this.options=void 0,this.ctx=t.ctx,this.chart=t.chart,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.width=void 0,this.height=void 0,this._margins={left:0,right:0,top:0,bottom:0},this.maxWidth=void 0,this.maxHeight=void 0,this.paddingTop=void 0,this.paddingBottom=void 0,this.paddingLeft=void 0,this.paddingRight=void 0,this.axis=void 0,this.labelRotation=void 0,this.min=void 0,this.max=void 0,this._range=void 0,this.ticks=[],this._gridLineItems=null,this._labelItems=null,this._labelSizes=null,this._length=0,this._maxLength=0,this._longestTextCache={},this._startPixel=void 0,this._endPixel=void 0,this._reversePixels=!1,this._userMax=void 0,this._userMin=void 0,this._suggestedMax=void 0,this._suggestedMin=void 0,this._ticksLength=0,this._borderValue=0,this._cache={},this._dataLimitsCached=!1,this.$context=void 0}init(t){this.options=t.setContext(this.getContext()),this.axis=t.axis,this._userMin=this.parse(t.min),this._userMax=this.parse(t.max),this._suggestedMin=this.parse(t.suggestedMin),this._suggestedMax=this.parse(t.suggestedMax)}parse(t,e){return t}getUserBounds(){let{_userMin:t,_userMax:e,_suggestedMin:n,_suggestedMax:s}=this;return t=fn(t,Number.POSITIVE_INFINITY),e=fn(e,Number.NEGATIVE_INFINITY),n=fn(n,Number.POSITIVE_INFINITY),s=fn(s,Number.NEGATIVE_INFINITY),{min:fn(t,n),max:fn(e,s),minDefined:Ee(t),maxDefined:Ee(e)}}getMinMax(t){let{min:e,max:n,minDefined:s,maxDefined:o}=this.getUserBounds(),r;if(s&&o)return{min:e,max:n};const a=this.getMatchingVisibleMetas();for(let l=0,c=a.length;l<c;++l)r=a[l].controller.getMinMax(this,t),s||(e=Math.min(e,r.min)),o||(n=Math.max(n,r.max));return e=o&&e>n?n:e,n=s&&e>n?e:n,{min:fn(e,fn(n,e)),max:fn(n,fn(e,n))}}getPadding(){return{left:this.paddingLeft||0,top:this.paddingTop||0,right:this.paddingRight||0,bottom:this.paddingBottom||0}}getTicks(){return this.ticks}getLabels(){const t=this.chart.data;return this.options.labels||(this.isHorizontal()?t.xLabels:t.yLabels)||t.labels||[]}getLabelItems(t=this.chart.chartArea){return this._labelItems||(this._labelItems=this._computeLabelItems(t))}beforeLayout(){this._cache={},this._dataLimitsCached=!1}beforeUpdate(){ge(this.options.beforeUpdate,[this])}update(t,e,n){const{beginAtZero:s,grace:o,ticks:r}=this.options,a=r.sampleSize;this.beforeUpdate(),this.maxWidth=t,this.maxHeight=e,this._margins=n=Object.assign({left:0,right:0,top:0,bottom:0},n),this.ticks=null,this._labelSizes=null,this._gridLineItems=null,this._labelItems=null,this.beforeSetDimensions(),this.setDimensions(),this.afterSetDimensions(),this._maxLength=this.isHorizontal()?this.width+n.left+n.right:this.height+n.top+n.bottom,this._dataLimitsCached||(this.beforeDataLimits(),this.determineDataLimits(),this.afterDataLimits(),this._range=cE(this,o,s),this._dataLimitsCached=!0),this.beforeBuildTicks(),this.ticks=this.buildTicks()||[],this.afterBuildTicks();const l=a<this.ticks.length;this._convertTicksToLabels(l?Uu(this.ticks,a):this.ticks),this.configure(),this.beforeCalculateLabelRotation(),this.calculateLabelRotation(),this.afterCalculateLabelRotation(),r.display&&(r.autoSkip||r.source==="auto")&&(this.ticks=jT(this,this.ticks),this._labelSizes=null,this.afterAutoSkip()),l&&this._convertTicksToLabels(this.ticks),this.beforeFit(),this.fit(),this.afterFit(),this.afterUpdate()}configure(){let t=this.options.reverse,e,n;this.isHorizontal()?(e=this.left,n=this.right):(e=this.top,n=this.bottom,t=!t),this._startPixel=e,this._endPixel=n,this._reversePixels=t,this._length=n-e,this._alignToPixels=this.options.alignToPixels}afterUpdate(){ge(this.options.afterUpdate,[this])}beforeSetDimensions(){ge(this.options.beforeSetDimensions,[this])}setDimensions(){this.isHorizontal()?(this.width=this.maxWidth,this.left=0,this.right=this.width):(this.height=this.maxHeight,this.top=0,this.bottom=this.height),this.paddingLeft=0,this.paddingTop=0,this.paddingRight=0,this.paddingBottom=0}afterSetDimensions(){ge(this.options.afterSetDimensions,[this])}_callHooks(t){this.chart.notifyPlugins(t,this.getContext()),ge(this.options[t],[this])}beforeDataLimits(){this._callHooks("beforeDataLimits")}determineDataLimits(){}afterDataLimits(){this._callHooks("afterDataLimits")}beforeBuildTicks(){this._callHooks("beforeBuildTicks")}buildTicks(){return[]}afterBuildTicks(){this._callHooks("afterBuildTicks")}beforeTickToLabelConversion(){ge(this.options.beforeTickToLabelConversion,[this])}generateTickLabels(t){const e=this.options.ticks;let n,s,o;for(n=0,s=t.length;n<s;n++)o=t[n],o.label=ge(e.callback,[o.value,n,t],this)}afterTickToLabelConversion(){ge(this.options.afterTickToLabelConversion,[this])}beforeCalculateLabelRotation(){ge(this.options.beforeCalculateLabelRotation,[this])}calculateLabelRotation(){const t=this.options,e=t.ticks,n=Ou(this.ticks.length,t.ticks.maxTicksLimit),s=e.minRotation||0,o=e.maxRotation;let r=s,a,l,c;if(!this._isVisible()||!e.display||s>=o||n<=1||!this.isHorizontal()){this.labelRotation=s;return}const h=this._getLabelSizes(),d=h.widest.width,u=h.highest.height,f=Ue(this.chart.width-d,0,this.maxWidth);a=t.offset?this.maxWidth/n:f/(n-1),d+6>a&&(a=f/(n-(t.offset?.5:1)),l=this.maxHeight-xo(t.grid)-e.padding-Bu(t.title,this.chart.options.font),c=Math.sqrt(d*d+u*u),r=sh(Math.min(Math.asin(Ue((h.highest.height+6)/a,-1,1)),Math.asin(Ue(l/c,-1,1))-Math.asin(Ue(u/c,-1,1)))),r=Math.max(s,Math.min(o,r))),this.labelRotation=r}afterCalculateLabelRotation(){ge(this.options.afterCalculateLabelRotation,[this])}afterAutoSkip(){}beforeFit(){ge(this.options.beforeFit,[this])}fit(){const t={width:0,height:0},{chart:e,options:{ticks:n,title:s,grid:o}}=this,r=this._isVisible(),a=this.isHorizontal();if(r){const l=Bu(s,e.options.font);if(a?(t.width=this.maxWidth,t.height=xo(o)+l):(t.height=this.maxHeight,t.width=xo(o)+l),n.display&&this.ticks.length){const{first:c,last:h,widest:d,highest:u}=this._getLabelSizes(),f=n.padding*2,m=Cn(this.labelRotation),x=Math.cos(m),p=Math.sin(m);if(a){const g=n.mirror?0:p*d.width+x*u.height;t.height=Math.min(this.maxHeight,t.height+g+f)}else{const g=n.mirror?0:x*d.width+p*u.height;t.width=Math.min(this.maxWidth,t.width+g+f)}this._calculatePadding(c,h,p,x)}}this._handleMargins(),a?(this.width=this._length=e.width-this._margins.left-this._margins.right,this.height=t.height):(this.width=t.width,this.height=this._length=e.height-this._margins.top-this._margins.bottom)}_calculatePadding(t,e,n,s){const{ticks:{align:o,padding:r},position:a}=this.options,l=this.labelRotation!==0,c=a!=="top"&&this.axis==="x";if(this.isHorizontal()){const h=this.getPixelForTick(0)-this.left,d=this.right-this.getPixelForTick(this.ticks.length-1);let u=0,f=0;l?c?(u=s*t.width,f=n*e.height):(u=n*t.height,f=s*e.width):o==="start"?f=e.width:o==="end"?u=t.width:o!=="inner"&&(u=t.width/2,f=e.width/2),this.paddingLeft=Math.max((u-h+r)*this.width/(this.width-h),0),this.paddingRight=Math.max((f-d+r)*this.width/(this.width-d),0)}else{let h=e.height/2,d=t.height/2;o==="start"?(h=0,d=t.height):o==="end"&&(h=e.height,d=0),this.paddingTop=h+r,this.paddingBottom=d+r}}_handleMargins(){this._margins&&(this._margins.left=Math.max(this.paddingLeft,this._margins.left),this._margins.top=Math.max(this.paddingTop,this._margins.top),this._margins.right=Math.max(this.paddingRight,this._margins.right),this._margins.bottom=Math.max(this.paddingBottom,this._margins.bottom))}afterFit(){ge(this.options.afterFit,[this])}isHorizontal(){const{axis:t,position:e}=this.options;return e==="top"||e==="bottom"||t==="x"}isFullSize(){return this.options.fullSize}_convertTicksToLabels(t){this.beforeTickToLabelConversion(),this.generateTickLabels(t);let e,n;for(e=0,n=t.length;e<n;e++)Yt(t[e].label)&&(t.splice(e,1),n--,e--);this.afterTickToLabelConversion()}_getLabelSizes(){let t=this._labelSizes;if(!t){const e=this.options.ticks.sampleSize;let n=this.ticks;e<n.length&&(n=Uu(n,e)),this._labelSizes=t=this._computeLabelSizes(n,n.length,this.options.ticks.maxTicksLimit)}return t}_computeLabelSizes(t,e,n){const{ctx:s,_longestTextCache:o}=this,r=[],a=[],l=Math.floor(e/Ou(e,n));let c=0,h=0,d,u,f,m,x,p,g,_,v,y,b;for(d=0;d<e;d+=l){if(m=t[d].label,x=this._resolveTickFontOptions(d),s.font=p=x.string,g=o[p]=o[p]||{data:{},gc:[]},_=x.lineHeight,v=y=0,!Yt(m)&&!ve(m))v=la(s,g.data,g.gc,v,m),y=_;else if(ve(m))for(u=0,f=m.length;u<f;++u)b=m[u],!Yt(b)&&!ve(b)&&(v=la(s,g.data,g.gc,v,b),y+=_);r.push(v),a.push(y),c=Math.max(v,c),h=Math.max(y,h)}i1(o,e);const w=r.indexOf(c),T=a.indexOf(h),P=M=>({width:r[M]||0,height:a[M]||0});return{first:P(0),last:P(e-1),widest:P(w),highest:P(T),widths:r,heights:a}}getLabelForValue(t){return t}getPixelForValue(t,e){return NaN}getValueForPixel(t){}getPixelForTick(t){const e=this.ticks;return t<0||t>e.length-1?null:this.getPixelForValue(e[t].value)}getPixelForDecimal(t){this._reversePixels&&(t=1-t);const e=this._startPixel+t*this._length;return Bw(this._alignToPixels?$i(this.chart,e,0):e)}getDecimalForPixel(t){const e=(t-this._startPixel)/this._length;return this._reversePixels?1-e:e}getBasePixel(){return this.getPixelForValue(this.getBaseValue())}getBaseValue(){const{min:t,max:e}=this;return t<0&&e<0?e:t>0&&e>0?t:0}getContext(t){const e=this.ticks||[];if(t>=0&&t<e.length){const n=e[t];return n.$context||(n.$context=o1(this.getContext(),t,n))}return this.$context||(this.$context=s1(this.chart.getContext(),this))}_tickSize(){const t=this.options.ticks,e=Cn(this.labelRotation),n=Math.abs(Math.cos(e)),s=Math.abs(Math.sin(e)),o=this._getLabelSizes(),r=t.autoSkipPadding||0,a=o?o.widest.width+r:0,l=o?o.highest.height+r:0;return this.isHorizontal()?l*n>a*s?a/n:l/s:l*s<a*n?l/n:a/s}_isVisible(){const t=this.options.display;return t!=="auto"?!!t:this.getMatchingVisibleMetas().length>0}_computeGridLineItems(t){const e=this.axis,n=this.chart,s=this.options,{grid:o,position:r,border:a}=s,l=o.offset,c=this.isHorizontal(),d=this.ticks.length+(l?1:0),u=xo(o),f=[],m=a.setContext(this.getContext()),x=m.display?m.width:0,p=x/2,g=function(I){return $i(n,I,x)};let _,v,y,b,w,T,P,M,E,R,N,D;if(r==="top")_=g(this.bottom),T=this.bottom-u,M=_-p,R=g(t.top)+p,D=t.bottom;else if(r==="bottom")_=g(this.top),R=t.top,D=g(t.bottom)-p,T=_+p,M=this.top+u;else if(r==="left")_=g(this.right),w=this.right-u,P=_-p,E=g(t.left)+p,N=t.right;else if(r==="right")_=g(this.left),E=t.left,N=g(t.right)-p,w=_+p,P=this.left+u;else if(e==="x"){if(r==="center")_=g((t.top+t.bottom)/2+.5);else if(Kt(r)){const I=Object.keys(r)[0],z=r[I];_=g(this.chart.scales[I].getPixelForValue(z))}R=t.top,D=t.bottom,T=_+p,M=T+u}else if(e==="y"){if(r==="center")_=g((t.left+t.right)/2);else if(Kt(r)){const I=Object.keys(r)[0],z=r[I];_=g(this.chart.scales[I].getPixelForValue(z))}w=_-p,P=w-u,E=t.left,N=t.right}const O=kt(s.ticks.maxTicksLimit,d),F=Math.max(1,Math.ceil(d/O));for(v=0;v<d;v+=F){const I=this.getContext(v),z=o.setContext(I),W=a.setContext(I),j=z.lineWidth,tt=z.color,nt=W.dash||[],et=W.dashOffset,St=z.tickWidth,Xt=z.tickColor,ut=z.tickBorderDash||[],X=z.tickBorderDashOffset;y=n1(this,v,l),y!==void 0&&(b=$i(n,y,j),c?w=P=E=N=b:T=M=R=D=b,f.push({tx1:w,ty1:T,tx2:P,ty2:M,x1:E,y1:R,x2:N,y2:D,width:j,color:tt,borderDash:nt,borderDashOffset:et,tickWidth:St,tickColor:Xt,tickBorderDash:ut,tickBorderDashOffset:X}))}return this._ticksLength=d,this._borderValue=_,f}_computeLabelItems(t){const e=this.axis,n=this.options,{position:s,ticks:o}=n,r=this.isHorizontal(),a=this.ticks,{align:l,crossAlign:c,padding:h,mirror:d}=o,u=xo(n.grid),f=u+h,m=d?-h:f,x=-Cn(this.labelRotation),p=[];let g,_,v,y,b,w,T,P,M,E,R,N,D="middle";if(s==="top")w=this.bottom-m,T=this._getXAxisLabelAlignment();else if(s==="bottom")w=this.top+m,T=this._getXAxisLabelAlignment();else if(s==="left"){const F=this._getYAxisLabelAlignment(u);T=F.textAlign,b=F.x}else if(s==="right"){const F=this._getYAxisLabelAlignment(u);T=F.textAlign,b=F.x}else if(e==="x"){if(s==="center")w=(t.top+t.bottom)/2+f;else if(Kt(s)){const F=Object.keys(s)[0],I=s[F];w=this.chart.scales[F].getPixelForValue(I)+f}T=this._getXAxisLabelAlignment()}else if(e==="y"){if(s==="center")b=(t.left+t.right)/2-f;else if(Kt(s)){const F=Object.keys(s)[0],I=s[F];b=this.chart.scales[F].getPixelForValue(I)}T=this._getYAxisLabelAlignment(u).textAlign}e==="y"&&(l==="start"?D="top":l==="end"&&(D="bottom"));const O=this._getLabelSizes();for(g=0,_=a.length;g<_;++g){v=a[g],y=v.label;const F=o.setContext(this.getContext(g));P=this.getPixelForTick(g)+o.labelOffset,M=this._resolveTickFontOptions(g),E=M.lineHeight,R=ve(y)?y.length:1;const I=R/2,z=F.color,W=F.textStrokeColor,j=F.textStrokeWidth;let tt=T;r?(b=P,T==="inner"&&(g===_-1?tt=this.options.reverse?"left":"right":g===0?tt=this.options.reverse?"right":"left":tt="center"),s==="top"?c==="near"||x!==0?N=-R*E+E/2:c==="center"?N=-O.highest.height/2-I*E+E:N=-O.highest.height+E/2:c==="near"||x!==0?N=E/2:c==="center"?N=O.highest.height/2-I*E:N=O.highest.height-R*E,d&&(N*=-1),x!==0&&!F.showLabelBackdrop&&(b+=E/2*Math.sin(x))):(w=P,N=(1-R)*E/2);let nt;if(F.showLabelBackdrop){const et=Xe(F.backdropPadding),St=O.heights[g],Xt=O.widths[g];let ut=N-et.top,X=0-et.left;switch(D){case"middle":ut-=St/2;break;case"bottom":ut-=St;break}switch(T){case"center":X-=Xt/2;break;case"right":X-=Xt;break;case"inner":g===_-1?X-=Xt:g>0&&(X-=Xt/2);break}nt={left:X,top:ut,width:Xt+et.width,height:St+et.height,color:F.backdropColor}}p.push({label:y,font:M,textOffset:N,options:{rotation:x,color:z,strokeColor:W,strokeWidth:j,textAlign:tt,textBaseline:D,translation:[b,w],backdrop:nt}})}return p}_getXAxisLabelAlignment(){const{position:t,ticks:e}=this.options;if(-Cn(this.labelRotation))return t==="top"?"left":"right";let s="center";return e.align==="start"?s="left":e.align==="end"?s="right":e.align==="inner"&&(s="inner"),s}_getYAxisLabelAlignment(t){const{position:e,ticks:{crossAlign:n,mirror:s,padding:o}}=this.options,r=this._getLabelSizes(),a=t+o,l=r.widest.width;let c,h;return e==="left"?s?(h=this.right+o,n==="near"?c="left":n==="center"?(c="center",h+=l/2):(c="right",h+=l)):(h=this.right-a,n==="near"?c="right":n==="center"?(c="center",h-=l/2):(c="left",h=this.left)):e==="right"?s?(h=this.left+o,n==="near"?c="right":n==="center"?(c="center",h-=l/2):(c="left",h-=l)):(h=this.left+a,n==="near"?c="left":n==="center"?(c="center",h+=l/2):(c="right",h=this.right)):c="right",{textAlign:c,x:h}}_computeLabelArea(){if(this.options.ticks.mirror)return;const t=this.chart,e=this.options.position;if(e==="left"||e==="right")return{top:0,left:this.left,bottom:t.height,right:this.right};if(e==="top"||e==="bottom")return{top:this.top,left:0,bottom:this.bottom,right:t.width}}drawBackground(){const{ctx:t,options:{backgroundColor:e},left:n,top:s,width:o,height:r}=this;e&&(t.save(),t.fillStyle=e,t.fillRect(n,s,o,r),t.restore())}getLineWidthForValue(t){const e=this.options.grid;if(!this._isVisible()||!e.display)return 0;const s=this.ticks.findIndex(o=>o.value===t);return s>=0?e.setContext(this.getContext(s)).lineWidth:0}drawGrid(t){const e=this.options.grid,n=this.ctx,s=this._gridLineItems||(this._gridLineItems=this._computeGridLineItems(t));let o,r;const a=(l,c,h)=>{!h.width||!h.color||(n.save(),n.lineWidth=h.width,n.strokeStyle=h.color,n.setLineDash(h.borderDash||[]),n.lineDashOffset=h.borderDashOffset,n.beginPath(),n.moveTo(l.x,l.y),n.lineTo(c.x,c.y),n.stroke(),n.restore())};if(e.display)for(o=0,r=s.length;o<r;++o){const l=s[o];e.drawOnChartArea&&a({x:l.x1,y:l.y1},{x:l.x2,y:l.y2},l),e.drawTicks&&a({x:l.tx1,y:l.ty1},{x:l.tx2,y:l.ty2},{color:l.tickColor,width:l.tickWidth,borderDash:l.tickBorderDash,borderDashOffset:l.tickBorderDashOffset})}}drawBorder(){const{chart:t,ctx:e,options:{border:n,grid:s}}=this,o=n.setContext(this.getContext()),r=n.display?o.width:0;if(!r)return;const a=s.setContext(this.getContext(0)).lineWidth,l=this._borderValue;let c,h,d,u;this.isHorizontal()?(c=$i(t,this.left,r)-r/2,h=$i(t,this.right,a)+a/2,d=u=l):(d=$i(t,this.top,r)-r/2,u=$i(t,this.bottom,a)+a/2,c=h=l),e.save(),e.lineWidth=o.width,e.strokeStyle=o.color,e.beginPath(),e.moveTo(c,d),e.lineTo(h,u),e.stroke(),e.restore()}drawLabels(t){if(!this.options.ticks.display)return;const n=this.ctx,s=this._computeLabelArea();s&&va(n,s);const o=this.getLabelItems(t);for(const r of o){const a=r.options,l=r.font,c=r.label,h=r.textOffset;ls(n,c,0,h,l,a)}s&&ya(n)}drawTitle(){const{ctx:t,options:{position:e,title:n,reverse:s}}=this;if(!n.display)return;const o=De(n.font),r=Xe(n.padding),a=n.align;let l=o.lineHeight/2;e==="bottom"||e==="center"||Kt(e)?(l+=r.bottom,ve(n.text)&&(l+=o.lineHeight*(n.text.length-1))):l+=r.top;const{titleX:c,titleY:h,maxWidth:d,rotation:u}=a1(this,l,e,a);ls(t,n.text,0,0,o,{color:n.color,maxWidth:d,rotation:u,textAlign:r1(a,e,s),textBaseline:"middle",translation:[c,h]})}draw(t){this._isVisible()&&(this.drawBackground(),this.drawGrid(t),this.drawBorder(),this.drawTitle(),this.drawLabels(t))}_layers(){const t=this.options,e=t.ticks&&t.ticks.z||0,n=kt(t.grid&&t.grid.z,-1),s=kt(t.border&&t.border.z,0);return!this._isVisible()||this.draw!==cs.prototype.draw?[{z:e,draw:o=>{this.draw(o)}}]:[{z:n,draw:o=>{this.drawBackground(),this.drawGrid(o),this.drawTitle()}},{z:s,draw:()=>{this.drawBorder()}},{z:e,draw:o=>{this.drawLabels(o)}}]}getMatchingVisibleMetas(t){const e=this.chart.getSortedVisibleDatasetMetas(),n=this.axis+"AxisID",s=[];let o,r;for(o=0,r=e.length;o<r;++o){const a=e[o];a[n]===this.id&&(!t||a.type===t)&&s.push(a)}return s}_resolveTickFontOptions(t){const e=this.options.ticks.setContext(this.getContext(t));return De(e.font)}_maxDigits(){const t=this._resolveTickFontOptions(0).lineHeight;return(this.isHorizontal()?this.width:this.height)/t}}class Or{constructor(t,e,n){this.type=t,this.scope=e,this.override=n,this.items=Object.create(null)}isForType(t){return Object.prototype.isPrototypeOf.call(this.type.prototype,t.prototype)}register(t){const e=Object.getPrototypeOf(t);let n;h1(e)&&(n=this.register(e));const s=this.items,o=t.id,r=this.scope+"."+o;if(!o)throw new Error("class does not have id: "+t);return o in s||(s[o]=t,l1(t,r,n),this.override&&ye.override(t.id,t.overrides)),r}get(t){return this.items[t]}unregister(t){const e=this.items,n=t.id,s=this.scope;n in e&&delete e[n],s&&n in ye[s]&&(delete ye[s][n],this.override&&delete as[n])}}function l1(i,t,e){const n=ko(Object.create(null),[e?ye.get(e):{},ye.get(t),i.defaults]);ye.set(t,n),i.defaultRoutes&&c1(t,i.defaultRoutes),i.descriptors&&ye.describe(t,i.descriptors)}function c1(i,t){Object.keys(t).forEach(e=>{const n=e.split("."),s=n.pop(),o=[i].concat(n).join("."),r=t[e].split("."),a=r.pop(),l=r.join(".");ye.route(o,s,l,a)})}function h1(i){return"id"in i&&"defaults"in i}class d1{constructor(){this.controllers=new Or(Oi,"datasets",!0),this.elements=new Or(gi,"elements"),this.plugins=new Or(Object,"plugins"),this.scales=new Or(cs,"scales"),this._typedRegistries=[this.controllers,this.scales,this.elements]}add(...t){this._each("register",t)}remove(...t){this._each("unregister",t)}addControllers(...t){this._each("register",t,this.controllers)}addElements(...t){this._each("register",t,this.elements)}addPlugins(...t){this._each("register",t,this.plugins)}addScales(...t){this._each("register",t,this.scales)}getController(t){return this._get(t,this.controllers,"controller")}getElement(t){return this._get(t,this.elements,"element")}getPlugin(t){return this._get(t,this.plugins,"plugin")}getScale(t){return this._get(t,this.scales,"scale")}removeControllers(...t){this._each("unregister",t,this.controllers)}removeElements(...t){this._each("unregister",t,this.elements)}removePlugins(...t){this._each("unregister",t,this.plugins)}removeScales(...t){this._each("unregister",t,this.scales)}_each(t,e,n){[...e].forEach(s=>{const o=n||this._getRegistryForType(s);n||o.isForType(s)||o===this.plugins&&s.id?this._exec(t,o,s):ce(s,r=>{const a=n||this._getRegistryForType(r);this._exec(t,a,r)})})}_exec(t,e,n){const s=ih(t);ge(n["before"+s],[],n),e[t](n),ge(n["after"+s],[],n)}_getRegistryForType(t){for(let e=0;e<this._typedRegistries.length;e++){const n=this._typedRegistries[e];if(n.isForType(t))return n}return this.plugins}_get(t,e,n){const s=e.get(t);if(s===void 0)throw new Error('"'+t+'" is not a registered '+n+".");return s}}var Nn=new d1;class u1{constructor(){this._init=void 0}notify(t,e,n,s){if(e==="beforeInit"&&(this._init=this._createDescriptors(t,!0),this._notify(this._init,t,"install")),this._init===void 0)return;const o=s?this._descriptors(t).filter(s):this._descriptors(t),r=this._notify(o,t,e,n);return e==="afterDestroy"&&(this._notify(o,t,"stop"),this._notify(this._init,t,"uninstall"),this._init=void 0),r}_notify(t,e,n,s){s=s||{};for(const o of t){const r=o.plugin,a=r[n],l=[e,s,o.options];if(ge(a,l,r)===!1&&s.cancelable)return!1}return!0}invalidate(){Yt(this._cache)||(this._oldCache=this._cache,this._cache=void 0)}_descriptors(t){if(this._cache)return this._cache;const e=this._cache=this._createDescriptors(t);return this._notifyStateChanges(t),e}_createDescriptors(t,e){const n=t&&t.config,s=kt(n.options&&n.options.plugins,{}),o=f1(n);return s===!1&&!e?[]:m1(t,o,s,e)}_notifyStateChanges(t){const e=this._oldCache||[],n=this._cache,s=(o,r)=>o.filter(a=>!r.some(l=>a.plugin.id===l.plugin.id));this._notify(s(e,n),t,"stop"),this._notify(s(n,e),t,"start")}}function f1(i){const t={},e=[],n=Object.keys(Nn.plugins.items);for(let o=0;o<n.length;o++)e.push(Nn.getPlugin(n[o]));const s=i.plugins||[];for(let o=0;o<s.length;o++){const r=s[o];e.indexOf(r)===-1&&(e.push(r),t[r.id]=!0)}return{plugins:e,localIds:t}}function p1(i,t){return!t&&i===!1?null:i===!0?{}:i}function m1(i,{plugins:t,localIds:e},n,s){const o=[],r=i.getContext();for(const a of t){const l=a.id,c=p1(n[l],s);c!==null&&o.push({plugin:a,options:g1(i.config,{plugin:a,local:e[l]},c,r)})}return o}function g1(i,{plugin:t,local:e},n,s){const o=i.pluginScopeKeys(t),r=i.getOptionScopes(n,o);return e&&t.defaults&&r.push(t.defaults),i.createResolver(r,s,[""],{scriptable:!1,indexable:!1,allKeys:!0})}function Ac(i,t){const e=ye.datasets[i]||{};return((t.datasets||{})[i]||{}).indexAxis||t.indexAxis||e.indexAxis||"x"}function x1(i,t){let e=i;return i==="_index_"?e=t:i==="_value_"&&(e=t==="x"?"y":"x"),e}function _1(i,t){return i===t?"_index_":"_value_"}function zu(i){if(i==="x"||i==="y"||i==="r")return i}function v1(i){if(i==="top"||i==="bottom")return"x";if(i==="left"||i==="right")return"y"}function Cc(i,...t){if(zu(i))return i;for(const e of t){const n=e.axis||v1(e.position)||i.length>1&&zu(i[0].toLowerCase());if(n)return n}throw new Error(`Cannot determine type of '${i}' axis. Please provide 'axis' or 'position' option.`)}function ku(i,t,e){if(e[t+"AxisID"]===i)return{axis:t}}function y1(i,t){if(t.data&&t.data.datasets){const e=t.data.datasets.filter(n=>n.xAxisID===i||n.yAxisID===i);if(e.length)return ku(i,"x",e[0])||ku(i,"y",e[0])}return{}}function b1(i,t){const e=as[i.type]||{scales:{}},n=t.scales||{},s=Ac(i.type,t),o=Object.create(null);return Object.keys(n).forEach(r=>{const a=n[r];if(!Kt(a))return console.error(`Invalid scale configuration for scale: ${r}`);if(a._proxy)return console.warn(`Ignoring resolver passed as options for scale: ${r}`);const l=Cc(r,a,y1(r,i),ye.scales[a.type]),c=_1(l,s),h=e.scales||{};o[r]=Po(Object.create(null),[{axis:l},a,h[l],h[c]])}),i.data.datasets.forEach(r=>{const a=r.type||i.type,l=r.indexAxis||Ac(a,t),h=(as[a]||{}).scales||{};Object.keys(h).forEach(d=>{const u=x1(d,l),f=r[u+"AxisID"]||u;o[f]=o[f]||Object.create(null),Po(o[f],[{axis:u},n[f],h[d]])})}),Object.keys(o).forEach(r=>{const a=o[r];Po(a,[ye.scales[a.type],ye.scale])}),o}function em(i){const t=i.options||(i.options={});t.plugins=kt(t.plugins,{}),t.scales=b1(i,t)}function nm(i){return i=i||{},i.datasets=i.datasets||[],i.labels=i.labels||[],i}function M1(i){return i=i||{},i.data=nm(i.data),em(i),i}const Vu=new Map,im=new Set;function Ur(i,t){let e=Vu.get(i);return e||(e=t(),Vu.set(i,e),im.add(e)),e}const _o=(i,t,e)=>{const n=Ii(t,e);n!==void 0&&i.add(n)};class S1{constructor(t){this._config=M1(t),this._scopeCache=new Map,this._resolverCache=new Map}get platform(){return this._config.platform}get type(){return this._config.type}set type(t){this._config.type=t}get data(){return this._config.data}set data(t){this._config.data=nm(t)}get options(){return this._config.options}set options(t){this._config.options=t}get plugins(){return this._config.plugins}update(){const t=this._config;this.clearCache(),em(t)}clearCache(){this._scopeCache.clear(),this._resolverCache.clear()}datasetScopeKeys(t){return Ur(t,()=>[[`datasets.${t}`,""]])}datasetAnimationScopeKeys(t,e){return Ur(`${t}.transition.${e}`,()=>[[`datasets.${t}.transitions.${e}`,`transitions.${e}`],[`datasets.${t}`,""]])}datasetElementScopeKeys(t,e){return Ur(`${t}-${e}`,()=>[[`datasets.${t}.elements.${e}`,`datasets.${t}`,`elements.${e}`,""]])}pluginScopeKeys(t){const e=t.id,n=this.type;return Ur(`${n}-plugin-${e}`,()=>[[`plugins.${e}`,...t.additionalOptionScopes||[]]])}_cachedScopes(t,e){const n=this._scopeCache;let s=n.get(t);return(!s||e)&&(s=new Map,n.set(t,s)),s}getOptionScopes(t,e,n){const{options:s,type:o}=this,r=this._cachedScopes(t,n),a=r.get(e);if(a)return a;const l=new Set;e.forEach(h=>{t&&(l.add(t),h.forEach(d=>_o(l,t,d))),h.forEach(d=>_o(l,s,d)),h.forEach(d=>_o(l,as[o]||{},d)),h.forEach(d=>_o(l,ye,d)),h.forEach(d=>_o(l,Ec,d))});const c=Array.from(l);return c.length===0&&c.push(Object.create(null)),im.has(e)&&r.set(e,c),c}chartOptionScopes(){const{options:t,type:e}=this;return[t,as[e]||{},ye.datasets[e]||{},{type:e},ye,Ec]}resolveNamedOptions(t,e,n,s=[""]){const o={$shared:!0},{resolver:r,subPrefixes:a}=Hu(this._resolverCache,t,s);let l=r;if(E1(r,e)){o.$shared=!1,n=Fi(n)?n():n;const c=this.createResolver(t,n,a);l=Ys(r,n,c)}for(const c of e)o[c]=l[c];return o}createResolver(t,e,n=[""],s){const{resolver:o}=Hu(this._resolverCache,t,n);return Kt(e)?Ys(o,e,void 0,s):o}}function Hu(i,t,e){let n=i.get(t);n||(n=new Map,i.set(t,n));const s=e.join();let o=n.get(s);return o||(o={resolver:ch(t,e),subPrefixes:e.filter(a=>!a.toLowerCase().includes("hover"))},n.set(s,o)),o}const w1=i=>Kt(i)&&Object.getOwnPropertyNames(i).some(t=>Fi(i[t]));function E1(i,t){const{isScriptable:e,isIndexable:n}=Fp(i);for(const s of t){const o=e(s),r=n(s),a=(r||o)&&i[s];if(o&&(Fi(a)||w1(a))||r&&ve(a))return!0}return!1}var T1="4.5.1";const A1=["top","bottom","left","right","chartArea"];function Gu(i,t){return i==="top"||i==="bottom"||A1.indexOf(i)===-1&&t==="x"}function Wu(i,t){return function(e,n){return e[i]===n[i]?e[t]-n[t]:e[i]-n[i]}}function qu(i){const t=i.chart,e=t.options.animation;t.notifyPlugins("afterRender"),ge(e&&e.onComplete,[i],t)}function C1(i){const t=i.chart,e=t.options.animation;ge(e&&e.onProgress,[i],t)}function sm(i){return uh()&&typeof i=="string"?i=document.getElementById(i):i&&i.length&&(i=i[0]),i&&i.canvas&&(i=i.canvas),i}const Kr={},Xu=i=>{const t=sm(i);return Object.values(Kr).filter(e=>e.canvas===t).pop()};function R1(i,t,e){const n=Object.keys(i);for(const s of n){const o=+s;if(o>=t){const r=i[s];delete i[s],(e>0||o>t)&&(i[o+e]=r)}}}function P1(i,t,e,n){return!e||i.type==="mouseout"?null:n?t:i}class gh{static defaults=ye;static instances=Kr;static overrides=as;static registry=Nn;static version=T1;static getChart=Xu;static register(...t){Nn.add(...t),$u()}static unregister(...t){Nn.remove(...t),$u()}constructor(t,e){const n=this.config=new S1(e),s=sm(t),o=Xu(s);if(o)throw new Error("Canvas is already in use. Chart with ID '"+o.id+"' must be destroyed before the canvas with ID '"+o.canvas.id+"' can be reused.");const r=n.createResolver(n.chartOptionScopes(),this.getContext());this.platform=new(n.platform||YT(s)),this.platform.updateConfig(n);const a=this.platform.acquireContext(s,r.aspectRatio),l=a&&a.canvas,c=l&&l.height,h=l&&l.width;if(this.id=Ew(),this.ctx=a,this.canvas=l,this.width=h,this.height=c,this._options=r,this._aspectRatio=this.aspectRatio,this._layers=[],this._metasets=[],this._stacks=void 0,this.boxes=[],this.currentDevicePixelRatio=void 0,this.chartArea=void 0,this._active=[],this._lastEvent=void 0,this._listeners={},this._responsiveListeners=void 0,this._sortedMetasets=[],this.scales={},this._plugins=new u1,this.$proxies={},this._hiddenIndices={},this.attached=!1,this._animationsDisabled=void 0,this.$context=void 0,this._doResize=Hw(d=>this.update(d),r.resizeDelay||0),this._dataChanges=[],Kr[this.id]=this,!a||!l){console.error("Failed to create chart: can't acquire context from the given item");return}si.listen(this,"complete",qu),si.listen(this,"progress",C1),this._initialize(),this.attached&&this.update()}get aspectRatio(){const{options:{aspectRatio:t,maintainAspectRatio:e},width:n,height:s,_aspectRatio:o}=this;return Yt(t)?e&&o?o:s?n/s:null:t}get data(){return this.config.data}set data(t){this.config.data=t}get options(){return this._options}set options(t){this.config.options=t}get registry(){return Nn}_initialize(){return this.notifyPlugins("beforeInit"),this.options.responsive?this.resize():mu(this,this.options.devicePixelRatio),this.bindEvents(),this.notifyPlugins("afterInit"),this}clear(){return uu(this.canvas,this.ctx),this}stop(){return si.stop(this),this}resize(t,e){si.running(this)?this._resizeBeforeDraw={width:t,height:e}:this._resize(t,e)}_resize(t,e){const n=this.options,s=this.canvas,o=n.maintainAspectRatio&&this.aspectRatio,r=this.platform.getMaximumSize(s,t,e,o),a=n.devicePixelRatio||this.platform.getDevicePixelRatio(),l=this.width?"resize":"attach";this.width=r.width,this.height=r.height,this._aspectRatio=this.aspectRatio,mu(this,a,!0)&&(this.notifyPlugins("resize",{size:r}),ge(n.onResize,[this,r],this),this.attached&&this._doResize(l)&&this.render())}ensureScalesHaveIDs(){const e=this.options.scales||{};ce(e,(n,s)=>{n.id=s})}buildOrUpdateScales(){const t=this.options,e=t.scales,n=this.scales,s=Object.keys(n).reduce((r,a)=>(r[a]=!1,r),{});let o=[];e&&(o=o.concat(Object.keys(e).map(r=>{const a=e[r],l=Cc(r,a),c=l==="r",h=l==="x";return{options:a,dposition:c?"chartArea":h?"bottom":"left",dtype:c?"radialLinear":h?"category":"linear"}}))),ce(o,r=>{const a=r.options,l=a.id,c=Cc(l,a),h=kt(a.type,r.dtype);(a.position===void 0||Gu(a.position,c)!==Gu(r.dposition))&&(a.position=r.dposition),s[l]=!0;let d=null;if(l in n&&n[l].type===h)d=n[l];else{const u=Nn.getScale(h);d=new u({id:l,type:h,ctx:this.ctx,chart:this}),n[d.id]=d}d.init(a,t)}),ce(s,(r,a)=>{r||delete n[a]}),ce(n,r=>{qe.configure(this,r,r.options),qe.addBox(this,r)})}_updateMetasets(){const t=this._metasets,e=this.data.datasets.length,n=t.length;if(t.sort((s,o)=>s.index-o.index),n>e){for(let s=e;s<n;++s)this._destroyDatasetMeta(s);t.splice(e,n-e)}this._sortedMetasets=t.slice(0).sort(Wu("order","index"))}_removeUnreferencedMetasets(){const{_metasets:t,data:{datasets:e}}=this;t.length>e.length&&delete this._stacks,t.forEach((n,s)=>{e.filter(o=>o===n._dataset).length===0&&this._destroyDatasetMeta(s)})}buildOrUpdateControllers(){const t=[],e=this.data.datasets;let n,s;for(this._removeUnreferencedMetasets(),n=0,s=e.length;n<s;n++){const o=e[n];let r=this.getDatasetMeta(n);const a=o.type||this.config.type;if(r.type&&r.type!==a&&(this._destroyDatasetMeta(n),r=this.getDatasetMeta(n)),r.type=a,r.indexAxis=o.indexAxis||Ac(a,this.options),r.order=o.order||0,r.index=n,r.label=""+o.label,r.visible=this.isDatasetVisible(n),r.controller)r.controller.updateIndex(n),r.controller.linkScales();else{const l=Nn.getController(a),{datasetElementType:c,dataElementType:h}=ye.datasets[a];Object.assign(l,{dataElementType:Nn.getElement(h),datasetElementType:c&&Nn.getElement(c)}),r.controller=new l(this,n),t.push(r.controller)}}return this._updateMetasets(),t}_resetElements(){ce(this.data.datasets,(t,e)=>{this.getDatasetMeta(e).controller.reset()},this)}reset(){this._resetElements(),this.notifyPlugins("reset")}update(t){const e=this.config;e.update();const n=this._options=e.createResolver(e.chartOptionScopes(),this.getContext()),s=this._animationsDisabled=!n.animation;if(this._updateScales(),this._checkEventBindings(),this._updateHiddenIndices(),this._plugins.invalidate(),this.notifyPlugins("beforeUpdate",{mode:t,cancelable:!0})===!1)return;const o=this.buildOrUpdateControllers();this.notifyPlugins("beforeElementsUpdate");let r=0;for(let c=0,h=this.data.datasets.length;c<h;c++){const{controller:d}=this.getDatasetMeta(c),u=!s&&o.indexOf(d)===-1;d.buildOrUpdateElements(u),r=Math.max(+d.getMaxOverflow(),r)}r=this._minPadding=n.layout.autoPadding?r:0,this._updateLayout(r),s||ce(o,c=>{c.reset()}),this._updateDatasets(t),this.notifyPlugins("afterUpdate",{mode:t}),this._layers.sort(Wu("z","_idx"));const{_active:a,_lastEvent:l}=this;l?this._eventHandler(l,!0):a.length&&this._updateHoverStyles(a,a,!0),this.render()}_updateScales(){ce(this.scales,t=>{qe.removeBox(this,t)}),this.ensureScalesHaveIDs(),this.buildOrUpdateScales()}_checkEventBindings(){const t=this.options,e=new Set(Object.keys(this._listeners)),n=new Set(t.events);(!iu(e,n)||!!this._responsiveListeners!==t.responsive)&&(this.unbindEvents(),this.bindEvents())}_updateHiddenIndices(){const{_hiddenIndices:t}=this,e=this._getUniformDataChanges()||[];for(const{method:n,start:s,count:o}of e){const r=n==="_removeElements"?-o:o;R1(t,s,r)}}_getUniformDataChanges(){const t=this._dataChanges;if(!t||!t.length)return;this._dataChanges=[];const e=this.data.datasets.length,n=o=>new Set(t.filter(r=>r[0]===o).map((r,a)=>a+","+r.splice(1).join(","))),s=n(0);for(let o=1;o<e;o++)if(!iu(s,n(o)))return;return Array.from(s).map(o=>o.split(",")).map(o=>({method:o[1],start:+o[2],count:+o[3]}))}_updateLayout(t){if(this.notifyPlugins("beforeLayout",{cancelable:!0})===!1)return;qe.update(this,this.width,this.height,t);const e=this.chartArea,n=e.width<=0||e.height<=0;this._layers=[],ce(this.boxes,s=>{n&&s.position==="chartArea"||(s.configure&&s.configure(),this._layers.push(...s._layers()))},this),this._layers.forEach((s,o)=>{s._idx=o}),this.notifyPlugins("afterLayout")}_updateDatasets(t){if(this.notifyPlugins("beforeDatasetsUpdate",{mode:t,cancelable:!0})!==!1){for(let e=0,n=this.data.datasets.length;e<n;++e)this.getDatasetMeta(e).controller.configure();for(let e=0,n=this.data.datasets.length;e<n;++e)this._updateDataset(e,Fi(t)?t({datasetIndex:e}):t);this.notifyPlugins("afterDatasetsUpdate",{mode:t})}}_updateDataset(t,e){const n=this.getDatasetMeta(t),s={meta:n,index:t,mode:e,cancelable:!0};this.notifyPlugins("beforeDatasetUpdate",s)!==!1&&(n.controller._update(e),s.cancelable=!1,this.notifyPlugins("afterDatasetUpdate",s))}render(){this.notifyPlugins("beforeRender",{cancelable:!0})!==!1&&(si.has(this)?this.attached&&!si.running(this)&&si.start(this):(this.draw(),qu({chart:this})))}draw(){let t;if(this._resizeBeforeDraw){const{width:n,height:s}=this._resizeBeforeDraw;this._resizeBeforeDraw=null,this._resize(n,s)}if(this.clear(),this.width<=0||this.height<=0||this.notifyPlugins("beforeDraw",{cancelable:!0})===!1)return;const e=this._layers;for(t=0;t<e.length&&e[t].z<=0;++t)e[t].draw(this.chartArea);for(this._drawDatasets();t<e.length;++t)e[t].draw(this.chartArea);this.notifyPlugins("afterDraw")}_getSortedDatasetMetas(t){const e=this._sortedMetasets,n=[];let s,o;for(s=0,o=e.length;s<o;++s){const r=e[s];(!t||r.visible)&&n.push(r)}return n}getSortedVisibleDatasetMetas(){return this._getSortedDatasetMetas(!0)}_drawDatasets(){if(this.notifyPlugins("beforeDatasetsDraw",{cancelable:!0})===!1)return;const t=this.getSortedVisibleDatasetMetas();for(let e=t.length-1;e>=0;--e)this._drawDataset(t[e]);this.notifyPlugins("afterDatasetsDraw")}_drawDataset(t){const e=this.ctx,n={meta:t,index:t.index,cancelable:!0},s=qp(this,t);this.notifyPlugins("beforeDatasetDraw",n)!==!1&&(s&&va(e,s),t.controller.draw(),s&&ya(e),n.cancelable=!1,this.notifyPlugins("afterDatasetDraw",n))}isPointInArea(t){return di(t,this.chartArea,this._minPadding)}getElementsAtEventForMode(t,e,n,s){const o=AT.modes[e];return typeof o=="function"?o(this,t,n,s):[]}getDatasetMeta(t){const e=this.data.datasets[t],n=this._metasets;let s=n.filter(o=>o&&o._dataset===e).pop();return s||(s={type:null,data:[],dataset:null,controller:null,hidden:null,xAxisID:null,yAxisID:null,order:e&&e.order||0,index:t,_dataset:e,_parsed:[],_sorted:!1},n.push(s)),s}getContext(){return this.$context||(this.$context=Ni(null,{chart:this,type:"chart"}))}getVisibleDatasetCount(){return this.getSortedVisibleDatasetMetas().length}isDatasetVisible(t){const e=this.data.datasets[t];if(!e)return!1;const n=this.getDatasetMeta(t);return typeof n.hidden=="boolean"?!n.hidden:!e.hidden}setDatasetVisibility(t,e){const n=this.getDatasetMeta(t);n.hidden=!e}toggleDataVisibility(t){this._hiddenIndices[t]=!this._hiddenIndices[t]}getDataVisibility(t){return!this._hiddenIndices[t]}_updateVisibility(t,e,n){const s=n?"show":"hide",o=this.getDatasetMeta(t),r=o.controller._resolveAnimations(void 0,s);Vo(e)?(o.data[e].hidden=!n,this.update()):(this.setDatasetVisibility(t,n),r.update(o,{visible:n}),this.update(a=>a.datasetIndex===t?s:void 0))}hide(t,e){this._updateVisibility(t,e,!1)}show(t,e){this._updateVisibility(t,e,!0)}_destroyDatasetMeta(t){const e=this._metasets[t];e&&e.controller&&e.controller._destroy(),delete this._metasets[t]}_stop(){let t,e;for(this.stop(),si.remove(this),t=0,e=this.data.datasets.length;t<e;++t)this._destroyDatasetMeta(t)}destroy(){this.notifyPlugins("beforeDestroy");const{canvas:t,ctx:e}=this;this._stop(),this.config.clearCache(),t&&(this.unbindEvents(),uu(t,e),this.platform.releaseContext(e),this.canvas=null,this.ctx=null),delete Kr[this.id],this.notifyPlugins("afterDestroy")}toBase64Image(...t){return this.canvas.toDataURL(...t)}bindEvents(){this.bindUserEvents(),this.options.responsive?this.bindResponsiveEvents():this.attached=!0}bindUserEvents(){const t=this._listeners,e=this.platform,n=(o,r)=>{e.addEventListener(this,o,r),t[o]=r},s=(o,r,a)=>{o.offsetX=r,o.offsetY=a,this._eventHandler(o)};ce(this.options.events,o=>n(o,s))}bindResponsiveEvents(){this._responsiveListeners||(this._responsiveListeners={});const t=this._responsiveListeners,e=this.platform,n=(l,c)=>{e.addEventListener(this,l,c),t[l]=c},s=(l,c)=>{t[l]&&(e.removeEventListener(this,l,c),delete t[l])},o=(l,c)=>{this.canvas&&this.resize(l,c)};let r;const a=()=>{s("attach",a),this.attached=!0,this.resize(),n("resize",o),n("detach",r)};r=()=>{this.attached=!1,s("resize",o),this._stop(),this._resize(0,0),n("attach",a)},e.isAttached(this.canvas)?a():r()}unbindEvents(){ce(this._listeners,(t,e)=>{this.platform.removeEventListener(this,e,t)}),this._listeners={},ce(this._responsiveListeners,(t,e)=>{this.platform.removeEventListener(this,e,t)}),this._responsiveListeners=void 0}updateHoverStyle(t,e,n){const s=n?"set":"remove";let o,r,a,l;for(e==="dataset"&&(o=this.getDatasetMeta(t[0].datasetIndex),o.controller["_"+s+"DatasetHoverStyle"]()),a=0,l=t.length;a<l;++a){r=t[a];const c=r&&this.getDatasetMeta(r.datasetIndex).controller;c&&c[s+"HoverStyle"](r.element,r.datasetIndex,r.index)}}getActiveElements(){return this._active||[]}setActiveElements(t){const e=this._active||[],n=t.map(({datasetIndex:o,index:r})=>{const a=this.getDatasetMeta(o);if(!a)throw new Error("No dataset found at index "+o);return{datasetIndex:o,element:a.data[r],index:r}});!oa(n,e)&&(this._active=n,this._lastEvent=null,this._updateHoverStyles(n,e))}notifyPlugins(t,e,n){return this._plugins.notify(this,t,e,n)}isPluginEnabled(t){return this._plugins._cache.filter(e=>e.plugin.id===t).length===1}_updateHoverStyles(t,e,n){const s=this.options.hover,o=(l,c)=>l.filter(h=>!c.some(d=>h.datasetIndex===d.datasetIndex&&h.index===d.index)),r=o(e,t),a=n?t:o(t,e);r.length&&this.updateHoverStyle(r,s.mode,!1),a.length&&s.mode&&this.updateHoverStyle(a,s.mode,!0)}_eventHandler(t,e){const n={event:t,replay:e,cancelable:!0,inChartArea:this.isPointInArea(t)},s=r=>(r.options.events||this.options.events).includes(t.native.type);if(this.notifyPlugins("beforeEvent",n,s)===!1)return;const o=this._handleEvent(t,e,n.inChartArea);return n.cancelable=!1,this.notifyPlugins("afterEvent",n,s),(o||n.changed)&&this.render(),this}_handleEvent(t,e,n){const{_active:s=[],options:o}=this,r=e,a=this._getActiveElements(t,s,n,r),l=Lw(t),c=P1(t,this._lastEvent,n,l);n&&(this._lastEvent=null,ge(o.onHover,[t,a,this],this),l&&ge(o.onClick,[t,a,this],this));const h=!oa(a,s);return(h||e)&&(this._active=a,this._updateHoverStyles(a,s,e)),this._lastEvent=c,h}_getActiveElements(t,e,n,s){if(t.type==="mouseout")return[];if(!n)return e;const o=this.options.hover;return this.getElementsAtEventForMode(t,o.mode,o,s)}}function $u(){return ce(gh.instances,i=>i._plugins.invalidate())}function L1(i,t,e){const{startAngle:n,x:s,y:o,outerRadius:r,innerRadius:a,options:l}=t,{borderWidth:c,borderJoinStyle:h}=l,d=Math.min(c/r,Ge(n-e));if(i.beginPath(),i.arc(s,o,r-c/2,n+d/2,e-d/2),a>0){const u=Math.min(c/a,Ge(n-e));i.arc(s,o,a+c/2,e-u/2,n+u/2,!0)}else{const u=Math.min(c/2,r*Ge(n-e));if(h==="round")i.arc(s,o,u,e-ee/2,n+ee/2,!0);else if(h==="bevel"){const f=2*u*u,m=-f*Math.cos(e+ee/2)+s,x=-f*Math.sin(e+ee/2)+o,p=f*Math.cos(n+ee/2)+s,g=f*Math.sin(n+ee/2)+o;i.lineTo(m,x),i.lineTo(p,g)}}i.closePath(),i.moveTo(0,0),i.rect(0,0,i.canvas.width,i.canvas.height),i.clip("evenodd")}function D1(i,t,e){const{startAngle:n,pixelMargin:s,x:o,y:r,outerRadius:a,innerRadius:l}=t;let c=s/a;i.beginPath(),i.arc(o,r,a,n-c,e+c),l>s?(c=s/l,i.arc(o,r,l,e+c,n-c,!0)):i.arc(o,r,s,e+Ae,n-Ae),i.closePath(),i.clip()}function I1(i){return lh(i,["outerStart","outerEnd","innerStart","innerEnd"])}function F1(i,t,e,n){const s=I1(i.options.borderRadius),o=(e-t)/2,r=Math.min(o,n*t/2),a=l=>{const c=(e-Math.min(o,l))*n/2;return Ue(l,0,Math.min(o,c))};return{outerStart:a(s.outerStart),outerEnd:a(s.outerEnd),innerStart:Ue(s.innerStart,0,r),innerEnd:Ue(s.innerEnd,0,r)}}function Ls(i,t,e,n){return{x:e+i*Math.cos(t),y:n+i*Math.sin(t)}}function da(i,t,e,n,s,o){const{x:r,y:a,startAngle:l,pixelMargin:c,innerRadius:h}=t,d=Math.max(t.outerRadius+n+e-c,0),u=h>0?h+n+e+c:0;let f=0;const m=s-l;if(n){const F=h>0?h-n:0,I=d>0?d-n:0,z=(F+I)/2,W=z!==0?m*z/(z+n):m;f=(m-W)/2}const x=Math.max(.001,m*d-e/ee)/d,p=(m-x)/2,g=l+p+f,_=s-p-f,{outerStart:v,outerEnd:y,innerStart:b,innerEnd:w}=F1(t,u,d,_-g),T=d-v,P=d-y,M=g+v/T,E=_-y/P,R=u+b,N=u+w,D=g+b/R,O=_-w/N;if(i.beginPath(),o){const F=(M+E)/2;if(i.arc(r,a,d,M,F),i.arc(r,a,d,F,E),y>0){const j=Ls(P,E,r,a);i.arc(j.x,j.y,y,E,_+Ae)}const I=Ls(N,_,r,a);if(i.lineTo(I.x,I.y),w>0){const j=Ls(N,O,r,a);i.arc(j.x,j.y,w,_+Ae,O+Math.PI)}const z=(_-w/u+(g+b/u))/2;if(i.arc(r,a,u,_-w/u,z,!0),i.arc(r,a,u,z,g+b/u,!0),b>0){const j=Ls(R,D,r,a);i.arc(j.x,j.y,b,D+Math.PI,g-Ae)}const W=Ls(T,g,r,a);if(i.lineTo(W.x,W.y),v>0){const j=Ls(T,M,r,a);i.arc(j.x,j.y,v,g-Ae,M)}}else{i.moveTo(r,a);const F=Math.cos(M)*d+r,I=Math.sin(M)*d+a;i.lineTo(F,I);const z=Math.cos(E)*d+r,W=Math.sin(E)*d+a;i.lineTo(z,W)}i.closePath()}function N1(i,t,e,n,s){const{fullCircles:o,startAngle:r,circumference:a}=t;let l=t.endAngle;if(o){da(i,t,e,n,l,s);for(let c=0;c<o;++c)i.fill();isNaN(a)||(l=r+(a%_e||_e))}return da(i,t,e,n,l,s),i.fill(),l}function O1(i,t,e,n,s){const{fullCircles:o,startAngle:r,circumference:a,options:l}=t,{borderWidth:c,borderJoinStyle:h,borderDash:d,borderDashOffset:u,borderRadius:f}=l,m=l.borderAlign==="inner";if(!c)return;i.setLineDash(d||[]),i.lineDashOffset=u,m?(i.lineWidth=c*2,i.lineJoin=h||"round"):(i.lineWidth=c,i.lineJoin=h||"bevel");let x=t.endAngle;if(o){da(i,t,e,n,x,s);for(let p=0;p<o;++p)i.stroke();isNaN(a)||(x=r+(a%_e||_e))}m&&D1(i,t,x),l.selfJoin&&x-r>=ee&&f===0&&h!=="miter"&&L1(i,t,x),o||(da(i,t,e,n,x,s),i.stroke())}class U1 extends gi{static id="arc";static defaults={borderAlign:"center",borderColor:"#fff",borderDash:[],borderDashOffset:0,borderJoinStyle:void 0,borderRadius:0,borderWidth:2,offset:0,spacing:0,angle:void 0,circular:!0,selfJoin:!1};static defaultRoutes={backgroundColor:"backgroundColor"};static descriptors={_scriptable:!0,_indexable:t=>t!=="borderDash"};circumference;endAngle;fullCircles;innerRadius;outerRadius;pixelMargin;startAngle;constructor(t){super(),this.options=void 0,this.circumference=void 0,this.startAngle=void 0,this.endAngle=void 0,this.innerRadius=void 0,this.outerRadius=void 0,this.pixelMargin=0,this.fullCircles=0,t&&Object.assign(this,t)}inRange(t,e,n){const s=this.getProps(["x","y"],n),{angle:o,distance:r}=wp(s,{x:t,y:e}),{startAngle:a,endAngle:l,innerRadius:c,outerRadius:h,circumference:d}=this.getProps(["startAngle","endAngle","innerRadius","outerRadius","circumference"],n),u=(this.options.spacing+this.options.borderWidth)/2,f=kt(d,l-a),m=Ho(o,a,l)&&a!==l,x=f>=_e||m,p=ci(r,c+u,h+u);return x&&p}getCenterPoint(t){const{x:e,y:n,startAngle:s,endAngle:o,innerRadius:r,outerRadius:a}=this.getProps(["x","y","startAngle","endAngle","innerRadius","outerRadius"],t),{offset:l,spacing:c}=this.options,h=(s+o)/2,d=(r+a+c+l)/2;return{x:e+Math.cos(h)*d,y:n+Math.sin(h)*d}}tooltipPosition(t){return this.getCenterPoint(t)}draw(t){const{options:e,circumference:n}=this,s=(e.offset||0)/4,o=(e.spacing||0)/2,r=e.circular;if(this.pixelMargin=e.borderAlign==="inner"?.33:0,this.fullCircles=n>_e?Math.floor(n/_e):0,n===0||this.innerRadius<0||this.outerRadius<0)return;t.save();const a=(this.startAngle+this.endAngle)/2;t.translate(Math.cos(a)*s,Math.sin(a)*s);const l=1-Math.sin(Math.min(ee,n||0)),c=s*l;t.fillStyle=e.backgroundColor,t.strokeStyle=e.borderColor,N1(t,this,c,o,r),O1(t,this,c,o,r),t.restore()}}function om(i,t,e=t){i.lineCap=kt(e.borderCapStyle,t.borderCapStyle),i.setLineDash(kt(e.borderDash,t.borderDash)),i.lineDashOffset=kt(e.borderDashOffset,t.borderDashOffset),i.lineJoin=kt(e.borderJoinStyle,t.borderJoinStyle),i.lineWidth=kt(e.borderWidth,t.borderWidth),i.strokeStyle=kt(e.borderColor,t.borderColor)}function B1(i,t,e){i.lineTo(e.x,e.y)}function z1(i){return i.stepped?tE:i.tension||i.cubicInterpolationMode==="monotone"?eE:B1}function rm(i,t,e={}){const n=i.length,{start:s=0,end:o=n-1}=e,{start:r,end:a}=t,l=Math.max(s,r),c=Math.min(o,a),h=s<r&&o<r||s>a&&o>a;return{count:n,start:l,loop:t.loop,ilen:c<l&&!h?n+c-l:c-l}}function k1(i,t,e,n){const{points:s,options:o}=t,{count:r,start:a,loop:l,ilen:c}=rm(s,e,n),h=z1(o);let{move:d=!0,reverse:u}=n||{},f,m,x;for(f=0;f<=c;++f)m=s[(a+(u?c-f:f))%r],!m.skip&&(d?(i.moveTo(m.x,m.y),d=!1):h(i,x,m,u,o.stepped),x=m);return l&&(m=s[(a+(u?c:0))%r],h(i,x,m,u,o.stepped)),!!l}function V1(i,t,e,n){const s=t.points,{count:o,start:r,ilen:a}=rm(s,e,n),{move:l=!0,reverse:c}=n||{};let h=0,d=0,u,f,m,x,p,g;const _=y=>(r+(c?a-y:y))%o,v=()=>{x!==p&&(i.lineTo(h,p),i.lineTo(h,x),i.lineTo(h,g))};for(l&&(f=s[_(0)],i.moveTo(f.x,f.y)),u=0;u<=a;++u){if(f=s[_(u)],f.skip)continue;const y=f.x,b=f.y,w=y|0;w===m?(b<x?x=b:b>p&&(p=b),h=(d*h+y)/++d):(v(),i.lineTo(y,b),m=w,d=0,x=p=b),g=b}v()}function Rc(i){const t=i.options,e=t.borderDash&&t.borderDash.length;return!i._decimated&&!i._loop&&!t.tension&&t.cubicInterpolationMode!=="monotone"&&!t.stepped&&!e?V1:k1}function H1(i){return i.stepped?IE:i.tension||i.cubicInterpolationMode==="monotone"?FE:Ji}function G1(i,t,e,n){let s=t._path;s||(s=t._path=new Path2D,t.path(s,e,n)&&s.closePath()),om(i,t.options),i.stroke(s)}function W1(i,t,e,n){const{segments:s,options:o}=t,r=Rc(t);for(const a of s)om(i,o,a.style),i.beginPath(),r(i,t,a,{start:e,end:e+n-1})&&i.closePath(),i.stroke()}const q1=typeof Path2D=="function";function X1(i,t,e,n){q1&&!t.options.segment?G1(i,t,e,n):W1(i,t,e,n)}class Sa extends gi{static id="line";static defaults={borderCapStyle:"butt",borderDash:[],borderDashOffset:0,borderJoinStyle:"miter",borderWidth:3,capBezierPoints:!0,cubicInterpolationMode:"default",fill:!1,spanGaps:!1,stepped:!1,tension:0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};static descriptors={_scriptable:!0,_indexable:t=>t!=="borderDash"&&t!=="fill"};constructor(t){super(),this.animated=!0,this.options=void 0,this._chart=void 0,this._loop=void 0,this._fullLoop=void 0,this._path=void 0,this._points=void 0,this._segments=void 0,this._decimated=!1,this._pointsUpdated=!1,this._datasetIndex=void 0,t&&Object.assign(this,t)}updateControlPoints(t,e){const n=this.options;if((n.tension||n.cubicInterpolationMode==="monotone")&&!n.stepped&&!this._pointsUpdated){const s=n.spanGaps?this._loop:this._fullLoop;EE(this._points,n,t,s,e),this._pointsUpdated=!0}}set points(t){this._points=t,delete this._segments,delete this._path,this._pointsUpdated=!1}get points(){return this._points}get segments(){return this._segments||(this._segments=kE(this,this.options.segment))}first(){const t=this.segments,e=this.points;return t.length&&e[t[0].start]}last(){const t=this.segments,e=this.points,n=t.length;return n&&e[t[n-1].end]}interpolate(t,e){const n=this.options,s=t[e],o=this.points,r=Wp(this,{property:e,start:s,end:s});if(!r.length)return;const a=[],l=H1(n);let c,h;for(c=0,h=r.length;c<h;++c){const{start:d,end:u}=r[c],f=o[d],m=o[u];if(f===m){a.push(f);continue}const x=Math.abs((s-f[e])/(m[e]-f[e])),p=l(f,m,x,n.stepped);p[e]=t[e],a.push(p)}return a.length===1?a[0]:a}pathSegment(t,e,n){return Rc(this)(t,this,e,n)}path(t,e,n){const s=this.segments,o=Rc(this);let r=this._loop;e=e||0,n=n||this.points.length-e;for(const a of s)r&=o(t,this,a,{start:e,end:e+n-1});return!!r}draw(t,e,n,s){const o=this.options||{};(this.points||[]).length&&o.borderWidth&&(t.save(),X1(t,this,n,s),t.restore()),this.animated&&(this._pointsUpdated=!1,this._path=void 0)}}function Yu(i,t,e,n){const s=i.options,{[e]:o}=i.getProps([e],n);return Math.abs(t-o)<s.radius+s.hitRadius}class $1 extends gi{static id="point";parsed;skip;stop;static defaults={borderWidth:1,hitRadius:1,hoverBorderWidth:1,hoverRadius:4,pointStyle:"circle",radius:3,rotation:0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};constructor(t){super(),this.options=void 0,this.parsed=void 0,this.skip=void 0,this.stop=void 0,t&&Object.assign(this,t)}inRange(t,e,n){const s=this.options,{x:o,y:r}=this.getProps(["x","y"],n);return Math.pow(t-o,2)+Math.pow(e-r,2)<Math.pow(s.hitRadius+s.radius,2)}inXRange(t,e){return Yu(this,t,"x",e)}inYRange(t,e){return Yu(this,t,"y",e)}getCenterPoint(t){const{x:e,y:n}=this.getProps(["x","y"],t);return{x:e,y:n}}size(t){t=t||this.options||{};let e=t.radius||0;e=Math.max(e,e&&t.hoverRadius||0);const n=e&&t.borderWidth||0;return(e+n)*2}draw(t,e){const n=this.options;this.skip||n.radius<.1||!di(this,e,this.size(n)/2)||(t.strokeStyle=n.borderColor,t.lineWidth=n.borderWidth,t.fillStyle=n.backgroundColor,Tc(t,n,this.x,this.y))}getRange(){const t=this.options||{};return t.radius+t.hitRadius}}function am(i,t){const{x:e,y:n,base:s,width:o,height:r}=i.getProps(["x","y","base","width","height"],t);let a,l,c,h,d;return i.horizontal?(d=r/2,a=Math.min(e,s),l=Math.max(e,s),c=n-d,h=n+d):(d=o/2,a=e-d,l=e+d,c=Math.min(n,s),h=Math.max(n,s)),{left:a,top:c,right:l,bottom:h}}function Pi(i,t,e,n){return i?0:Ue(t,e,n)}function Y1(i,t,e){const n=i.options.borderWidth,s=i.borderSkipped,o=Ip(n);return{t:Pi(s.top,o.top,0,e),r:Pi(s.right,o.right,0,t),b:Pi(s.bottom,o.bottom,0,e),l:Pi(s.left,o.left,0,t)}}function j1(i,t,e){const{enableBorderRadius:n}=i.getProps(["enableBorderRadius"]),s=i.options.borderRadius,o=ss(s),r=Math.min(t,e),a=i.borderSkipped,l=n||Kt(s);return{topLeft:Pi(!l||a.top||a.left,o.topLeft,0,r),topRight:Pi(!l||a.top||a.right,o.topRight,0,r),bottomLeft:Pi(!l||a.bottom||a.left,o.bottomLeft,0,r),bottomRight:Pi(!l||a.bottom||a.right,o.bottomRight,0,r)}}function K1(i){const t=am(i),e=t.right-t.left,n=t.bottom-t.top,s=Y1(i,e/2,n/2),o=j1(i,e/2,n/2);return{outer:{x:t.left,y:t.top,w:e,h:n,radius:o},inner:{x:t.left+s.l,y:t.top+s.t,w:e-s.l-s.r,h:n-s.t-s.b,radius:{topLeft:Math.max(0,o.topLeft-Math.max(s.t,s.l)),topRight:Math.max(0,o.topRight-Math.max(s.t,s.r)),bottomLeft:Math.max(0,o.bottomLeft-Math.max(s.b,s.l)),bottomRight:Math.max(0,o.bottomRight-Math.max(s.b,s.r))}}}}function Tl(i,t,e,n){const s=t===null,o=e===null,a=i&&!(s&&o)&&am(i,n);return a&&(s||ci(t,a.left,a.right))&&(o||ci(e,a.top,a.bottom))}function Z1(i){return i.topLeft||i.topRight||i.bottomLeft||i.bottomRight}function J1(i,t){i.rect(t.x,t.y,t.w,t.h)}function Al(i,t,e={}){const n=i.x!==e.x?-t:0,s=i.y!==e.y?-t:0,o=(i.x+i.w!==e.x+e.w?t:0)-n,r=(i.y+i.h!==e.y+e.h?t:0)-s;return{x:i.x+n,y:i.y+s,w:i.w+o,h:i.h+r,radius:i.radius}}class Q1 extends gi{static id="bar";static defaults={borderSkipped:"start",borderWidth:0,borderRadius:0,inflateAmount:"auto",pointStyle:void 0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};constructor(t){super(),this.options=void 0,this.horizontal=void 0,this.base=void 0,this.width=void 0,this.height=void 0,this.inflateAmount=void 0,t&&Object.assign(this,t)}draw(t){const{inflateAmount:e,options:{borderColor:n,backgroundColor:s}}=this,{inner:o,outer:r}=K1(this),a=Z1(r.radius)?Go:J1;t.save(),(r.w!==o.w||r.h!==o.h)&&(t.beginPath(),a(t,Al(r,e,o)),t.clip(),a(t,Al(o,-e,r)),t.fillStyle=n,t.fill("evenodd")),t.beginPath(),a(t,Al(o,e)),t.fillStyle=s,t.fill(),t.restore()}inRange(t,e,n){return Tl(this,t,e,n)}inXRange(t,e){return Tl(this,t,null,e)}inYRange(t,e){return Tl(this,null,t,e)}getCenterPoint(t){const{x:e,y:n,base:s,horizontal:o}=this.getProps(["x","y","base","horizontal"],t);return{x:o?(e+s)/2:e,y:o?n:(n+s)/2}}getRange(t){return t==="x"?this.width/2:this.height/2}}var tA=Object.freeze({__proto__:null,ArcElement:U1,BarElement:Q1,LineElement:Sa,PointElement:$1});const Pc=["rgb(54, 162, 235)","rgb(255, 99, 132)","rgb(255, 159, 64)","rgb(255, 205, 86)","rgb(75, 192, 192)","rgb(153, 102, 255)","rgb(201, 203, 207)"],ju=Pc.map(i=>i.replace("rgb(","rgba(").replace(")",", 0.5)"));function lm(i){return Pc[i%Pc.length]}function cm(i){return ju[i%ju.length]}function eA(i,t){return i.borderColor=lm(t),i.backgroundColor=cm(t),++t}function nA(i,t){return i.backgroundColor=i.data.map(()=>lm(t++)),t}function iA(i,t){return i.backgroundColor=i.data.map(()=>cm(t++)),t}function sA(i){let t=0;return(e,n)=>{const s=i.getDatasetMeta(n).controller;s instanceof ph?t=nA(e,t):s instanceof jp?t=iA(e,t):s&&(t=eA(e,t))}}function Ku(i){let t;for(t in i)if(i[t].borderColor||i[t].backgroundColor)return!0;return!1}function oA(i){return i&&(i.borderColor||i.backgroundColor)}function rA(){return ye.borderColor!=="rgba(0,0,0,0.1)"||ye.backgroundColor!=="rgba(0,0,0,0.1)"}var aA={id:"colors",defaults:{enabled:!0,forceOverride:!1},beforeLayout(i,t,e){if(!e.enabled)return;const{data:{datasets:n},options:s}=i.config,{elements:o}=s,r=Ku(n)||oA(s)||o&&Ku(o)||rA();if(!e.forceOverride&&r)return;const a=sA(i);n.forEach(a)}};function lA(i,t,e,n,s){const o=s.samples||n;if(o>=e)return i.slice(t,t+e);const r=[],a=(e-2)/(o-2);let l=0;const c=t+e-1;let h=t,d,u,f,m,x;for(r[l++]=i[h],d=0;d<o-2;d++){let p=0,g=0,_;const v=Math.floor((d+1)*a)+1+t,y=Math.min(Math.floor((d+2)*a)+1,e)+t,b=y-v;for(_=v;_<y;_++)p+=i[_].x,g+=i[_].y;p/=b,g/=b;const w=Math.floor(d*a)+1+t,T=Math.min(Math.floor((d+1)*a)+1,e)+t,{x:P,y:M}=i[h];for(f=m=-1,_=w;_<T;_++)m=.5*Math.abs((P-p)*(i[_].y-M)-(P-i[_].x)*(g-M)),m>f&&(f=m,u=i[_],x=_);r[l++]=u,h=x}return r[l++]=i[c],r}function cA(i,t,e,n){let s=0,o=0,r,a,l,c,h,d,u,f,m,x;const p=[],g=t+e-1,_=i[t].x,y=i[g].x-_;for(r=t;r<t+e;++r){a=i[r],l=(a.x-_)/y*n,c=a.y;const b=l|0;if(b===h)c<m?(m=c,d=r):c>x&&(x=c,u=r),s=(o*s+a.x)/++o;else{const w=r-1;if(!Yt(d)&&!Yt(u)){const T=Math.min(d,u),P=Math.max(d,u);T!==f&&T!==w&&p.push({...i[T],x:s}),P!==f&&P!==w&&p.push({...i[P],x:s})}r>0&&w!==f&&p.push(i[w]),p.push(a),h=b,o=0,m=x=c,d=u=f=r}}return p}function hm(i){if(i._decimated){const t=i._data;delete i._decimated,delete i._data,Object.defineProperty(i,"data",{configurable:!0,enumerable:!0,writable:!0,value:t})}}function Zu(i){i.data.datasets.forEach(t=>{hm(t)})}function hA(i,t){const e=t.length;let n=0,s;const{iScale:o}=i,{min:r,max:a,minDefined:l,maxDefined:c}=o.getUserBounds();return l&&(n=Ue(hi(t,o.axis,r).lo,0,e-1)),c?s=Ue(hi(t,o.axis,a).hi+1,n,e)-n:s=e-n,{start:n,count:s}}var dA={id:"decimation",defaults:{algorithm:"min-max",enabled:!1},beforeElementsUpdate:(i,t,e)=>{if(!e.enabled){Zu(i);return}const n=i.width;i.data.datasets.forEach((s,o)=>{const{_data:r,indexAxis:a}=s,l=i.getDatasetMeta(o),c=r||s.data;if(So([a,i.options.indexAxis])==="y"||!l.controller.supportsDecimation)return;const h=i.scales[l.xAxisID];if(h.type!=="linear"&&h.type!=="time"||i.options.parsing)return;let{start:d,count:u}=hA(l,c);const f=e.threshold||4*n;if(u<=f){hm(s);return}Yt(r)&&(s._data=c,delete s.data,Object.defineProperty(s,"data",{configurable:!0,enumerable:!0,get:function(){return this._decimated},set:function(x){this._data=x}}));let m;switch(e.algorithm){case"lttb":m=lA(c,d,u,n,e);break;case"min-max":m=cA(c,d,u,n);break;default:throw new Error(`Unsupported decimation algorithm '${e.algorithm}'`)}s._decimated=m})},destroy(i){Zu(i)}};function uA(i,t,e){const n=i.segments,s=i.points,o=t.points,r=[];for(const a of n){let{start:l,end:c}=a;c=wa(l,c,s);const h=Lc(e,s[l],s[c],a.loop);if(!t.segments){r.push({source:a,target:h,start:s[l],end:s[c]});continue}const d=Wp(t,h);for(const u of d){const f=Lc(e,o[u.start],o[u.end],u.loop),m=Gp(a,s,f);for(const x of m)r.push({source:x,target:u,start:{[e]:Ju(h,f,"start",Math.max)},end:{[e]:Ju(h,f,"end",Math.min)}})}}return r}function Lc(i,t,e,n){if(n)return;let s=t[i],o=e[i];return i==="angle"&&(s=Ge(s),o=Ge(o)),{property:i,start:s,end:o}}function fA(i,t){const{x:e=null,y:n=null}=i||{},s=t.points,o=[];return t.segments.forEach(({start:r,end:a})=>{a=wa(r,a,s);const l=s[r],c=s[a];n!==null?(o.push({x:l.x,y:n}),o.push({x:c.x,y:n})):e!==null&&(o.push({x:e,y:l.y}),o.push({x:e,y:c.y}))}),o}function wa(i,t,e){for(;t>i;t--){const n=e[t];if(!isNaN(n.x)&&!isNaN(n.y))break}return t}function Ju(i,t,e,n){return i&&t?n(i[e],t[e]):i?i[e]:t?t[e]:0}function dm(i,t){let e=[],n=!1;return ve(i)?(n=!0,e=i):e=fA(i,t),e.length?new Sa({points:e,options:{tension:0},_loop:n,_fullLoop:n}):null}function Qu(i){return i&&i.fill!==!1}function pA(i,t,e){let s=i[t].fill;const o=[t];let r;if(!e)return s;for(;s!==!1&&o.indexOf(s)===-1;){if(!Ee(s))return s;if(r=i[s],!r)return!1;if(r.visible)return s;o.push(s),s=r.fill}return!1}function mA(i,t,e){const n=vA(i);if(Kt(n))return isNaN(n.value)?!1:n;let s=parseFloat(n);return Ee(s)&&Math.floor(s)===s?gA(n[0],t,s,e):["origin","start","end","stack","shape"].indexOf(n)>=0&&n}function gA(i,t,e,n){return(i==="-"||i==="+")&&(e=t+e),e===t||e<0||e>=n?!1:e}function xA(i,t){let e=null;return i==="start"?e=t.bottom:i==="end"?e=t.top:Kt(i)?e=t.getPixelForValue(i.value):t.getBasePixel&&(e=t.getBasePixel()),e}function _A(i,t,e){let n;return i==="start"?n=e:i==="end"?n=t.options.reverse?t.min:t.max:Kt(i)?n=i.value:n=t.getBaseValue(),n}function vA(i){const t=i.options,e=t.fill;let n=kt(e&&e.target,e);return n===void 0&&(n=!!t.backgroundColor),n===!1||n===null?!1:n===!0?"origin":n}function yA(i){const{scale:t,index:e,line:n}=i,s=[],o=n.segments,r=n.points,a=bA(t,e);a.push(dm({x:null,y:t.bottom},n));for(let l=0;l<o.length;l++){const c=o[l];for(let h=c.start;h<=c.end;h++)MA(s,r[h],a)}return new Sa({points:s,options:{}})}function bA(i,t){const e=[],n=i.getMatchingVisibleMetas("line");for(let s=0;s<n.length;s++){const o=n[s];if(o.index===t)break;o.hidden||e.unshift(o.dataset)}return e}function MA(i,t,e){const n=[];for(let s=0;s<e.length;s++){const o=e[s],{first:r,last:a,point:l}=SA(o,t,"x");if(!(!l||r&&a)){if(r)n.unshift(l);else if(i.push(l),!a)break}}i.push(...n)}function SA(i,t,e){const n=i.interpolate(t,e);if(!n)return{};const s=n[e],o=i.segments,r=i.points;let a=!1,l=!1;for(let c=0;c<o.length;c++){const h=o[c],d=r[h.start][e],u=r[h.end][e];if(ci(s,d,u)){a=s===d,l=s===u;break}}return{first:a,last:l,point:n}}class um{constructor(t){this.x=t.x,this.y=t.y,this.radius=t.radius}pathSegment(t,e,n){const{x:s,y:o,radius:r}=this;return e=e||{start:0,end:_e},t.arc(s,o,r,e.end,e.start,!0),!n.bounds}interpolate(t){const{x:e,y:n,radius:s}=this,o=t.angle;return{x:e+Math.cos(o)*s,y:n+Math.sin(o)*s,angle:o}}}function wA(i){const{chart:t,fill:e,line:n}=i;if(Ee(e))return EA(t,e);if(e==="stack")return yA(i);if(e==="shape")return!0;const s=TA(i);return s instanceof um?s:dm(s,n)}function EA(i,t){const e=i.getDatasetMeta(t);return e&&i.isDatasetVisible(t)?e.dataset:null}function TA(i){return(i.scale||{}).getPointPositionForValue?CA(i):AA(i)}function AA(i){const{scale:t={},fill:e}=i,n=xA(e,t);if(Ee(n)){const s=t.isHorizontal();return{x:s?n:null,y:s?null:n}}return null}function CA(i){const{scale:t,fill:e}=i,n=t.options,s=t.getLabels().length,o=n.reverse?t.max:t.min,r=_A(e,t,o),a=[];if(n.grid.circular){const l=t.getPointPositionForValue(0,o);return new um({x:l.x,y:l.y,radius:t.getDistanceFromCenterForValue(r)})}for(let l=0;l<s;++l)a.push(t.getPointPositionForValue(l,r));return a}function Cl(i,t,e){const n=wA(t),{chart:s,index:o,line:r,scale:a,axis:l}=t,c=r.options,h=c.fill,d=c.backgroundColor,{above:u=d,below:f=d}=h||{},m=s.getDatasetMeta(o),x=qp(s,m);n&&r.points.length&&(va(i,e),RA(i,{line:r,target:n,above:u,below:f,area:e,scale:a,axis:l,clip:x}),ya(i))}function RA(i,t){const{line:e,target:n,above:s,below:o,area:r,scale:a,clip:l}=t,c=e._loop?"angle":t.axis;i.save();let h=o;o!==s&&(c==="x"?(tf(i,n,r.top),Rl(i,{line:e,target:n,color:s,scale:a,property:c,clip:l}),i.restore(),i.save(),tf(i,n,r.bottom)):c==="y"&&(ef(i,n,r.left),Rl(i,{line:e,target:n,color:o,scale:a,property:c,clip:l}),i.restore(),i.save(),ef(i,n,r.right),h=s)),Rl(i,{line:e,target:n,color:h,scale:a,property:c,clip:l}),i.restore()}function tf(i,t,e){const{segments:n,points:s}=t;let o=!0,r=!1;i.beginPath();for(const a of n){const{start:l,end:c}=a,h=s[l],d=s[wa(l,c,s)];o?(i.moveTo(h.x,h.y),o=!1):(i.lineTo(h.x,e),i.lineTo(h.x,h.y)),r=!!t.pathSegment(i,a,{move:r}),r?i.closePath():i.lineTo(d.x,e)}i.lineTo(t.first().x,e),i.closePath(),i.clip()}function ef(i,t,e){const{segments:n,points:s}=t;let o=!0,r=!1;i.beginPath();for(const a of n){const{start:l,end:c}=a,h=s[l],d=s[wa(l,c,s)];o?(i.moveTo(h.x,h.y),o=!1):(i.lineTo(e,h.y),i.lineTo(h.x,h.y)),r=!!t.pathSegment(i,a,{move:r}),r?i.closePath():i.lineTo(e,d.y)}i.lineTo(e,t.first().y),i.closePath(),i.clip()}function Rl(i,t){const{line:e,target:n,property:s,color:o,scale:r,clip:a}=t,l=uA(e,n,s);for(const{source:c,target:h,start:d,end:u}of l){const{style:{backgroundColor:f=o}={}}=c,m=n!==!0;i.save(),i.fillStyle=f,PA(i,r,a,m&&Lc(s,d,u)),i.beginPath();const x=!!e.pathSegment(i,c);let p;if(m){x?i.closePath():nf(i,n,u,s);const g=!!n.pathSegment(i,h,{move:x,reverse:!0});p=x&&g,p||nf(i,n,d,s)}i.closePath(),i.fill(p?"evenodd":"nonzero"),i.restore()}}function PA(i,t,e,n){const s=t.chart.chartArea,{property:o,start:r,end:a}=n||{};if(o==="x"||o==="y"){let l,c,h,d;o==="x"?(l=r,c=s.top,h=a,d=s.bottom):(l=s.left,c=r,h=s.right,d=a),i.beginPath(),e&&(l=Math.max(l,e.left),h=Math.min(h,e.right),c=Math.max(c,e.top),d=Math.min(d,e.bottom)),i.rect(l,c,h-l,d-c),i.clip()}}function nf(i,t,e,n){const s=t.interpolate(e,n);s&&i.lineTo(s.x,s.y)}var LA={id:"filler",afterDatasetsUpdate(i,t,e){const n=(i.data.datasets||[]).length,s=[];let o,r,a,l;for(r=0;r<n;++r)o=i.getDatasetMeta(r),a=o.dataset,l=null,a&&a.options&&a instanceof Sa&&(l={visible:i.isDatasetVisible(r),index:r,fill:mA(a,r,n),chart:i,axis:o.controller.options.indexAxis,scale:o.vScale,line:a}),o.$filler=l,s.push(l);for(r=0;r<n;++r)l=s[r],!(!l||l.fill===!1)&&(l.fill=pA(s,r,e.propagate))},beforeDraw(i,t,e){const n=e.drawTime==="beforeDraw",s=i.getSortedVisibleDatasetMetas(),o=i.chartArea;for(let r=s.length-1;r>=0;--r){const a=s[r].$filler;a&&(a.line.updateControlPoints(o,a.axis),n&&a.fill&&Cl(i.ctx,a,o))}},beforeDatasetsDraw(i,t,e){if(e.drawTime!=="beforeDatasetsDraw")return;const n=i.getSortedVisibleDatasetMetas();for(let s=n.length-1;s>=0;--s){const o=n[s].$filler;Qu(o)&&Cl(i.ctx,o,i.chartArea)}},beforeDatasetDraw(i,t,e){const n=t.meta.$filler;!Qu(n)||e.drawTime!=="beforeDatasetDraw"||Cl(i.ctx,n,i.chartArea)},defaults:{propagate:!0,drawTime:"beforeDatasetDraw"}};const sf=(i,t)=>{let{boxHeight:e=t,boxWidth:n=t}=i;return i.usePointStyle&&(e=Math.min(e,t),n=i.pointStyleWidth||Math.min(n,t)),{boxWidth:n,boxHeight:e,itemHeight:Math.max(t,e)}},DA=(i,t)=>i!==null&&t!==null&&i.datasetIndex===t.datasetIndex&&i.index===t.index;class of extends gi{constructor(t){super(),this._added=!1,this.legendHitBoxes=[],this._hoveredItem=null,this.doughnutMode=!1,this.chart=t.chart,this.options=t.options,this.ctx=t.ctx,this.legendItems=void 0,this.columnSizes=void 0,this.lineWidths=void 0,this.maxHeight=void 0,this.maxWidth=void 0,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.height=void 0,this.width=void 0,this._margins=void 0,this.position=void 0,this.weight=void 0,this.fullSize=void 0}update(t,e,n){this.maxWidth=t,this.maxHeight=e,this._margins=n,this.setDimensions(),this.buildLabels(),this.fit()}setDimensions(){this.isHorizontal()?(this.width=this.maxWidth,this.left=this._margins.left,this.right=this.width):(this.height=this.maxHeight,this.top=this._margins.top,this.bottom=this.height)}buildLabels(){const t=this.options.labels||{};let e=ge(t.generateLabels,[this.chart],this)||[];t.filter&&(e=e.filter(n=>t.filter(n,this.chart.data))),t.sort&&(e=e.sort((n,s)=>t.sort(n,s,this.chart.data))),this.options.reverse&&e.reverse(),this.legendItems=e}fit(){const{options:t,ctx:e}=this;if(!t.display){this.width=this.height=0;return}const n=t.labels,s=De(n.font),o=s.size,r=this._computeTitleHeight(),{boxWidth:a,itemHeight:l}=sf(n,o);let c,h;e.font=s.string,this.isHorizontal()?(c=this.maxWidth,h=this._fitRows(r,o,a,l)+10):(h=this.maxHeight,c=this._fitCols(r,s,a,l)+10),this.width=Math.min(c,t.maxWidth||this.maxWidth),this.height=Math.min(h,t.maxHeight||this.maxHeight)}_fitRows(t,e,n,s){const{ctx:o,maxWidth:r,options:{labels:{padding:a}}}=this,l=this.legendHitBoxes=[],c=this.lineWidths=[0],h=s+a;let d=t;o.textAlign="left",o.textBaseline="middle";let u=-1,f=-h;return this.legendItems.forEach((m,x)=>{const p=n+e/2+o.measureText(m.text).width;(x===0||c[c.length-1]+p+2*a>r)&&(d+=h,c[c.length-(x>0?0:1)]=0,f+=h,u++),l[x]={left:0,top:f,row:u,width:p,height:s},c[c.length-1]+=p+a}),d}_fitCols(t,e,n,s){const{ctx:o,maxHeight:r,options:{labels:{padding:a}}}=this,l=this.legendHitBoxes=[],c=this.columnSizes=[],h=r-t;let d=a,u=0,f=0,m=0,x=0;return this.legendItems.forEach((p,g)=>{const{itemWidth:_,itemHeight:v}=IA(n,e,o,p,s);g>0&&f+v+2*a>h&&(d+=u+a,c.push({width:u,height:f}),m+=u+a,x++,u=f=0),l[g]={left:m,top:f,col:x,width:_,height:v},u=Math.max(u,_),f+=v+a}),d+=u,c.push({width:u,height:f}),d}adjustHitBoxes(){if(!this.options.display)return;const t=this._computeTitleHeight(),{legendHitBoxes:e,options:{align:n,labels:{padding:s},rtl:o}}=this,r=Bs(o,this.left,this.width);if(this.isHorizontal()){let a=0,l=He(n,this.left+s,this.right-this.lineWidths[a]);for(const c of e)a!==c.row&&(a=c.row,l=He(n,this.left+s,this.right-this.lineWidths[a])),c.top+=this.top+t+s,c.left=r.leftForLtr(r.x(l),c.width),l+=c.width+s}else{let a=0,l=He(n,this.top+t+s,this.bottom-this.columnSizes[a].height);for(const c of e)c.col!==a&&(a=c.col,l=He(n,this.top+t+s,this.bottom-this.columnSizes[a].height)),c.top=l,c.left+=this.left+s,c.left=r.leftForLtr(r.x(c.left),c.width),l+=c.height+s}}isHorizontal(){return this.options.position==="top"||this.options.position==="bottom"}draw(){if(this.options.display){const t=this.ctx;va(t,this),this._draw(),ya(t)}}_draw(){const{options:t,columnSizes:e,lineWidths:n,ctx:s}=this,{align:o,labels:r}=t,a=ye.color,l=Bs(t.rtl,this.left,this.width),c=De(r.font),{padding:h}=r,d=c.size,u=d/2;let f;this.drawTitle(),s.textAlign=l.textAlign("left"),s.textBaseline="middle",s.lineWidth=.5,s.font=c.string;const{boxWidth:m,boxHeight:x,itemHeight:p}=sf(r,d),g=function(w,T,P){if(isNaN(m)||m<=0||isNaN(x)||x<0)return;s.save();const M=kt(P.lineWidth,1);if(s.fillStyle=kt(P.fillStyle,a),s.lineCap=kt(P.lineCap,"butt"),s.lineDashOffset=kt(P.lineDashOffset,0),s.lineJoin=kt(P.lineJoin,"miter"),s.lineWidth=M,s.strokeStyle=kt(P.strokeStyle,a),s.setLineDash(kt(P.lineDash,[])),r.usePointStyle){const E={radius:x*Math.SQRT2/2,pointStyle:P.pointStyle,rotation:P.rotation,borderWidth:M},R=l.xPlus(w,m/2),N=T+u;Dp(s,E,R,N,r.pointStyleWidth&&m)}else{const E=T+Math.max((d-x)/2,0),R=l.leftForLtr(w,m),N=ss(P.borderRadius);s.beginPath(),Object.values(N).some(D=>D!==0)?Go(s,{x:R,y:E,w:m,h:x,radius:N}):s.rect(R,E,m,x),s.fill(),M!==0&&s.stroke()}s.restore()},_=function(w,T,P){ls(s,P.text,w,T+p/2,c,{strikethrough:P.hidden,textAlign:l.textAlign(P.textAlign)})},v=this.isHorizontal(),y=this._computeTitleHeight();v?f={x:He(o,this.left+h,this.right-n[0]),y:this.top+h+y,line:0}:f={x:this.left+h,y:He(o,this.top+y+h,this.bottom-e[0].height),line:0},kp(this.ctx,t.textDirection);const b=p+h;this.legendItems.forEach((w,T)=>{s.strokeStyle=w.fontColor,s.fillStyle=w.fontColor;const P=s.measureText(w.text).width,M=l.textAlign(w.textAlign||(w.textAlign=r.textAlign)),E=m+u+P;let R=f.x,N=f.y;l.setWidth(this.width),v?T>0&&R+E+h>this.right&&(N=f.y+=b,f.line++,R=f.x=He(o,this.left+h,this.right-n[f.line])):T>0&&N+b>this.bottom&&(R=f.x=R+e[f.line].width+h,f.line++,N=f.y=He(o,this.top+y+h,this.bottom-e[f.line].height));const D=l.x(R);if(g(D,N,w),R=Gw(M,R+m+u,v?R+E:this.right,t.rtl),_(l.x(R),N,w),v)f.x+=E+h;else if(typeof w.text!="string"){const O=c.lineHeight;f.y+=fm(w,O)+h}else f.y+=b}),Vp(this.ctx,t.textDirection)}drawTitle(){const t=this.options,e=t.title,n=De(e.font),s=Xe(e.padding);if(!e.display)return;const o=Bs(t.rtl,this.left,this.width),r=this.ctx,a=e.position,l=n.size/2,c=s.top+l;let h,d=this.left,u=this.width;if(this.isHorizontal())u=Math.max(...this.lineWidths),h=this.top+c,d=He(t.align,d,this.right-u);else{const m=this.columnSizes.reduce((x,p)=>Math.max(x,p.height),0);h=c+He(t.align,this.top,this.bottom-m-t.labels.padding-this._computeTitleHeight())}const f=He(a,d,d+u);r.textAlign=o.textAlign(rh(a)),r.textBaseline="middle",r.strokeStyle=e.color,r.fillStyle=e.color,r.font=n.string,ls(r,e.text,f,h,n)}_computeTitleHeight(){const t=this.options.title,e=De(t.font),n=Xe(t.padding);return t.display?e.lineHeight+n.height:0}_getLegendItemAt(t,e){let n,s,o;if(ci(t,this.left,this.right)&&ci(e,this.top,this.bottom)){for(o=this.legendHitBoxes,n=0;n<o.length;++n)if(s=o[n],ci(t,s.left,s.left+s.width)&&ci(e,s.top,s.top+s.height))return this.legendItems[n]}return null}handleEvent(t){const e=this.options;if(!OA(t.type,e))return;const n=this._getLegendItemAt(t.x,t.y);if(t.type==="mousemove"||t.type==="mouseout"){const s=this._hoveredItem,o=DA(s,n);s&&!o&&ge(e.onLeave,[t,s,this],this),this._hoveredItem=n,n&&!o&&ge(e.onHover,[t,n,this],this)}else n&&ge(e.onClick,[t,n,this],this)}}function IA(i,t,e,n,s){const o=FA(n,i,t,e),r=NA(s,n,t.lineHeight);return{itemWidth:o,itemHeight:r}}function FA(i,t,e,n){let s=i.text;return s&&typeof s!="string"&&(s=s.reduce((o,r)=>o.length>r.length?o:r)),t+e.size/2+n.measureText(s).width}function NA(i,t,e){let n=i;return typeof t.text!="string"&&(n=fm(t,e)),n}function fm(i,t){const e=i.text?i.text.length:0;return t*e}function OA(i,t){return!!((i==="mousemove"||i==="mouseout")&&(t.onHover||t.onLeave)||t.onClick&&(i==="click"||i==="mouseup"))}var UA={id:"legend",_element:of,start(i,t,e){const n=i.legend=new of({ctx:i.ctx,options:e,chart:i});qe.configure(i,n,e),qe.addBox(i,n)},stop(i){qe.removeBox(i,i.legend),delete i.legend},beforeUpdate(i,t,e){const n=i.legend;qe.configure(i,n,e),n.options=e},afterUpdate(i){const t=i.legend;t.buildLabels(),t.adjustHitBoxes()},afterEvent(i,t){t.replay||i.legend.handleEvent(t.event)},defaults:{display:!0,position:"top",align:"center",fullSize:!0,reverse:!1,weight:1e3,onClick(i,t,e){const n=t.datasetIndex,s=e.chart;s.isDatasetVisible(n)?(s.hide(n),t.hidden=!0):(s.show(n),t.hidden=!1)},onHover:null,onLeave:null,labels:{color:i=>i.chart.options.color,boxWidth:40,padding:10,generateLabels(i){const t=i.data.datasets,{labels:{usePointStyle:e,pointStyle:n,textAlign:s,color:o,useBorderRadius:r,borderRadius:a}}=i.legend.options;return i._getSortedDatasetMetas().map(l=>{const c=l.controller.getStyle(e?0:void 0),h=Xe(c.borderWidth);return{text:t[l.index].label,fillStyle:c.backgroundColor,fontColor:o,hidden:!l.visible,lineCap:c.borderCapStyle,lineDash:c.borderDash,lineDashOffset:c.borderDashOffset,lineJoin:c.borderJoinStyle,lineWidth:(h.width+h.height)/4,strokeStyle:c.borderColor,pointStyle:n||c.pointStyle,rotation:c.rotation,textAlign:s||c.textAlign,borderRadius:r&&(a||c.borderRadius),datasetIndex:l.index}},this)}},title:{color:i=>i.chart.options.color,display:!1,position:"center",text:""}},descriptors:{_scriptable:i=>!i.startsWith("on"),labels:{_scriptable:i=>!["generateLabels","filter","sort"].includes(i)}}};class xh extends gi{constructor(t){super(),this.chart=t.chart,this.options=t.options,this.ctx=t.ctx,this._padding=void 0,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.width=void 0,this.height=void 0,this.position=void 0,this.weight=void 0,this.fullSize=void 0}update(t,e){const n=this.options;if(this.left=0,this.top=0,!n.display){this.width=this.height=this.right=this.bottom=0;return}this.width=this.right=t,this.height=this.bottom=e;const s=ve(n.text)?n.text.length:1;this._padding=Xe(n.padding);const o=s*De(n.font).lineHeight+this._padding.height;this.isHorizontal()?this.height=o:this.width=o}isHorizontal(){const t=this.options.position;return t==="top"||t==="bottom"}_drawArgs(t){const{top:e,left:n,bottom:s,right:o,options:r}=this,a=r.align;let l=0,c,h,d;return this.isHorizontal()?(h=He(a,n,o),d=e+t,c=o-n):(r.position==="left"?(h=n+t,d=He(a,s,e),l=ee*-.5):(h=o-t,d=He(a,e,s),l=ee*.5),c=s-e),{titleX:h,titleY:d,maxWidth:c,rotation:l}}draw(){const t=this.ctx,e=this.options;if(!e.display)return;const n=De(e.font),o=n.lineHeight/2+this._padding.top,{titleX:r,titleY:a,maxWidth:l,rotation:c}=this._drawArgs(o);ls(t,e.text,0,0,n,{color:e.color,maxWidth:l,rotation:c,textAlign:rh(e.align),textBaseline:"middle",translation:[r,a]})}}function BA(i,t){const e=new xh({ctx:i.ctx,options:t,chart:i});qe.configure(i,e,t),qe.addBox(i,e),i.titleBlock=e}var zA={id:"title",_element:xh,start(i,t,e){BA(i,e)},stop(i){const t=i.titleBlock;qe.removeBox(i,t),delete i.titleBlock},beforeUpdate(i,t,e){const n=i.titleBlock;qe.configure(i,n,e),n.options=e},defaults:{align:"center",display:!1,font:{weight:"bold"},fullSize:!0,padding:10,position:"top",text:"",weight:2e3},defaultRoutes:{color:"color"},descriptors:{_scriptable:!0,_indexable:!1}};const Br=new WeakMap;var kA={id:"subtitle",start(i,t,e){const n=new xh({ctx:i.ctx,options:e,chart:i});qe.configure(i,n,e),qe.addBox(i,n),Br.set(i,n)},stop(i){qe.removeBox(i,Br.get(i)),Br.delete(i)},beforeUpdate(i,t,e){const n=Br.get(i);qe.configure(i,n,e),n.options=e},defaults:{align:"center",display:!1,font:{weight:"normal"},fullSize:!0,padding:0,position:"top",text:"",weight:1500},defaultRoutes:{color:"color"},descriptors:{_scriptable:!0,_indexable:!1}};const Eo={average(i){if(!i.length)return!1;let t,e,n=new Set,s=0,o=0;for(t=0,e=i.length;t<e;++t){const a=i[t].element;if(a&&a.hasValue()){const l=a.tooltipPosition();n.add(l.x),s+=l.y,++o}}return o===0||n.size===0?!1:{x:[...n].reduce((a,l)=>a+l)/n.size,y:s/o}},nearest(i,t){if(!i.length)return!1;let e=t.x,n=t.y,s=Number.POSITIVE_INFINITY,o,r,a;for(o=0,r=i.length;o<r;++o){const l=i[o].element;if(l&&l.hasValue()){const c=l.getCenterPoint(),h=wc(t,c);h<s&&(s=h,a=l)}}if(a){const l=a.tooltipPosition();e=l.x,n=l.y}return{x:e,y:n}}};function Fn(i,t){return t&&(ve(t)?Array.prototype.push.apply(i,t):i.push(t)),i}function oi(i){return(typeof i=="string"||i instanceof String)&&i.indexOf(`
`)>-1?i.split(`
`):i}function VA(i,t){const{element:e,datasetIndex:n,index:s}=t,o=i.getDatasetMeta(n).controller,{label:r,value:a}=o.getLabelAndValue(s);return{chart:i,label:r,parsed:o.getParsed(s),raw:i.data.datasets[n].data[s],formattedValue:a,dataset:o.getDataset(),dataIndex:s,datasetIndex:n,element:e}}function rf(i,t){const e=i.chart.ctx,{body:n,footer:s,title:o}=i,{boxWidth:r,boxHeight:a}=t,l=De(t.bodyFont),c=De(t.titleFont),h=De(t.footerFont),d=o.length,u=s.length,f=n.length,m=Xe(t.padding);let x=m.height,p=0,g=n.reduce((y,b)=>y+b.before.length+b.lines.length+b.after.length,0);if(g+=i.beforeBody.length+i.afterBody.length,d&&(x+=d*c.lineHeight+(d-1)*t.titleSpacing+t.titleMarginBottom),g){const y=t.displayColors?Math.max(a,l.lineHeight):l.lineHeight;x+=f*y+(g-f)*l.lineHeight+(g-1)*t.bodySpacing}u&&(x+=t.footerMarginTop+u*h.lineHeight+(u-1)*t.footerSpacing);let _=0;const v=function(y){p=Math.max(p,e.measureText(y).width+_)};return e.save(),e.font=c.string,ce(i.title,v),e.font=l.string,ce(i.beforeBody.concat(i.afterBody),v),_=t.displayColors?r+2+t.boxPadding:0,ce(n,y=>{ce(y.before,v),ce(y.lines,v),ce(y.after,v)}),_=0,e.font=h.string,ce(i.footer,v),e.restore(),p+=m.width,{width:p,height:x}}function HA(i,t){const{y:e,height:n}=t;return e<n/2?"top":e>i.height-n/2?"bottom":"center"}function GA(i,t,e,n){const{x:s,width:o}=n,r=e.caretSize+e.caretPadding;if(i==="left"&&s+o+r>t.width||i==="right"&&s-o-r<0)return!0}function WA(i,t,e,n){const{x:s,width:o}=e,{width:r,chartArea:{left:a,right:l}}=i;let c="center";return n==="center"?c=s<=(a+l)/2?"left":"right":s<=o/2?c="left":s>=r-o/2&&(c="right"),GA(c,i,t,e)&&(c="center"),c}function af(i,t,e){const n=e.yAlign||t.yAlign||HA(i,e);return{xAlign:e.xAlign||t.xAlign||WA(i,t,e,n),yAlign:n}}function qA(i,t){let{x:e,width:n}=i;return t==="right"?e-=n:t==="center"&&(e-=n/2),e}function XA(i,t,e){let{y:n,height:s}=i;return t==="top"?n+=e:t==="bottom"?n-=s+e:n-=s/2,n}function lf(i,t,e,n){const{caretSize:s,caretPadding:o,cornerRadius:r}=i,{xAlign:a,yAlign:l}=e,c=s+o,{topLeft:h,topRight:d,bottomLeft:u,bottomRight:f}=ss(r);let m=qA(t,a);const x=XA(t,l,c);return l==="center"?a==="left"?m+=c:a==="right"&&(m-=c):a==="left"?m-=Math.max(h,u)+s:a==="right"&&(m+=Math.max(d,f)+s),{x:Ue(m,0,n.width-t.width),y:Ue(x,0,n.height-t.height)}}function zr(i,t,e){const n=Xe(e.padding);return t==="center"?i.x+i.width/2:t==="right"?i.x+i.width-n.right:i.x+n.left}function cf(i){return Fn([],oi(i))}function $A(i,t,e){return Ni(i,{tooltip:t,tooltipItems:e,type:"tooltip"})}function hf(i,t){const e=t&&t.dataset&&t.dataset.tooltip&&t.dataset.tooltip.callbacks;return e?i.override(e):i}const pm={beforeTitle:ii,title(i){if(i.length>0){const t=i[0],e=t.chart.data.labels,n=e?e.length:0;if(this&&this.options&&this.options.mode==="dataset")return t.dataset.label||"";if(t.label)return t.label;if(n>0&&t.dataIndex<n)return e[t.dataIndex]}return""},afterTitle:ii,beforeBody:ii,beforeLabel:ii,label(i){if(this&&this.options&&this.options.mode==="dataset")return i.label+": "+i.formattedValue||i.formattedValue;let t=i.dataset.label||"";t&&(t+=": ");const e=i.formattedValue;return Yt(e)||(t+=e),t},labelColor(i){const e=i.chart.getDatasetMeta(i.datasetIndex).controller.getStyle(i.dataIndex);return{borderColor:e.borderColor,backgroundColor:e.backgroundColor,borderWidth:e.borderWidth,borderDash:e.borderDash,borderDashOffset:e.borderDashOffset,borderRadius:0}},labelTextColor(){return this.options.bodyColor},labelPointStyle(i){const e=i.chart.getDatasetMeta(i.datasetIndex).controller.getStyle(i.dataIndex);return{pointStyle:e.pointStyle,rotation:e.rotation}},afterLabel:ii,afterBody:ii,beforeFooter:ii,footer:ii,afterFooter:ii};function sn(i,t,e,n){const s=i[t].call(e,n);return typeof s>"u"?pm[t].call(e,n):s}class df extends gi{static positioners=Eo;constructor(t){super(),this.opacity=0,this._active=[],this._eventPosition=void 0,this._size=void 0,this._cachedAnimations=void 0,this._tooltipItems=[],this.$animations=void 0,this.$context=void 0,this.chart=t.chart,this.options=t.options,this.dataPoints=void 0,this.title=void 0,this.beforeBody=void 0,this.body=void 0,this.afterBody=void 0,this.footer=void 0,this.xAlign=void 0,this.yAlign=void 0,this.x=void 0,this.y=void 0,this.height=void 0,this.width=void 0,this.caretX=void 0,this.caretY=void 0,this.labelColors=void 0,this.labelPointStyles=void 0,this.labelTextColors=void 0}initialize(t){this.options=t,this._cachedAnimations=void 0,this.$context=void 0}_resolveAnimations(){const t=this._cachedAnimations;if(t)return t;const e=this.chart,n=this.options.setContext(this.getContext()),s=n.enabled&&e.options.animation&&n.animations,o=new Xp(this.chart,s);return s._cacheable&&(this._cachedAnimations=Object.freeze(o)),o}getContext(){return this.$context||(this.$context=$A(this.chart.getContext(),this,this._tooltipItems))}getTitle(t,e){const{callbacks:n}=e,s=sn(n,"beforeTitle",this,t),o=sn(n,"title",this,t),r=sn(n,"afterTitle",this,t);let a=[];return a=Fn(a,oi(s)),a=Fn(a,oi(o)),a=Fn(a,oi(r)),a}getBeforeBody(t,e){return cf(sn(e.callbacks,"beforeBody",this,t))}getBody(t,e){const{callbacks:n}=e,s=[];return ce(t,o=>{const r={before:[],lines:[],after:[]},a=hf(n,o);Fn(r.before,oi(sn(a,"beforeLabel",this,o))),Fn(r.lines,sn(a,"label",this,o)),Fn(r.after,oi(sn(a,"afterLabel",this,o))),s.push(r)}),s}getAfterBody(t,e){return cf(sn(e.callbacks,"afterBody",this,t))}getFooter(t,e){const{callbacks:n}=e,s=sn(n,"beforeFooter",this,t),o=sn(n,"footer",this,t),r=sn(n,"afterFooter",this,t);let a=[];return a=Fn(a,oi(s)),a=Fn(a,oi(o)),a=Fn(a,oi(r)),a}_createItems(t){const e=this._active,n=this.chart.data,s=[],o=[],r=[];let a=[],l,c;for(l=0,c=e.length;l<c;++l)a.push(VA(this.chart,e[l]));return t.filter&&(a=a.filter((h,d,u)=>t.filter(h,d,u,n))),t.itemSort&&(a=a.sort((h,d)=>t.itemSort(h,d,n))),ce(a,h=>{const d=hf(t.callbacks,h);s.push(sn(d,"labelColor",this,h)),o.push(sn(d,"labelPointStyle",this,h)),r.push(sn(d,"labelTextColor",this,h))}),this.labelColors=s,this.labelPointStyles=o,this.labelTextColors=r,this.dataPoints=a,a}update(t,e){const n=this.options.setContext(this.getContext()),s=this._active;let o,r=[];if(!s.length)this.opacity!==0&&(o={opacity:0});else{const a=Eo[n.position].call(this,s,this._eventPosition);r=this._createItems(n),this.title=this.getTitle(r,n),this.beforeBody=this.getBeforeBody(r,n),this.body=this.getBody(r,n),this.afterBody=this.getAfterBody(r,n),this.footer=this.getFooter(r,n);const l=this._size=rf(this,n),c=Object.assign({},a,l),h=af(this.chart,n,c),d=lf(n,c,h,this.chart);this.xAlign=h.xAlign,this.yAlign=h.yAlign,o={opacity:1,x:d.x,y:d.y,width:l.width,height:l.height,caretX:a.x,caretY:a.y}}this._tooltipItems=r,this.$context=void 0,o&&this._resolveAnimations().update(this,o),t&&n.external&&n.external.call(this,{chart:this.chart,tooltip:this,replay:e})}drawCaret(t,e,n,s){const o=this.getCaretPosition(t,n,s);e.lineTo(o.x1,o.y1),e.lineTo(o.x2,o.y2),e.lineTo(o.x3,o.y3)}getCaretPosition(t,e,n){const{xAlign:s,yAlign:o}=this,{caretSize:r,cornerRadius:a}=n,{topLeft:l,topRight:c,bottomLeft:h,bottomRight:d}=ss(a),{x:u,y:f}=t,{width:m,height:x}=e;let p,g,_,v,y,b;return o==="center"?(y=f+x/2,s==="left"?(p=u,g=p-r,v=y+r,b=y-r):(p=u+m,g=p+r,v=y-r,b=y+r),_=p):(s==="left"?g=u+Math.max(l,h)+r:s==="right"?g=u+m-Math.max(c,d)-r:g=this.caretX,o==="top"?(v=f,y=v-r,p=g-r,_=g+r):(v=f+x,y=v+r,p=g+r,_=g-r),b=v),{x1:p,x2:g,x3:_,y1:v,y2:y,y3:b}}drawTitle(t,e,n){const s=this.title,o=s.length;let r,a,l;if(o){const c=Bs(n.rtl,this.x,this.width);for(t.x=zr(this,n.titleAlign,n),e.textAlign=c.textAlign(n.titleAlign),e.textBaseline="middle",r=De(n.titleFont),a=n.titleSpacing,e.fillStyle=n.titleColor,e.font=r.string,l=0;l<o;++l)e.fillText(s[l],c.x(t.x),t.y+r.lineHeight/2),t.y+=r.lineHeight+a,l+1===o&&(t.y+=n.titleMarginBottom-a)}}_drawColorBox(t,e,n,s,o){const r=this.labelColors[n],a=this.labelPointStyles[n],{boxHeight:l,boxWidth:c}=o,h=De(o.bodyFont),d=zr(this,"left",o),u=s.x(d),f=l<h.lineHeight?(h.lineHeight-l)/2:0,m=e.y+f;if(o.usePointStyle){const x={radius:Math.min(c,l)/2,pointStyle:a.pointStyle,rotation:a.rotation,borderWidth:1},p=s.leftForLtr(u,c)+c/2,g=m+l/2;t.strokeStyle=o.multiKeyBackground,t.fillStyle=o.multiKeyBackground,Tc(t,x,p,g),t.strokeStyle=r.borderColor,t.fillStyle=r.backgroundColor,Tc(t,x,p,g)}else{t.lineWidth=Kt(r.borderWidth)?Math.max(...Object.values(r.borderWidth)):r.borderWidth||1,t.strokeStyle=r.borderColor,t.setLineDash(r.borderDash||[]),t.lineDashOffset=r.borderDashOffset||0;const x=s.leftForLtr(u,c),p=s.leftForLtr(s.xPlus(u,1),c-2),g=ss(r.borderRadius);Object.values(g).some(_=>_!==0)?(t.beginPath(),t.fillStyle=o.multiKeyBackground,Go(t,{x,y:m,w:c,h:l,radius:g}),t.fill(),t.stroke(),t.fillStyle=r.backgroundColor,t.beginPath(),Go(t,{x:p,y:m+1,w:c-2,h:l-2,radius:g}),t.fill()):(t.fillStyle=o.multiKeyBackground,t.fillRect(x,m,c,l),t.strokeRect(x,m,c,l),t.fillStyle=r.backgroundColor,t.fillRect(p,m+1,c-2,l-2))}t.fillStyle=this.labelTextColors[n]}drawBody(t,e,n){const{body:s}=this,{bodySpacing:o,bodyAlign:r,displayColors:a,boxHeight:l,boxWidth:c,boxPadding:h}=n,d=De(n.bodyFont);let u=d.lineHeight,f=0;const m=Bs(n.rtl,this.x,this.width),x=function(P){e.fillText(P,m.x(t.x+f),t.y+u/2),t.y+=u+o},p=m.textAlign(r);let g,_,v,y,b,w,T;for(e.textAlign=r,e.textBaseline="middle",e.font=d.string,t.x=zr(this,p,n),e.fillStyle=n.bodyColor,ce(this.beforeBody,x),f=a&&p!=="right"?r==="center"?c/2+h:c+2+h:0,y=0,w=s.length;y<w;++y){for(g=s[y],_=this.labelTextColors[y],e.fillStyle=_,ce(g.before,x),v=g.lines,a&&v.length&&(this._drawColorBox(e,t,y,m,n),u=Math.max(d.lineHeight,l)),b=0,T=v.length;b<T;++b)x(v[b]),u=d.lineHeight;ce(g.after,x)}f=0,u=d.lineHeight,ce(this.afterBody,x),t.y-=o}drawFooter(t,e,n){const s=this.footer,o=s.length;let r,a;if(o){const l=Bs(n.rtl,this.x,this.width);for(t.x=zr(this,n.footerAlign,n),t.y+=n.footerMarginTop,e.textAlign=l.textAlign(n.footerAlign),e.textBaseline="middle",r=De(n.footerFont),e.fillStyle=n.footerColor,e.font=r.string,a=0;a<o;++a)e.fillText(s[a],l.x(t.x),t.y+r.lineHeight/2),t.y+=r.lineHeight+n.footerSpacing}}drawBackground(t,e,n,s){const{xAlign:o,yAlign:r}=this,{x:a,y:l}=t,{width:c,height:h}=n,{topLeft:d,topRight:u,bottomLeft:f,bottomRight:m}=ss(s.cornerRadius);e.fillStyle=s.backgroundColor,e.strokeStyle=s.borderColor,e.lineWidth=s.borderWidth,e.beginPath(),e.moveTo(a+d,l),r==="top"&&this.drawCaret(t,e,n,s),e.lineTo(a+c-u,l),e.quadraticCurveTo(a+c,l,a+c,l+u),r==="center"&&o==="right"&&this.drawCaret(t,e,n,s),e.lineTo(a+c,l+h-m),e.quadraticCurveTo(a+c,l+h,a+c-m,l+h),r==="bottom"&&this.drawCaret(t,e,n,s),e.lineTo(a+f,l+h),e.quadraticCurveTo(a,l+h,a,l+h-f),r==="center"&&o==="left"&&this.drawCaret(t,e,n,s),e.lineTo(a,l+d),e.quadraticCurveTo(a,l,a+d,l),e.closePath(),e.fill(),s.borderWidth>0&&e.stroke()}_updateAnimationTarget(t){const e=this.chart,n=this.$animations,s=n&&n.x,o=n&&n.y;if(s||o){const r=Eo[t.position].call(this,this._active,this._eventPosition);if(!r)return;const a=this._size=rf(this,t),l=Object.assign({},r,this._size),c=af(e,t,l),h=lf(t,l,c,e);(s._to!==h.x||o._to!==h.y)&&(this.xAlign=c.xAlign,this.yAlign=c.yAlign,this.width=a.width,this.height=a.height,this.caretX=r.x,this.caretY=r.y,this._resolveAnimations().update(this,h))}}_willRender(){return!!this.opacity}draw(t){const e=this.options.setContext(this.getContext());let n=this.opacity;if(!n)return;this._updateAnimationTarget(e);const s={width:this.width,height:this.height},o={x:this.x,y:this.y};n=Math.abs(n)<.001?0:n;const r=Xe(e.padding),a=this.title.length||this.beforeBody.length||this.body.length||this.afterBody.length||this.footer.length;e.enabled&&a&&(t.save(),t.globalAlpha=n,this.drawBackground(o,t,s,e),kp(t,e.textDirection),o.y+=r.top,this.drawTitle(o,t,e),this.drawBody(o,t,e),this.drawFooter(o,t,e),Vp(t,e.textDirection),t.restore())}getActiveElements(){return this._active||[]}setActiveElements(t,e){const n=this._active,s=t.map(({datasetIndex:a,index:l})=>{const c=this.chart.getDatasetMeta(a);if(!c)throw new Error("Cannot find a dataset at index "+a);return{datasetIndex:a,element:c.data[l],index:l}}),o=!oa(n,s),r=this._positionChanged(s,e);(o||r)&&(this._active=s,this._eventPosition=e,this._ignoreReplayEvents=!0,this.update(!0))}handleEvent(t,e,n=!0){if(e&&this._ignoreReplayEvents)return!1;this._ignoreReplayEvents=!1;const s=this.options,o=this._active||[],r=this._getActiveElements(t,o,e,n),a=this._positionChanged(r,t),l=e||!oa(r,o)||a;return l&&(this._active=r,(s.enabled||s.external)&&(this._eventPosition={x:t.x,y:t.y},this.update(!0,e))),l}_getActiveElements(t,e,n,s){const o=this.options;if(t.type==="mouseout")return[];if(!s)return e.filter(a=>this.chart.data.datasets[a.datasetIndex]&&this.chart.getDatasetMeta(a.datasetIndex).controller.getParsed(a.index)!==void 0);const r=this.chart.getElementsAtEventForMode(t,o.mode,o,n);return o.reverse&&r.reverse(),r}_positionChanged(t,e){const{caretX:n,caretY:s,options:o}=this,r=Eo[o.position].call(this,t,e);return r!==!1&&(n!==r.x||s!==r.y)}}var YA={id:"tooltip",_element:df,positioners:Eo,afterInit(i,t,e){e&&(i.tooltip=new df({chart:i,options:e}))},beforeUpdate(i,t,e){i.tooltip&&i.tooltip.initialize(e)},reset(i,t,e){i.tooltip&&i.tooltip.initialize(e)},afterDraw(i){const t=i.tooltip;if(t&&t._willRender()){const e={tooltip:t};if(i.notifyPlugins("beforeTooltipDraw",{...e,cancelable:!0})===!1)return;t.draw(i.ctx),i.notifyPlugins("afterTooltipDraw",e)}},afterEvent(i,t){if(i.tooltip){const e=t.replay;i.tooltip.handleEvent(t.event,e,t.inChartArea)&&(t.changed=!0)}},defaults:{enabled:!0,external:null,position:"average",backgroundColor:"rgba(0,0,0,0.8)",titleColor:"#fff",titleFont:{weight:"bold"},titleSpacing:2,titleMarginBottom:6,titleAlign:"left",bodyColor:"#fff",bodySpacing:2,bodyFont:{},bodyAlign:"left",footerColor:"#fff",footerSpacing:2,footerMarginTop:6,footerFont:{weight:"bold"},footerAlign:"left",padding:6,caretPadding:2,caretSize:5,cornerRadius:6,boxHeight:(i,t)=>t.bodyFont.size,boxWidth:(i,t)=>t.bodyFont.size,multiKeyBackground:"#fff",displayColors:!0,boxPadding:0,borderColor:"rgba(0,0,0,0)",borderWidth:0,animation:{duration:400,easing:"easeOutQuart"},animations:{numbers:{type:"number",properties:["x","y","width","height","caretX","caretY"]},opacity:{easing:"linear",duration:200}},callbacks:pm},defaultRoutes:{bodyFont:"font",footerFont:"font",titleFont:"font"},descriptors:{_scriptable:i=>i!=="filter"&&i!=="itemSort"&&i!=="external",_indexable:!1,callbacks:{_scriptable:!1,_indexable:!1},animation:{_fallback:!1},animations:{_fallback:"animation"}},additionalOptionScopes:["interaction"]},jA=Object.freeze({__proto__:null,Colors:aA,Decimation:dA,Filler:LA,Legend:UA,SubTitle:kA,Title:zA,Tooltip:YA});const KA=(i,t,e,n)=>(typeof t=="string"?(e=i.push(t)-1,n.unshift({index:e,label:t})):isNaN(t)&&(e=null),e);function ZA(i,t,e,n){const s=i.indexOf(t);if(s===-1)return KA(i,t,e,n);const o=i.lastIndexOf(t);return s!==o?e:s}const JA=(i,t)=>i===null?null:Ue(Math.round(i),0,t);function uf(i){const t=this.getLabels();return i>=0&&i<t.length?t[i]:i}class QA extends cs{static id="category";static defaults={ticks:{callback:uf}};constructor(t){super(t),this._startValue=void 0,this._valueRange=0,this._addedLabels=[]}init(t){const e=this._addedLabels;if(e.length){const n=this.getLabels();for(const{index:s,label:o}of e)n[s]===o&&n.splice(s,1);this._addedLabels=[]}super.init(t)}parse(t,e){if(Yt(t))return null;const n=this.getLabels();return e=isFinite(e)&&n[e]===t?e:ZA(n,t,kt(e,t),this._addedLabels),JA(e,n.length-1)}determineDataLimits(){const{minDefined:t,maxDefined:e}=this.getUserBounds();let{min:n,max:s}=this.getMinMax(!0);this.options.bounds==="ticks"&&(t||(n=0),e||(s=this.getLabels().length-1)),this.min=n,this.max=s}buildTicks(){const t=this.min,e=this.max,n=this.options.offset,s=[];let o=this.getLabels();o=t===0&&e===o.length-1?o:o.slice(t,e+1),this._valueRange=Math.max(o.length-(n?0:1),1),this._startValue=this.min-(n?.5:0);for(let r=t;r<=e;r++)s.push({value:r});return s}getLabelForValue(t){return uf.call(this,t)}configure(){super.configure(),this.isHorizontal()||(this._reversePixels=!this._reversePixels)}getPixelForValue(t){return typeof t!="number"&&(t=this.parse(t)),t===null?NaN:this.getPixelForDecimal((t-this._startValue)/this._valueRange)}getPixelForTick(t){const e=this.ticks;return t<0||t>e.length-1?null:this.getPixelForValue(e[t].value)}getValueForPixel(t){return Math.round(this._startValue+this.getDecimalForPixel(t)*this._valueRange)}getBasePixel(){return this.bottom}}function tC(i,t){const e=[],{bounds:s,step:o,min:r,max:a,precision:l,count:c,maxTicks:h,maxDigits:d,includeBounds:u}=i,f=o||1,m=h-1,{min:x,max:p}=t,g=!Yt(r),_=!Yt(a),v=!Yt(c),y=(p-x)/(d+1);let b=ou((p-x)/m/f)*f,w,T,P,M;if(b<1e-14&&!g&&!_)return[{value:x},{value:p}];M=Math.ceil(p/b)-Math.floor(x/b),M>m&&(b=ou(M*b/m/f)*f),Yt(l)||(w=Math.pow(10,l),b=Math.ceil(b*w)/w),s==="ticks"?(T=Math.floor(x/b)*b,P=Math.ceil(p/b)*b):(T=x,P=p),g&&_&&o&&Ow((a-r)/o,b/1e3)?(M=Math.round(Math.min((a-r)/b,h)),b=(a-r)/M,T=r,P=a):v?(T=g?r:T,P=_?a:P,M=c-1,b=(P-T)/M):(M=(P-T)/b,Lo(M,Math.round(M),b/1e3)?M=Math.round(M):M=Math.ceil(M));const E=Math.max(ru(b),ru(T));w=Math.pow(10,Yt(l)?E:l),T=Math.round(T*w)/w,P=Math.round(P*w)/w;let R=0;for(g&&(u&&T!==r?(e.push({value:r}),T<r&&R++,Lo(Math.round((T+R*b)*w)/w,r,ff(r,y,i))&&R++):T<r&&R++);R<M;++R){const N=Math.round((T+R*b)*w)/w;if(_&&N>a)break;e.push({value:N})}return _&&u&&P!==a?e.length&&Lo(e[e.length-1].value,a,ff(a,y,i))?e[e.length-1].value=a:e.push({value:a}):(!_||P===a)&&e.push({value:P}),e}function ff(i,t,{horizontal:e,minRotation:n}){const s=Cn(n),o=(e?Math.sin(s):Math.cos(s))||.001,r=.75*t*(""+i).length;return Math.min(t/o,r)}class ua extends cs{constructor(t){super(t),this.start=void 0,this.end=void 0,this._startValue=void 0,this._endValue=void 0,this._valueRange=0}parse(t,e){return Yt(t)||(typeof t=="number"||t instanceof Number)&&!isFinite(+t)?null:+t}handleTickRangeOptions(){const{beginAtZero:t}=this.options,{minDefined:e,maxDefined:n}=this.getUserBounds();let{min:s,max:o}=this;const r=l=>s=e?s:l,a=l=>o=n?o:l;if(t){const l=Hn(s),c=Hn(o);l<0&&c<0?a(0):l>0&&c>0&&r(0)}if(s===o){let l=o===0?1:Math.abs(o*.05);a(o+l),t||r(s-l)}this.min=s,this.max=o}getTickLimit(){const t=this.options.ticks;let{maxTicksLimit:e,stepSize:n}=t,s;return n?(s=Math.ceil(this.max/n)-Math.floor(this.min/n)+1,s>1e3&&(console.warn(`scales.${this.id}.ticks.stepSize: ${n} would result generating up to ${s} ticks. Limiting to 1000.`),s=1e3)):(s=this.computeTickLimit(),e=e||11),e&&(s=Math.min(e,s)),s}computeTickLimit(){return Number.POSITIVE_INFINITY}buildTicks(){const t=this.options,e=t.ticks;let n=this.getTickLimit();n=Math.max(2,n);const s={maxTicks:n,bounds:t.bounds,min:t.min,max:t.max,precision:e.precision,step:e.stepSize,count:e.count,maxDigits:this._maxDigits(),horizontal:this.isHorizontal(),minRotation:e.minRotation||0,includeBounds:e.includeBounds!==!1},o=this._range||this,r=tC(s,o);return t.bounds==="ticks"&&Sp(r,this,"value"),t.reverse?(r.reverse(),this.start=this.max,this.end=this.min):(this.start=this.min,this.end=this.max),r}configure(){const t=this.ticks;let e=this.min,n=this.max;if(super.configure(),this.options.offset&&t.length){const s=(n-e)/Math.max(t.length-1,1)/2;e-=s,n+=s}this._startValue=e,this._endValue=n,this._valueRange=n-e}getLabelForValue(t){return Ko(t,this.chart.options.locale,this.options.ticks.format)}}class eC extends ua{static id="linear";static defaults={ticks:{callback:_a.formatters.numeric}};determineDataLimits(){const{min:t,max:e}=this.getMinMax(!0);this.min=Ee(t)?t:0,this.max=Ee(e)?e:1,this.handleTickRangeOptions()}computeTickLimit(){const t=this.isHorizontal(),e=t?this.width:this.height,n=Cn(this.options.ticks.minRotation),s=(t?Math.sin(n):Math.cos(n))||.001,o=this._resolveTickFontOptions(0);return Math.ceil(e/Math.min(40,o.lineHeight/s))}getPixelForValue(t){return t===null?NaN:this.getPixelForDecimal((t-this._startValue)/this._valueRange)}getValueForPixel(t){return this._startValue+this.getDecimalForPixel(t)*this._valueRange}}const qo=i=>Math.floor(Ci(i)),ji=(i,t)=>Math.pow(10,qo(i)+t);function pf(i){return i/Math.pow(10,qo(i))===1}function mf(i,t,e){const n=Math.pow(10,e),s=Math.floor(i/n);return Math.ceil(t/n)-s}function nC(i,t){const e=t-i;let n=qo(e);for(;mf(i,t,n)>10;)n++;for(;mf(i,t,n)<10;)n--;return Math.min(n,qo(i))}function iC(i,{min:t,max:e}){t=fn(i.min,t);const n=[],s=qo(t);let o=nC(t,e),r=o<0?Math.pow(10,Math.abs(o)):1;const a=Math.pow(10,o),l=s>o?Math.pow(10,s):0,c=Math.round((t-l)*r)/r,h=Math.floor((t-l)/a/10)*a*10;let d=Math.floor((c-h)/Math.pow(10,o)),u=fn(i.min,Math.round((l+h+d*Math.pow(10,o))*r)/r);for(;u<e;)n.push({value:u,major:pf(u),significand:d}),d>=10?d=d<15?15:20:d++,d>=20&&(o++,d=2,r=o>=0?1:r),u=Math.round((l+h+d*Math.pow(10,o))*r)/r;const f=fn(i.max,u);return n.push({value:f,major:pf(f),significand:d}),n}class sC extends cs{static id="logarithmic";static defaults={ticks:{callback:_a.formatters.logarithmic,major:{enabled:!0}}};constructor(t){super(t),this.start=void 0,this.end=void 0,this._startValue=void 0,this._valueRange=0}parse(t,e){const n=ua.prototype.parse.apply(this,[t,e]);if(n===0){this._zero=!0;return}return Ee(n)&&n>0?n:null}determineDataLimits(){const{min:t,max:e}=this.getMinMax(!0);this.min=Ee(t)?Math.max(0,t):null,this.max=Ee(e)?Math.max(0,e):null,this.options.beginAtZero&&(this._zero=!0),this._zero&&this.min!==this._suggestedMin&&!Ee(this._userMin)&&(this.min=t===ji(this.min,0)?ji(this.min,-1):ji(this.min,0)),this.handleTickRangeOptions()}handleTickRangeOptions(){const{minDefined:t,maxDefined:e}=this.getUserBounds();let n=this.min,s=this.max;const o=a=>n=t?n:a,r=a=>s=e?s:a;n===s&&(n<=0?(o(1),r(10)):(o(ji(n,-1)),r(ji(s,1)))),n<=0&&o(ji(s,-1)),s<=0&&r(ji(n,1)),this.min=n,this.max=s}buildTicks(){const t=this.options,e={min:this._userMin,max:this._userMax},n=iC(e,this);return t.bounds==="ticks"&&Sp(n,this,"value"),t.reverse?(n.reverse(),this.start=this.max,this.end=this.min):(this.start=this.min,this.end=this.max),n}getLabelForValue(t){return t===void 0?"0":Ko(t,this.chart.options.locale,this.options.ticks.format)}configure(){const t=this.min;super.configure(),this._startValue=Ci(t),this._valueRange=Ci(this.max)-Ci(t)}getPixelForValue(t){return(t===void 0||t===0)&&(t=this.min),t===null||isNaN(t)?NaN:this.getPixelForDecimal(t===this.min?0:(Ci(t)-this._startValue)/this._valueRange)}getValueForPixel(t){const e=this.getDecimalForPixel(t);return Math.pow(10,this._startValue+e*this._valueRange)}}function Dc(i){const t=i.ticks;if(t.display&&i.display){const e=Xe(t.backdropPadding);return kt(t.font&&t.font.size,ye.font.size)+e.height}return 0}function oC(i,t,e){return e=ve(e)?e:[e],{w:Qw(i,t.string,e),h:e.length*t.lineHeight}}function gf(i,t,e,n,s){return i===n||i===s?{start:t-e/2,end:t+e/2}:i<n||i>s?{start:t-e,end:t}:{start:t,end:t+e}}function rC(i){const t={l:i.left+i._padding.left,r:i.right-i._padding.right,t:i.top+i._padding.top,b:i.bottom-i._padding.bottom},e=Object.assign({},t),n=[],s=[],o=i._pointLabels.length,r=i.options.pointLabels,a=r.centerPointLabels?ee/o:0;for(let l=0;l<o;l++){const c=r.setContext(i.getPointLabelContext(l));s[l]=c.padding;const h=i.getPointPosition(l,i.drawingArea+s[l],a),d=De(c.font),u=oC(i.ctx,d,i._pointLabels[l]);n[l]=u;const f=Ge(i.getIndexAngle(l)+a),m=Math.round(sh(f)),x=gf(m,h.x,u.w,0,180),p=gf(m,h.y,u.h,90,270);aC(e,t,f,x,p)}i.setCenterPoint(t.l-e.l,e.r-t.r,t.t-e.t,e.b-t.b),i._pointLabelItems=hC(i,n,s)}function aC(i,t,e,n,s){const o=Math.abs(Math.sin(e)),r=Math.abs(Math.cos(e));let a=0,l=0;n.start<t.l?(a=(t.l-n.start)/o,i.l=Math.min(i.l,t.l-a)):n.end>t.r&&(a=(n.end-t.r)/o,i.r=Math.max(i.r,t.r+a)),s.start<t.t?(l=(t.t-s.start)/r,i.t=Math.min(i.t,t.t-l)):s.end>t.b&&(l=(s.end-t.b)/r,i.b=Math.max(i.b,t.b+l))}function lC(i,t,e){const n=i.drawingArea,{extra:s,additionalAngle:o,padding:r,size:a}=e,l=i.getPointPosition(t,n+s+r,o),c=Math.round(sh(Ge(l.angle+Ae))),h=fC(l.y,a.h,c),d=dC(c),u=uC(l.x,a.w,d);return{visible:!0,x:l.x,y:h,textAlign:d,left:u,top:h,right:u+a.w,bottom:h+a.h}}function cC(i,t){if(!t)return!0;const{left:e,top:n,right:s,bottom:o}=i;return!(di({x:e,y:n},t)||di({x:e,y:o},t)||di({x:s,y:n},t)||di({x:s,y:o},t))}function hC(i,t,e){const n=[],s=i._pointLabels.length,o=i.options,{centerPointLabels:r,display:a}=o.pointLabels,l={extra:Dc(o)/2,additionalAngle:r?ee/s:0};let c;for(let h=0;h<s;h++){l.padding=e[h],l.size=t[h];const d=lC(i,h,l);n.push(d),a==="auto"&&(d.visible=cC(d,c),d.visible&&(c=d))}return n}function dC(i){return i===0||i===180?"center":i<180?"left":"right"}function uC(i,t,e){return e==="right"?i-=t:e==="center"&&(i-=t/2),i}function fC(i,t,e){return e===90||e===270?i-=t/2:(e>270||e<90)&&(i-=t),i}function pC(i,t,e){const{left:n,top:s,right:o,bottom:r}=e,{backdropColor:a}=t;if(!Yt(a)){const l=ss(t.borderRadius),c=Xe(t.backdropPadding);i.fillStyle=a;const h=n-c.left,d=s-c.top,u=o-n+c.width,f=r-s+c.height;Object.values(l).some(m=>m!==0)?(i.beginPath(),Go(i,{x:h,y:d,w:u,h:f,radius:l}),i.fill()):i.fillRect(h,d,u,f)}}function mC(i,t){const{ctx:e,options:{pointLabels:n}}=i;for(let s=t-1;s>=0;s--){const o=i._pointLabelItems[s];if(!o.visible)continue;const r=n.setContext(i.getPointLabelContext(s));pC(e,r,o);const a=De(r.font),{x:l,y:c,textAlign:h}=o;ls(e,i._pointLabels[s],l,c+a.lineHeight/2,a,{color:r.color,textAlign:h,textBaseline:"middle"})}}function mm(i,t,e,n){const{ctx:s}=i;if(e)s.arc(i.xCenter,i.yCenter,t,0,_e);else{let o=i.getPointPosition(0,t);s.moveTo(o.x,o.y);for(let r=1;r<n;r++)o=i.getPointPosition(r,t),s.lineTo(o.x,o.y)}}function gC(i,t,e,n,s){const o=i.ctx,r=t.circular,{color:a,lineWidth:l}=t;!r&&!n||!a||!l||e<0||(o.save(),o.strokeStyle=a,o.lineWidth=l,o.setLineDash(s.dash||[]),o.lineDashOffset=s.dashOffset,o.beginPath(),mm(i,e,r,n),o.closePath(),o.stroke(),o.restore())}function xC(i,t,e){return Ni(i,{label:e,index:t,type:"pointLabel"})}class _C extends ua{static id="radialLinear";static defaults={display:!0,animate:!0,position:"chartArea",angleLines:{display:!0,lineWidth:1,borderDash:[],borderDashOffset:0},grid:{circular:!1},startAngle:0,ticks:{showLabelBackdrop:!0,callback:_a.formatters.numeric},pointLabels:{backdropColor:void 0,backdropPadding:2,display:!0,font:{size:10},callback(t){return t},padding:5,centerPointLabels:!1}};static defaultRoutes={"angleLines.color":"borderColor","pointLabels.color":"color","ticks.color":"color"};static descriptors={angleLines:{_fallback:"grid"}};constructor(t){super(t),this.xCenter=void 0,this.yCenter=void 0,this.drawingArea=void 0,this._pointLabels=[],this._pointLabelItems=[]}setDimensions(){const t=this._padding=Xe(Dc(this.options)/2),e=this.width=this.maxWidth-t.width,n=this.height=this.maxHeight-t.height;this.xCenter=Math.floor(this.left+e/2+t.left),this.yCenter=Math.floor(this.top+n/2+t.top),this.drawingArea=Math.floor(Math.min(e,n)/2)}determineDataLimits(){const{min:t,max:e}=this.getMinMax(!1);this.min=Ee(t)&&!isNaN(t)?t:0,this.max=Ee(e)&&!isNaN(e)?e:0,this.handleTickRangeOptions()}computeTickLimit(){return Math.ceil(this.drawingArea/Dc(this.options))}generateTickLabels(t){ua.prototype.generateTickLabels.call(this,t),this._pointLabels=this.getLabels().map((e,n)=>{const s=ge(this.options.pointLabels.callback,[e,n],this);return s||s===0?s:""}).filter((e,n)=>this.chart.getDataVisibility(n))}fit(){const t=this.options;t.display&&t.pointLabels.display?rC(this):this.setCenterPoint(0,0,0,0)}setCenterPoint(t,e,n,s){this.xCenter+=Math.floor((t-e)/2),this.yCenter+=Math.floor((n-s)/2),this.drawingArea-=Math.min(this.drawingArea/2,Math.max(t,e,n,s))}getIndexAngle(t){const e=_e/(this._pointLabels.length||1),n=this.options.startAngle||0;return Ge(t*e+Cn(n))}getDistanceFromCenterForValue(t){if(Yt(t))return NaN;const e=this.drawingArea/(this.max-this.min);return this.options.reverse?(this.max-t)*e:(t-this.min)*e}getValueForDistanceFromCenter(t){if(Yt(t))return NaN;const e=t/(this.drawingArea/(this.max-this.min));return this.options.reverse?this.max-e:this.min+e}getPointLabelContext(t){const e=this._pointLabels||[];if(t>=0&&t<e.length){const n=e[t];return xC(this.getContext(),t,n)}}getPointPosition(t,e,n=0){const s=this.getIndexAngle(t)-Ae+n;return{x:Math.cos(s)*e+this.xCenter,y:Math.sin(s)*e+this.yCenter,angle:s}}getPointPositionForValue(t,e){return this.getPointPosition(t,this.getDistanceFromCenterForValue(e))}getBasePosition(t){return this.getPointPositionForValue(t||0,this.getBaseValue())}getPointLabelPosition(t){const{left:e,top:n,right:s,bottom:o}=this._pointLabelItems[t];return{left:e,top:n,right:s,bottom:o}}drawBackground(){const{backgroundColor:t,grid:{circular:e}}=this.options;if(t){const n=this.ctx;n.save(),n.beginPath(),mm(this,this.getDistanceFromCenterForValue(this._endValue),e,this._pointLabels.length),n.closePath(),n.fillStyle=t,n.fill(),n.restore()}}drawGrid(){const t=this.ctx,e=this.options,{angleLines:n,grid:s,border:o}=e,r=this._pointLabels.length;let a,l,c;if(e.pointLabels.display&&mC(this,r),s.display&&this.ticks.forEach((h,d)=>{if(d!==0||d===0&&this.min<0){l=this.getDistanceFromCenterForValue(h.value);const u=this.getContext(d),f=s.setContext(u),m=o.setContext(u);gC(this,f,l,r,m)}}),n.display){for(t.save(),a=r-1;a>=0;a--){const h=n.setContext(this.getPointLabelContext(a)),{color:d,lineWidth:u}=h;!u||!d||(t.lineWidth=u,t.strokeStyle=d,t.setLineDash(h.borderDash),t.lineDashOffset=h.borderDashOffset,l=this.getDistanceFromCenterForValue(e.reverse?this.min:this.max),c=this.getPointPosition(a,l),t.beginPath(),t.moveTo(this.xCenter,this.yCenter),t.lineTo(c.x,c.y),t.stroke())}t.restore()}}drawBorder(){}drawLabels(){const t=this.ctx,e=this.options,n=e.ticks;if(!n.display)return;const s=this.getIndexAngle(0);let o,r;t.save(),t.translate(this.xCenter,this.yCenter),t.rotate(s),t.textAlign="center",t.textBaseline="middle",this.ticks.forEach((a,l)=>{if(l===0&&this.min>=0&&!e.reverse)return;const c=n.setContext(this.getContext(l)),h=De(c.font);if(o=this.getDistanceFromCenterForValue(this.ticks[l].value),c.showLabelBackdrop){t.font=h.string,r=t.measureText(a.label).width,t.fillStyle=c.backdropColor;const d=Xe(c.backdropPadding);t.fillRect(-r/2-d.left,-o-h.size/2-d.top,r+d.width,h.size+d.height)}ls(t,a.label,0,-o,h,{color:c.color,strokeColor:c.textStrokeColor,strokeWidth:c.textStrokeWidth})}),t.restore()}drawTitle(){}}const Ea={millisecond:{common:!0,size:1,steps:1e3},second:{common:!0,size:1e3,steps:60},minute:{common:!0,size:6e4,steps:60},hour:{common:!0,size:36e5,steps:24},day:{common:!0,size:864e5,steps:30},week:{common:!1,size:6048e5,steps:4},month:{common:!0,size:2628e6,steps:12},quarter:{common:!1,size:7884e6,steps:4},year:{common:!0,size:3154e7}},rn=Object.keys(Ea);function xf(i,t){return i-t}function _f(i,t){if(Yt(t))return null;const e=i._adapter,{parser:n,round:s,isoWeekday:o}=i._parseOpts;let r=t;return typeof n=="function"&&(r=n(r)),Ee(r)||(r=typeof n=="string"?e.parse(r,n):e.parse(r)),r===null?null:(s&&(r=s==="week"&&($s(o)||o===!0)?e.startOf(r,"isoWeek",o):e.startOf(r,s)),+r)}function vf(i,t,e,n){const s=rn.length;for(let o=rn.indexOf(i);o<s-1;++o){const r=Ea[rn[o]],a=r.steps?r.steps:Number.MAX_SAFE_INTEGER;if(r.common&&Math.ceil((e-t)/(a*r.size))<=n)return rn[o]}return rn[s-1]}function vC(i,t,e,n,s){for(let o=rn.length-1;o>=rn.indexOf(e);o--){const r=rn[o];if(Ea[r].common&&i._adapter.diff(s,n,r)>=t-1)return r}return rn[e?rn.indexOf(e):0]}function yC(i){for(let t=rn.indexOf(i)+1,e=rn.length;t<e;++t)if(Ea[rn[t]].common)return rn[t]}function yf(i,t,e){if(!e)i[t]=!0;else if(e.length){const{lo:n,hi:s}=oh(e,t),o=e[n]>=t?e[n]:e[s];i[o]=!0}}function bC(i,t,e,n){const s=i._adapter,o=+s.startOf(t[0].value,n),r=t[t.length-1].value;let a,l;for(a=o;a<=r;a=+s.add(a,1,n))l=e[a],l>=0&&(t[l].major=!0);return t}function bf(i,t,e){const n=[],s={},o=t.length;let r,a;for(r=0;r<o;++r)a=t[r],s[a]=r,n.push({value:a,major:!1});return o===0||!e?n:bC(i,n,s,e)}class Ic extends cs{static id="time";static defaults={bounds:"data",adapters:{},time:{parser:!1,unit:!1,round:!1,isoWeekday:!1,minUnit:"millisecond",displayFormats:{}},ticks:{source:"auto",callback:!1,major:{enabled:!1}}};constructor(t){super(t),this._cache={data:[],labels:[],all:[]},this._unit="day",this._majorUnit=void 0,this._offsets={},this._normalized=!1,this._parseOpts=void 0}init(t,e={}){const n=t.time||(t.time={}),s=this._adapter=new MT._date(t.adapters.date);s.init(e),Po(n.displayFormats,s.formats()),this._parseOpts={parser:n.parser,round:n.round,isoWeekday:n.isoWeekday},super.init(t),this._normalized=e.normalized}parse(t,e){return t===void 0?null:_f(this,t)}beforeLayout(){super.beforeLayout(),this._cache={data:[],labels:[],all:[]}}determineDataLimits(){const t=this.options,e=this._adapter,n=t.time.unit||"day";let{min:s,max:o,minDefined:r,maxDefined:a}=this.getUserBounds();function l(c){!r&&!isNaN(c.min)&&(s=Math.min(s,c.min)),!a&&!isNaN(c.max)&&(o=Math.max(o,c.max))}(!r||!a)&&(l(this._getLabelBounds()),(t.bounds!=="ticks"||t.ticks.source!=="labels")&&l(this.getMinMax(!1))),s=Ee(s)&&!isNaN(s)?s:+e.startOf(Date.now(),n),o=Ee(o)&&!isNaN(o)?o:+e.endOf(Date.now(),n)+1,this.min=Math.min(s,o-1),this.max=Math.max(s+1,o)}_getLabelBounds(){const t=this.getLabelTimestamps();let e=Number.POSITIVE_INFINITY,n=Number.NEGATIVE_INFINITY;return t.length&&(e=t[0],n=t[t.length-1]),{min:e,max:n}}buildTicks(){const t=this.options,e=t.time,n=t.ticks,s=n.source==="labels"?this.getLabelTimestamps():this._generate();t.bounds==="ticks"&&s.length&&(this.min=this._userMin||s[0],this.max=this._userMax||s[s.length-1]);const o=this.min,r=this.max,a=kw(s,o,r);return this._unit=e.unit||(n.autoSkip?vf(e.minUnit,this.min,this.max,this._getLabelCapacity(o)):vC(this,a.length,e.minUnit,this.min,this.max)),this._majorUnit=!n.major.enabled||this._unit==="year"?void 0:yC(this._unit),this.initOffsets(s),t.reverse&&a.reverse(),bf(this,a,this._majorUnit)}afterAutoSkip(){this.options.offsetAfterAutoskip&&this.initOffsets(this.ticks.map(t=>+t.value))}initOffsets(t=[]){let e=0,n=0,s,o;this.options.offset&&t.length&&(s=this.getDecimalForValue(t[0]),t.length===1?e=1-s:e=(this.getDecimalForValue(t[1])-s)/2,o=this.getDecimalForValue(t[t.length-1]),t.length===1?n=o:n=(o-this.getDecimalForValue(t[t.length-2]))/2);const r=t.length<3?.5:.25;e=Ue(e,0,r),n=Ue(n,0,r),this._offsets={start:e,end:n,factor:1/(e+1+n)}}_generate(){const t=this._adapter,e=this.min,n=this.max,s=this.options,o=s.time,r=o.unit||vf(o.minUnit,e,n,this._getLabelCapacity(e)),a=kt(s.ticks.stepSize,1),l=r==="week"?o.isoWeekday:!1,c=$s(l)||l===!0,h={};let d=e,u,f;if(c&&(d=+t.startOf(d,"isoWeek",l)),d=+t.startOf(d,c?"day":r),t.diff(n,e,r)>1e5*a)throw new Error(e+" and "+n+" are too far apart with stepSize of "+a+" "+r);const m=s.ticks.source==="data"&&this.getDataTimestamps();for(u=d,f=0;u<n;u=+t.add(u,a,r),f++)yf(h,u,m);return(u===n||s.bounds==="ticks"||f===1)&&yf(h,u,m),Object.keys(h).sort(xf).map(x=>+x)}getLabelForValue(t){const e=this._adapter,n=this.options.time;return n.tooltipFormat?e.format(t,n.tooltipFormat):e.format(t,n.displayFormats.datetime)}format(t,e){const s=this.options.time.displayFormats,o=this._unit,r=e||s[o];return this._adapter.format(t,r)}_tickFormatFunction(t,e,n,s){const o=this.options,r=o.ticks.callback;if(r)return ge(r,[t,e,n],this);const a=o.time.displayFormats,l=this._unit,c=this._majorUnit,h=l&&a[l],d=c&&a[c],u=n[e],f=c&&d&&u&&u.major;return this._adapter.format(t,s||(f?d:h))}generateTickLabels(t){let e,n,s;for(e=0,n=t.length;e<n;++e)s=t[e],s.label=this._tickFormatFunction(s.value,e,t)}getDecimalForValue(t){return t===null?NaN:(t-this.min)/(this.max-this.min)}getPixelForValue(t){const e=this._offsets,n=this.getDecimalForValue(t);return this.getPixelForDecimal((e.start+n)*e.factor)}getValueForPixel(t){const e=this._offsets,n=this.getDecimalForPixel(t)/e.factor-e.end;return this.min+n*(this.max-this.min)}_getLabelSize(t){const e=this.options.ticks,n=this.ctx.measureText(t).width,s=Cn(this.isHorizontal()?e.maxRotation:e.minRotation),o=Math.cos(s),r=Math.sin(s),a=this._resolveTickFontOptions(0).size;return{w:n*o+a*r,h:n*r+a*o}}_getLabelCapacity(t){const e=this.options.time,n=e.displayFormats,s=n[e.unit]||n.millisecond,o=this._tickFormatFunction(t,0,bf(this,[t],this._majorUnit),s),r=this._getLabelSize(o),a=Math.floor(this.isHorizontal()?this.width/r.w:this.height/r.h)-1;return a>0?a:1}getDataTimestamps(){let t=this._cache.data||[],e,n;if(t.length)return t;const s=this.getMatchingVisibleMetas();if(this._normalized&&s.length)return this._cache.data=s[0].controller.getAllParsedValues(this);for(e=0,n=s.length;e<n;++e)t=t.concat(s[e].controller.getAllParsedValues(this));return this._cache.data=this.normalize(t)}getLabelTimestamps(){const t=this._cache.labels||[];let e,n;if(t.length)return t;const s=this.getLabels();for(e=0,n=s.length;e<n;++e)t.push(_f(this,s[e]));return this._cache.labels=this._normalized?t:this.normalize(t)}normalize(t){return Tp(t.sort(xf))}}function kr(i,t,e){let n=0,s=i.length-1,o,r,a,l;e?(t>=i[n].pos&&t<=i[s].pos&&({lo:n,hi:s}=hi(i,"pos",t)),{pos:o,time:a}=i[n],{pos:r,time:l}=i[s]):(t>=i[n].time&&t<=i[s].time&&({lo:n,hi:s}=hi(i,"time",t)),{time:o,pos:a}=i[n],{time:r,pos:l}=i[s]);const c=r-o;return c?a+(l-a)*(t-o)/c:a}class MC extends Ic{static id="timeseries";static defaults=Ic.defaults;constructor(t){super(t),this._table=[],this._minPos=void 0,this._tableRange=void 0}initOffsets(){const t=this._getTimestampsForTable(),e=this._table=this.buildLookupTable(t);this._minPos=kr(e,this.min),this._tableRange=kr(e,this.max)-this._minPos,super.initOffsets(t)}buildLookupTable(t){const{min:e,max:n}=this,s=[],o=[];let r,a,l,c,h;for(r=0,a=t.length;r<a;++r)c=t[r],c>=e&&c<=n&&s.push(c);if(s.length<2)return[{time:e,pos:0},{time:n,pos:1}];for(r=0,a=s.length;r<a;++r)h=s[r+1],l=s[r-1],c=s[r],Math.round((h+l)/2)!==c&&o.push({time:c,pos:r/(a-1)});return o}_generate(){const t=this.min,e=this.max;let n=super.getDataTimestamps();return(!n.includes(t)||!n.length)&&n.splice(0,0,t),(!n.includes(e)||n.length===1)&&n.push(e),n.sort((s,o)=>s-o)}_getTimestampsForTable(){let t=this._cache.all||[];if(t.length)return t;const e=this.getDataTimestamps(),n=this.getLabelTimestamps();return e.length&&n.length?t=this.normalize(e.concat(n)):t=e.length?e:n,t=this._cache.all=t,t}getDecimalForValue(t){return(kr(this._table,t)-this._minPos)/this._tableRange}getValueForPixel(t){const e=this._offsets,n=this.getDecimalForPixel(t)/e.factor-e.end;return kr(this._table,n*this._tableRange+this._minPos,!0)}}var SC=Object.freeze({__proto__:null,CategoryScale:QA,LinearScale:eC,LogarithmicScale:sC,RadialLinearScale:_C,TimeScale:Ic,TimeSeriesScale:MC});const wC=[bT,tA,jA,SC];gh.register(...wC);class EC{container;canvas;chart=null;isVisible=!1;constructor(){this.container=document.createElement("div"),this.container.id="graph-panel",this.container.style.cssText=`
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 380px;
      height: 280px;
      background: rgba(15, 15, 20, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 16px;
      display: none;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      z-index: 100;
    `;const t=document.createElement("div");t.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;const e=document.createElement("span");e.style.cssText=`
      color: #f8fafc;
      font-size: 14px;
      font-weight: 600;
    `,e.textContent="Fitness Over Generations";const n=document.createElement("button");n.innerHTML="&times;",n.style.cssText=`
      background: none;
      border: none;
      color: #7a8494;
      font-size: 20px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
      transition: color 0.2s;
    `,n.addEventListener("mouseenter",()=>{n.style.color="#f8fafc"}),n.addEventListener("mouseleave",()=>{n.style.color="#7a8494"}),n.addEventListener("click",()=>this.hide()),t.appendChild(e),t.appendChild(n);const s=document.createElement("div");s.style.cssText=`
      width: 100%;
      height: calc(100% - 40px);
      position: relative;
    `,this.canvas=document.createElement("canvas"),this.canvas.id="fitness-chart",s.appendChild(this.canvas),this.container.appendChild(t),this.container.appendChild(s),document.body.appendChild(this.container),this.initChart()}initChart(){const t={type:"line",data:{labels:[],datasets:[{label:"Best",data:[],borderColor:"#10b981",backgroundColor:"rgba(16, 185, 129, 0.1)",fill:!1,tension:.3,pointRadius:4,pointBackgroundColor:"#10b981",borderWidth:2},{label:"Average",data:[],borderColor:"#6366f1",backgroundColor:"rgba(99, 102, 241, 0.1)",fill:!1,tension:.3,pointRadius:3,pointBackgroundColor:"#6366f1",borderWidth:2},{label:"Worst",data:[],borderColor:"#ef4444",backgroundColor:"rgba(239, 68, 68, 0.1)",fill:!1,tension:.3,pointRadius:3,pointBackgroundColor:"#ef4444",borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top",align:"end",labels:{color:"#b8c0cc",boxWidth:12,boxHeight:12,padding:12,font:{size:11,weight:500},usePointStyle:!0,pointStyle:"circle"}},tooltip:{backgroundColor:"rgba(15, 15, 20, 0.95)",titleColor:"#f8fafc",bodyColor:"#b8c0cc",borderColor:"rgba(255, 255, 255, 0.2)",borderWidth:1,padding:12,cornerRadius:8,displayColors:!0,boxPadding:4}},scales:{x:{title:{display:!0,text:"Generation",color:"#7a8494",font:{size:11,weight:500}},ticks:{color:"#7a8494",font:{size:10}},grid:{color:"rgba(255, 255, 255, 0.05)"},border:{display:!1}},y:{title:{display:!0,text:"Fitness",color:"#7a8494",font:{size:11,weight:500}},ticks:{color:"#7a8494",font:{size:10}},grid:{color:"rgba(255, 255, 255, 0.05)"},border:{display:!1},beginAtZero:!0}},animation:{duration:300}}};this.chart=new gh(this.canvas,t)}updateData(t){if(!this.chart)return;const e=t.map(r=>r.generation.toString()),n=t.map(r=>r.best),s=t.map(r=>r.average),o=t.map(r=>r.worst);this.chart.data.labels=e,this.chart.data.datasets[0].data=n,this.chart.data.datasets[1].data=s,this.chart.data.datasets[2].data=o,this.chart.update("none")}show(){this.isVisible=!0,this.container.style.display="block"}hide(){this.isVisible=!1,this.container.style.display="none"}toggle(){this.isVisible?this.hide():this.show()}isShowing(){return this.isVisible}dispose(){this.chart&&this.chart.destroy(),this.container.remove()}}class TC{db=null;currentRunId=null;dbName="EvolutionLabDB";dbVersion=1;async init(){return new Promise((t,e)=>{const n=indexedDB.open(this.dbName,this.dbVersion);n.onerror=()=>e(n.error),n.onsuccess=()=>{this.db=n.result,t()},n.onupgradeneeded=s=>{const o=s.target.result;o.objectStoreNames.contains("runs")||o.createObjectStore("runs",{keyPath:"id"}),o.objectStoreNames.contains("generations")||o.createObjectStore("generations",{keyPath:["runId","generation"]}).createIndex("runId","runId",{unique:!1})}})}async createRun(t){const e=`run_${Date.now()}`;this.currentRunId=e;const n={id:e,startTime:Date.now(),config:{...t},generationCount:0};return await this.putRun(n),e}getCurrentRunId(){return this.currentRunId}setCurrentRunId(t){this.currentRunId=t}async putRun(t){return new Promise((e,n)=>{if(!this.db)return n(new Error("DB not initialized"));const r=this.db.transaction("runs","readwrite").objectStore("runs").put(t);r.onsuccess=()=>e(),r.onerror=()=>n(r.error)})}async saveGeneration(t,e){if(!this.db||!this.currentRunId)return;const n=e.map(r=>({genome:r.genome,fitness:Math.round(r.finalFitness*1e3)/1e3,pellets:r.pelletsCollected,disqualified:r.disqualified,frames:this.compactFrames(r.frames,r.genome),pelletData:r.pellets.map(a=>({position:{x:Math.round(a.position.x*1e3)/1e3,y:Math.round(a.position.y*1e3)/1e3,z:Math.round(a.position.z*1e3)/1e3},collectedAtFrame:a.collectedAtFrame}))})),s={runId:this.currentRunId,generation:t,results:n};await this.putGeneration(s);const o=await this.getRun(this.currentRunId);o&&(o.generationCount=t+1,await this.putRun(o))}compactFrames(t,e){const n=e.nodes.map(s=>s.id);return t.map(s=>{const o=[Math.round(s.time*1e3)/1e3];for(const r of n){const a=s.nodePositions.get(r);a?o.push(Math.round(a.x*1e3)/1e3,Math.round(a.y*1e3)/1e3,Math.round(a.z*1e3)/1e3):o.push(0,0,0)}return o})}expandFrames(t,e){const n=e.nodes.map(s=>s.id);return t.map(s=>{const o=new Map;for(let h=0;h<n.length;h++)o.set(n[h],{x:s[1+h*3],y:s[1+h*3+1],z:s[1+h*3+2]});let r=0,a=0,l=0;o.forEach(h=>{r+=h.x,a+=h.y,l+=h.z});const c=o.size||1;return{time:s[0],nodePositions:o,centerOfMass:{x:r/c,y:a/c,z:l/c},activePelletIndex:0}})}async putGeneration(t){return new Promise((e,n)=>{if(!this.db)return n(new Error("DB not initialized"));const r=this.db.transaction("generations","readwrite").objectStore("generations").put(t);r.onsuccess=()=>e(),r.onerror=()=>n(r.error)})}async loadGeneration(t,e){return new Promise((n,s)=>{if(!this.db)return s(new Error("DB not initialized"));const a=this.db.transaction("generations","readonly").objectStore("generations").get([t,e]);a.onsuccess=()=>{const l=a.result;if(!l)return n(null);const c=l.results.map(h=>({genome:h.genome,frames:this.expandFrames(h.frames,h.genome),finalFitness:h.fitness,pelletsCollected:h.pellets,distanceTraveled:0,netDisplacement:0,closestPelletDistance:0,pellets:h.pelletData.map((d,u)=>({id:`pellet_${u}`,position:d.position,collectedAtFrame:d.collectedAtFrame,spawnedAtFrame:0})),fitnessOverTime:[],disqualified:h.disqualified}));n(c)},a.onerror=()=>s(a.error)})}async getRun(t){return new Promise((e,n)=>{if(!this.db)return n(new Error("DB not initialized"));const r=this.db.transaction("runs","readonly").objectStore("runs").get(t);r.onsuccess=()=>e(r.result||null),r.onerror=()=>n(r.error)})}async getAllRuns(){return new Promise((t,e)=>{if(!this.db)return e(new Error("DB not initialized"));const o=this.db.transaction("runs","readonly").objectStore("runs").getAll();o.onsuccess=()=>{const r=o.result;r.sort((a,l)=>l.startTime-a.startTime),t(r)},o.onerror=()=>e(o.error)})}async deleteRun(t){this.db&&(await new Promise((e,n)=>{const a=this.db.transaction("generations","readwrite").objectStore("generations").index("runId").openCursor(IDBKeyRange.only(t));a.onsuccess=()=>{const l=a.result;l?(l.delete(),l.continue()):e()},a.onerror=()=>n(a.error)}),await new Promise((e,n)=>{const r=this.db.transaction("runs","readwrite").objectStore("runs").delete(t);r.onsuccess=()=>e(),r.onerror=()=>n(r.error)}))}async updateRunThumbnail(t){if(!this.currentRunId)return;const e=await this.getRun(this.currentRunId);e&&(e.thumbnail=t,await this.putRun(e))}async getMaxGeneration(t){const e=await this.getRun(t);return e?e.generationCount-1:-1}}const Ye=new TC,Vr=10,Mf=10,wi=80,Hr=8;class AC{container;state="menu";evolutionStep="idle";sharedRenderer=null;sharedScene=null;sharedCamera=null;previewScene=null;previewCamera=null;previewRenderer=null;previewCreature=null;previewGenome=null;previewTime=0;replayScene=null;replayCamera=null;replayRenderer=null;replayCreature=null;replayPellets=[];replayPelletLines=[];population=null;simulationResults=[];generation=0;fitnessHistory=[];viewingGeneration=null;maxGeneration=0;bestCreatureEver=null;bestCreatureGeneration=0;longestSurvivingCreature=null;longestSurvivingGenerations=0;creatureCards=[];gridContainer=null;graphPanel=null;config={...ia,simulationDuration:8,pelletCount:5,gravity:-9.8,mutationRate:.1};menuScreen=null;gridUI=null;statsPanel=null;controlPanel=null;progressContainer=null;tooltip=null;replayModal=null;stepIndicator=null;loadRunsModal=null;selectedResult=null;replayFrame=0;isReplaying=!1;replayAnimationId=null;isAutoRunning=!1;constructor(){this.container=document.getElementById("app"),this.init()}async init(){await Ye.init(),this.loadFitnessWeights(),this.setupSharedRenderer(),this.createMenuScreen(),this.createGridUI(),this.createTooltip(),this.createReplayModal(),this.graphPanel=new EC,this.showMenu()}saveFitnessWeights(){try{localStorage.setItem("evolutionLab_fitnessWeights",JSON.stringify(this.config.fitnessWeights))}catch(t){console.warn("Failed to save fitness weights to localStorage:",t)}}loadFitnessWeights(){try{const t=localStorage.getItem("evolutionLab_fitnessWeights");if(t){const e=JSON.parse(t);this.config.fitnessWeights={...na,...e}}}catch(t){console.warn("Failed to load fitness weights from localStorage:",t)}}setupSharedRenderer(){this.sharedRenderer=new cl({antialias:!0,preserveDrawingBuffer:!0}),this.sharedRenderer.setSize(160,160),this.sharedRenderer.setClearColor(1973802,1),this.sharedScene=new Za,this.sharedScene.background=new qt(1973802);const t=new nl(16777215,.7);this.sharedScene.add(t);const e=new el(16777215,.6);e.position.set(3,5,3),this.sharedScene.add(e),this.sharedCamera=new on(45,1,.1,100),this.sharedCamera.position.set(3,2.5,3),this.sharedCamera.lookAt(0,.3,0)}createMenuScreen(){this.menuScreen=document.createElement("div"),this.menuScreen.className="menu-screen",this.menuScreen.innerHTML=`
      <h1 class="menu-title">Evolution Lab</h1>
      <p class="menu-subtitle">Watch creatures evolve to collect pellets</p>
      <div class="menu-preview" id="preview-container"></div>
      <div class="menu-controls">
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; max-width: 450px;">
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Gravity</span>
              <span class="param-value" id="gravity-value">-9.8</span>
            </div>
            <input type="range" class="param-slider" id="gravity-slider" min="-30" max="-5" step="0.1" value="-9.8">
          </div>
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Mutation Rate</span>
              <span class="param-value" id="mutation-value">10%</span>
            </div>
            <input type="range" class="param-slider" id="mutation-slider" min="5" max="80" value="10">
          </div>
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Max Frequency</span>
              <span class="param-value" id="frequency-value">3.0 Hz</span>
            </div>
            <input type="range" class="param-slider" id="frequency-slider" min="1" max="10" step="0.5" value="3">
          </div>
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Sim Duration</span>
              <span class="param-value" id="duration-value">8s</span>
            </div>
            <input type="range" class="param-slider" id="duration-slider" min="3" max="20" value="8">
          </div>
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Max Nodes</span>
              <span class="param-value" id="maxnodes-value">8</span>
            </div>
            <input type="range" class="param-slider" id="maxnodes-slider" min="2" max="15" value="8">
          </div>
          <div class="param-group" style="width: 200px;">
            <div class="param-label">
              <span class="param-name">Max Muscles</span>
              <span class="param-value" id="maxmuscles-value">15</span>
            </div>
            <input type="range" class="param-slider" id="maxmuscles-slider" min="1" max="30" value="15">
          </div>
        </div>

        <div style="display: flex; gap: 12px;">
          <button class="btn btn-primary" id="start-btn">
            <span>Start Evolution</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          <button class="btn btn-secondary" id="load-run-btn">
            <span>Load Run</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Fitness Settings Panel - Fixed Right Side -->
      <div id="fitness-settings-panel" style="
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        width: 240px;
        max-height: 90vh;
        overflow-y: auto;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px solid var(--border-light);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      ">
        <div style="
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        ">Fitness Function</div>
        <div style="padding: 12px 16px;">
          <div class="param-group" style="margin-bottom: 12px;">
            <div class="param-label">
              <span class="param-name">Pellet Weight</span>
              <span class="param-value" id="pellet-weight-value">${this.config.fitnessWeights.pelletWeight}</span>
            </div>
            <input type="range" class="param-slider" id="pellet-weight-slider" min="0" max="200" value="${this.config.fitnessWeights.pelletWeight}">
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Points per pellet</div>
          </div>
          <div class="param-group" style="margin-bottom: 12px;">
            <div class="param-label">
              <span class="param-name">Proximity Weight</span>
              <span class="param-value" id="proximity-weight-value">${this.config.fitnessWeights.proximityWeight}</span>
            </div>
            <input type="range" class="param-slider" id="proximity-weight-slider" min="0" max="10" step="0.5" value="${this.config.fitnessWeights.proximityWeight}">
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Bonus for being close</div>
          </div>
          <div class="param-group" style="margin-bottom: 12px;">
            <div class="param-label">
              <span class="param-name">Proximity Distance</span>
              <span class="param-value" id="proximity-dist-value">${this.config.fitnessWeights.proximityMaxDistance}</span>
            </div>
            <input type="range" class="param-slider" id="proximity-dist-slider" min="5" max="50" value="${this.config.fitnessWeights.proximityMaxDistance}">
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Max distance for bonus</div>
          </div>
          <div class="param-group" style="margin-bottom: 12px;">
            <div class="param-label">
              <span class="param-name">Movement Weight</span>
              <span class="param-value" id="movement-weight-value">${this.config.fitnessWeights.movementWeight}</span>
            </div>
            <input type="range" class="param-slider" id="movement-weight-slider" min="0" max="5" step="0.1" value="${this.config.fitnessWeights.movementWeight}">
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Points per unit moved</div>
          </div>
          <div class="param-group" style="margin-bottom: 12px;">
            <div class="param-label">
              <span class="param-name">Movement Cap</span>
              <span class="param-value" id="movement-cap-value">${this.config.fitnessWeights.movementCap}</span>
            </div>
            <input type="range" class="param-slider" id="movement-cap-slider" min="0" max="50" value="${this.config.fitnessWeights.movementCap}">
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Max movement bonus</div>
          </div>
          <div class="param-group" style="margin-bottom: 12px;">
            <div class="param-label">
              <span class="param-name">Distance Weight</span>
              <span class="param-value" id="distance-weight-value">${this.config.fitnessWeights.distanceWeight}</span>
            </div>
            <input type="range" class="param-slider" id="distance-weight-slider" min="0" max="10" step="0.5" value="${this.config.fitnessWeights.distanceWeight}">
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Points per unit displaced</div>
          </div>
          <div class="param-group" style="margin-bottom: 12px;">
            <div class="param-label">
              <span class="param-name">Distance Cap</span>
              <span class="param-value" id="distance-cap-value">${this.config.fitnessWeights.distanceCap}</span>
            </div>
            <input type="range" class="param-slider" id="distance-cap-slider" min="0" max="100" value="${this.config.fitnessWeights.distanceCap}">
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Max distance bonus</div>
          </div>
          <div class="param-group" style="margin-bottom: 12px;">
            <div class="param-label">
              <span class="param-name">Base Fitness</span>
              <span class="param-value" id="base-fitness-value">${this.config.fitnessWeights.baseFitness}</span>
            </div>
            <input type="range" class="param-slider" id="base-fitness-slider" min="0" max="50" value="${this.config.fitnessWeights.baseFitness}">
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Starting fitness</div>
          </div>
          <button class="btn btn-secondary btn-small" id="reset-fitness-btn" style="width: 100%;">Reset to Defaults</button>
        </div>
      </div>
    `,this.container.appendChild(this.menuScreen),this.setupPreview(),this.createLoadRunsModal(),document.getElementById("start-btn").addEventListener("click",()=>this.startSimulation()),document.getElementById("load-run-btn").addEventListener("click",()=>this.showLoadRunsModal());const t=document.getElementById("gravity-slider");t.addEventListener("input",()=>{this.config.gravity=parseInt(t.value),document.getElementById("gravity-value").textContent=t.value,this.updateSettingsInfoBox()});const e=document.getElementById("mutation-slider");e.addEventListener("input",()=>{this.config.mutationRate=parseInt(e.value)/100,document.getElementById("mutation-value").textContent=e.value+"%",this.updateSettingsInfoBox()});const n=document.getElementById("frequency-slider");n.addEventListener("input",()=>{this.config.maxAllowedFrequency=parseFloat(n.value),document.getElementById("frequency-value").textContent=n.value+" Hz",this.updateSettingsInfoBox()});const s=document.getElementById("duration-slider");s.addEventListener("input",()=>{this.config.simulationDuration=parseInt(s.value),document.getElementById("duration-value").textContent=s.value+"s",this.updateSettingsInfoBox()});const o=document.getElementById("maxnodes-slider");o.addEventListener("input",()=>{this.config.maxNodes=parseInt(o.value),document.getElementById("maxnodes-value").textContent=o.value,this.regeneratePreviewCreature(),this.updateSettingsInfoBox()});const r=document.getElementById("maxmuscles-slider");r.addEventListener("input",()=>{this.config.maxMuscles=parseInt(r.value),document.getElementById("maxmuscles-value").textContent=r.value,this.regeneratePreviewCreature(),this.updateSettingsInfoBox()}),document.getElementById("frequency-slider").addEventListener("change",()=>{this.regeneratePreviewCreature()}),this.setupMenuFitnessSlider("pellet-weight","pelletWeight",0),this.setupMenuFitnessSlider("proximity-weight","proximityWeight",1),this.setupMenuFitnessSlider("proximity-dist","proximityMaxDistance",0),this.setupMenuFitnessSlider("movement-weight","movementWeight",1),this.setupMenuFitnessSlider("movement-cap","movementCap",0),this.setupMenuFitnessSlider("distance-weight","distanceWeight",1),this.setupMenuFitnessSlider("distance-cap","distanceCap",0),this.setupMenuFitnessSlider("base-fitness","baseFitness",0),document.getElementById("reset-fitness-btn")?.addEventListener("click",()=>{this.resetFitnessWeights()})}setupMenuFitnessSlider(t,e,n){const s=document.getElementById(`${t}-slider`),o=document.getElementById(`${t}-value`);!s||!o||s.addEventListener("input",()=>{const r=parseFloat(s.value);this.config.fitnessWeights[e]=r,o.textContent=n>0?r.toFixed(n):r.toString(),this.saveFitnessWeights()})}setupPreview(){const t=document.getElementById("preview-container");this.previewScene=new Za,this.previewScene.background=new qt(986900),this.previewCamera=new on(50,400/300,.1,100),this.previewCamera.position.set(4,3,6),this.previewCamera.lookAt(0,1,0),this.previewRenderer=new cl({antialias:!0}),this.previewRenderer.setSize(400,300),this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),t.appendChild(this.previewRenderer.domElement);const e=new nl(16777215,.5);this.previewScene.add(e);const n=new el(16777215,.8);n.position.set(5,10,5),this.previewScene.add(n);const s=new Je(new Ws(20,20),new Es({color:1710628,roughness:.9}));s.rotation.x=-Math.PI/2,this.previewScene.add(s);const o=new sd(20,20,2434354,2434354);o.position.y=.01,this.previewScene.add(o);const r=new Es({color:1096065,emissive:1096065,emissiveIntensity:.3});for(let a=0;a<3;a++){const l=new Je(new Co(.25,16,16),r);l.position.set((Math.random()-.5)*6,.25,(Math.random()-.5)*6),this.previewScene.add(l)}this.regeneratePreviewCreature(),this.animatePreview()}regeneratePreviewCreature(){if(!this.previewScene)return;this.previewCreature&&this.previewScene.remove(this.previewCreature);const t=Math.min(this.config.maxNodes,this.config.maxMuscles+1),e={minNodes:t,maxNodes:t,maxMuscles:this.config.maxMuscles,minSize:.2,maxSize:.8,minStiffness:50,maxStiffness:500,minFrequency:.5,maxFrequency:this.config.maxAllowedFrequency,maxAmplitude:.4,spawnRadius:2};this.previewGenome=rp(e),this.previewCreature=this.createCreatureMesh(this.previewGenome),this.previewScene.add(this.previewCreature)}createCreatureMesh(t){const e=new yo;let n=0,s=1/0,o=0,r=1/0;for(const l of t.muscles){l.stiffness>n&&(n=l.stiffness),l.stiffness<s&&(s=l.stiffness);const c=l.frequency*t.globalFrequencyMultiplier;c>o&&(o=c),c<r&&(r=c)}const a=new Map;for(const l of t.nodes){const c=(l.friction-.3)/.6,h=us.lerp(.5,.08,c),d=us.lerp(.9,.7,c),u=us.lerp(.6,.35,c),f=new qt().setHSL(h,d,u),m=new Es({color:f,roughness:us.lerp(.2,.8,c),metalness:us.lerp(.4,.1,c)}),x=new Je(new Co(l.size*.5,16,16),m);x.position.set(l.position.x,l.position.y,l.position.z),x.userData={nodeId:l.id,friction:l.friction,originalPos:{...l.position}},a.set(l.id,x),e.add(x)}for(const l of t.muscles){const c=a.get(l.nodeA),h=a.get(l.nodeB);if(!c||!h)continue;const d=l.frequency*t.globalFrequencyMultiplier,u=o>r?(d-r)/(o-r):.5,f=us.lerp(.6,0,u),m=new qt().setHSL(f,.9,.5),p=.03+(n>s?(l.stiffness-s)/(n-s):.5)*.09,g=new Es({color:m,roughness:.4,emissive:m,emissiveIntensity:.15}),_=new Je(new $c(p,p,1,8),g);_.userData={nodeA:l.nodeA,nodeB:l.nodeB},this.updateMuscleMesh(_,c.position,h.position),e.add(_)}return e.userData={genome:t,nodeMeshes:a},e}updateMuscleMesh(t,e,n){const s=n.clone().sub(e),o=s.length();t.position.copy(e.clone().add(n).multiplyScalar(.5)),t.scale.set(1,o,1),o>.001&&t.quaternion.setFromUnitVectors(new H(0,1,0),s.normalize())}animatePreview=()=>{if(!(this.state!=="menu"||!this.previewRenderer||!this.previewScene||!this.previewCamera)){if(requestAnimationFrame(this.animatePreview),this.previewTime+=.016,this.previewCreature&&this.previewGenome){const t=this.previewCreature.userData.nodeMeshes,e=Math.abs(this.config.gravity),n=Math.max(0,(e-9.8)/20)*.5;for(const s of this.previewGenome.nodes){const o=t.get(s.id);if(!o)continue;let r=s.position.x,a=s.position.y,l=s.position.z;for(const d of this.previewGenome.muscles){if(d.nodeA!==s.id&&d.nodeB!==s.id)continue;const u=d.frequency*this.previewGenome.globalFrequencyMultiplier,m=Math.sin(this.previewTime*u*Math.PI*2+d.phase)*d.amplitude*.3,x=d.nodeA===s.id?d.nodeB:d.nodeA,p=this.previewGenome.nodes.find(b=>b.id===x);if(!p)continue;const g=s.position.x-p.position.x,_=s.position.y-p.position.y,v=s.position.z-p.position.z,y=Math.sqrt(g*g+_*_+v*v);y>.01&&(r+=g/y*m,a+=_/y*m,l+=v/y*m)}const c=Math.max(0,s.position.y-.5),h=n*c;o.position.set(r,Math.max(s.size*.5,a-h),l)}for(const s of this.previewCreature.children)if(s.userData.nodeA){const o=t.get(s.userData.nodeA),r=t.get(s.userData.nodeB);o&&r&&this.updateMuscleMesh(s,o.position,r.position)}}this.previewRenderer.render(this.previewScene,this.previewCamera)}};showMenu(){this.state="menu",this.menuScreen&&(this.menuScreen.style.display="flex"),this.gridUI&&(this.gridUI.style.display="none"),this.graphPanel&&this.graphPanel.hide(),this.animatePreview()}createGridUI(){this.gridUI=document.createElement("div"),this.gridUI.style.cssText="display: none; width: 100%; height: 100%; position: relative;",this.statsPanel=document.createElement("div"),this.statsPanel.className="stats-panel glass",this.statsPanel.innerHTML=this.getStatsHTML(),this.gridUI.appendChild(this.statsPanel),this.stepIndicator=document.createElement("div"),this.stepIndicator.className="step-indicator glass",this.stepIndicator.innerHTML=this.getStepIndicatorHTML(),this.gridUI.appendChild(this.stepIndicator);const t=document.createElement("div");t.className="glass",t.id="settings-info-box",t.style.cssText=`
      position: absolute;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      font-size: 11px;
      color: var(--text-muted);
      border-radius: 8px;
    `,t.innerHTML=this.getSettingsInfoHTML(),this.gridUI.appendChild(t),setTimeout(()=>this.setupFitnessDropdown(),0),this.gridContainer=document.createElement("div"),this.gridContainer.className="creature-grid";const e=Vr*wi+(Vr-1)*Hr,n=Mf*wi+(Mf-1)*Hr;this.gridContainer.style.cssText=`
      position: absolute;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      width: ${e}px;
      height: ${n}px;
      padding: 16px;
      border-radius: 12px;
    `,this.gridUI.appendChild(this.gridContainer),this.controlPanel=document.createElement("div"),this.controlPanel.className="control-panel glass",this.controlPanel.innerHTML=`
      <button class="btn btn-primary" id="next-step-btn">Start Simulation</button>
      <div class="control-divider"></div>
      <button class="btn btn-secondary btn-small" id="run-1x-btn">1x</button>
      <button class="btn btn-secondary btn-small" id="run-10x-btn">10x</button>
      <button class="btn btn-secondary btn-small" id="run-100x-btn">100x</button>
      <div class="control-divider"></div>
      <button class="btn btn-secondary btn-small" id="graph-btn">Graph</button>
      <button class="btn btn-secondary btn-small" id="reset-btn">Reset</button>
    `,this.gridUI.appendChild(this.controlPanel),this.progressContainer=document.createElement("div"),this.progressContainer.className="progress-container glass",this.progressContainer.style.display="none",this.progressContainer.innerHTML=`
      <div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
      <div class="progress-text">Simulating creatures...</div>
    `,this.gridUI.appendChild(this.progressContainer),this.container.appendChild(this.gridUI),this.gridUI.querySelector("#next-step-btn")?.addEventListener("click",()=>this.executeNextStep()),this.gridUI.querySelector("#run-1x-btn")?.addEventListener("click",()=>this.autoRun(1)),this.gridUI.querySelector("#run-10x-btn")?.addEventListener("click",()=>this.autoRun(10)),this.gridUI.querySelector("#run-100x-btn")?.addEventListener("click",()=>this.autoRun(100)),this.gridUI.querySelector("#graph-btn")?.addEventListener("click",()=>this.graphPanel?.toggle()),this.gridUI.querySelector("#reset-btn")?.addEventListener("click",()=>this.reset())}getGridPosition(t){const e=t%Vr,n=Math.floor(t/Vr);return{x:e*(wi+Hr),y:n*(wi+Hr)}}getStatsHTML(){const t=this.simulationResults.filter(u=>!isNaN(u.finalFitness)&&isFinite(u.finalFitness)),e=t.length>0,n=e?Math.max(...t.map(u=>u.finalFitness)):0,s=e?t.reduce((u,f)=>u+f.finalFitness,0)/t.length:0,o=e?Math.min(...t.map(u=>u.finalFitness)):0,r=this.bestCreatureEver?this.bestCreatureEver.finalFitness.toFixed(1):"-",a=this.longestSurvivingCreature?this.longestSurvivingCreature.finalFitness.toFixed(1):"-",l=this.viewingGeneration!==null,c=this.viewingGeneration!==null?this.viewingGeneration:this.generation,h=c>0,d=l&&(this.viewingGeneration<this.maxGeneration||this.viewingGeneration<this.generation);return`
      <div class="stats-title gen-nav">
        <button class="gen-nav-btn" id="prev-gen-btn" ${h?"":"disabled"}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span class="gen-display" id="gen-display" title="Click to jump to a specific generation">
          ${l?`<span class="gen-viewing">${c}</span><span class="gen-separator">/</span><span class="gen-max" id="goto-current-gen">${this.generation}</span>`:`Generation ${c}`}
        </span>
        <button class="gen-nav-btn" id="next-gen-btn" ${d?"":"disabled"}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      ${l?'<div class="history-badge">VIEWING HISTORY</div>':""}
      <div class="stat-row">
        <span class="stat-label">Creatures</span>
        <span class="stat-value">${this.creatureCards.length}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Best Fitness</span>
        <span class="stat-value success">${e?n.toFixed(1):"-"}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Avg Fitness</span>
        <span class="stat-value accent">${e?s.toFixed(1):"-"}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Worst Fitness</span>
        <span class="stat-value danger">${e?o.toFixed(1):"-"}</span>
      </div>

      ${this.longestSurvivingCreature?`
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Longest Survivor: <span style="color: #a855f7;">${this.getCreatureName(this.longestSurvivingCreature.genome)}</span></div>
          <div id="longest-creature-card" style="
            width: 80px;
            height: 80px;
            background: var(--bg-card);
            border: 2px solid #a855f7;
            border-radius: 8px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
            transition: transform 0.2s;
          ">
            <canvas id="longest-creature-canvas" width="160" height="160" style="width: 100%; height: 100%;"></canvas>
            <span style="
              position: absolute;
              bottom: 4px;
              right: 4px;
              font-size: 9px;
              font-weight: 600;
              color: #a855f7;
              background: rgba(0, 0, 0, 0.6);
              padding: 2px 5px;
              border-radius: 4px;
            ">${a}</span>
          </div>
        </div>
      `:""}

      ${this.bestCreatureEver?`
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Best Ever (Gen ${this.bestCreatureGeneration})</div>
          <div id="best-creature-card" style="
            width: 80px;
            height: 80px;
            background: var(--bg-card);
            border: 2px solid #ffd700;
            border-radius: 8px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            transition: transform 0.2s;
          ">
            <canvas id="best-creature-canvas" width="160" height="160" style="width: 100%; height: 100%;"></canvas>
            <span style="
              position: absolute;
              bottom: 4px;
              right: 4px;
              font-size: 9px;
              font-weight: 600;
              color: #ffd700;
              background: rgba(0, 0, 0, 0.6);
              padding: 2px 5px;
              border-radius: 4px;
            ">${r}</span>
          </div>
        </div>
      `:""}
    `}getStepIndicatorHTML(){const t=[{key:"mutate",label:"Mutate",num:1},{key:"simulate",label:"Simulate",num:2},{key:"sort",label:"Sort",num:3}],e=t.findIndex(n=>n.key===this.evolutionStep);return t.map((n,s)=>{const o=n.key===this.evolutionStep,r=e>s||this.evolutionStep==="idle"&&this.generation>0,a=o?"active":r?"done":"",l=o?"active":r?"done":"",c=s<t.length-1?`<div class="step-connector ${r||e>s?"done":""}"></div>`:"";return`
        <div class="step-item">
          <div class="step-circle ${a}">${r&&!o?"✓":n.num}</div>
          <span class="step-label ${l}">${n.label}</span>
        </div>
        ${c}
      `}).join("")}getSettingsInfoHTML(){const t=this.config.fitnessWeights;return`
      <div style="color: var(--text-secondary); font-weight: 600; margin-bottom: 8px;">Settings</div>
      <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px;">
        <span>Gravity:</span><span style="color: var(--text-primary);">${this.config.gravity}</span>
        <span>Mutation:</span><span style="color: var(--text-primary);">${Math.round(this.config.mutationRate*100)}%</span>
        <span>Max Freq:</span><span style="color: var(--text-primary);">${this.config.maxAllowedFrequency} Hz</span>
        <span>Duration:</span><span style="color: var(--text-primary);">${this.config.simulationDuration}s</span>
        <span>Max Nodes:</span><span style="color: var(--text-primary);">${this.config.maxNodes}</span>
        <span>Max Muscles:</span><span style="color: var(--text-primary);">${this.config.maxMuscles}</span>
      </div>
      <div id="fitness-dropdown-toggle" style="
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        color: var(--text-muted);
        font-size: 11px;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid var(--border);
      ">
        <svg id="fitness-dropdown-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.2s;">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        <span>Fitness Weights</span>
      </div>
      <div id="fitness-dropdown-content" style="display: none; margin-top: 6px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 6px;">
        <div style="display: grid; grid-template-columns: auto auto; gap: 2px 10px; font-size: 10px;">
          <span style="color: var(--text-muted);">Pellet:</span><span style="color: var(--text-secondary);">${t.pelletWeight}</span>
          <span style="color: var(--text-muted);">Proximity:</span><span style="color: var(--text-secondary);">${t.proximityWeight} (max ${t.proximityMaxDistance})</span>
          <span style="color: var(--text-muted);">Movement:</span><span style="color: var(--text-secondary);">${t.movementWeight} (cap ${t.movementCap})</span>
          <span style="color: var(--text-muted);">Distance:</span><span style="color: var(--text-secondary);">${t.distanceWeight} (cap ${t.distanceCap})</span>
          <span style="color: var(--text-muted);">Base:</span><span style="color: var(--text-secondary);">${t.baseFitness}</span>
        </div>
      </div>
    `}updateSettingsInfoBox(){const t=document.getElementById("settings-info-box");t&&(t.innerHTML=this.getSettingsInfoHTML(),this.setupFitnessDropdown())}setupFitnessDropdown(){const t=document.getElementById("fitness-dropdown-toggle"),e=document.getElementById("fitness-dropdown-content"),n=document.getElementById("fitness-dropdown-chevron");t?.addEventListener("click",()=>{if(e&&n){const s=e.style.display==="none";e.style.display=s?"block":"none",n.style.transform=s?"rotate(90deg)":"rotate(0deg)"}})}updateStats(){if(this.statsPanel){this.statsPanel.innerHTML=this.getStatsHTML();const t=document.getElementById("prev-gen-btn"),e=document.getElementById("next-gen-btn"),n=document.getElementById("gen-display"),s=document.getElementById("goto-current-gen");if(t?.addEventListener("click",()=>this.navigateToGeneration("prev")),e?.addEventListener("click",()=>this.navigateToGeneration("next")),n?.addEventListener("click",()=>this.promptJumpToGeneration()),s?.addEventListener("click",async o=>{o.stopPropagation(),await this.goToCurrentGeneration()}),this.longestSurvivingCreature){const o=document.getElementById("longest-creature-canvas"),r=document.getElementById("longest-creature-card");o&&r&&(this.renderCreatureToCanvas(this.longestSurvivingCreature,o),r.addEventListener("mouseenter",a=>{r.style.transform="scale(1.05)",this.showLongestSurvivingTooltip(a)}),r.addEventListener("mouseleave",()=>{r.style.transform="scale(1)",this.hideTooltip()}),r.addEventListener("click",()=>{this.longestSurvivingCreature&&this.showReplay(this.longestSurvivingCreature)}))}if(this.bestCreatureEver){const o=document.getElementById("best-creature-canvas"),r=document.getElementById("best-creature-card");o&&r&&(this.renderCreatureToCanvas(this.bestCreatureEver,o),r.addEventListener("mouseenter",a=>{r.style.transform="scale(1.05)",this.showBestCreatureTooltip(a)}),r.addEventListener("mouseleave",()=>{r.style.transform="scale(1)",this.hideTooltip()}),r.addEventListener("click",()=>{this.bestCreatureEver&&this.showReplay(this.bestCreatureEver)}))}}this.stepIndicator&&(this.stepIndicator.innerHTML=this.getStepIndicatorHTML())}showBestCreatureTooltip(t){if(!this.tooltip||!this.bestCreatureEver)return;const e=this.bestCreatureEver,n=e.genome;this.tooltip.innerHTML=`
      <div class="tooltip-title" style="color: #ffd700;">Best Ever</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Generation</span>
        <span class="tooltip-value">${this.bestCreatureGeneration}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Fitness</span>
        <span class="tooltip-value" style="color: #ffd700">${e.finalFitness.toFixed(1)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Pellets</span>
        <span class="tooltip-value">${e.pelletsCollected}/${e.pellets.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Distance</span>
        <span class="tooltip-value">${e.distanceTraveled.toFixed(1)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Nodes</span>
        <span class="tooltip-value">${n.nodes.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Muscles</span>
        <span class="tooltip-value">${n.muscles.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Parents</span>
        <span class="tooltip-value">${n.parentIds.length>0?n.parentIds.length:"None"}</span>
      </div>
      <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">Click to replay</div>
    `;const s=t.currentTarget.getBoundingClientRect();this.tooltip.style.left=`${s.right+10}px`,this.tooltip.style.top=`${s.top}px`,this.tooltip.classList.add("visible")}showLongestSurvivingTooltip(t){if(!this.tooltip||!this.longestSurvivingCreature)return;const e=this.longestSurvivingCreature,n=e.genome,s=this.getCreatureName(n);this.tooltip.innerHTML=`
      <div class="tooltip-title" style="color: #a855f7;">${s}</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Survived</span>
        <span class="tooltip-value" style="color: #a855f7">${n.survivalStreak} consecutive gens</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Fitness</span>
        <span class="tooltip-value">${e.finalFitness.toFixed(1)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Pellets</span>
        <span class="tooltip-value">${e.pelletsCollected}/${e.pellets.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Distance</span>
        <span class="tooltip-value">${e.distanceTraveled.toFixed(1)}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Nodes</span>
        <span class="tooltip-value">${n.nodes.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Muscles</span>
        <span class="tooltip-value">${n.muscles.length}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Origin</span>
        <span class="tooltip-value">${n.parentIds.length===0?"Original":n.parentIds.length===1?"Mutant":"Crossover"}</span>
      </div>
      <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">Click to replay</div>
    `;const o=t.currentTarget.getBoundingClientRect();this.tooltip.style.left=`${o.right+10}px`,this.tooltip.style.top=`${o.top}px`,this.tooltip.classList.add("visible")}updateNextButton(t){const e=document.getElementById("next-step-btn");if(!e)return;if(t){e.textContent=t;return}const n={idle:this.generation===0?"Start Simulation":"Mutate",mutate:"Mutate",simulate:"Simulate",sort:"Sort"};e.textContent=n[this.evolutionStep]}renderCreatureToCanvas(t,e){if(!this.sharedRenderer||!this.sharedScene||!this.sharedCamera)return;const n=e.getContext("2d");if(!n)return;const s=[];this.sharedScene.traverse(f=>{f.type==="Group"&&s.push(f)}),s.forEach(f=>this.sharedScene.remove(f));const o=this.createCreatureMesh(t.genome);this.sharedScene.add(o);const r=new Js().setFromObject(o),a=r.getCenter(new H),l=r.getSize(new H),c=Math.max(l.x,l.y,l.z),d=c>0?2/c:1;o.scale.setScalar(d),r.setFromObject(o),r.getCenter(a),o.position.sub(a),o.position.y+=.3;const u=t.frames[t.frames.length-1];if(u){const f=o.userData.nodeMeshes;let m=0,x=0,p=0,g=0;for(const[,_]of u.nodePositions)m+=_.x,x+=_.y,p+=_.z,g++;g>0&&(m/=g,x/=g,p/=g);for(const[_,v]of u.nodePositions){const y=f.get(_);y&&y.position.set((v.x-m)*d,(v.y-x)*d+.3,(v.z-p)*d)}for(const _ of o.children)if(_.userData.nodeA){const v=f.get(_.userData.nodeA),y=f.get(_.userData.nodeB);v&&y&&this.updateMuscleMesh(_,v.position,y.position)}}this.sharedRenderer.render(this.sharedScene,this.sharedCamera),n.drawImage(this.sharedRenderer.domElement,0,0,e.width,e.height),this.sharedScene.remove(o)}createCreatureCards(){if(!this.gridContainer)return;this.gridContainer.innerHTML="",this.creatureCards=[];const t=[...this.simulationResults].map((e,n)=>({result:e,originalIndex:n})).sort((e,n)=>{const s=isNaN(e.result.finalFitness)?-1/0:e.result.finalFitness;return(isNaN(n.result.finalFitness)?-1/0:n.result.finalFitness)-s});for(let e=0;e<t.length;e++){const{result:n}=t[e],s=this.getGridPosition(e),o=this.createSingleCard(n,e+1,e,s.x,s.y);this.creatureCards.push(o),this.gridContainer.appendChild(o.element)}}getCreatureName(t){const e=t.id.split("_"),n=parseInt(e[e.length-1])||0,o="ROYGBVPMCSTAWDELFHIJKNQUXZ"[Math.floor(t.color.h*26)%26],r="ABCDEFGHJKLMNPQRSTUVWXYZ",a=(t.nodes.length*3+t.muscles.length)%r.length,l=r[a],c=n%1e3,h=`${o}${l}${c}`;return t.survivalStreak>0?`${h}★${t.survivalStreak}`:h}createSingleCard(t,e,n,s,o,r=null){const a=document.createElement("div");a.className="creature-card",a.style.cssText=`
      width: ${wi}px;
      height: ${wi}px;
      border-radius: 8px;
      background: #1e1e2a;
      border: 2px solid rgba(255,255,255,0.2);
      cursor: pointer;
      position: absolute;
      left: ${s}px;
      top: ${o}px;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;
    `;const l=e<=this.config.populationSize*.1,c=t.disqualified!==null;c?(a.style.borderColor="#ef4444",a.style.opacity="0.6",a.style.cursor="not-allowed"):l&&(a.style.borderColor="#10b981",a.style.boxShadow="0 0 10px rgba(16, 185, 129, 0.3)");const h=!isNaN(t.finalFitness)&&isFinite(t.finalFitness),d=h?t.finalFitness:0,u=h?d.toFixed(0):"...",f=this.getCreatureName(t.genome),m=document.createElement("span");m.className="creature-card-rank",m.textContent=c?`DQ: ${f}`:f,m.style.cssText=`
      position: absolute;
      top: 4px;
      left: 4px;
      font-size: 9px;
      font-weight: 600;
      color: #7a8494;
      background: rgba(0, 0, 0, 0.6);
      padding: 2px 5px;
      border-radius: 4px;
      z-index: 10;
    `;const x=document.createElement("span");x.className="creature-card-fitness",x.textContent=u,x.style.cssText=`
      position: absolute;
      bottom: 4px;
      right: 4px;
      font-size: 9px;
      font-weight: 600;
      color: ${h?"#10b981":"#7a8494"};
      background: rgba(0, 0, 0, 0.6);
      padding: 2px 5px;
      border-radius: 4px;
      z-index: 10;
    `;const p=document.createElement("canvas");p.width=160,p.height=160,p.style.cssText="width: 100%; height: 100%; display: block;",a.appendChild(p),a.appendChild(m),a.appendChild(x);const g=p.getContext("2d");g.fillStyle="#1e1e2a",g.fillRect(0,0,160,160),this.renderCreatureToCanvas(t,p);const _={element:a,canvas:p,ctx:g,result:t,rank:e,gridIndex:n,isDead:!1,isMutated:!1,isElite:l,parentId:r,currentX:s,currentY:o,targetX:s,targetY:o};return a.addEventListener("mouseenter",v=>{a.style.transform="scale(1.05)",a.style.zIndex="10",a.style.borderColor="#6366f1",this.showCardTooltip(v,_)}),a.addEventListener("mouseleave",()=>{a.style.transform="scale(1)",a.style.zIndex="1",a.style.borderColor=_.isElite?"#10b981":"rgba(255,255,255,0.2)",this.hideTooltip()}),a.addEventListener("click",()=>{_.result&&_.result.frames.length>0&&!_.result.disqualified&&this.showReplay(_.result)}),_}showCardTooltip(t,e){const n=e.result;if(!n||!this.tooltip)return;const s=n.genome,o=this.getCreatureName(s),r=s.muscles.length>0?s.muscles.reduce((_,v)=>_+v.stiffness,0)/s.muscles.length:0,a=s.muscles.length>0?s.muscles.reduce((_,v)=>_+v.frequency,0)/s.muscles.length:0,l=isNaN(n.finalFitness)?0:n.finalFitness,h=(()=>{switch(n.disqualified){case"frequency_exceeded":return"Muscle frequency exceeded max allowed";case"physics_explosion":return"Physics simulation exploded";case"nan_position":return"Position became invalid";default:return""}})(),d=s.generation,u=s.parentIds.length,f=u===0?"Original":u===1?"Mutant":`Crossover (${u} parents)`;this.tooltip.innerHTML=`
      <div class="tooltip-title">${o} <span style="color: var(--text-muted); font-size: 12px;">#${e.rank}</span></div>

      ${n.disqualified?`
        <div style="margin-bottom: 8px; padding: 8px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 4px;">
          <div style="color: #ef4444; font-weight: 600; font-size: 12px;">DISQUALIFIED</div>
          <div style="color: #fca5a5; font-size: 11px; margin-top: 2px;">${h}</div>
        </div>
      `:""}

      <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div class="tooltip-row">
          <span class="tooltip-label">Fitness</span>
          <span class="tooltip-value" style="color: ${n.disqualified?"#ef4444":"var(--success)"}">${l.toFixed(1)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Pellets</span>
          <span class="tooltip-value">${n.pelletsCollected}/${n.pellets.length}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Distance</span>
          <span class="tooltip-value">${n.distanceTraveled.toFixed(1)}</span>
        </div>
      </div>

      <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 11px; color: var(--accent-light); margin-bottom: 4px;">Genetics</div>
        <div class="tooltip-row">
          <span class="tooltip-label">Generation</span>
          <span class="tooltip-value">${d}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Origin</span>
          <span class="tooltip-value" style="color: ${u===0?"#7a8494":u===1?"#f59e0b":"#6366f1"}">${f}</span>
        </div>
      </div>

      <div>
        <div style="font-size: 11px; color: var(--accent-light); margin-bottom: 4px;">Structure</div>
        <div class="tooltip-row">
          <span class="tooltip-label">Nodes</span>
          <span class="tooltip-value">${s.nodes.length}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Muscles</span>
          <span class="tooltip-value">${s.muscles.length}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Avg Stiffness</span>
          <span class="tooltip-value">${r.toFixed(0)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Avg Frequency</span>
          <span class="tooltip-value">${a.toFixed(1)} Hz</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Global Speed</span>
          <span class="tooltip-value">${s.globalFrequencyMultiplier.toFixed(2)}x</span>
        </div>
      </div>

      <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">${n.disqualified?"Replay unavailable":"Click to replay"}</div>
    `;const m=t.currentTarget.getBoundingClientRect(),x=320;let p=m.right+10,g=m.top;g+x>window.innerHeight&&(g=Math.max(10,window.innerHeight-x-10)),p+200>window.innerWidth&&(p=m.left-210),this.tooltip.style.left=`${p}px`,this.tooltip.style.top=`${g}px`,this.tooltip.classList.add("visible")}createTooltip(){this.tooltip=document.createElement("div"),this.tooltip.className="creature-tooltip glass",document.body.appendChild(this.tooltip)}hideTooltip(){this.tooltip&&this.tooltip.classList.remove("visible")}createReplayModal(){this.replayModal=document.createElement("div"),this.replayModal.className="modal-overlay",this.replayModal.innerHTML=`
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">Simulation Replay</span>
          <button class="btn-icon" id="close-replay">&times;</button>
        </div>
        <div class="modal-body">
          <div id="replay-container" style="width: 600px; height: 400px; border-radius: 12px; overflow: hidden;"></div>
          <div style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div id="replay-fitness" style="font-size: 24px; font-weight: 600; color: var(--success);">0.0</div>
              <div id="replay-frame" style="color: var(--text-muted); font-size: 13px;">Frame 0/0</div>
            </div>
            <div style="height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
              <div id="replay-fitness-fill" style="height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent), var(--success)); transition: width 0.1s;"></div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
            <div id="replay-stats" style="color: var(--text-secondary); font-size: 13px;"></div>
            <button class="btn btn-secondary btn-small" id="replay-restart">Restart</button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.replayModal),this.replayModal.querySelector("#close-replay")?.addEventListener("click",()=>this.hideReplay()),this.replayModal.querySelector("#replay-restart")?.addEventListener("click",()=>{this.replayFrame=0}),this.replayModal.addEventListener("click",t=>{t.target===this.replayModal&&this.hideReplay()})}createLoadRunsModal(){this.loadRunsModal=document.createElement("div"),this.loadRunsModal.className="modal-overlay",this.loadRunsModal.innerHTML=`
      <div class="modal-content" style="max-width: 800px; width: 90vw;">
        <div class="modal-header">
          <span class="modal-title">Load Saved Run</span>
          <button class="btn-icon" id="close-load-runs">&times;</button>
        </div>
        <div class="modal-body">
          <div id="runs-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; max-height: 60vh; overflow-y: auto; padding: 4px;">
            <div style="color: var(--text-muted); text-align: center; padding: 40px;">Loading saved runs...</div>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.loadRunsModal),this.loadRunsModal.querySelector("#close-load-runs")?.addEventListener("click",()=>this.hideLoadRunsModal()),this.loadRunsModal.addEventListener("click",t=>{t.target===this.loadRunsModal&&this.hideLoadRunsModal()})}async showLoadRunsModal(){if(!this.loadRunsModal)return;this.loadRunsModal.classList.add("visible");const t=this.loadRunsModal.querySelector("#runs-grid");try{const e=await Ye.getAllRuns();if(e.length===0){t.innerHTML=`
          <div style="color: var(--text-muted); text-align: center; padding: 40px; grid-column: 1 / -1;">
            No saved runs found. Start a new evolution to create your first run!
          </div>
        `;return}t.innerHTML=e.map(n=>{const s=new Date(n.startTime),o=s.toLocaleDateString()+" "+s.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});return`
          <div class="run-card" data-run-id="${n.id}" style="
            background: var(--bg-card);
            border: 2px solid var(--border);
            border-radius: 12px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          ">
            <button class="delete-run-btn" data-run-id="${n.id}" style="
              position: absolute;
              top: 8px;
              right: 8px;
              background: rgba(239, 68, 68, 0.2);
              border: none;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              cursor: pointer;
              color: var(--danger);
              font-size: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0.6;
              transition: opacity 0.2s;
            ">&times;</button>
            <div style="
              width: 100%;
              height: 100px;
              background: var(--bg-tertiary);
              border-radius: 8px;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--text-muted);
              font-size: 12px;
            ">${n.thumbnail?`<img src="${n.thumbnail}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`:"No preview"}</div>
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Generation ${n.generationCount-1}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${o}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
              Gravity: ${n.config.gravity} | Mut: ${Math.round((n.config.mutationRate||.1)*100)}%
            </div>
          </div>
        `}).join(""),t.querySelectorAll(".run-card").forEach(n=>{n.addEventListener("click",async s=>{if(s.target.classList.contains("delete-run-btn"))return;const r=n.getAttribute("data-run-id");r&&await this.loadRun(r)}),n.addEventListener("mouseenter",()=>{n.style.borderColor="var(--accent)",n.style.transform="translateY(-2px)"}),n.addEventListener("mouseleave",()=>{n.style.borderColor="var(--border)",n.style.transform="translateY(0)"})}),t.querySelectorAll(".delete-run-btn").forEach(n=>{n.addEventListener("click",async s=>{s.stopPropagation();const o=n.getAttribute("data-run-id");o&&confirm("Delete this run? This cannot be undone.")&&(await Ye.deleteRun(o),await this.showLoadRunsModal())}),n.addEventListener("mouseenter",()=>{n.style.opacity="1"}),n.addEventListener("mouseleave",()=>{n.style.opacity="0.6"})})}catch(e){console.error("Error loading runs:",e),t.innerHTML=`
        <div style="color: var(--danger); text-align: center; padding: 40px; grid-column: 1 / -1;">
          Error loading saved runs. Please try again.
        </div>
      `}}hideLoadRunsModal(){this.loadRunsModal&&this.loadRunsModal.classList.remove("visible")}async loadRun(t){try{const e=await Ye.getRun(t);if(!e){alert("Run not found");return}const n=e.generationCount-1;if(n<0){alert("This run has no saved generations");return}const s=await Ye.loadGeneration(t,n);if(!s){alert("Could not load generation data");return}this.hideLoadRunsModal(),Ye.setCurrentRunId(t),this.config={...this.config,...e.config},this.generation=n,this.maxGeneration=n,this.viewingGeneration=n,this.simulationResults=s,this.fitnessHistory=[],this.state="grid",this.menuScreen&&(this.menuScreen.style.display="none"),this.gridUI&&(this.gridUI.style.display="block"),this.createCreatureCardsFromResults(s),this.evolutionStep="idle",this.updateNextButton(),this.updateStats(),this.updateSettingsInfoBox()}catch(e){console.error("Error loading run:",e),alert("Error loading run. Please try again.")}}createCreatureCardsFromResults(t,e=!0){if(!this.gridContainer)return;this.gridContainer.innerHTML="",this.creatureCards=[];const n=e?[...t].sort((s,o)=>o.finalFitness-s.finalFitness):t;for(let s=0;s<n.length;s++){const o=n[s],r=this.getGridPosition(s),a=document.createElement("div");a.className="creature-card",a.innerHTML=`
        <div class="creature-card-rank">#${s+1}</div>
        <canvas width="160" height="160"></canvas>
        <div class="creature-card-fitness">${o.finalFitness.toFixed(0)}</div>
      `,a.style.cssText=`
        position: absolute;
        left: ${r.x}px;
        top: ${r.y}px;
        width: ${wi}px;
        height: ${wi}px;
      `;const l=a.querySelector("canvas"),c=l.getContext("2d"),h={element:a,canvas:l,ctx:c,result:o,rank:s+1,gridIndex:s,isDead:!1,isMutated:!1,isElite:s<(this.config.eliteCount||5),parentId:null,currentX:r.x,currentY:r.y,targetX:r.x,targetY:r.y};this.creatureCards.push(h),this.gridContainer.appendChild(a),this.renderCreatureToCanvas(o,l),a.addEventListener("click",()=>this.showReplay(o)),a.addEventListener("mouseenter",d=>this.showCardTooltip(d,h)),a.addEventListener("mouseleave",()=>this.hideTooltip())}}async navigateToGeneration(t){if(!Ye.getCurrentRunId())return;const n=this.viewingGeneration!==null?this.viewingGeneration:this.generation;let s;if(t==="prev"){if(s=n-1,s<0)return}else if(s=n+1,s>this.maxGeneration){if(s===this.generation){await this.goToCurrentGeneration();return}return}if(s===this.generation){await this.goToCurrentGeneration();return}await this.loadGenerationView(s)}async promptJumpToGeneration(){const t=this.viewingGeneration!==null?this.viewingGeneration:this.generation,e=prompt(`Jump to generation (0-${this.generation}):`,t.toString());if(e===null)return;const n=parseInt(e,10);if(isNaN(n)||n<0||n>this.generation){alert(`Please enter a number between 0 and ${this.generation}`);return}if(n===this.generation){await this.goToCurrentGeneration();return}await this.loadGenerationView(n)}async goToCurrentGeneration(){this.viewingGeneration=null,this.updateControlsForHistoryMode(!1);const t=Ye.getCurrentRunId();if(t&&this.generation<=this.maxGeneration){const e=await Ye.loadGeneration(t,this.generation);if(e&&e.length>0){this.simulationResults=e;const n=this.evolutionStep!=="simulate";this.createCreatureCardsFromResults(e,n),this.updateStats();return}}this.population&&this.population.getGenomes().length>0&&this.createCardsFromPopulation(),this.updateStats()}createCardsFromPopulation(){if(!this.gridContainer||!this.population)return;this.gridContainer.innerHTML="",this.creatureCards=[];const t=this.population.getGenomes();for(let e=0;e<t.length;e++){const n=t[e],s=this.getGridPosition(e),o={genome:n,frames:[],finalFitness:NaN,pelletsCollected:0,distanceTraveled:0,netDisplacement:0,closestPelletDistance:0,pellets:[],fitnessOverTime:[],disqualified:null},r=this.createSingleCard(o,e+1,e,s.x,s.y);this.creatureCards.push(r),this.gridContainer.appendChild(r.element);const a=r.element.querySelector(".creature-card-fitness");a&&(a.textContent="...",a.style.color="#7a8494")}}async loadGenerationView(t){const e=Ye.getCurrentRunId();if(e)try{const n=await Ye.loadGeneration(e,t);if(!n){alert(`Could not load generation ${t}`);return}this.viewingGeneration=t,this.simulationResults=n,this.createCreatureCardsFromResults(n),this.updateStats(),this.updateControlsForHistoryMode(!0)}catch(n){console.error("Error loading generation:",n),alert("Error loading generation data")}}updateControlsForHistoryMode(t){const e=document.getElementById("next-step-btn"),n=document.getElementById("run-1x-btn"),s=document.getElementById("run-10x-btn"),o=document.getElementById("run-100x-btn");t?(e&&(e.disabled=!0,e.textContent="Viewing History"),n&&(n.disabled=!0),s&&(s.disabled=!0),o&&(o.disabled=!0)):(e&&(e.disabled=!1,this.updateNextButton()),n&&(n.disabled=!1),s&&(s.disabled=!1),o&&(o.disabled=!1))}setupReplayScene(){const t=document.getElementById("replay-container");t.innerHTML="",this.replayRenderer&&this.replayRenderer.dispose(),this.replayScene=new Za,this.replayScene.background=new qt(986900),this.replayCamera=new on(50,600/400,.1,100),this.replayCamera.position.set(8,6,12),this.replayCamera.lookAt(0,1,0),this.replayRenderer=new cl({antialias:!0}),this.replayRenderer.setSize(600,400),this.replayRenderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),t.appendChild(this.replayRenderer.domElement);const e=new nl(16777215,.5);this.replayScene.add(e);const n=new el(16777215,.8);n.position.set(5,10,5),this.replayScene.add(n);const s=new Je(new Ws(30,30),new Es({color:1710628,roughness:.9}));s.rotation.x=-Math.PI/2,this.replayScene.add(s);const o=new sd(30,30,2434354,2434354);o.position.y=.01,this.replayScene.add(o)}showReplay(t){this.replayAnimationId!==null&&(cancelAnimationFrame(this.replayAnimationId),this.replayAnimationId=null),this.selectedResult=t,this.replayFrame=0,this.isReplaying=!0,this.setupReplayScene(),this.replayCreature&&this.replayScene.remove(this.replayCreature),this.replayPellets.forEach(s=>this.replayScene.remove(s)),this.replayPelletLines.forEach(s=>this.replayScene.remove(s)),this.replayPellets=[],this.replayPelletLines=[],this.replayCreature=this.createCreatureMesh(t.genome),this.replayScene.add(this.replayCreature);const e=new Es({color:1096065,emissive:1096065,emissiveIntensity:.3}),n=new Jg({color:1096065,opacity:.3,transparent:!0,dashSize:.1,gapSize:.1});for(const s of t.pellets){const o=new Je(new Co(.3,16,16),e.clone());o.position.set(s.position.x,s.position.y,s.position.z),o.userData={pelletData:s},this.replayScene.add(o),this.replayPellets.push(o);const r=new ln().setFromPoints([new H(s.position.x,s.position.y,s.position.z),new H(s.position.x,.01,s.position.z)]),a=new Jf(r,n.clone());a.computeLineDistances(),a.userData={pelletData:s},this.replayScene.add(a),this.replayPelletLines.push(a)}document.getElementById("replay-stats").innerHTML=`
      Nodes: <strong>${t.genome.nodes.length}</strong> |
      Muscles: <strong>${t.genome.muscles.length}</strong> |
      Pellets: <strong>${t.pelletsCollected}/${t.pellets.length}</strong>
    `,this.replayModal.classList.add("visible"),this.animateReplay()}hideReplay(){this.replayAnimationId!==null&&(cancelAnimationFrame(this.replayAnimationId),this.replayAnimationId=null),this.isReplaying=!1,this.selectedResult=null,this.replayModal.classList.remove("visible"),this.replayRenderer&&(this.replayRenderer.dispose(),this.replayRenderer=null)}animateReplay=()=>{if(!this.isReplaying||!this.replayRenderer||!this.replayScene||!this.replayCamera){this.replayAnimationId=null;return}if(this.replayAnimationId=requestAnimationFrame(this.animateReplay),this.selectedResult&&this.replayCreature){const t=this.selectedResult.frames[this.replayFrame];if(t){const e=this.replayCreature.userData.nodeMeshes;for(const[o,r]of t.nodePositions){const a=e.get(o);a&&a.position.set(r.x,r.y,r.z)}for(const o of this.replayCreature.children)if(o.userData.nodeA){const r=e.get(o.userData.nodeA),a=e.get(o.userData.nodeB);r&&a&&this.updateMuscleMesh(o,r.position,a.position)}for(let o=0;o<this.replayPellets.length;o++){const r=this.replayPellets[o],a=this.replayPelletLines[o],l=r.userData.pelletData,c=l.spawnedAtFrame<=this.replayFrame,h=l.collectedAtFrame!==null&&this.replayFrame>=l.collectedAtFrame,d=c&&!h;r.visible=d,a&&(a.visible=d)}const n=this.selectedResult.fitnessOverTime[this.replayFrame]||0,s=Math.max(...this.selectedResult.fitnessOverTime,.1);document.getElementById("replay-fitness").textContent=n.toFixed(1),document.getElementById("replay-frame").textContent=`Frame ${this.replayFrame+1}/${this.selectedResult.frames.length}`,document.getElementById("replay-fitness-fill").style.width=`${n/s*100}%`,this.replayFrame++,this.replayFrame>=this.selectedResult.frames.length&&(this.replayFrame=0)}}this.replayRenderer.render(this.replayScene,this.replayCamera)};async startSimulation(){this.generation=0,this.fitnessHistory=[],this.evolutionStep="idle",this.viewingGeneration=null,await Ye.createRun(this.config);const t={minNodes:2,maxNodes:this.config.maxNodes,minMuscles:1,maxMuscles:this.config.maxMuscles,minSize:.2,maxSize:.8,minStiffness:50,maxStiffness:500,minFrequency:.5,maxFrequency:this.config.maxAllowedFrequency,maxAmplitude:.4,spawnRadius:2};this.population=Qc.createInitial(this.config,t),this.state="grid",this.menuScreen&&(this.menuScreen.style.display="none"),this.gridUI&&(this.gridUI.style.display="block"),await this.runSimulationStep(),this.createCreatureCards(),this.evolutionStep="idle",this.recordFitnessHistory(),await Ye.saveGeneration(this.generation,this.simulationResults),this.maxGeneration=this.generation,this.updateNextButton(),this.updateStats()}async executeNextStep(){if(this.isAutoRunning)return;const t=document.getElementById("next-step-btn");t.disabled=!0;try{this.evolutionStep==="idle"?(this.evolutionStep="mutate",this.updateNextButton("Killing 50%..."),this.updateStats(),await this.runMutateStep(!1),this.evolutionStep="simulate"):this.evolutionStep==="mutate"?this.evolutionStep="simulate":this.evolutionStep==="simulate"?(this.updateNextButton("Simulating..."),await this.runSimulationStep(!1),await Ye.saveGeneration(this.generation,this.simulationResults),this.maxGeneration=this.generation,this.evolutionStep="sort"):this.evolutionStep==="sort"&&(this.updateNextButton("Sorting..."),await this.runSortStep(!1),this.evolutionStep="idle",this.recordFitnessHistory()),this.updateStats(),this.updateNextButton(),this.graphPanel&&this.fitnessHistory.length>0&&this.graphPanel.updateData(this.fitnessHistory)}finally{t.disabled=!1}}async runMutateStep(t=!1){if(!this.population||!this.gridContainer)return;this.generation++;const e=[...this.creatureCards].sort((h,d)=>{const u=h.result?isNaN(h.result.finalFitness)?-1/0:h.result.finalFitness:-1/0;return(d.result?isNaN(d.result.finalFitness)?-1/0:d.result.finalFitness:-1/0)-u}),n=Math.floor(e.length*.5),s=e.slice(0,n),o=e.slice(n);if(!t){for(const h of o)h.isDead=!0,h.element.style.opacity="0.3",h.element.style.borderColor="#ef4444",h.element.style.transform="scale(0.9)";await this.delay(600);for(const h of o)h.element.style.opacity="0",h.element.style.transform="scale(0)";await this.delay(400)}const r=[];for(const h of o)r.push(h.gridIndex),h.element.remove();this.creatureCards=[...s];const a=this.population.evolve();this.population.replaceCreatures(a);const l=this.population.getGenomes();for(let h=0;h<s.length&&h<l.length;h++){const d=s[h],u=l[h];d.result&&(d.result={...d.result,genome:u});const f=d.element.querySelector(".creature-card-fitness");f&&(f.textContent="...",f.style.color="#7a8494")}r.sort((h,d)=>h-d);const c=s.length;for(let h=0;h<r.length;h++){const d=c+h;if(d>=l.length)break;const u=l[d],f=r[h],m=this.getGridPosition(f),x=s.length>0?s[Math.floor(Math.random()*s.length)]:null,p=t||!x?m:{x:x.currentX,y:x.currentY},g={genome:u,frames:[],finalFitness:NaN,pelletsCollected:0,distanceTraveled:0,netDisplacement:0,closestPelletDistance:1/0,pellets:[],fitnessOverTime:[],disqualified:null},_=this.createSingleCard(g,0,f,p.x,p.y,u.parentIds[0]||null);_.isMutated=!0,_.targetX=m.x,_.targetY=m.y,t?(_.element.style.borderColor="#f59e0b",_.element.style.left=`${m.x}px`,_.element.style.top=`${m.y}px`,_.currentX=m.x,_.currentY=m.y):(_.element.style.borderColor="#f59e0b",_.element.style.opacity="0",_.element.style.transform="scale(0.5)"),this.gridContainer.appendChild(_.element),this.creatureCards.push(_)}if(!t){await this.delay(50);for(const h of this.creatureCards)h.isMutated&&(h.element.style.transition="opacity 0.3s ease, transform 0.3s ease, left 0.5s ease-out, top 0.5s ease-out",h.element.style.opacity="1",h.element.style.transform="scale(1)",h.element.style.left=`${h.targetX}px`,h.element.style.top=`${h.targetY}px`,h.currentX=h.targetX,h.currentY=h.targetY);await this.delay(600);for(const h of this.creatureCards)h.element.style.transition="transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease"}}async runSimulationStep(t=!1){if(!this.population)return;!t&&this.progressContainer&&(this.progressContainer.style.display="block");const e=this.population.getGenomes(),n=this.progressContainer?.querySelector(".progress-fill"),s=this.progressContainer?.querySelector(".progress-text");this.simulationResults=await kS(e,this.config,(o,r)=>{if(!t){const a=Math.round(o/r*100);n&&(n.style.width=`${a}%`),s&&(s.textContent=`Simulating creature ${o}/${r}...`)}});for(const o of this.simulationResults){const r=this.population.creatures.find(a=>a.genome.id===o.genome.id);r&&(r.state.fitness=o.finalFitness,r.state.pelletsCollected=o.pelletsCollected,r.state.distanceTraveled=o.distanceTraveled)}this.progressContainer&&(this.progressContainer.style.display="none");for(const o of this.creatureCards){if(!o.result)continue;const r=this.simulationResults.find(a=>a.genome.id===o.result?.genome.id);if(r){o.result=r;const a=o.element.querySelector(".creature-card-fitness");if(a){const l=!isNaN(r.finalFitness)&&isFinite(r.finalFitness);a.textContent=l?r.finalFitness.toFixed(0):"...",a.style.color=l?"#10b981":"#7a8494"}t||this.renderCreatureToCanvas(r,o.canvas)}}if(t)for(const o of this.creatureCards)o.result&&o.result.frames.length>0&&this.renderCreatureToCanvas(o.result,o.canvas)}async runSortStep(t=!1){if(!this.gridContainer)return;const e=[...this.creatureCards].sort((s,o)=>{const r=s.result?isNaN(s.result.finalFitness)?-1/0:s.result.finalFitness:-1/0;return(o.result?isNaN(o.result.finalFitness)?-1/0:o.result.finalFitness:-1/0)-r}),n=[];for(let s=0;s<e.length;s++){const o=e[s],r=this.getGridPosition(s);n.push({card:o,targetX:r.x,targetY:r.y,newRank:s+1})}if(!t)for(const s of this.creatureCards)s.element.style.transition="left 0.6s ease-in-out, top 0.6s ease-in-out, transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease";for(const{card:s,targetX:o,targetY:r,newRank:a}of n){s.element.style.left=`${o}px`,s.element.style.top=`${r}px`,s.currentX=o,s.currentY=r,s.targetX=o,s.targetY=r,s.gridIndex=a-1,s.rank=a;const l=a<=this.config.populationSize*.1;s.isElite=l,s.element.style.borderColor=l?"#10b981":"rgba(255,255,255,0.2)",s.element.style.boxShadow=l?"0 0 10px rgba(16, 185, 129, 0.3)":"none",s.isMutated&&(s.isMutated=!1)}if(!t){await this.delay(700);for(const s of this.creatureCards)s.element.style.transition="transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease"}}recordFitnessHistory(){const t=this.simulationResults.filter(a=>!isNaN(a.finalFitness)&&isFinite(a.finalFitness));if(t.length===0)return;const e=Math.max(...t.map(a=>a.finalFitness)),n=t.reduce((a,l)=>a+l.finalFitness,0)/t.length,s=Math.min(...t.map(a=>a.finalFitness)),o=t.find(a=>a.finalFitness===e);o&&(!this.bestCreatureEver||o.finalFitness>this.bestCreatureEver.finalFitness)&&(this.bestCreatureEver=o,this.bestCreatureGeneration=this.generation,console.log(`New best creature ever! Fitness: ${o.finalFitness.toFixed(1)} at generation ${this.generation}`));const r=t.reduce((a,l)=>l.genome.survivalStreak>a.genome.survivalStreak?l:a,t[0]);r&&r.genome.survivalStreak>this.longestSurvivingGenerations&&(this.longestSurvivingCreature=r,this.longestSurvivingGenerations=r.genome.survivalStreak,console.log(`New longest surviving creature! ${this.getCreatureName(r.genome)} survived ${r.genome.survivalStreak} consecutive generations`)),this.fitnessHistory.push({generation:this.generation,best:e,average:n,worst:s}),this.graphPanel&&(this.graphPanel.updateData(this.fitnessHistory),this.graphPanel.show()),console.log(`Generation ${this.generation}: Best=${e.toFixed(1)}, Avg=${n.toFixed(1)}, Worst=${s.toFixed(1)}`)}async autoRun(t){if(this.isAutoRunning)return;this.isAutoRunning=!0;const e=document.getElementById("next-step-btn");e.disabled=!0;try{for(let n=0;n<t;n++){const s=t-n;this.updateNextButton(`Gen ${this.generation+1} (${s} left)`),this.evolutionStep="mutate",this.updateStats(),await this.runMutateStep(!0),this.evolutionStep="simulate",this.updateStats(),await this.runSimulationStep(!0),await Ye.saveGeneration(this.generation,this.simulationResults),this.maxGeneration=this.generation,this.evolutionStep="sort",this.updateStats(),await this.runSortStep(!0),this.evolutionStep="idle",this.recordFitnessHistory(),this.updateStats(),await this.delay(10)}}finally{this.isAutoRunning=!1,e.disabled=!1,this.updateNextButton()}}delay(t){return new Promise(e=>setTimeout(e,t))}resetFitnessWeights(){this.config.fitnessWeights={...na};const t=this.config.fitnessWeights;this.updateFitnessSlider("pellet-weight",t.pelletWeight,0),this.updateFitnessSlider("proximity-weight",t.proximityWeight,1),this.updateFitnessSlider("proximity-dist",t.proximityMaxDistance,0),this.updateFitnessSlider("movement-weight",t.movementWeight,1),this.updateFitnessSlider("movement-cap",t.movementCap,0),this.updateFitnessSlider("distance-weight",t.distanceWeight,1),this.updateFitnessSlider("distance-cap",t.distanceCap,0),this.updateFitnessSlider("base-fitness",t.baseFitness,0),this.saveFitnessWeights()}updateFitnessSlider(t,e,n){const s=document.getElementById(`${t}-slider`),o=document.getElementById(`${t}-value`);s&&(s.value=e.toString()),o&&(o.textContent=n>0?e.toFixed(n):e.toString())}reset(){this.replayRenderer&&(this.replayRenderer.dispose(),this.replayRenderer=null),this.generation=0,this.fitnessHistory=[],this.simulationResults=[],this.population=null,this.evolutionStep="idle",this.creatureCards=[],this.bestCreatureEver=null,this.bestCreatureGeneration=0,this.longestSurvivingCreature=null,this.longestSurvivingGenerations=0,this.gridContainer&&(this.gridContainer.innerHTML=""),this.graphPanel&&this.graphPanel.hide(),this.showMenu()}}new AC;
