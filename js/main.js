/* Gather & Celebrate | menu filter, estimate calculator, chat helpers */
(function(){
  /* mobile nav */
  var tgl=document.querySelector('.menu-toggle'), links=document.getElementById('navlinks');
  tgl.addEventListener('click',function(){var o=links.classList.toggle('open');tgl.setAttribute('aria-expanded',o)});
  links.addEventListener('click',function(e){if(e.target.tagName==='A'){links.classList.remove('open');tgl.setAttribute('aria-expanded','false')}});

  /* toast */
  var toastEl=document.getElementById('toast'),tt;
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){toastEl.classList.remove('show')},3200)}

  /* open the Botpress chat */
  function openGuide(){
    if(window.botpress && typeof window.botpress.open==='function'){window.botpress.open()}
    else{toast('The chat is still loading. Try the bubble in the bottom corner in a moment.')}
  }
  document.querySelectorAll('[data-open-guide]').forEach(function(b){b.addEventListener('click',openGuide)});

  function copyText(t,done){
    if(navigator.clipboard && window.isSecureContext){navigator.clipboard.writeText(t).then(done,function(){fallback(t);done()})}
    else{fallback(t);done()}
  }
  function fallback(t){var a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(a)}

  document.querySelectorAll('.chip').forEach(function(c){
    c.addEventListener('click',function(){copyText(c.textContent.trim(),function(){toast('Question copied. Paste it into the chat.');openGuide()})});
  });

  /* menu filter */
  var filters=document.querySelectorAll('.filter'), dishes=document.querySelectorAll('.dish');
  filters.forEach(function(f){
    f.addEventListener('click',function(){
      filters.forEach(function(x){x.setAttribute('aria-pressed','false')});
      f.setAttribute('aria-pressed','true');
      var k=f.dataset.filter;
      dishes.forEach(function(d){d.hidden=!(k==='all'||(' '+d.dataset.tags+' ').indexOf(' '+k+' ')>-1)});
    });
  });

  /* estimator: same rules as the GatherGuide knowledge base */
  var PK={
    PK01:{name:'Office Lunch Drop-off',rate:24,min:20,max:100,notice:3,setup:false},
    PK02:{name:'Celebration Buffet',rate:38,min:30,max:150,notice:7,setup:true},
    PK03:{name:'Signature Reception',rate:65,min:50,max:200,notice:21,setup:true},
    PK04:{name:'Breakfast Gathering',rate:20,min:20,max:100,notice:3,setup:false}
  };
  var ZONE={'Farmers Branch':35,'Addison':45,'Carrollton':45,'Dallas':65,'Other':null};
  var $=function(id){return document.getElementById(id)};
  var money=function(n){return '$'+n.toLocaleString('en-US',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2})};
  var state={};

  function calc(){
    var p=PK[$('pkg').value], g=parseFloat($('guests').value), city=$('city').value;
    var lines=[], warns=[], total=0, blocked=false;
    var setupBox=$('a_setup');
    if(p.setup){setupBox.checked=false;setupBox.disabled=true;$('setupLabel').textContent='Buffet setup (already included)';$('setupWrap').classList.add('disabled')}
    else{setupBox.disabled=false;$('setupLabel').textContent='Buffet setup ($100)';$('setupWrap').classList.remove('disabled')}

    if(!(g>0) || Math.floor(g)!==g){warns.push(['stop','Enter a whole number of guests.']);blocked=true}
    else if(g<p.min){warns.push(['stop','This package starts at '+p.min+' guests. Ask GatherGuide about billing at the minimum or a custom option.']);blocked=true}
    else if(g>p.max){warns.push(['stop','This package covers up to '+p.max+' guests. Larger groups need a custom review.']);blocked=true}

    if(!blocked){
      lines.push([p.name+' ('+g+' × $'+p.rate+')',g*p.rate]);
      if($('a_drinks').checked) lines.push(['Lemonade and iced tea ('+g+' × $3)',g*3]);
      if($('a_brownies').checked) lines.push(['Brownie Bites ('+g+' × $4)',g*4]);
      if($('a_grazing').checked) lines.push(['Grazing & Appetizer Board ('+g+' × $8)',g*8]);
      if(!p.setup && setupBox.checked) lines.push(['Buffet setup',100]);
      if($('a_styling').checked) lines.push(['Basic table styling',150]);
      var att=Math.max(0,parseInt($('att').value)||0), ah=Math.max(0,parseInt($('attHrs').value)||0);
      if(att>0){var bh=Math.max(ah,4);lines.push(['Attendants ('+att+' × '+bh+' hrs × $35)',att*bh*35]);if(ah<4)warns.push(['','Attendants bill a 4-hour minimum, so '+ah+' hours is charged as 4.']);warns.push(['','Staff numbers need approval from our planner.'])}
      var ch=Math.max(0,parseInt($('coord').value)||0);
      if(ch>0){var cb=Math.max(ch,4);lines.push(['Event coordinator ('+cb+' hrs × $75)',cb*75]);if(ch<4)warns.push(['','The coordinator bills a 4-hour minimum.'])}
      if(ZONE[city]!=null){lines.push(['Delivery to '+city,ZONE[city]])}
      else{warns.push(['','Delivery outside our listed cities needs a custom quote, so it isn’t included here.'])}
      lines.forEach(function(l){total+=l[1]});
    }
    var d=$('date').value;
    if(d){
      var today=new Date();today.setHours(0,0,0,0);
      var ev=new Date(d+'T00:00:00');var days=Math.round((ev-today)/86400000);
      if(days<0) warns.push(['stop','That date has passed. Choose a future date.']);
      else if(days<p.notice) warns.push(['','This is shorter than the '+p.notice+'-day notice for this package. Our team would need to review it.']);
    }
    $('estSub').textContent=p.name+', '+(g>0?g:0)+' guests'+(d?', '+d:'');
    $('lines').innerHTML=lines.map(function(l){return '<li><span>'+l[0]+'</span><span>'+money(l[1])+'</span></li>'}).join('');
    $('total').textContent=blocked?'Needs review':money(total);
    $('warns').innerHTML=warns.map(function(w){return '<div class="warn '+w[0]+'">'+w[1]+'</div>'}).join('');
    state={p:p,g:g,city:city,lines:lines,total:total,blocked:blocked,warns:warns,date:d};
  }
  document.querySelectorAll('#estForm input,#estForm select').forEach(function(el){el.addEventListener('input',calc);el.addEventListener('change',calc)});

  document.querySelectorAll('[data-estimate]').forEach(function(b){
    b.addEventListener('click',function(){$('pkg').value=b.dataset.estimate;var p=PK[b.dataset.estimate];var g=parseInt($('guests').value)||0;if(g<p.min||g>p.max)$('guests').value=p.min;calc();document.getElementById('estimate').scrollIntoView()});
  });

  function briefText(){
    var s=state, t=[];
    t.push('Event brief for Gather & Celebrate');
    t.push('Occasion: '+$('occasion').value);
    t.push('Date: '+(s.date||'not chosen yet'));
    t.push('Guests: '+s.g);
    t.push('Package: '+s.p.name);
    t.push('Delivery city: '+(s.city==='Other'?'another city (custom quote)':s.city));
    if(!s.blocked){t.push('Estimate lines:');s.lines.forEach(function(l){t.push('- '+l[0]+': '+money(l[1]))});t.push('Subtotal before tax: '+money(s.total))}
    else{t.push('Estimate: needs custom review')}
    if(s.warns.length){t.push('Open questions:');s.warns.forEach(function(w){t.push('- '+w[1])})}
    t.push('Status: estimate only, not booked');
    return t.join('\n');
  }
  $('copyBrief').addEventListener('click',function(){copyText(briefText(),function(){toast('Event brief copied.')})});
  $('emailBrief').addEventListener('click',function(){
    this.href='mailto:dhivyav@usf.edu?subject='+encodeURIComponent('Gather & Celebrate event inquiry: '+$('occasion').value)+'&body='+encodeURIComponent(briefText());
  });

  /* floating GatherGuide concierge: bobs, wiggles, can be dragged, and changes its tip by section */
  var cg=$('concierge'), cgBtn=$('conciergeBtn'), cgTip=$('conciergeTip');
  if(cg){
    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tips={top:'Planning an event? Ask me anything.',events:'Tell me your occasion and I’ll suggest a package.',packages:'Not sure which package fits? Ask me.',menu:'Ask me which dishes are vegan or vegetarian.',extras:'Want a coordinator or a grazing board? I can price it.',estimate:'I can double-check this estimate for you.',how:'Ready to book? I’ll help you write your event brief.',gallery:'Ask me how to style your table.',faq:'Have a question that isn’t here? Ask me.'};
    var current='top';
    function wiggle(){if(reduce)return;cg.classList.remove('wiggle');void cg.offsetWidth;cg.classList.add('wiggle')}
    function setTip(k){if(!tips[k]||k===current)return;current=k;cgTip.style.opacity=0;setTimeout(function(){cgTip.textContent=tips[k];cgTip.style.opacity=1;wiggle()},250)}
    setInterval(wiggle,9000);
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)setTip(e.target.id)})},{rootMargin:'-45% 0px -45% 0px'});
      ['top','events','packages','menu','extras','estimate','how','gallery','faq'].forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el)});
    }
    var drag=null, moved=false;
    cgBtn.addEventListener('pointerdown',function(e){var r=cg.getBoundingClientRect();drag={dx:e.clientX-r.left,dy:e.clientY-r.top,sx:e.clientX,sy:e.clientY};moved=false;try{cgBtn.setPointerCapture(e.pointerId)}catch(err){}});
    cgBtn.addEventListener('pointermove',function(e){
      if(!drag)return;
      if(!moved&&Math.abs(e.clientX-drag.sx)+Math.abs(e.clientY-drag.sy)<6)return;
      moved=true;cg.classList.add('dragged');
      var w=cg.offsetWidth,h=cg.offsetHeight;
      cg.style.left=Math.min(Math.max(8,e.clientX-drag.dx),window.innerWidth-w-8)+'px';
      cg.style.top=Math.min(Math.max(8,e.clientY-drag.dy),window.innerHeight-h-8)+'px';
      cg.style.right='auto';cg.style.bottom='auto';
    });
    cgBtn.addEventListener('pointerup',function(){var was=moved;drag=null;if(!was)openGuide()});
    cgBtn.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openGuide()}});
    $('conciergeClose').addEventListener('click',function(){cg.classList.add('hidden')});
    function hook(){try{if(window.botpress&&window.botpress.on&&!hook.done){hook.done=true;window.botpress.on('webchat:opened',function(){cg.classList.add('hidden')});window.botpress.on('webchat:closed',function(){cg.classList.remove('hidden')})}}catch(err){}}
    hook();window.addEventListener('load',hook);
  }

  calc();
})();
