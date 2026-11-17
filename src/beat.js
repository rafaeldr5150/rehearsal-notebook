/* Detecção de andamento e de batida a partir do som (pelo microfone).
   Entrada: "fluxo de início de notas" (quanto o som subiu a cada instante), em fs amostras por segundo.
   Saída: BPM (precisão de 0,1) e fase (onde cai uma batida). Puro cálculo, sem acesso a áudio. */
(function(root){
'use strict';
function interp(a,x){var i=Math.floor(x);if(i<0||i>=a.length-1)return 0;var f=x-i;return a[i]*(1-f)+a[i+1]*f}
function normalize(flux,fs){
  var n=flux.length,env=new Float32Array(n),cs=new Float64Array(n+1),i;
  for(i=0;i<n;i++)cs[i+1]=cs[i]+flux[i];
  var h=Math.max(2,Math.round(0.25*fs));
  for(i=0;i<n;i++){var a=Math.max(0,i-h),b=Math.min(n,i+h+1),m=(cs[b]-cs[a])/(b-a),v=flux[i]-m;env[i]=v>0?v:0}
  var sm=new Float32Array(n);
  for(i=0;i<n;i++){var s=env[i]*2+(i>0?env[i-1]:0)+(i<n-1?env[i+1]:0);sm[i]=s/4}
  var ss=0;for(i=0;i<n;i++)ss+=sm[i]*sm[i];
  var rms=Math.sqrt(ss/n);
  return {env:sm,rms:rms};
}
function combScore(env,Tn,p){
  var s=0,c=0,m=0,h=Tn/2;
  for(var x=p;x<env.length-1;x+=Tn){s+=interp(env,x);m+=interp(env,x+h);c++}
  return c?(s-0.6*m)/c:0;
}
function bestPhase(env,Tn,step){
  var best=-1e9,bp=0,sum=0,cnt=0;
  for(var p=0;p<Tn;p+=step){var s=combScore(env,Tn,p);sum+=s;cnt++;if(s>best){best=s;bp=p}}
  return {score:best,phase:bp,mean:cnt?sum/cnt:0};
}
/* opções: prior (BPM conhecido, ajuda a escolher a oitava e acelera), lo/hi (faixa), minRms */
function estimate(flux,fs,o){
  o=o||{};
  if(!flux||flux.length<fs*4)return {conf:0};
  var nz=normalize(flux,fs),env=nz.env;
  if(nz.rms<(o.minRms||1e-5))return {conf:0};
  for(var i=0;i<env.length;i++)env[i]/=nz.rms;
  var lo=o.lo||65,hi=o.hi||190,stepB=o.step||0.1,pstep=Math.max(1,fs*0.004);
  /* 1) varredura grossa (inclui a metade e o dobro da faixa, para combinar harmônicos) */
  var cs0=Math.max(30,lo/2),cs1=Math.min(380,hi*2),coarse=[],b0,byB={};
  for(b0=cs0;b0<=cs1;b0+=0.5){
    var Tn0=fs*60/b0,r0=bestPhase(env,Tn0,pstep*2);coarse.push([b0,r0.score]);byB[b0]=r0.score;
  }
  var raws=coarse.filter(function(c){return c[0]>=lo&&c[0]<=hi}).map(function(c){return c[1]});
  var mu=0,sd=0;raws.forEach(function(v){mu+=v});mu/=raws.length;raws.forEach(function(v){sd+=(v-mu)*(v-mu)});sd=Math.sqrt(sd/raws.length)||1e-9;
  function at(bp){var k=Math.round(bp*2)/2;return byB[k]!=null?byB[k]:0}
  var cands=[];
  function range(a,c,wt){for(var x=a;x<=c+1e-9;x+=stepB)cands.push([x,wt])}
  if(o.prior){var P=o.prior;range(P*0.94,P*1.06,1)}
  else{
    /* salience: soma do mesmo andamento, do dobro e da metade; peso de preferência por andamentos entre 80 e 160 */
    var sal=[];
    coarse.forEach(function(c){
      var bp=c[0];if(bp<lo||bp>hi)return;
      var w=Math.exp(-0.5*Math.pow(Math.log(bp/110)/Math.LN2/0.7,2)),s2=at(bp*2),s3=at(bp/2);
      sal.push([bp,(Math.max(0,c[1])+0.5*Math.max(0,s2,s3))*w]);
    });
    sal.sort(function(a,c){return c[1]-a[1]});
    var seen=[];
    sal.forEach(function(c){if(seen.length<2&&seen.every(function(s){return Math.abs(s-c[0])>4}))seen.push(c[0])});
    seen.forEach(function(c){range(c-0.7,c+0.7,1)});
  }
  var best=null;
  cands.forEach(function(c){
    if(c[0]<40||c[0]>260)return;
    var Tn=fs*60/c[0],r=bestPhase(env,Tn,pstep),sc=r.score*c[1];
    if(!best||sc>best.sc)best={sc:sc,bpm:c[0],phase:r.phase,raw:r.score,Tn:Tn};
  });
  if(!best)return {conf:0};
  var z=(best.raw-mu)/sd;
  var conf=Math.max(0,Math.min(1,(z-3.5)/6));
  return {bpm:Math.round(best.bpm*10)/10,phase:best.phase/fs,conf:conf,z:z};
}
/* Acompanhamento: mantém o período T e uma batida de referência tb (tempo do relógio de áudio) */
function track(st,est,t0,now,o){
  o=o||{};st=st||{on:false};
  if(!est||!est.bpm||est.conf<(o.minConf||0.5))return st;
  var T=60/est.bpm,k=Math.ceil((now-T-(t0+est.phase))/T),tbEst=t0+est.phase+k*T;
  if(!st.on)return {on:true,T:T,tb:tbEst,strikes:0,conf:est.conf,cand:0,cn:0};
  var n=Object.assign({},st),dT=Math.abs(T-st.T)/st.T;
  /* leituras na metade ou no dobro do andamento já travado são só a mesma música contada de outro jeito: ignora */
  var ratio=T/st.T;
  if(Math.abs(ratio-2)<0.12||Math.abs(ratio-0.5)<0.06){n.conf=est.conf;return n}
  n.conf=est.conf;
  if(dT<0.08){
    var e=(tbEst-st.tb)/st.T;e=e-Math.round(e);var err=e*st.T;n.cand=0;n.cn=0;
    if(Math.abs(err)<0.09||est.conf>0.75){n.tb=st.tb+0.4*err;n.T=st.T+0.6*(T-st.T);n.strikes=0}
    else{n.strikes=(st.strikes||0)+1;if(n.strikes>=2){n.tb=tbEst;n.T=st.T+0.3*(T-st.T);n.strikes=0}}
  }else{
    /* salto de andamento (mais de 8%): só aceita depois de 3 leituras seguidas que concordam */
    if(st.cand&&Math.abs(est.bpm-st.cand)/st.cand<0.03){n.cn=(st.cn||0)+1;n.cand=est.bpm}else{n.cand=est.bpm;n.cn=1}
    if(n.cn>=3&&est.conf>0.6){n.T=T;n.tb=tbEst;n.cand=0;n.cn=0;n.strikes=0}
  }
  return n;
}
var api={estimate:estimate,track:track,normalize:normalize};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CE_BEAT=api;
})(typeof window!=='undefined'?window:this);
